// Vercel serverless function. Deployed automatically at /api/analyze-food.
// Keeps the real API key on the server — it is never sent to the browser.
// Prefer DeepSeek if DEEPSEEK_API_KEY is configured; otherwise fall back to
// Anthropic for backward compatibility.

function stripCodeFence(text) {
  return String(text || "").replace(/```json|```/g, "").trim();
}

function extractTextFromDeepSeek(responseJson) {
  const choice = responseJson?.choices?.[0];
  const content = choice?.message?.content;

  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("");
  }

  return typeof content === "string" ? content : "";
}

function extractTextFromAnthropic(responseJson) {
  const blocks = Array.isArray(responseJson?.content) ? responseJson.content : [];
  return blocks.map((block) => block?.text || "").join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { base64, mediaType, prompt } = req.body || {};
  if (!base64 || !prompt) {
    res.status(400).json({ error: "请求缺少图片数据或提示词。" });
    return;
  }

  const imageMime = mediaType || "image/jpeg";
  const imageDataUrl = `data:${imageMime};base64,${base64}`;

  try {
    const deepSeekKey = process.env.DEEPSEEK_API_KEY;
    if (deepSeekKey) {
      const deepSeekModel = process.env.DEEPSEEK_MODEL || "deepseek-vl2";
      const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1/chat/completions";

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepSeekKey}`,
        },
        body: JSON.stringify({
          model: deepSeekModel,
          temperature: 0.2,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        res.status(response.status).json({ error: `DeepSeek API 调用失败：${errText}` });
        return;
      }

      const data = await response.json();
      const rawText = extractTextFromDeepSeek(data);
      const clean = stripCodeFence(rawText);

      try {
        const parsed = JSON.parse(clean);
        res.status(200).json(parsed);
        return;
      } catch (e) {
        res.status(502).json({ error: "AI 返回内容无法解析为 JSON。", raw: rawText });
        return;
      }
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      res.status(500).json({
        error: "服务端未配置 DEEPSEEK_API_KEY 或 ANTHROPIC_API_KEY，请在 Vercel 项目的 Environment Variables 中添加后重新部署。",
      });
      return;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: imageMime, data: base64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: `Anthropic API 调用失败：${errText}` });
      return;
    }

    const data = await response.json();
    const rawText = extractTextFromAnthropic(data);
    const clean = stripCodeFence(rawText);

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      res.status(502).json({ error: "AI 返回内容无法解析为 JSON。", raw: rawText });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || "服务器内部错误。" });
  }
}

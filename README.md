# 萌宠时光

宠物饮食健康记录 App：拍照识别食物热量与营养、多宠物管理、体重趋势、健康报告。

## 在 VS Code 中打开

1. 解压这个压缩包到你想放代码的位置
2. VS Code 里 `文件 → 打开文件夹`，选中解压出来的 `meng-chong-shi-guang` 文件夹
3. 打开 VS Code 自带的终端（菜单栏 终端 → 新建终端），依次执行：
   ```bash
   npm install
   npm run dev
   ```
4. 终端会打印一个 `http://localhost:5173` 之类的地址，按住 Ctrl/Cmd 点击即可在浏览器打开
5. 项目里带了 `.vscode/extensions.json`，打开项目时 VS Code 右下角一般会提示"是否安装推荐插件"，装上体验更好（ESLint、Prettier、Tailwind CSS 智能提示等）

> 本地用 `npm run dev` 时，拍照识别功能会因为找不到 `/api` 接口而报错，这是正常的——本地默认只跑前端。如果想连拍照识别一起在本地测试，参考下面"本地开发"里 `vercel dev` 的部分。

## 部署到 Vercel

1. **拿一个 Anthropic API Key**
   去 https://console.anthropic.com 创建一个 API Key（不是 claude.ai 账号密码，是开发者平台的 Key）。
   注意：这会产生真实的按量计费，请自行关注用量和费用。

2. **把这个项目推到 GitHub**
   ```bash
   cd meng-chong-shi-guang
   git init
   git add .
   git commit -m "init"
   # 在 GitHub 建一个新仓库后：
   git remote add origin <你的仓库地址>
   git push -u origin main
   ```

3. **在 Vercel 导入这个仓库**
   - 打开 https://vercel.com/new，选择刚才的 GitHub 仓库
   - Framework Preset 会自动识别为 Vite，不用改
   - 在 "Environment Variables" 里添加一条：
     - Key: `ANTHROPIC_API_KEY`
     - Value: 你刚才申请的 API Key
   - 点 Deploy

4. **部署完成后**
   Vercel 会给你一个 `https://xxx.vercel.app` 的链接，把这个链接发给朋友测试即可，不需要他们有 Claude 账号。

## 本地开发

```bash
npm install
npm run dev          # 只启动前端，此时拍照识别会因为没有 /api 而失败，其余功能正常
```

如果想在本地也测试拍照识别（调用 /api/analyze-food），需要用 Vercel CLI：

```bash
npm install -g vercel
cp .env.example .env.local   # 填入你的真实 ANTHROPIC_API_KEY
vercel dev
```

## 关于数据存储

这个版本用浏览器的 localStorage 保存宠物档案和饮食记录（见 `src/storage.js`），也就是说：

- 数据是**按每个人的浏览器/设备**存的，不会和别人混在一起，符合"每个朋友测试自己的宠物"的场景
- 同一个人换浏览器、换设备，或清了浏览器数据，之前记录的内容会丢失
- 如果之后想做到"换设备也能看到自己的记录"，需要接一个真正的后端数据库（比如 Vercel Postgres / Supabase），到时候只需要改 `src/storage.js` 这一个文件，`src/App.jsx` 不用动

## 关于 AI 拍照识别

`src/App.jsx` 里的拍照识别功能调用的是你自己项目下的 `/api/analyze-food`（`api/analyze-food.js`），
这个接口在服务器端用你设置的 `ANTHROPIC_API_KEY` 去调用 Anthropic 官方接口，
**真实的 Key 不会出现在浏览器里**，这样才能安全地公开发布给朋友使用。

默认用的模型是 `claude-sonnet-5`，如果想换成更便宜/更快的模型，改 `api/analyze-food.js` 里的 `model` 字段即可，
可选值请参考 Anthropic 官方文档中当前可用的模型列表。

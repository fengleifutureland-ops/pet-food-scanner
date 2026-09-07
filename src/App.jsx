import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  PawPrint,
  Camera,
  Home,
  BarChart3,
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
  Dog,
  Cat,
  Rabbit,
  Bird,
  Squirrel,
  Flame,
  Egg,
  Wheat,
  Droplet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Download,
  RotateCcw,
  Copy,
  Check,
  Users,
  Scale,
  Settings2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";

// ---------- Design tokens ----------
const C = {
  bg: "#2E1E1C",
  paper: "#FFFFFF",
  cream: "#FBEEE3",
  border: "#EBD2C4",
  ink: "#3D2B25",
  inkSoft: "#7A6055",
  inkFaint: "#C7AEA2",
  forest: "#B5652F",
  forestDark: "#943F47",
  forestGrad1: "#DD7E75",
  amber: "#E89A3D",
  amberSoft: "#FCE7C6",
  coral: "#DE6259",
  danger: "#BF4F47",
  dangerSoft: "#F7D6D1",
  caution: "#C17F28",
  cautionSoft: "#F8E5C2",
  safe: "#6F9459",
  safeSoft: "#E3EDDB",
  chipBlue: "#8C5D8B",
  chipBlueSoft: "#EEDEED",
};
const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Inter', sans-serif";

// ---------- helpers ----------
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function todayStr() {
  return isoDate(new Date());
}
function shiftDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return isoDate(d);
}
function dayLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
function friendlyDate(iso) {
  if (iso === todayStr()) return "今天";
  if (iso === shiftDate(1)) return "昨天";
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAY[d.getDay()]}`;
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const SPECIES_META = {
  dog: { label: "狗狗", Icon: Dog, supportsGoal: true },
  cat: { label: "猫咪", Icon: Cat, supportsGoal: true },
  rabbit: { label: "兔子", Icon: Rabbit, supportsGoal: false },
  bird: { label: "鸟类", Icon: Bird, supportsGoal: false },
  small_pet: { label: "仓鼠/龙猫等", Icon: Squirrel, supportsGoal: false },
  other: { label: "其他宠物", Icon: PawPrint, supportsGoal: false },
};
function speciesMeta(species) {
  return SPECIES_META[species] || SPECIES_META.other;
}

const ACTIVITY_FACTORS = {
  low: { label: "偏低活动 · 老年/减重期", factor: 1.2 },
  normal: { label: "正常活动 · 健康成年", factor: 1.6 },
  high: { label: "高活动 · 幼年/工作犬", factor: 2.4 },
};

function getCurrentWeight(pet) {
  if (!pet) return 0;
  const wIns = pet.weighIns || [];
  if (wIns.length === 0) return Number(pet.weight) || 0;
  const sorted = [...wIns].sort((a, b) => (a.date < b.date ? -1 : 1));
  return Number(sorted[sorted.length - 1].weight) || 0;
}
function goalSupported(pet) {
  return !!pet && speciesMeta(pet.species).supportsGoal;
}
function calcDailyGoal(pet) {
  if (!goalSupported(pet)) return 0;
  const w = getCurrentWeight(pet);
  if (!w) return 0;
  const rer = 70 * Math.pow(w, 0.75);
  const factor = ACTIVITY_FACTORS[pet.activity]?.factor || 1.6;
  return Math.round(rer * factor);
}

const DANGER_META = {
  safe: { label: "对宠物友好", color: C.safe, bg: C.safeSoft, Icon: CheckCircle2 },
  caution: { label: "适量注意", color: C.caution, bg: C.cautionSoft, Icon: AlertTriangle },
  danger: { label: "对宠物有害", color: C.danger, bg: C.dangerSoft, Icon: ShieldAlert },
};

const TOXIC_FOODS = [
  { name: "巧克力 / 可可", note: "含可可碱，可致心律失常、抽搐，严重可致命" },
  { name: "葡萄 / 葡萄干", note: "少量即可引发急性肾衰竭，机制尚不明确" },
  { name: "洋葱 / 大蒜 / 韭菜", note: "破坏红细胞，可致溶血性贫血" },
  { name: "木糖醇", note: "常见于无糖口香糖，可致低血糖、肝衰竭" },
  { name: "牛油果", note: "含persin，可致呕吐腹泻，鸟类/兔子更危险" },
  { name: "夏威夷果等坚果", note: "可致无力、呕吐、体温升高" },
  { name: "酒精 / 生面团", note: "生面团在胃中发酵产生酒精和气体，十分危险" },
  { name: "咖啡因", note: "咖啡、茶、能量饮料，可致心跳过速、震颤" },
  { name: "煮熟的骨头", note: "易碎裂，可能划伤或堵塞消化道" },
  { name: "高盐/高脂人类食物", note: "加重肾脏负担，可能诱发胰腺炎" },
];

const ARTICLE_LIBRARY = [
  {
    id: "article-1",
    title: "幼犬/幼猫怎么吃才更稳？",
    tag: "营养基础",
    intro: "从胃口、主食比例到每周体重变化，掌握 3 个关键点，能让营养更稳定。",
    body: "少量少量喂养更稳妥：新宠先用 1-2 周观察胃口和便便，再逐步调整主食比例。热量不宜突增，建议按体重与活动量估算目标，再用体重曲线校准。每日记录很重要，体重波动是最可靠的反馈信号。",
  },
  {
    id: "article-2",
    title: "碗中食物拍照识别的 4 个小技巧",
    tag: "AI 识别",
    intro: "尽量让碗处于图片中心，背景保持单一，识别率会明显提升。",
    body: "拍摄时尽量让碗与背景对比明显；避免将桌布、手、玩具和其他食物混进同一视角。用自然光并避免逆光，保持镜头垂直俯拍效果最好。若是混食，可以先把拍摄区域裁到中心，再让 AI 聚焦食物主体。",
  },
];

const FOOD_LIBRARY = [
  { name: "鸡肉泥", kcal: 120, protein: 21, fat: 3, carb: 1, note: "高蛋白、低脂，适合换粮或补充餐" },
  { name: "牛肉颗粒", kcal: 180, protein: 22, fat: 8, carb: 0, note: "适量可作高蛋白加餐" },
  { name: "白饭", kcal: 130, protein: 2, fat: 0.3, carb: 28, note: "适合少量搭配，别当主食过量" },
  { name: "鸡蛋", kcal: 155, protein: 13, fat: 11, carb: 1, note: "优质蛋白，适量可作为零食或辅食" },
  { name: "南瓜泥", kcal: 40, protein: 1, fat: 0.1, carb: 9, note: "易消化，适合补水和增加饱腹感" },
  { name: "无糖酸奶", kcal: 60, protein: 4, fat: 1, carb: 3, note: "选择无糖无添加剂更安全" },
];

const COMMON_BOWL_FOODS = [
  { name: "鸡肉饭", keywords: ["鸡肉", "鸡", "饭", "米饭"], kcal: 180 },
  { name: "牛肉饭", keywords: ["牛肉", "牛", "饭", "米饭"], kcal: 200 },
  { name: "海鲜饭", keywords: ["海鲜", "虾", "蟹", "鱼", "饭"], kcal: 170 },
  { name: "鸡蛋面", keywords: ["鸡蛋", "面", "面条", " noodles"], kcal: 220 },
  { name: "南瓜泥", keywords: ["南瓜", "pumpkin"], kcal: 40 },
  { name: "鸡肉泥", keywords: ["鸡肉泥", "肉泥", "鸡肉"], kcal: 120 },
  { name: "狗粮", keywords: ["狗粮", "宠物粮", "dry food", "kibble"], kcal: 330 },
  { name: "猫粮", keywords: ["猫粮", "cat food", "dry food"], kcal: 320 },
  { name: "酸奶", keywords: ["酸奶", "yogurt", " yogurt "], kcal: 60 },
  { name: "泡软粮", keywords: ["湿粮", "泡软", "wet food", "罐头"], kcal: 140 },
];

function guessCommonBowlFood(text) {
  const normalized = (text || "").toLowerCase();
  let best = null;
  for (const item of COMMON_BOWL_FOODS) {
    const matches = item.keywords.filter((word) => normalized.includes(word.toLowerCase())).length;
    if (matches > 0) {
      const score = matches * 10 + (normalized.includes(item.name.toLowerCase()) ? 5 : 0);
      if (!best || score > best.score) best = { ...item, score };
    }
  }
  return best ? { name: best.name, calories_per_100g: best.kcal, protein_per_100g: 12, fat_per_100g: 6, carb_per_100g: 15, suggested_portion_g: 90, danger_level: "safe", species_warning: "", tip: "若是混合餐，建议按主食/主蛋白分开计量。" } : null;
}

function makeThumbnail(dataUrl, size = 140) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.62));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch (e) {
      resolve(null);
    }
  });
}

// ---------- style atoms ----------
function primaryBtnStyle(extra = {}) {
  return {
    background: `linear-gradient(135deg, ${C.forestGrad1}, ${C.forestDark})`,
    color: "#FBF7EE",
    border: "none",
    borderRadius: 12,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: FONT_BODY,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(182,90,95,0.30)",
    ...extra,
  };
}
function secondaryBtnStyle(extra = {}) {
  return {
    background: "#fff",
    color: C.forestDark,
    border: `1.5px solid ${C.forestDark}`,
    borderRadius: 12,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: FONT_BODY,
    cursor: "pointer",
    ...extra,
  };
}
function dangerBtnStyle(extra = {}) {
  return {
    background: "#fff",
    color: C.danger,
    border: `1.5px solid ${C.dangerSoft}`,
    borderRadius: 12,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: FONT_BODY,
    cursor: "pointer",
    ...extra,
  };
}
function inputStyle() {
  return {
    width: "100%",
    boxSizing: "border-box",
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: FONT_BODY,
    color: C.ink,
    background: "#fff",
    outline: "none",
  };
}
function cardStyle(extra = {}) {
  return {
    background: C.paper,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    boxShadow: "0 6px 20px rgba(182,90,95,0.08)",
    ...extra,
  };
}
function PawBullet() {
  return (
    <span
      style={{
        display: "inline-flex",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: C.amber,
        marginRight: 8,
        marginTop: 6,
        flexShrink: 0,
      }}
    />
  );
}
function EmptyState({ title, body, cta, onCta }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px", color: C.inkSoft }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: C.safeSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
        }}
      >
        <PawPrint size={26} color={C.forest} />
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: C.ink, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 18 }}>{body}</div>
      {cta && (
        <button onClick={onCta} style={primaryBtnStyle()}>
          {cta}
        </button>
      )}
    </div>
  );
}

// ================= MAIN APP =================
export default function PetHealthApp() {
  const [tab, setTab] = useState("home");
  const [pets, setPets] = useState([]);
  const [activePetId, setActivePetId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [dayOffset, setDayOffset] = useState(0);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanImage, setScanImage] = useState(null);
  const [portion, setPortion] = useState(0);
  const fileInputRef = useRef(null);
  const [isBowl, setIsBowl] = useState(false);
  const [favoriteFoods, setFavoriteFoods] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualGrams, setManualGrams] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  // ---- load & migrate ----
  useEffect(() => {
    (async () => {
      let loadedPets = [];
      try {
        const p = await window.storage.get("pets");
        if (p && p.value) loadedPets = JSON.parse(p.value);
      } catch (e) {
        loadedPets = [];
      }
      // migrate legacy single-pet profile if present and no pets yet
      if (loadedPets.length === 0) {
        try {
          const legacy = await window.storage.get("pet-profile");
          if (legacy && legacy.value) {
            const lp = JSON.parse(legacy.value);
            const newPet = {
              id: uid(),
              name: lp.name || "我的宠物",
              species: lp.species || "dog",
              breed: lp.breed || "",
              activity: lp.activity || "normal",
              createdAt: Date.now(),
              weighIns: lp.weight ? [{ id: uid(), date: todayStr(), weight: Number(lp.weight) }] : [],
            };
            loadedPets = [newPet];
            await window.storage.set("pets", JSON.stringify(loadedPets));
          }
        } catch (e) {
          /* no legacy data */
        }
      }
      setPets(loadedPets);

      let active = null;
      try {
        const a = await window.storage.get("active-pet");
        if (a && a.value) active = JSON.parse(a.value);
      } catch (e) {
        active = null;
      }
      if (!active || !loadedPets.find((p) => p.id === active)) {
        active = loadedPets[0]?.id || null;
      }
      setActivePetId(active);
      if (loadedPets.length === 0) setTab("manage");

      let loadedLogs = [];
      try {
        const l = await window.storage.get("food-logs");
        if (l && l.value) loadedLogs = JSON.parse(l.value);
      } catch (e) {
        loadedLogs = [];
      }
      // backward-compat: attach petId to legacy logs without one
      if (loadedPets.length > 0) {
        loadedLogs = loadedLogs.map((l) => (l.petId ? l : { ...l, petId: loadedPets[0].id }));
      }
      setLogs(loadedLogs);

      let loadedFavorites = [];
      try {
        const fav = await window.storage.get("favorites");
        if (fav && fav.value) loadedFavorites = JSON.parse(fav.value);
      } catch (e) {
        loadedFavorites = [];
      }
      setFavoriteFoods(loadedFavorites);

      let loadedRecent = [];
      try {
        const recent = await window.storage.get("recent-foods");
        if (recent && recent.value) loadedRecent = JSON.parse(recent.value);
      } catch (e) {
        loadedRecent = [];
      }
      setRecentFoods(loadedRecent);
      setLoaded(true);
    })();
  }, []);

  const persistFavorites = async (next) => {
    setFavoriteFoods(next);
    try {
      await window.storage.set("favorites", JSON.stringify(next));
    } catch (e) {
      console.error("保存收藏失败", e);
    }
  };
  const persistRecentFoods = async (next) => {
    setRecentFoods(next);
    try {
      await window.storage.set("recent-foods", JSON.stringify(next));
    } catch (e) {
      console.error("保存最近识别失败", e);
    }
  };
  const toggleFavorite = async (food) => {
    if (!food || !food.name) return;
    const next = favoriteFoods.some((item) => item.name === food.name)
      ? favoriteFoods.filter((item) => item.name !== food.name)
      : [{ id: uid(), name: food.name, calories: food.calories || 0, note: food.note || "" }, ...favoriteFoods].slice(0, 12);
    await persistFavorites(next);
  };
  const recordRecentFood = async (foodName) => {
    if (!foodName) return;
    const next = [{ id: uid(), name: foodName, at: Date.now() }, ...recentFoods.filter((item) => item.name !== foodName)].slice(0, 8);
    await persistRecentFoods(next);
  };

  const persistPets = async (next) => {
    setPets(next);
    try {
      await window.storage.set("pets", JSON.stringify(next));
    } catch (e) {
      console.error("保存宠物失败", e);
    }
  };
  const persistLogs = async (next) => {
    setLogs(next);
    try {
      await window.storage.set("food-logs", JSON.stringify(next));
    } catch (e) {
      console.error("保存记录失败", e);
    }
  };
  const switchActivePet = async (id) => {
    setActivePetId(id);
    setDayOffset(0);
    try {
      await window.storage.set("active-pet", JSON.stringify(id));
    } catch (e) {
      /* ignore */
    }
  };

  const savePet = async (petData, isNew, initialWeight) => {
    if (isNew) {
      const newPet = {
        id: uid(),
        name: petData.name,
        species: petData.species,
        breed: petData.breed || "",
        activity: petData.activity,
        createdAt: Date.now(),
        weighIns: initialWeight ? [{ id: uid(), date: todayStr(), weight: Number(initialWeight) }] : [],
      };
      const next = [...pets, newPet];
      await persistPets(next);
      await switchActivePet(newPet.id);
      showToast(`已添加 ${newPet.name}`);
      return newPet.id;
    } else {
      const next = pets.map((p) => (p.id === petData.id ? { ...p, ...petData } : p));
      await persistPets(next);
      showToast("已保存修改");
      return petData.id;
    }
  };
  const deletePet = async (id) => {
    const next = pets.filter((p) => p.id !== id);
    await persistPets(next);
    const nextLogs = logs.filter((l) => l.petId !== id);
    await persistLogs(nextLogs);
    if (activePetId === id) {
      await switchActivePet(next[0]?.id || null);
    }
    showToast("已删除该宠物档案");
  };
  const addWeighIn = async (petId, weight) => {
    const next = pets.map((p) =>
      p.id === petId
        ? { ...p, weighIns: [...(p.weighIns || []), { id: uid(), date: todayStr(), weight: Number(weight) }] }
        : p
    );
    await persistPets(next);
    showToast("体重已记录");
  };
  const deleteWeighIn = async (petId, weighId) => {
    const next = pets.map((p) =>
      p.id === petId ? { ...p, weighIns: (p.weighIns || []).filter((w) => w.id !== weighId) } : p
    );
    await persistPets(next);
  };

  const activePet = pets.find((p) => p.id === activePetId) || null;
  const dailyGoal = calcDailyGoal(activePet);
  const selectedDate = shiftDate(dayOffset);
  const petLogs = logs.filter((l) => l.petId === activePetId);
  const dayLogs = petLogs.filter((l) => l.date === selectedDate);
  const dayTotal = dayLogs.reduce((s, l) => s + l.totalCalories, 0);
  const dayProtein = dayLogs.reduce((s, l) => s + (l.protein || 0), 0);
  const dayFat = dayLogs.reduce((s, l) => s + (l.fat || 0), 0);
  const dayCarb = dayLogs.reduce((s, l) => s + (l.carb || 0), 0);
  const pct = dailyGoal ? Math.min(1, dayTotal / dailyGoal) : 0;

  const addLog = async (entry) => {
    const next = [{ id: uid(), petId: activePetId, date: selectedDate, timestamp: Date.now(), ...entry }, ...logs];
    await persistLogs(next);
  };
  const removeLog = async (id) => {
    await persistLogs(logs.filter((l) => l.id !== id));
  };
  const editLogGrams = async (id, grams) => {
    const next = logs.map((l) => {
      if (l.id !== id) return l;
      const ratio = grams / 100;
      return {
        ...l,
        grams,
        totalCalories: Math.round((l.caloriesPer100g || 0) * ratio),
        protein: Math.round((l.proteinPer100g || 0) * ratio * 10) / 10,
        fat: Math.round((l.fatPer100g || 0) * ratio * 10) / 10,
        carb: Math.round((l.carbPer100g || 0) * ratio * 10) / 10,
      };
    });
    await persistLogs(next);
  };

  const normalizeImage = (file, maxDim = 1280) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (e) {
          reject(new Error("图片处理失败，请换一张照片试试。"));
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("这张照片的格式暂不支持识别（例如部分 iPhone 拍出的 HEIC 格式），请换成普通 JPG/PNG 照片，或截图后再上传。"));
      };
      img.src = url;
    });

  const preprocessBowl = (dataUrl, cropRatio = 0.75, outDim = 1280) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.width;
          const h = img.height;
          const min = Math.min(w, h);
          const crop = Math.round(min * cropRatio);
          const sx = Math.round((w - crop) / 2);
          const sy = Math.round((h - crop) / 2);
          const canvas = document.createElement("canvas");
          canvas.width = outDim;
          canvas.height = outDim;
          const ctx = canvas.getContext("2d");
          // draw cropped center and resize to outDim
          ctx.drawImage(img, sx, sy, crop, crop, 0, 0, outDim, outDim);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error("图片预处理失败。"));
      img.src = dataUrl;
    });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError("");
    setScanResult(null);
    setScanning(true);

    let dataUrl;
    try {
      dataUrl = await normalizeImage(file);
    } catch (imgErr) {
      setScanError(imgErr.message);
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      // If user indicates this is a bowl photo, crop center to focus bowl
      if (isBowl) {
        try {
          dataUrl = await preprocessBowl(dataUrl, 0.75, 1280);
        } catch (e) {
          console.warn("bowl preprocess failed", e);
        }
      }
      setScanImage(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const speciesLabel = speciesMeta(activePet?.species).label;
      const prompt = `你是宠物营养助手。这张照片里的食物可能是没有拆封的零食/包装食品，也可能是食物本身。${
        isBowl ? "这是碗中的食物，请重点分析中心区域，校准每份估算并尽量估计每份克数。" : ""
      }如果是包装食品，请仔细阅读包装上的文字、品牌、图案来判断具体是什么产品，并据此估算营养信息，不要仅因为看不到食物本体就判定为无法识别。只返回一个 JSON 对象，不要包含任何 markdown 代码块标记或多余文字，严格匹配以下结构：\n{"food_name": "中文食物名称（尽量具体，如品牌+产品名）", "calories_per_100g": 数字, "protein_per_100g": 数字, "fat_per_100g": 数字, "carb_per_100g": 数字, "suggested_portion_g": 数字, "danger_level": "safe" 或 "caution" 或 "danger", "species_warning": "中文说明，如果对狗和猫都安全则为空字符串，否则说明对${speciesLabel}等宠物的风险", "tip": "一句简短的中文喂养建议"}\n只有在照片模糊、拍摄角度问题或完全看不清任何文字和图案、真正无法判断时，才将 food_name 设为 "无法识别"，danger_level 设为 "caution"。请特别留意巧克力、葡萄/葡萄干、洋葱、大蒜、木糖醇、牛油果、坚果（尤其夏威夷果）、酒精、咖啡因、生/熟骨头、高盐高脂人类食物、以及人类零食中常见的调味料和添加剂对宠物的潜在风险。`;

      const apiBase = import.meta.env.VITE_API_BASE || "";
      const response = await fetch(`${apiBase}/api/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType: "image/jpeg", prompt }),
      });
      if (!response.ok) {
        let detail = "";
        try {
          const errJson = await response.json();
          detail = errJson?.error || "";
        } catch (e) {
          /* response body wasn't JSON */
        }
        throw new Error(`识别请求失败（状态码 ${response.status}）${detail ? "：" + detail : ""}`);
      }
      const parsed = await response.json();
      const fallback = guessCommonBowlFood(parsed?.food_name || "") || guessCommonBowlFood(prompt);
      const normalized = {
        ...parsed,
        food_name: parsed?.food_name && parsed.food_name !== "无法识别" ? parsed.food_name : (fallback?.name || parsed?.food_name || "无法识别"),
        calories_per_100g: Number(parsed?.calories_per_100g) || Number(fallback?.calories_per_100g) || 0,
        protein_per_100g: Number(parsed?.protein_per_100g) || Number(fallback?.protein_per_100g) || 0,
        fat_per_100g: Number(parsed?.fat_per_100g) || Number(fallback?.fat_per_100g) || 0,
        carb_per_100g: Number(parsed?.carb_per_100g) || Number(fallback?.carb_per_100g) || 0,
        suggested_portion_g: Number(parsed?.suggested_portion_g) || Number(fallback?.suggested_portion_g) || 50,
        danger_level: parsed?.danger_level || fallback?.danger_level || "caution",
        species_warning: parsed?.species_warning || fallback?.species_warning || "",
        tip: parsed?.tip || fallback?.tip || "如情况不明显，可通过手动补录确认。",
      };
      setScanResult(normalized);
      setPortion(Number(normalized.suggested_portion_g) || 50);
    } catch (err) {
      console.error(err);
      setScanError(err.message && err.message.startsWith("识别请求失败") ? err.message : "识别失败，可以重试，或直接手动添加食物信息。");
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmScanLog = async () => {
    if (!scanResult || !activePetId) return;
    const grams = Number(portion) || 0;
    const ratio = grams / 100;
    const thumb = scanImage ? await makeThumbnail(scanImage) : null;
    await addLog({
      foodName: scanResult.food_name,
      caloriesPer100g: scanResult.calories_per_100g || 0,
      proteinPer100g: scanResult.protein_per_100g || 0,
      fatPer100g: scanResult.fat_per_100g || 0,
      carbPer100g: scanResult.carb_per_100g || 0,
      grams,
      totalCalories: Math.round((scanResult.calories_per_100g || 0) * ratio),
      protein: Math.round((scanResult.protein_per_100g || 0) * ratio * 10) / 10,
      fat: Math.round((scanResult.fat_per_100g || 0) * ratio * 10) / 10,
      carb: Math.round((scanResult.carb_per_100g || 0) * ratio * 10) / 10,
      dangerLevel: scanResult.danger_level,
      speciesWarning: scanResult.species_warning,
      tip: scanResult.tip,
      source: "scan",
      photo: thumb,
    });
    await recordRecentFood(scanResult.food_name);
    setScanResult(null);
    setScanImage(null);
    setPortion(0);
    showToast("已记录到今日饮食");
    setDayOffset(0);
    setTab("home");
  };

  const submitManual = async () => {
    if (!manualName || !manualCal || !manualGrams || !activePetId) {
      showToast("请填写完整信息");
      return;
    }
    const totalCalories = Math.round((Number(manualCal) / 100) * Number(manualGrams));
    await addLog({
      foodName: manualName,
      caloriesPer100g: Number(manualCal),
      proteinPer100g: 0,
      fatPer100g: 0,
      carbPer100g: 0,
      grams: Number(manualGrams),
      totalCalories,
      protein: 0,
      fat: 0,
      carb: 0,
      dangerLevel: "safe",
      speciesWarning: "",
      tip: "",
      source: "manual",
      photo: null,
    });
    setManualName("");
    setManualCal("");
    setManualGrams("");
    setManualOpen(false);
    showToast("已记录到今日饮食");
    setDayOffset(0);
    setTab("home");
  };

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const iso = shiftDate(i);
      const total = petLogs.filter((l) => l.date === iso).reduce((s, l) => s + l.totalCalories, 0);
      days.push({ date: iso, label: dayLabel(iso), kcal: total });
    }
    return days;
  }, [petLogs, activePetId]);
  const weekAvg = Math.round(chartData.reduce((s, d) => s + d.kcal, 0) / 7) || 0;
  const overDays = chartData.filter((d) => dailyGoal && d.kcal > dailyGoal).length;
  const flagged = petLogs.filter((l) => l.dangerLevel && l.dangerLevel !== "safe").slice(0, 6);
  const weekLogs = petLogs.filter((l) => chartData.some((d) => d.date === l.date));
  const safeScore = weekLogs.length
    ? Math.round((weekLogs.filter((l) => l.dangerLevel === "safe" || !l.dangerLevel).length / weekLogs.length) * 100)
    : 100;

  const exportData = () => JSON.stringify({ pets, logs, exportedAt: new Date().toISOString() }, null, 2);
  const resetAllData = async () => {
    await persistPets([]);
    await persistLogs([]);
    setActivePetId(null);
    try {
      await window.storage.delete("active-pet");
    } catch (e) {
      /* ignore */
    }
    try {
      await window.storage.delete("pet-profile");
    } catch (e) {
      /* ignore, may not exist */
    }
    setTab("manage");
    showToast("已清空全部数据");
  };

  if (!loaded) {
    return <div style={{ padding: 40, textAlign: "center", color: C.inkSoft, fontFamily: FONT_BODY }}>加载中…</div>;
  }

  return (
    <div
      style={{
        background: C.cream,
        minHeight: 600,
        fontFamily: FONT_BODY,
        color: C.ink,
        maxWidth: 420,
        margin: "0 auto",
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .pha-spin { animation: spin 1s linear infinite; }
        .pha-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* header */}
      <div style={{ padding: "20px 20px 16px", background: `linear-gradient(160deg, ${C.forestGrad1}, ${C.forestDark})`, color: "#FBF7EE" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: pets.length ? 14 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.16)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {activePet ? React.createElement(speciesMeta(activePet.species).Icon, { size: 20 }) : <PawPrint size={20} />}
            </div>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, lineHeight: 1.1 }}>
                {activePet ? `${activePet.name} 的健康日记` : "萌宠时光"}
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 2 }}>AI 拍照识别热量与营养</div>
            </div>
          </div>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.14)",
              borderRadius: 20, padding: "5px 10px 5px 8px", fontSize: 11.5, fontWeight: 700,
            }}
          >
            <Sparkles size={13} /> AI
          </div>
        </div>

        {pets.length > 0 && (
          <div className="pha-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {pets.map((p) => (
              <button
                key={p.id}
                onClick={() => switchActivePet(p.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, flexShrink: 0, cursor: "pointer",
                  border: "none", borderRadius: 20, padding: "6px 12px 6px 8px",
                  background: p.id === activePetId ? "#FBF7EE" : "rgba(255,255,255,0.14)",
                  color: p.id === activePetId ? C.forestDark : "#FBF7EE",
                }}
              >
                {React.createElement(speciesMeta(p.species).Icon, { size: 13 })}
                <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
              </button>
            ))}
            <button
              onClick={() => setTab("manage")}
              style={{
                display: "flex", alignItems: "center", gap: 4, flexShrink: 0, cursor: "pointer",
                border: "1px dashed rgba(255,255,255,0.5)", borderRadius: 20, padding: "6px 12px",
                background: "transparent", color: "#FBF7EE",
              }}
            >
              <Plus size={13} /> <span style={{ fontSize: 12 }}>宠物</span>
            </button>
          </div>
        )}
      </div>

      {/* content */}
      <div style={{ padding: "16px 18px 110px" }}>
        {tab === "home" && (
          <HomeTab
            pet={activePet}
            dailyGoal={dailyGoal}
            dayTotal={dayTotal}
            dayProtein={dayProtein}
            dayFat={dayFat}
            dayCarb={dayCarb}
            pct={pct}
            dayLogs={dayLogs}
            selectedDate={selectedDate}
            dayOffset={dayOffset}
            setDayOffset={setDayOffset}
            onRemove={removeLog}
            onEditGrams={editLogGrams}
            onGoScan={() => setTab("scan")}
            onGoManage={() => setTab("manage")}
            isBowl={isBowl}
            setIsBowl={setIsBowl}
            favoriteFoods={favoriteFoods}
            recentFoods={recentFoods}
            onToggleFavorite={toggleFavorite}
          />
        )}
        {tab === "scan" && (
          <ScanTab
            pet={activePet}
            scanning={scanning}
            scanError={scanError}
            scanResult={scanResult}
            scanImage={scanImage}
            portion={portion}
            setPortion={setPortion}
            fileInputRef={fileInputRef}
            handleFile={handleFile}
            confirmScanLog={confirmScanLog}
            resetScan={() => {
              setScanResult(null);
              setScanImage(null);
              setScanError("");
            }}
            manualOpen={manualOpen}
            setManualOpen={setManualOpen}
            manualName={manualName}
            setManualName={setManualName}
            manualCal={manualCal}
            setManualCal={setManualCal}
            manualGrams={manualGrams}
            setManualGrams={setManualGrams}
            submitManual={submitManual}
          />
        )}
        {tab === "report" && (
          <ReportTab pet={activePet} chartData={chartData} dailyGoal={dailyGoal} weekAvg={weekAvg} overDays={overDays} flagged={flagged} safeScore={safeScore} />
        )}
        {tab === "manage" && (
          <ManageTab
            pets={pets}
            activePetId={activePetId}
            onSelect={switchActivePet}
            onSave={savePet}
            onDelete={deletePet}
            onAddWeighIn={addWeighIn}
            onDeleteWeighIn={deleteWeighIn}
            exportData={exportData}
            resetAllData={resetAllData}
          />
        )}
      </div>

      {/* bottom nav */}
      <div style={{ position: "sticky", bottom: 0, background: C.paper, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "8px 6px" }}>
        <NavItem active={tab === "home"} onClick={() => setTab("home")} icon={Home} label="首页" />
        <NavItem active={tab === "report"} onClick={() => setTab("report")} icon={BarChart3} label="报告" />
        <div style={{ width: 74, flexShrink: 0, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setTab("scan")}
            disabled={!activePet}
            style={{
              width: 54, height: 54, borderRadius: "50%", border: "none",
              cursor: activePet ? "pointer" : "not-allowed",
              background: `linear-gradient(135deg, ${C.amber}, ${C.coral})`,
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
              boxShadow: "0 8px 18px rgba(240,132,126,0.40)", transform: "translateY(-16px)",
              opacity: activePet ? 1 : 0.5,
            }}
          >
            <Camera size={22} />
          </button>
        </div>
        <NavItem active={tab === "manage"} onClick={() => setTab("manage")} icon={Users} label="宠物" />
      </div>

      {toast && (
        <div
          style={{
            position: "absolute", bottom: 76, left: "50%", transform: "translateX(-50%)",
            background: C.forestDark, color: "#fff", padding: "8px 16px", borderRadius: 20,
            fontSize: 12.5, whiteSpace: "nowrap", boxShadow: "0 6px 16px rgba(0,0,0,0.2)", zIndex: 10,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function NavItem({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0",
        background: "none", border: "none", cursor: "pointer", color: active ? C.forestDark : C.inkFaint,
      }}
    >
      <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
      <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}
function MacroPill({ icon: Icon, value, unit, label, color, bg }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 12, padding: "10px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <Icon size={15} color={color} />
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: C.ink, lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: 10, fontFamily: FONT_BODY, color: C.inkSoft }}> {unit}</span>
      </div>
      <div style={{ fontSize: 9.5, color: C.inkSoft }}>{label}</div>
    </div>
  );
}

// ================= HOME =================
function HomeTab({ pet, dailyGoal, dayTotal, dayProtein, dayFat, dayCarb, pct, dayLogs, selectedDate, dayOffset, setDayOffset, onRemove, onEditGrams, onGoScan, onGoManage, isBowl, setIsBowl, favoriteFoods, recentFoods, onToggleFavorite }) {
  const [editingId, setEditingId] = useState(null);
  const [editGrams, setEditGrams] = useState("");
  const [foodQuery, setFoodQuery] = useState("");
  const visibleFoods = FOOD_LIBRARY.filter((item) => item.name.toLowerCase().includes(foodQuery.toLowerCase()) || item.note.toLowerCase().includes(foodQuery.toLowerCase()));

  if (!pet) {
    return (
      <div style={{ ...cardStyle(), padding: 6 }}>
        <EmptyState title="还没有宠物档案" body="添加一只宠物的信息，我们会帮你算出每日建议摄入热量。" cta="添加宠物" onCta={onGoManage} />
      </div>
    );
  }

  const r = 50;
  const circ = 2 * Math.PI * r;
  const hasGoal = goalSupported(pet) && dailyGoal > 0;
  const dash = hasGoal ? circ * pct : circ;
  const over = hasGoal && dayTotal > dailyGoal;
  const gradId = "ringGrad";
  const isToday = dayOffset === 0;

  return (
    <div>
      {/* date nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setDayOffset(dayOffset + 1)} style={dateNavBtnStyle()}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{friendlyDate(selectedDate)}</div>
        <button onClick={() => setDayOffset(Math.max(0, dayOffset - 1))} disabled={isToday} style={dateNavBtnStyle(isToday)}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ ...cardStyle(), padding: "20px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="112" height="112" viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={over ? C.coral : C.amber} />
                <stop offset="100%" stopColor={over ? C.danger : C.forest} />
              </linearGradient>
            </defs>
            <circle cx="56" cy="56" r={r} fill="none" stroke={C.border} strokeWidth="10" />
            <circle
              cx="56" cy="56" r={r} fill="none" stroke={hasGoal ? `url(#${gradId})` : C.forest} strokeWidth="10"
              strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 56 56)"
              style={{ transition: "stroke-dasharray 0.4s ease" }}
            />
            <text x="56" y="52" textAnchor="middle" style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, fill: C.ink }}>
              {dayTotal}
            </text>
            <text x="56" y="70" textAnchor="middle" style={{ fontSize: 10.5, fill: C.inkSoft }}>
              {hasGoal ? `/ ${dailyGoal} kcal` : "kcal"}
            </text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 3 }}>{isToday ? "今日摄入进度" : "当日摄入总量"}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: over ? C.danger : C.forest, marginBottom: 10 }}>
              {!goalSupported(pet)
                ? "该物种暂不提供精确热量目标，仅做记录"
                : dailyGoal === 0
                ? "先记录体重以计算目标"
                : over
                ? `超出目标 ${dayTotal - dailyGoal} kcal`
                : `还可摄入 ${dailyGoal - dayTotal} kcal`}
            </div>
            {isToday && (
              <button onClick={onGoScan} style={primaryBtnStyle({ width: "100%", display: "flex", justifyContent: "center", gap: 6, alignItems: "center", padding: "9px 12px" })}>
                <Camera size={15} /> 拍照记一餐
              </button>
            )}
            {isToday && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input id="bowlMode" type="checkbox" checked={isBowl} onChange={(e) => setIsBowl(e.target.checked)} />
                <label htmlFor="bowlMode" style={{ fontSize: 12, color: C.inkSoft }}>碗中食物识别（更聚焦中心）</label>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <MacroPill icon={Egg} value={dayProtein} unit="g" label="蛋白质" color={C.chipBlue} bg={C.chipBlueSoft} />
          <MacroPill icon={Droplet} value={dayFat} unit="g" label="脂肪" color={C.amber} bg={C.amberSoft} />
          <MacroPill icon={Wheat} value={dayCarb} unit="g" label="碳水" color={C.forest} bg={C.safeSoft} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "20px 2px 10px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16 }}>{isToday ? "今日饮食" : "当日饮食"}</div>
        <div style={{ fontSize: 11.5, color: C.inkSoft }}>{dayLogs.length} 项</div>
      </div>

      {dayLogs.length === 0 ? (
        <div style={{ fontSize: 13, color: C.inkSoft, padding: "6px 2px" }}>
          {isToday ? "还没有记录，点右下角按钮扫一扫吧。" : "这一天没有记录。"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {dayLogs.map((l) => {
            const meta = DANGER_META[l.dangerLevel] || DANGER_META.safe;
            const isEditing = editingId === l.id;
            return (
              <div key={l.id} style={{ ...cardStyle(), padding: "9px 11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  {l.photo ? (
                    <img src={l.photo} alt={l.foodName} style={{ width: 46, height: 46, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 46, height: 46, borderRadius: 11, background: C.safeSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Wheat size={18} color={C.forest} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.foodName}</div>
                    <div style={{ fontSize: 11, color: C.inkSoft, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{l.grams} g · {l.totalCalories} kcal</span>
                      {l.dangerLevel && l.dangerLevel !== "safe" && <span style={{ color: meta.color, fontWeight: 600 }}>· {meta.label}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditingId(null);
                      } else {
                        setEditingId(l.id);
                        setEditGrams(String(l.grams));
                      }
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.inkFaint }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onRemove(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkFaint }}>
                    <Trash2 size={15} />
                  </button>
                </div>
                {isEditing && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                    <input type="number" value={editGrams} onChange={(e) => setEditGrams(e.target.value)} style={{ ...inputStyle(), padding: "7px 10px" }} />
                    <button
                      onClick={() => {
                        onEditGrams(l.id, Number(editGrams) || 0);
                        setEditingId(null);
                      }}
                      style={primaryBtnStyle({ padding: "7px 14px", fontSize: 12.5 })}
                    >
                      保存
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, marginBottom: 10 }}>收藏与最近识别</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ ...cardStyle(), padding: "12px 12px 10px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>我的收藏</div>
            {favoriteFoods.length === 0 ? (
              <div style={{ fontSize: 11.5, color: C.inkSoft }}>还没有收藏，识别结果页可一键收藏常见食物。</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {favoriteFoods.map((food) => (
                  <span key={food.id || food.name} style={{ background: C.safeSoft, color: C.forestDark, borderRadius: 999, padding: "5px 8px", fontSize: 11.5, fontWeight: 700 }}>{food.name}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ ...cardStyle(), padding: "12px 12px 10px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>最近识别</div>
            {recentFoods.length === 0 ? (
              <div style={{ fontSize: 11.5, color: C.inkSoft }}>还没有识别记录。</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {recentFoods.map((food) => (
                  <div key={food.id || food.name} style={{ fontSize: 12, color: C.inkSoft, display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{food.name}</span>
                    <button onClick={() => onToggleFavorite({ name: food.name, calories: 0, note: "从最近记录中加入收藏" })} style={{ background: "none", border: "none", cursor: "pointer", color: C.forestDark, fontWeight: 700 }}>收藏</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, marginBottom: 10 }}>宠物资讯 · 轻食堂</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ARTICLE_LIBRARY.map((article) => (
            <div key={article.id} style={{ ...cardStyle(), padding: "12px 12px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, color: C.forestDark, background: C.safeSoft, borderRadius: 999, padding: "4px 8px", fontWeight: 700 }}>{article.tag}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{article.title}</div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginBottom: 8 }}>{article.intro}</div>
              <div style={{ fontSize: 11.5, color: C.ink, lineHeight: 1.7 }}>{article.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, marginBottom: 10 }}>常见食物速查</div>
        <div style={{ ...cardStyle(), padding: "10px 12px" }}>
          <input
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
            placeholder="搜索食物 / 关键词"
            style={{ ...inputStyle(), marginBottom: 10 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleFoods.length === 0 ? (
              <div style={{ fontSize: 12, color: C.inkSoft }}>没有匹配的食物。</div>
            ) : (
              visibleFoods.map((food) => (
                <div key={food.name} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{food.name}</div>
                    <div style={{ fontSize: 11.5, color: C.forestDark, fontWeight: 700 }}>{food.kcal} kcal/100g</div>
                  </div>
                  <div style={{ fontSize: 11.2, color: C.inkSoft, marginTop: 4 }}>{food.note}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function dateNavBtnStyle(disabled) {
  return {
    width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: "#fff",
    color: disabled ? C.inkFaint : C.forestDark, cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.5 : 1,
  };
}

// ================= SCAN =================
function ScanTab(props) {
  const {
    pet, scanning, scanError, scanResult, scanImage, portion, setPortion, fileInputRef, handleFile,
    confirmScanLog, resetScan, manualOpen, setManualOpen, manualName, setManualName, manualCal, setManualCal,
    manualGrams, setManualGrams, submitManual,
  } = props;
  const [showRef, setShowRef] = useState(false);

  if (!pet) {
    return (
      <div style={{ ...cardStyle(), padding: 6 }}>
        <EmptyState title="先添加一只宠物" body="设置宠物档案后就可以开始记录饮食了。" />
      </div>
    );
  }

  if (scanResult) {
    const meta = DANGER_META[scanResult.danger_level] || DANGER_META.safe;
    const Icon = meta.Icon;
    const ratio = (Number(portion) || 0) / 100;
    const total = Math.round((scanResult.calories_per_100g || 0) * ratio);
    const protein = Math.round((scanResult.protein_per_100g || 0) * ratio * 10) / 10;
    const fat = Math.round((scanResult.fat_per_100g || 0) * ratio * 10) / 10;
    const carb = Math.round((scanResult.carb_per_100g || 0) * ratio * 10) / 10;

    return (
      <div style={{ ...cardStyle(), overflow: "hidden" }}>
        <div style={{ position: "relative" }}>
          {scanImage ? (
            <img src={scanImage} alt="拍摄的食物" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: 100, background: C.safeSoft }} />
          )}
          <button
            onClick={resetScan}
            style={{
              position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: "50%",
              background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
          <div
            style={{
              position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 4,
              background: "rgba(74,55,48,0.72)", color: "#fff", fontSize: 10.5, fontWeight: 700, borderRadius: 20, padding: "4px 9px",
            }}
          >
            <Sparkles size={11} /> AI 识别结果
          </div>
        </div>

        <div style={{ padding: "16px 16px 18px" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, marginBottom: 10 }}>{scanResult.food_name}</div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: meta.bg, color: meta.color, padding: "9px 11px", borderRadius: 11, fontSize: 12.5, marginBottom: 14 }}>
            <Icon size={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>{meta.label}</div>
              {scanResult.species_warning && <div style={{ marginTop: 2 }}>{scanResult.species_warning}</div>}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <MacroPill icon={Flame} value={total} unit="kcal" label="热量" color={C.coral} bg={C.dangerSoft} />
            <MacroPill icon={Egg} value={protein} unit="g" label="蛋白质" color={C.chipBlue} bg={C.chipBlueSoft} />
            <MacroPill icon={Droplet} value={fat} unit="g" label="脂肪" color={C.amber} bg={C.amberSoft} />
            <MacroPill icon={Wheat} value={carb} unit="g" label="碳水" color={C.forest} bg={C.safeSoft} />
          </div>

          {scanResult.tip && (
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 14, display: "flex" }}>
              <PawBullet />
              <span>{scanResult.tip}</span>
            </div>
          )}

          <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 6 }}>喂食分量</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={() => setPortion(Math.max(0, Number(portion) - 10))} style={stepperBtnStyle()}>
              <Minus size={15} />
            </button>
            <div style={{ flex: 1, textAlign: "center", fontFamily: FONT_DISPLAY, fontSize: 20 }}>
              {portion} <span style={{ fontSize: 12, fontFamily: FONT_BODY, color: C.inkSoft }}>g</span>
            </div>
            <button onClick={() => setPortion(Number(portion) + 10)} style={stepperBtnStyle()}>
              <Plus size={15} />
            </button>
          </div>

          <button
            onClick={confirmScanLog}
            disabled={scanResult.danger_level === "danger"}
            style={primaryBtnStyle({ width: "100%", opacity: scanResult.danger_level === "danger" ? 0.5 : 1, cursor: scanResult.danger_level === "danger" ? "not-allowed" : "pointer" })}
          >
            {scanResult.danger_level === "danger" ? "此食物不建议喂食" : "添加到今日记录"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...cardStyle(), padding: "22px 18px", textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, marginBottom: 4 }}>拍照识别食物</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 20 }}>
          拍一张食物照片，AI 帮你估算热量与营养素，并提示对{speciesMeta(pet?.species).label}是否安全。
        </div>
        <input id="pha-food-photo-input" ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        <label
          htmlFor="pha-food-photo-input"
          style={{
            width: 96, height: 96, borderRadius: "50%", border: "none", cursor: scanning ? "default" : "pointer",
            background: `linear-gradient(135deg, ${C.amber}, ${C.coral})`, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", margin: "0 auto", boxShadow: "0 10px 24px rgba(240,132,126,0.35)",
            pointerEvents: scanning ? "none" : "auto", opacity: scanning ? 0.85 : 1,
          }}
        >
          {scanning ? <Loader2 size={30} className="pha-spin" /> : <Camera size={30} />}
        </label>
        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 14 }}>{scanning ? "正在识别中…" : "点击选择食物照片"}</div>
      </div>

      <div style={{ fontSize: 11, color: C.inkSoft, textAlign: "center", marginTop: -10, marginBottom: 16 }}>
        如果点击没反应，可能是当前环境未开放相机权限，可先从相册选择已拍好的照片。
      </div>

      {scanError && <div style={{ color: C.danger, fontSize: 12.5, textAlign: "center", marginBottom: 14 }}>{scanError}</div>}

      {!manualOpen ? (
        <button onClick={() => setManualOpen(true)} style={secondaryBtnStyle({ width: "100%", marginBottom: 14 })}>
          手动添加食物
        </button>
      ) : (
        <div style={{ ...cardStyle(), padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>手动添加</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input placeholder="食物名称" value={manualName} onChange={(e) => setManualName(e.target.value)} style={inputStyle()} />
            <input placeholder="每100g热量 (kcal)" type="number" value={manualCal} onChange={(e) => setManualCal(e.target.value)} style={inputStyle()} />
            <input placeholder="喂食分量 (g)" type="number" value={manualGrams} onChange={(e) => setManualGrams(e.target.value)} style={inputStyle()} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={submitManual} style={primaryBtnStyle({ flex: 1 })}>添加</button>
            <button onClick={() => setManualOpen(false)} style={secondaryBtnStyle({ flex: 1 })}>取消</button>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowRef(!showRef)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "none", border: "none", cursor: "pointer", padding: "8px 2px", color: C.ink,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
          <ShieldAlert size={15} color={C.danger} /> 常见宠物饮食禁忌速查
        </span>
        <ChevronDown size={16} style={{ transform: showRef ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {showRef && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11, color: C.inkSoft, padding: "0 2px" }}>
            以下主要针对犬猫整理，其他物种（兔子、鸟类等）请务必额外咨询兽医，敏感食物范围可能不同。
          </div>
          {TOXIC_FOODS.map((f) => (
            <div key={f.name} style={{ ...cardStyle(), padding: "9px 12px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.danger }}>{f.name}</div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>{f.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function stepperBtnStyle() {
  return {
    width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: "#fff",
    color: C.forestDark, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  };
}

// ================= REPORT =================
function ReportTab({ pet, chartData, dailyGoal, weekAvg, overDays, flagged, safeScore }) {
  if (!pet) {
    return (
      <div style={{ ...cardStyle(), padding: 6 }}>
        <EmptyState title="暂无数据" body="先添加宠物档案并记录几餐，健康报告就会出现在这里。" />
      </div>
    );
  }
  const scoreColor = safeScore >= 80 ? C.safe : safeScore >= 50 ? C.caution : C.danger;
  const ScoreIcon = safeScore >= 80 ? ShieldCheck : ShieldAlert;
  const weighIns = [...(pet.weighIns || [])].sort((a, b) => (a.date < b.date ? -1 : 1));
  const weightChart = weighIns.map((w) => ({ label: dayLabel(w.date), weight: Number(w.weight) }));

  return (
    <div>
      <div style={{ ...cardStyle(), padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${scoreColor}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ScoreIcon size={24} color={scoreColor} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19 }}>本周安全评分 {safeScore}</div>
          <div style={{ fontSize: 12, color: C.inkSoft }}>基于本周记录中安全食物的占比</div>
        </div>
      </div>

      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, marginBottom: 10 }}>近7天摄入趋势</div>
      <div style={{ ...cardStyle(), padding: "14px 8px 4px", marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={C.border} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} formatter={(v) => [`${v} kcal`, "摄入"]} />
            {dailyGoal > 0 && <ReferenceLine y={dailyGoal} stroke={C.amber} strokeDasharray="4 4" label={{ value: "目标", fontSize: 10, fill: C.amber, position: "insideTopRight" }} />}
            <Bar dataKey="kcal" radius={[5, 5, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={dailyGoal && d.kcal > dailyGoal ? C.coral : C.forest} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <StatCard label="日均摄入" value={`${weekAvg}`} unit="kcal" />
        <StatCard label="超标天数" value={`${overDays}`} unit="/ 7 天" warn={overDays > 2} />
      </div>

      {weightChart.length > 0 && (
        <>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, marginBottom: 10 }}>体重变化趋势</div>
          <div style={{ ...cardStyle(), padding: "14px 8px 4px", marginBottom: 18 }}>
            {weightChart.length >= 2 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={weightChart} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} formatter={(v) => [`${v} kg`, "体重"]} />
                  <Line type="monotone" dataKey="weight" stroke={C.forest} strokeWidth={2.5} dot={{ r: 3, fill: C.forest }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ fontSize: 12.5, color: C.inkSoft, padding: "16px 10px" }}>再记录一次体重即可查看趋势图</div>
            )}
          </div>
        </>
      )}

      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, marginBottom: 10 }}>需要留意的食物</div>
      {flagged.length === 0 ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>暂无风险提示，饮食记录都很安心。</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {flagged.map((l) => {
            const meta = DANGER_META[l.dangerLevel] || DANGER_META.safe;
            const Icon = meta.Icon;
            return (
              <div key={l.id} style={{ ...cardStyle(), display: "flex", gap: 10, alignItems: "center", padding: "10px 12px" }}>
                {l.photo ? (
                  <img src={l.photo} alt={l.foodName} style={{ width: 38, height: 38, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={meta.color} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{l.foodName}</div>
                  {l.speciesWarning && <div style={{ fontSize: 11.5, color: meta.color, marginTop: 1 }}>{l.speciesWarning}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function StatCard({ label, value, unit, warn }) {
  return (
    <div style={{ ...cardStyle(), flex: 1, padding: "12px 14px" }}>
      <div style={{ fontSize: 11.5, color: C.inkSoft, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: warn ? C.danger : C.ink }}>
        {value} <span style={{ fontSize: 11.5, fontFamily: FONT_BODY, color: C.inkSoft }}>{unit}</span>
      </div>
    </div>
  );
}

// ================= MANAGE (multi-pet + weight + data) =================
function ManageTab({ pets, activePetId, onSelect, onSave, onDelete, onAddWeighIn, onDeleteWeighIn, exportData, resetAllData }) {
  const [view, setView] = useState(pets.length ? "list" : "form");
  const [editingPet, setEditingPet] = useState(null);
  const [weightView, setWeightView] = useState(null);
  const [newWeight, setNewWeight] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({ name: "", species: "dog", breed: "", activity: "normal", weight: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startNew = () => {
    setForm({ name: "", species: "dog", breed: "", activity: "normal", weight: "" });
    setEditingPet(null);
    setView("form");
  };
  const startEdit = (p) => {
    setForm({ name: p.name, species: p.species, breed: p.breed || "", activity: p.activity, weight: "" });
    setEditingPet(p);
    setView("form");
  };
  const save = async () => {
    if (!form.name || (!editingPet && !form.weight)) return;
    if (editingPet) {
      await onSave({ id: editingPet.id, name: form.name, species: form.species, breed: form.breed, activity: form.activity }, false);
    } else {
      await onSave({ name: form.name, species: form.species, breed: form.breed, activity: form.activity }, true, form.weight);
    }
    setView("list");
  };

  const doCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      /* clipboard unavailable; text is still visible to select manually */
    }
  };

  if (view === "weight" && weightView) {
    const p = pets.find((x) => x.id === weightView) || weightView;
    const weighIns = [...(p.weighIns || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
    return (
      <div>
        <BackRow onBack={() => setView("list")} title={`${p.name} · 体重记录`} />
        <div style={{ ...cardStyle(), padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 8 }}>记录新体重</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" placeholder="kg" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} style={inputStyle()} />
            <button
              onClick={async () => {
                if (!newWeight) return;
                await onAddWeighIn(p.id, newWeight);
                setNewWeight("");
              }}
              style={primaryBtnStyle({ padding: "10px 16px" })}
            >
              保存
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {weighIns.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>还没有体重记录。</div>}
          {weighIns.map((w) => (
            <div key={w.id} style={{ ...cardStyle(), display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 13px" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{w.weight} kg</div>
                <div style={{ fontSize: 11, color: C.inkSoft }}>{friendlyDate(w.date)}</div>
              </div>
              <button onClick={() => onDeleteWeighIn(p.id, w.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkFaint }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "form") {
    const previewGoal = calcDailyGoal(editingPet ? { ...editingPet, weight: getCurrentWeight(editingPet) } : { weighIns: [], weight: form.weight, activity: form.activity });
    return (
      <div>
        <BackRow onBack={() => setView(pets.length ? "list" : "form")} showBack={pets.length > 0} title={editingPet ? "编辑宠物" : "添加宠物"} />
        <div style={{ ...cardStyle(), padding: "18px 18px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            {Object.entries(SPECIES_META).map(([key, { label, Icon }]) => (
              <button
                key={key}
                onClick={() => setForm({ ...form, species: key })}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 4px",
                  borderRadius: 12, cursor: "pointer", border: `1.5px solid ${form.species === key ? C.forestDark : C.border}`,
                  background: form.species === key ? C.safeSoft : "#fff", color: C.ink,
                }}
              >
                <Icon size={18} color={form.species === key ? C.forestDark : C.inkSoft} />
                <span style={{ fontSize: 11 }}>{label}</span>
              </button>
            ))}
          </div>
          {!speciesMeta(form.species).supportsGoal && (
            <div style={{ fontSize: 11.5, color: C.caution, background: C.cautionSoft, borderRadius: 8, padding: "7px 10px", marginBottom: 14 }}>
              该物种的代谢差异较大，App 暂不提供精确的每日热量目标，仅作饮食记录，具体喂食量请以兽医或饲养手册建议为准。
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft }}>名字</label>
              <input value={form.name} onChange={set("name")} placeholder="例如：豆豆" style={{ ...inputStyle(), marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft }}>品种（可选）</label>
              <input value={form.breed} onChange={set("breed")} placeholder="例如：英短" style={{ ...inputStyle(), marginTop: 4 }} />
            </div>
            {!editingPet && (
              <div>
                <label style={{ fontSize: 12, color: C.inkSoft }}>当前体重 (kg)</label>
                <input type="number" value={form.weight} onChange={set("weight")} style={{ ...inputStyle(), marginTop: 4 }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft }}>活动量</label>
              <select value={form.activity} onChange={set("activity")} style={{ ...inputStyle(), marginTop: 4 }}>
                {Object.entries(ACTIVITY_FACTORS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {editingPet && (
            <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>
              体重通过「体重记录」单独更新，当前：{getCurrentWeight(editingPet) || "未记录"} kg
            </div>
          )}
          {speciesMeta(form.species).supportsGoal && (form.weight > 0 || editingPet) && (
            <div style={{ fontSize: 12.5, color: C.forest, marginBottom: 16 }}>
              预计每日建议摄入约 <b>{previewGoal}</b> kcal
            </div>
          )}

          <button onClick={save} style={primaryBtnStyle({ width: "100%" })}>{editingPet ? "保存修改" : "创建档案"}</button>
        </div>
      </div>
    );
  }

  // list view
  return (
    <div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, marginBottom: 4 }}>我的宠物</div>
      <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 14 }}>可以添加多只宠物，点击切换为当前记录对象。</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
        {pets.map((p) => (
          <div key={p.id} style={{ ...cardStyle(), padding: "12px 13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <button
                onClick={() => onSelect(p.id)}
                style={{
                  width: 42, height: 42, borderRadius: 12, border: "none", cursor: "pointer", flexShrink: 0,
                  background: p.id === activePetId ? C.forestDark : C.safeSoft,
                  color: p.id === activePetId ? "#fff" : C.forest,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {React.createElement(speciesMeta(p.species).Icon, { size: 19 })}
              </button>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => onSelect(p.id)}>
                <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  {p.name}
                  {p.id === activePetId && (
                    <span style={{ fontSize: 10, color: C.forest, background: C.safeSoft, borderRadius: 6, padding: "1.5px 6px", fontWeight: 700 }}>当前</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: C.inkSoft }}>
                  {p.breed ? `${p.breed} · ` : ""}
                  {getCurrentWeight(p) ? `${getCurrentWeight(p)} kg` : "未记录体重"} · {ACTIVITY_FACTORS[p.activity]?.label.split(" · ")[0]}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={() => {
                  setWeightView(p.id);
                  setView("weight");
                }}
                style={secondaryBtnStyle({ flex: 1, padding: "7px 10px", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 })}
              >
                <Scale size={13} /> 体重记录
              </button>
              <button onClick={() => startEdit(p)} style={secondaryBtnStyle({ flex: 1, padding: "7px 10px", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 })}>
                <Pencil size={13} /> 编辑
              </button>
              {confirmDelete === p.id ? (
                <button onClick={() => { onDelete(p.id); setConfirmDelete(null); }} style={dangerBtnStyle({ flex: 1, padding: "7px 10px", fontSize: 12 })}>
                  确认删除？
                </button>
              ) : (
                <button onClick={() => setConfirmDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkFaint, padding: "7px 8px" }}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={startNew} style={secondaryBtnStyle({ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 22 })}>
        <Plus size={15} /> 添加宠物
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Settings2 size={15} color={C.inkSoft} />
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15 }}>数据管理</div>
      </div>
      <div style={{ ...cardStyle(), padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => setExportOpen(!exportOpen)} style={secondaryBtnStyle({ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })}>
          <Download size={14} /> 导出我的数据
        </button>
        {exportOpen && (
          <div>
            <textarea
              readOnly
              value={exportData()}
              style={{ width: "100%", height: 110, boxSizing: "border-box", fontSize: 10.5, fontFamily: "monospace", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: 8, color: C.inkSoft }}
            />
            <button
              onClick={() => doCopy(exportData())}
              style={secondaryBtnStyle({ width: "100%", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12.5 })}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "已复制" : "复制到剪贴板"}
            </button>
          </div>
        )}
        {confirmReset ? (
          <button onClick={() => { resetAllData(); setConfirmReset(false); }} style={dangerBtnStyle({ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })}>
            确认清空全部宠物与记录？
          </button>
        ) : (
          <button onClick={() => setConfirmReset(true)} style={{ ...dangerBtnStyle({ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }), border: "none" }}>
            <RotateCcw size={14} /> 清空全部数据
          </button>
        )}
      </div>
    </div>
  );
}
function BackRow({ onBack, title, showBack = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {showBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink, padding: 2 }}>
          <ChevronLeft size={20} />
        </button>
      )}
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17 }}>{title}</div>
    </div>
  );
}

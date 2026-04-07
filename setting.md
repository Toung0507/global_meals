# Global Meals — 核心設定總覽

> 本文件記錄所有已啟用的 Skill、第三方函式庫、CDN 引用、設計規範與樣式核心設定。
> 新增或移除任何套件、Skill、CDN 時請同步更新此文件。

---

## 一、Claude Code Skills（已安裝）

| Skill 路徑                                                      | 功能說明                                               | 主要用途                |
| --------------------------------------------------------------- | ------------------------------------------------------ | ----------------------- |
| `skill/angular-developer/`                                      | Angular 官方技術文件集合（Signal、路由、表單、動畫等） | 開發 Angular 元件時參考 |
| `skill/angular-agent-skill/`                                    | Angular Agent 輔助開發技能                             | Claude Code 輔助開發    |
| `skill/angular-migration/`                                      | Angular 版本遷移指南                                   | 版本升級時參考          |
| `skill/frontend-design/`                                        | 前端設計規範與最佳實踐                                 | UI/UX 決策參考          |
| `skill/ui-animation_20260227124859/`                            | UI 動畫技術參考（GSAP / CSS / Lottie）                 | Loading 動畫、過場動畫  |
| `skill/clfhhc-bmad-methods-skills-bootstrap-bmad-skills-1.0.1/` | Bootstrap BMAD 方法論                                  | 管理後台 Bootstrap 排版 |
| `skill/g1joshi-agent-skills-bootstrap-1.0.1/`                   | Bootstrap Agent 技能                                   | Bootstrap 元件快速生成  |

---

## 二、第三方函式庫（npm 安裝）

| 套件名稱        | 版本 | 用途                               |
| --------------- | ---- | ---------------------------------- |
| `@angular/core` | 19.x | Angular 核心框架                   |
| `gsap`          | 最新 | Loading 動畫（遮罩淡入、卡片彈出） |
| `lottie-web`    | 最新 | 客戶端 Loading Lottie 動畫播放     |

---

## 三、CDN 引用（index.html 全域）

### Bootstrap 5.3.8

```html
<!-- CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous" />

<!-- JS Bundle（含 Popper） -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-aVe7RjgFKXzt11g0CIpanEJMWZzDHN3NFlZ4HlK3P3L8M3P3L8M3P3L8M3P3L8" crossorigin="anonymous" defer></script>
```

> **適用範圍：** `manager-dashboard`、`pos-terminal`
> **說明：** 僅管理後台與 POS 頁面使用 Bootstrap 的 `.row`、`.col`、`.table`、`.btn` 等 utility class。

### dotlottie-wc 0.9.3

```html
<script src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js" type="module"></script>
```

> **適用範圍：** `customer-guest`（訪客點餐 Lottie 動畫）

---

## 四、Google Fonts 引用（index.html）

### 客戶端字體

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,400&family=LXGW+WenKai+TC&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

| 字體             | 用途                             |
| ---------------- | -------------------------------- |
| `Fraunces`       | 英文品牌名稱展示（管理系統標題） |
| `LXGW WenKai TC` | 中文品牌名稱 / 大標題（楷書）    |
| `DM Mono`        | 訂單編號、金額、程式碼類等寬文字 |

### 管理端 / POS 字體

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

| 字體            | 用途                        |
| --------------- | --------------------------- |
| `Noto Sans TC`  | 管理後台 / POS 主要正文字體 |
| `IBM Plex Mono` | POS 金額、訂單號等寬文字    |

---

## 五、系統配色規範

### 方案一：深藍金（管理系統）

**適用頁面：** `staff-login`、`manager-dashboard`、`pos-terminal`

| 角色     | HEX       | 用途                 |
| -------- | --------- | -------------------- |
| 主色     | `#1E3A5F` | 品牌欄背景、按鈕主色 |
| 輔助色   | `#2C5282` | 按鈕漸層、hover      |
| 點綴金   | `#F0A500` | 品牌英文名、強調數值 |
| 主文字   | `#1A2840` | 標題、輸入框         |
| 次文字   | `#4A5A70` | 說明文字、副標題     |
| 頁面背景 | `#F4F6FA` | 整頁底色             |
| 卡片背景 | `#FFFFFF` | 表單欄、卡片         |
| 邊框     | `#D4DCE8` | 輸入框邊框、分隔線   |

**管理後台深色擴展（manager-dashboard / pos-terminal 暗色介面）：**

| 角色        | HEX       | 用途                  |
| ----------- | --------- | --------------------- |
| 最深背景    | `#0d1117` | 整體頁面底色          |
| 側欄 / 頂欄 | `#111927` | 側邊欄 / 頂部欄背景   |
| 卡片背景    | `#1c2130` | 資訊卡、表格背景      |
| 金色主調    | `#c49756` | 側欄 active、標題底線 |
| 亮金        | `#f0c68c` | hover 效果、數值強調  |
| 分店長紫    | `#c084fc` | 分店長角色標籤        |

### 方案二：暖橘奶油（客戶端）

**適用頁面：** `customer-login`、`customer-register`、`customer-guest`、`customer-home`、`customer-member`

| 角色     | HEX       | 用途                 |
| -------- | --------- | -------------------- |
| 主色     | `#D95C1A` | 品牌欄背景、按鈕主色 |
| 輔助色   | `#A84210` | 按鈕 hover           |
| 點綴金   | `#F0A500` | 頭像漸層、金額       |
| 主文字   | `#3D2010` | 標題、內文           |
| 次文字   | `#6A4830` | 說明文字、標籤       |
| 頁面背景 | `#FFFAF3` | 奶油白底色           |
| 卡片背景 | `#FFFFFF` | 訂單卡片             |
| 邊框     | `#F0D8B8` | 輸入框邊框、分隔線   |

---

## 六、共用元素規範

| 項目             | 規範                         |
| ---------------- | ---------------------------- |
| 品牌主字體       | `'LXGW WenKai TC', cursive`  |
| 管理端正文       | `'Noto Sans TC', sans-serif` |
| 等寬字體（客戶） | `'DM Mono', monospace`       |
| 等寬字體（管理） | `'IBM Plex Mono', monospace` |
| 英文品牌字體     | `'Fraunces', serif`          |
| 頂部導覽列高度   | `48px`（固定）               |
| 頁面最小高度     | `100dvh`（非 `vh`）          |
| 共用點綴色       | `#F0A500` 亮金黃             |

---

## 七、CSS / SCSS 撰寫規範

- **禁用** CSS 自訂屬性（`--color: #fff` / `var(--color)`），改為直接寫入數值
- 所有顏色、間距一律寫死為具體數值
- 每個主要區塊加上說明性中文 / 英文注釋
- 每個檔案頂部加上用途說明區塊

---

## 八、Angular 撰寫規範

- `standalone: true` 明確宣告
- 使用 `styleUrls: ['./xxx.component.scss']`（陣列形式）
- 使用 `signal<T>()` 管理元件狀態，`computed()` 計算衍生值
- 使用 Angular 17+ 控制流語法：`@if`、`@for`（非 `*ngIf`、`*ngFor`）
- 方法須有明確回傳型別（如 `: void`、`: boolean`）
- class 重要區塊加上說明性中文注釋

---

## 九、本機 Lottie 動畫資源

| 路徑                                 | 說明                                     |
| ------------------------------------ | ---------------------------------------- |
| `public/assets/scan-to-order.lottie` | 訪客點餐頁 Lottie 動畫（dotlottie 格式） |
| `public/assets/scan-to-order.json`   | 訪客點餐頁 Lottie 動畫（JSON 備份）      |

> **注意：** 動畫路徑使用本機資源（`/assets/xxx`），不使用 CDN URL，避免 403 問題。

---

_最後更新：2026-03-30_

---

---

# UI/UX 風格樣式參考庫

> 來源：[joshhu/uitest](https://github.com/joshhu/uitest) × [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
> 狀態：**僅供挑選，尚未套用至專案**
> 用途：未來新頁面（菜單、購物車、訂單、後台儀表板）可從以下方案中選用

---

## 一、核心視覺風格方案（10 選 1）

> 以下為最適合餐飲 / 訂餐 / POS 系統的風格精選，按「適合度」排序。

### 風格 A：Claymorphism（黏土感 3D）

**感受：** 圓潤、可愛、溫暖，質感玩具般的立體感
**適合頁面：** 客戶點餐、菜單頁、訂單完成頁
**核心 CSS 特徵：**

- 邊框圓角：`border-radius: 16px–28px`（誇張圓角）
- 背景：純色（不透明），飽和度偏高
- 陰影：多層有色陰影（非黑色），例如 `box-shadow: 8px 8px 0px rgba(色調, 0.3)`
- 文字：Fredoka / Nunito（圓體感字型）
- 無玻璃感、無漸層底

**色彩建議（搭配暖橘奶油方案）：**
| 角色 | 色碼 | 說明 |
|------|------|------|
| 主色 | `#F97316` | 活力橙，比現有 #D95C1A 更明亮 |
| 輔助 | `#FB923C` | 淺橙，作 hover/卡片底 |
| 強調 | `#FBBF24` | 亮黃 |
| 背景 | `#FFF7ED` | 奶油感 |
| 陰影色 | `rgba(249,115,22,0.25)` | 橘色有色陰影 |

---

### 風格 B：Glassmorphism（玻璃質感）

**感受：** 現代、輕盈、高科技感、半透明層疊
**適合頁面：** 管理後台儀表板、訂單管理、數據統計
**核心 CSS 特徵：**

- `background: rgba(255, 255, 255, 0.12)`
- `backdrop-filter: blur(12px)–blur(20px)`
- `border: 1px solid rgba(255, 255, 255, 0.20)`
- `border-radius: 16px`
- 需要有色彩豐富的背景（漸層底圖）才能凸顯玻璃感
- 前景文字用白色或淡色

**色彩建議（搭配深藍金方案）：**
| 角色 | 色碼 | 說明 |
|------|------|------|
| 面板底色 | `rgba(30,58,95,0.15)` | 深藍半透明 |
| 邊框 | `rgba(255,255,255,0.18)` | 白色玻璃邊 |
| 背景漸層 | `#1E3A5F → #2C5282 → #1A2840` | 管理端深藍系 |
| 文字 | `rgba(255,255,255,0.90)` | 高透白字 |

---

### 風格 C：Neumorphism（擬態柔影）

**感受：** 柔和、精緻、有觸感，按鈕有凹凸立體感
**適合頁面：** 設定頁、個人資料頁、靜態資訊頁
**核心 CSS 特徵：**

- 背景與元素同色（元素不突出，靠陰影區分）
- 外凸：`box-shadow: 6px 6px 12px #深色, -6px -6px 12px #淺色`
- 內凹：`box-shadow: inset 6px 6px 12px #深色, inset -6px -6px 12px #淺色`
- `border-radius: 16px–24px`
- 無邊框、無強烈色彩

**色彩建議（客戶端軟質版）：**
| 角色 | 色碼 | 說明 |
|------|------|------|
| 底色 | `#F5F0EB` | 奶油米，帶微棕 |
| 深陰影 | `#D4C8BE` | 底色加深 15% |
| 亮陰影 | `#FFFFFF` | 純白高光 |
| 主色文字 | `#D95C1A` | 沿用暖橘 |

---

### 風格 D：Neubrutalism（新粗野主義）

**感受：** 大膽、個性強烈、有趣，刻意「不精緻」
**適合頁面：** 促銷活動頁、特定節慶 Banner、登入頁特殊版本
**核心 CSS 特徵：**

- `border: 2px–4px solid #000000`（黑色實線邊框）
- `box-shadow: 4px 4px 0px #000` 或 `6px 6px 0 #色彩`（offset hard shadow，無模糊）
- `border-radius: 0` 或少量（0–8px）
- 高飽和度純色區塊（黃、橘、粉、藍）
- 文字用系統字體（Arial、Impact）或 Space Grotesk

**色彩組合（搭配品牌色）：**
| 角色 | 色碼 | 說明 |
|------|------|------|
| 主色塊 | `#FFD600` 或 `#FF6B35` | 鮮黃 / 活橘 |
| 邊框 | `#000000` | 純黑 |
| offset 陰影 | `#000000` | 純黑 offset |
| 背景 | `#FFFAF3` 或 `#FFFFFF` | 沿用品牌奶油白 |

---

### 風格 E：Bento Box Grid（便當格式佈局）

**感受：** 現代感強、資訊密度高但清晰，Apple 風格
**適合頁面：** 管理後台儀表板、數據概覽頁、客戶訂單歷史
**核心佈局特徵：**

- `display: grid`，不規則 grid span（有大格、有小格）
- `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
- 大格（重點 KPI）：`grid-column: span 2`、`grid-row: span 2`
- 小格（輔助資訊）：`1×1` 格
- `border-radius: 16px–24px`，`gap: 12px–16px`
- 每格純色背景（不同格用不同淡背景色，視覺分區）
- 無明顯分隔線，靠 gap 和背景色區分

**推薦搭配色（管理端）：**
| 格子類型 | 背景色 | 說明 |
|---------|--------|------|
| 主要 KPI 格 | `#1E3A5F` | 深藍，重點突出 |
| 次要資訊格 | `#F4F6FA` | 淡藍灰 |
| 警示格 | `rgba(240,165,0,0.12)` | 淡金黃 |
| 圖表格 | `#FFFFFF` | 白色，乾淨 |

---

### 風格 F：Aurora UI（極光漸層）

**感受：** 夢幻、高質感、視覺震撼，AI / 科技品牌感
**適合頁面：** 首頁 Hero 區塊、VIP 頁面、品牌宣傳頁
**核心 CSS 特徵：**

- `background: conic-gradient(...)` 或 mesh-gradient（多色放射漸層）
- 動畫速度：`8s–12s` 循環（緩慢流動）
- `filter: blur(40px–80px)` 配合色彩層（色球效果）
- 前景用純白或高對比色確保可讀性
- `animation: auroraMove Xs ease-in-out infinite alternate`

**色彩組合（品牌橘+藍色冷暖對比）：**
| 色球 | 色碼 | 說明 |
|------|------|------|
| 暖球 1 | `rgba(217,92,26,0.5)` | 品牌橘 |
| 暖球 2 | `rgba(240,165,0,0.4)` | 品牌金 |
| 冷球 | `rgba(30,58,95,0.4)` | 品牌深藍 |
| 底色 | `#0A0A0F` 或 `#FFFAF3` | 深色版或奶油白版 |

---

### 風格 G：Organic Biophilic（自然有機感）

**感受：** 親切、自然、健康，天然食材 × 農場風格
**適合頁面：** 素食 / 健康餐飲品牌、菜單頁主題版
**核心特徵：**

- 色調：大地色（橄欖綠、土棕、米白）
- 有機不規則形狀（border-radius 非等值，如 `40% 60% 65% 35% / 45% 55% 35% 65%`）
- 質感紋理疊層（SVG noise / grain filter）
- 字體：Cormorant Garamond（襯線）搭配 Lato
- 插圖感裝飾元素

**色彩組合（餐飲自然版）：**
| 角色 | 色碼 | 說明 |
|------|------|------|
| 主綠 | `#4A7C59` | 草綠 |
| 土棕 | `#8B6451` | 土壤暖棕 |
| 奶油 | `#F5F0E8` | 自然奶油 |
| 點綴橙 | `#E8855A` | 南瓜橙（與品牌橘和諧） |

---

### 風格 H：Retro-Futurism / Y2K（復古科技感）

**感受：** 鮮明、個性、90s-2000s 時代感，年輕族群喜愛
**適合頁面：** 特定行銷活動頁、節慶主題頁
**核心特徵：**

- 霓虹色：`#FF006E`（粉紅）、`#0080FF`（電藍）、`#FFE600`（電黃）
- `text-shadow: 0 0 10px #FF006E`（文字發光）
- 金屬漸層（silver/chrome effect）
- 像素邊框、CRT 掃描線效果（background-image scanline）
- 字體：Russo One / Bebas Neue + DM Mono

---

### 風格 I：Swiss Modernism 2.0（現代瑞士風）

**感受：** 極簡、嚴謹、國際化、雜誌質感
**適合頁面：** 管理後台主頁、正式報告頁、法律/合規頁
**核心特徵：**

- `12 column grid`，嚴格對齊
- 大量留白（section padding: `80px–120px`）
- 黑白為主，單一強調色（紅或黃）
- 字體：Inter / Helvetica Neue，多種 weight 產生層次
- 無裝飾插圖，純版式設計

---

### 風格 J：Dark Mode OLED（極深暗色主題）

**感受：** 沉穩、高端、夜間友善，省電（OLED 螢幕）
**適合頁面：** 管理後台暗色模式、深夜場景版
**核心 CSS 特徵：**

- `background: #000000`（純黑，OLED 省電）
- 文字：`#E5E7EB`（非純白，減少眼睛疲勞）
- 強調色：亮金黃 `#F0A500` 或霓虹橘 `#FF6B35`
- `border: 1px solid rgba(255,255,255,0.08)`（隱形邊框）
- 卡片底色：`#111111` 或 `#1A1A1A`（非純黑，稍有層次）

---

## 二、字體配對系統（9 組）

> 來源：nextlevelbuilder 的 73 個字體系統精選，適合餐飲品牌

| 編號 | 標題字體                  | 內文字體        | 風格感受            | 適合場景                   |
| ---- | ------------------------- | --------------- | ------------------- | -------------------------- |
| T1   | `Playfair Display`        | `Inter`         | 古典優雅 × 現代清晰 | 高級餐廳、精緻菜單         |
| T2   | `Fraunces` _(現用)_       | `Noto Sans TC`  | 手工感 × 清晰易讀   | 客戶端（現行方案）         |
| T3   | `Cormorant Garamond`      | `Lato`          | 奢華雜誌感          | VIP 會員頁、精選推薦       |
| T4   | `Fredoka`                 | `Nunito`        | 圓潤可愛            | Claymorphism / 外送 App 感 |
| T5   | `Space Grotesk`           | `DM Sans`       | 科技感 × 當代       | 管理後台、數據頁           |
| T6   | `Bebas Neue`              | `Source Sans 3` | 強烈衝擊感          | Neubrutalism / 活動頁      |
| T7   | `Poppins`                 | `Open Sans`     | 親切現代            | 通用型，安全選擇           |
| T8   | `LXGW WenKai TC` _(現用)_ | `Noto Sans TC`  | 楷書品牌感          | 品牌標識（現行方案）       |
| T9   | `JetBrains Mono`          | `IBM Plex Sans` | 開發者工具感        | 後台 debug / 系統頁面      |

---

## 三、進階動畫規格

> 來源：nextlevelbuilder 動畫系統標準，補充至現有 GSAP 使用規範

### 時間標準（取代直覺猜測）

| 情境                     | 時長           | 緩動函數                         | 說明                     |
| ------------------------ | -------------- | -------------------------------- | ------------------------ |
| 按鈕點擊、toggle         | `100–200ms`    | `ease-out`                       | 微互動，越快越有反應感   |
| 卡片 hover、Tooltip 出現 | `250ms`        | `cubic-bezier(0.2,0,0,1)`        | 標準 Material Emphasized |
| Modal / Drawer 進出      | `400–500ms`    | `cubic-bezier(0.16,1,0.3,1)`     | Expo Out，入快出慢       |
| 頁面切換（route）        | `300–400ms`    | `ease-in-out`                    | 不超過 400ms 避免感覺慢  |
| Loading / Skeleton       | `1500–2000ms`  | `ease-in-out infinite`           | 緩慢循環，不焦躁         |
| 背景極光流動             | `8000–12000ms` | `ease-in-out infinite alternate` | 超慢，幾乎感覺不到在動   |

### 彈性物理動畫（Spring Physics）

- `damping: 15–20`（阻尼）
- `stiffness: 90–120`（彈性）
- 適用：卡片展開、抽屜滑入、浮動按鈕彈出

### GPU 加速原則（效能）

- **只動 `transform` 和 `opacity`**，避免動 `width / height / top / left`
- 需要的話用 `transform: translateX/Y` 代替 `left / top`
- 不得動 `box-shadow`（改用 opacity 層疊偽元素代替）

### 無障礙原則

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 四、間距系統

| 系統                     | 基礎單位 | 常用值                         | 適合                         |
| ------------------------ | -------- | ------------------------------ | ---------------------------- |
| **4pt Grid**（現行預設） | 4px      | 4, 8, 12, 16, 24, 32, 48, 64   | 通用型，Angular 元件         |
| **8pt Grid**（嚴格版）   | 8px      | 8, 16, 24, 32, 48, 64, 96      | 設計系統、整齊度要求高的後台 |
| **Aggressive**（衝擊版） | —        | section: `py-40`, card: `p-24` | Neubrutalism、大間距風格     |

**手機 touch target 規範：**

- 最小點擊區域：`44×44px`
- 按鈕之間最小間距：`8px`

---

## 五、色彩方案擴充（可選用，不影響現有方案）

> 以下為額外備用色票，適合未來新身份頁面或主題活動，不覆蓋現有方案一/二

### 方案三（備用）：深綠金 — 高端美食品牌感

| 角色 | HEX       | 說明                     |
| ---- | --------- | ------------------------ |
| 主色 | `#1A4731` | 深墨綠（Fine Dining 感） |
| 輔助 | `#2D6A4F` | 中墨綠                   |
| 點綴 | `#D4A843` | 古銅金（非亮金，更沉穩） |
| 背景 | `#F9F6F0` | 暖白                     |
| 文字 | `#1A2A1A` | 深綠黑                   |
| 邊框 | `#C8D8C0` | 淡綠邊                   |

### 方案四（備用）：酒紅珍珠 — 精緻餐酒館感

| 角色 | HEX       | 說明     |
| ---- | --------- | -------- |
| 主色 | `#7C1F3E` | 深酒紅   |
| 輔助 | `#A33258` | 玫瑰紅   |
| 點綴 | `#E8D5B0` | 珍珠奶油 |
| 背景 | `#FBF8F5` | 象牙白   |
| 文字 | `#2A0F1E` | 深酒深棕 |
| 邊框 | `#E8C8D4` | 粉玫瑰邊 |

### 方案五（備用）：午夜藍橘 — 現代外送 App 感

| 角色 | HEX       | 說明                 |
| ---- | --------- | -------------------- |
| 主色 | `#0F1F3D` | 午夜深藍             |
| 輔助 | `#1A3461` | 中深藍               |
| 點綴 | `#FF6B2B` | 鮮活橘（外送品牌感） |
| 背景 | `#F5F7FA` | 冷白                 |
| 文字 | `#0A0F1E` | 深藍黑               |
| 邊框 | `#D0D8E8` | 冷灰邊               |

---

## 六、UX 互動規範（快查）

### 表單

- 輸入框 label 必須明確關聯（`for` + `id`）
- Inline 即時驗證（不等 submit 才顯示錯誤）
- 必填欄位標示 `*`，可選欄位標示「選填」
- 密碼欄必須有「顯示/隱藏」切換按鈕

### 按鈕狀態

| 狀態           | 視覺                              |
| -------------- | --------------------------------- |
| Default        | 主色背景 + 白字                   |
| Hover          | 加深 10–15% 或加 offset shadow    |
| Active/Pressed | 加深 20% 或 scale(0.97)           |
| Disabled       | 不透明度 40%，cursor: not-allowed |
| Loading        | 替換為 Spinner，保持按鈕寬度不變  |

### 導覽

- 當前頁面有 active 狀態（顏色 + 底線或背景塊）
- 手機版優先垂直捲動，避免水平 scroll
- sticky navigation 在捲動後加深背景（增加 backdrop-blur）

### 無障礙最低標準

- 色彩對比度：`4.5:1`（AA），重要文字用 `7:1`（AAA）
- 所有互動元素有 `focus-visible` 輪廓
- 語意 HTML：`<button>` 不用 `<div>` 代替、`<nav>`、`<main>`、`<section>`

---

_UI/UX 風格參考庫最後更新：2026-03-30_
_來源學習：joshhu/uitest（57種風格展示）、nextlevelbuilder/ui-ux-pro-max-skill（161色票×73字體系統×99 UX規範）_

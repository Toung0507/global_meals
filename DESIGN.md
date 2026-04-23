# Design System: 懶飽飽 Global Meals

## 0. Project Context
多國餐飲連鎖品牌，三個使用者介面分層：
1. **客戶端** — 消費者點餐、訂單追蹤（橘紅暖色，輕鬆愉悅）
2. **POS 終端機** — 員工操作觸控介面（深底金調，高對比耐久）
3. **管理後台** — 老闆 / 分店長數據管理（深海軍藍，專業沉穩）

---

## 1. Visual Theme & Atmosphere

### 客戶端 (Customer App)
**氛圍：** 台灣夜市溫度感 × 現代食品品牌。不是廉價速食的蠟黃橘，而是手工醬缸的深沉琥珀橘紅。乾淨、食慾感十足、有人情味但不鄉土。
- **密度:** 4/10 — 呼吸感充足，每次只做一件事
- **變異:** 6/10 — 非對稱但不激進，Split Screen 左品牌右表單
- **動態:** 5/10 — 流暢 CSS 過場，春天感彈性，不炫技

### POS 終端機 (POS Terminal)
**氛圍：** 深夜廚房觸控板 — 深黑底色如吸油紙、金黃數字如燈籠。資訊密度高但層次清晰。每個按鍵都要有觸覺回饋感。
- **密度:** 8/10 — 座艙等級，資訊緊湊
- **動態:** 3/10 — 最小化動畫，避免操作干擾

### 管理後台 (Manager Dashboard)
**氛圍：** 日本餐廳帳房 — 深海軍藍沉穩如漆器，金黃點綴如食器金邊。數據清晰、操作可信、無多餘裝飾。
- **密度:** 7/10 — 資料豐富但有結構
- **動態:** 3/10 — 靜態為主，Tab 切換有簡單滑入

---

## 2. Color Palette & Roles

### 客戶端色盤
- **Cream Canvas** (`#FFFAF3`) — 頁面主背景，比純白暖 5%
- **Ember Amber** (`#D95C1A`) — 主要 CTA、品牌主色
- **Caramel Deep** (`#A84210`) — Hover 狀態、深度層次
- **Honey Accent** (`#F0A500`) — 標籤、徽章、次要強調
- **Teak Ink** (`#3D2010`) — 主要文字，不用純黑
- **Tea Secondary** (`#6A4830`) — 描述文字、placeholder
- **Straw Border** (`#F0D8B8`) — 輸入框邊框、分隔線
- **Chili Red** (`#C0392B`) — 錯誤訊息、警示

### POS 終端機色盤
- **Void Base** (`#0D1117`) — 頁面底色
- **Carbon Panel** (`#111927`) — 頂欄、側欄、面板
- **Iron Card** (`#1C2130`) — 卡片背景
- **Porcelain Text** (`#E2E8F8`) — 主要文字（高對比）
- **Slate Sub** (`#A0AEC0`) — 描述文字
- **Lantern Gold** (`#C49756`) — 按鈕、選中狀態、金額
- **Gold Light** (`#F0C68C`) — 金額文字、重要數字
- **Indigo Role** (`#818CF8`) — 分店長標識色
- **Staff Blue** (`#4F8EF7`) — 員工標識色

### 管理後台色盤
- **Ash Canvas** (`#F4F6FA`) — 主內容背景
- **Midnight Sidebar** (`#111927`) — 側邊欄
- **Pure Card** (`#FFFFFF`) — 卡片背景
- **Steel Border** (`#D4DCE8`) — 邊框、分隔線
- **Navy Ink** (`#1A2840`) — 主要文字
- **Deep Navy** (`#1E3A5F`) — 頁面標題、大數字
- **Lantern Gold** (`#C49756`) — CTA 按鈕、強調（跨系統統一）

> **⚠ 已知問題 (Bug):** 管理後台側欄副標題現用 `#c084fc` 紫色 — 與品牌無關聯，需替換為 `#C49756` 金色。

---

## 3. Typography Rules

### 字體堆疊
- **中文顯示:** `'Noto Sans TC', 'LXGW WenKai TC', sans-serif`
- **英文品牌字（新增）:** `'Outfit', 'Noto Sans TC', sans-serif` — 用於 LazyBaoBao、品牌標語等拉丁字串
- **POS 金額 / 數字:** `'JetBrains Mono', 'Geist Mono', monospace` — 密度 > 7 時所有數字必須等寬

### 字型階層
| 層級 | 用途 | 大小 | 字重 |
|------|------|------|------|
| Display | 品牌主標 | `clamp(2rem, 5vw, 3.5rem)` | 800 |
| H1 | 頁面標題 | `clamp(1.5rem, 3vw, 2rem)` | 700 |
| H3 | 卡片標題 | `1.1rem` | 600 |
| Body | 一般內容 | `0.9375rem` (15px) | 400 |
| Caption | 標籤、時間戳 | `0.75rem` (12px) | 500 |
| Mono | 金額、訂單號 | `0.875rem` | — |

### 禁止字型
- `Inter` — 太通用，無品牌辨識度
- `Times New Roman`, `Georgia` — 不符合食品品牌調性
- `Arial`, `Helvetica` — 無品牌質感

---

## 4. Component Stylings

### 按鈕 (Buttons)
- **Primary (客戶端):** 填滿 `#D95C1A`，白字，`border-radius: 14px`，`active` 時 `transform: translateY(1px) scale(0.99)`，無外發光
- **Primary (後台/POS):** 填滿 `#C49756`，深木棕字 `#3D2010`，相同觸覺回饋
- **Danger:** `#C0392B` 填滿，用於刪除、退款操作
- **⚠ 禁止:** 外發光 box-shadow、漸層背景按鈕、自定義滑鼠游標

### 卡片 (Cards)
- `border-radius: 16px`，陰影向暖 `box-shadow: 0 2px 12px rgba(61,32,16,0.08)`
- POS 高密度佈局：用 `border-top: 1px solid rgba(255,255,255,0.08)` 取代卡片浮升
- **⚠ 禁止:** 三欄等寬卡片橫排

### 輸入框 (Inputs)
- 標籤固定在上方（不用 floating label）
- Focus ring: `2px solid #D95C1A`（客戶端）或 `2px solid #C49756`（後台）
- 錯誤文字在輸入框正下方，`#C0392B`，12px

### 載入狀態 (Loaders)
- Skeleton shimmer 與實際佈局同形狀
- **⚠ 禁止:** 通用圓形旋轉圈

### Emoji 使用政策（重大問題）
- **現況問題:** 導覽列 `⚙ 🍜`、按鈕 `🔑 🛒 👤 👋 ✦` — 全是 Emoji，渲染因系統而異
- **修正方向:** 全部替換為 SVG icon（16-20px），以品牌色填色

---

## 5. Layout Principles

### 登入頁面 (Split Screen)
```
[左側品牌視覺 40%] | [右側表單 60%]
grid-template-columns: 2fr 3fr
```
手機版（< 768px）：左側折疊，全寬表單

### 客戶端主頁 (Sidebar + Main)
```
[左側側欄 240px fixed] | [右側主內容 flex-grow]
```
手機版：側欄轉底部 Tab Bar（5個頁籤）

### POS 終端機 (Cockpit Grid)
```
[上方頂欄 54px] | [左側商品 50%] + [右側購物車 50%]
overflow: hidden — 禁止頁面捲動
```

#### 右側結帳欄三區固定結構（v2 規範）

右側欄採 `display:flex; flex-direction:column; height:100%; overflow:hidden`，內部嚴格分為三個不重疊區：

```
┌─────────────────────────────┐  flex-shrink: 0（固定，約 130px）
│  ZONE 1｜訂單頭部            │
│  訂單號 + 內用/外帶 + 清除鈕  │
│  會員點餐 / 訪客 身份選擇     │
├─────────────────────────────┤  flex: 1; min-height: 0; overflow-y: auto
│  ZONE 2｜捲動內容區           │
│  ▸ 購物車品項列表             │
│  ▸ 備註輸入欄                 │
│  ▸ 小計 / 合計               │
│  ▸ 活動贈品提示（可收合手風琴）│
├─────────────────────────────┤  flex-shrink: 0（固定，約 130px）
│  ZONE 3｜底部結帳區           │
│  付款方式選擇（現金/卡/行動）  │
│  結帳 ✓ 按鈕（高 52px）       │
└─────────────────────────────┘
```

**Zone 2 CSS 關鍵規則：**
- `flex: 1; min-height: 0` — `min-height:0` 是 flex 子元素能正確縮收的必要條件
- `overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent`

**Zone 3 CSS 關鍵規則：**
- `flex-shrink: 0`，頂部 `border-top: 1px solid rgba(255,255,255,0.08)`
- `background: #111927`（與 Carbon Panel 同色，視覺上與捲動區明確切割）

**活動贈品提示 — 可收合手風琴：**
- 預設展開，點擊標題列收合，箭頭 `∨/∧` 旋轉 180ms
- 收合後僅佔一行高度（約 40px），釋放捲動空間
- 已選贈品時標題列顯示已選文字（`已選：招牌滷蛋 × 2`）
- TS 用 `promoCollapseState = signal<Record<string,boolean>>({})` 管理各提示收合狀態

**⚠ 此結構的核心原則：** Zone 3 永遠固定可見，無論 Zone 2 內容多寡，員工永遠可以直接點結帳。

### 全域規則
- 所有互動元素最小 `44px` 觸控目標
- 全高 section 使用 `min-h-[100dvh]`，禁止 `h-screen`（iOS Safari 跳版）
- Grid 優先於 Flexbox calc() 百分比計算

---

## 6. Motion & Interaction

### Spring Physics
`stiffness: 120, damping: 18` — 比標準 Spring 稍硬，給「食物份量紮實」的品牌感

### 標準過場
- 頁面切換: `opacity 0→1 + translateY(8px→0), 280ms`
- Tab 切換: `opacity + scale(0.98→1), 180ms`
- 卡片出現: `stagger 40ms per item`

### 永久微動畫
- 客戶端 Logo 外圈: `spin 20s linear infinite`
- POS 金額變更: `scale(1.05→1)` 彈跳
- 線上指示燈: `pulse opacity 0.5↔1, 2s infinite`

### 效能規則
- 只動 `transform` 和 `opacity`，禁止 animate `top/left/width/height`

---

### POS 終端機動畫規範（v2）

**核心原則：動畫不能干擾點餐動作。**
所有動畫必須在員工觸碰的同一幀即時給出回饋，視覺效果在背景完成，不阻塞下一步操作。

#### 推薦動畫庫組合（Angular 專案）

| 層級 | 庫 | 大小 | 用途 |
|------|----|------|------|
| **Layer 1** | `@angular/animations` | 0（已內建） | 結構型動畫：手風琴開闔、Tab 切換、Slide-in Panel、路由過場 |
| **Layer 2** | `@formkit/auto-animate` | 1.9 kb | 列表型動畫：購物車品項新增/移除、活動卡片列表 |
| **Layer 3** | CSS `@keyframes`（純原生） | 0 | 持續型微動畫：刪除按鈕閃爍、狀態指示燈 Pulse、金額彈跳 |

> **不選 GSAP：** 功能過剩（80kb），ScrollTrigger / Timeline 在 POS 全無用武之地。
> **不選 AOS：** 基於 Scroll 事件，POS 禁止頁面捲動，完全無效。
> **不選 Framer Motion：** React 專屬。

#### 各場景動畫細節

| 場景 | 動畫方式 | 規格 |
|------|---------|------|
| 購物車品項加入 | `auto-animate` 自動偵測 | `translateY(6px)→0 + opacity 0→1, 180ms` |
| 購物車品項移除 | `auto-animate` 自動偵測 | `scale(0.95) + opacity→0, 140ms` |
| 合計金額跳動 | CSS `@keyframes pos-amount-pop` | `scale(1.06→1), 200ms ease-out` |
| 結帳成功確認 | `@angular/animations` state | 金色短閃 `opacity 0.5→1→0.5, 300ms` |
| 新增活動 Slide-in | `@angular/animations` enter/leave | `translateX(100%→0), 280ms cubic-bezier(0.22,1,0.36,1)` |
| 手風琴開闔 | `@angular/animations` expand | `height * → 0, 200ms ease` |
| Tab 頁籤切換 | `@angular/animations` | `opacity + translateX(4px→0), 160ms` |
| 已結束活動刪除鈕 | CSS `@keyframes promo-delete-blink` | 紅色光暈 `1.6s ease-in-out infinite` |
| 訂單看板狀態卡 | CSS `@keyframes` pulse | 指示燈 `opacity 0.5↔1, 2s infinite` |

#### `auto-animate` 安裝與使用
```bash
npm install @formkit/auto-animate
```
```typescript
import autoAnimate from '@formkit/auto-animate';
// 在 ngAfterViewInit 掛載到購物車列表容器
autoAnimate(this.cartListRef.nativeElement);
```

#### `@angular/animations` 手風琴範例
```typescript
trigger('accordionBody', [
  state('open',   style({ height: '*',  opacity: 1 })),
  state('closed', style({ height: '0', opacity: 0, overflow: 'hidden' })),
  transition('open <=> closed', animate('200ms ease')),
])
```

---

## 7. QR Code 掃碼點餐入口（規劃）

### 流程
```
顧客掃 QR Code
  → /qr-entry?branch={globalAreaId}&table={tableId}
  → 自動選擇分店 + 桌號，存入 sessionStorage
  → 跳過分店選擇，直接進 customer-guest（只輸入手機號）
  → 進入點餐頁（帶 globalAreaId 參數）
```

### QR Code 格式
```
https://yourdomain.com/qr-entry?branch=1&table=A3
```

### 新元件 `qr-entry`
- 從 QueryParam 讀取 `branch` 和 `table`
- 若 branch 無效 → 導向通用入口 `/customer-guest`
- 若有效 → 存 sessionStorage + 1.2s 品牌動畫後自動導向
- UI：全螢幕 Logo 旋轉 + 「正在載入您的桌位...」文字

---

## 8. 日本 & 韓國分店設計（規劃）

### 策略：品牌在地化延伸，不做通用「國際版」

#### 日本分店
| 元素 | 台灣原版 | 日本分店 |
|------|----------|----------|
| 主色 | `#D95C1A` 橘紅 | `#B5451A` 深煉丹橘（更沉穩）|
| 背景 | `#FFFAF3` 奶油 | `#FAF7F2` 和紙白（偏冷）|
| 字體 | Noto Sans TC | `Noto Sans JP` |
| 貨幣 | `NT$` | `¥`（匯率 API 自動換算）|
| 稅率 | 依設定 | 10% 內含稅（`INCLUSIVE`）|

#### 韓國分店
| 元素 | 台灣原版 | 韓國分店 |
|------|----------|----------|
| 主色 | `#D95C1A` 橘紅 | `#D94F2B` 韓辣橘紅（更飽和）|
| 背景 | `#FFFAF3` 奶油 | `#FFF8F5` 極淡粉（韓系清透）|
| 字體 | Noto Sans TC | `Noto Sans KR` |
| 貨幣 | `NT$` | `₩`（匯率 API 自動換算）|
| 稅率 | 依設定 | 10% 外加稅（`EXCLUSIVE`）|

### 實作方式（最少改動）
- `global_area.country` 已存在，`regions` 表已有稅率關聯
- `customer-home` 依 `globalAreaId` 注入 CSS 變數 + 語言字體
- 貨幣顯示用現有 `ExchangeRates API`
- 不需另建頁面，用 Angular Service 注入國家設定

---

## 9. Anti-Patterns（禁止清單）

| 類型 | 禁止項目 |
|------|----------|
| **Emoji** | 所有 UI Emoji 替換為 SVG（`🍜 🔑 ⚙ 🛒 👤 👋 ✦` 全數替換）|
| **字體** | `Inter`、`Arial`、`Helvetica`、`Times New Roman` |
| **顏色** | 純黑 `#000000`、霓虹漸層、無關聯紫色（`#c084fc` 需移除）|
| **排版** | 置中單欄 Hero 登入、三欄等寬卡片橫排 |
| **動畫** | animate `top/left/width/height`；過快（< 100ms）；無限閃爍 |
| **按鈕** | 外發光 box-shadow；漸層背景；自定義游標 |
| **文案** | "Seamless"、"Unleash"、"Next-Gen"、"探索更多" |
| **假資料** | 假統計數字、假訂單數據、假系統指標 |
| **圖片** | 破損 Unsplash 連結（用 picsum.photos 或 SVG 佔位）|
| **圖片格式** | `<img>` 無 `width/height`（造成 CLS 閃跳）|

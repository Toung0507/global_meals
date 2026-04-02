# 家用 Claude 同步更新文件

> 同步日期：2026-04-02
> 分支：`dev-Ataya`
> 給家用環境的 Claude Code 讀取，讓你快速了解現在的狀態。

---

## 本次完成的工作（2026-04-02）

### 1. Staff 登入 — 角色頁籤驗證（role-tab cross-validation）

**修改檔案：** `src/app/global_meals_login/staff-login/staff-login.component.ts`

在 `submitLogin()` 方法中新增身份互斥驗證：
- 若切換到「系統經理」頁籤但輸入的帳號 role 不是 `boss`，顯示錯誤並阻止登入
- 若切換到「現場收銀員」頁籤但輸入的帳號 role 是 `boss`，顯示錯誤並阻止登入

```typescript
if (this.activeRole === 'M' && user.role !== 'boss') {
  this.errorMsg = '此帳號非系統經理，請切換至「現場收銀員」分頁';
  return;
}
if (this.activeRole === 'S' && user.role === 'boss') {
  this.errorMsg = '此帳號非現場收銀員，請切換至「系統經理」分頁';
  return;
}
```

---

### 2. Manager Dashboard — 左側欄品牌區文字更新

**修改檔案：** `src/app/manager-dashboard/manager-dashboard.component.html`

Sidebar 品牌區變更：
- 標題：→ `懶飽飽餐飲管理系統`
- 副標題：→ `LazyBaoBaoSystem`
- Logo 元素改為 `<img class="sidebar-brand-logo">` 結構

---

### 3. Manager Dashboard — 整體切換為亮色主題

**修改檔案：** `src/app/manager-dashboard/manager-dashboard.component.scss`（完整重寫）

| 區域 | 舊主題 | 新主題 |
|------|--------|--------|
| Sidebar | 深色 (#0d1117) | 保持深色不變 |
| 主內容區背景 | 深色 | 亮色 #F4F6FA |
| 卡片 | 深色 (#1c2130) | 白色 #ffffff |
| 主要文字 | 接近白色 | 深藍 #1A2840 |
| 次要文字 | 灰色 #8892b0 | 深灰 #4A5A70 |
| 強調色 | 金黃 | 深金 #1E3A5F |

Bootstrap `.table` 強制覆蓋修正（加在 `.table-dark-custom td`）：
- Bootstrap 5 會用 `var(--bs-table-color)` 覆蓋 `td` 顏色，需在 td 上明確設 `color: #1A2840`

Sidebar Logo 調整：
- 尺寸：40px → 48px
- 新增：金色光暈邊框 + hover 動畫

UI Animation 新增（所有使用 `cubic-bezier(0.22, 1, 0.36, 1)`）：
- `.stat-card`：hover `translateY(-2px)` + 加深陰影
- `.content-card`：hover `translateY(-2px)`
- `.product-row`：hover 左側金色 4px border + 背景淡金
- `.promo-row`：hover `translateY(-1px)` + 加深陰影

---

### 4. Manager Dashboard HTML — 修正殘留深色 inline style 顏色

**修改檔案：** `src/app/manager-dashboard/manager-dashboard.component.html`

主題從暗色改亮色後，HTML 內 inline style 仍是近白色，導致文字在白底上不可見。
執行 13 組 `replace_all` 批次修正：

| 原始顏色 | 修正為 | 用途 |
|---------|--------|------|
| `color: #e2e8f8` | `color: #1A2840` | 商品名稱、區塊標題 |
| `color: #8892b0; font-size:0.82rem` | `color: #4A5A70; font-size:0.82rem` | 一般小字 |
| `color: #8892b0; font-size:0.78rem` | `color: #4A5A70; font-size:0.78rem` | 更小次要文字 |
| `color: #8892b0; font-size:0.75rem` | `color: #4A5A70; font-size:0.75rem` | 最小提示文字 |
| `color: #8892b0; margin-top` | `color: #4A5A70; margin-top` | 帶 margin 的次要文字 |
| `color: #f0c68c` | `color: #b08540` | 金色標籤（暗金適合白底） |
| `color: #fbbf24` | `color: #b45309` | 警告橙黃文字 |
| `color: #f87171` | `color: #dc2626` | 錯誤紅色文字 |

---

### 5. POS Terminal — 暗色主題對比度提升 + UI Animation

**修改檔案：** `src/app/pos-terminal/pos-terminal.component.scss`（完整重寫，保持暗色主題）

主要改動：
- 次要文字：`#8892b0` → `#a0aec0`（WCAG AA 對比度升級）
- 主要文字：統一使用 `#f1f5f9` / `#e2e8f8`
- `.tbl td` 明確設定 `color: #e2e8f8`（防 Bootstrap 覆蓋）

UI Animation 新增（全使用 `cubic-bezier(0.22, 1, 0.36, 1)`）：
- `.prod-card`：hover `translateY(-3px)` + 金色邊框 + 加深陰影
- `.prod-card:active`：`scale(0.97)` 按壓回饋
- `.qty-btn:active`：`scale(0.90)` 按壓回饋
- `.checkout-btn`：hover `translateY(-1px)` + 增強陰影
- `.stat-card`：hover `translateY(-2px)`
- `.order-board-card`：hover `translateY(-2px)`

---

### 6. 圖片素材需求清單（待搜集）

> 目前所有圖片位置均以色彩漸層 + emoji 佔位，以下為實物照片上架前所需規格。

#### 客戶點餐頁 (`customer-home`) — 首頁今日推薦卡

| # | 位置 | 餐點 | CSS class | 建議尺寸 | 格式 |
|---|------|------|-----------|---------|------|
| 1 | 首頁大卡（左側方圖） | 紅燒牛肉麵 | `.featured-img-beef` | **260 × 260 px** | WebP/JPG |
| 2 | 首頁小卡（頂部橫幅） | 印度奶油咖哩 | `.featured-img-curry` | **600 × 320 px** | WebP/JPG |
| 3 | 首頁小卡（頂部橫幅） | 越南牛肉河粉 | `.featured-img-pho` | **600 × 320 px** | WebP/JPG |

#### 客戶點餐頁 (`customer-home`) — 菜單商品卡

顯示規格：width 100% of card × height 150 px，`background-size: cover`

| # | 分類 | 餐點 | CSS class | 建議尺寸 | 格式 |
|---|------|------|-----------|---------|------|
| 4 | 🔥 熱門精選 | 紅燒牛肉麵 | `.mi-beef` | **500 × 300 px** | WebP/JPG |
| 5 | 🔥 熱門精選 | 印度奶油咖哩飯 | `.mi-curry` | **500 × 300 px** | WebP/JPG |
| 6 | 🔥 熱門精選 | 越南牛肉河粉 | `.mi-pho` | **500 × 300 px** | WebP/JPG |
| 7 | 🔥 熱門精選 | 叉燒豚骨拉麵 | `.mi-ramen` | **500 × 300 px** | WebP/JPG |
| 8 | 🧋 特調飲品 | 黑糖珍珠奶茶 | `.mi-bbt` | **500 × 300 px** | WebP/JPG |
| 9 | 🧋 特調飲品 | 抹茶拿鐵 | `.mi-matcha` | **500 × 300 px** | WebP/JPG |

#### POS 點餐頁 (`pos-terminal`) — 商品卡縮圖

顯示規格：width 100% of card × height 80 px，`background-size: cover`

| # | 餐點 | 英文名 | 建議尺寸 | 格式 |
|---|------|--------|---------|------|
| 10 | 紅燒牛肉麵 | Braised Beef Noodle | **320 × 160 px** | WebP/JPG |
| 11 | 印度奶油咖哩飯 | Butter Chicken Curry | **320 × 160 px** | WebP/JPG |
| 12 | 越南牛肉河粉 | Pho Bo | **320 × 160 px** | WebP/JPG |
| 13 | 三杯雞飯 | Three-Cup Chicken | **320 × 160 px** | WebP/JPG |
| 14 | 墨西哥辣雞捲 | Spicy Chicken Wrap | **320 × 160 px** | WebP/JPG |
| 15 | 凱薩沙拉 | Caesar Salad | **320 × 160 px** | WebP/JPG |
| 16 | 珍珠奶茶 | Bubble Tea | **320 × 160 px** | WebP/JPG |
| 17 | 招牌滷蛋 | Marinated Egg | **320 × 160 px** | WebP/JPG |
| 18 | 味噌湯 | Miso Soup | **320 × 160 px** | WebP/JPG |

> **合計：18 張**。牛肉麵、咖哩飯、河粉 3 道菜跨頁共用，建議拍一張高解析度原始照（≥ 1200 × 900 px）再依需求裁切。
> 圖片放置路徑建議：`public/assets/food/`

---

## 上次完成的工作（2026-03-30）

### 客戶端 Loading 動畫全面翻新（v4 完整版）

**修改檔案：**

| 檔案 | 異動說明 |
|------|---------|
| `src/app/shared/customer-loading/customer-loading.component.html` | 完全對應 loading_v4.html 結構：旋轉虛線軌道環、大圓 Logo、食物粒子、進度百分比列、三色狀態點 |
| `src/app/shared/customer-loading/customer-loading.component.scss` | 完全對應 loading_v4.html CSS（無 CSS 變數，全字面值）：雙橢圓輻射背景、spinR/L、logoFloat、badgeGlow、dotPop、shimAnim、blink |
| `src/app/shared/customer-loading/customer-loading.component.ts` | 改用 lottie-web（fetch JSON）+ requestAnimationFrame 百分比計數器（4.7s 節點），移除 CUSTOM_ELEMENTS_SCHEMA |
| `public/assets/scan-to-order.json` | 新增：Lottie 動畫 JSON 搬至 assets（原在專案根目錄） |
| `public/assets/scan-to-order.lottie` | 新增：Lottie 壓縮檔備份 |
| `README.md` | 更新 assets 區塊、加入 lottie-web/gsap 技術棧、更新日期 |

---

### 版面設計（完整對應 loading_v4.html）

**左側面板（290px 固定，orangex4 漸層）：**
- `::before`：頂部白色橢圓光 + 底部暗影材質
- `::after`：微細白色點陣格（opacity 0.06）
- `.orbit-1`（280px）順轉 24s / `.orbit-2`（230px）逆轉 18s — 虛線邊框
- `.logo-img`：230px 寬，drop-shadow 濾鏡，logoFloat 上下飄浮 11px
- `.left-brand`：金黃 #F0A500，LXGW WenKai TC，26px
- `.left-en`：白色半透明，Fraunces italic，13px
- `.left-badge`：金色底 + 金色邊框，badgeGlow 邊框脈動

**右側面板（flex:1，純白）：**
- `.lottie-box`：248×140px，圓角 18px，奶油漸層底，暖米邊框
- `.lottie-label`：兩側漸層橫線 + "Scan to Order"
- `.h-div`：全寬分隔線，兩端透明漸出
- `.pct-row`：左 "LOADING" + 右跳動百分比數字（DM Mono，22px）
- `.track`：height 8px，`.fill` fillAnim 4.7s + `.shimmer` 掃光
- `.status-row`：三色點（dotPop 放大脈動）+ "請稍候 · PLEASE WAIT"（blink）

---

### 動畫時間調整（+1.5 秒）

原始 loading_v4.html 為 3.2s，本次延長 1.5s 至 **4.7s**：

| 項目 | 原值 | 新值 |
|------|------|------|
| `fillAnim` CSS 動畫 | `3.2s` | `4.7s` |
| rAF 百分比計數器總時長 | 3200ms | 4700ms |
| 節點 t=700ms→35% | 700ms | 1030ms |
| 節點 t=1600ms→65% | 1600ms | 2350ms |
| 節點 t=2500ms→88% | 2500ms | 3670ms |
| 節點 t=3200ms→100% | 3200ms | 4700ms |

---

## 目前路由狀態（2026-04-02 更新）

| 路徑 | 元件 | 狀態 |
|------|------|------|
| `/` | → 導向 `/staff-login` | 正常 |
| `/staff-login` | `StaffLoginComponent` | 完成（含角色頁籤驗證） |
| `/customer-login` | `CustomerLoginComponent` | 完成 |
| `/customer-register` | `CustomerRegisterComponent` | UI 完成，待串接 API |
| `/customer-guest` | `CustomerGuestComponent` | UI 完成，待串接 API |
| `/customer-member` | `CustomerMemberComponent` | 完成（含 Loading 過場） |
| `/manager-dashboard` | `ManagerDashboardComponent` | UI 完成（亮色主題，含 6 頁籤） |
| `/pos-terminal` | `PosTerminalComponent` | UI 完成（暗色主題，含 6 頁籤） |

---

## 下一步（預計開發）

1. **照片素材上架**
   - 搜集 18 張實物食物照片（見本次工作 § 圖片素材需求清單）
   - 放置路徑：`public/assets/food/`
   - 替換 customer-home 的 CSS gradient + POS 的彩色 bg + emoji

2. **API 串接**
   - `CustomerRegisterComponent`、`CustomerGuestComponent` 待串接後端 API

3. **頁面跳轉動畫**
   - `app.component.ts` 加入 Angular Router Animation
   - `@angular/animations` 的 `trigger` + `transition`

---

## 目前檔案結構（dev-Ataya 分支）

```
src/app/global_meals_login/
├── staff-login/
├── customer-login/
├── customer-register/
└── customer-guest/

src/app/customer-member/

src/app/shared/
├── auth.service.ts
├── loading.service.ts
├── staff-loading/
└── customer-loading/          ← 本次全面翻新
    ├── customer-loading.component.html  ← 修改
    ├── customer-loading.component.scss  ← 修改
    └── customer-loading.component.ts    ← 修改

public/assets/
├── Logo.png
├── logo圓形.png
├── scan-to-order.json         ← 新增
└── scan-to-order.lottie       ← 新增
```

---

## 注意事項（延續記憶）

- **CSS 風格**：禁用 CSS Variables（`--color`、`var()`），全部直接寫值
- **TypeScript**：用 `styleUrls: []` 陣列、加 `standalone: true`、方法加 `: void`
- **HTML**：每個主要區塊加 `<!-- 中文說明 -->` 注釋
- **Git 流程**：開工前先 sync main，收工後發 PR，等隊長 merge
- **執行指令**：Claude 說明動作，由你自己執行
- **Lottie**：使用 `lottie-web`（npm 套件，非 CDN），載入 `assets/scan-to-order.json`
- **GSAP**：入場動畫（遮罩淡入 0.4s + 卡片彈出 0.7s elastic），已安裝

---

## 開工前的同步指令（給你自己執行）

```bash
git checkout main
git pull origin main
git checkout dev-Ataya
git merge main
npm install
ng serve
```

---

> 這份文件從筆電環境（2026-04-02）同步產生。
> 到家後在家用電腦的 Claude Code 裡說「讀取 HOME_CLAUDE_SYNC.md」，Claude 就能快速了解現在的開發狀態。

---

# 歷史紀錄

## 筆電同步（2026-04-02）

- Staff 登入角色頁籤互斥驗證（系統經理 / 現場收銀員帳號不可互用）
- Manager Dashboard SCSS 全面改亮色主題（sidebar 保持深色，主內容白底）
- Manager Dashboard HTML 修正 13 組 inline dark-color → 高對比淺色
- Manager Dashboard sidebar logo 48px 金色光暈，加入 UI Animation
- POS Terminal SCSS 次要文字 #8892b0 → #a0aec0，加入全頁 UI Animation
- 整理並記錄 18 張食物照片素材需求清單（含尺寸規格）

## 筆電同步（2026-03-30）

- 客戶端 Loading 動畫 v4 完整版實作（4.7s 進度條）
- lottie-web 本機載入 assets/scan-to-order.json

## 筆電同步（2026-03-27）

- 客戶端 Loading 動畫 v4 分割卡片版本設計
- 左側橘色漸層面板 + 右側 Lottie + 進度條
- lottie-web 引入，GSAP 入場動畫

## 筆電同步（2026-03-26）

- 新增 `CustomerRegisterComponent`（`/customer-register`）
- 新增 `CustomerGuestComponent`（`/customer-guest`）
- `angular.json` 預算調整（anyComponentStyle 10/16kB）
- `app.routes.ts` 路由註冊完成


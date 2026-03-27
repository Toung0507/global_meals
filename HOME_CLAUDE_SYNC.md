# 家用 Claude 同步更新文件

> 同步日期：2026-03-26
> 分支：`dev-Ataya`
> 給家用環境的 Claude Code 讀取，讓你快速了解現在的狀態。

---

## 本次完成的工作

### 1. 新增頁面元件（已完成）

| 元件 | 路徑 | 說明 |
|------|------|------|
| `CustomerRegisterComponent` | `/customer-register` | 客戶註冊表單（名稱、手機、密碼） |
| `CustomerGuestComponent` | `/customer-guest` | 訪客快速點餐（只需手機號碼，無需帳號） |

兩個元件都已在 `app.routes.ts` 完成路由註冊。

### 2. 修正 Angular build 預算錯誤

`angular.json` 的 `anyComponentStyle` 預算從 4/8 kB 調整為 10/16 kB，解決 `customer-login.component.scss`（8.50 kB）超出上限導致 build 失敗的問題。

### 3. 更新文件

- `README.md`：新增 4 個已完成路由到路由一覽、更新專案結構、更新預計功能勾選狀態
- `LAPTOP_SETUP.md`：同步新增路由、更新日期至 2026-03-26

---

## 目前路由狀態

| 路徑 | 元件 | 狀態 |
|------|------|------|
| `/` | → 導向 `/staff-login` | 正常 |
| `/staff-login` | `StaffLoginComponent` | 完成 |
| `/customer-login` | `CustomerLoginComponent` | 完成 |
| `/customer-register` | `CustomerRegisterComponent` | UI 完成，待串接 API |
| `/customer-guest` | `CustomerGuestComponent` | UI 完成，待串接 API |

---

## 下一步（預計開發）

### 優先項目

1. **頁面跳轉動畫**
   - 在 `app.component.ts` 加入 Angular Router Animation
   - 用 `@angular/animations` 的 `trigger` + `transition` 做頁面淡入/滑入效果
   - 需要在 `app.component.html` 的 `<router-outlet>` 外包一層加上 `@routeAnimation`

2. **客戶主頁面（商品列表含購物車）**
   - 新增元件：`customer-menu`（商品列表）
   - 資料來源：串接後端 API 取得菜單資料
   - 購物車：可用 Angular Service 或 localStorage 暫存購物清單
   - UI 參考：卡片式商品列表 + 右側浮動購物車小計

---

## 目前檔案結構（dev-Ataya 分支）

```
src/app/global_meals_login/
├── staff-login/
│   ├── staff-login.component.ts
│   ├── staff-login.component.html
│   └── staff-login.component.scss
├── customer-login/
│   ├── customer-login.component.ts
│   ├── customer-login.component.html
│   └── customer-login.component.scss
├── customer-register/
│   ├── customer-register.component.ts    ← 新增
│   ├── customer-register.component.html  ← 新增
│   └── customer-register.component.scss  ← 新增
└── customer-guest/
    ├── customer-guest.component.ts       ← 新增
    ├── customer-guest.component.html     ← 新增
    └── customer-guest.component.scss     ← 新增
```

---

## 注意事項（延續記憶）

- **CSS 風格**：禁用 CSS Variables（`--color`、`var()`），全部直接寫值
- **TypeScript**：用 `styleUrls: []` 陣列、加 `standalone: true`、方法加 `: void`
- **HTML**：每個主要區塊加 `<!-- 中文說明 -->` 注釋
- **Git 流程**：開工前先 sync main，收工後發 PR，等隊長 merge
- **執行指令**：Claude 說明動作，由你自己執行

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

> 這份文件是從筆電環境（2026-03-26）同步產生的。
> 到家後在家用電腦的 Claude Code 裡說「讀取 HOME_CLAUDE_SYNC.md」，Claude 就能快速了解現在的開發狀態。

---

---

# 筆電同步更新（2026-03-27）

> 同步日期：2026-03-27
> 分支：`dev-Ataya`

## 本次完成的工作

### 客戶端 Loading 過場動畫重新設計（v4 分割卡片版本）

**修改檔案：**

| 檔案 | 異動說明 |
|------|---------|
| `src/app/shared/customer-loading/customer-loading.component.html` | 全新 v4 分割卡片版面 |
| `src/app/shared/customer-loading/customer-loading.component.scss` | 全新 v4 樣式（暖橘奶油配色，無 CSS 變數） |
| `src/app/shared/customer-loading/customer-loading.component.ts` | 改用 lottie-web + GSAP，移除舊的 ldrs |
| `setting.md` | 新增客戶端 Loading 配色與技術規範 |

**版面設計：**
- 左側橘色漸層面板（#D95C1A → #A84210）：圓形 Logo + 三層品牌文字
- 右側白色面板：Lottie 食物動畫 + 進度條（1.4s 填至 95%）+ 跳動點點

**三層品牌文字顏色：**
1. `懶 飽 飽` → 純白 `#FFFFFF`（LXGW WenKai TC，36px）
2. `Global Meals` → 金黃 `#F0A500`（Fraunces serif，18px）
3. `✦ 懶懶吃，飽飽樂 ✦` → 暖奶油 `#FFF5E6`（半透白圓角徽章）

**觸發路徑（已完成 wiring）：**
- `staff-login` → 「客戶入口」按鈕 → `showCustomerLoading()` → `/customer-login`
- `customer-login` → 登入成功 → `showCustomerLoading()` → `/customer-member`

**技術套件：**
- `lottie-web`（已在 package.json，v5.13.0）— Lottie 動畫播放
- `gsap`（已安裝）— 入場動畫
- 無新增依賴

**⚠ 注意：Lottie 動畫 URL**
目前使用 LottieFiles CDN URL（dotlottie-wc Web Component），連結：
`https://lottie.host/a5148c1d-e6a7-4f06-9866-9d20624e3d3c/0itu4P5QY9.lottie`

已備份至專案根目錄（尚未搬移至 assets）：
- `Scan to Order.json`（lottie-web 可用的 JSON 格式）
- `Scan to Order.lottie`（dotlottie 壓縮格式，目前使用）

**下次可做**：把這兩個檔案搬到 `public/assets/lottie/`，改用本機路徑（避免 CDN 失效風險）

---

## 目前路由狀態

| 路徑 | 元件 | 狀態 |
|------|------|------|
| `/` | → 導向 `/staff-login` | 正常 |
| `/staff-login` | `StaffLoginComponent` | 完成 |
| `/customer-login` | `CustomerLoginComponent` | 完成 |
| `/customer-register` | `CustomerRegisterComponent` | UI 完成，待串接 API |
| `/customer-guest` | `CustomerGuestComponent` | UI 完成，待串接 API |
| `/customer-member` | `CustomerMemberComponent` | 完成（含 Loading 過場） |

---

## 下一步（預計開發）

1. **客戶主頁面（商品列表含購物車）**
   - 新增元件：`customer-menu`（商品列表）
   - UI 參考：卡片式商品列表 + 右側浮動購物車小計

2. **頁面跳轉動畫**
   - `app.component.ts` 加入 Angular Router Animation
   - `@angular/animations` 的 `trigger` + `transition`

---

> 這份更新從筆電環境（2026-03-27）同步。

# 家用 Claude 同步更新文件

> 同步日期：2026-03-30
> 分支：`dev-Ataya`
> 給家用環境的 Claude Code 讀取，讓你快速了解現在的狀態。

---

## 本次完成的工作（2026-03-30）

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

> 這份文件從筆電環境（2026-03-30）同步產生。
> 到家後在家用電腦的 Claude Code 裡說「讀取 HOME_CLAUDE_SYNC.md」，Claude 就能快速了解現在的開發狀態。

---

# 歷史紀錄

## 筆電同步（2026-03-27）

- 客戶端 Loading 動畫 v4 分割卡片版本設計
- 左側橘色漸層面板 + 右側 Lottie + 進度條
- lottie-web 引入，GSAP 入場動畫

## 筆電同步（2026-03-26）

- 新增 `CustomerRegisterComponent`（`/customer-register`）
- 新增 `CustomerGuestComponent`（`/customer-guest`）
- `angular.json` 預算調整（anyComponentStyle 10/16kB）
- `app.routes.ts` 路由註冊完成

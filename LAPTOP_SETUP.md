# 筆電開發環境設定指南 — Global Meals 專案

> 這份文件提供給 Claude Code 讀取，請照順序完成每個步驟。
> 專案：Global Meals（Angular 19 餐廳訂餐系統）
> 開發者分支：`dev-Ataya`
> 遠端 Repo：https://github.com/Toung0507/global_meals.git

---

## 本次同步事項（2026-04-02 更新）

以下為本輪開發完成的重大變更，筆電端 `git pull` 後請確認這些元件均正常顯示：

### 新增元件

| 元件路徑 | 說明 |
|---|---|
| `src/app/manager-dashboard/` | 老闆管理後台，含 `.ts` / `.html` / `.scss` 三檔 |
| `src/app/pos-terminal/` | 分店長 / 員工 POS 終端，含 `.ts` / `.html` / `.scss` 三檔 |
| `src/app/customer-home/` | 客戶主頁骨架，含 `.ts` / `.html` / `.scss` 三檔 |

### 修改檔案

| 檔案路徑 | 修改說明 |
|---|---|
| `src/app/shared/auth.service.ts` | 新增 3 個管理測試帳號；新增 `staffLogin()` 方法（僅驗證 boss / branch_manager / staff） |
| `src/app/global_meals_login/staff-login/staff-login.component.ts` | 加入 `FormsModule`、`submitLogin()` 方法、角色路由分流 |
| `src/app/global_meals_login/staff-login/staff-login.component.html` | 加入 `[(ngModel)]` 綁定、錯誤訊息區塊 |
| `src/app/global_meals_login/staff-login/staff-login.component.scss` | 新增 `.s-error-msg` 樣式 |
| `src/app/app.routes.ts` | 新增 `manager-dashboard`、`pos-terminal`、`customer-home` 路由 |
| `src/index.html` | 新增 Bootstrap 5.3.8 CDN（CSS + JS bundle）；新增 Noto Sans TC + IBM Plex Mono 字體 |
| `src/app/global_meals_login/customer-guest/` | 訪客快速點餐入口頁面更新（Lottie 動畫改為本機路徑） |
| `src/app/shared/customer-loading/` | 客戶端 Loading 元件更新（v4 分割卡片版本） |

### 新增資源

| 路徑 | 說明 |
|---|---|
| `public/assets/scan-to-order.lottie` | 掃碼點餐 Lottie 動畫（本機，取代 CDN） |
| `public/assets/scan-to-order.json` | 掃碼點餐 Lottie 動畫（JSON 格式備份） |
| `public/assets/logo圓形.png` | 品牌 Logo 圓形版（若筆電缺少此檔，請從辦公室電腦複製） |

### 待辦事項（筆電端確認）

- [ ] 執行 `npm install` 確認依賴套件同步
- [ ] 執行 `ng serve` 確認各頁面正常顯示
- [ ] 前往 `/staff-login` 測試三種角色登入流程
- [ ] 確認 `public/assets/logo圓形.png` 存在（Loading 動畫左側 Logo 使用）

---

## STEP 1 — 確認必要工具是否已安裝

請執行以下指令確認版本：

```bash
node --version        # 需要 v22.x.x
npm --version         # 需要 10.x.x 以上
ng version            # 需要 Angular CLI 19.x.x
git --version         # 任意版本均可
gh --version          # GitHub CLI，需要已安裝
```

---

## STEP 2 — 若工具尚未安裝，依序安裝

### Node.js v22 LTS
前往 https://nodejs.org 下載 v22 LTS 安裝包並安裝。

### Angular CLI 19
```bash
npm install -g @angular/cli@19
```

### GitHub CLI（gh）
```bash
winget install --id GitHub.cli
```
安裝後登入 GitHub：
```bash
gh auth login
# 選擇：GitHub.com → HTTPS → Login with a web browser
```

### Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```

---

## STEP 3 — Clone 專案並切換到自己的分支

```bash
# 1. Clone 整個 repo（放在 Desktop 的 團專 資料夾下）
git clone https://github.com/Toung0507/global_meals.git "C:/Users/%USERNAME%/Desktop/團專/global_meals"

# 2. 進入專案資料夾
cd "C:/Users/%USERNAME%/Desktop/團專/global_meals"

# 3. 切換到自己的分支
git checkout dev-Ataya
# 如果找不到分支，改用：
# git checkout -b dev-Ataya origin/dev-Ataya

# 4. 安裝相依套件
npm install

# 5. 啟動開發伺服器確認環境正常
ng serve
# 開啟瀏覽器前往 http://localhost:4200
```

---

## STEP 4 — 建立 Claude Code 記憶設定檔

> 這些設定讓 Claude Code 記住這個專案的協作規則與偏好。
> 請在筆電上依照下方內容，於對應路徑建立這些檔案。

### 目標資料夾路徑

```
C:\Users\[你的使用者名稱]\.claude\projects\c--Users---[你的使用者名稱]--Desktop----global-meals\memory\
```

> **提示**：專案路徑對應規則是把路徑的 `\` 換成 `-`、空格換成 `-`，所以 `C:\Users\X\Desktop\團專\global_meals` 會變成 `c--Users--X--Desktop----global-meals`（每個分隔符號轉成兩個 `-`，路徑轉小寫）。

### 4-A. MEMORY.md（記憶索引）

建立檔案：`memory/MEMORY.md`

```markdown
# Memory Index

- [執行決策說明方式](feedback_execution.md) — 使用者自己執行指令，Claude 先用繁體中文說明動作再讓使用者決定
- [傳統寫法與必要註解](feedback_code_style.md) — 禁用 CSS 變數與任何簡化語法，所有檔案須附說明性註解
- [團隊 Git 上傳流程](project_git_workflow.md) — 開工前同步 main、收工後發 PR、隊長審核合併的標準協作流程
```

### 4-B. feedback_execution.md

建立檔案：`memory/feedback_execution.md`

```markdown
---
name: 執行決策說明方式
description: 使用者希望自己執行指令，Claude 只需用繁體中文說明動作
type: feedback
---

執行安裝依賴、啟動服務、git 操作等指令前，先用繁體中文解釋要執行的動作是什麼，讓使用者自己決定是否執行。不要直接幫使用者跑指令。

**Why:** 使用者希望由自己的執行端操作，不要 Claude 代為執行。

**How to apply:** 需要執行任何 shell 指令時（npm install、ng serve、git 操作等），改為用繁體中文說明該指令的用途與效果，讓使用者自行執行。
```

### 4-C. feedback_code_style.md

建立檔案：`memory/feedback_code_style.md`

```markdown
---
name: 傳統寫法與必要註解
description: 使用者要求所有產生的 HTML/CSS/SCSS/TS 檔案禁用簡化語法，必須加上說明用的程式碼註解
type: feedback
---

禁用簡化語法，所有產生的 HTML、CSS、SCSS、TypeScript 等任何檔案，一律使用傳統完整寫法並附上說明用的中文或英文註解。

**Why:** 使用者和團隊成員為初學者或轉職者，需要能直接看懂每行程式碼的用途，簡化語法會造成閱讀困難。

**How to apply:**
- CSS/SCSS：禁用 CSS 自訂屬性（Custom Properties / CSS Variables），例如 `--color: #fff` 以及 `var(--color)`，改為直接將顏色值、數值寫進每條規則裡（如 `color: #ffffff;`）
- TypeScript：
  - 使用 `styleUrls: ['./xxx.component.scss']`（陣列形式），不用 `styleUrl`（單數）
  - 加上 `standalone: true` 明確宣告
  - 方法須有明確型別與 `: void` 回傳型別
  - 在 class 的重要區塊加上說明性註解
- HTML：在每個主要區塊加上 `<!-- 說明 -->` 型式的中文說明注釋
- 每個檔案頂部加上該檔案用途的說明性區塊註解
```

### 4-D. project_git_workflow.md

建立檔案：`memory/project_git_workflow.md`

```markdown
---
name: 團隊 Git 上傳流程
description: 開工前同步 main、收工後發 PR、隊長審核合併的標準協作流程
type: project
---

## 每日開工前（同步最新 main）

git checkout main
git pull origin main
git checkout dev-Ataya
git merge main

## 收工後（推送並發 PR）

git add .
git commit -m "描述"
git push origin dev-Ataya
# 然後去 GitHub 發 Pull Request

## 隊長（管理者）

- 收到 PR 後會進行審查
- 確認沒問題後按 Merge

## PR 被合併後（所有人）

- 看到 PR 被合併，重複「開工前」步驟

**Why:** 統一的 PR 流程確保 main 永遠是穩定版本，避免直接 push 到 main 造成衝突。
**How to apply:** 每次提醒使用者推送或合併時，依照此流程建議操作步驟。
```

---

## STEP 5 — 每次開工前的同步流程

```bash
git checkout main
git pull origin main
git checkout dev-Ataya
git merge main
npm install
ng serve
```

---

## 技術棧備忘

| 項目 | 版本 / 說明 |
|------|------------|
| Node.js | v22 LTS |
| npm | 10.x |
| Angular CLI | 19.x |
| Angular | 19.x（standalone components） |
| 樣式 | SCSS（無 CSS Variables，純傳統寫法） |
| Bootstrap | 5.3.8（CDN，全域引入於 index.html） |
| 字體（客戶端） | Fraunces、LXGW WenKai TC、DM Mono（Google Fonts） |
| 字體（管理端） | Noto Sans TC、IBM Plex Mono（Google Fonts） |
| 控制流 | Angular 17+ `@if` / `@for` 語法（非 `*ngIf` / `*ngFor`） |
| Lottie | dotlottie-wc 0.9.3（CDN）/ lottie-web（npm） |
| 動畫 | GSAP（npm，Loading 過場用） |
| GitHub CLI | gh（需 auth login） |

---

## 路由一覽

| 路徑 | 頁面 | 可存取角色 |
|------|------|-----------|
| `/` | 自動導向 `/staff-login` | — |
| `/staff-login` | 後台員工登入 | 所有人 |
| `/customer-login` | 前台顧客登入 | 所有人 |
| `/customer-register` | 客戶註冊 | 所有人 |
| `/customer-guest` | 訪客快速點餐（無需帳號） | 所有人 |
| `/customer-home` | 客戶主頁 | customer |
| `/customer-member` | 客戶會員中心 | customer |
| `/manager-dashboard` | 老闆管理後台 | boss |
| `/pos-terminal` | 分店長 / 員工 POS 終端 | branch_manager, staff |

---

## 開發分支說明

- `main` — 穩定版本，只接受 PR 合併，不直接 push
- `dev-Ataya` — 本人的開發分支（家齊）

---

## 測試帳戶

> 以下為本機 Mock 測試用帳戶，**請勿寫入公開文件或對外分享**。

**客戶會員帳戶**
- 電子郵件：`test@lazybao.com`
- 手機號碼：`0912-345-678`
- 密碼：`test1234`

**管理系統帳戶**（三種角色）
- 老闆：`admin@lazybao.com` / `admin1234`
- 分店長：`manager@lazybao.com` / `mgr1234`
- 員工：`staff@lazybao.com` / `staff1234`

---

> 文件最後更新：2026-04-02

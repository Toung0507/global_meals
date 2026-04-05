# 筆電開發環境設定指南 — Global Meals 專案

> 這份文件提供給 Claude Code 讀取，請照順序完成每個步驟。
> 專案：Global Meals（Angular 19 餐廳訂餐系統）
> 開發者分支：`dev-Ataya`
> 遠端 Repo：https://github.com/Toung0507/global_meals.git

---

## 本次同步事項（2026-04-05 第三次更新）

以下為本輪開發完成的重大變更（自 2026-04-02 第二次更新後新增），  
筆電端 `git pull` 後請確認這些元件均正常顯示：

### 新增元件 / 服務

| 元件路徑 | 說明 |
|---|---|
| `src/app/shared/order.service.ts` | **全新跨元件訂單狀態服務**（Signal 驅動）：客戶端下單 → POS 看板即時同步；POS 更新狀態 → 客戶追蹤即時同步 |
| `src/app/shared/api.config.ts` | 後端 API 設定預留檔（BASE_URL、ENDPOINTS），未來串接 API 使用 |

### 修改元件 — 客戶端（`customer-home`）

| 檔案路徑 | 修改說明 |
|---|---|
| `customer-home.component.ts` | 注入 `OrderService`；新增完整下單流程 `placeOrder()` + `_doPlaceOrder()`；新增訂單追蹤 computed（`trackingOrder`）；新增菜單分類篩選 signal（`activeMenuCategory`）+ 搜尋 signal（`menuSearchQuery`）；新增訂單管理頁籤資料（已完成 / 已取消 / 已退款）；新增會員累積消費進度邏輯（`memberOrderCount`、`ordersUntilDiscount`、`hasDiscountReady`）；新增防重複送出 signal（`isPlacingOrder`）；訪客限制：隱藏「訂單管理」頁籤、禁止開啟個人資料抽屜 |
| `customer-home.component.html` | 新增菜單分類篩選列 + 搜尋框；結帳頁改為完整流程（購物車 → 付款方式 → 送出）；新增訂單追蹤頁（4 狀態進度條）；新增訂單管理頁籤（3 子頁籤）；側邊欄新增個人資料抽屜（展開 / 編輯 / 密碼顯示切換）+ 累積消費進度條 |
| `customer-home.component.scss` | 配合新增頁籤與側邊欄抽屜的版型調整；新增追蹤頁、訂單管理頁、抽屜、進度條等 SCSS 區塊 |

### 修改元件 — POS 終端（`pos-terminal`）

| 檔案路徑 | 修改說明 |
|---|---|
| `pos-terminal.component.ts` | 注入 `OrderService`；結帳函式改為推送至 `OrderService`；新增分類篩選 signal（`activeCategory`）+ 搜尋 signal（`searchQuery`）；商品資料新增 `imgSrc` 欄位（真實食物照片路徑）；商品新增英文名稱 `eng` 欄位；POS 品牌名稱統一改為「懶飽飽」 |
| `pos-terminal.component.html` | 新增商品分類篩選列 + 搜尋框；商品卡改為有圖顯示真實照片、無圖 fallback emoji；結帳面板加入稅金（5%）顯示；新增滿額贈品提示（小計 < $300）；結帳成功 toast 顯示訂單號 |
| `pos-terminal.component.scss` | 配合搜尋列、商品卡照片、稅金面板的版型調整 |

### 修改元件 — 老闆後台（`manager-dashboard`）

| 檔案路徑 | 修改說明 |
|---|---|
| `manager-dashboard.component.ts` | 頁籤重新命名（見下方頁籤對照表）；新增 `tax` 頁籤（稅率設定）；新增 Toast 通知 signal（`toastMsg`、`toastLeaving`）；商品搜尋 + 分類篩選 signal；庫存 inline 調整 signal；活動啟用 / 停用 signal；稅率 inline 編輯 signal |
| `manager-dashboard.component.html` | 對應以上新增功能的 HTML 區塊 |
| `manager-dashboard.component.scss` | 淺色主題、移除 inline 深色樣式；新增 Toast 動畫、稅率設定頁樣式 |

**老闆後台頁籤對照（舊 → 新）：**

| 舊名稱 | 新名稱 | 說明 |
|--------|--------|------|
| 儀表板 | 綜合總覽 | 今日營業概覽 |
| 訂單管理 | 訂單管理 | 無變化 |
| 菜單管理 | 商品管理 | 新增搜尋 + 分類篩選 + 上/下架 |
| 促銷設定 | 活動管理 | 改為啟用 / 停用 toggle |
| 庫存管理 | 庫存管理 | 新增 inline 調整 |
| 員工帳號 | 帳號管理 | 分店長 / 員工子頁籤 |
| 財務報表 | 財務報表 | 無變化 |
| 系統設定 | 稅率設定 | 改為各國稅率 inline 編輯 |

### 修改共用服務

| 檔案路徑 | 修改說明 |
|---|---|
| `src/app/shared/auth.service.ts` | `updateProfile()` 修正：儲存後同步更新 `sessionStorage`，修復重整後個人資料回復的問題（ISSUE-003）；`currentUser` 初始化時從 `sessionStorage` 還原（頁面重整後不需重新登入） |
| `src/app/shared/loading.service.ts` | 新增 `showPosLoading()` 方法（POS 登入專用，副標題顯示「正在載入 POS 系統...」） |
| `src/app/shared/staff-loading/staff-loading.component.html` | 改為讀取 `loadingService.loadingSubtitle`（管理後台 vs POS 顯示不同文字） |
| `src/app/shared/staff-loading/staff-loading.component.ts` | 支援動態副標題（由 `LoadingService.loadingSubtitle` 驅動） |

### 設計系統（全端套用）

| 項目 | 說明 |
|---|---|
| 設計代字（Typography Tokens） | 客戶端、管理後台、POS 三端統一套用品牌字體（CSS Custom Properties 定義於各元件 SCSS） |
| 主題本地變數 | 各元件 SCSS 內以 `:host` 或 `.root` 層級定義 CSS 變數，供同元件內複用 |

> ⚠ **注意**：自本版本起，設計系統部分使用了 CSS Custom Properties（CSS 變數）定義主題色與字型 Token。這是設計系統架構的必要做法，僅限於主題定義層（`--color-brand` 等 Token）。元件的一般樣式仍使用傳統直接賦值寫法。

### 新增資源（本輪）

| 路徑 | 說明 |
|---|---|
| `public/assets/蚵仔煎.jpg` | POS + 今日優惠卡片照片 |
| `public/assets/三杯雞.jpg` | POS + 今日優惠卡片照片 |
| `public/assets/牛排.jpg` | POS + 今日優惠卡片照片 |
| `public/assets/黑糖珍珠奶茶.jpg` | POS 商品卡照片 |
| `public/assets/仙草奶茶.jpg` | POS 商品卡照片 |

### 修正（Bugfix）

| Issue | 說明 |
|---|---|
| ISSUE-001 | Bootstrap JS integrity hash 錯誤 → 已修正 `index.html` 的 CDN hash，解除瀏覽器阻擋 |
| ISSUE-003 | `updateProfile()` 更新後重整頁面資料回復 → 已修正為同步更新 `sessionStorage` |

### 待辦清單（筆電端 git pull 後確認）

- [ ] 執行 `npm install` 確認依賴套件同步
- [ ] 執行 `ng serve` 確認各頁面正常顯示
- [ ] 前往 `/customer-home` → 菜單頁 → 確認分類篩選 + 搜尋正常
- [ ] 前往 `/customer-home` → 結帳頁 → 選付款方式 → 點「確認下單」→ 確認跳至追蹤頁
- [ ] 前往 `/pos-terminal` → 確認訂單看板出現客戶端訂單（客戶端與 POS 即時同步）
- [ ] 前往 `/pos-terminal` → 點「開始備餐」→ 回到客戶端追蹤頁確認狀態更新
- [ ] 前往 `/pos-terminal` → 確認商品卡有食物照片（9 張）
- [ ] 前往 `/pos-terminal` → 分類篩選 + 搜尋正常
- [ ] 前往 `/manager-dashboard` → 確認 8 個頁籤名稱已更新
- [ ] 前往 `/manager-dashboard` → 稅率設定頁籤 → inline 編輯稅率正常
- [ ] 前往 `/customer-home` → 側邊欄 → 個人資料抽屜 → 編輯姓名後重整 → 確認資料保留
- [ ] 確認 `src/app/shared/order.service.ts` 存在

---

## 歷史同步紀錄

<details>
<summary>2026-04-02 第二次更新（點擊展開）</summary>

### 新增元件
- `src/app/manager-dashboard/`（老闆管理後台）
- `src/app/pos-terminal/`（POS 終端）
- `src/app/customer-home/`（客戶主頁骨架）

### 修改檔案
- `auth.service.ts`：新增 3 個管理測試帳號；新增 `staffLogin()` 方法
- `staff-login.component.ts`：加入 `FormsModule`、`submitLogin()`、角色路由分流
- `app.routes.ts`：新增 manager-dashboard、pos-terminal、customer-home 路由
- `index.html`：新增 Bootstrap 5.3.8 CDN；Noto Sans TC + IBM Plex Mono 字體
- `customer-home.component.html`：主廚推薦真實照片；首頁分類篩選；今日優惠橫向捲動

### 新增資源
- `public/assets/` 底下食物照片（招牌滷肉飯、古早味排骨、蚵仔麵線、阿三陽春麵等）
- `public/assets/logo圓形.png`
- `public/assets/scan-to-order.lottie` / `.json`

</details>

---

## STEP 1 — 確認必要工具是否已安裝

```bash
node --version        # 需要 v22.x.x
npm --version         # 需要 10.x.x 以上
ng version            # 需要 Angular CLI 19.x.x
git --version         # 任意版本均可
gh --version          # GitHub CLI，需要已安裝
bun --version         # 需要 1.x.x（gstack 必要）
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

### Bun（gstack 必要）
在 PowerShell（系統管理員）執行：
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```
安裝完成後重新開啟終端機，確認 `bun --version`。

---

## STEP 3 — Clone 專案並切換到自己的分支

```bash
# 1. Clone 整個 repo
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

## STEP 4 — 安裝 gstack（Claude Code 智慧助手）

> 完整安裝說明請參閱專案根目錄的 **`LAPTOP_GSTACK_SETUP.md`**，此處為快速摘要。

在 Git Bash 執行：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

安裝完成後，建立 `C:\Users\[你的使用者名稱]\.claude\CLAUDE.md`，貼入以下內容：

```markdown
## gstack
Use /browse skill from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review, /retro, /investigate, /document-release, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade
Skills location: ~/.claude/skills/gstack
Please always respond in Traditional Chinese (繁體中文).
```

驗證：在專案資料夾執行 `claude`，輸入 `/qa`，若出現 QA 流程提示即代表安裝成功。

---

## STEP 5 — 建立 Claude Code 記憶設定檔

> 這些設定讓 Claude Code 記住這個專案的協作規則與偏好，所有 session 都會套用。

### 目標資料夾路徑

```
C:\Users\[你的使用者名稱]\.claude\projects\c--Users---[你的使用者名稱]--Desktop----global-meals\memory\
```

> **路徑轉換規則**：把原始路徑的 `\` 換成兩個 `-`，路徑全部轉小寫。  
> 例：`C:\Users\齊\Desktop\團專\global_meals` → `c--Users--齊--Desktop----global-meals`

### 5-A. MEMORY.md（記憶索引）

建立檔案：`memory/MEMORY.md`

```markdown
# Memory Index

- [執行決策說明方式](feedback_execution.md) — 使用者自己執行指令，Claude 先用繁體中文說明動作再讓使用者決定
- [程式碼風格規範](feedback_code_style.md) — 傳統完整寫法、必要中文註解，設計系統 Token 層允許 CSS 變數
- [團隊 Git 上傳流程](project_git_workflow.md) — 開工前同步 main、收工後發 PR、隊長審核合併的標準協作流程
```

### 5-B. feedback_execution.md

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

### 5-C. feedback_code_style.md

建立檔案：`memory/feedback_code_style.md`

```markdown
---
name: 程式碼風格規範
description: 傳統完整寫法與必要中文註解，設計系統 Token 層允許 CSS 變數
type: feedback
---

所有產生的 HTML、CSS、SCSS、TypeScript 等任何檔案，一律使用傳統完整寫法並附上說明用的中文或英文註解。

**Why:** 使用者和團隊成員為初學者或轉職者，需要能直接看懂每行程式碼的用途，簡化語法會造成閱讀困難。

**How to apply:**
- CSS/SCSS：
  - 一般樣式：禁用 CSS 自訂屬性（var(--xxx)），直接將顏色值、數值寫進每條規則（如 color: #ffffff;）
  - 例外：設計系統 Token 定義層（如 --font-brand、--color-primary 等品牌字型與主色 Token）允許在 :host 或 :root 層以 CSS Custom Properties 定義，其他地方仍直接寫值
- TypeScript：
  - 使用 styleUrls: ['./xxx.component.scss']（陣列形式），不用 styleUrl（單數）
  - 加上 standalone: true 明確宣告
  - 方法須有明確型別與 : void 回傳型別
  - 在 class 的重要區塊加上說明性中文註解
- HTML：在每個主要區塊加上 <!-- 說明 --> 型式的中文說明注釋
- 每個檔案頂部加上該檔案用途的說明性區塊註解（/* === ... === */ 格式）
```

### 5-D. project_git_workflow.md

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

## STEP 6 — 每次開工前的同步流程

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
| Angular | 19.x（standalone components）|
| Angular Signals | 內建，所有動態狀態以 `signal()` / `computed()` 驅動 |
| 樣式 | SCSS（一般樣式直接賦值；設計 Token 層允許 CSS Custom Properties）|
| Bootstrap | 5.3.8（CDN，全域引入於 index.html，僅管理後台 / POS 使用）|
| 字體（客戶端） | Fraunces、LXGW WenKai TC、DM Mono（Google Fonts）|
| 字體（管理端） | Noto Sans TC、IBM Plex Mono（Google Fonts）|
| 控制流 | Angular 17+ `@if` / `@for` 語法（非 `*ngIf` / `*ngFor`）|
| lottie-web | 5.13.x（npm）|
| dotlottie-wc | 0.9.3（CDN）|
| gsap | 3.14.x（npm，Loading 過場動畫）|
| ldrs | 1.1.x（npm，純 CSS Loading 指示器）|
| aos | 2.3.4（npm，Animate On Scroll）|
| GitHub CLI | gh（需 auth login）|
| gstack | v0.15.2.1（~/.claude/skills/gstack）|

---

## 路由一覽

| 路徑 | 頁面 | 可存取角色 |
|------|------|-----------|
| `/` | 自動導向 `/staff-login` | — |
| `/staff-login` | 後台員工登入（系統經理 M / 現場收銀員 S）| 所有人 |
| `/customer-login` | 前台顧客登入 | 所有人 |
| `/customer-register` | 客戶註冊 | 所有人 |
| `/customer-guest` | 訪客快速點餐（僅需手機號碼）| 所有人 |
| `/customer-home` | 客戶主頁（5 頁籤）| customer、guest |
| `/customer-member` | 客戶會員中心 | customer |
| `/manager-dashboard` | 老闆管理後台（8 頁籤）| boss |
| `/pos-terminal` | 分店長 / 員工 POS 終端（6 頁籤）| branch_manager、staff |

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
- 老闆：`admin@lazybao.com` / `admin1234`（登入分頁：系統經理 M）
- 分店長：`manager@lazybao.com` / `mgr1234`（登入分頁：現場收銀員 S）
- 員工：`staff@lazybao.com` / `staff1234`（登入分頁：現場收銀員 S）

---

> 文件最後更新：2026-04-05（第三次，加入 OrderService、完整下單流程、POS 搜尋篩選、設計系統、gstack 安裝）

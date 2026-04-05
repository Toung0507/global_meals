# 懶飽飽 LazyBaoBao

> 台灣在地美食訂餐平台，提供客戶點餐、員工 POS 操作與老闆管理後台一體化解決方案。

---

## 專案簡介

**懶飽飽（LazyBaoBao）** 是一個以 Angular 19 開發的餐飲全端管理系統，包含三個主要入口：

- **客戶端**：會員登入、訪客快速點餐、完整下單流程（菜單 → 購物車 → 結帳 → 付款 → 訂單追蹤）
- **員工 POS 終端**：分店長與員工點餐收銀操作介面，含商品分類篩選、搜尋、稅金計算、訂單看板
- **老闆管理後台**：8 個功能頁籤全功能管理，含商品、庫存、活動、帳號、稅率、財務報表

---

## 技術棧

| 技術             | 版本 / 說明                                           |
| ---------------- | ----------------------------------------------------- |
| Angular          | 19.x（standalone components）                        |
| TypeScript       | 5.6.x                                                 |
| SCSS             | CSS Custom Properties（本地 theme 變數）              |
| Bootstrap        | 5.3.8（CDN，僅管理後台 / POS 使用）                  |
| Node.js          | 建議 v22 LTS                                          |
| lottie-web       | 5.13.x（npm）                                         |
| dotlottie-wc     | 0.9.3（CDN）                                          |
| gsap             | 3.14.x（Loading 動畫）                                |
| ldrs             | 1.1.x（純 CSS Loading 指示器）                        |
| aos              | 2.3.4（Animate On Scroll）                            |
| RxJS             | 7.8.x                                                 |
| Angular Signals  | 內建（Angular 19，所有狀態管理以 signal / computed 驅動） |

---

## 開發環境啟動

```bash
# 安裝依賴套件
npm install

# 啟動開發伺服器（預設 http://localhost:4200）
ng serve
```

---

## 測試帳號

| 角色     | Email                   | 密碼        | 手機號碼       |
| -------- | ----------------------- | ----------- | -------------- |
| 老闆     | admin@lazybao.com       | admin1234   | —              |
| 分店長   | manager@lazybao.com     | mgr1234     | —              |
| 員工     | staff@lazybao.com       | staff1234   | —              |
| 客戶會員 | test@lazybao.com        | test1234    | 0912-345-678   |
| 訪客     | —（不需帳號）           | —           | 任意手機號碼   |

> ⚠ 所有帳號為前端 Mock 假資料，未來串接後端 API 後全部替換。

---

## 路由一覽

| 路徑                 | 頁面                       | 可存取角色              |
| -------------------- | -------------------------- | ----------------------- |
| `/`                  | 自動導向 `/staff-login`    | —                       |
| `/staff-login`       | 管理系統登入               | 所有人                  |
| `/customer-login`    | 客戶入口登入               | 所有人                  |
| `/customer-register` | 客戶註冊                   | 所有人                  |
| `/customer-guest`    | 訪客快速點餐（無需帳號）   | 所有人                  |
| `/customer-home`     | 客戶主頁（菜單 + 購物車）  | customer、guest         |
| `/customer-member`   | 客戶會員中心               | customer                |
| `/manager-dashboard` | 老闆管理後台               | boss                    |
| `/pos-terminal`      | 分店長 / 員工 POS 終端     | branch_manager、staff   |

---

## 三種身份功能完整說明

---

### 一、客戶端（`/customer-home`）

適用角色：`customer`（正式會員）、`guest`（訪客）

#### 底部導覽列

| 頁籤     | 說明                                  | 訪客可用 |
| -------- | ------------------------------------- | -------- |
| 首頁     | 品牌展示、主廚推薦卡片、今日優惠橫向捲動 | ✅      |
| 菜單     | 全商品列表、分類篩選、關鍵字搜尋       | ✅      |
| 結帳     | 購物車確認、付款方式選擇、送出訂單     | ✅      |
| 追蹤     | 即時訂單狀態追蹤（waiting/cooking/ready/done）| ✅ |
| 訂單管理 | 歷史訂單（已完成 / 已取消 / 已退款）  | ❌ 隱藏 |

#### 菜單頁功能
- **分類篩選**：全部 / 飯食 / 麵食 / 小吃 / 輕食 / 飲品
- **關鍵字搜尋**：即時模糊比對商品名稱，分類與搜尋可同時作用
- **商品卡**：真實食物照片（有圖優先，無圖 fallback emoji + 漸層底色）
- **加入購物車**：點擊商品卡加入，重複點擊累加數量；觸覺回饋（`navigator.vibrate(30ms)`）

#### 結帳頁功能
- **購物車列表**：品項增減數量（減至 0 自動移除）、單項刪除、清空
- **付款方式**：信用卡 / 行動支付 / 現金 / 取貨付款（4 種）
- **訂單備註**：自由填寫備注欄
- **送出訂單**：
  1. 按下後顯示 spinner（防重複送出）
  2. 模擬後端處理延遲 1.2 秒
  3. 建立 `LiveOrder` 並推送至 `OrderService`（POS 看板即時同步）
  4. 新增至本地歷史訂單
  5. 清空購物車與備註
  6. 自動跳至訂單追蹤頁

#### 訂單追蹤頁
- 即時讀取 `OrderService.latestCustomerOrder()`
- 顯示訂單號碼、品項、金額、預估等待分鐘、狀態進度條
- 狀態：`waiting`（等待備餐）→ `cooking`（備餐中）→ `ready`（可取餐）→ `done`（完成）

#### 側邊欄（個人資料 / 訪客）
- **訪客**：顯示「訪客 G」頭像，無法開啟個人資料抽屜
- **會員**：點擊頭像卡展開個人資料抽屜（CSS Grid 動畫）
  - 可編輯姓名 / 手機 / 密碼（含密碼顯示切換）
  - 儲存後即時同步 `sessionStorage`，重整不回復
  - 累積消費進度條：每 10 筆解鎖折扣優惠

#### 訂單管理頁（僅會員）
- 子頁籤：已完成 / 已取消 / 已退款
- 顯示訂單 ID、日期、品項描述、金額
- 下單後即時插入最新訂單（最新在最上方）

---

### 二、員工 POS 終端（`/pos-terminal`）

適用角色：`branch_manager`（分店長）、`staff`（員工）

登入分頁：**現場收銀員**（`S` 頁籤）

#### 頁籤一覽

| 頁籤     | 說明                                      | 員工 | 分店長 |
| -------- | ----------------------------------------- | ---- | ------ |
| 點餐 POS | 商品卡點擊下單、購物車、結帳              | ✅   | ✅     |
| 訂單看板 | 依狀態分欄（waiting/cooking/done）、狀態流轉按鈕 | ✅ | ✅  |
| 庫存速查 | 各商品庫存量、低庫存 badge 警示、inline 調整數量 | ✅（唯讀） | ✅（可調整） |
| 促銷快覽 | 當前促銷活動列表                          | ✅   | ✅     |
| 員工帳號 | 帳號列表 + 新增員工 Modal + 停/復權       | ❌   | ✅     |
| 報表查詢 | 本店今日報表（待接後端）                  | ❌   | ✅     |

#### 點餐 POS 頁功能
- **分類篩選**：全部 / 台式 / 西式 / 飲品 / 輕食（按鈕切換）
- **關鍵字搜尋**：比對商品中文名稱 + 英文名稱
- **商品卡**：真實食物照片（9 件有圖）、hot / new / low badge、庫存顯示
- **購物車面板**：品項數量增減、小計、稅金（5%）、合計
- **滿額贈品提示**：小計未達 $300 時顯示「再 $XXX 享招牌滷蛋 × 2」
- **付款方式**：現金 / 信用卡 / 行動支付
- **結帳**：推送 `LiveOrder` 至 `OrderService`→ 客戶追蹤即時同步；顯示 3 秒結帳成功 toast

#### 訂單看板
- 三欄：等待備餐 / 備餐中 / 已完成
- 「開始備餐」按鈕：`waiting → cooking`
- 「完成取餐」按鈕：`cooking → done`
- 訂單卡顯示：訂單號、建立時間、品項、金額、付款方式、來源（POS / 客戶端）

#### 庫存速查（分店長 inline 調整）
1. 點擊「調整」→ 輸入框 inline 出現
2. 修改數量 → 確認
3. 顯示「已儲存」提示 1.8 秒後消失

#### 員工帳號管理（分店長專屬）
- 新增員工：姓名 / 帳號 / 班別（早班 / 晚班 / 假日班）
- 停用 / 恢復 員工帳號（即時切換）

#### 即時時鐘
- 右上角顯示 `YYYY/MM/DD 星期X HH:MM:SS`，每秒更新

---

### 三、老闆管理後台（`/manager-dashboard`）

適用角色：`boss`（老闆）

登入分頁：**系統經理**（`M` 頁籤）

#### 側邊欄 8 個頁籤

| 頁籤     | 說明                                                        |
| -------- | ----------------------------------------------------------- |
| 綜合總覽 | 今日營業額、訂單數、熱銷商品、低庫存警示卡片                |
| 訂單管理 | 即時訂單列表、狀態篩選（下拉）、分頁                        |
| 商品管理 | 商品列表、分類篩選 + 搜尋、上架 / 下架 toggle（Signal 驅動）|
| 活動管理 | 促銷活動列表、啟用 / 停用 toggle（Signal 驅動）             |
| 庫存管理 | 各分店食材庫存量、低庫存（< safeStock）紅色警示、inline 調整 |
| 帳號管理 | 分店長子頁籤 + 員工子頁籤，停 / 復權（Signal 驅動）        |
| 稅率設定 | 各國分店稅率（🇹🇼 台灣 5% / 🇯🇵 日本 10% / 🇹🇭 泰國 7%），inline 編輯 |
| 財務報表 | 月營收走勢圖、收入費用明細（靜態 UI）                       |

#### 商品管理功能
- 分類篩選：全部分類 / 台式 / 南洋 / 西式 / 飲品
- 關鍵字搜尋：即時比對商品名稱
- 上下架 toggle：Signal 即時切換，庫存為 0 時自動顯示「缺貨」狀態
- Toast 通知：操作後顯示底部 Toast，含淡出動畫

#### 帳號管理
- **分店長子頁籤**：顯示 branch 欄位（台灣台北店 / 日本東京店 / 泰國曼谷店）
- **員工子頁籤**：顯示班別（早班 / 晚班 / 全天）
- 停用 / 恢復：Signal 即時切換，灰色文字 + 刪除線表示已停用

#### 稅率設定
- Inline 編輯：點擊「編輯」→ input 出現 → 輸入新稅率 → 儲存
- 儲存後 Toast 通知

#### 即時時鐘
- 頂部導覽列顯示 `YYYY/MM/DD 星期X HH:MM:SS`，每秒更新

---

## 共用服務說明

### AuthService（`src/app/shared/auth.service.ts`）
| 方法 | 說明 |
| ---- | ---- |
| `login(account, password)` | 客戶登入（Email 或手機號碼 + 密碼），成功回傳 `true` |
| `staffLogin(email, password)` | 管理人員登入，成功回傳 `MockUser`，失敗回傳 `null` |
| `loginAsGuest(phone)` | 訪客登入，建立 guest `MockUser` |
| `logout()` | 清除 `currentUser` 與 `sessionStorage` |
| `updateProfile(name, phone, password)` | 更新個人資料並同步 `sessionStorage` |
| `getOrders()` | 取得假訂單資料（未來替換為 HTTP API） |

> `currentUser` 初始化時從 `sessionStorage` 還原，頁面重整後不需重新登入。

### LoadingService（`src/app/shared/loading.service.ts`）
| 方法 | 觸發時機 | 風格 |
| ---- | -------- | ---- |
| `showStaffLoading()` | boss 登入成功 | 深海軍藍 + 金黃圓環 |
| `showPosLoading()` | branch_manager / staff 登入成功 | 深海軍藍 + 金黃圓環（副標題不同） |
| `showCustomerLoading()` | 點擊「切換到客戶入口」 | 奶油白底 + 橘紅彈跳 |
| `hide()` | 頁面導覽完成後 | — |

### OrderService（`src/app/shared/order.service.ts`）★ 新增
- 全域單例服務（`providedIn: 'root'`），以 Angular Signal 驅動
- 維護所有進行中訂單的 `LiveOrder[]`
- `addOrder(order)` — 新增訂單（客戶端送出 or POS 結帳時呼叫）
- `updateStatus(id, status)` — 更新訂單狀態（POS 看板操作時呼叫）
- `waiting / cooking / ready / done` — computed，依狀態分組供 POS 看板使用
- `latestCustomerOrder` — computed，取最新一筆來源為 `customer` 的訂單，供客戶追蹤頁使用
- `generateOrderNumber()` — 自動遞增，格式 `A-XXX`
- `generateOrderId()` — 格式 `LBB-YYYYMMDD-XXXX`

**跨元件即時同步流程：**
```
客戶端下單 (placeOrder)
  → OrderService.addOrder()
  → POS 訂單看板即時更新（waiting 欄新增）

POS 點擊「開始備餐」
  → OrderService.updateStatus(id, 'cooking')
  → 客戶端追蹤頁即時更新（status → cooking）
```

---

## 專案結構

```
src/
├── app/
│   ├── global_meals_login/
│   │   ├── staff-login/          # 管理系統登入（系統經理 M / 現場收銀員 S 兩分頁）
│   │   ├── customer-login/       # 客戶入口登入（Email 或手機號碼）
│   │   ├── customer-register/    # 客戶註冊頁面
│   │   └── customer-guest/       # 訪客快速點餐（僅需手機號碼）
│   ├── customer-home/            # 客戶主頁（5 頁籤 Shell）
│   ├── customer-member/          # 客戶會員中心（個人資料 + 訂單紀錄）
│   ├── manager-dashboard/        # 老闆管理後台（8 個功能頁籤）
│   ├── pos-terminal/             # 分店長 / 員工 POS 終端（6 個頁籤）
│   ├── shared/
│   │   ├── auth.service.ts       # 帳號驗證服務（Mock，含 sessionStorage 持久化）
│   │   ├── loading.service.ts    # 全域 Loading 狀態服務（3 種風格）
│   │   ├── order.service.ts      # 跨元件即時訂單狀態服務（Signal 驅動）★ 新增
│   │   ├── api.config.ts         # 後端 API 路徑設定（未來串接用）
│   │   ├── staff-loading/        # 管理端 Loading 動畫元件（深藍金）
│   │   └── customer-loading/     # 客戶端 Loading 動畫元件（橘紅暖色）
│   ├── app.component.*           # 根元件（含兩組 Loading 遮罩）
│   └── app.routes.ts             # 路由設定
├── index.html                    # 入口 HTML（字體 + Bootstrap + dotlottie-wc CDN）
└── styles.scss                   # 全域樣式

public/
└── assets/
    ├── Logo.png                  # 品牌 Logo（方形）
    ├── logo圓形.png              # 品牌 Logo（圓形，Loading 頁使用）
    ├── 招牌滷肉飯.jpg            # POS + 客戶菜單照片
    ├── 古早味排骨.jpg            # POS + 客戶菜單照片
    ├── 蚵仔麵線.jpg              # POS + 客戶菜單照片
    ├── 蚵仔煎.jpg                # POS + 客戶菜單照片
    ├── 三杯雞.jpg                # POS + 客戶菜單照片
    ├── 牛排.jpg                  # POS + 客戶菜單照片
    ├── 黑糖珍珠奶茶.jpg          # POS + 客戶菜單照片
    ├── 仙草奶茶.jpg              # POS + 客戶菜單照片
    ├── 阿三陽春麵.jpg            # 客戶今日優惠卡片照片
    └── （其他食物照片待上傳）
```

---

## 已完成功能

### 基礎架構
- [x] Angular 19 Standalone Components 架構
- [x] Angular Router 路由設定（8 個頁面）
- [x] 全域 Loading 遮罩（`app.component` 雙層遮罩 + `LoadingService` 控制）
- [x] sessionStorage 登入持久化（重整不需重新登入）
- [x] AuthService Mock 帳號驗證（5 種角色）

### 客戶端
- [x] 客戶登入 / 訪客登入（手機號碼）
- [x] 客戶註冊頁面 UI
- [x] 客戶主頁 5 頁籤 Shell（首頁 / 菜單 / 結帳 / 追蹤 / 訂單管理）
- [x] 首頁：主廚推薦 3 張真實食物照片卡片
- [x] 首頁：今日優惠 6 張橫向捲動卡片（真實食物照片 + 劃線原價 + 特價）
- [x] 菜單頁：分類篩選（飯食 / 麵食 / 小吃 / 輕食 / 飲品）+ 關鍵字搜尋
- [x] 購物車：加入 / 增減 / 移除 / 清空，觸覺回饋
- [x] 結帳頁：4 種付款方式選擇 + 備註欄
- [x] 完整下單流程（防重複 spinner → OrderService → 跳追蹤頁）
- [x] 訂單即時追蹤（與 POS 看板狀態同步）
- [x] 個人資料抽屜（編輯姓名 / 手機 / 密碼 + sessionStorage 同步）
- [x] 累積消費進度條（每 10 筆折扣）
- [x] 訂單管理頁籤（已完成 / 已取消 / 已退款，下單後即時插入）
- [x] 訪客限制：隱藏「訂單管理」頁籤、禁止開啟個人資料抽屜

### POS 終端
- [x] 分店長 / 員工雙角色登入（同一頁面，分頁切換）
- [x] 點餐 POS：9 種商品（含真實食物照片）+ 分類篩選 + 搜尋
- [x] 購物車：增減數量、小計 / 稅金（5%）/ 合計
- [x] 滿額贈品提示（未達 $300 顯示提示）
- [x] 結帳 → 推送至 OrderService → 客戶追蹤即時同步
- [x] 即時時鐘（每秒更新）
- [x] 訂單看板：三欄分類（waiting / cooking / done）+ 狀態流轉按鈕
- [x] 庫存速查：分店長可 inline 調整庫存數量
- [x] 員工帳號管理（分店長專屬）：新增員工 Modal + 停/復權
- [x] 角色頁籤限制：員工隱藏「員工帳號」與「報表查詢」頁籤

### 老闆管理後台
- [x] boss 專屬登入保護
- [x] 8 個側邊欄頁籤
- [x] 即時時鐘
- [x] 商品管理：分類篩選 + 搜尋 + 上/下架 toggle
- [x] 活動管理：促銷啟用 / 停用 toggle
- [x] 庫存管理：低庫存警示 + inline 調整
- [x] 帳號管理：分店長 / 員工子頁籤 + 停/復權
- [x] 稅率設定：各國 inline 編輯
- [x] Toast 通知系統（操作回饋 + 淡出動畫）
- [x] 淺色主題（移除所有 inline 深色樣式）

### 設計系統
- [x] 設計代字（品牌字體套用）
- [x] 管理端主題：深海軍藍 × 金黃
- [x] 客戶端主題：暖橘奶油（活力橘紅 × 奶油白）
- [x] Bootstrap JS integrity hash 修正（ISSUE-001）

---

## 待辦事項

- [ ] 客戶端菜單商品卡補齊真實食物照片（目前部分仍用 CSS 漸層佔位）
- [ ] POS 商品卡補齊真實食物照片（目前 9 件有圖，招牌滷蛋 / 特定品項待上傳）
- [ ] Angular Router 頁面轉場動畫
- [ ] CustomerRegister 表單串接後端 API
- [ ] CustomerGuest 後端 session 紀錄
- [ ] 所有 API TODO 串接點替換（已在 AuthService 內以註解標記）
- [ ] POS 訂單看板狀態持久化（目前頁面重整後重置）
- [ ] 老闆後台財務報表接真實資料

---

## 變更紀錄（最近功能異動）

### 新增
| 項目 | 說明 |
| ---- | ---- |
| `OrderService` | 全新跨元件即時訂單服務，以 Signal 驅動，客戶下單 ↔ POS 看板雙向同步 |
| 客戶端完整下單流程 | 結帳頁 → 付款方式 → 送出（防重複）→ 推送 OrderService → 跳追蹤頁 |
| 客戶端訂單即時追蹤 | 透過 `OrderService.latestCustomerOrder` computed 即時同步 POS 狀態 |
| 客戶端訂單管理頁籤 | 已完成 / 已取消 / 已退款分頁，下單後即時插入 |
| 訪客限制邏輯 | 訪客隱藏「訂單管理」頁籤、禁止個人資料抽屜 |
| 累積消費進度條 | 側邊欄顯示累積訂單進度（每 10 筆折扣），`memberOrderCount` signal 驅動 |
| POS 分類篩選 + 搜尋 | 台式 / 西式 / 飲品 / 輕食分類，支援中英文名稱搜尋 |
| POS 稅金計算 | 小計 × 5% 稅金，顯示於購物車面板 |
| POS 滿額贈品提示 | 小計未達 $300 即顯示距離贈品差額提示 |
| POS 結帳成功 Toast | 結帳後顯示訂單號 3 秒 toast |
| 真實食物照片（菜單） | 招牌滷肉飯、古早味排骨飯、蚵仔麵線、蚵仔煎、三杯雞、牛排、黑糖珍珠奶茶、仙草奶茶 |
| 今日優惠 6 張卡片照片 | 阿三陽春麵、蚵仔煎、黑糖珍珠奶茶、牛排、仙草奶茶、三杯雞（橫向捲動） |

### 修改
| 項目 | 說明 |
| ---- | ---- |
| `AuthService.updateProfile()` | 儲存後同步更新 `sessionStorage`，修正重整後資料回復的問題（ISSUE-003） |
| `AuthService` 初始化 | 從 `sessionStorage` 還原 `currentUser`，登入狀態在分頁關閉前持續有效 |
| 老闆後台主題 | 全面改為淺色主題，移除 inline 深色樣式 |
| POS 品牌名稱 | 統一更新為「懶飽飽」品牌命名規範 |
| 設計代字 | 客戶端、後台、POS 三端套用品牌字體 |
| Bootstrap JS | 修正 integrity hash 錯誤，解除瀏覽器 CORS 阻擋（ISSUE-001） |

### 移除
| 項目 | 說明 |
| ---- | ---- |
| 老闆後台 inline 深色樣式 | 全部移除，改由 SCSS 主題變數統一管理 |
| 舊 skill 資料夾 | 移除舊版 skill 目錄，改用 `.skills_repo` 統一管理 |

---

## 團隊分支規範

```bash
# 開工前：同步最新 main
git checkout main && git pull origin main
git checkout dev-xxx && git merge main

# 收工後：推送並發 PR
git add .
git commit -m "描述"
git push origin dev-xxx
# → GitHub 發 Pull Request，等待隊長審核
```

### 分支命名
| 分支 | 用途 |
| ---- | ---- |
| `main` | 穩定版本，只接受 PR 合入 |
| `dev-Ataya` | 林家齊開發分支 |
| `dev-xxx` | 其他成員開發分支 |

---

> 文件最後更新：2026-04-05

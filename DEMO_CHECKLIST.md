# 懶飽飽 Demo 準備清單

> 版本：2026-04-21　　分支：dev-Ataya
>
> 目標：確認所有後端 API 串接正確、各角色流程完整、Demo 時 TW 語系跑真實資料、JP/KR 語系客戶端自動呈現假資料。

---

## 目錄

1. [環境啟動確認](#1-環境啟動確認)
2. [後端 API 串接狀態總覽](#2-後端-api-串接狀態總覽)
3. [切換真實後端步驟](#3-切換真實後端步驟)
4. [各角色完整流程測試清單](#4-各角色完整流程測試清單)
   - [4-A 老闆 (ADMIN) — Manager Dashboard](#4-a-老闆-admin--manager-dashboard)
   - [4-B 分店長 (REGION_MANAGER) — POS Terminal](#4-b-分店長-region_manager--pos-terminal)
   - [4-C 副店長 (MANAGER_AGENT) — POS Terminal](#4-c-副店長-manager_agent--pos-terminal)
   - [4-D 員工 (STAFF) — POS Terminal](#4-d-員工-staff--pos-terminal)
   - [4-E 客戶端 — 會員登入](#4-e-客戶端--會員登入)
   - [4-F 客戶端 — 訪客點餐](#4-f-客戶端--訪客點餐)
   - [4-G 客戶端 — 新會員註冊](#4-g-客戶端--新會員註冊)
5. [尚未串接 API 待辦清單（啟動前必須完成）](#5-尚未串接-api-待辦清單啟動前必須完成)
6. [Demo 語系策略實作清單（TW 真實 / JP-KR 假資料）](#6-demo-語系策略實作清單tw-真實--jp-kr-假資料)
7. [Demo 當天腳本](#7-demo-當天腳本)

---

## 1. 環境啟動確認

```
[ ] Node.js 版本 >= 18（node --version）
[ ] Angular CLI 已安裝（ng version）
[ ] Eclipse / Spring Boot 後端已啟動（http://localhost:8080）
[ ] MySQL 資料庫已啟動，schema 已跑完所有 migration SQL
[ ] ng serve 已啟動（http://localhost:4200）
[ ] ngrok 已啟動（ngrok http 4200）
[ ] 確認 ngrok 網址可以在手機瀏覽器正常開啟
```

---

## 2. 後端 API 串接狀態總覽

> 圖例：✅ 已串接真實 API　⚠️ 程式碼已寫好但 MOCK_MODE=true 擋住　❌ 尚未串接（仍用 hardcoded mock）

### 2-A Manager Dashboard（老闆後台）

| 功能 | API Endpoint | 狀態 |
|------|-------------|------|
| 載入分店清單 | GET `lazybaobao/global_area/get_all_branch` | ✅ |
| 新增分店 | POST `lazybaobao/global_area/create` | ✅ |
| 修改分店 | POST `lazybaobao/global_area/update` | ✅ |
| 刪除分店 | POST `lazybaobao/global_area/delete` | ✅ |
| 載入國家稅率 | GET `lazybaobao/regions/get_all_tax` | ✅ |
| 新增/修改稅率 | POST `lazybaobao/regions/upsert` | ✅ |
| 更新折扣上限 | POST `lazybaobao/regions/update_usage_cap` | ✅ |
| 載入活動清單 | GET `lazybaobao/promotions/list` | ✅ |
| 建立活動 | POST `lazybaobao/promotions/create` | ✅ |
| 啟用/停用活動 | POST `lazybaobao/promotions/toggle_status` | ✅ |
| 新增贈品規則 | POST `lazybaobao/promotions/add_gift` | ✅ |
| 載入商品清單 | GET `lazybaobao/products/get_all` | ⚠️ MOCK_MODE=true |
| 新增商品 | POST `lazybaobao/products/create` | ⚠️ MOCK_MODE=true |
| 修改商品 | POST `lazybaobao/products/update` | ⚠️ MOCK_MODE=true |
| 上/下架商品 | POST `lazybaobao/products/toggle` | ⚠️ MOCK_MODE=true |
| 載入庫存 | GET `lazybaobao/branch_inventory/:areaId` | ⚠️ MOCK_MODE=true |
| 更新庫存 | POST `lazybaobao/branch_inventory/update` | ⚠️ MOCK_MODE=true |
| 查詢月報表 | POST `find_monthly_reports` | ✅ (withCredentials) |
| 載入員工清單 | GET `api/admin/staff` | ❌ 仍用 hardcoded mock |
| 新增員工 | POST `api/admin/staff` | ❌ 尚未串接 |
| 停/復權員工 | PATCH `api/admin/staff/:id/status` | ❌ 尚未串接 |
| 訂單頁 | — | ❌ 尚未實作 API 呼叫 |

### 2-B POS Terminal（分店端）

| 功能 | API Endpoint | 狀態 |
|------|-------------|------|
| 今日訂單看板 | GET `lazybaobao/orders/today_orders` | ✅ |
| 更新廚房狀態 | POST `lazybaobao/orders/kitchen_status` | ✅ |
| 搜尋會員 | — | ❌ 仍用 hardcoded mock |
| 載入商品清單（POS） | GET `lazybaobao/products/active` | ❌ 仍用 mock 清單 |
| POS 下單 | POST `lazybaobao/orders/create_order` | ❌ TODO 已寫，尚未啟用 |
| POS 結帳 | POST `lazybaobao/orders/pay` | ❌ TODO 已寫，尚未啟用 |
| 調整庫存 | POST `lazybaobao/branch_inventory/update` | ❌ TODO 已寫，尚未啟用 |

### 2-C 員工登入

| 功能 | API Endpoint | 狀態 |
|------|-------------|------|
| 員工登入 | POST `api/auth/login` | ❌ 仍呼叫 `authService.staffLogin()` mock |
| 員工登出 | GET `api/auth/logout` | ✅（logout() 已呼叫 staffLogout）|

### 2-D 客戶端

| 功能 | API Endpoint | 狀態 |
|------|-------------|------|
| 會員登入 | POST `members/login` | ❌ 仍呼叫 `authService.login()` mock |
| 訪客登入 | POST `members/register_guest` | ❌ 仍呼叫 `authService.loginAsGuest()` mock |
| 新會員註冊 | POST `members/register_member` | ❌ 尚未串接 |
| 載入菜單 | GET `lazybaobao/products/active` | ⚠️ MOCK_MODE=true |
| 加入/更新購物車 | POST `lazybaobao/cart/sync_item` | ⚠️ MOCK_MODE=true |
| 刪除購物車品項 | DELETE `lazybaobao/cart/remove_item` | ⚠️ MOCK_MODE=true |
| 清空購物車 | DELETE `lazybaobao/cart/clear_cart` | ⚠️ MOCK_MODE=true |
| 成立訂單 | POST `lazybaobao/orders/create_order` | ⚠️ MOCK_MODE=true |
| 結帳（付款） | POST `lazybaobao/orders/pay` | ⚠️ MOCK_MODE=true |
| 查詢廚房狀態 | GET `lazybaobao/orders/order_status` | ✅ |
| 歷史訂單 | POST `lazybaobao/orders/get_all_orders` | ✅ |
| 修改密碼 | POST `members/update_password` | ❌ 尚未串接 |
| 更新個人資料 | — | ❌ 仍用 mock updateProfile() |

---

## 3. 切換真實後端步驟

### Step 1 — 開啟真實 API 模式

```typescript
// src/app/shared/api.config.ts
MOCK_MODE: false,   // ← 從 true 改為 false
```

> 改完後，所有帶 ⚠️ 標記的功能（Products / Cart / Orders / BranchInventory）就會發出真實 HTTP 請求。

### Step 2 — 確認 proxy.conf.json 存在且正確

```json
// proxy.conf.json（專案根目錄）
{
  "/lazybaobao": { "target": "http://localhost:8080", "changeOrigin": true },
  "/api":        { "target": "http://localhost:8080", "changeOrigin": true },
  "/members":    { "target": "http://localhost:8080", "changeOrigin": true },
  "/Orders":     { "target": "http://localhost:8080", "changeOrigin": true },
  "/find_monthly_reports": { "target": "http://localhost:8080", "changeOrigin": true },
  "/find_monthly_reports_by_date_range": { "target": "http://localhost:8080", "changeOrigin": true },
  "/get_revenue_reports":  { "target": "http://localhost:8080", "changeOrigin": true },
  "/exchange_rates":       { "target": "http://localhost:8080", "changeOrigin": true }
}
```

### Step 3 — 確認 angular.json 有配置 proxyConfig

```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### Step 4 — 確認後端 CORS 白名單

後端 `@CrossOrigin` 需包含：
```
http://localhost:4200
https://*.ngrok-free.app   (ngrok 正式版)
```

---

## 4. 各角色完整流程測試清單

### 4-A 老闆 (ADMIN) — Manager Dashboard

**登入**
```
[ ] 用帳號 admin@lazybao.com / admin1234 登入 Staff Login
[ ] 登入後自動跳轉至 /manager-dashboard
[ ] 頂部顯示：登入者姓名、即時時鐘、語系選擇
```

**綜合總覽頁籤**
```
[ ] 今日訂單數、營業額、活躍分店數、當月累積正確顯示
[ ] 最近訂單清單有資料（串接後須從後端取得）
```

**訂單管理頁籤**
```
[ ] 訂單清單可載入（⚠️ 目前 mock，需串接）
[ ] 篩選器（全部 / UNPAID / COMPLETED / CANCELLED / REFUNDED）正確過濾
[ ] 退款操作：POST /lazybaobao/orders/update_status → status: REFUNDED
[ ] 分頁功能正常
```

**商品管理頁籤**
```
[ ] 商品清單從後端 GET /lazybaobao/products/get_all 載入（需 MOCK_MODE=false）
[ ] 新增商品 → POST /lazybaobao/products/create → 清單即時更新
[ ] 編輯商品 → POST /lazybaobao/products/update → 資料即時更新
[ ] 上架/下架切換 → POST /lazybaobao/products/toggle → 狀態即時更新
[ ] 商品圖片上傳（imageBase64）正常
```

**促銷活動頁籤**
```
[ ] 活動清單從後端 GET /lazybaobao/promotions/list 載入
[ ] 建立新活動 → POST /lazybaobao/promotions/create → 清單即時更新
[ ] 啟用/停用活動 → POST /lazybaobao/promotions/toggle_status → 即時切換
[ ] 新增贈品規則 → POST /lazybaobao/promotions/add_gift → 活動下顯示
[ ] 已過期活動顯示「已結束」badge
```

**庫存管理頁籤**
```
[ ] 庫存清單從後端 GET /lazybaobao/branch_inventory/:areaId 載入（需 MOCK_MODE=false）
[ ] 低庫存（< 10）顯示警告色
[ ] 調整庫存 → POST /lazybaobao/branch_inventory/update → 數值即時更新
[ ] 分店切換（不同 globalAreaId）可查看不同分店庫存
```

**帳號管理頁籤**
```
[ ] ⚠️ 待串接：從後端 GET /api/admin/staff 載入員工清單（目前 hardcoded）
[ ] ⚠️ 待串接：新增員工 → POST /api/admin/staff
[ ] ⚠️ 待串接：停/復權 → PATCH /api/admin/staff/:id/status
[ ] 子頁籤「分店長」「員工」分別顯示 REGION_MANAGER、STAFF
```

**稅率管理頁籤**
```
[ ] 稅率清單從後端 GET /lazybaobao/regions/get_all_tax 載入
[ ] 修改稅率 → POST /lazybaobao/regions/upsert → 即時更新
[ ] 更新折扣上限 → POST /lazybaobao/regions/update_usage_cap → 即時更新
[ ] TW/JP/KR 各國稅率設定正確（TW=5%, JP=10%, KR=10% 等）
```

**財報頁籤**
```
[ ] 月份選擇 → POST /find_monthly_reports → 本月 + 上月對比圖表顯示
[ ] 圖表數字與資料庫實際訂單金額一致
```

**分店管理頁籤**
```
[ ] 分店清單從後端 GET /lazybaobao/global_area/get_all_branch 載入
[ ] 新增分店 → POST /lazybaobao/global_area/create → 清單即時更新
[ ] 編輯分店 → POST /lazybaobao/global_area/update → 資料即時更新
[ ] 刪除分店 → POST /lazybaobao/global_area/delete → 清單即時移除
[ ] 刪除有確認 Modal 防止誤刪
```

**登出**
```
[ ] 點「登出」→ 呼叫後端 GET /api/auth/logout → Session 清除 → 跳回 /staff-login
```

---

### 4-B 分店長 (REGION_MANAGER) — POS Terminal

> 測試帳號：manager@lazybao.com / mgr1234

**登入**
```
[ ] 登入後自動跳轉至 /pos-terminal
[ ] 頂部顯示：分店名稱、登入者姓名、角色 badge
[ ] ⚠️ 待串接：登入需改用後端 POST /api/auth/login（目前 mock）
```

**今日訂單看板**
```
[ ] 今日已付款訂單列表從後端 GET /lazybaobao/orders/today_orders 載入
[ ] 訂單狀態：WAITING / COOKING / READY 正確顯示
[ ] 點擊「備餐中」→ POST /lazybaobao/orders/kitchen_status → status: COOKING
[ ] 點擊「完成」→ POST /lazybaobao/orders/kitchen_status → status: READY
[ ] 每 30 秒自動輪詢更新（或有手動刷新按鈕）
```

**POS 點餐（分店長可使用）**
```
[ ] ⚠️ 待串接：商品清單從後端 GET /lazybaobao/products/active?globalAreaId=X 載入
[ ] 搜尋顧客手機號碼 → 顯示會員資訊（⚠️ 待串接）
[ ] 加入商品到購物車
[ ] 下單 → ⚠️ 待串接 POST /lazybaobao/orders/create_order
[ ] 結帳 → ⚠️ 待串接 POST /lazybaobao/orders/pay（paymentMethod 必填）
```

**庫存快速調整**
```
[ ] ⚠️ 待串接：調整庫存 → POST /lazybaobao/branch_inventory/update
```

**分店長專屬功能**
```
[ ] 分店長可查看今日所有員工訂單數統計（視 UI 設計是否有此功能）
```

---

### 4-C 副店長 (MANAGER_AGENT) — POS Terminal

> 測試帳號：deputy@lazybao.com / deputy1234

```
[ ] 登入後自動跳轉至 /pos-terminal
[ ] 確認副店長與分店長擁有相同 POS 功能（依後端 Role 判斷）
[ ] ⚠️ 待串接：登入需改用後端 POST /api/auth/login
[ ] 今日訂單看板正常（同 4-B）
[ ] POS 點餐流程正常（同 4-B）
```

---

### 4-D 員工 (STAFF) — POS Terminal

> 測試帳號：staff@lazybao.com / staff1234

```
[ ] 登入後自動跳轉至 /pos-terminal
[ ] ⚠️ 待串接：登入需改用後端 POST /api/auth/login
[ ] 確認員工是否有 POS 點餐權限（依後端 Role 判斷）
[ ] 今日訂單看板正常（同 4-B）
[ ] 無分店管理相關功能（僅操作層級）
```

---

### 4-E 客戶端 — 會員登入

> 測試帳號：0912-345-678 / test1234

```
[ ] 輸入手機號碼 + 密碼 → ⚠️ 待串接 POST /members/login
[ ] 登入成功 → 儲存 currentMember（memberId、name、phone）
[ ] 自動跳轉至 /customer-home
[ ] 橘色 Loading 動畫（6.2 秒）正常播放
[ ] 頂部顯示：歡迎 {name}、訂單歷史入口
```

**點餐流程**
```
[ ] 菜單商品從後端載入（MOCK_MODE=false 後）
[ ] 加入購物車 → POST /lazybaobao/cart/sync_item（cartId=null 第一次）
[ ] 增減數量 → POST /lazybaobao/cart/sync_item（cartId 帶已有 id）
[ ] 刪除品項 → DELETE /lazybaobao/cart/remove_item
[ ] 清空購物車 → DELETE /lazybaobao/cart/clear_cart
[ ] 贈品選擇（滿額）→ 顯示 availablePromotions → POST /lazybaobao/cart/select_gift
[ ] 會員 8 折優惠正確套用（memberId > 1 時 useCoupon=true）
[ ] 稅金顯示正確（taxInfo.taxType = INCLUSIVE/EXCLUSIVE）
```

**結帳**
```
[ ] 確認訂單 → POST /lazybaobao/orders/create_order
[ ] 付款頁顯示金額（totalAmount）
[ ] 信用卡 / 行動支付 → POST /lazybaobao/orders/pay（paymentMethod 必填）
[ ] 付款成功 → 跳轉至等待頁面
[ ] 廚房狀態輪詢 GET /lazybaobao/orders/order_status（每 5 秒）
[ ] 狀態 READY → 顯示「餐點已準備好，請取餐！」
```

**會員中心**
```
[ ] 歷史訂單 POST /lazybaobao/orders/get_all_orders（memberId）正確顯示
[ ] 訂單狀態（COMPLETED / CANCELLED / REFUNDED）正確顯示
[ ] 修改密碼 → ⚠️ 待串接 POST /members/update_password
[ ] 個人資料更新 → ⚠️ 待串接（目前 mock）
[ ] 登出後清除 Session → 回到 /customer-login
```

---

### 4-F 客戶端 — 訪客點餐

```
[ ] 輸入手機號碼（≥8碼）→ 進入 /customer-home
[ ] ⚠️ 待串接：呼叫 POST /members/register_guest（目前 loginAsGuest() mock）
[ ] 訪客 memberId 固定傳 1（後端定義）
[ ] 訪客無 8 折優惠（useCoupon=false）
[ ] 點餐 → 結帳 → 廚房輪詢流程同 4-E
[ ] 訪客無「歷史訂單」頁面（或顯示無法查詢提示）
[ ] 語系切換（JP/KR）→ 觸發假資料模式（見第 6 節）
```

---

### 4-G 客戶端 — 新會員註冊

```
[ ] 填寫姓名、手機、密碼 → ⚠️ 待串接 POST /members/register_member
[ ] 手機號碼重複 → 後端 code != 200 → 前端顯示錯誤訊息
[ ] 註冊成功 → 跳轉至 /customer-login
[ ] 語系切換後，所有欄位 placeholder、label 正確翻譯（TW/JP/KR）
```

---

## 5. 尚未串接 API 待辦清單（啟動前必須完成）

> 依優先順序排列。前三項影響 Demo 核心流程，必須在 Demo 前完成。

### 🔴 P0（Demo 核心路徑）

| # | 元件 | 問題 | 修正方式 |
|---|------|------|---------|
| 1 | `staff-login` | 呼叫 `authService.staffLogin()` mock | 改為 `authService.loginStaffApi(account, password).subscribe(...)` |
| 2 | `customer-login` | 呼叫 `authService.login()` mock | 改為 `authService.loginMember(phone, password).subscribe(...)` |
| 3 | `api.config.ts` | `MOCK_MODE: true` | 改為 `MOCK_MODE: false` |

### 🟡 P1（功能完整性）

| # | 元件 | 問題 | 修正方式 |
|---|------|------|---------|
| 4 | `customer-register` | 未呼叫 `/members/register_member` | 注入 `ApiService`，呼叫 `registerMember(req)` |
| 5 | `customer-guest` | `loginAsGuest()` 未呼叫後端 | 呼叫 `apiService.registerGuest(req)` 取得真實 memberId |
| 6 | `pos-terminal` | POS 下單流程的 TODO block 未啟用 | 解開 createOrder + pay 的 TODO 註解 |
| 7 | `manager-dashboard` | 帳號頁籤用 hardcoded 假資料 | 呼叫 `apiService.getAllStaff()` + `createStaff()` + `updateStaffStatus()` |

### 🟢 P2（錦上添花）

| # | 元件 | 問題 | 修正方式 |
|---|------|------|---------|
| 8 | `customer-member` | 密碼修改未串接 | 呼叫 `apiService.updateMemberPassword(req)` |
| 9 | `pos-terminal` | 會員搜尋未串接 | 考慮呼叫 `GET /lazybaobao/orders/get_order_by_phone` 或新增 member search endpoint |
| 10 | `manager-dashboard` | 訂單頁籤無 API | 評估是否要串接 orders 列表 |

---

## 6. Demo 語系策略實作清單（TW 真實 / JP-KR 假資料）

### 目標

| 語系 | 客戶端資料來源 | 說明 |
|------|-------------|------|
| 🇹🇼 TW | 真實後端 API | 完整功能，真實訂單、會員折扣、庫存 |
| 🇯🇵 JP | 前端假資料 | 自動切換假菜單、假訂單，不呼叫後端 |
| 🇰🇷 KR | 前端假資料 | 自動切換假菜單、假訂單，不呼叫後端 |

### 實作步驟

#### Step 1 — 在 `customer-home.component.ts` 加入語系判斷

在 `loadMenuProducts()` 函式開頭，加入：

```typescript
private loadMenuProducts(): void {
  const country = this.branchService.country;  // 'TW' | 'JP' | 'KR'

  if (country === 'JP' || country === 'KR') {
    // 假資料模式：不呼叫後端，直接填入翻譯好的假菜單
    this.products.set(this.getMockProductsByCountry(country));
    return;
  }

  // TW：呼叫真實後端
  const areaId = this.branchService.config.globalAreaId;
  this.apiService.getActiveProducts(areaId).subscribe({ ... });
}
```

#### Step 2 — 新增 JP/KR 假菜單資料

```typescript
private getMockProductsByCountry(country: 'JP' | 'KR'): ProductVO[] {
  const JP_PRODUCTS: ProductVO[] = [
    { id: 101, name: 'ラーメン', category: '麺類', description: '濃厚豚骨スープ', active: true, basePrice: 980, stockQuantity: 50, maxOrderQuantity: 5 },
    { id: 102, name: '餃子セット', category: '小皿', description: '手作り焼き餃子', active: true, basePrice: 550, stockQuantity: 30, maxOrderQuantity: 5 },
    { id: 103, name: '抹茶ラテ', category: '飲み物', description: '京都産抹茶使用', active: true, basePrice: 680, stockQuantity: 40, maxOrderQuantity: 5 },
  ];
  const KR_PRODUCTS: ProductVO[] = [
    { id: 201, name: '비빔밥', category: '밥류', description: '신선한 야채와 고추장', active: true, basePrice: 12000, stockQuantity: 50, maxOrderQuantity: 5 },
    { id: 202, name: '삼겹살', category: '구이', description: '국내산 삼겹살', active: true, basePrice: 18000, stockQuantity: 25, maxOrderQuantity: 5 },
    { id: 203, name: '아이스 아메리카노', category: '음료', description: '에스프레소 더블샷', active: true, basePrice: 4500, stockQuantity: 99, maxOrderQuantity: 5 },
  ];
  return country === 'JP' ? JP_PRODUCTS : KR_PRODUCTS;
}
```

#### Step 3 — 結帳流程也要阻擋後端呼叫（JP/KR）

在 `checkout()` 函式開頭加入：

```typescript
if (country === 'JP' || country === 'KR') {
  // 假 Demo 模式：直接進入付款成功畫面，不呼叫後端
  this.showMockPaymentSuccess();
  return;
}
// TW：繼續正常 createOrder → pay 流程
```

#### Step 4 — 廚房輪詢也要跳過（JP/KR）

在 `startKitchenPolling()` 中：

```typescript
if (country === 'JP' || country === 'KR') {
  // 模擬 15 秒後「餐點已準備好」
  setTimeout(() => this.kitchenStatus.set('READY'), 15000);
  return;
}
// TW：正常輪詢後端
```

#### Step 5 — 歷史訂單（JP/KR 顯示假資料）

```typescript
[ ] customer-member 的歷史訂單，若 country 為 JP/KR，顯示假訂單清單
[ ] 假訂單需依語系顯示對應貨幣（JP=¥, KR=₩）
```

#### Step 6 — 測試確認

```
[ ] 切換至 TW → 菜單從後端載入，商品名稱為中文，可正常點餐結帳
[ ] 切換至 JP → 菜單自動切換成日文假資料（不呼叫後端），結帳走 mock 流程
[ ] 切換至 KR → 菜單自動切換成韓文假資料（不呼叫後端），結帳走 mock 流程
[ ] 後端 console 確認：JP/KR 切換時無任何 HTTP 請求發出
[ ] 三種語系切換後，所有 UI 文字（按鈕、label、error message）均正確翻譯
```

---

## 7. Demo 當天腳本

### 開場（老闆視角，5 分鐘）

```
1. 開啟 Manager Dashboard → 介紹 8 個頁籤
2. 展示分店清單（TW / JP / KR 分店）
3. 展示促銷活動（滿 300 送薯條活動）
4. 展示商品管理（上/下架切換）
5. 展示財報（月報表圖表）
```

### 客戶端點餐（TW 語系，真實資料，10 分鐘）

```
1. 手機掃 ngrok QR Code
2. 選擇「台灣語系」
3. 走訪客流程：輸入手機號碼 → 進入菜單
4. 加入商品 → 加到觸發贈品門檻（300元）→ 選贈品
5. 結帳 → 行動支付流程 → 付款成功
6. 後台 POS Terminal 即時顯示新訂單
7. 廚房更新狀態：COOKING → READY
8. 客戶端畫面自動更新為「取餐通知」
```

### 外國分店語系 Demo（JP/KR 假資料，5 分鐘）

```
1. 在客戶端語系選擇切換至「日本語」
2. 展示日文菜單（假資料，但 UI 完整）
3. 加入商品 → 結帳（mock 流程，不寫入後端）
4. 切換至「한국어」重複展示
5. 說明：「正式上線時，日韓分店只需在後台設定 globalAreaId，
         即可串接真實商品與訂單，語系已預先完成」
```

### POS Terminal 展示（5 分鐘）

```
1. 用分店長帳號登入 POS
2. 展示今日訂單看板（含剛才客戶下的單）
3. 更新廚房狀態 COOKING → READY
4. 展示 POS 直接點餐（現場客人用）
```

---

## 後端測試帳號速查

| 角色 | 帳號 | 密碼 | 路由 |
|------|------|------|------|
| 老闆 (ADMIN) | admin@lazybao.com | admin1234 | /manager-dashboard |
| 分店長 (REGION_MANAGER) | manager@lazybao.com | mgr1234 | /pos-terminal |
| 副店長 (MANAGER_AGENT) | deputy@lazybao.com | deputy1234 | /pos-terminal |
| 員工 (STAFF) | staff@lazybao.com | staff1234 | /pos-terminal |
| 客戶（會員）| 0912-345-678 | test1234 | /customer-home |
| 客戶（訪客）| 任意手機號碼（≥8碼）| — | /customer-home |

---

> 最後更新：2026-04-21　　維護：林家齊 (dev-Ataya)

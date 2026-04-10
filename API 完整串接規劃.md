# API 完整串接規劃

> 最後更新：2026-04-09
> 負責人：dev-Ataya 分支
> Demo 日期：4/13（第一版，全程使用 mock 資料）

---

## 目錄

1. [整體架構說明](#整體架構說明)
2. [已預寫完成的檔案](#已預寫完成的檔案)
3. [後端已有 API（可立即串接）](#後端已有-api可立即串接)
4. [後端待建立 API（前端已標記 TODO）](#後端待建立-api前端已標記-todo)
5. [各元件串接步驟](#各元件串接步驟)
6. [串接前置作業](#串接前置作業)
7. [資料型別對照表](#資料型別對照表)

---

## 整體架構說明

```
前端 Angular (localhost:4200)
        │
        ▼
src/app/shared/api.service.ts   ← 所有 HTTP 呼叫集中在此
        │
        ▼ HTTP Request
後端 Spring Boot (localhost:8080)
        │
        ▼
MySQL 資料庫 global_meals
```

### 目前狀態（4/13 Demo 前）

| 類別 | 狀態 |
|---|---|
| mock 資料 | ✅ 全部正常，Demo 安全 |
| `api.service.ts` | ✅ 已建立，所有方法待命 |
| `api.config.ts` | ✅ 所有端點已對齊後端路由 |
| `provideHttpClient()` | ✅ 已加入 app.config.ts |
| 各元件 TODO 區塊 | ✅ 已預寫並全部註解，不影響現有功能 |
| 後端 API 串接 | ⏳ Demo 後逐步開啟 |

---

## 已預寫完成的檔案

| 檔案 | 說明 | 串接時操作 |
|---|---|---|
| `src/app/shared/api.config.ts` | 所有 API 端點常數 | 填入 `BASE_URL` |
| `src/app/shared/api.service.ts` | 所有 API 方法 + 型別定義 | 在元件中注入即可使用 |
| `src/app/app.config.ts` | 已加入 `provideHttpClient()` | 無需修改 |
| `manager-dashboard.component.ts` | 分店/稅率 TODO 區塊 | 取消對應註解 |
| `customer-home.component.ts` | 菜單/下單/訂單歷史 TODO 區塊 | 取消對應註解 |
| `pos-terminal.component.ts` | 商品/會員查詢/結帳/庫存 TODO 區塊 | 取消對應註解 |

---

## 後端已有 API（可立即串接）

> 後端位置：`global_meals_gradle/src/main/java/.../controller/`

### Cart API — `CartController.java`

| Method | 路徑 | 用途 | 前端對應方法 |
|---|---|---|---|
| GET | `/api/cart/{cartId}` | 查看購物車 | `apiService.viewCart()` |
| POST | `/api/cart/sync` | 新增/更新商品數量 | `apiService.syncCart()` |
| DELETE | `/api/cart/item` | 刪除購物車單品 | `apiService.removeCartItem()` |
| POST | `/api/cart/coupon` | 套用/取消折價券 | `apiService.applyCoupon()` |

### Orders API — `OrdersController.java`

| Method | 路徑 | 用途 | 前端對應方法 |
|---|---|---|---|
| POST | `/Orders/createOrdersRes` | 成立訂單（UNPAID） | `apiService.createOrder()` |
| POST | `/Orders/pay` | 結帳（→ COMPLETED） | `apiService.pay()` |
| POST | `/Orders/GetAllOrdersList` | 取得歷史訂單 | `apiService.getAllOrders()` |
| GET | `/Orders/getOrderByPhone` | 以電話查詢待取訂單 | `apiService.getOrderByPhone()` |
| POST | `/Orders/ordersStatus` | 退款 / 取消訂單 | `apiService.updateOrderStatus()` |

### GlobalArea API — `GlobalAreaController.java`

| Method | 路徑 | 用途 | 前端對應方法 |
|---|---|---|---|
| GET | `/global_area/get_all_branch` | 取得全部分店 | `apiService.getAllBranches()` |
| POST | `/global_area/create` | 新增分店 | `apiService.createBranch()` |
| POST | `/global_area/update` | 修改分店 | `apiService.updateBranch()` |
| POST | `/global_area/delete` | 刪除分店 | `apiService.deleteBranch()` |

### Regions API — `RegionsController.java`

> ⚠️ 路由前綴為 `/lazybaobao`（後端設計如此）

| Method | 路徑 | 用途 | 前端對應方法 |
|---|---|---|---|
| GET | `/lazybaobao/regions/get_all_tax` | 取得全部稅率 | `apiService.getAllTax()` |
| POST | `/lazybaobao/regions/create` | 新增國家稅率 | `apiService.createRegion()` |
| POST | `/lazybaobao/regions/update` | 更新國家稅率 | `apiService.updateRegion()` |

### ExchangeRates API — `ExchangeRatesController.java`

| Method | 路徑 | 用途 | 前端對應方法 |
|---|---|---|---|
| GET | `/exchange_rates/get_all_rates` | 取得全部匯率 | `apiService.getAllRates()` |
| POST | `/exchange_rates/get_rates_by_date` | 依日期查詢匯率 | `apiService.getRatesByDate()` |

---

## 後端待建立 API（前端已標記 TODO）

> 以下 Controller 在後端尚未建立，前端已預留 TODO 區塊等待串接。

### 會員 — MembersController（待建立）

| 端點（規劃） | 用途 | 資料表 |
|---|---|---|
| POST `/members/login` | 會員登入 | `members` |
| POST `/members/register` | 會員註冊 | `members` |
| GET `/members/profile` | 取得個人資料 | `members` |
| POST `/members/update` | 更新個人資料 | `members` |

影響元件：`auth.service.ts`（`login()`）、`customer-home.component.ts`（個人資料編輯）

---

### 員工 — StaffController（待建立）

| 端點（規劃） | 用途 | 資料表 |
|---|---|---|
| POST `/staff/login` | 員工登入驗證 | `staff` |
| GET `/staff/get_all` | 取得全部員工 | `staff` |
| POST `/staff/toggle` | 停/復權 | `staff` |

影響元件：`auth.service.ts`（`staffLogin()`）、`pos-terminal.component.ts`（員工帳號）、`manager-dashboard.component.ts`（帳號管理）

---

### 商品 — ProductsController（待建立）

| 端點（規劃） | 用途 | 資料表 |
|---|---|---|
| GET `/products/active` | 取得上架商品（菜單） | `products` |
| GET `/products/get_all` | 取得全部商品（含下架） | `products` |
| GET `/products/:id/image` | 取得商品圖片（BLOB） | `products.food_img` |
| POST `/products/create` | 新增商品 | `products` |
| POST `/products/update` | 修改商品 | `products` |
| POST `/products/toggle` | 上架/下架切換 | `products.is_active` |

影響元件：`customer-home.component.ts`（菜單）、`pos-terminal.component.ts`（POS商品列表）、`manager-dashboard.component.ts`（商品管理）

---

### 活動 — PromotionsController（待建立）

| 端點（規劃） | 用途 | 資料表 |
|---|---|---|
| GET `/promotions/get_all` | 取得全部活動 | `promotions` |
| GET `/promotions/gifts` | 取得活動贈品清單 | `promotions_gifts` |
| POST `/promotions/create` | 新增活動 | `promotions` |
| POST `/promotions/toggle` | 啟用/停用活動 | `promotions.is_active` |

影響元件：`customer-home.component.ts`（贈品選擇）、`pos-terminal.component.ts`（贈品選擇）、`manager-dashboard.component.ts`（活動管理）

---

### 分店庫存 — BranchInventoryController（待建立）

| 端點（規劃） | 用途 | 資料表 |
|---|---|---|
| GET `/branch_inventory/:areaId` | 取得該分店庫存 | `branch_inventory` |
| POST `/branch_inventory/update` | 更新分店庫存數量 | `branch_inventory` |

影響元件：`pos-terminal.component.ts`（庫存調整）、`manager-dashboard.component.ts`（庫存管理）

---

## 各元件串接步驟

### `manager-dashboard.component.ts` ← 優先串接（分店 + 稅率後端已完成）

**串接步驟：**

1. 取消 import 註解（檔案頂部）：
   ```typescript
   import { ApiService, GlobalAreaVO, RegionVO } from '../shared/api.service';
   ```

2. 取消 constructor 參數：
   ```typescript
   private apiService: ApiService,
   ```

3. 填入 `api.config.ts` 的 `BASE_URL`：
   ```typescript
   BASE_URL: 'http://localhost:8080'
   ```

4. 在 `ngOnInit()` 取消 **「載入分店清單」** 和 **「載入稅率清單」** 兩個 TODO 區塊。

5. 將 `branches` 和 `taxes` signal 的初始值改為空陣列 `[]`。

6. 在 `saveBranch()` / `saveEditBranch()` / `deleteBranch()` 取消對應 TODO 區塊，並移除上方 mock 邏輯的三行（`update` / `closeModal` / `showToast`）。

7. 在 `saveTax()` / `saveCountry()` 取消對應 TODO 區塊。

---

### `customer-home.component.ts`

**串接順序建議：** 訂單歷史 → 下單結帳 → 菜單商品

**串接步驟：**

1. 取消 import 和 constructor 中的 `ApiService` 註解。

2. **訂單歷史**（需 MembersController）：
   取消 `ngOnInit()` 中 **「載入訂單歷史」** TODO 區塊，
   並將 `orderHistoryList` signal 初始值改為空陣列 `[]`。

3. **下單結帳**（需 CartController + OrdersController）：
   取消 `_doPlaceOrder()` 中 **「下單與結帳」** TODO 區塊，
   整個方法的 mock 邏輯（`orderService.addOrder` 等）可保留用於 POS 看板同步，
   但 API 呼叫需在前面先執行。

4. **菜單商品**（需 ProductsController，待後端建立）：
   取消 `ngOnInit()` 中 **「載入菜單商品」** TODO 區塊，
   並清空 HTML 中 hardcoded 的菜單陣列。

---

### `pos-terminal.component.ts`

**串接步驟：**

1. 取消 import 和 constructor 中的 `ApiService` 註解。

2. **商品清單**（需 ProductsController，待後端建立）：
   取消 `ngOnInit()` 中 **「載入商品清單」** TODO 區塊，
   並將 `products` signal 初始值改為空陣列 `[]`。

3. **查詢會員**（需 MembersController，待後端建立）：
   取消 `lookupMember()` 中 **「查詢會員」** TODO 區塊，
   並在 TODO 區塊末尾加上 `return;`，讓 mock 邏輯不執行。

4. **結帳**（需 CartController + OrdersController）：
   取消 `confirmCheckout()` 中 **「POS 下單與結帳」** TODO 區塊。

5. **庫存調整**（需 BranchInventoryController，待後端建立）：
   取消 `confirmAdjustStock()` 中 **「調整分店庫存」** TODO 區塊。

---

### `auth.service.ts`

**串接步驟：**

1. 在 class 中注入 `HttpClient`（目前為 `@Injectable` without HTTP）。

2. **員工登入** `staffLogin()`：
   替換現有 MOCK_USERS 比對邏輯，改呼叫 `POST /staff/login`。

3. **客戶登入** `login()`：
   替換現有 MOCK_USERS 比對邏輯，改呼叫 `POST /members/login`。

4. 後端回傳 JWT token 時，改用 `localStorage` 儲存 token，
   不再用 `sessionStorage` 儲存整個使用者物件。

---

## 串接前置作業

在開始任何串接之前，請確認以下事項：

```
□ 後端 Spring Boot 專案可正常啟動（port 8080）
□ MySQL 資料庫已匯入 Dump20260409.sql
□ api.config.ts 的 BASE_URL 已填入正確後端位址
□ 後端 Controller 的 @CrossOrigin 允許前端 origin
  （目前已設定 http://localhost:4200）
□ 用 Postman / curl 先手動測試 API 回傳格式正確
□ 確認 Response 欄位名稱與 api.service.ts 中型別定義一致
  （Java camelCase 與 TypeScript camelCase 應自動對應）
```

---

## 資料型別對照表

### 資料庫欄位 vs 前端型別

| 資料表 | DB 欄位 | 後端 Java 型別 | 前端 TS 型別 |
|---|---|---|---|
| `products.food_img` | MEDIUMBLOB | `byte[]` | `string`（URL路徑） |
| `orders.status` | ENUM | `OrdersStatus` | `string` |
| `staff.role` | ENUM | `StaffRole` | `string` |
| `regions.tax_rate` | DECIMAL(5,4) | `BigDecimal` | `number`（0.05 = 5%） |
| `regions.tax_type` | ENUM | `TaxType` | `'INCLUSIVE' \| 'EXCLUSIVE'` |
| `order_cart.operation_type` | ENUM | `OperationType` | `'STAFF' \| 'CUSTOMER'` |

### 稅率格式說明

> 後端儲存小數格式，前端顯示百分比格式：
> - DB 存：`0.0500`
> - 前端顯示：`5%`
> - 換算：`前端顯示 = DB值 × 100`
> - 傳送 API：`taxRate = 前端輸入值 / 100`

---

## 快速找到 TODO 區塊

在 VSCode 搜尋（Ctrl+Shift+F）：

```
⚠ TODO [API串接點
```

共 **17 個** TODO 區塊分布如下：

| 元件 | TODO 數量 | 內容 |
|---|---|---|
| `manager-dashboard.component.ts` | 6 | 載入分店、載入稅率、新增/修改/刪除分店、新增稅率、更新稅率 |
| `customer-home.component.ts` | 4 | import、constructor、載入菜單、載入訂單歷史、下單結帳 |
| `pos-terminal.component.ts` | 5 | import、constructor、載入商品、查詢會員、結帳、庫存調整 |
| `auth.service.ts` | 2 | 客戶登入、管理員登入（既有區塊，需更新路徑） |

---

*此文件由 Claude Code 自動生成，請在每次串接後更新完成狀態。*

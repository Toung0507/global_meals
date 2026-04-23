# API 完整串接規劃

> 最後更新：2026-04-10（依 Dump20260410.sql + global_meals_gradle 最新版重新分析）
> 後端：`global_meals_gradle`（Spring Boot，port 8080）
> 前端：`global_meals`（Angular 19，port 4200）
> 分支：`dev-Ataya`

---

## 目錄

1. [整體架構說明](#整體架構說明)
2. [後端現有 API（可立即串接）](#後端現有-api可立即串接)
3. [後端待建立 API（前端預留 TODO）](#後端待建立-api前端預留-todo)
4. [前端需修正的問題](#前端需修正的問題)
5. [資料庫 Schema 重點](#資料庫-schema-重點)
6. [串接優先順序](#串接優先順序)
7. [串接前置作業](#串接前置作業)

---

## 整體架構說明

```
前端 Angular (localhost:4200)
        │
        ▼
src/app/shared/api.service.ts   ← 所有 HTTP 呼叫集中在此
        │
        ▼ HTTP Request (Content-Type: application/json)
後端 Spring Boot (localhost:8080)
        │
        ▼
MySQL 資料庫 global_meals
```

### 目前狀態（2026-04-10）

| 類別 | 狀態 |
|---|---|
| CartController | ✅ 完成（5 支端點，注意路徑無 /api/ 前綴） |
| OrdersController | ✅ 完成 |
| PromotionsManageController | ✅ 完成（上次更新後已建立！） |
| GlobalAreaController | ✅ 完成 |
| RegionsController | ✅ 完成（路徑前綴 /lazybaobao） |
| ExchangeRatesController | ✅ 完成 |
| ProductsController | ❌ **尚未建立**（Req 已定義，無 Controller） |
| MembersController | ❌ **尚未建立** |
| StaffController | ❌ **尚未建立** |
| BranchInventoryController | ❌ **尚未建立** |
| 前端 api.config.ts | ⚠️ Cart 路徑前綴錯誤，Promotions 路徑過時 |
| 前端 api.service.ts | ⚠️ 多個介面欄位名稱與後端不符，缺少新端點方法 |
| 各元件 TODO 區塊 | ✅ 已預寫並全部註解，Demo 安全 |

---

## 後端現有 API（可立即串接）

> 後端 Controller 位置：`global_meals_gradle/src/main/java/.../controller/`

---

### 1. Cart API — `CartController.java`

> ⚠️ **重要**：`CartController` 沒有 `@RequestMapping`，路徑**不含 `/api/` 前綴**。
> 前端 `api.config.ts` 目前路徑寫的是 `/api/cart/...`，這是錯的，需修正。
> `cart/coupon` 端點已不存在，請勿使用。

| Method | 實際路徑 | 功能 | 前端對應方法 |
|---|---|---|---|
| GET | `cart/{cartId}?memberId={memberId}` | 查看購物車（含稅務與可用贈品） | `apiService.viewCart()` |
| POST | `cart/sync` | 加入商品 / 更新數量 | `apiService.syncCart()` |
| DELETE | `cart/item` | 刪除購物車單品 | `apiService.removeCartItem()` |
| POST | `cart/gift` | 使用者確認選擇贈品 | `apiService.selectGift()` ★新增 |
| DELETE | `cart/clear` | 清空購物車 | `apiService.clearCart()` ★新增 |

**Request 結構（CartSyncReq）：**
```json
{
  "cartId": null,          // 新建時傳 null；已有購物車傳 id
  "globalAreaId": 1,       // 分店 ID（新建時必填；已有購物車可傳 null）
  "productId": 3,          // 必填，最小值 1
  "quantity": 2,           // 0 不合法，減少數量請用負數或直接呼叫 DELETE /cart/item
  "operationType": "CUSTOMER",  // "CUSTOMER" 或 "STAFF"
  "memberId": 1,           // 訪客傳 1（guest 固定為 1）
  "staffId": null          // 員工操作時傳 staff.id；顧客傳 null
}
```

**Request 結構（CartSelectGiftReq）：**
```json
{
  "cartId": 7,         // 必填
  "memberId": 3,       // 訪客傳 1
  "giftRuleId": 2      // promotions_gifts.id（不是 productId！）
}
```

**Request 結構（CartClearReq）：**
```json
{
  "cartId": 7,     // 必填
  "memberId": 3    // 訪客傳 1
}
```

**Response 結構（CartViewRes）：**
```json
{
  "code": 200,
  "message": "Success!!",
  "cartId": 7,
  "globalAreaId": 1,
  "operationType": "CUSTOMER",
  "items": [
    {
      "detailId": 1,
      "productId": 3,
      "productName": "招牌牛肉麵",
      "quantity": 2,
      "price": 150.00,
      "isGift": false,
      "discountNote": null,
      "lineTotal": 300.00
    }
  ],
  "subtotal": 300.00,
  "availablePromotions": [
    {
      "promotionId": 1,
      "promotionName": "滿 300 送贈品",
      "gifts": [
        {
          "giftRuleId": 2,
          "giftProductId": 5,
          "giftProductName": "招牌滷蛋",
          "fullAmount": 300.00,
          "available": true,
          "unavailableReason": null
        }
      ]
    }
  ],
  "taxInfo": {
    "taxRate": 0.0500,
    "taxType": "EXCLUSIVE",
    "taxAmount": 15.00
  },
  "totalAmount": 315.00,
  "warningMessages": []
}
```

---

### 2. Orders API — `OrdersController.java`

> ⚠️ `OrdersController` 也沒有 `@RequestMapping`，路徑開頭是 `Orders/`（大寫 O）。

| Method | 實際路徑 | 功能 | 前端對應方法 |
|---|---|---|---|
| POST | `Orders/createOrdersRes` | 成立訂單（UNPAID） | `apiService.createOrder()` |
| POST | `Orders/pay` | 結帳（→ COMPLETED） | `apiService.pay()` |
| POST | `Orders/GetAllOrdersList` | 取得會員歷史訂單 | `apiService.getAllOrders()` |
| GET | `Orders/getOrderByPhone` | 以電話查詢 UNPAID 訂單 | `apiService.getOrderByPhone()` |
| POST | `Orders/ordersStatus` | 退款 / 取消訂單 | `apiService.updateOrderStatus()` |

**Request 結構（CreateOrdersReq）：**
```json
{
  "orderCartId": "5",         // ⚠️ 型別是 String（非 number）！DB 是 int 但後端用 @NotBlank 驗證
  "globalAreaId": 1,
  "memberId": 1,              // 訪客傳 1
  "phone": "0912345678",
  "subtotalBeforeTax": 300.00,
  "taxAmount": 15.00,
  "totalAmount": 315.00,
  "orderCartDetailsList": [   // ⚠️ 注意大寫 O：Java getter 是 getOrderCartDetailsList
    { "productId": 2, "quantity": 1, "isGift": false }
  ]
}
```

**Response 結構（CreateOrdersRes）：**
```json
{
  "code": 200,
  "message": "Success!!",
  "id": "0001",            // ⚠️ 欄位名稱是 id，不是 orderId
  "orderDateId": "20260410",
  "totalAmount": 315.00
}
```

**Request 結構（PayReq）：**
```json
{
  "id": "0001",               // ⚠️ 欄位名稱是 id，不是 orderId
  "orderDateId": "20260410",
  "paymentMethod": "CASH",    // ⚠️ 必填（@NotBlank）
  "transactionId": "TXN123"   // ⚠️ 必填（@NotBlank，現金可傳 "CASH_PAYMENT"）
}
```

**Response 結構（GetAllOrdersRes）：**
```json
{
  "code": 200,
  "message": "Success!!",
  "getOrderVoList": [         // ⚠️ 欄位名稱是 getOrderVoList，不是 orders
    {
      "id": "0001",           // ⚠️ 欄位名稱是 id，不是 orderId
      "orderDateId": "20260410",
      "globalAreaId": 1,
      "totalAmount": 315.00,
      "status": "COMPLETED",
      "completedAt": "2026-04-10T14:30:00",
      "getOrdersDetailVoList": [  // ⚠️ 注意 getter 名稱
        { "productId": 2, "productName": "招牌牛肉麵", "quantity": 1, "price": 150.00, "isGift": false }
      ]
    }
  ]
}
```

---

### 3. Promotions API — `PromotionsManageController.java` ★已完成

> ✅ **此 Controller 已在最新版後端建立！** 舊文件說「缺少 Controller」已過時。

**管理端（manager-dashboard 用）：**

| Method | 實際路徑 | 功能 | 前端對應方法 |
|---|---|---|---|
| GET | `/promotions/list` | 取得全部活動及贈品清單 | `apiService.getPromotionsList()` ★新增 |
| POST | `/promotions/create` | 一次建立活動（可附贈品） | `apiService.createPromotion()` ★新增 |
| POST | `/promotions/toggle` | 啟用 / 停用活動 | `apiService.togglePromotion()` ★新增 |
| POST | `/promotions/calculate` | 結帳時計算促銷（折扣 + 贈品） | `apiService.calculatePromotion()` ★新增 |
| POST | `Promotions/addPromotion` | 新增活動（舊端點） | — |
| POST | `Promotions/addPromotionGift` | 新增贈品規則至活動（舊端點） | — |
| PUT | `Promotions/togglePromotion` | 啟用/停用活動（舊端點） | — |
| DELETE | `Promotions/deletePromotion/{id}` | 刪除活動 | — |

**結帳時取得可選贈品：**

| Method | 實際路徑 | 功能 | 前端對應方法 |
|---|---|---|---|
| POST | `Promotions/getAvailableGifts` | 傳入消費金額，回傳達標贈品 | `apiService.getAvailableGifts()` ★新增 |

> ⚠️ `Promotions/getAvailableGifts` 用的是 `@RequestParam`，需用 Query String 傳遞：
> `POST Promotions/getAvailableGifts?amount=300`

**Request 結構（PromotionsReq，用於 calculate）：**
```json
{
  "cartId": 5,            // 最小值 1
  "memberId": 2,          // 1 = 訪客（無折扣）
  "useCoupon": true,      // 使用者是否勾選使用 8 折券
  "selectedGiftId": 3,    // promotions_gifts.id（放棄選贈品傳 0）
  "originalAmount": 500.00  // 購物車原始總金額（前端計算後傳入）
}
```

**Response 結構（PromotionsRes）：**
```json
{
  "cartId": 5,
  "appliedPromotionIds": [1],
  "appliedDiscountName": "會員 8 折優惠",
  "originalAmount": 500.00,
  "finalAmount": 400,       // int，已無條件進位
  "receivedGifts": [
    { "promotionsGiftsId": 2, "productId": 5, "productName": "招牌滷蛋", "quantity": 1 }
  ]
}
```

**Request 結構（PromotionsManageReq，用於 create / toggle）：**
```json
{
  "name": "滿 300 送贈品",    // 必填（新增活動用）
  "startTime": "2026-04-10",  // 必填（LocalDate）
  "endTime": "2026-12-31",    // 必填（LocalDate）
  "promotionsId": 1,          // toggle / 新增贈品時使用
  "fullAmount": 300.00,       // 贈品消費門檻（新增贈品用）
  "quantity": -1,             // -1 = 無限；>0 = 有限庫存（新增贈品用）
  "giftProductId": 5,         // 贈品的 products.id（新增贈品用）
  "active": true              // toggle 時使用（true 開啟 / false 關閉）
}
```

---

### 4. GlobalArea API — `GlobalAreaController.java`

| Method | 實際路徑 | 功能 | 前端對應方法 |
|---|---|---|---|
| GET | `global_area/get_all_branch` | 取得全部分店 | `apiService.getAllBranches()` |
| POST | `global_area/create` | 新增分店 | `apiService.createBranch()` |
| POST | `global_area/update` | 修改分店資料 | `apiService.updateBranch()` |
| POST | `global_area/delete` | 刪除分店（支援批次） | `apiService.deleteBranch()` |

**前端對應頁面：** `manager-dashboard` → `branches` 頁籤

---

### 5. Regions API — `RegionsController.java`

> ⚠️ **路徑前綴是 `/lazybaobao`**，這是後端設計，前端 `api.config.ts` 需完整對應。

| Method | 實際路徑 | 功能 | 前端對應方法 |
|---|---|---|---|
| GET | `/lazybaobao/regions/get_all_tax` | 取得全部國家稅率 | `apiService.getAllTax()` |
| POST | `/lazybaobao/regions/create` | 新增國家稅率 | `apiService.createRegion()` |
| POST | `/lazybaobao/regions/update` | 更新國家稅率 | `apiService.updateRegion()` |

**前端對應頁面：** `manager-dashboard` → `tax` 頁籤

---

### 6. ExchangeRates API — `ExchangeRatesController.java`

> 匯率由 `ExchangeRatesScheduler` 定時從外部 API 自動更新，前端唯讀即可。

| Method | 實際路徑 | 功能 | 前端對應方法 |
|---|---|---|---|
| GET | `exchange_rates/get_all_rates` | 取得全部匯率 | `apiService.getAllRates()` |
| POST | `exchange_rates/get_rates_by_date` | 依日期查詢匯率 | `apiService.getRatesByDate()` |

---

## 後端待建立 API（前端預留 TODO）

以下 Controller **尚未建立**，但 Req / DAO / Entity 已存在，可直接實作。

---

### 7. Products API（商品管理）— ❌ 缺少 Controller

**後端已有：** `ProductsDao.java`、`ProductsTempDao.java`、`ProductCreateReq.java`、`ProductUpdateReq.java`

> ⚠️ **注意**：DB 的 `products` 表沒有 `price` 欄位！
> 價格存在 `branch_inventory.base_price`（每個分店的商品定價不同）。
> `products` 只存共用資訊（名稱、分類、圖片、描述、是否上架）。

| 建議端點 | Method | 功能 | 影響元件 |
|---|---|---|---|
| `products/active` | GET | 取得上架商品清單（菜單用，不含圖片） | customer-home, pos-terminal |
| `products/get_all` | GET | 取得全部商品（含下架，管理端用） | manager-dashboard |
| `products/{id}/image` | GET | 單獨取得商品圖片（MEDIUMBLOB） | 所有菜單頁面 |
| `products/create` | POST | 新增商品（同時建 branch_inventory） | manager-dashboard |
| `products/update` | POST | 修改商品資訊 | manager-dashboard |
| `products/toggle` | POST | 上架 / 下架切換 | manager-dashboard |

**ProductCreateReq 欄位（已定義）：**
```json
{
  "name": "招牌牛肉麵",
  "category": "主食",
  "regionCountry": "台灣",
  "basePrice": 150.00,
  "stockQuantity": 50,
  "maxOrderQuantity": 5,
  "description": "招牌牛骨熬煮 12 小時",
  "active": false
}
```

---

### 8. Members API（會員）— ❌ 缺少 Controller

**後端已有：** `MembersDao.java`、`MemberTempDao.java`

> DB `members` 表：`id, name, phone(UNIQUE), password(varchar 60), order_count, is_discount, created_at`
> `order_count` 達 10 次後 `is_discount = 1` 發放 8 折券

| 建議端點 | Method | 功能 | 影響元件 |
|---|---|---|---|
| `members/register` | POST | 會員註冊 | auth.service |
| `members/login` | POST | 會員登入（回傳 memberId + name） | auth.service |
| `members/profile` | GET | 取得個人資料（含訂單數、折扣券狀態） | customer-home |
| `members/update` | POST | 更新個人資料 | customer-home |

---

### 9. Staff API（員工）— ❌ 缺少 Controller

**後端已有：** `StaffDao.java`

> DB `staff` 表：`id, name, account(UNIQUE), password(varchar 60), role(ADMIN/REGION_MANAGER/STAFF), global_area_id, is_status, hire_at`

| 建議端點 | Method | 功能 | 影響元件 |
|---|---|---|---|
| `staff/login` | POST | 員工登入（驗證 account + password） | auth.service |
| `staff/get_all` | GET | 取得全部員工清單 | manager-dashboard |
| `staff/toggle` | POST | 停/復權（is_status） | manager-dashboard |

---

### 10. BranchInventory API（分店庫存）— ❌ 缺少 Controller

> DB `branch_inventory` 表：`id, product_id, global_area_id, stock_quantity, base_price, max_order_quantity, version, updated_at`
> 每個分店對同一商品可能有不同售價與庫存。

| 建議端點 | Method | 功能 | 影響元件 |
|---|---|---|---|
| `branch_inventory/{areaId}` | GET | 取得該分店庫存清單 | pos-terminal |
| `branch_inventory/update` | POST | 更新分店商品庫存與價格 | manager-dashboard |

---

## 前端需修正的問題

### A. `api.config.ts` 路徑錯誤（⚠️ 優先修正）

**Cart 路徑全部錯誤（多了 `/api/` 前綴）：**

| 目前錯誤路徑 | 正確路徑 |
|---|---|
| `/api/cart/:cartId` | `cart/:cartId` |
| `/api/cart/sync` | `cart/sync` |
| `/api/cart/item` | `cart/item` |
| `/api/cart/coupon` | **移除**（此端點已不存在） |

**Cart 缺少新端點：**
```typescript
CART: {
  VIEW:    'cart/:cartId',   // GET
  SYNC:    'cart/sync',      // POST
  REMOVE:  'cart/item',      // DELETE
  GIFT:    'cart/gift',      // POST ★新增
  CLEAR:   'cart/clear',     // DELETE ★新增
}
```

**Promotions 路徑需全面更新：**
```typescript
PROMOTIONS: {
  LIST:             '/promotions/list',              // GET  取得全部活動（管理端）★新增
  CREATE:           '/promotions/create',            // POST 建立活動（管理端）★新增
  TOGGLE:           '/promotions/toggle',            // POST 啟用/停用（管理端）★新增
  CALCULATE:        '/promotions/calculate',         // POST 結帳計算促銷 ★新增
  AVAILABLE_GIFTS:  'Promotions/getAvailableGifts',  // POST 取得可選贈品（QueryParam amount）★新增
}
```

---

### B. `api.service.ts` 型別定義錯誤（⚠️ 優先修正）

**CartSyncReq 欄位錯誤：**
```typescript
// ❌ 目前（錯誤）
export interface CartSyncReq {
  cartId: number;       // ← 應為 cartId: number | null（新建時傳 null）
  operation: number;    // ← 此欄位不存在！
  // 缺少 memberId, staffId
}

// ✅ 修正後
export interface CartSyncReq {
  cartId: number | null;         // 新建購物車傳 null
  globalAreaId: number | null;   // 新建時必填；舊車可傳 null
  productId: number;
  quantity: number;
  operationType: 'STAFF' | 'CUSTOMER';
  memberId: number;              // 訪客傳 1
  staffId?: number;              // 員工操作時傳 staff.id
}
```

**CartRemoveReq 缺少欄位：**
```typescript
// ✅ 修正後
export interface CartRemoveReq {
  cartId: number;
  productId: number;
  memberId: number;   // ★新增（必填）
}
```

**CartViewRes 欄位完全不符：**
```typescript
// ✅ 修正後（對應後端 CartViewRes）
export interface CartViewRes {
  code: number;
  message: string;
  cartId: number;
  globalAreaId: number;
  operationType: string;
  items: CartItemVO[];
  subtotal: number;
  availablePromotions: AvailablePromotionVO[];  // ★新增
  taxInfo: TaxInfoVO | null;                    // ★新增
  totalAmount: number;                          // ★改名（原為 total）
  warningMessages: string[];                    // ★新增
}
```

**CartItemVO 欄位名稱錯誤：**
```typescript
// ✅ 修正後
export interface CartItemVO {
  detailId: number;          // ★新增
  productId: number;
  productName: string;       // ★改名（原為 name）
  quantity: number;
  price: number;
  isGift: boolean;
  discountNote?: string;
  lineTotal: number;         // ★新增（後端已算好的小計）
}
```

**CreateOrdersReq 欄位錯誤：**
```typescript
// ✅ 修正後
export interface CreateOrdersReq {
  orderCartId: string;       // ★改名（原為 cartId: number；後端用 String + @NotBlank）
  globalAreaId: number;
  memberId: number;          // 訪客傳 1
  phone: string;
  subtotalBeforeTax: number;
  taxAmount: number;
  totalAmount: number;
  orderCartDetailsList: OrderCartDetailItem[];  // ★新增
}
export interface OrderCartDetailItem {
  productId: number;
  quantity: number;
  isGift: boolean;
}
// 注意：paymentMethod 不在 createOrder，在 pay() 階段才傳
```

**CreateOrdersRes 欄位錯誤：**
```typescript
// ✅ 修正後
export interface CreateOrdersRes {
  code: number;
  message: string;
  id: string;              // ★改名（原為 orderId）
  orderDateId: string;
  totalAmount: number;
}
```

**PayReq 缺少欄位：**
```typescript
// ✅ 修正後
export interface PayReq {
  id: string;              // ★改名（原為 orderId）
  orderDateId: string;
  paymentMethod: string;   // ★新增（必填，@NotBlank）例：'CASH'
  transactionId: string;   // ★改為必填（現金可傳 "CASH_PAYMENT"）
}
```

**RefundedReq 欄位錯誤：**
```typescript
// ✅ 修正後
export interface RefundedReq {
  id: string;              // ★改名（原為 orderId）
  orderDateId: string;
  status: 'CANCELLED' | 'REFUNDED';
}
```

**GetAllOrdersRes / GetOrdersVo 欄位錯誤：**
```typescript
// ✅ 修正後
export interface GetAllOrdersRes {
  code: number;
  message: string;
  getOrderVoList: GetOrdersVo[];  // ★改名（原為 orders）
}
export interface GetOrdersVo {
  id: string;                          // ★改名（原為 orderId）
  orderDateId: string;
  globalAreaId: number;                // ★新增
  totalAmount: number;
  status: string;
  completedAt: string;
  getOrdersDetailVoList: GetOrdersDetailVo[];  // ★改名（原為 details）
}
export interface GetOrdersDetailVo {
  productId: number;
  productName: string;    // ★改名（原為 name）
  quantity: number;
  price: number;
  isGift: boolean;
}
```

**需新增的介面（目前缺少）：**
```typescript
// ★ 贈品選擇
export interface CartSelectGiftReq {
  cartId: number;
  memberId: number;
  giftRuleId: number;   // promotions_gifts.id
}

export interface CartClearReq {
  cartId: number;
  memberId: number;
}

// ★ 促銷（availablePromotions 已在 CartViewRes 用到）
export interface AvailablePromotionVO {
  promotionId: number;
  promotionName: string;
  gifts: AvailableGiftVO[];
}

export interface AvailableGiftVO {
  giftRuleId: number;
  giftProductId: number;
  giftProductName: string;
  fullAmount: number;
  available: boolean;
  unavailableReason?: string;
}

export interface TaxInfoVO {
  taxRate: number;
  taxType: 'INCLUSIVE' | 'EXCLUSIVE';
  taxAmount: number;
}

// ★ 促銷結帳計算
export interface PromotionsReq {
  cartId: number;
  memberId: number;
  useCoupon: boolean;
  selectedGiftId: number;   // 放棄選贈品傳 0
  originalAmount: number;
}

export interface PromotionsRes {
  cartId: number;
  appliedPromotionIds: number[];
  appliedDiscountName: string;
  originalAmount: number;
  finalAmount: number;      // int，無條件進位
  receivedGifts: GiftItem[];
}

export interface GiftItem {
  promotionsGiftsId: number;
  productId: number;
  productName: string;
  quantity: number;   // -1 = 無限供應
}

// ★ 促銷管理（manager-dashboard）
export interface PromotionsManageReq {
  name: string;
  startTime: string;     // 格式 YYYY-MM-DD
  endTime: string;
  promotionsId?: number;
  fullAmount?: number;
  quantity?: number;     // -1 = 無限
  giftProductId?: number;
  active?: boolean;
}

export interface PromotionDetailVo {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
  gifts: GiftDetailVo[];
}

export interface GiftDetailVo {
  id: number;
  fullAmount: number;
  quantity: number;
  giftProductId: number;
  productName: string;
  active: boolean;
}

export interface PromotionsListRes {
  code: number;
  message: string;
  data: PromotionDetailVo[];
}
```

**需新增的 Service 方法：**
```typescript
// ★ Cart 新方法
selectGift(req: CartSelectGiftReq): Observable<CartViewRes>
clearCart(req: CartClearReq): Observable<CartViewRes>

// ★ Promotions 新方法
calculatePromotion(req: PromotionsReq): Observable<PromotionsRes>
getAvailableGifts(amount: number): Observable<GiftItem[]>
getPromotionsList(): Observable<PromotionsListRes>
createPromotion(req: PromotionsManageReq): Observable<BasicRes>
togglePromotion(req: PromotionsManageReq): Observable<BasicRes>
```

**CartCouponReq — 移除（此介面對應的後端端點已不存在）**

---

### C. 各元件串接步驟

#### `manager-dashboard.component.ts` ← 優先（分店 + 稅率後端已完成，活動管理也完成）

1. 注入 `ApiService`（取消 import 和 constructor 的 TODO 註解）
2. 填入 `api.config.ts` 的 `BASE_URL: 'http://localhost:8080'`
3. `ngOnInit()` 取消「載入分店清單」和「載入稅率清單」TODO 區塊
4. `ngOnInit()` 取消「載入活動清單」TODO 區塊（呼叫 `/promotions/list`）
5. 分店 CRUD、稅率 CRUD、活動 toggle 各自取消對應 TODO 區塊

#### `customer-home.component.ts`

建議串接順序：訂單歷史 → 下單結帳 → 促銷 → 菜單商品（需後端建 ProductsController）

1. 注入 `ApiService`
2. **訂單歷史**：取消 `ngOnInit()` 中「載入訂單歷史」TODO，傳入 `memberId` 呼叫 `getAllOrders()`
3. **購物車同步**：加入商品改呼叫 `syncCart()`（`cartId=null` 建新車），保存 `cartId` 供後續操作
4. **選擇贈品**：展開 `availablePromotions` 讓使用者選擇，確認後呼叫 `selectGift()`
5. **下單**：呼叫 `createOrder()`，取得 `id` 和 `orderDateId`
6. **結帳**：呼叫 `pay()`，傳入 `id`、`orderDateId`、`paymentMethod`、`transactionId`
7. **菜單商品**（需 ProductsController 建立後）：呼叫 `GET products/active` 取代 hardcoded 菜單

#### `pos-terminal.component.ts`

1. 注入 `ApiService`
2. **商品清單**（需 ProductsController）：呼叫 `products/active` 取代 hardcoded 商品
3. **購物車同步**：operationType 傳 `"STAFF"`，staffId 傳登入員工 id
4. **結帳**：`createOrder()` → `pay()`，流程同 customer-home
5. **報電話取餐**：呼叫 `getOrderByPhone(phone)`

#### `auth.service.ts`

目前所有登入邏輯都是 Mock。串接後：
- `staffLogin()` → `POST staff/login`（需後端建立 StaffController）
- `login()` → `POST members/login`（需後端建立 MembersController）

---

## 資料庫 Schema 重點

### 關鍵資料表結構

**`products`**（商品主表，無 price 欄位）
```sql
id int AUTO_INCREMENT,
name varchar(100),
category varchar(50),
food_img MEDIUMBLOB,     -- 圖片，建議用獨立端點 /products/{id}/image 取得
description varchar(200),
is_active tinyint,
deleted_at datetime
```

**`branch_inventory`**（分店商品定價與庫存，每分店獨立）
```sql
id int AUTO_INCREMENT,
product_id int,           -- → products.id
global_area_id int,       -- → global_area.id
stock_quantity int,
base_price decimal(12,2), -- 該分店的定價
max_order_quantity int,
version int,              -- 樂觀鎖
updated_at datetime,
UNIQUE KEY (global_area_id, product_id)
```

**`orders`**（複合主鍵）
```sql
id varchar(4),            -- 4碼流水號（同一日期）
order_date_id varchar(10), -- YYYYMMDD
PRIMARY KEY (id, order_date_id)
is_use_discount tinyint   -- 本次是否使用折扣券
```

**`promotions_gifts`**
```sql
id int AUTO_INCREMENT,
promotions_id int,        -- → promotions.id
full_amount decimal(12,4), -- 消費門檻
quantity int DEFAULT -1,  -- -1 = 無限供應；>0 = 有限庫存
gift_product_id int,      -- → products.id
is_active tinyint
```

**`members`**
```sql
id int, name varchar(50), phone varchar(15) UNIQUE,
password varchar(60), order_count int DEFAULT 0,
is_discount tinyint DEFAULT 0,  -- 達 10 次訂單後設為 1（8 折券）
created_at date
```

**`staff`**
```sql
id int, name varchar(20), account varchar(50) UNIQUE,
password varchar(60), role ENUM('ADMIN','REGION_MANAGER','STAFF'),
global_area_id int, is_status tinyint DEFAULT 1, hire_at date
```

**`regions`**（稅率，與 global_area 透過 country 欄位關聯）
```sql
id int, country varchar(50), currency_code char(3),
tax_rate decimal(5,4),   -- 例：0.0500 = 5%
tax_type ENUM('INCLUSIVE','EXCLUSIVE'), created_at date, updated_at date
```

### 型別對照表

| DB 欄位 | Java 型別 | TypeScript 型別 | 說明 |
|---|---|---|---|
| `products.food_img` | `byte[]` | `string` | 圖片建議 Base64 或獨立 URL |
| `orders.status` | `OrdersStatus` | `'UNPAID'｜'COMPLETED'｜'CANCELLED'｜'REFUNDED'` | |
| `staff.role` | `StaffRole` | `'ADMIN'｜'REGION_MANAGER'｜'STAFF'` | |
| `regions.tax_rate` | `BigDecimal` | `number` | 0.05 = 5%，前端顯示需 × 100 |
| `regions.tax_type` | `TaxType` | `'INCLUSIVE'｜'EXCLUSIVE'` | |
| `order_cart.operation_type` | `OperationType` | `'STAFF'｜'CUSTOMER'` | |
| `orders.id` | `String` | `string` | 4碼流水號，非 number |
| `orders.total_amount` | `BigDecimal` | `number` | |
| `promotions_gifts.quantity` | `int` | `number` | -1 = 無限 |

---

## 串接優先順序

```
第一優先（立即可串，後端已完成）
  1. api.config.ts 修正路徑（Cart 前綴錯誤）        ← 不修正所有 Cart API 都會 404
  2. api.service.ts 修正型別定義                    ← 不修正串接後資料對不上
  3. manager-dashboard 串接分店（GlobalArea API）    ← 後端已完成，直接串
  4. manager-dashboard 串接稅率（Regions API）       ← 後端已完成，直接串
  5. manager-dashboard 串接活動（Promotions API）    ← 後端已完成，直接串

第二優先（核心消費流程）
  6. customer-home / pos-terminal 串接 Cart API     ← 後端已完成
  7. customer-home / pos-terminal 串接 Orders API   ← 後端已完成

第三優先（需後端新建 Controller）
  8. ProductsController → 菜單、POS 商品可顯示真實資料
  9. MembersController  → auth.service 可真正驗證
  10. StaffController   → 員工登入、帳號管理

第四優先（進階功能）
  11. BranchInventoryController → 分店庫存管理
  12. 財報功能（後端完全沒有，需評估是否實作）
```

---

## 串接前置作業

在開始任何串接之前，請確認：

```
□ 後端 Spring Boot 可正常啟動（port 8080）
□ MySQL 資料庫已匯入 Dump20260410.sql
□ api.config.ts 的 BASE_URL 已改為 'http://localhost:8080'
□ 後端 CORS 確認允許 http://localhost:4200
  （各 Controller 已設 @CrossOrigin(origins = "http://localhost:4200")）
□ 先用 Postman 手動測試 API 確認回傳格式正確
□ 確認前端 app.config.ts 已有 provideHttpClient()（已完成）
```

---

## 已知問題清單

| 編號 | 嚴重度 | 問題 | 位置 |
|---|---|---|---|
| #1 | 🔴 高 | `api.config.ts` Cart 路徑多了 `/api/` 前綴，所有 Cart API 都會 404 | `api.config.ts` CART 區塊 |
| #2 | 🔴 高 | `api.service.ts` CartSyncReq 有不存在的 `operation` 欄位、缺少 `memberId`、`staffId` | `api.service.ts:39-45` |
| #3 | 🔴 高 | `api.service.ts` CreateOrdersReq `cartId` 應為 `orderCartId: string` | `api.service.ts:79-86` |
| #4 | 🔴 高 | `api.service.ts` PayReq 缺少必填的 `paymentMethod`，`transactionId` 應為必填 | `api.service.ts:93-98` |
| #5 | 🟡 中 | `api.service.ts` 多個 Res 欄位名稱錯誤（orderId→id, orders→getOrderVoList 等） | `api.service.ts:87-135` |
| #6 | 🟡 中 | `api.service.ts` CartItemVO `name` 應為 `productName`，缺少 `detailId`、`lineTotal` | `api.service.ts:68-75` |
| #7 | 🟡 中 | `api.config.ts` Promotions 路徑過時（`/promotions/get_all` 實際是 `/promotions/list`） | `api.config.ts:88-95` |
| #8 | 🟡 中 | `api.service.ts` 缺少 `CartSelectGiftReq`、`CartClearReq`、Promotions 相關介面與方法 | `api.service.ts` |
| #9 | 🟡 中 | `CartController` 的 `applyCoupon()` 對應端點已不存在 | `api.service.ts:258`, `api.config.ts:28` |
| #10 | 🟢 低 | `CreateOrdersReq.orderCartId` 後端是 String，應傳字串格式（`String(cartId)`） | 各元件下單邏輯 |
| #11 | 🟢 低 | 後端無認證機制（JWT/Session），所有端點任何人可呼叫 | 全域 |
| #12 | 🟢 低 | 部署正式環境需修改 `@CrossOrigin` 為正式 domain，或改用全域 CORS 設定 | 各 Controller |

---

## 快速找到 TODO 區塊

在 VSCode 搜尋（Ctrl+Shift+F）：

```
⚠ TODO [API串接點
```

| 元件 | TODO 數量 | 內容 |
|---|---|---|
| `manager-dashboard.component.ts` | 6+ | 載入分店、載入稅率、載入活動、各 CRUD 操作 |
| `customer-home.component.ts` | 4 | 載入菜單、載入訂單歷史、下單結帳、促銷選禮 |
| `pos-terminal.component.ts` | 5 | 載入商品、查詢會員、結帳、庫存調整 |
| `auth.service.ts` | 2 | 客戶登入、員工登入 |

---

*文件由 Claude Code 依 Dump20260410.sql 與 global_meals_gradle 最新原始碼分析產生。*
*若後端有更新請重新比對，特別是 Req/Res 欄位名稱。*

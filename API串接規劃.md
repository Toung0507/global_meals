# Global Meals — 前後端 API 串接規劃

> 分析日期：2026-04-09
> 後端專案：`global_meals_gradle`（Spring Boot）
> 前端專案：`global_meals`（Angular 19）
> 資料庫 Schema：`20260408.sql`

---

## 一、後端現有 API 清單

### 1. CartController（購物車）— 基礎路徑 `/api/cart`

| 方法   | 路徑              | 功能說明             | 狀態         |
|--------|-------------------|----------------------|--------------|
| GET    | `/api/cart/{cartId}` | 查看購物車（可帶 memberId） | ✅ 完成 |
| POST   | `/api/cart/sync`  | 加入商品 / 修改數量   | ✅ 完成      |
| DELETE | `/api/cart/item`  | 刪除單品             | ✅ 完成      |
| POST   | `/api/cart/coupon`| 套用／取消折價券     | ✅ 完成      |

**Request / Response 重點：**
- `POST /api/cart/sync` 傳入 `CartSyncReq`：
  ```json
  {
    "cartId": null,         // 新建時傳 null，已有時傳 cartId
    "globalAreaId": 1,      // 分店 ID
    "productId": 3,         // 必填，>0
    "quantity": 2,          // 0 = 刪除
    "operationType": "CUSTOMER",  // 或 "STAFF"
    "memberId": null,       // 訪客傳 null 或不傳
    "staffId": null
  }
  ```
- 回傳 `CartViewRes`：包含 `cartId`、`items[]`（含 productName、price、quantity、lineTotal、isGift）、`subtotal`、`hasCoupon`、`discountedTotal`

---

### 2. OrdersController（訂單）— 無基礎路徑前綴

| 方法 | 路徑                          | 功能說明             | 狀態     |
|------|-------------------------------|----------------------|----------|
| POST | `Orders/GetAllOrdersList`     | 查詢會員歷史訂單     | ✅ 完成  |
| POST | `Orders/ordersStatus`         | 訂單狀態更新（退款／取消） | ✅ 完成 |
| POST | `Orders/createOrdersRes`      | 成立訂單（未結帳）   | ✅ 完成  |
| POST | `Orders/pay`                  | 結帳付款             | ✅ 完成  |
| GET  | `Orders/getOrderByPhone`      | 報電話號碼查詢今日訂單 | ✅ 完成 |

**Request 重點（成立訂單）`CreateOrdersReq`：**
```json
{
  "orderCartId": "5",         // 購物車 ID（String 型別，注意！DB 欄位是 int）
  "globalAreaId": 1,
  "memberId": 1,              // 訪客傳 1
  "phone": "0912345678",
  "subtotalBeforeTax": 300.00,
  "taxAmount": 15.00,
  "totalAmount": 315.00,
  "orderCartDetailsList": [
    { "productId": 2, "quantity": 1, "isGift": false }
  ]
}
```

---

### 3. GlobalAreaController（分店管理）— 無基礎路徑前綴

| 方法 | 路徑                      | 功能說明     | 狀態     |
|------|---------------------------|--------------|----------|
| POST | `global_area/create`      | 新增分店     | ✅ 完成  |
| POST | `global_area/update`      | 修改分店     | ✅ 完成  |
| GET  | `global_area/get_all_branch` | 取得分店清單 | ✅ 完成 |
| POST | `global_area/delete`      | 刪除分店（支援批次） | ✅ 完成 |

**前端對應頁面：** `manager-dashboard` → `branches` 頁籤

---

### 4. RegionsController（稅率管理）— 基礎路徑 `/lazybaobao`

| 方法 | 路徑                             | 功能說明       | 狀態     |
|------|----------------------------------|----------------|----------|
| POST | `/lazybaobao/regions/create`    | 新增國家稅值   | ✅ 完成  |
| POST | `/lazybaobao/regions/update`    | 修改國家稅值   | ✅ 完成  |
| GET  | `/lazybaobao/regions/get_all_tax` | 取得所有稅率 | ✅ 完成 |

**前端對應頁面：** `manager-dashboard` → `tax` 頁籤

---

### 5. ExchangeRatesController（匯率）— 無基礎路徑前綴

| 方法 | 路徑                              | 功能說明               | 狀態     |
|------|-----------------------------------|------------------------|----------|
| GET  | `exchange_rates/get_all_rates`   | 取得全部匯率記錄       | ✅ 完成  |
| POST | `exchange_rates/get_rates_by_date`| 依日期取匯率           | ✅ 完成  |

> 匯率由 `ExchangeRatesScheduler` 定時從外部 API 自動更新，前端唯讀即可。

---

## 二、後端已有 Service 但缺少 Controller（⚠️ 無法串接）

### PromotionsService — 無對應 Controller

`PromotionsService.calculate()` 已完整實作促銷計算邏輯（滿額贈品 + 會員 8 折），但**沒有 Controller 暴露端點**，前端無法呼叫。

**需新增端點：**
```
POST /promotions/calculate
```
Request（PromotionsReq）：
```json
{
  "cartId": 5,
  "memberId": 2,
  "useCoupon": true
}
```
Response（PromotionsRes）：
```json
{
  "cartId": 5,
  "originalAmount": 400.00,
  "finalAmount": 320,
  "appliedDiscountName": "會員 8 折優惠",
  "appliedPromotionIds": [1],
  "receivedGifts": [
    { "productId": 3, "productName": "招牌滷蛋", "quantity": 2 }
  ]
}
```

---

## 三、後端完全缺少的功能（需新增）

### 3-1. 商品管理 API（Products）— 完全缺少 Controller

DB 有 `products` 資料表，`ProductsDao` 也存在，但沒有 Controller。

**需新增以下端點：**

| 方法   | 建議路徑               | 功能說明                     |
|--------|------------------------|------------------------------|
| GET    | `/products/list`       | 取得商品清單（含分類、圖片、庫存） |
| POST   | `/products/create`     | 新增商品（含圖片 Base64/Blob） |
| POST   | `/products/update`     | 修改商品資訊                 |
| POST   | `/products/delete`     | 下架 / 刪除商品              |
| GET    | `/products/{id}/image` | 單獨取得商品圖片             |

**前端需要資料：**
- `customer-home`：菜單列表（id、name、nameEn、price、image、category、description、stock、isActive）
- `pos-terminal`：POS 點餐商品卡
- `manager-dashboard`：商品管理、庫存管理頁籤

**注意：** `products.food_img` 是 `MEDIUMBLOB`，商品列表不應一次撈圖片（效能問題），建議圖片單獨用 `/products/{id}/image` 端點取得，或存 URL 路徑。

---

### 3-2. 會員 / 登入 API（Members + Auth）— 完全缺少

DB 有 `members` 資料表，但**沒有任何 Controller**。前端 `auth.service.ts` 目前全部是 Mock 假資料。

**需新增以下端點：**

| 方法 | 建議路徑              | 功能說明           |
|------|-----------------------|--------------------|
| POST | `/members/register`   | 會員註冊           |
| POST | `/members/login`      | 會員登入（回傳 session 或 token） |
| GET  | `/members/{id}/info`  | 取得會員資料（姓名、電話、點數、折扣券） |
| POST | `/members/update`     | 更新會員資料（姓名、密碼） |

**DB 結構重點（members 表）：**
```
id, name, phone(UNIQUE), password(varchar 60), order_count, is_discount, created_at
```
> `order_count` = 累積訂單次數，達 10 次後 `is_discount = 1` 發放折扣券

---

### 3-3. 員工管理 API（Staff）— 完全缺少 Controller

DB 有 `staff` 資料表，`StaffDao` 存在，但**沒有 Controller**。

**需新增以下端點：**

| 方法 | 建議路徑          | 功能說明                       |
|------|-------------------|--------------------------------|
| POST | `/staff/login`    | 員工登入（驗證 account + password） |
| GET  | `/staff/list`     | 取得員工清單（分店長用）       |
| POST | `/staff/create`   | 新增員工帳號（ADMIN 用）       |
| POST | `/staff/update`   | 修改帳號狀態（停/復權）        |

**DB 結構重點（staff 表）：**
```
id, name, account(UNIQUE), password(varchar 60), role(ADMIN/REGION_MANAGER/STAFF), global_area_id, is_status, hire_at
```

---

### 3-4. 促銷活動管理 CRUD API（Promotions）

`PromotionsService.calculate()` 已有計算邏輯，但**缺少管理端的 CRUD 端點**。

**需新增以下端點：**

| 方法 | 建議路徑              | 功能說明                 |
|------|-----------------------|--------------------------|
| GET  | `/promotions/list`    | 取得所有活動及贈品清單   |
| POST | `/promotions/create`  | 新增活動與贈品規則       |
| POST | `/promotions/toggle`  | 啟用 / 停用活動          |
| POST | `/promotions/calculate` | 計算促銷結果（已有 Service） |

**前端對應頁面：** `manager-dashboard` → `promotions` 頁籤

---

## 四、前端目前需要修改的地方

### 4-1. `api.config.ts` — 端點路徑與後端不符

目前 `api.config.ts` 的端點定義全部是規劃中的路徑，與後端實際路徑不一致：

| 前端目前定義          | 後端實際路徑                      |
|-----------------------|-----------------------------------|
| `/auth/login`         | 後端**尚無此端點**（需新增）     |
| `/orders`             | `Orders/createOrdersRes`（不一致）|
| `/menu/items`         | 後端**尚無此端點**（需新增）     |
| `/staff`              | 後端**尚無此端點**（需新增）     |

> **建議：** 後端確認完端點後，統一更新 `api.config.ts` 中的 ENDPOINTS 對應。

---

### 4-2. `auth.service.ts` — 全部 Mock，需替換為 HTTP 呼叫

目前行為：
- `login()` → 比對 hardcoded 陣列，回傳 boolean
- `staffLogin()` → 比對 hardcoded 陣列，回傳 MockUser
- `loginAsGuest()` → 直接建立本地 guest 物件
- `getOrders()` → 回傳 hardcoded 假訂單

**串接後需改為：**
```typescript
// 範例：會員登入
login(phone: string, password: string): Observable<boolean> {
  return this.http.post<{memberId: number, name: string}>(
    `${API_CONFIG.BASE_URL}/members/login`,
    { phone, password }
  ).pipe(
    tap(res => { /* 存入 session */ }),
    map(() => true),
    catchError(() => of(false))
  );
}
```

---

### 4-3. `customer-home.component.ts` — 菜單與購物車全部 Mock

**菜單（MenuItem）：**
- 目前：`customer-home.component.html` 內硬編碼假菜單資料
- 串接後：呼叫 `GET /products/list` 取得商品清單

**購物車（cartItems Signal）：**
- 目前：純前端 Signal，無後端同步
- 串接後流程：
  1. 加入商品 → `POST /api/cart/sync`（cartId=null 建新車）
  2. 修改數量 → `POST /api/cart/sync`（帶 cartId）
  3. 刪除品項 → `DELETE /api/cart/item`
  4. 結帳前套用促銷 → `POST /promotions/calculate`
  5. 成立訂單 → `POST Orders/createOrdersRes`
  6. 結帳 → `POST Orders/pay`

**訂單歷史（orderHistoryList Signal）：**
- 目前：hardcoded 假資料 + 下單後本地新增
- 串接後：呼叫 `POST Orders/GetAllOrdersList`（帶 memberId）

**折扣券狀態（memberOrderCount Signal）：**
- 目前：hardcoded `signal(9)`，前端自行計算 `is_discount`
- 串接後：從 `GET /members/{id}/info` 取得 `orderCount` 和 `isDiscount`

---

### 4-4. `manager-dashboard.component.ts` — 管理後台全部 Mock

| 後台頁籤     | 目前狀態    | 需串接的 API                                   |
|--------------|-------------|------------------------------------------------|
| `branches`   | Mock 假資料 | `GET global_area/get_all_branch`、CRUD         |
| `tax`        | Mock 假資料 | `GET /lazybaobao/regions/get_all_tax`、CRUD    |
| `products`   | Mock 假資料 | `GET /products/list`（需新增）、CRUD           |
| `promotions` | Mock 假資料 | `GET /promotions/list`（需新增）、Toggle       |
| `inventory`  | Mock 假資料 | 庫存屬於 `products.stock_quantity`，需更新商品 API |
| `orders`     | Mock 假資料 | `POST Orders/GetAllOrdersList`、狀態更新       |
| `users`      | Mock 假資料 | `GET /staff/list`（需新增）、停/復權           |
| `finance`    | Mock 假資料 | 後端**完全沒有財報 API**，需評估是否實作       |

---

### 4-5. `pos-terminal.component.ts` — POS 系統全部 Mock

- 商品卡 → 需串接 `GET /products/list`
- 購物車同步 → 需串接 `/api/cart/` 系列
- 訂單成立 → 需串接 `POST Orders/createOrdersRes`
- 結帳 → 需串接 `POST Orders/pay`
- 報電話取餐 → 需串接 `GET Orders/getOrderByPhone`
- 員工帳號管理 → 需串接 `GET /staff/list`（需新增）

---

## 五、發現的問題與注意事項

### ⚠️ 問題 1：CreateOrdersReq.orderCartId 型別不一致

- `CreateOrdersReq.java` 中 `orderCartId` 是 **String 型別**
- 但 `order_cart.id` DB 欄位是 **int AUTO_INCREMENT**
- 建議後端改為 `int` 或前端傳值時確保格式正確

### ⚠️ 問題 2：OrdersController 路徑風格不一致

- `CartController` 用 `@RequestMapping("/api/cart")` 有前綴
- `OrdersController` 沒有 `@RequestMapping`，路徑是 `Orders/GetAllOrdersList`（無斜線開頭）
- 建議加上 `@RequestMapping("/api/orders")` 統一風格

### ⚠️ 問題 3：RegionsController 的 `/lazybaobao` 前綴

- 路徑是 `/lazybaobao/regions/...`，前端需配合此路徑
- 若前端 `api.config.ts` 未正確配置，會 404

### ⚠️ 問題 4：CORS 設定

- 各 Controller 都有 `@CrossOrigin(origins = "http://localhost:4200")`
- 部署正式環境後需修改為正式域名，或改用全域 CORS 設定

### ⚠️ 問題 5：CartService 中的 `findById` 呼叫型別衝突

- `CartService.java` 第 254 行：`Products giftProduct = productsDao.findById(...)`
  回傳型別應是 `Optional<Products>`，但直接賦值給 `Products`，編譯時可能報錯

### ⚠️ 問題 6：後端無認證機制（Auth / JWT）

- 目前所有端點**無身分驗證保護**
- 員工、管理員、會員的操作都需要確認身分
- 建議後端實作 Session 或 JWT Token，前端 HttpClient 需帶 Authorization header

### ⚠️ 問題 7：OrdersService 歷史訂單 getFullOrderHistory 的 row index 對應

- `getAllOrders()` 第 143-155 行對 `Object[] row` 的 index 賦值有潛在錯誤：
  - `row[3]` 同時被用作 `totalAmount`（BigDecimal）和 `quantity`（int）→ 應是不同欄位
  - 需確認 DAO 的 SQL 欄位順序是否對應正確

---

## 六、建議串接優先順序

```
第一優先（核心流程可運作）
  1. Products API（商品列表）  → 菜單、POS 可顯示真實商品
  2. Members 登入 API          → 前端 auth.service 能真正驗證
  3. PromotionsController      → 暴露已完成的 calculate 端點

第二優先（購物車 → 下單流程）
  4. 前端串接 /api/cart/sync   → 購物車真正同步後端
  5. 前端串接 Orders/createOrdersRes + Orders/pay

第三優先（後台管理功能）
  6. Staff 登入 + 帳號管理 API
  7. 前端 manager-dashboard 串接 branches、tax、promotions
  8. 前端 manager-dashboard 串接 products CRUD

第四優先（次要功能）
  9. 前端訂單歷史串接 Orders/GetAllOrdersList
  10. 財報功能（需評估是否後端實作）
```

---

*文件由 Claude Code 自動分析產生，如有疑問請對照原始碼確認。*

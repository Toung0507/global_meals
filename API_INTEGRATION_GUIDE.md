# Global Meals — 後端串接完整指南

> 更新日期：2026-04-19  
> 對應後端版本：`global_meals_gradle`  
> 對應前端分支：`dev-Ataya`

---

## 一、串接前置作業

### 1-1 啟用真實後端
開啟 [src/app/shared/api.config.ts](src/app/shared/api.config.ts)，修改兩個設定：

```typescript
MOCK_MODE: false,                     // ← false = 發真實 HTTP 請求
BASE_URL: 'http://localhost:8080',    // ← 後端 Spring Boot 位址
```

### 1-2 後端 CORS 設定
後端每個 Controller 目前只允許 `http://localhost:4200`。  
ngrok 或正式部署時，需在後端的 `@CrossOrigin` 改為萬用或指定正式網域：

```java
@CrossOrigin(origins = "*", allowCredentials = "false")
// 或使用 Spring Security 的 CorsConfigurationSource 做統一設定
```

---

## 二、已完成後端 API 一覽

### 2-1 購物車（CartController）
**Base Path：** `/lazybaobao/cart/`

| Method | Path | 說明 | 前端方法 |
|--------|------|------|---------|
| GET | `/lazybaobao/cart/{cartId}?memberId=X` | 查看購物車 | `apiService.viewCart()` |
| POST | `/lazybaobao/cart/sync_item` | 新增/更新商品數量 | `apiService.syncCart()` |
| DELETE | `/lazybaobao/cart/remove_item` | 刪除單一品項 | `apiService.removeCartItem()` |
| POST | `/lazybaobao/cart/select_gift` | 選擇贈品 | `apiService.selectGift()` |
| DELETE | `/lazybaobao/cart/clear_cart` | 清空購物車 | `apiService.clearCart()` |

**Request / Response 範例：**
```json
// POST /lazybaobao/cart/sync_item
{
  "cartId": null,          // 新建傳 null，已有傳 id
  "globalAreaId": 1,       // 新建時必填
  "productId": 3,
  "quantity": 2,
  "operationType": "CUSTOMER",
  "memberId": 1            // 訪客固定傳 1
}

// Response (CartViewRes)
{
  "code": 200,
  "cartId": 7,
  "globalAreaId": 1,
  "operationType": "CUSTOMER",
  "items": [
    { "detailId": 1, "productId": 3, "productName": "蚵仔煎",
      "quantity": 2, "price": 80.0, "isGift": false, "lineTotal": 160.0 }
  ],
  "subtotal": 160.0,
  "availablePromotions": [],
  "taxInfo": { "taxRate": 0.05, "taxType": "INCLUSIVE", "taxAmount": 7.62 },
  "totalAmount": 160.0,
  "warningMessages": []
}
```

---

### 2-2 訂單（OrdersController）
**Base Path：** `/lazybaobao/orders/`

| Method | Path | 說明 | 前端方法 |
|--------|------|------|---------|
| POST | `/lazybaobao/orders/create_order` | 成立訂單（UNPAID） | `apiService.createOrder()` |
| POST | `/lazybaobao/orders/pay` | 現金結帳（→ COMPLETED） | `apiService.pay()` |
| GET | `/lazybaobao/orders/get_order_by_phone?phone=X` | 電話查詢 UNPAID 訂單 | `apiService.getOrderByPhone()` |
| POST | `/lazybaobao/orders/get_all_orders` | 會員歷史訂單 | `apiService.getAllOrders()` |
| POST | `/lazybaobao/orders/update_status` | 取消/退款 | `apiService.updateOrderStatus()` |
| GET | `/lazybaobao/orders/today_orders` | POS 看板：今日訂單 | `apiService.getTodayOrders()` |
| POST | `/lazybaobao/orders/kitchen_status` | 更新廚房狀態 | `apiService.updateKitchenStatus()` |
| GET | `/lazybaobao/orders/order_status?id=X&orderDateId=Y` | 客戶輪詢廚房狀態 | `apiService.getOrderStatus()` |
| GET | `/lazybaobao/goPay?orderDateId=X&id=Y&way=ECPAY` | 跳轉金流付款頁 | 直接 window.location |
| POST | `/api/payment/callback` | 綠界金流回調（後端接收） | - |
| GET | `/linepay/confirm` | LINE Pay 確認付款（後端接收） | - |

**Request 範例：**
```json
// POST /lazybaobao/orders/create_order
{
  "orderCartId": "7",        // ⚠ String 型別
  "globalAreaId": 1,
  "memberId": 1,
  "phone": "0912-345-678",
  "subtotalBeforeTax": 595.00,
  "taxAmount": 0.00,
  "totalAmount": 595.00,
  "orderCartDetailsList": [
    { "productId": 1, "quantity": 1, "isGift": false }
  ]
}

// POST /lazybaobao/orders/pay
{
  "id": "0001",              // ⚠ String，4碼流水號
  "orderDateId": "20260419",
  "paymentMethod": "CASH",
  "transactionId": "CASH_PAYMENT"
}
```

---

### 2-3 促銷活動（PromotionsManageController）
**Base Path：** `/lazybaobao/promotions/`

| Method | Path | 說明 | 前端方法 |
|--------|------|------|---------|
| GET | `/lazybaobao/promotions/list` | 取得全部活動 | `apiService.getPromotionsList()` |
| POST | `/lazybaobao/promotions/create` | 建立活動（可附贈品）| `apiService.createPromotion()` |
| POST | `/lazybaobao/promotions/toggle_status` | 啟用/停用活動 | `apiService.togglePromotion()` |
| DELETE | `/lazybaobao/promotions/delete/{id}` | 刪除活動 | ⚠ 前端尚未實作 |
| POST | `/lazybaobao/promotions/add_gift` | 新增贈品規則 | `apiService.addGift()` |
| POST | `/lazybaobao/promotions/calculate` | 結帳計算促銷 | `apiService.calculatePromotion()` |
| POST | `/lazybaobao/promotions/get_available_gifts?amount=X` | 取得可選贈品 | `apiService.getAvailableGifts()` |

---

### 2-4 分店（GlobalAreaController）
**Base Path：** `/lazybaobao/global_area/`

| Method | Path | 說明 | 前端方法 |
|--------|------|------|---------|
| GET | `/lazybaobao/global_area/get_all_branch` | 取得全部分店 | `apiService.getAllBranches()` |
| POST | `/lazybaobao/global_area/create` | 新增分店 | `apiService.createBranch()` |
| POST | `/lazybaobao/global_area/update` | 修改分店 | `apiService.updateBranch()` |
| POST | `/lazybaobao/global_area/delete` | 刪除分店（批次） | `apiService.deleteBranch()` |

**⚠ 注意：** 新版 DB Schema 的 `global_area` 改用 `regions_id` 取代 `country`，  
後端 `GlobalAreaController` 的 `CreateGlobalAreaReq` / `UpdateGlobalAreaReq` 需對應修改。

---

### 2-5 稅率（RegionsController）
**Base Path：** `/lazybaobao/regions/`

| Method | Path | 說明 | 前端方法 |
|--------|------|------|---------|
| GET | `/lazybaobao/regions/get_all_tax` | 取得全部國家稅率 | `apiService.getAllTax()` |
| POST | `/lazybaobao/regions/create` | 新增國家稅率 | `apiService.createRegion()` |
| POST | `/lazybaobao/regions/update` | 更新國家稅率 | `apiService.updateRegion()` |

---

### 2-6 匯率（ExchangeRatesController）
**Base Path：** `/lazybaobao/exchange_rates/`

| Method | Path | 說明 | 前端方法 |
|--------|------|------|---------|
| GET | `/lazybaobao/exchange_rates/get_all_rates` | 取得全部匯率 | `apiService.getAllRates()` |
| POST | `/lazybaobao/exchange_rates/get_rates_by_date` | 依日期查詢匯率 | `apiService.getRatesByDate()` |

---

### 2-7 會員（MembersController）
**Base Path：** `members/`（無 lazybaobao 前綴）

| Method | Path | 說明 | 前端方法 |
|--------|------|------|---------|
| POST | `members/register_guest` | 訪客快速建立（無密碼） | `apiService.registerGuest()` |
| POST | `members/register_member` | 正式會員註冊（需密碼） | `apiService.registerMember()` |
| POST | `members/login` | 會員登入 | `apiService.memberLogin()` |
| GET | `members/logout` | 會員登出 | `apiService.memberLogout()` |
| POST | `members/update_password` | 修改密碼 | `apiService.updateMemberPassword()` |

---

### 2-8 員工（StaffController）
**Base Path：** `api/auth/` 和 `api/admin/`（無 lazybaobao 前綴）

| Method | Path | 說明 | 前端方法 |
|--------|------|------|---------|
| POST | `api/auth/login` | 員工登入 | `apiService.staffLogin()` |
| GET | `api/auth/logout` | 員工登出 | `apiService.staffLogout()` |
| GET | `api/admin/staff` | 取得員工清單 | `apiService.getAllStaff()` |
| POST | `api/admin/staff` | 新增員工 | `apiService.createStaff()` |
| PATCH | `api/admin/staff/{id}/status` | 停權/復權 | `apiService.updateStaffStatus()` |
| PATCH | `api/admin/staff/{id}/password` | 修改密碼 | `apiService.changeStaffPassword()` |

**員工角色（role）對照表：**
| 後端值 | 前端值 | 說明 |
|--------|--------|------|
| `ADMIN` | `boss` | 老闆，最高權限 |
| `REGION_MANAGER` | `branch_manager` | 分店長 |
| `MANAGER_AGENT` | `deputy_manager` | 副店長 |
| `STAFF` | `staff` | 一般員工 |

---

## 三、尚未建立的後端 API（待開發）

### 3-1 商品管理（ProductsController）⚠ 後端待建立

**建議 Base Path：** `/lazybaobao/products/`

| Method | Path | 說明 |
|--------|------|------|
| GET | `/lazybaobao/products/active?globalAreaId=X` | 取得上架商品（含分店售價） |
| GET | `/lazybaobao/products/get_all` | 取得全部商品（含下架，管理端） |
| GET | `/lazybaobao/products/{id}/image` | 取得商品圖片（BLOB → Base64） |
| POST | `/lazybaobao/products/create` | 新增商品 |
| POST | `/lazybaobao/products/update` | 修改商品資訊 |
| POST | `/lazybaobao/products/toggle` | 上/下架切換 |

**前端 api.config.ts 已預留 PRODUCTS 端點設定（api.config.ts:103）**

**注意：** `products.food_img` 為 `MEDIUMBLOB`，列表 API 不應包含此欄位，  
圖片應透過獨立的 `/image` 端點以 Base64 回傳。

---

### 3-2 分店庫存管理（BranchInventoryController）⚠ 後端待建立

**建議 Base Path：** `/lazybaobao/branch_inventory/`

| Method | Path | 說明 |
|--------|------|------|
| GET | `/lazybaobao/branch_inventory/{areaId}` | 取得該分店庫存清單 |
| POST | `/lazybaobao/branch_inventory/update` | 更新分店庫存或售價 |

**前端 api.config.ts 已預留 BRANCH_INVENTORY 端點設定（api.config.ts:112）**

**注意：** 新 DB Schema 中 `products` 已移除 `base_price`、`max_order_quantity`、`stock_quantity`，  
改由 `branch_inventory` 管理，每個分店可對同一商品設定不同售價。

---

## 四、SQL 改動腳本（舊 → 新 Schema 遷移）

> 將正在使用的「舊版」DB（20260417(舊).sql）遷移至「最新版」Schema（20260417-3.sql）

```sql
-- ============================================================
-- Global Meals DB 遷移腳本
-- 來源：20260417(舊).sql（正在使用）
-- 目標：20260417-3.sql（最新設計）
-- 執行前請先備份！
-- ============================================================

-- ────────────────────────────────────────────────────
-- 1. regions：新增 country_code、usage_cap；移除唯一鍵
-- ────────────────────────────────────────────────────
ALTER TABLE `regions`
  ADD COLUMN `country_code` char(3) DEFAULT NULL AFTER `country`,
  ADD COLUMN `usage_cap` int DEFAULT '0' AFTER `tax_type`,
  DROP INDEX `country_UNIQUE`;

-- 補填現有資料的 country_code（需手動對照）
UPDATE `regions` SET `country_code` = 'KRW' WHERE `country` = '韓國';
UPDATE `regions` SET `country_code` = 'JPY' WHERE `country` = '日本';
UPDATE `regions` SET `country_code` = 'TWD' WHERE `country` = '台灣';

-- ────────────────────────────────────────────────────
-- 2. global_area：新增 regions_id；移除 country、country_code
--    ⚠ 執行前先補填 regions_id，避免資料遺失
-- ────────────────────────────────────────────────────
ALTER TABLE `global_area`
  ADD COLUMN `regions_id` int NOT NULL DEFAULT '0' FIRST;

-- 補填現有分店的 regions_id（依據 country 對應 regions.id）
UPDATE `global_area` g
  JOIN `regions` r ON g.`country` = r.`country`
  SET g.`regions_id` = r.`id`;

-- 確認補填無誤後再移除欄位
ALTER TABLE `global_area`
  DROP COLUMN `country`,
  DROP COLUMN `country_code`;

-- ────────────────────────────────────────────────────
-- 3. products：移除 base_price、max_order_quantity、stock_quantity
--    ⚠ 執行前需先將資料遷移至 branch_inventory
-- ────────────────────────────────────────────────────

-- 先將 products 的價格/庫存資料補進 branch_inventory（以 global_area_id=1 為例）
INSERT INTO `branch_inventory` (`product_id`, `global_area_id`, `stock_quantity`, `base_price`, `max_order_quantity`)
SELECT `id`, 1, `stock_quantity`, `base_price`, `max_order_quantity`
FROM `products`
ON DUPLICATE KEY UPDATE
  `stock_quantity` = VALUES(`stock_quantity`),
  `base_price`     = VALUES(`base_price`),
  `max_order_quantity` = VALUES(`max_order_quantity`);

-- 確認資料已遷移後再移除欄位
ALTER TABLE `products`
  DROP COLUMN `base_price`,
  DROP COLUMN `max_order_quantity`,
  DROP COLUMN `stock_quantity`;

-- ────────────────────────────────────────────────────
-- 4. orders：移除 kitchen_status
--    ⚠ 注意：後端 OrdersController 及前端 POS 廚房看板
--       目前依賴此欄位！移除前需確認已改用其他方案
--       （建議：保留欄位，或另建 kitchen_orders 資料表）
-- ────────────────────────────────────────────────────
-- ALTER TABLE `orders` DROP COLUMN `kitchen_status`;
-- ↑ 暫時保留不執行，先確認 POS 廚房功能的替代方案

-- ────────────────────────────────────────────────────
-- 5. monthly_financial_reports：替換 country_code → regions_id；
--    更新 total_amount 精度
-- ────────────────────────────────────────────────────
ALTER TABLE `monthly_financial_reports`
  ADD COLUMN `regions_id` int DEFAULT '0' AFTER `branch_id`,
  MODIFY COLUMN `total_amount` decimal(19,4) DEFAULT NULL;

-- 補填 regions_id（若 country_code 有值，對應 regions）
UPDATE `monthly_financial_reports` m
  JOIN `regions` r ON m.`country_code` = r.`currency_code`
  SET m.`regions_id` = r.`id`
  WHERE m.`country_code` IS NOT NULL;

-- 確認補填後移除舊欄位
ALTER TABLE `monthly_financial_reports`
  DROP COLUMN `country_code`;

-- ────────────────────────────────────────────────────
-- 6. branch_inventory：調整 base_price 預設值
-- ────────────────────────────────────────────────────
ALTER TABLE `branch_inventory`
  MODIFY COLUMN `base_price` decimal(12,2) DEFAULT NULL;

-- ============================================================
-- 遷移完成後驗證查詢
-- ============================================================
DESCRIBE `global_area`;
DESCRIBE `regions`;
DESCRIBE `products`;
DESCRIBE `orders`;
DESCRIBE `monthly_financial_reports`;
DESCRIBE `branch_inventory`;
```

---

## 五、新 Schema 對應的後端 Req 需更新項目

### 5-1 GlobalArea 相關（影響 GlobalAreaController）

**CreateGlobalAreaReq.java 需修改：**
```java
// 舊版
private String country;     // 移除
private String countryCode; // 移除

// 新版
private int regionsId;      // 新增，關聯 regions.id
private String branch;
private String address;
private String phone;
```

**前端對應（api.service.ts:313）：**
```typescript
// 舊版
export interface CreateGlobalAreaReq {
  country: string;   // 移除
  branch: string;
  address: string;
  phone: string;
}

// 新版
export interface CreateGlobalAreaReq {
  regionsId: number; // 新增
  branch: string;
  address: string;
  phone: string;
}
```

### 5-2 GlobalAreaVO 回傳格式更新

```typescript
// 舊版 GlobalAreaVO
export interface GlobalAreaVO {
  id: number;
  country: string;  // 移除
  branch: string;
  address: string;
  phone: string;
}

// 新版 GlobalAreaVO
export interface GlobalAreaVO {
  id: number;
  regionsId: number;    // 新增
  regionsName?: string; // 建議後端 JOIN 帶出（方便前端顯示）
  branch: string;
  address: string;
  phone: string;
}
```

### 5-3 Products 相關（新建 ProductsController）

```typescript
// 新增到 api.service.ts 的型別定義
export interface ProductVO {
  id: number;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  // ⚠ 不包含 food_img（圖片用獨立端點）
  // 以下由 branch_inventory 提供（呼叫 /products/active?globalAreaId=X）
  basePrice: number;
  stockQuantity: number;
  maxOrderQuantity: number;
}

export interface CreateProductReq {
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
  // 同時建立分店庫存
  globalAreaId: number;
  basePrice: number;
  stockQuantity: number;
  maxOrderQuantity: number;
}
```

---

## 六、前端各元件的串接待辦清單

| 元件 | 狀態 | 需串接的 API |
|------|------|-------------|
| `customer-login` | ✅ 已串接 auth.service.loginMember() | members/login |
| `customer-register` | ⚠ 待確認 | members/register_member |
| `customer-guest` | ⚠ 待確認 | members/register_guest |
| `customer-home` | ⚠ Mock 商品資料 | products/active（待建） |
| `pos-terminal` | ⚠ 部分 Mock | orders/today_orders、orders/kitchen_status |
| `manager-dashboard` | ⚠ 部分 Mock | staff、global_area、regions、promotions |
| `qr-entry` | ⚠ 新元件 | 確認 QR 進入流程 URL 參數 |

---

## 七、付款流程完整說明

```
顧客端                    前端                     後端
  │                        │                         │
  │── 確認結帳 ──────────►│                         │
  │                        │── createOrder() ───────►│ POST /orders/create_order
  │                        │◄─ { id, orderDateId } ──│
  │                        │                         │
  │── 選擇付款方式 ───────►│                         │
  │                        │                         │
  │  [現金]                │── pay() ───────────────►│ POST /orders/pay
  │                        │◄─ { code: 200 } ────────│
  │                        │                         │
  │  [刷卡/LINE Pay]       │── window.location ──────►│ GET /goPay?way=ECPAY
  │                        │                         │ （後端組 HTML Form 送出）
  │                        │                         │
  │◄── 金流完成導回 ───────│                         │── 後端 callback 接收
  │                        │                         │   POST /api/payment/callback
```

---

## 八、重要注意事項

1. **`orders.id` 是 `String`（4碼流水號）**，前端呼叫時需 `String(cartId)`，勿傳 `number`
2. **`kitchen_status` 欄位目前僅存在於舊版 DB**，新 Schema 移除此欄位前 POS 廚房功能仍依賴它
3. **訪客 memberId 固定傳 `1`**（後端以此識別訪客，需確保 members 表有 id=1 的訪客記錄）
4. **`products.food_img` 是 MEDIUMBLOB**，清單 API 禁止包含此欄位，否則資料量過大
5. **Session-based 認證**：員工與會員皆用 `withCredentials: true`，前端必須設定 Angular 的 `HttpClient` 攜帶 Cookie
6. **`CartSyncReq.quantity` 最小值為 1**，要減少數量請用 DELETE `/cart/remove_item`

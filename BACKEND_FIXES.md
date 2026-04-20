# 後端修正紀錄（Backend Fixes）

> 記錄 API 串接過程中發現並修正的後端程式碼錯誤。
> 修正日期：2026-04-12

---

## 1. `application.properties` — 啟動失敗三個問題

**路徑：** `src/main/resources/application.properties`

### 問題 1：MySQL 公鑰驗證失敗

```
錯誤訊息：Public Key Retrieval is not allowed
```

**原因：** MySQL 8.0 預設使用 `caching_sha2_password`，連線時需要取得公鑰，但 JDBC URL 未允許此行為。

```properties
# ❌ 原本（缺少參數）
spring.datasource.url=jdbc:mysql://localhost:3306/global_meals
```

```properties
# ✅ 修正後
spring.datasource.url=jdbc:mysql://localhost:3306/global_meals?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Taipei
```

---

### 問題 2：資料庫密碼錯誤

```
錯誤訊息：Access denied for user 'root'@'localhost'
```

**原因：** `application.properties` 中的密碼與本機 MySQL root 密碼不符。

```properties
# ❌ 原本（密碼錯誤）
spring.datasource.password=root
```

```properties
# ✅ 修正後（依實際 MySQL root 密碼修改）
spring.datasource.password=1234
```

---

### 問題 3：匯率 API Key 找不到

```
錯誤訊息：Could not resolve placeholder 'rate.api.key' in value "${rate.api.key}"
```

**原因：** `ExchangeRatesService` 注入了 `${rate.api.key}`，但 `application.properties` 沒有這個設定，導致啟動時直接崩潰。

```properties
# ❌ 原本（沒有此設定）
（無此行）
```

```properties
# ✅ 修正後（加入 placeholder，Demo 期間填 demo 即可）
rate.api.key=demo
```

---

## 2. `CreateOrdersReq.java` — Jackson 無法反序列化欄位名稱

**路徑：** `src/main/java/.../req/CreateOrdersReq.java`

**問題：** 欄位命名以大寫 `O` 開頭（`OrderCartDetailsList`），Jackson 預設不會將 JSON 的 `orderCartDetailsList`（小寫 o）映射到此欄位，導致前端送出的 `orderCartDetailsList` 陣列一直被視為 null，`@NotEmpty` 驗證永遠失敗，回傳 400 Bad Request。

```java
// ❌ 原本（欄位名大寫開頭，Jackson 無法對應前端的 orderCartDetailsList）
@NotEmpty(message = ValidationMsg.ORDER_CART_DETAILS_NOT_EMPTY)
@Valid
private List<OrderCartDetails> OrderCartDetailsList;
```

```java
// ✅ 修正後（加上 @JsonProperty 強制指定 JSON key 名稱）
@NotEmpty(message = ValidationMsg.ORDER_CART_DETAILS_NOT_EMPTY)
@Valid
@JsonProperty("orderCartDetailsList")   // ← 加這行，明確告訴 Jackson 要對應的 JSON key
private List<OrderCartDetails> OrderCartDetailsList;
```

> **根本原因：** Java 欄位命名規範應使用小寫開頭（lowerCamelCase），例如 `orderCartDetailsList`。
> 此次以 `@JsonProperty` 修補，未來重構時建議直接把欄位名改成小寫。

---

## 3. `OrdersDao.java` — 四處 SQL 錯誤

**路徑：** `src/main/java/.../dao/OrdersDao.java`

---

### 問題 3-1：`insert` — VALUES 佔位符數量不足

**問題：** INSERT 語句有 9 個欄位（`id, order_date_id, order_cart_id, global_area_id, member_id, phone, subtotal_before_tax, tax_amount, total_amount`），但 VALUES 只有 `?1` 到 `?7`，少了 `?8`（taxAmount）和 `?9`（totalAmount），導致 INSERT 執行時報 `parameter index out of range` 或 `Column count doesn't match value count`。

```java
// ❌ 原本（VALUES 只有 ?7，少了 ?8、?9）
@Query(value = "INSERT INTO orders (id, order_date_id, order_cart_id, global_area_id, member_id, phone, "
        + " subtotal_before_tax, tax_amount, total_amount) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)", nativeQuery = true)
public void insert(String id, String orderDateId, String orderCartId, int globalAreaId, int memberId, String phone,
        BigDecimal subtotalBeforeTax, BigDecimal taxAmount, BigDecimal totalAmount);
```

```java
// ✅ 修正後（補上 ?8、?9）
@Query(value = "INSERT INTO orders (id, order_date_id, order_cart_id, global_area_id, member_id, phone, "
        + " subtotal_before_tax, tax_amount, total_amount) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)", nativeQuery = true)
public void insert(String id, String orderDateId, String orderCartId, int globalAreaId, int memberId, String phone,
        BigDecimal subtotalBeforeTax, BigDecimal taxAmount, BigDecimal totalAmount);
```

---

### 問題 3-2：`updatePay` — 參數型別為 Enum，native query 無法轉字串

**問題：** Native query（`nativeQuery = true`）直接操作 SQL，無法自動將 Java Enum 物件轉換為資料庫中的字串值，導致 SQL 執行時傳入的是 Enum 物件的記憶體表示而非 `"COMPLETED"` 字串，UPDATE 失敗。

```java
// ❌ 原本（最後一個參數型別是 OrdersStatus Enum，native query 無法處理）
@Query(value = "UPDATE orders SET payment_method = ?3, transaction_id = ?4, status = ?5 WHERE id = ?1 "
        + " AND order_date_id = ?2", nativeQuery = true)
public void updatePay(String id, String orderDateId, String paymentMethod, String transactionId,
        OrdersStatus status);
```

```java
// ✅ 修正後（改為 String，由呼叫端負責傳入 .name() 字串）
@Query(value = "UPDATE orders SET payment_method = ?3, transaction_id = ?4, status = ?5 WHERE id = ?1 "
        + " AND order_date_id = ?2", nativeQuery = true)
public void updatePay(String id, String orderDateId, String paymentMethod, String transactionId,
        String status);
```

---

### 問題 3-3：`updateOrderStatus` — 欄名錯誤 + `@Param` 名稱不符

**問題：兩個同時存在的錯誤：**
1. SQL 中寫的是 `date_id`，但資料表欄位實際名稱是 `order_date_id`
2. `@Param("order_date_id")` 與 SQL 中 `:orderDateId` 名稱不一致（底線 vs 駝峰），Spring Data JPA 無法綁定參數，WHERE 條件永遠不成立

```java
// ❌ 原本（欄名錯 + @Param 名稱對不上 SQL 中的 :orderDateId）
@Query(value = "UPDATE orders SET status = :status WHERE id = :id AND date_id = :order_date_id AND status = 'COMPLETED'", nativeQuery = true)
public int updateOrderStatus(@Param("status") OrdersStatus status,
        @Param("id") String id, @Param("order_date_id") String orderDateId);
```

```java
// ✅ 修正後（欄名改為 order_date_id，@Param 改為 orderDateId 對應 SQL 中的 :orderDateId）
@Query(value = "UPDATE orders SET status = :status WHERE id = :id AND order_date_id = :orderDateId AND status = 'COMPLETED'", nativeQuery = true)
public int updateOrderStatus(@Param("status") OrdersStatus status,
        @Param("id") String id, @Param("orderDateId") String orderDateId);
```

---

### 問題 3-4：`upDateTotalAmount` — SQL 缺少 `orders SET`

**問題：** `UPDATE` 語句格式為 `UPDATE <table> SET <column> = <value>`，但原本寫成 `UPDATE total_amount = ?3`，完全跳過了資料表名稱與 `SET` 關鍵字，SQL 語法錯誤直接無法執行。

```java
// ❌ 原本（缺少 orders SET，語法錯誤）
@Query(value = "UPDATE total_amount = ?3 WHERE id = ?1 AND order_date_id = ?2", nativeQuery = true)
public void upDateTotalAmount(String id, String orderDateId, BigDecimal totalAmount);
```

```java
// ✅ 修正後（補上 orders SET）
@Query(value = "UPDATE orders SET total_amount = ?3 WHERE id = ?1 AND order_date_id = ?2", nativeQuery = true)
public void upDateTotalAmount(String id, String orderDateId, BigDecimal totalAmount);
```

---

## 4. `OrdersService.java` — `pay()` 傳入 Enum 物件而非字串

**路徑：** `src/main/java/.../service/OrdersService.java`

**問題：** 問題 3-2 修正 `updatePay` 的參數型別為 `String` 後，`OrdersService.pay()` 仍然傳入 `OrdersStatus.COMPLETED`（Enum 物件），型別不符，編譯期或執行期直接報錯。

```java
// ❌ 原本（傳 Enum 物件，但 DAO 現在要求 String）
ordersDao.updatePay(req.getId(), req.getOrderDateId(),
        req.getPaymentMethod(), req.getTransactionId(),
        OrdersStatus.COMPLETED);  // ← Enum 物件
```

```java
// ✅ 修正後（呼叫 .name() 取得 Enum 對應的字串 "COMPLETED"）
ordersDao.updatePay(req.getId(), req.getOrderDateId(),
        req.getPaymentMethod(), req.getTransactionId(),
        OrdersStatus.COMPLETED.name());  // ← 字串 "COMPLETED"
```

> **補充：** `.name()` 是 Java Enum 的內建方法，回傳 Enum 常數的宣告名稱字串（即程式碼中寫的那個名字）。
> 例如：`OrdersStatus.COMPLETED.name()` → `"COMPLETED"`。

---

## 修正總覽

| 檔案 | 問題數 | 問題說明 |
|------|:------:|----------|
| `application.properties` | 3 | MySQL 公鑰、密碼、匯率 key 缺失 |
| `CreateOrdersReq.java` | 1 | 欄位名大寫導致 Jackson 無法反序列化 |
| `OrdersDao.java` | 4 | VALUES 數量、updatePay 型別、欄名錯誤、SQL 語法缺字 |
| `OrdersService.java` | 1 | pay() 傳 Enum 物件而非字串 |
| **合計** | **9** | — |

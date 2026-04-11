# Global Meals — API 串接測試結果

> 測試日期：**2026-04-11**
> 測試人員：前端開發（林家齊）
> 後端環境：Spring Boot `localhost:8080`（本機啟動）
> 前端環境：Angular `localhost:4200`（ng serve）

---

## 🔴 模組 C：權限安全與系統自動化組

> 負責稅率、分店管理、促銷規則維護

### ✅ 分店管理（GlobalAreaController）

`@RequestMapping: lazybaobao/global_area`

| 方法         | 端點                                    | HTTP | 測試結果    | 備註                                              |
| ------------ | --------------------------------------- | ---- | ----------- | ------------------------------------------------- |
| 取得全部分店 | `lazybaobao/global_area/get_all_branch` | GET  | ✅ **成功** | 瀏覽器回傳 `{"code":200,"globalAreaList":[],...}` |
| 新增分店     | `lazybaobao/global_area/create`         | POST | ✅ **成功** | 資料確認寫入 `global_area` 資料表                 |
| 修改分店     | `lazybaobao/global_area/update`         | POST | ✅ **成功** | 修改地址後 MySQL Workbench 確認更新               |
| 刪除分店     | `lazybaobao/global_area/delete`         | POST | ✅ **成功** | `{ globalAreaIdList: [id] }` 格式，支援批次刪除   |

**注意事項：**

- 電話欄位後端有 `@Length(min=10, max=10)` 限制，**僅接受 10 位數**（建議後端改為 `max=15` 以支援國際格式）
- 刪除 API request body 格式：`{ "globalAreaIdList": [1, 2, 3] }`（List，非單一 id）

---

### ✅ 稅率管理（RegionsController）

`@RequestMapping: lazybaobao/regions`

| 方法         | 端點                             | HTTP | 測試結果                | 備註                                                     |
| ------------ | -------------------------------- | ---- | ----------------------- | -------------------------------------------------------- |
| 取得全部稅率 | `lazybaobao/regions/get_all_tax` | GET  | ✅ **成功**             | 回傳 `regionsList` 陣列，前端正確換算（×100 顯示百分比） |
| 新增稅率     | `lazybaobao/regions/create`      | POST | ✅ **成功**             | 資料確認寫入 `regions` 資料表                            |
| 修改稅率     | `lazybaobao/regions/update`      | POST | ✅ **成功**（邏輯驗證） | 前端 inline 編輯後送出，API 回應正常                     |

**Response 結構確認：**

```json
{
  "code": 200,
  "regionsList": [
    {
      "id": 1,
      "country": "韓國",
      "currencyCode": "KRW",
      "taxRate": 0.077,
      "taxType": "INCLUSIVE"
    }
  ]
}
```

**注意事項：**

- `taxRate` 後端儲存小數（如 `0.0770`），前端顯示時 ×100 轉為百分比（`7.70%`）
- `regions` 資料表無 `branch` 欄位，前端顯示副標使用 `currencyCode` 取代

---

### ✅ 促銷活動管理（PromotionsManageController）

`@RequestMapping: lazybaobao/promotions`

| 方法          | 端點                                        | HTTP | 測試結果    | 備註                                 |
| ------------- | ------------------------------------------- | ---- | ----------- | ------------------------------------ |
| 取得促銷列表  | `lazybaobao/promotions/list`                | GET  | ✅ **成功** | 瀏覽器確認回傳 200，前端 UI 正常載入 |
| 新增活動      | `lazybaobao/promotions/create`              | POST | ✅ **成功** | 資料寫入 `promotions` 資料表，UI 正常顯示 |
| 啟用/停用切換 | `lazybaobao/promotions/toggle_status`       | POST | ✅ **成功** | UI 即時切換，DB `is_active` 同步更新      |
| 計算促銷金額  | `lazybaobao/promotions/calculate`           | POST | ⏳ **待測** | 結帳流程觸發，與模組 A 訂單串接相關       |
| 取得可選贈品  | `lazybaobao/promotions/get_available_gifts` | POST | ⏳ **待測** | 需有贈品規則資料                          |
| 新增贈品規則  | `lazybaobao/promotions/add_gift`            | POST | ✅ **成功** | 資料寫入 `promotions_gifts`，外鍵正確對應 |

---

## 🟢 模組 A：交易與忠誠度開發組

> 負責購物車、訂單、結帳

| 端點                                   | HTTP   | 測試結果    | 備註                                 |
| -------------------------------------- | ------ | ----------- | ------------------------------------ |
| `lazybaobao/cart/:cartId`              | GET    | ⏳ **待測** | 後端 Controller 已建立，前端 mock 中 |
| `lazybaobao/cart/sync_item`            | POST   | ⏳ **待測** | 後端 Controller 已建立               |
| `lazybaobao/cart/remove_item`          | DELETE | ⏳ **待測** | 後端 Controller 已建立               |
| `lazybaobao/cart/select_gift`          | POST   | ⏳ **待測** | 後端 Controller 已建立               |
| `lazybaobao/cart/clear_cart`           | DELETE | ⏳ **待測** | 後端 Controller 已建立               |
| `lazybaobao/orders/create_order`       | POST   | ⏳ **待測** | 後端 Controller 已建立               |
| `lazybaobao/orders/pay`                | POST   | ⏳ **待測** | 後端 Controller 已建立               |
| `lazybaobao/orders/get_all_orders`     | POST   | ⏳ **待測** | 後端 Controller 已建立               |
| `lazybaobao/orders/get_order_by_phone` | GET    | ⏳ **待測** | 後端 Controller 已建立               |
| `lazybaobao/orders/update_status`      | POST   | ⏳ **待測** | 後端 Controller 已建立               |

---

## 🔵 模組 B：跨境菜單與 AI 智慧組

> 負責商品菜單、AI 描述生成

| 端點                  | HTTP | 測試結果    | 備註                                         |
| --------------------- | ---- | ----------- | -------------------------------------------- |
| `/products/active`    | GET  | ⏳ **待測** | 後端 Controller 尚未建立，前端使用 mock 資料 |
| `/products/get_all`   | GET  | ⏳ **待測** | 後端 Controller 尚未建立                     |
| `/products/:id/image` | GET  | ⏳ **待測** | MEDIUMBLOB → Base64，後端待建立              |
| `/products/create`    | POST | ⏳ **待測** | 後端 Controller 尚未建立                     |
| `/products/toggle`    | POST | ⏳ **待測** | 後端 Controller 尚未建立                     |

---

## 後端已啟動確認（Spring Boot application.properties）

啟動時解決的問題記錄：

| 問題                                           | 原因                                  | 解決方式                                                |
| ---------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| `Public Key Retrieval is not allowed`          | MySQL 8.0 caching_sha2_password       | JDBC URL 加 `allowPublicKeyRetrieval=true&useSSL=false` |
| `Access denied for user 'root'@'localhost'`    | application.properties 密碼錯誤       | 更新為正確的 MySQL root 密碼                            |
| `Could not resolve placeholder 'rate.api.key'` | ExchangeRatesService 需要匯率 API key | 新增 `rate.api.key=demo` 作為 placeholder               |

---

## 總覽

| 模組                            | 已串接 | 待測   | 後端未建 |
| ------------------------------- | ------ | ------ | -------- |
| 🔴 模組 C（分店 / 稅率 / 促銷） | **10** | 2      | 0        |
| 🟢 模組 A（購物車 / 訂單）      | 0      | **10** | 0        |
| 🔵 模組 B（商品 / AI）          | 0      | 0      | **5**    |

> **已成功串接 10 支 API**，全部屬於模組 C 後台管理功能。
> 模組 A 後端 Controller 已建立，可進行前後端整合測試。
> 模組 B 後端尚未建立，前端持續以 mock 資料展示。

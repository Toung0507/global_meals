# Global Meals — 下次測試啟動指南

> 上次測試日期：**2026-04-11**
> 下次 Demo 日期：**2026-04-13**
> 本檔說明：每次測試前需開啟的程式、設定步驟，以及待測清單。

---

## 一、啟動前置步驟（每次測試必做）

### 步驟 1：啟動後端 Spring Boot

1. 開啟 **Eclipse**
2. 找到 `GlobalMealsGradleApplication.java`，按右鍵 → **Run As → Spring Boot App**
3. 等 Console 出現類似以下訊息，代表啟動成功：
   ```
   Started GlobalMealsGradleApplication in X.XXX seconds
   ```
4. 驗證後端：瀏覽器開啟以下任一網址，確認回傳 JSON（不是錯誤頁）：
   ```
   http://localhost:8080/lazybaobao/global_area/get_all_branch
   http://localhost:8080/lazybaobao/regions/get_all_tax
   http://localhost:8080/lazybaobao/promotions/list
   ```

> ⚠️ 如果 Eclipse 出現以下錯誤，參考下方「常見問題」

---

### 步驟 2：啟動前端 Angular（終端機 1）

```bash
cd C:\Users\齊\Desktop\global_meals
ng serve
```

等出現 `Compiled successfully.` 後，開啟瀏覽器：
```
http://localhost:4200
```

---

### 步驟 3：啟動 ngrok 公開通道（終端機 2，手機掃碼測試才需要）

```bash
ngrok http 4200
```

取得 `Forwarding` 的 `https://xxxx.ngrok-free.app` 網址，供手機掃描 QR Code 用。

> ⚠️ ngrok 免費版每次重啟網址會變，但程式自動抓當前網址，**不需修改任何程式碼**。

---

## 二、常見問題排查

| 錯誤訊息 | 原因 | 解法 |
|---------|------|------|
| `Public Key Retrieval is not allowed` | MySQL 8.0 認證問題 | `application.properties` 的 JDBC URL 需有 `allowPublicKeyRetrieval=true&useSSL=false` |
| `Access denied for user 'root'@'localhost'` | MySQL 密碼錯誤 | 確認 `spring.datasource.password` 為正確的 MySQL root 密碼 |
| `Could not resolve placeholder 'rate.api.key'` | 缺少 API Key 設定 | `application.properties` 加入 `rate.api.key=demo` |
| `Connection refused` | 後端未啟動 | 重新執行步驟 1 |
| 前端顯示 mock 資料（Console 有黃色 warn） | 後端未啟動或 API 路徑錯誤 | 先確認後端已啟動，再重整頁面 |

**`application.properties` 參考設定（後端檔案，不在此 repo）：**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/global_meals?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Taipei
spring.datasource.username=root
spring.datasource.password=（你的 MySQL 密碼）
rate.api.key=demo
```

---

## 三、測試項目清單

> 圖例：✅ 已測試成功 ／ ⏳ 待測 ／ ❌ 測試失敗

### 🔴 模組 C：後台管理（Manager Dashboard）

進入路徑：`http://localhost:4200/manager`（或前台點「後台管理」）

#### 分店管理（GlobalAreaController）

| # | 操作 | 預期結果 | 狀態 |
|---|------|---------|------|
| 1 | 進入分店管理分頁 | 分店列表從 API 載入（不是 mock） | ✅ |
| 2 | 點「新增分店」，填入國家、名稱、地址、電話（10位數），按確認 | 資料新增到 DB，UI 列表出現新分店 | ✅ |
| 3 | 對分店點「編輯」，修改地址後儲存 | DB 資料更新，UI 顯示新地址 | ✅ |
| 4 | 對分店點「刪除」 | DB 資料移除，UI 列表消失，Toast 提示 | ✅ |
| 5 | 確認 Console 無紅色錯誤 | 無 `Error` 訊息 | ✅ |

> ⚠️ 電話限制：後端目前只接受 **恰好 10 位數**（如 `0212345678`）

---

#### 稅率管理（RegionsController）

| # | 操作 | 預期結果 | 狀態 |
|---|------|---------|------|
| 1 | 進入稅率設定分頁 | 稅率列表從 API 載入 | ✅ |
| 2 | 確認稅率顯示為百分比（如 5%，非 0.05） | 數字自動換算（×100） | ✅ |
| 3 | 點「+ 新增國家」，填入國旗、國家名稱、稅率，按確認 | 資料寫入 DB，列表出現新筆 | ✅ |
| 4 | 對既有稅率點「修改」，變更數值後按「儲存」 | DB 資料更新，Toast 提示 | ✅ |
| 5 | 確認 Console 無紅色錯誤 | 無 `Error` 訊息 | ✅ |

---

#### 促銷活動管理（PromotionsManageController）

| # | 操作 | 預期結果 | 狀態 |
|---|------|---------|------|
| 1 | 進入促銷活動分頁 | 活動列表從 API 載入（空 DB 時顯示空列表） | ✅（GET 確認） |
| 2 | 點「新增活動」，填入名稱、開始/結束日期，按確認 | 資料寫入 DB，UI 出現新活動 | ✅ |
| 3 | 點活動右側啟用/暫停按鈕 | 狀態即時切換（樂觀更新），DB 狀態同步 | ✅ |
| 4 | 對活動新增贈品規則（滿額送） | 贈品規則寫入 DB | ✅ |
| 5 | 確認 Console 無紅色錯誤 | 無 `Error` 訊息 | ✅ |

---

### 🟢 模組 A：購物車與訂單（後端 Controller 已建立，待整合）

> 進入路徑：`http://localhost:4200`（客戶端點餐流程）

| # | 操作 | 預期結果 | 狀態 |
|---|------|---------|------|
| 1 | 新增商品至購物車 | 購物車同步到後端（`cart/sync_item`） | ⏳ |
| 2 | 查看購物車（GET cart） | 從後端讀取，而非本地 | ⏳ |
| 3 | 刪除購物車單品 | 後端同步刪除（`cart/remove_item`） | ⏳ |
| 4 | 清空購物車 | 後端同步清空（`cart/clear_cart`） | ⏳ |
| 5 | 完成結帳（建立訂單） | 訂單寫入 DB（`orders/create_order`） | ⏳ |
| 6 | 選擇付款方式並完成付款 | 訂單狀態更新為 COMPLETED（`orders/pay`） | ⏳ |
| 7 | 以電話查詢 UNPAID 訂單 | 回傳未付款訂單清單 | ⏳ |
| 8 | 查看歷史訂單（會員登入後） | 訂單列表從 API 載入（`orders/get_all_orders`） | ⏳ |

---

### 🔵 模組 B：商品管理（後端尚未建立，持續 mock）

| # | 操作 | 預期結果 | 狀態 |
|---|------|---------|------|
| 1 | 前台菜單顯示商品 | 目前為 mock 資料 | ⏳ 後端待建 |
| 2 | 後台商品管理 CRUD | 目前為 mock 資料 | ⏳ 後端待建 |
| 3 | 商品圖片（MEDIUMBLOB） | Base64 載入 | ⏳ 後端待建 |
| 4 | AI 描述生成（Gemini） | 生成文案顯示 | ⏳ 後端待建 |

---

### 📱 行動裝置 / QR Code（需先啟動 ngrok）

| # | 操作 | 預期結果 | 狀態 |
|---|------|---------|------|
| 1 | 執行 `ngrok http 4200`，確認取得 Forwarding URL | 形如 `https://xxxx.ngrok-free.app` | ⏳ |
| 2 | 結帳頁選「行動支付」，掃描 QR Code | 手機開啟正確頁面（非空白） | ⏳ |
| 3 | 手機操作完整點餐流程 | 全程順暢，無排版異常 | ⏳ |
| 4 | 確認 RWD（轉橫屏不破版） | 排版正常 | ⏳ |

---

## 四、已知限制（Demo 前可不修）

| 項目 | 說明 |
|------|------|
| 電話欄位長度 | 後端 `@Length(min=10, max=10)` 限制，需輸入恰好 10 位數（國際格式如 +886 暫不支援）|
| 模組 B 商品 API | 後端尚未建立，前台菜單全為 mock 資料 |
| 模組 A 前後端整合 | 後端 Controller 已有，但前端仍在 mock 模式，需切換串接 |
| 促銷計算 | 需有訂單資料才可完整測試 `promotions/calculate` |
| 匯率自動更新 | `rate.api.key=demo` 為佔位符，不會真正呼叫第三方 API |

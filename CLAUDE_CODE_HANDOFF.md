# 懶飽飽 LazyBaoBao · Claude Code 後續實作交付文件

本文件為 **Claude Code 可讀實作指南**，用於完成「懶飽飽智慧餐飲系統」尚未實作的部分。

---

## 0. 專案現況（Handoff Snapshot）

- **前端**：Angular 17+ Standalone + Signals（`global_meals/`）
- **後端**：Spring Boot + Gradle + MySQL 8（`global_meals_gradle/`）
- **資料庫**：`Dump20260417(本).sql` — 15+ 張表，含 `products`、`orders`、`order_cart*`、`promotions*`、`regions`、`exchange_rates`、`ai_generated`、`staff`、`members`、`global_area`、`branch_inventory`、`monthly_financial_reports`
- **整體完成度**：約 40%（三端 UI 與訂單流程已貫通，核心業務邏輯待補）

---

## 1. 待實作功能（依四大出題分類）

### 🟥 題目 1 — 高併發即時庫存控管
狀態：**部分完成（DB 欄位已有 version，業務邏輯未完整）**

**待辦：**
- [ ] `BranchInventoryService.deductStock(productId, globalAreaId, qty)` — 實作樂觀鎖扣庫存
  - SQL：`UPDATE branch_inventory SET stock_quantity = stock_quantity - ?, version = version + 1 WHERE id = ? AND version = ? AND stock_quantity >= ?`
  - 若 `updated rows == 0` → 拋 `OptimisticLockException`，重試最多 3 次
- [ ] `OrdersService.checkout()` 串接 `deductStock`，`@Transactional(rollbackFor = Exception.class)`
- [ ] 撰寫併發測試：`@SpringBootTest` + `CountDownLatch` 模擬 100 執行緒
- [ ] 悲觀鎖對照實作（`SELECT ... FOR UPDATE`）用於效能比較報告

---

### 🟧 題目 2 — 多國稅率與幣別配置引擎
狀態：**DB 結構已有（regions / exchange_rates），Service 層待補**

**待辦：**
- [ ] `TaxCalculator` 介面（Strategy Pattern）
  ```java
  public interface TaxCalculator {
      TaxResult calculate(BigDecimal subtotal, Region region);
  }
  ```
- [ ] 三個實作：`InclusiveTaxCalculator`、`ExclusiveTaxCalculator`、`MultiTierTaxCalculator`
- [ ] `TaxCalculatorFactory.of(TaxType)` 依 `regions.tax_type` 回傳正確策略
- [ ] 全線強制 `BigDecimal`，所有 `setScale()` 使用可配置 `RoundingMode`
- [ ] 後台 CRUD：`RegionsController` 補 POST/PUT/DELETE
- [ ] `ExchangeRatesScheduler` 實測：呼叫 openexchangerates 或 exchangerate-api，每日 00:00 更新

---

### 🟨 題目 3 — 動態優惠計算引擎（滿額贈）
狀態：**DB 有 promotions / promotions_gifts，連動邏輯未實作**

**待辦：**
- [ ] `PromotionEngine.evaluate(cart)` — 核心入口
  - 計算 `cart.subtotal()` ≥ `promotion.full_amount` → 自動 `addGift()`
  - 主商品被移除 → 重新評估 → 低於門檻時 `removeGift()`
- [ ] `order_cart_details.is_gift=1, price=0` 標記贈品
- [ ] 贈品選擇 API：`GET /promotions/{id}/giftOptions` → 回傳可選贈品清單
- [ ] 前端 `cart.service.ts` 在每次 `add/remove/updateQty` 後呼叫 `recalcPromotions()`
- [ ] 已結束活動（`end_time < NOW()`）的閃爍刪除提示已在 UI 規範，補後端軟刪除 API

---

### 🟦 題目 4 — AI 智慧菜單文案（GenAI）
狀態：**完全未實作，DB 有 `ai_generated` 表**

**待辦：**
- [ ] `AiDescriptionService.generate(productName, category)`
- [ ] 使用 Spring `RestClient`（不用 RestTemplate，較現代）
- [ ] 支援 OpenAI 或 Gemini（建議 Gemini，有免費額度）
- [ ] Prompt 範本：
  ```
  你是餐飲行銷文案專家，請用繁體中文為以下商品寫一段 50 字內行銷描述與 3 個標籤。
  商品名稱：{name}
  分類：{category}
  回傳格式：{"description":"...", "tags":["#tag1","#tag2","#tag3"]}
  ```
- [ ] 異常處理：`@Retryable` + `timeout=10s` + `CircuitBreaker`（Resilience4j 可選）
- [ ] 後台商品頁新增「✨ AI 生成」按鈕，呼叫後回填 `description` 欄位
- [ ] 每次生成寫入 `ai_generated` 表（保留歷史紀錄）

---

## 2. 已知 Bug / 技術債

- [ ] 管理後台側欄副標題 `#c084fc` 紫色 → 替換為 `#C49756` 金色（設計系統規範）
- [ ] Emoji 散落於導覽列 / 按鈕 → 全部換為 SVG icon（16-20px 品牌色）
- [ ] `orders.id` 僅 varchar(4)，每日 0001-9999，單店單日上限 9999 筆 → 需評估擴充
- [ ] `products.food_img` 使用 mediumblob 儲存 → 建議改為 URL + S3/MinIO
- [ ] 多國語言 i18n 尚未導入 → 建議 `@ngx-translate/core`

---

## 3. 測試 / 部署 / 文件

- [ ] JUnit 5 + MockMvc 覆蓋四大題目所有 Controller
- [ ] Swagger/OpenAPI 3（`springdoc-openapi`）暴露所有 REST endpoint
- [ ] Docker Compose：`mysql` + `spring-boot` + `angular (nginx)` 一鍵啟動
- [ ] GitHub Actions CI：`./gradlew test` + `ng test --watch=false`
- [ ] 環境變數抽離 `.env`（目前 application.properties 寫死）

---

## 4. 給 Claude Code 的建議工作順序

1. **先補題目 1（庫存併發）** — 技術主管最容易問的
2. **題目 2（稅率引擎）** — 架構最漂亮、展示價值最高
3. **題目 3（活動連動）** — 前後端都要動，留給熟悉流程後
4. **題目 4（AI 文案）** — 獨立模組，最後做不影響其他

每完成一項，請更新本文件的 checkbox 狀態，並在 commit message 註明 `#題目N`。

---

_Last updated: 2026-04-18 · 供 Claude Code 接手開發使用_

# Demo v2 需求清單（第一次 Demo 後整合版）

> 整合來源：老師回饋 + 評審建議 + 開發者技術筆記
> 整理日期：2026-04-16
> 策略：Approach B 核心功能衝刺（19 項）+ 暫緩（9 項）

---

## 執行順序總覽

```
Day 1-2：P0 純前端（7 項，零後端風險）
Day 3-4：P1 前端部分（日期邏輯、活動分類、詳情頁）
Day 4-5：DB schema + 後端配合（promotions 新欄位）
Day 5-6：P2 QR Code + 折扣券規則 + 計次 bug
Day 7：  多店切換 + 整合測試
```

---

## P0 — 評審直接看到的問題（Day 1-2，純前端）

- [ ] **#01** 登入畫面角色區分（經理 / 分店長 / 收銀員），不顯示完整姓名
  > `staff-login.component.ts` — `role === 'boss'` 路由存在，但登入介面未顯示角色說明
  > `staff-login.component.html` — 左側 Logo 區塊下方加角色 badge，role 對應：
  > `boss` → 經理 / `branch_manager` → 分店長 / `staff` → 現場收銀員

- [ ] **#02** 更新登入頁 Logo
  > `staff-login.component.html` line 38 — `<img src="assets/Logo.png">`
  > `customer-login.component.html` — 同步更換
  > 替換 `src/assets/Logo.png`

- [ ] **#03** 「訂單管理」更名為「我的訂單」
  > `manager-dashboard.component.ts` line 133 — `orders: '📋 訂單管理'` → `orders: '📋 我的訂單'`

- [ ] **#04** 訂單看板卡片顏色區分：待製作（灰）/ 製作中（橘）/ 已完成（綠）
  > `pos-terminal.component.ts` lines 418-442 — `status` 對應：`waiting / cooking / ready / done`
  > `pos-terminal.component.html` — `.omp-order-card` 加 `[class]` 條件綁定：
  > ```
  > [class.status-waiting]="order.status === 'waiting'"   /* 灰 #6B7280 */
  > [class.status-cooking]="order.status === 'cooking'"   /* 橘 #C49756 */
  > [class.status-done]="order.status === 'done'"         /* 綠 #22C55E */
  > ```

- [ ] **#05** 會員管理頁：移除密碼顯示功能
  > `customer-member.component.html` — 找到密碼顯示切換按鈕（eye icon）整段移除
  > 密碼 input 改為 `type="password"` 固定，移除 toggle handler

- [ ] **#06** 不可編輯欄位顯示為唯讀鎖定樣式
  > `manager-dashboard.component.html` — 帳號、員工 ID 等唯讀欄位加 `disabled` + 鎖頭 icon
  > `customer-member.component.html` — 同上，加 `readonly` + 視覺鎖定樣式

- [ ] **#07** 移除安全庫存提醒功能
  > `manager-dashboard.component.html` line 534 — 刪除 `<th>安全庫存</th>` 欄
  > line 547 — 刪除 `<td class="mono">{{ item.safeStock }}</td>`
  > line 544 — 移除 `item.stock <= item.safeStock` 的橘色警示判斷
  > `manager-dashboard.component.ts` line 66 — `interface` 的 `safeStock` 欄位可保留（不影響）
  > lines 163-167 — mock data 的 `safeStock` 數值可留著（已不顯示）

---

## P1 — 評審提問環節會追問的功能（Day 3-5，前+後端）

- [ ] **#08** 活動與公告區分（`type` 欄位）
  > **後端**：`promotions` 表新增 `type ENUM('promotion','announcement')`（見 DB Migration）
  > **後端**：`PromotionDetailVo` DTO 加 `type` 欄位
  > `manager-dashboard.component.ts` — `Promotion` interface 加 `type` 欄位
  > `manager-dashboard.component.html` — 活動清單加分頁 tab 或 badge 標籤區分

- [ ] **#09** 活動可上傳圖片、設左側標記色
  > **後端**：`promotions` 表新增 `image VARCHAR(500)`、`badge_color VARCHAR(20)`
  > `manager-dashboard.component.ts` line 153+ — mock Promotion 物件加 `image`、`badgeColor`
  > `manager-dashboard.component.html` — 活動卡片左側色條 `[style.background]="p.badgeColor"`
  > 圖片上傳：加 `<input type="file">` + `FileReader` 預覽（Demo 用 base64 即可）

- [ ] **#10** 活動日期選擇邏輯：選完開始日期才開放結束日期
  > `manager-dashboard.component.html` — 結束日期 input 加 `[disabled]="!form.startDate"`
  > 結束日期 `[min]` 綁定到開始日期值：`[min]="form.startDate"`
  > 純前端 Angular reactive form 驗證，不需後端

- [ ] **#11** 活動詳情頁：全部活動列表 + 單一活動詳情
  > 新增路由或 Dialog 元件：`/promotions` 列表 → 點入 `/promotions/:id` 詳情
  > 或用 Manager Dashboard 內的 slide-in panel（不新增路由，維持 SPA 結構）
  > `manager-dashboard.component.html` — 活動卡片加 `(click)="openPromotionDetail(p)"` 

- [ ] **#12** 滿額活動門檻金額設定
  > **後端**：`promotions` 表新增 `min_amount DECIMAL(10,2)`
  > `manager-dashboard.component.html` — 新增活動 form 加「門檻金額」input 欄位
  > 後端 API：`POST /promotions` 接收並儲存 `minAmount`

- [ ] **#13** DB Migration（#08、#09、#12 的前置）
  > **執行前備份**：`mysqldump global_meals promotions > promotions_backup.sql`
  ```sql
  ALTER TABLE `promotions`
    ADD COLUMN `type`        ENUM('promotion', 'announcement') NOT NULL DEFAULT 'promotion',
    ADD COLUMN `description` TEXT          DEFAULT NULL,
    ADD COLUMN `image`       VARCHAR(500)  DEFAULT NULL,
    ADD COLUMN `badge_color` VARCHAR(20)   DEFAULT NULL,
    ADD COLUMN `min_amount`  DECIMAL(10,2) DEFAULT NULL;
  ```
  > ⚠️ `products.version` 欄位**保留**，後端樂觀鎖繼續使用。
  > 截圖那份 `DROP COLUMN version` 的 SQL **暫不執行**。

---

## P2 — Demo 亮點功能（Day 5-7，加分）

- [ ] **#14** 桌邊 QR Code 生成
  > 套件已裝：`angularx-qrcode`（commit b6d33b3）
  > `manager-dashboard.component.ts` — `branches` tab 內每間分店加「產生 QR Code」按鈕
  > QR Code 內容：`https://<ngrok域名>/order?table=<tableId>`
  > 可直接用 `<qrcode [qrdata]="tableUrl" [width]="200"></qrcode>` 渲染

- [ ] **#15** 折扣券規則設定：9折、最多折200元、低消固定500元
  > **後端**：折扣規則目前是否 hardcode？確認後加到 coupon/promotions 設定欄位
  > `pos-terminal.component.html` line 525 — `.omp-coupon-status` 區塊加規則說明文字
  > 前端驗證：使用折扣券時檢查 `totalAmount >= 500`，否則 disable 按鈕

- [ ] **#16** 折扣券計次 bug 修復：確認付款後才 +1
  > **後端**：找到目前 coupon 使用次數 +1 的觸發點（懷疑在加入購物車或建立訂單時）
  > 應改為：付款成功 callback（ECPay / LinePay 回調）時才執行 +1
  > `EcpayService.java` / `LinePayService.java` — 在付款確認回調方法內加計次邏輯

- [ ] **#17** 折扣券進度達10次歸零（需家齊現場 demo）
  > **後端**：重置操作需原子交易（`UPDATE ... WHERE count >= 10`，單一 SQL）
  > 避免競態：不要用「查詢 count → 判斷 → 更新」三步驟
  > **前端**：進度條顯示達 10/10 後加「已達標」badge，歸零後恢復 0/10

- [ ] **#18** 新增分店：國家 / 城市改為下拉選單
  > `manager-dashboard.component.html` — 新增分店 form 的「國家」欄位改 `<select>`
  > 國家選完後城市 `<select>` 才 enable（同日期邏輯）
  > 資料來源：`GlobalAreaVO`（已有 `GlobalAreaController.java`）

- [ ] **#19** 分店長快速切換多間店（Header 下拉）
  > **前置確認**：後端是否有 API 可回傳該帳號管轄的所有分店？
  > 若無：後端需新增 `GET /staff/branches`（回傳該 staff 帳號的所有 `global_area`）
  > `pos-terminal.component.html` — Header 右上角加分店切換下拉選單
  > 切換後更新 `currentBranchId` Signal，重新 fetch 對應分店資料

---

## 暫緩清單（後續版本 / 未來展望）

| 需求 | 原因 | Demo 說法 |
|------|------|-----------|
| 代理人機制（副店長） | 需 DB 大改 + 授權邏輯 | 「這是我們下一版要實作的功能」 |
| 新增稅率時顯示國旗 | 視覺細節 | Demo 後補 |
| 帳號 / 電話鎖定機制 | 功能定義未完整 | — |
| 員工代點完成後 dialog | 低優先 | — |
| 活動文案 AI 生成 | 架構複雜 | 放未來展望 Slide |
| 同一用戶多筆訂單同時顯示 | 前後端工時高 | — |
| 訂單追蹤自訂欄位 | 架構改動大 | — |
| 財報 + AI 分析 | 假數據規劃中，暫不顯示 | 放未來展望 Slide |
| 分店長新增分店 | 等後端 API | — |

---

## 待確認問題（唯一剩餘）

1. **#19 多店切換** — 後端是否已有 API 可回傳該帳號管轄的所有分店？

---

## Demo 應答話術（直接複製給團隊）

> 「針對第一次 Demo 的回饋，我們這次主要做了五件事：
> 一、登入角色區分，進去就知道你是哪個身分；
> 二、活動可以上傳圖片、有單獨詳情頁；
> 三、折扣券規則可設定、計次時機也修正了；
> 四、桌邊可以掃 QR Code 直接點餐；
> 五、訂單看板用顏色區分製作狀態。」

---

*設計文件全文：`~/.gstack/projects/Toung0507-global_meals/Atayal-dev-Ataya-design-20260416-161916.md`*

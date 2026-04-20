# 客戶端 i18n 翻譯待完成清單

> 更新日期：2026-04-20｜分支：dev-Ataya  
> 本文件記錄 `customer-home.component.html` 及其他客戶端頁面中，  
> 尚未套用 `lang.*` 語言綁定的中文硬字串，依頁籤分類列出。

---

## ✅ 已完成

| 區域 | 說明 |
|------|------|
| `訪客登入`                               |
| `客戶端loading動畫`                      |
| `所有商品卡片名稱、描述`                 |
| `所有贈品描述`                           |
| 底部導覽標籤 | `navTabs` 改為 `computed`，讀取 `lang.navHome/navMenu/navCart/navTracker/navOrders/navPromos` |
| 搜尋欄 placeholder | 首頁 + 菜單頁兩處改為 `[placeholder]="lang.searchPlaceholder"` |
| 分類按鈕 | 首頁 + 菜單頁兩組改用 `lang.catAll/catRice/catNoodles/catSnacks/catLight/catDrinks` |
| 購物車浮動列 | "查看購物車" → `lang.navCart`；幣別 → `branchService.config.currency` |
| 結帳空購物車 | `lang.cartEmpty` + `lang.navMenu` |
| 結帳小計 / 總計 | `lang.subtotal` / `lang.total`；幣別動態切換 |
| 付款方式標籤 | `lang.creditCard` / `lang.mobilePay` / `lang.cash` |
| 結帳按鈕 | `lang.checkout`；幣別動態切換 |
| 訂單追蹤步驟 | `lang.waiting` / `lang.cooking` / `lang.ready` |
| 追蹤合計 + 繼續按鈕 | `lang.total`；`lang.navMenu`；幣別動態切換 |
| 付款頁合計列 | `lang.total`；幣別動態切換 |
| 客戶登入頁 | 全頁 `lang.*` 綁定 + QR Code 區塊 |
| 客戶註冊頁 | 全頁 `lang.*` 綁定（名稱/電話/密碼/確認密碼） |

---

## ❌ 未完成區塊

### 1. 側邊欄（Sidebar）
**檔案：** `customer-home.component.html` L15–L462

| 硬字串 | 建議 lang key |
|--------|--------------|
| `個人資料`（section title） | `profileTitle` |
| `會員名稱`（label） | `nameLbl`（已在 register 定義，可共用） |
| `手機號碼`（label） | `phoneLbl`（可共用） |
| `電子郵件` | `emailLbl` |
| `密碼` | `passwordLbl`（可共用） |
| `確認新密碼` | `confirmPasswordLbl`（可共用） |
| `輸入Email`（placeholder） | `emailPlaceholder` |
| `輸入新密碼`（placeholder） | `newPwdPlaceholder` |
| `再次輸入新密碼`（placeholder） | `confirmNewPwdPlaceholder` |
| `兌換券紀錄` | `couponTitle` |
| `可使用` / `累積中` | `couponReady` / `couponAccum` |
| `已點餐 X 次，您獲得了折扣兌換券 !!` | `couponEarnedMsg` |
| `已點餐 X 次，差 X 次即可獲得折扣兌換券` | `couponProgressMsg` |
| `儲存資料` / `修改資料` | `saveProfile` / `editProfile` |
| `導覽功能`（divider label） | `navDivider` |
| `✦ 懶懶吃，飽飽樂 ✦`（footer tagline） | 固定 TW 品牌口號，可保留原文或新增 `footerTagline` |
| `使用會員登入點餐` | `loginAsMember` |
| `登出帳號` | `logout` |

---

### 2. 首頁輪播卡片（Home Carousel）
**檔案：** `customer-home.component.html` L492–L558

| 硬字串 | 建議處理方式 |
|--------|------------|
| `懶懶吃，飽飽樂 — 探索各地絕妙風味` | 新增 `heroSlide1Desc` |
| `立即點餐 →` | 新增 `orderNow` |
| `🎁 期間限定` | 新增 `limitedOffer` |
| `滿額送好禮` | 新增 `heroSlide2Title` |
| `消費滿 NT$300 贈招牌滷蛋 × 2` | 幣別動態替換；描述可保留 TW 促銷文案 |
| `前往點餐` | 共用 `orderNow` 或 `navMenu` |
| `今日精選`（tag）/ `本週主廚推薦` | `todayPick` / `chefRec` |
| `日式烤雞串 只要 NT$ 145` | 固定示範文案，幣別改用 `branchService.config.currency` |
| `查看菜單` | 共用 `navMenu` |

---

### 3. 首頁推薦 / 今日優惠區
**檔案：** `customer-home.component.html` L660–L906

| 硬字串 | 建議處理方式 |
|--------|------------|
| `今日精選`（section tag） | `todayPick` |
| `主廚推薦`（section title） | `chefRec` |
| `限時特惠`（section tag） | `limitedOffer` |
| `今日優惠`（section title） | `todayDeals` |
| 所有 `NT$` 幣別（featured-price / deal-price） | 替換為 `{{ branchService.config.currency }}` |
| 料理名稱（招牌滷肉飯等） | Demo 固定 TW 資料，待後端真實 API 串接時以 `nameEn` 欄位支援多語 |

---

### 4. 結帳頁面（Checkout Tab）
**檔案：** `customer-home.component.html` L1160–L1436

| 硬字串 | 建議 lang key |
|--------|--------------|
| `確認訂單`（page heading） | `checkoutTitle` |
| `訂單明細`（col label） | `orderDetail` |
| `X 件`（item count suffix） | `itemCount`（含數字）|
| `免費`（gift item） | `free` |
| `進行中活動`（promo drawer title） | `promoInProgress` |
| `已達成 X / X 個活動` | `promoAchieved` |
| `共 X 個活動，展開查看進度` | `promoExpand` |
| `達成！點此選贈品` | `promoDone` |
| `差 NT$X` | `promoRemain` + 幣別 |
| `可至結帳頁選取贈品` | `promoCanSelectGift` |
| `按此選擇免費餐點` / `請先於下方選擇活動` | `selectFreeItem` / `selectPromoFirst` |
| `折扣兌換券`（coupon block title） | `couponTitle` |
| `本次享 8 折優惠` / `您有 1 張折扣券` | `couponActive` / `couponAvailable` |
| `取消使用` / `使用折扣券` | `couponCancel` / `couponUse` |
| `清空購物車` | `clearCart` |

---

### 5. 訂單預覽 Modal
**檔案：** `customer-home.component.html` L1438–L1490

| 硬字串 | 建議 lang key |
|--------|--------------|
| `確認訂單預覽` | `previewTitle` |
| `請確認品項是否正確...` | `previewHint` |
| `← 上一步` | `goBack` |
| `確認建立訂單` | `confirmOrder` |
| `折扣券折扣（8折）` | `couponDiscount` |

---

### 6. 付款頁面（Payment Tab）
**檔案：** `customer-home.component.html` L1495–L1813

| 硬字串 | 建議 lang key |
|--------|--------------|
| `取消本次訂單，返回首頁` | `cancelOrder`（`lang.cancelOrder` 已定義）|
| `付款頁面`（heading） | `paymentTitle` |
| `付款方式`（section label） | `paymentMethod` |
| `聯絡電話` | `contactPhone` |
| `必填`（required mark） | `required` |
| `請輸入電話號碼（訪客必填）` | `guestPhonePlaceholder` |
| `確認聯絡電話` | `memberPhonePlaceholder` |
| `請填入電話號碼後才能送出訂單` | `phoneRequired` |
| `卡號` | `cardNumber` |
| `有效期限` | `cardExpiry` |
| `安全碼 CVV` | `cardCvv` |
| `持卡人姓名（英文大寫）` | `cardHolder` |
| `請確認卡片資料均填寫完整` | `cardIncomplete` |
| `請使用手機掃描以下 QR Code 完成付款` | `mobilePayDesc` |
| `此 QR Code 可用手機掃描 · 請在 5 分鐘內掃碼` | `qrExpiry` |
| `模擬手機掃碼（Demo）` | Demo 用，可保留中文 |
| `請掃描上方 QR Code，在手機上完成付款` | `mobilePayHint` |
| `處理中...` | `processing` |
| `折扣券折扣（8折）`（多處） | `couponDiscount` |

---

### 7. 訂單追蹤（Tracker Tab）
**檔案：** `customer-home.component.html` L1818–L1950

| 硬字串 | 建議 lang key |
|--------|--------------|
| `您的取餐號碼` | `pickupNumber` |
| `預估等候 X 分鐘` | `estimatedWait` |
| `目前沒有進行中的訂單` | `noActiveOrder` |
| `前往點餐`（empty state） | 共用 `navMenu` |

---

### 8. 訂單紀錄（Orders Tab）
**檔案：** `customer-home.component.html` L1960–L2400+

| 硬字串 | 建議 lang key |
|--------|--------------|
| `訂單紀錄`（page title） | `orderHistoryTitle` |
| `共 X 筆歷史訂單` | `orderHistoryCount` |
| `已完成` / `已取消` / `已退款`（filter + badge） | `statusCompleted` / `statusCancelled` / `statusRefunded` |
| `目前沒有...的訂單` | `noOrdersForStatus` |
| `去點些美食吧！` | `goOrderSomething` |
| `合　計`（card footer） | `lang.total`（已定義）|
| `申請退款` | `requestRefund` |
| 退款申請 Modal（原因選項全文）| 暫保留中文，待 Demo 後國際化 |

---

### 9. 活動專區（Promotions Tab）
**檔案：** `customer-home.component.ts` → `PROMO_DISPLAY` / `PROMO_ACTIVITIES`

| 硬字串 | 建議處理方式 |
|--------|------------|
| 活動名稱（新會員首單禮等） | 以 `name_TW` / `name_JP` / `name_KR` 欄位或後端 API 多語欄位處理 |
| 活動描述、亮點 | 同上，Demo 後優先級低 |
| `新會員限定` / `期間限定` / `限時豪禮`（tag） | 新增 `promoTag_new` / `promoTag_promo` / `promoTag_premium` |

---

## 優先順序建議

| 優先 | 項目 | 原因 |
|------|------|------|
| 🔴 高 | Sidebar 個人資料 + 登出按鈕 | 每頁可見，切換語言後最明顯 |
| 🔴 高 | 付款頁面標題 + 表單標籤 | 結帳流程核心 UX |
| 🟡 中 | 首頁輪播文案 + 幣別 | 品牌視覺第一眼 |
| 🟡 中 | 結帳頁確認 Modal + 訂單紀錄狀態 | 流程完整性 |
| 🟢 低 | 活動專區多語系內容 | 資料驅動，待後端 API 支援 |
| 🟢 低 | 折扣兌換券文案 | Demo 功能，用戶少接觸 |

---

## 實作建議

新增 `lang key` 只需在 `src/app/shared/branch.service.ts` 的 `LangDict` 介面  
與三個翻譯物件（`TW` / `JP` / `KR`）中各加一筆，即可在 HTML 用 `{{ lang.xxx }}` 綁定。

```typescript
// 範例：在 LangDict 介面加入
couponTitle: string;
logout: string;
// …

// TW 物件
couponTitle: '兌換券紀錄',
logout: '登出帳號',
// …

// JP 物件
couponTitle: 'クーポン記録',
logout: 'ログアウト',
// …

// KR 物件
couponTitle: '쿠폰 기록',
logout: '로그아웃',
// …
```

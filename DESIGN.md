# Design System: Global Meals — 懶飽飽點餐平台

> 適用於 Google Stitch 畫面生成的完整設計語言指南。  
> 三套 UI 主題共享同一語義基礎，各自有明確的視覺情緒與用途。  
> 最後更新：2026-04-16（含 Demo 後整合需求 v1）

---

## 0. 系統架構概覽（Three-Theme System）

本應用包含三套獨立但同源的 UI 主題：

| 主題 | 場景 | 情緒 | 用戶 |
|------|------|------|------|
| **Customer（暖橘奶油）** | 手機點餐、查看菜單、結帳 | 溫暖、食慾感、書卷氣 | 到店顧客 |
| **POS Terminal（深金觸控）** | 門市收銀、出餐管理 | 沉穩、高效、深夜指揮室 | 員工、分店長 |
| **Manager Dashboard（海軍藍行政）** | 後台管理、數據分析 | 嚴謹、專業、清晰決策 | 老闆、管理者 |

---

## 1. Visual Theme & Atmosphere

### 1A. Customer — 暖橘奶油
一個輕盈的手機點餐介面，像一本精心排版的食譜書。背景是接近米白的奶油色（#fffaf3），
主色調是烤過的橘紅（#d95c1a），字體混用中文書法感字體（LXGW WenKai TC）與清爽內文字（Noto Sans TC）。
視覺密度中等偏低，強調呼吸感和食物的溫度感。

- **Density:** 5 / 10（舒展型）
- **Variance:** 6 / 10（偏不對稱，非制式排版）
- **Motion:** 5 / 10（輕盈 CSS 過場）

### 1B. POS Terminal — 深金觸控
一個全螢幕深色觸控介面，適合廚房或收銀台的長時間視覺使用。
背景是接近海洋深處的深藍黑（#0d1117），搭配古銅金色（#c49756）的主動態元素。
介面密度高，資訊緊湊但清晰。無裝飾性元素，只有功能性的視覺語言。

- **Density:** 8 / 10（指揮台密集型）
- **Variance:** 3 / 10（結構對稱，可預測）
- **Motion:** 3 / 10（最小動效，不分散注意力）

### 1C. Manager Dashboard — 海軍藍行政
一個淺色背景的後台管理介面，側邊欄保持深色（#111927），主內容區域使用冷調淺灰白（#F4F6FA）。
深海軍藍（#1E3A5F）主導視覺層級，金黃點綴用於重要操作按鈕。
清晰、數據導向、機構感強但不冰冷。

- **Density:** 7 / 10（資料密集但有組織）
- **Variance:** 4 / 10（標準左側邊欄佈局）
- **Motion:** 2 / 10（幾乎靜態，動效為輔助）

---

## 2. Color Palette & Roles

### 2A. Customer 主題色
- **Cream Canvas** (#FFFAF3) — 主要頁面背景，帶奶油溫度的米白
- **Card White** (#FFFFFF) — 卡片、面板填充色
- **Burnt Orange** (#D95C1A) — 主要 CTA 按鈕、選中狀態、強調邊框
- **Deep Ember** (#A84210) — Hover 狀態、按鈕按壓深色
- **Warm Copper Light** (#F47A3A) — 次強調、icon 活躍色
- **Harvest Gold** (#F0A500) — 評分、促銷標籤、徽章裝飾
- **Espresso Text** (#3D2010) — 主要文字，深棕而非純黑，帶食物溫度感
- **Chestnut Mid** (#6A4830) — 次要文字、描述文字
- **Ash Muted** (#A89080) — 輔助說明、placeholder
- **Cream Border** (#F0D8B8) — 卡片邊框、分隔線
- **Forest Green** (#2E7D32) — 成功狀態、訂單完成
- **Danger Red** (#E74C3C) — 錯誤、取消操作

### 2B. POS Terminal 主題色
- **Abyss Black** (#0D1117) — 主要深底色背景
- **Sidebar Dark** (#111927) — 頂欄、側欄、面板
- **Card Dark** (#1C2130) — 卡片、元件容器背景
- **Table Layer** (#161B22) — 表格底色、更深層次
- **Antique Gold** (#C49756) — 主要強調、選中狀態、按鈕
- **Gold Shimmer** (#F0C68C) — 數字顯示、文字高光、金額
- **Ghost White** (#E2E8F8) — 主要文字，確保深色背景高對比
- **Bright White** (#F1F5F9) — 最亮標題文字
- **Silver Gray** (#A0AEC0) — 次要文字
- **Dim Mist** (#718096) — 輔助文字、placeholder
- **Staff Blue** (#4F8EF7) — 員工角色標識
- **Manager Indigo** (#818CF8) — 分店長角色標識
- **Emerald OK** (#27AE60) — 完成、成功狀態
- **Amber Warning** (#F39C12) — 備餐中、待處理

### 2C. Manager Dashboard 主題色
- **Admin Canvas** (#F4F6FA) — 主內容背景淺冷灰白
- **Card Surface** (#FFFFFF) — 白色卡片
- **Sidebar Void** (#111927) — 左側欄深色
- **Border Line** (#D4DCE8) — 卡片邊框、表格分隔
- **Navy Ink** (#1A2840) — 主要文字，深海軍
- **Steel Mid** (#4A5A70) — 次要文字
- **Ocean Deep** (#1E3A5F) — 標題、重要數字、大字
- **Gold Action** (#C49756) — 主要 CTA 按鈕、強調
- **Gold Pale** (#F0C68C) — 次要強調、圖示暖色
- **Iris Accent** (#C084FC) — 側欄輔助標題，少量使用

---

## 3. Typography Rules

### 字體組合
- **中文品牌字（Customer）:** LXGW WenKai TC — 書法感毛筆風格，用於品牌名稱、歡迎詞、菜單標題
- **主要中文內文:** Noto Sans TC (300/400/500/600/700) — 跨三套主題的基礎內文字體
- **英文裝飾字（Customer）:** Fraunces (ital, wght 300/600) — 英文菜名、食物標語、斜體引言
- **數字/代碼/金額:** DM Mono / Geist Mono — 金額顯示、訂單編號、時間戳
- **禁用字體:** Inter（在任何主題中均禁止）、Times New Roman、Georgia、Garamond
- **儀表板規則:** POS 和 Manager Dashboard 必須使用 Sans-Serif（Noto Sans TC + DM Mono）

### 字型大小比例尺
- **xs:** 12px — 標籤、角標說明
- **sm:** 14px — 表格內容、次要文字
- **base:** 16px — 標準內文（minimum）
- **md:** 18px — 小標題
- **lg:** 24px — 頁面主標題
- **xl:** 32px — 金額顯示、重要數字
- **所有數字在 POS（density > 7）必須使用 DM Mono 等寬字體**

### 行高
- **tight:** 1.3 — 標題層
- **base:** 1.6 — 主要內文
- **loose:** 1.8 — 說明性文字、長段落
- **中文內文最大行寬:** 30em（防止閱讀疲勞）

---

## 4. Component Stylings

### 按鈕 Buttons
- **Customer 主要按鈕:** 實心橘紅填充 (#D95C1A)，圓角 4px，文字白色，按壓 -1px translate 觸覺回饋
- **Customer 次要按鈕:** 橘紅 1px 邊框，透明填充，文字橘紅色
- **POS 按鈕:** 金色填充 (#C49756)，深底色文字，圓角 8px，嚴禁外發光效果
- **Manager 按鈕:** 金黃填充 (#C49756) 或深海軍藍填充 (#1E3A5F)
- **全域禁止:** 霓虹外發光陰影、自訂滑鼠游標

### 卡片 Cards
- **Customer 卡片:** 白色背景，4px 圓角，`0 2px 8px rgba(61,32,16,0.06)` 暖色陰影，奶油邊框
- **POS 卡片:** 深色 #1C2130，8px 圓角，`0 4px 12px rgba(0,0,0,0.3)` 深色陰影
- **Manager 卡片:** 純白 #FFFFFF，8px 圓角，`0 1px 3px rgba(0,0,0,0.08)`，#D4DCE8 邊框
- **卡片使用原則:** 只有當 elevation 需要傳達層級時才使用卡片，密度高時改用 border-top 分隔線

### 輸入框 Inputs
- **標籤:** label 永遠在 input 上方（禁止 floating label）
- **錯誤訊息:** 在 input 下方顯示，紅色字體，icon 輔助
- **Focus 環:** 使用各主題的主色調（Customer: #D95C1A, POS: #C49756, Manager: #1E3A5F）
- **Placeholder:** 使用各主題的 muted 文字色

### 載入狀態 Loading
- **Skeleton Loader:** 尺寸與目標元素完全相符的骨架預覽，帶 shimmer 動畫
- **禁止:** 通用圓形 spinner（loading circle）
- **Customer 載入色:** 奶油基底 shimmer (#F0D8B8 → #FFFAF3)
- **POS 載入色:** 深色基底 shimmer (#1C2130 → #161B22)

### 空狀態 Empty States
- **Customer:** 附插圖的空白構圖，說明如何開始點餐，語氣友善
- **POS/Manager:** 功能性圖示 + 簡短說明文字，不使用純文字「暫無資料」

### 錯誤狀態 Error States
- 行內顯示，附近 icon（❌ / ⚠️ 概念但以設計元件呈現，禁用 emoji）
- 錯誤文字緊接在問題元件下方，不使用 toast 作為主要錯誤呈現方式

---

## 5. Layout Principles

### Customer（手機點餐）
- 行動優先設計，主要目標螢幕寬度 375px–430px
- 底部固定導覽列 (68px)，頂部固定工具列 (48px)
- 菜單卡片使用 2 欄格局（小螢幕 1 欄）
- 購物車使用側拉抽屜或底部彈出 sheet
- 嚴禁水平滾動（任何元件不可超出視窗寬度）

### POS Terminal（全螢幕觸控）
- 固定 100dvh，禁止頁面捲動
- 左右分欄：菜單區（左寬）+ 點單區（右窄），比例約 60:40
- 頂部狀態欄 54px
- 所有觸控目標最小 44px × 44px
- 禁止多欄等寬卡片格局，使用列表式或非對稱佈局

### Manager Dashboard（後台管理）
- 固定左側欄 240px + 主內容區彈性寬度
- 主內容最大寬度 1400px，置中容器
- CSS Grid 為主，禁止 calc() 百分比 hack
- 響應式：< 1024px 側邊欄收起為漢堡選單
- < 768px 所有多欄佈局退化為單欄

### 全局響應式規則
- 全高度區塊使用 `min-h-[100dvh]`，**嚴禁** `h-screen`（iOS Safari 跳動問題）
- 標題字體使用 `clamp()` 縮放，內文最小 1rem/16px
- 圖片使用 `object-fit: cover`，有明確尺寸容器

---

## 6. Motion & Interaction

### CSS 動效時序參考值（全主題共用 CSS Custom Properties）

```css
--dur-instant:   80ms;   /* 微回饋（按鍵按下）*/
--dur-fast:     150ms;   /* 狀態切換、badge 變色 */
--dur-base:     250ms;   /* 頁面轉場、面板展開 */
--dur-slow:     400ms;   /* 抽屜滑入、大型模態 */
--ease-out:     cubic-bezier(0.22, 1, 0.36, 1);   /* 滑入結束感 */
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);     /* 狀態過渡 */
--spring:       cubic-bezier(0.34, 1.56, 0.64, 1); /* 彈入（Customer 限定）*/
```

### Customer 動效（Density 5，彈性優先）
- **頁面轉場：** `opacity 0→1` + `translateY(12px→0)`，250ms `--ease-out`
- **按鈕主要回饋：** 按下 `scale(0.97)` + `translateY(-1px)`，150ms；放開 `--spring` 回彈
- **卡片懸停：** `box-shadow` 加深 + `translateY(-2px)`，200ms `--ease-in-out`
- **購物車抽屜：** `translateX(100%→0)`，400ms `--ease-out`
- **數量 +/- 按鈕：** `scale(1.15)` 短暫彈跳，80ms `--spring`
- **Perpetual 常駐動效：**
  - Skeleton loader：`opacity 0.4→1→0.4`，1.4s linear infinite（shimmer）
  - 購物車 badge 有新品時：`scale(1→1.2→1)` pulse，400ms，執行 2 次後停止

### POS Terminal 動效（Density 8，效率優先，零裝飾）
- **訂單卡片進場：** `translateY(8px→0)` + `opacity 0→1`，280ms `--ease-out`
- **狀態色條切換：** `background-color` + `border-color`，150ms linear（**僅這兩個屬性**）
- **新訂單提示閃爍：** Antique Gold (#C49756) `opacity 1→0.3→1`，600ms，執行 **2 次後停止**
- **按鈕按下：** `scale(0.98)` + `opacity 0.85`，80ms
- **禁止：** 所有 `--spring` 彈跳、3D 旋轉、任何 `animation-iteration-count: infinite`

### Manager Dashboard 動效（Density 7，近靜態）
- **側欄 hover：** 背景 `opacity 0→0.08`，150ms — 極輕微，不搶注意力
- **圖表初次載入：** Bar chart 從 `height 0` 向上填充，500ms `--ease-out`（**僅初次，不重播**）
- **Slide-in 面板：** `translateX(100%→0)`，250ms `--ease-out`；關閉反向
- **Table row hover：** `background-color` 淡入，100ms
- **禁止：** 任何 keyframe loop、floating 動畫

### 全局動效規則
- **Spring Physics:** `stiffness: 100, damping: 20`（Customer 彈入感限定，其他主題禁用）
- **只動畫 `transform` 和 `opacity`**，嚴禁動畫 `top`、`left`、`width`、`height`
- **Staggered 瀑布規則：** 清單最多前 6 項做 stagger（每項 40ms 差），第 7 項起全部同時出現
- **硬體加速：** `will-change: transform` 僅加在觸發頻率 > 1次/秒的元件
- **Perpetual loop 嚴格限制：** 僅 skeleton shimmer 允許 `infinite`；通知 pulse 最多執行 3 次後停止

---

## 7. Anti-Patterns — 明確禁止清單

### 字體禁止
- **禁止任何主題使用 Inter 字體**（過度泛用，喪失品牌個性）
- 禁止通用系統 Serif：`Times New Roman`、`Georgia`、`Garamond`、`Palatino`
- 禁止在 POS / Manager Dashboard 使用任何 Serif 字體（儀表板永遠只用 Sans-Serif）
- 如需 Serif（限 Customer 品牌標語），只允許：`Fraunces`、`Instrument Serif`
- 禁止超過 3 種字體同時出現在同一個頁面

### 設計禁止
- 禁止 pure black (#000000) — 使用 #0D1117、#1A2840 或 #3D2010（依主題）
- 禁止霓虹外發光效果（`box-shadow` 帶鮮豔顏色）
- 禁止紫藍色漸層背景（AI Purple aesthetic）— 僅 Manager 側欄輔助標題允許少量 #C084FC
- 禁止超飽和強調色（accent saturation > 80%）
- 禁止大標題漸層文字（`background-clip: text` 在 headline 上）
- 禁止三欄等寬卡片格局 — 使用 2 欄 zig-zag、不對稱格局或水平捲動
- Customer Hero 禁止置中對稱版型
- 禁止「Scroll to explore」/「向下滑動」/ 跳動箭頭等 filler UI
- 禁止自訂滑鼠游標
- **禁止元素重疊：** 任何文字/卡片/圖片不得覆蓋其他內容，每個元件佔有獨立空間
- 禁止 `backdrop-filter: blur()` 在深色主題（POS / Manager）的常態 UI — 允許一次性 Modal overlay

### 內容禁止
- 禁止 emoji 出現在任何 UI 文字中（按鈕、標籤、標題均禁）
- 禁止 AI 套話文案：「無縫」、「賦能」、「下一代」、「重新定義」、「革命性」、「生態系」
- 禁止假數據：「99.98% 可用性」、「18,500 次部署」等系統性能假指標
- 禁止假統計區塊：任何「BY THE NUMBERS」/「系統效能」卡填入虛構數字
- 禁止 `LABEL // YEAR` 格式標題（AI 懶人排版慣例：「SYSTEM // 2025」）
- 禁止通用佔位符名稱：「John Doe」、「王大明」、「範例餐廳」、「Acme Corp」
- 禁止圓整假數字：「50%」「99.99%」「100 筆訂單」
- 禁止損壞的外部圖片 URL — 使用 `picsum.photos/{id}/{w}/{h}` 或 SVG placeholder

### 技術禁止
- 禁止 `h-screen`（iOS Safari viewport 跳動）— 使用 `min-h-[100dvh]`
- 禁止 `calc()` flexbox 百分比 hack — 使用 CSS Grid
- 禁止動畫 `top`/`left`/`width`/`height` — 只動畫 `transform`/`opacity`
- 禁止通用圓形 loading spinner（`border-radius: 50%` 旋轉）— 使用 Skeleton Loader
- 禁止 floating label（標籤永遠在 input 上方）
- POS 主題禁止任何 `animation-iteration-count: infinite` 的裝飾動畫
- 禁止 `position: absolute` 元素堆疊（`z-index` 戰爭的根源）
- 禁止 CSS `filter: blur()` 作為常態背景效果（會在 GPU 上持續消耗效能）
- 禁止使用 `!important` 超過 3 個（代表結構設計問題，應修改 specificity）

---

## 8. Screen-Specific Prompting Notes（Stitch 提示補充）

當使用 Stitch 生成特定畫面時，參考以下補充說明：

### 客戶端首頁（Customer Home）
提示 Stitch：暖橘奶油風格，行動版，頂部固定工具列顯示桌號與購物車，
下方分類 tab（水平捲動），主體為食物卡片格（2欄），底部固定導覽列。
使用 LXGW WenKai TC 作為品牌字體展示，食物名稱用 Noto Sans TC。

### POS 終端機
提示 Stitch：全螢幕深色觸控介面，左右分欄（菜單/點單），頂部狀態欄，
金色金額顯示，員工藍色 / 分店長靛藍角色區分，無任何裝飾性動畫，
所有按鈕最小 44px 觸控目標。

### 後台管理儀表板
提示 Stitch：左側深色固定側欄 (240px)，主內容淺灰白背景，
頂部頁面標題使用深海軍藍大字，資料卡片白色背景，
KPI 數字使用 DM Mono 等寬字體，金黃按鈕作為主要 CTA。

---

### 員工登入畫面（Staff Login — Demo v2）
**主題：** POS Terminal 深金觸控
```
員工後台登入頁面，左右分欄佈局（40/60），深色品牌欄 + 表單欄。
左欄：Sidebar Dark (#111927) 背景，Logo 置頂，三種角色 badge 垂直排列。
  - 經理 badge：Manager Indigo (#818CF8) 邊框，文字「👑 經理 / Boss」+ 說明「管理後台系統」
  - 分店長 badge：Manager Indigo (#818CF8) 淡版，文字「🏪 分店長 / Branch Manager」
  - 收銀員 badge：Staff Blue (#4F8EF7) 邊框，文字「👤 收銀員 / Staff」
右欄：Card Dark (#1C2130) 背景，帳號 input（DM Mono 字體），
  密碼 input（固定 type=password，無 eye icon），
  全寬 Antique Gold (#C49756) 登入按鈕。
副標題：「系統自動識別角色，無需手動選擇。」Silver Gray 小字。
禁止顯示員工姓名。禁止任何密碼顯示切換功能。
```

### POS 訂單看板 — 狀態顏色卡片（Demo v2）
**主題：** POS Terminal 深金觸控
```
全螢幕訂單看板，卡片依狀態顯示左側 4px 色條 + 背景暖光：
  - 待製作：Steel Gray (#6B7280) 左邊條，Card Dark 底，無背景暖光
  - 製作中：Amber Warning (#F39C12) 左邊條，rgba(243,156,18,0.08) 背景暖光
  - 已完成：Emerald OK (#27AE60) 左邊條，rgba(39,174,96,0.06) 背景淡綠光
頂部 Header：時鐘 (DM Mono) + 分店名稱下拉選單（右側）
狀態篩選 Tab：「全部 / 待製作 / 製作中 / 已完成」各帶數量 badge
卡片網格：3-4 欄，間距 12px，每卡最小觸控目標 44px。
操作按鈕：「開始製作」→「完成出餐」依狀態切換，全寬，圓角 8px。
```

### 活動管理頁（Promotions — Demo v2）
**主題：** Manager Dashboard 海軍藍行政
```
左側欄已存在（不需重建）。主內容區 Admin Canvas (#F4F6FA)。
頁面標題列：「活動管理」Navy Ink 大字 + 右側「＋ 新增活動」Gold Action 按鈕。
類型篩選 Tab：「全部 / 活動 / 公告」帶數量 badge。
活動卡片（垂直列表）：
  - 左側 8px 色條：badge_color 欄位決定，預設 Ocean Deep (#1E3A5F)
  - 卡片頂部：16:9 封面圖（無圖時顯示 Border Line 填充佔位符）
  - 右上角類型 badge：活動 → Ocean Deep 深藍底，公告 → Iris Accent (#C084FC) 淡紫底
  - 活動標題（Navy Ink 18px）、描述（Steel Mid 14px，2行截斷）
  - 資訊列：開始～結束日期 | 滿額門檻（DM Mono）
  - 右側 toggle 開關（啟用/停用）
新增活動：右側 slide-in panel（寬 480px），不跳頁。
  面板欄位：類型 radio、名稱、描述 textarea、圖片上傳拖曳區、
  左側色條選色器（6色塊）、開始日期、結束日期（disabled 直到開始日期已選）、
  滿額門檻金額（NT$ 前綴 input）。
```

### 分店管理 — 桌邊 QR Code（Demo v2）
**主題：** Manager Dashboard 海軍藍行政
```
現有分店卡片下方新增「桌邊點餐」可折疊區塊。
區塊標題：「桌邊 QR Code」+ 展開箭頭（Border Line 分隔線上方）。
桌號管理列：單行 input「新增桌號」+ Gold Action 「新增」小按鈕。
桌號卡片水平捲動列（每張 200px 寬）：
  - 白色卡片，Border Line 邊框，12px 圓角
  - 桌號名稱（Navy Ink 14px Bold）
  - QR Code 圖片 180×180px（angularx-qrcode 渲染，白底黑碼）
  - QR Code 連結（DM Mono 10px，Steel Mid，超長截斷）
  - 操作列：「下載 PNG」Ghost 按鈕 + 「複製連結」Ghost 按鈕
QR Code 內容格式：https://[domain]/order?table=[tableId]
```

### 折扣券狀態面板（Coupon Panel — Demo v2）
**主題：** POS Terminal 深金觸控
```
嵌入 POS 終端的折扣券面板，Card Dark (#1C2130) 背景。
標題列：「折扣券使用紀錄」+ 目前進度數字「6 / 10」(DM Mono，Antique Gold)。
進度條：全寬圓角，Table Layer (#161B22) 底色，Antique Gold (#C49756) 填充。
  達 10/10 時：填充改 Emerald OK (#27AE60)，右側顯示「✓ 已達標」綠色 badge。
  動畫：CSS transition width 300ms ease，不使用其他動效。
規則說明卡（Sidebar Dark #111927 背景，12px 圓角）：
  - 折扣：消費金額 × 9折
  - 最高折抵：NT$ 200（Gold Shimmer #F0C68C 數字）
  - 最低消費：NT$ 500（未達門檻時折扣按鈕 disabled + tooltip）
最近使用紀錄：5 筆，每筆顯示日期、折抵金額(Gold Shimmer)、訂單號(DM Mono)。
歸零後：進度條回 0/10，上方小字「上次達標：YYYY-MM-DD 已重置」(Silver Gray)。
```

---

## 9. Product Requirements — Demo 後整合需求

> 此章節彙整所有回饋輪次的功能需求與修改點，  
> 供開發排期、UI 設計、Stitch 畫面生成時參考。  
> 標籤：🔴 高優先／🟡 中優先／🟢 低優先／🔵 未來展望

---

### 9A. 身份與權限系統

| 項目 | 說明 | 優先 |
|------|------|------|
| 登入頁角色區分 | 登入畫面應依身份（管理者／分店長／現場收銀員）顯示不同 logo 或標識，不顯示完整姓名 | 🔴 |
| 帳號／電話鎖定 | 後台會員欄位中，無法由使用者自行修改的欄位（帳號、電話等）應顯示鎖定 icon，禁止編輯 | 🔴 |
| 會員密碼顯示移除 | 後台會員清單不得顯示明文密碼欄位 | 🔴 |
| 分店長代理人（副店長） | 分店長可指定一位代理人（副店長），當分店長請假時代理人自動獲得等同分店長的操作權限 | 🔴 |
| 分店長多店切換 | 同一個分店長帳號可能管理多間分店，需在頂欄或側欄提供快速切換分店的 UI | 🔴 |

---

### 9B. 促銷活動與公告系統

| 項目 | 說明 | 優先 |
|------|------|------|
| 活動 vs 公告明確區分 | 「活動（Promotion）」與「公告（Announcement）」為兩個獨立功能模組，視覺標籤顏色不同 | 🔴 |
| 活動列表 + 單一活動詳情頁 | 活動頁面需有完整活動列表，點入後顯示單一活動詳情（圖片、文案、時間、規則） | 🔴 |
| 活動可上傳圖片 | 新增／編輯活動時可上傳封面圖片，promotions 表新增 `image` 欄位 | 🔴 |
| 活動描述欄位 | promotions 表新增 `description` 欄位，支援富文字或長文案 | 🔴 |
| 活動左側標記色 | 活動清單每筆記錄左側有彩色 tag（進行中、未開始、已結束），顏色系統：🟢 進行中、🟡 未開始、⬛ 已結束 | 🟡 |
| 活動日期邏輯 | 新增活動時，開始日期預設為今天，不可選過去日期；選完開始日期後才開放結束日期選擇，結束日期不可早於開始日期 | 🔴 |
| 滿額活動設定 | 活動類型新增「滿額折扣」，需設定滿額門檻金額，可搭配圖片 | 🔴 |
| 活動 AI 文案生成 | 後台新增活動時，可點擊「AI 生成文案」按鈕，自動產生活動標語或描述文字（文字版） | 🟡 |
| 活動 AI 效益分析 | 老闆後台可查看活動期間收益變化，對比無活動時期，AI 分析是否提升收益（此為未來展望） | 🔵 |

---

### 9C. 折價券系統

| 項目 | 說明 | 優先 |
|------|------|------|
| 折扣規則：9 折上限 200 元 | 折價券統一打 9 折，最多抵扣 200 元 | 🔴 |
| 使用折價券低消 500 元 | 使用折價券的訂單需最低消費 500 元，未達門檻不可使用 | 🔴 |
| 折扣上限金額設定 | 後台可設定折價券最高折扣金額（例如消費 1000 元以上同樣最多折 200 元） | 🔴 |
| 折價券計數邏輯 | 折價券次數應在 **確認付款後** 才 +1，不得在下單時計算 | 🔴 |
| 集點進度條顯示 | 顯示客戶集點進度（目標 10 次），達到 10 次後送出折價券，進度歸零重新累計 | 🔴 |
| 折價券使用限制 | 可設定折價券有效期限、每人使用上限次數、是否可與其他活動並用 | 🟡 |

---

### 9D. 訂單系統

| 項目 | 說明 | 優先 |
|------|------|------|
| 訂單看板顏色區分 | POS 訂單看板卡片顏色：🟡 待製作（#F39C12 黃色）、🔵 製作中（#4F8EF7 藍色）、🟢 已完成（#27AE60 綠色） | 🔴 |
| 「訂單管理」改名為「我的訂單」 | 客戶端訂單管理頁面重命名為「我的訂單」 | 🔴 |
| 員工點餐後顯示身份 Dialog | 員工協助客人點餐完成後，跳出 Dialog 確認：「此訂單是會員還是訪客？」 | 🔴 |
| 訂單追蹤可新增欄位 | 後台訂單追蹤頁面支援自定義顯示欄位（例如備註、優惠碼等） | 🟡 |
| 單一使用者多筆進行中訂單 | 同一用戶可能同時有多筆進行中訂單，訂單列表需全部顯示，不可只顯示最新一筆 | 🟡 |

---

### 9E. 分店管理

| 項目 | 說明 | 優先 |
|------|------|------|
| 新增分店：國家／城市下拉選單 | 新增分店時，「國家」與「城市」使用下拉選單而非自由輸入文字 | 🔴 |
| 稅率設定 + 國旗顯示 | 每間分店可設定當地稅率，旁邊顯示對應國旗 icon | 🟡 |
| 多幣別支援（海外店） | 未來支援日本、韓國等海外分店時，需支援幣別切換及對應稅費計算 | 🔵 |
| 桌邊 QR Code 生成 | 後台可對每張桌子產生專屬 QR Code，顧客掃碼後自動帶入桌號進入點餐頁面 | 🔴 |

---

### 9F. 庫存管理

| 項目 | 說明 | 優先 |
|------|------|------|
| 移除「安全庫存」提醒功能 | 庫存模組移除安全庫存警示，不顯示安全庫存相關欄位與提醒通知 | 🔴 |

---

### 9G. 財務報表系統

| 項目 | 說明 | 優先 |
|------|------|------|
| 財報資料表 | 新增 `financial` 資料表，欄位：分店、最終價格、換算台幣價格、當天匯率。資料來源為 orders 表 | 🟡 |
| 匯率排程更新 | 匯率每日 04:00 更新，系統於 03:00 排程抓取前一天訂單並使用「更新前匯率」換算 | 🟡 |
| 財報只顯示台幣換算後金額 | 財報頁面統一顯示換算後台幣金額，不顯示原始外幣 | 🟡 |
| 按月／年對比收益 | 財報支援月對月、年對年收益對比，評估促銷活動效果 | 🟡 |
| 財報 AI 分析 | AI 分析特定活動月份收益變化，自動生成評估報告 | 🔵 |

---

### 9H. UI 細節修正

| 項目 | 說明 | 優先 |
|------|------|------|
| 點餐購物車介面簡化 | 客戶端購物車介面需更簡潔，減少不必要的視覺元素 | 🟡 |
| 活動圖片欄位 UI | 新增活動時，圖片上傳區域需有清楚的 drop zone 或預覽縮圖 | 🟡 |

---

### 9I. 未來展望（不在目前開發範圍）

- 老闆後台活動 AI 效益分析（對比歷史收益）
- 多幣別切換及海外稅費計算（日韓等市場）
- 財報 AI 自動生成評估報告
- 分店長後台新增分店功能（目前只有老闆可新增分店）
- AI 生成活動圖片（目前只做文案生成）

---

### 9J. 後端資料表異動摘要（開發參考）

```
promotions 表 新增欄位：
  - description  TEXT          活動詳細描述
  - image        VARCHAR(500)  活動封面圖片 URL

coupons 規則更新：
  - discount_rate    DECIMAL  = 0.9（9 折）
  - max_discount     INT      = 200（最多折 200 元）
  - min_order_amount INT      = 500（使用折價券低消）
  - count_trigger    INT      = 10（集滿 10 次送出後歸零）
  - count_at         ENUM     = 'after_payment'（確認付款後才 +1）

branch_managers 表 新增欄位：
  - deputy_manager_id  INT FK  → users.id（代理人）

financial 表（新增）：
  - id, branch_id, order_date, original_amount,
    currency, exchange_rate, twd_amount, created_at
```

---

## 10. New Component Patterns — Demo v2

> 此章節記錄 Demo v2 新增的元件設計模式，供 Stitch 生成與前端實作參考。
> 每個模式標明所屬主題、視覺規格、互動行為。

---

### 10A. 角色識別 Badge（Role Identity Badge）
**所屬主題：** POS Terminal / Staff Login

三種角色各有對應的視覺識別，使用左側 3px 邊條 + 背景暈染區分：

| 角色 | 邊條色 | 背景 | 文字色 | 說明文字 |
|------|--------|------|--------|----------|
| 經理 (Boss) | Manager Indigo (#818CF8) | rgba(129,140,248,0.10) | Ghost White | 管理後台系統 |
| 分店長 (Branch Manager) | Manager Indigo (#818CF8) | rgba(129,140,248,0.06) | Silver Gray | POS 終端 + 後台 |
| 收銀員 (Staff) | Staff Blue (#4F8EF7) | rgba(79,142,247,0.08) | Silver Gray | POS 終端操作 |

- 圓角：6px
- 內邊距：10px 12px
- 角色中文名稱（16px，Ghost White）+ 英文名稱（12px，Silver Gray）並排
- 各 badge 之間垂直間距 8px

---

### 10B. 訂單狀態左邊條卡片（Status Left-Border Card）
**所屬主題：** POS Terminal

訂單卡片以左側 4px 色條 + 背景微暈傳達製作狀態，不使用大面積顏色覆蓋（避免閱讀疲勞）：

| 狀態 | 左邊條 | 背景暈染 | 狀態 Badge |
|------|--------|----------|------------|
| 待製作 (waiting) | Steel Gray (#6B7280) | 無 | 灰底白字 |
| 製作中 (cooking) | Amber Warning (#F39C12) | rgba(243,156,18,0.08) | 橘底深字 |
| 已完成 (done) | Emerald OK (#27AE60) | rgba(39,174,96,0.06) | 綠底白字 |

- 卡片整體：Card Dark (#1C2130)，8px 圓角
- 左邊條寬度：4px，與卡片等高，左側圓角吃掉
- 狀態 Badge：12px，圓角 4px，內邊距 2px 8px
- 狀態轉換動畫：`transition: background-color 150ms, border-color 150ms`（僅這兩個屬性）

---

### 10C. 右側滑入面板（Slide-in Detail Panel）
**所屬主題：** Manager Dashboard

新增/編輯操作使用右側滑入面板（不跳頁，維持 SPA 結構）：

- 面板寬度：480px（固定），右側邊緣貼齊視窗
- 背景：Card Surface (#FFFFFF)，左側 `box-shadow: -4px 0 24px rgba(0,0,0,0.12)`
- 頂部標題列：高 56px，Navy Ink 18px Bold 標題 + 右側 × 關閉按鈕
- 內容區：padding 24px，垂直捲動
- 底部操作列：固定於面板底部，高 64px，Border Line 上邊框
  - 右側：「儲存」Gold Action 按鈕 + 「取消」Ghost 按鈕
- 開啟動畫：`translateX(100%) → translateX(0)`，250ms ease-out
- 背景遮罩：`rgba(0,0,0,0.3)`，與面板同時淡入

---

### 10D. 活動封面圖片上傳區（Promotion Cover Upload）
**所屬主題：** Manager Dashboard

圖片上傳使用拖曳放置區（Drop Zone），有圖/無圖兩種狀態：

**無圖（初始）：**
- 容器：Border Line (#D4DCE8) 1px 虛線邊框，8px 圓角，16:9 比例
- 背景：Admin Canvas (#F4F6FA)
- 中央：上傳 icon（24px，Steel Mid）+ 「拖曳圖片或點擊上傳」（14px，Steel Mid）
- 副說明：「支援 JPG、PNG，建議 1200×675px」（12px，Ash Muted）

**有圖（預覽）：**
- 封面圖 `object-fit: cover` 填滿容器
- 右上角浮動「更換圖片」按鈕（白底，Navy Ink 文字，8px 圓角，hover 顯示）

---

### 10E. 集點進度條（Stamp Progress Bar）
**所屬主題：** POS Terminal

- 容器高度：12px，全寬，`border-radius: 6px`（膠囊形）
- 軌道底色：Table Layer (#161B22)
- 填充色：Antique Gold (#C49756)，`transition: width 300ms ease`
- 達標（10/10）時：填充改 Emerald OK (#27AE60)，右側顯示「✓ 已達標」badge
- 「已達標」badge：Emerald OK 文字，透明背景，12px，圓角 4px
- 進度數字：右對齊，DM Mono，Antique Gold，14px（達標後改 Emerald）
- 歸零後：寬度動畫回 0，出現「上次達標：[日期] 已重置」Silver Gray 小字（12px）

---

### 10F. QR Code 展示卡片（QR Code Display Card）
**所屬主題：** Manager Dashboard

- 卡片尺寸：200px 寬，固定比例
- 背景：Card Surface (#FFFFFF)，Border Line 邊框，12px 圓角
- 頂部：桌號名稱（Navy Ink，14px Bold）
- 中央：QR Code 圖片 180×180px（白底黑碼，padding 8px）
- 底部：QR Code 連結文字（DM Mono，10px，Steel Mid，超長省略號截斷）
- 操作列：「下載 PNG」+「複製連結」並排，Ghost 樣式按鈕，各 50% 寬
- 水平捲動時卡片間距 12px，`scroll-snap-type: x mandatory`

---

### 10G. 日期範圍選擇器邏輯（Date Range Picker UX）
**所屬主題：** Manager Dashboard（通用）

- 開始日期 input：預設今日，`min` 為今日（不可選過去）
- 結束日期 input：預設 `disabled`，開始日期有值後才 `enable`
- 結束日期 `min` 值動態等於開始日期選擇後的值
- Focus 狀態：Ocean Deep (#1E3A5F) 1px 邊框 + 輕微陰影
- Disabled 狀態：Admin Canvas (#F4F6FA) 背景 + Border Line 邊框 + Steel Mid 文字
- 日期格式顯示：YYYY-MM-DD（DM Mono 字體）

---

## 11. Stitch Prompt Architecture — 快速生成參考

> 使用 Stitch 生成新畫面時，從本節複製對應 Prompt Block，  
> 貼入 Stitch 提示框並補充頁面專屬內容。  
> **必須包含** Design Token Block，否則 Stitch 會使用預設樣式。

---

### 11A. Customer（暖橘奶油）— Prompt Block

```
THEME: Customer — Warm Amber Cream
DEVICE: Mobile (375–430px)
FONT: LXGW WenKai TC for brand/headlines, Noto Sans TC for body, DM Mono for prices/IDs

COLOR TOKENS:
- Background: #FFFAF3 (cream canvas)
- Card: #FFFFFF
- Primary CTA: #D95C1A (burnt orange), hover #A84210
- Text Primary: #3D2010 (espresso), Secondary: #6A4830 (chestnut)
- Border: #F0D8B8 (cream border)
- Success: #2E7D32 | Error: #E74C3C

RULES:
- Left-aligned layouts only (no centered hero)
- Bottom fixed nav 68px, top toolbar 48px
- 2-column food card grid (1-col on narrow)
- No h-screen — use min-h-[100dvh]
- No emoji in UI text
- No Inter font
- Card shadow: 0 2px 8px rgba(61,32,16,0.06)
```

---

### 11B. POS Terminal（深金觸控）— Prompt Block

```
THEME: POS Terminal — Deep Gold Touch
DEVICE: Desktop fullscreen (100dvh, no scroll)
FONT: Noto Sans TC for labels, DM Mono for all numbers/amounts/order IDs

COLOR TOKENS:
- Background: #0D1117 (abyss black)
- Sidebar/Header: #111927
- Card: #1C2130
- Accent Gold: #C49756 (antique gold), shimmer #F0C68C
- Text: #E2E8F8 (ghost white), Secondary: #A0AEC0 (silver gray)
- Role Boss/BM: #818CF8 | Role Staff: #4F8EF7
- Status Waiting: #9CA3AF | Cooking: #F59E0B | Done: #34D399

RULES:
- All touch targets minimum 44×44px
- Zero decorative animations (no infinite loops)
- Left 5px status border on order cards
- Status transition: background-color + border-color 150ms only
- No backdrop-filter blur
- No spring physics
```

---

### 11C. Manager Dashboard（海軍藍行政）— Prompt Block

```
THEME: Manager Dashboard — Navy Administrative
DEVICE: Desktop (left sidebar 240px fixed + fluid content)
FONT: Noto Sans TC for all text, DM Mono for all KPI numbers/amounts

COLOR TOKENS:
- Content BG: #F4F6FA (admin canvas)
- Card: #FFFFFF
- Sidebar: #111927
- Primary Text: #1A2840 (navy ink), Secondary: #4A5A70 (steel mid)
- Headline/Numbers: #1E3A5F (ocean deep)
- CTA Button: #C49756 (gold action)
- Border: #D4DCE8

RULES:
- White cards with border #D4DCE8, shadow 0 1px 3px rgba(0,0,0,0.08)
- Slide-in panels 480px wide, translateX animation 250ms
- End date input disabled until start date selected
- No circular spinners — skeleton loaders only
- Max content width 1400px centered
- Sidebar collapses to hamburger below 1024px
```

---

### 11D. 通用 Prompt 補充片段（任何主題可附加）

```
ANTI-PATTERNS (NEVER DO):
- No Inter font anywhere
- No pure black (#000000)
- No neon outer glow shadows
- No gradient text on headlines
- No 3-equal-column card grids
- No emoji in UI text
- No floating labels (label always above input)
- No h-screen (use min-h-[100dvh])
- No overlapping elements — each element in its own spatial zone
- No generic placeholder names (John Doe, Acme Corp)
- No fabricated statistics or metrics
- No circular loading spinners
```

# SCREENSHOT_PLAN.md — 簡報實機畫面截圖任務

> **目的**：替本次「懶飽飽智慧餐飲系統」成果發表簡報 **S13「從線框到實作」** 這一頁，產出三張各端實機畫面，上台時接在 PPT 之後展示／或直接嵌回簡報頁。
>
> **執行者**：Claude Code（在本地專案環境中啟動三端服務，以無頭瀏覽器或 Playwright 截圖後輸出到桌面）。
>
> **交付位置**：所有截圖輸出至作業系統 **桌面 `~/Desktop/懶飽飽_截圖/`** 資料夾（不存在請自動建立）。
> 檔名格式：`{編號}_{端別}_{畫面名}.png`，例如 `01_customer_menu.png`。

---

## 0. 事前準備

1. 啟動後端：`cd global_meals_gradle && ./gradlew bootRun`（http://localhost:8080）
2. 啟動前端：`cd global_meals && npm start`（http://localhost:4200）
3. 匯入 DB：若 `products`、`promotions`、`branch_inventory` 是空的，先跑 `Dump20260417(本).sql` 以確保頁面有資料。
4. 建議帳號（若已有 seed 資料請覆用）：
   - 客戶端：`member01 / 123456`
   - POS：`staff01 / 123456`
   - 後台：`admin / admin123`

---

## 1. 截圖清單（共 3 組 · 最少 7 張）

### 🟧 客戶端（Customer）· 路徑 prefix：`/customer`

| # | 檔名 | 路由 | 重點 |
|---|---|---|---|
| 01 | `01_customer_menu.png` | `/customer/menu` | 菜單首頁：分類 tab、商品卡片網格、右下角購物車浮標 |
| 02 | `02_customer_cart.png` | `/customer/cart` | 購物車抽屜展開：含商品列、小計、稅額、**滿額贈提示**（若有活動） |
| 03 | `03_customer_member.png` | `/customer/member` | 會員中心：點數、歷史訂單、個人資料 |

**截圖規格：** 手機視窗 `390 × 844`（iPhone 13 Pro 直向），`deviceScaleFactor=2`。

---

### ⬛ POS 終端機 · 路徑 prefix：`/pos`

| # | 檔名 | 路由 | 重點 |
|---|---|---|---|
| 04 | `04_pos_cockpit.png` | `/pos/cockpit` | 主畫面三欄：左分類 / 中商品網格 / 右結帳區（含當前訂單） |
| 05 | `05_pos_checkout.png` | `/pos/cockpit?order=demo` | 結帳瞬間：可顯示稅率拆解、付款方式切換 |

**截圖規格：** 桌面視窗 `1440 × 900`（標準 MacBook 13"），深色 UI 主題請保留。

---

### 🟦 管理後台（Manager）· 路徑 prefix：`/admin`

| # | 檔名 | 路由 | 重點 |
|---|---|---|---|
| 06 | `06_admin_dashboard.png` | `/admin/dashboard` | 儀表板：營收折線、Top 商品、區域分布 |
| 07 | `07_admin_products.png` | `/admin/products` | 商品管理列表：**展示 AI 生成按鈕與稅率欄位** |
| 08 | `08_admin_promotions.png` | `/admin/promotions` | 活動設定：滿額贈規則卡片 |

**截圖規格：** 桌面視窗 `1440 × 900`，側欄展開狀態。

---

## 2. 執行方式（建議用 Playwright）

```bash
# 在專案根目錄新增
npm init -y && npm i -D playwright
npx playwright install chromium
```

建立 `scripts/capture.mjs`：

```js
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const OUT = join(homedir(), 'Desktop', '懶飽飽_截圖');
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:4200';

const tasks = [
  // 客戶端 (mobile)
  { file: '01_customer_menu.png',      url: '/customer/menu',         device: 'iPhone 13 Pro' },
  { file: '02_customer_cart.png',      url: '/customer/cart',         device: 'iPhone 13 Pro' },
  { file: '03_customer_member.png',    url: '/customer/member',       device: 'iPhone 13 Pro' },
  // POS (desktop 1440x900)
  { file: '04_pos_cockpit.png',        url: '/pos/cockpit',           viewport: { width: 1440, height: 900 } },
  { file: '05_pos_checkout.png',       url: '/pos/cockpit?order=demo',viewport: { width: 1440, height: 900 } },
  // Admin (desktop 1440x900)
  { file: '06_admin_dashboard.png',    url: '/admin/dashboard',       viewport: { width: 1440, height: 900 } },
  { file: '07_admin_products.png',     url: '/admin/products',        viewport: { width: 1440, height: 900 } },
  { file: '08_admin_promotions.png',   url: '/admin/promotions',      viewport: { width: 1440, height: 900 } },
];

const browser = await chromium.launch();
for (const t of tasks) {
  const ctx = t.device
    ? await browser.newContext({ ...devices[t.device] })
    : await browser.newContext({ viewport: t.viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + t.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600); // 讓動畫/圖片落地
  await page.screenshot({ path: join(OUT, t.file), fullPage: false });
  console.log('✓', t.file);
  await ctx.close();
}
await browser.close();
console.log('完成！輸出路徑：', OUT);
```

執行：`node scripts/capture.mjs`

---

## 3. 如果要自動登入

部分頁面需要登入 token。若 cookie/JWT 放在 `localStorage`，可用以下 snippet 在 `goto` 之前注入：

```js
await ctx.addInitScript(() => {
  localStorage.setItem('ACCESS_TOKEN', 'Bearer <測試用 JWT>');
  localStorage.setItem('ROLE', 'ADMIN');
});
```

實際 key 名請參考 `src/app/core/auth/auth.service.ts`（或對應登入模組）。

---

## 4. 完成後回報

請在 `~/Desktop/懶飽飽_截圖/` 產出 8 張 PNG 後，回覆：
- 實際產出的檔案清單
- 有哪些路由因為缺資料／未實作而沒截到（會列為「尚待補」）
- 若某頁與簡報規劃不符（例如命名不同），請附上修正後的路由

這份截圖集會直接貼回簡報 S13，或獨立在發表後段作為實機展示使用。

---

_產出於 2026-04 · 搭配 `懶飽飽智慧餐飲系統簡報.html` S13 頁_

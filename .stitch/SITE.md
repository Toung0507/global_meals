# Site: 懶飽飽 Global Meals — Stitch 生成計劃

## 1. 專案說明
多國餐飲連鎖品牌「懶飽飽 LazyBaoBao」前端 Angular 應用程式。
使用 Google Stitch 生成各頁面的高品質 HTML 設計稿，再整合回 Angular 元件。

**Stitch Project ID:** (待建立 — 第一次執行時由工具回傳)

---

## 2. 目標裝置
- 客戶端：**MOBILE** (390px iPhone 15 Pro)
- POS 終端：**DESKTOP** (1280px)
- 管理後台：**DESKTOP** (1440px)

---

## 3. 設計主題設定（Stitch）
```json
{
  "colorMode": "LIGHT",
  "font": "NOTO_SANS",
  "roundness": "ROUND_SIXTEEN",
  "customColor": "#D95C1A",
  "saturation": 4
}
```

---

## 4. 頁面清單 (Sitemap)

### 客戶端（暖橘奶油）
- [ ] `qr-entry` — QR 掃碼進入品牌動畫（MOBILE 全螢幕）
- [ ] `customer-login` — 客戶登入（含國家切換）
- [ ] `customer-guest` — 訪客點餐入口
- [ ] `customer-home-home` — 首頁 Tab（輪播 + 精選）
- [ ] `customer-home-menu` — 菜單 Tab（分類篩選 + 商品卡）
- [ ] `customer-home-checkout` — 結帳 Tab（購物車 + 促銷）
- [ ] `customer-home-tracker` — 訂單追蹤 Tab（廚房狀態）

### POS 終端（深底金調）
- [ ] `pos-terminal` — 收銀員操作介面

### 管理後台（深海軍藍）
- [ ] `manager-dashboard` — 老闆 / 分店長後台

---

## 5. 開發路線圖 (Roadmap)
優先順序：
1. `qr-entry` — Demo 必備，掃碼第一眼
2. `customer-login` — 含台灣 / 日本 / 韓國切換
3. `customer-home-menu` — 核心點餐流程
4. `customer-home-tracker` — 廚房狀態即時追蹤

---

## 6. 創意自由區 (Creative Freedom)
- 多國語言切換動畫（旗幟飄入）
- 夜間模式切換（POS 深色 ↔ 管理後台深色）
- 集點卡 UI（10 格打卡）

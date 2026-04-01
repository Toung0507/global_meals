# 懶飽飽 LazyBaoBao

> 台灣在地美食訂餐平台，提供客戶點餐、員工 POS 操作與老闆管理後台一體化解決方案。

---

## 專案簡介

**懶飽飽（LazyBaoBao）** 是一個以 Angular 19 開發的餐飲全端管理系統，包含三個主要入口：

- **客戶端**：會員登入、訪客快速點餐、客戶主頁（商品瀏覽 + 購物車）、會員中心
- **員工 POS 終端**：分店長與員工點餐收銀操作介面
- **老闆管理後台**：營業數據、員工帳號、菜單管理、促銷設定等全功能後台

---

## 技術棧

| 技術       | 版本 / 說明                                  |
| ---------- | -------------------------------------------- |
| Angular    | 19.x（standalone components）                |
| TypeScript | 5.6.x                                        |
| SCSS       | 無 CSS Variables，純傳統寫法                 |
| Bootstrap  | 5.3.8（CDN，僅管理後台 / POS 使用）          |
| Node.js    | 建議 v22 LTS                                 |
| Lottie     | dotlottie-wc 0.9.3（CDN）+ lottie-web（npm） |
| GSAP       | Loading 動畫（npm）                          |
| lottie-web | 5.13.x                                       |
| gsap       | 3.x                                          |

---

## 開發環境啟動

```bash
# 安裝依賴套件
npm install

# 啟動開發伺服器（預設 http://localhost:4200）
ng serve
```

---

## 專案結構

```
src/
├── app/
│   ├── global_meals_login/
│   │   ├── staff-login/          # 管理系統登入頁面（含角色路由）
│   │   ├── customer-login/       # 客戶入口登入頁面
│   │   ├── customer-register/    # 客戶註冊頁面
│   │   └── customer-guest/       # 訪客快速點餐入口
│   ├── customer-home/            # 客戶主頁（商品列表 + 購物車）
│   ├── customer-member/          # 客戶會員中心（個人資料 + 訂單紀錄）
│   ├── manager-dashboard/        # 老闆管理後台（8 個功能頁籤）
│   ├── pos-terminal/             # 分店長 / 員工 POS 點餐終端機
│   ├── shared/
│   │   ├── auth.service.ts       # 帳號驗證服務（暫時 Mock，含客戶 / 員工兩套登入）
│   │   ├── loading.service.ts    # 全域 Loading 狀態服務
│   │   ├── staff-loading/        # 管理端 Loading 動畫元件（深藍金）
│   │   └── customer-loading/     # 客戶端 Loading 動畫元件（v4 分割卡片）
│   ├── app.component.*           # 根元件（含兩組 Loading 遮罩）
│   └── app.routes.ts             # 路由設定
├── index.html                    # 入口 HTML（含字體 + dotlottie-wc CDN）
└── styles.scss                   # 全域樣式
public/
└── assets/
    ├── Logo.png                  # 品牌 Logo（方形）
    └── logo圓形.png              # 品牌 Logo（圓形，Loading 頁使用）
```

---

## 路由一覽

| 路徑                 | 頁面                      | 可存取角色            |
| -------------------- | ------------------------- | --------------------- |
| `/`                  | 自動導向 `/staff-login`   | —                     |
| `/staff-login`       | 管理系統登入              | 所有人                |
| `/customer-login`    | 客戶入口登入              | 所有人                |
| `/customer-register` | 客戶註冊                  | 所有人                |
| `/customer-guest`    | 訪客快速點餐（無需帳號）  | 所有人                |
| `/customer-home`     | 客戶主頁（商品 + 購物車） | customer              |
| `/customer-member`   | 客戶會員中心              | customer              |
| `/manager-dashboard` | 老闆管理後台              | boss                  |
| `/pos-terminal`      | 分店長 / 員工 POS 終端    | branch_manager, staff |

---

## 功能頁籤說明

### 老闆管理後台（`/manager-dashboard`）

| 頁籤     | 功能說明                                     |
| -------- | -------------------------------------------- |
| 儀表板   | 今日概覽：營業額、訂單數、熱銷商品、庫存警示 |
| 訂單管理 | 即時訂單列表，含狀態篩選與詳情               |
| 菜單管理 | 商品列表、新增 / 編輯 / 下架                 |
| 庫存管理 | 各項食材庫存量、低庫存警示                   |
| 促銷設定 | 現有促銷活動列表與新增                       |
| 員工帳號 | 分店長帳號列表 + 員工帳號列表（子頁籤）      |
| 財務報表 | 月營收走勢圖、收入費用明細                   |
| 系統設定 | 餐廳資訊、稅率、營業時間等                   |

### 員工 POS 終端（`/pos-terminal`）

| 頁籤     | 功能說明                                 | 權限     |
| -------- | ---------------------------------------- | -------- |
| 點餐 POS | 商品卡點擊加入購物車、增減數量、付款結帳 | 全員     |
| 排班看板 | 今日排班人員一覽                         | 全員     |
| 庫存速查 | 即時庫存餘量                             | 全員     |
| 促銷快覽 | 當前促銷活動                             | 全員     |
| 員工帳號 | 管理員工帳號                             | 僅分店長 |
| 報表查詢 | 本店今日報表                             | 僅分店長 |

---

## 登入角色說明

| 角色代碼         | 中文說明 | 登入後導向                                    |
| ---------------- | -------- | --------------------------------------------- |
| `boss`           | 老闆     | `/manager-dashboard`                          |
| `branch_manager` | 分店長   | `/pos-terminal`（完整 6 頁籤）                |
| `staff`          | 員工     | `/pos-terminal`（4 頁籤，隱藏員工帳號與報表） |
| `customer`       | 客戶會員 | `/customer-home`                              |
| `guest`          | 訪客     | `/customer-guest`                             |

---

## 團隊分支規範

```bash
# 開工前：同步最新 main
git checkout main && git pull origin main
git checkout dev-xxx && git merge main

# 收工後：推送並發 PR
git add .
git commit -m "描述"
git push origin dev-xxx
# → GitHub 發 Pull Request，等待隊長審核
```

---

## 已完成功能

- [x] 管理系統登入頁面（含角色驗證與路由分流）
- [x] 客戶登入頁面
- [x] 客戶註冊頁面
- [x] 訪客快速點餐入口
- [x] 客戶主頁（商品瀏覽 + 購物車骨架）
- [x] 客戶會員中心（個人資料 + 訂單紀錄）
- [x] 頁面切換 Loading 過場動畫（管理端深藍金 / 客戶端暖橘奶油）
- [ ] 客戶主頁面（商品列表含購物車）
- [ ] 點餐流程頁面
- [ ] 訂單管理後台

---

> 文件最後更新：2026-03-27

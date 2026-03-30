# 懶飽飽 LazyBaoBao

> 台灣在地美食訂餐平台，提供客戶點餐與管理後台一體化解決方案。

---

## 專案簡介

**懶飽飽（LazyBaoBao）** 是一個以 Angular 19 開發的餐飲 POS 管理系統，包含：

- **客戶入口**：會員登入、訪客快速點餐、前往註冊
- **管理系統**：系統經理與現場收銀員雙角色登入

---

## 技術棧

| 技術 | 版本 |
|---|---|
| Angular | 19.x |
| TypeScript | 5.6.x |
| SCSS | — |
| Node.js | 建議 v22 LTS |
| lottie-web | 5.13.x |
| gsap | 3.x |

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
│   │   ├── staff-login/          # 管理系統登入頁面
│   │   ├── customer-login/       # 客戶入口登入頁面
│   │   ├── customer-register/    # 客戶註冊頁面
│   │   └── customer-guest/       # 訪客快速點餐入口
│   ├── customer-member/          # 客戶會員中心（個人資料 + 訂單紀錄）
│   ├── shared/
│   │   ├── auth.service.ts       # 帳號驗證服務（暫時 Mock）
│   │   ├── loading.service.ts    # 全域 Loading 狀態服務
│   │   ├── staff-loading/        # 管理端 Loading 動畫元件（深藍金）
│   │   └── customer-loading/     # 客戶端 Loading 動畫元件（v4 分割卡片）
│   ├── app.component.*           # 根元件（含兩組 Loading 遮罩）
│   └── app.routes.ts             # 路由設定
├── index.html                    # 入口 HTML（含 Google Fonts）
└── styles.scss                   # 全域樣式
public/
└── assets/
    ├── Logo.png                  # 品牌 Logo（方形）
    ├── logo圓形.png              # 品牌 Logo（圓形，Loading 左側面板使用）
    ├── scan-to-order.json        # Lottie 動畫 JSON（lottie-web 使用）
    └── scan-to-order.lottie      # Lottie 動畫壓縮檔（備用）
```

---

## 路由一覽

| 路徑 | 頁面 |
|---|---|
| `/` | 自動導向 `/staff-login` |
| `/staff-login` | 管理系統登入 |
| `/customer-login` | 客戶入口登入 |
| `/customer-register` | 客戶註冊 |
| `/customer-guest` | 訪客快速點餐（無需帳號） |
| `/customer-member` | 客戶會員中心（需登入） |

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

## 預計功能（開發中）

- [x] 員工登入頁面
- [x] 客戶登入頁面
- [x] 客戶註冊頁面
- [x] 訪客快速點餐入口
- [x] 客戶會員中心（個人資料 + 訂單紀錄）
- [x] 頁面切換 Loading 過場動畫（管理端深藍金 / 客戶端暖橘奶油 v4）
- [ ] 客戶主頁面（商品列表含購物車）
- [ ] 點餐流程頁面
- [ ] 訂單管理後台

---

> 文件最後更新：2026-03-30

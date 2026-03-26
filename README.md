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
│   ├── app.component.*           # 根元件
│   └── app.routes.ts             # 路由設定
├── index.html                    # 入口 HTML（含 Google Fonts 引入）
└── styles.scss                   # 全域樣式
public/
└── assets/
    └── Logo.png                  # 品牌 Logo
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
- [ ] 頁面跳轉動畫
- [ ] 客戶主頁面（商品列表含購物車）
- [ ] 點餐流程頁面
- [ ] 訂單管理後台

---

> 文件最後更新：2026-03-26

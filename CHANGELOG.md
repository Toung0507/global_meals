# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0.0] - 2026-04-05

### Added
- **客戶端主頁（Customer Home）**：完整下單流程、菜單瀏覽、食物照片展示、今日優惠區塊、Hero 區塊
- **客戶會員中心（Customer Member）**：會員資料頁、頭像上傳、訂單歷史
- **客戶登入/註冊（Customer Login/Register）**：表單驗證、sessionStorage 持久化
- **客戶訪客模式（Customer Guest）**：無帳號瀏覽體驗
- **員工 POS 終端（POS Terminal）**：品牌改版、商品分類搜尋、點餐結帳流程
- **管理後台（Manager Dashboard）**：訂單看板、營業統計、員工管理
- **員工登入（Staff Login）**：角色驗證（老闆/員工）
- **讀取動畫（Loading）**：客戶端分割卡片動畫（v4）、員工端 Loading 元件
- **設計系統基礎**：`_design-tokens.scss` 設計代字、Bootstrap 5.3.8 整合
- **Lottie 動畫**：本機 scan-to-order 動畫資源
- **訂單服務（order.service.ts）**：前端訂單狀態管理
- **Auth 服務**：sessionStorage 持久化、updateProfile() 同步更新
- **路由設定**：三種身份角色路由（客戶/員工/老闆）

### Changed
- `app.component.html`：主路由框架重構，整合角色導向導覽
- `README.md`：更新專案說明與開發狀態
- `LAPTOP_SETUP.md`：新增環境設定文件


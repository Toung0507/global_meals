// =====================================================
// 檔案名稱：api.config.ts
// 位置說明：src/app/shared/api.config.ts
// 用途說明：API 基礎設定（對應後端 Spring Boot 實際路由）
//
// ⚠ 串接說明：
//   後端啟動後，將 BASE_URL 改為後端伺服器位址即可。
//   例如本機開發：'http://localhost:8080'
//   部署後：      'https://your-server.com'
//
// ⚠ Demo 階段：BASE_URL 留空，所有 API 呼叫皆被元件
//   中的 TODO 區塊以 mock 資料取代，不會發出任何請求。
// =====================================================

export const API_CONFIG = {
  BASE_URL: '',  // ⚠ 串接時填入後端 URL，例如 'http://localhost:8080'
  TIMEOUT: 10000,  // 10 秒逾時

  // ── API 端點定義（與後端 Controller 路由完全對應）────

  ENDPOINTS: {

    // 購物車（CartController → /api/cart）
    CART: {
      VIEW:    '/api/cart/:cartId',     // GET  查看購物車
      SYNC:    '/api/cart/sync',        // POST 新增/更新商品
      REMOVE:  '/api/cart/item',        // DELETE 刪除單品
      COUPON:  '/api/cart/coupon',      // POST 套用折價券
    },

    // 訂單（OrdersController）
    ORDERS: {
      GET_ALL:       '/Orders/GetAllOrdersList',  // POST 取得歷史訂單
      UPDATE_STATUS: '/Orders/ordersStatus',      // POST 退款/取消
      CREATE:        '/Orders/createOrdersRes',   // POST 成立訂單
      PAY:           '/Orders/pay',               // POST 結帳
      BY_PHONE:      '/Orders/getOrderByPhone',   // GET  以電話取餐
    },

    // 分店（GlobalAreaController → /global_area）
    GLOBAL_AREA: {
      GET_ALL: '/global_area/get_all_branch',  // GET  取得全部分店
      CREATE:  '/global_area/create',          // POST 新增分店
      UPDATE:  '/global_area/update',          // POST 修改分店
      DELETE:  '/global_area/delete',          // POST 刪除分店
    },

    // 稅率（RegionsController → /lazybaobao/regions）
    REGIONS: {
      GET_ALL: '/lazybaobao/regions/get_all_tax',  // GET  取得全部稅率
      CREATE:  '/lazybaobao/regions/create',       // POST 新增稅率
      UPDATE:  '/lazybaobao/regions/update',       // POST 更新稅率
    },

    // 匯率（ExchangeRatesController → /exchange_rates）
    EXCHANGE_RATES: {
      GET_ALL:      '/exchange_rates/get_all_rates',     // GET  全部匯率
      GET_BY_DATE:  '/exchange_rates/get_rates_by_date', // POST 依日期查詢
    },

    // ── 下方為後端尚未實作的 Controller，預留路由 ──────

    // 會員（MembersController，後端待建立）
    MEMBERS: {
      LOGIN:    '/members/login',     // POST 會員登入
      REGISTER: '/members/register',  // POST 會員註冊
      PROFILE:  '/members/profile',   // GET  取得個人資料
      UPDATE:   '/members/update',    // POST 更新個人資料
    },

    // 員工（StaffController，後端待建立）
    STAFF: {
      LOGIN:      '/staff/login',       // POST 員工登入
      GET_ALL:    '/staff/get_all',     // GET  取得全部員工
      TOGGLE:     '/staff/toggle',      // POST 停/復權
    },

    // 商品（ProductsController，後端待建立）
    PRODUCTS: {
      GET_ALL:    '/products/get_all',    // GET  取得全部商品
      GET_ACTIVE: '/products/active',     // GET  取得上架商品（菜單用）
      CREATE:     '/products/create',     // POST 新增商品
      UPDATE:     '/products/update',     // POST 修改商品
      TOGGLE:     '/products/toggle',     // POST 上/下架切換
      IMAGE:      '/products/:id/image',  // GET  取得商品圖片（BLOB）
    },

    // 活動（PromotionsController，後端待建立）
    PROMOTIONS: {
      GET_ALL:    '/promotions/get_all',  // GET  取得全部活動
      CREATE:     '/promotions/create',   // POST 新增活動
      TOGGLE:     '/promotions/toggle',   // POST 啟用/停用活動
      GIFTS:      '/promotions/gifts',    // GET  取得活動贈品清單
    },

  },
};

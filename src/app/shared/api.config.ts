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
//
// 最後更新：2026-04-10（依後端 Controller 實際路由修正）
// =====================================================

export const API_CONFIG = {
  /** ⚠ Demo 離線模式：true = 不發 HTTP 請求，直接回傳假資料（不需開 Eclipse / DB）
   *  切換真實後端時改為 false 即可，其餘程式碼不需異動。 */
  MOCK_MODE: false,

  BASE_URL: '', // ⚠ 透過 Angular proxy 轉發，相對路徑即可（proxy.conf.json → localhost:8080）
  TIMEOUT: 10000, // 10 秒逾時

  // ── API 端點定義（與後端 Controller 路由完全對應）────

  ENDPOINTS: {
    // 購物車（CartController，@RequestMapping("lazybaobao/cart")）
    CART: {
      VIEW: 'lazybaobao/cart/:cartId', // GET    查看購物車（?memberId=X）
      SYNC: 'lazybaobao/cart/sync_item', // POST   新增/更新商品
      REMOVE: 'lazybaobao/cart/remove_item', // DELETE 刪除單品
      GIFT: 'lazybaobao/cart/select_gift', // POST   使用者選擇贈品
      CLEAR: 'lazybaobao/cart/clear_cart', // DELETE 清空購物車
    },

    // 訂單（OrdersController，@RequestMapping("lazybaobao/orders")）
    ORDERS: {
      CREATE: 'lazybaobao/orders/create_order', // POST 成立訂單（UNPAID）
      PAY: 'lazybaobao/orders/pay', // POST 結帳（→ COMPLETED）
      GET_ALL: 'lazybaobao/orders/get_all_orders', // POST 取得歷史訂單
      BY_PHONE: 'lazybaobao/orders/get_order_by_phone', // GET  以電話查詢 UNPAID 訂單
      UPDATE_STATUS: 'lazybaobao/orders/update_status', // POST 退款/取消
      TODAY_ORDERS: 'lazybaobao/orders/today_orders', // GET  POS 看板輪詢今日訂單
      KITCHEN_STATUS: 'lazybaobao/orders/kitchen_status', // POST POS 更新廚房狀態
      ORDER_STATUS: 'lazybaobao/orders/order_status', // GET  客戶端輪詢廚房狀態
    },

    // 促銷活動（PromotionsManageController，@RequestMapping("lazybaobao/promotions")）
    PROMOTIONS: {
      LIST: 'lazybaobao/promotions/list', // GET  取得全部活動及贈品（管理端）
      CREATE: 'lazybaobao/promotions/create', // POST 建立活動（可附贈品規則）
      TOGGLE: 'lazybaobao/promotions/toggle_status', // POST 啟用/停用活動
      CALCULATE: 'lazybaobao/promotions/calculate', // POST 結帳時計算促銷
      AVAILABLE_GIFTS: 'lazybaobao/promotions/get_available_gifts', // POST 取得可選贈品（?amount=xxx）
      ADD_GIFT: 'lazybaobao/promotions/add_gift', // POST 新增贈品規則至活動
      UPDATE_INFO: 'lazybaobao/promotions/update_info', // POST 更新活動文案與封面圖
    },

    // 分店（GlobalAreaController，@RequestMapping("lazybaobao/global_area")）
    GLOBAL_AREA: {
      GET_ALL: 'lazybaobao/global_area/get_all_branch', // GET  取得全部分店
      CREATE: 'lazybaobao/global_area/create', // POST 新增分店
      UPDATE: 'lazybaobao/global_area/update', // POST 修改分店
      DELETE: 'lazybaobao/global_area/delete', // POST 刪除分店（支援批次）
    },

    // 稅率（RegionsController，@RequestMapping("lazybaobao/regions")）
    // ⚠ dev-wun 已重構：create/update → upsert 統一端點，另新增 update_usage_cap
    REGIONS: {
      GET_ALL:          'lazybaobao/regions/get_all_tax',       // GET  取得全部國家稅率
      UPSERT:           'lazybaobao/regions/upsert',            // POST 新增或更新稅率（合一端點）
      UPDATE_USAGE_CAP: 'lazybaobao/regions/update_usage_cap', // POST 更新折扣上限
    },

    // 月報表（ReportsController，dev-kao，無前綴）
    REPORTS: {
      MONTHLY:       'find_monthly_reports',               // POST 查詢單月報表（含上月對比）
      MONTHLY_RANGE: 'find_monthly_reports_by_date_range', // POST 查詢月份區間報表
      REVENUE:       'get_revenue_reports',                // POST 查詢日期區間營業額
    },

    // 匯率（ExchangeRatesController，@RequestMapping("lazybaobao/exchange_rates")）
    // 匯率由後端排程自動更新，前端唯讀即可
    EXCHANGE_RATES: {
      GET_ALL: 'lazybaobao/exchange_rates/get_all_rates', // GET  全部匯率
      GET_BY_DATE: 'lazybaobao/exchange_rates/get_rates_by_date', // POST 依日期查詢
    },

    // ── 會員（MembersController）── 後端已建立，路徑不含 lazybaobao 前綴
    MEMBERS: {
      REGISTER_GUEST: 'members/register_guest', // POST 訪客快速建立（不需密碼）
      REGISTER_MEMBER: 'members/register_member', // POST 正式會員註冊（需密碼）
      LOGIN: 'members/login', // POST 會員登入（phone + password）
      LOGOUT: 'members/logout', // GET  會員登出
      UPDATE_PASSWORD: 'members/update_password', // POST 修改密碼
    },

    // ── 員工（StaffController）── 後端已建立，路徑不含 lazybaobao 前綴
    STAFF: {
      LOGIN: 'api/auth/login', // POST 員工登入（account + password）
      LOGOUT: 'api/auth/logout', // GET  員工登出
      GET_ALL: 'api/admin/staff', // GET  取得員工清單（ADMIN 看全部 RM；RM 看自己分店）
      CREATE: 'api/admin/staff', // POST 新增員工（RM 或 ST）
      UPDATE_STATUS: 'api/admin/staff/:id/status', // PATCH 停權 / 復權
      CHANGE_PASSWORD: 'api/admin/staff/:id/password', // PATCH 修改密碼
    },

    // 商品（ProductsController，lazybaobao 前綴）
    PRODUCTS: {
      GET_ACTIVE: 'lazybaobao/products/active',      // GET  ?globalAreaId=X
      GET_ALL:    'lazybaobao/products/get_all',     // GET  ?globalAreaId=X（管理端）
      IMAGE:      'lazybaobao/products/:id/image',   // GET  回傳 Base64 字串
      CREATE:     'lazybaobao/products/create',      // POST 新增商品
      UPDATE:     'lazybaobao/products/update',      // POST 修改商品
      TOGGLE:     'lazybaobao/products/toggle',      // POST 切換上/下架
    },

    // 分店庫存（BranchInventoryController，lazybaobao 前綴）
    BRANCH_INVENTORY: {
      GET_BY_AREA: 'lazybaobao/branch_inventory/:areaId', // GET
      UPDATE:      'lazybaobao/branch_inventory/update',  // POST
    },

    // 支付（PaymentController，lazybaobao 前綴，透過 Angular proxy 轉發）
    PAYMENT: {
      LINEPAY_REQUEST: 'lazybaobao/payment/linepay/request', // POST 取得 LINE Pay 付款 URL
      LINEPAY_CONFIRM: 'lazybaobao/payment/linepay/confirm', // GET  LINE Pay 回調（後端處理）
      ECPAY_REQUEST:   'lazybaobao/payment/ecpay/request',   // POST 取得 ECPay HTML 表單
      ECPAY_CALLBACK:  'lazybaobao/payment/ecpay/callback',  // POST ECPay 付款結果通知
    },
  },
};

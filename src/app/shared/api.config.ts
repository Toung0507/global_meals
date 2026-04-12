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
  MOCK_MODE: true,

  BASE_URL: 'http://localhost:8080',  // ⚠ 後端 Spring Boot 預設 port
  TIMEOUT: 10000,  // 10 秒逾時

  // ── API 端點定義（與後端 Controller 路由完全對應）────

  ENDPOINTS: {

    // 購物車（CartController，@RequestMapping("lazybaobao/cart")）
    CART: {
      VIEW:    'lazybaobao/cart/:cartId',        // GET    查看購物車（?memberId=X）
      SYNC:    'lazybaobao/cart/sync_item',      // POST   新增/更新商品
      REMOVE:  'lazybaobao/cart/remove_item',    // DELETE 刪除單品
      GIFT:    'lazybaobao/cart/select_gift',    // POST   使用者選擇贈品
      CLEAR:   'lazybaobao/cart/clear_cart',     // DELETE 清空購物車
    },

    // 訂單（OrdersController，@RequestMapping("lazybaobao/orders")）
    ORDERS: {
      CREATE:        'lazybaobao/orders/create_order',       // POST 成立訂單（UNPAID）
      PAY:           'lazybaobao/orders/pay',                // POST 結帳（→ COMPLETED）
      GET_ALL:       'lazybaobao/orders/get_all_orders',     // POST 取得歷史訂單
      BY_PHONE:      'lazybaobao/orders/get_order_by_phone', // GET  以電話查詢 UNPAID 訂單
      UPDATE_STATUS: 'lazybaobao/orders/update_status',      // POST 退款/取消
    },

    // 促銷活動（PromotionsManageController，@RequestMapping("lazybaobao/promotions")）
    PROMOTIONS: {
      LIST:            'lazybaobao/promotions/list',               // GET  取得全部活動及贈品（管理端）
      CREATE:          'lazybaobao/promotions/create',             // POST 建立活動（可附贈品規則）
      TOGGLE:          'lazybaobao/promotions/toggle_status',      // POST 啟用/停用活動
      CALCULATE:       'lazybaobao/promotions/calculate',          // POST 結帳時計算促銷
      AVAILABLE_GIFTS: 'lazybaobao/promotions/get_available_gifts',// POST 取得可選贈品（?amount=xxx）
      ADD_GIFT:        'lazybaobao/promotions/add_gift',           // POST 新增贈品規則至活動
    },

    // 分店（GlobalAreaController，@RequestMapping("lazybaobao/global_area")）
    GLOBAL_AREA: {
      GET_ALL: 'lazybaobao/global_area/get_all_branch', // GET  取得全部分店
      CREATE:  'lazybaobao/global_area/create',         // POST 新增分店
      UPDATE:  'lazybaobao/global_area/update',         // POST 修改分店
      DELETE:  'lazybaobao/global_area/delete',         // POST 刪除分店（支援批次）
    },

    // 稅率（RegionsController，@RequestMapping("lazybaobao/regions")）
    REGIONS: {
      GET_ALL: 'lazybaobao/regions/get_all_tax', // GET  取得全部國家稅率
      CREATE:  'lazybaobao/regions/create',      // POST 新增國家稅率
      UPDATE:  'lazybaobao/regions/update',      // POST 更新國家稅率
    },

    // 匯率（ExchangeRatesController，@RequestMapping("lazybaobao/exchange_rates")）
    // 匯率由後端排程自動更新，前端唯讀即可
    EXCHANGE_RATES: {
      GET_ALL:      'lazybaobao/exchange_rates/get_all_rates',     // GET  全部匯率
      GET_BY_DATE:  'lazybaobao/exchange_rates/get_rates_by_date', // POST 依日期查詢
    },

    // ── 下方為後端尚未建立的 Controller，預留路由 ──────

    // 會員（MembersController，後端待建立）
    MEMBERS: {
      REGISTER: '/members/register',  // POST 會員註冊
      LOGIN:    '/members/login',     // POST 會員登入（回傳 memberId + name）
      PROFILE:  '/members/profile',   // GET  取得個人資料（含 order_count, is_discount）
      UPDATE:   '/members/update',    // POST 更新個人資料
    },

    // 員工（StaffController，後端待建立）
    STAFF: {
      LOGIN:   '/staff/login',     // POST 員工登入（account + password）
      GET_ALL: '/staff/get_all',   // GET  取得全部員工清單
      TOGGLE:  '/staff/toggle',    // POST 停/復權（is_status）
    },

    // 商品（ProductsController，後端待建立）
    // ⚠ 注意：products.food_img 是 MEDIUMBLOB，商品列表不應包含圖片欄位
    //         圖片應使用獨立的 IMAGE 端點，或傳 Base64 string
    PRODUCTS: {
      GET_ACTIVE: '/products/active',       // GET  取得上架商品清單（菜單用）
      GET_ALL:    '/products/get_all',      // GET  取得全部商品（含下架，管理端用）
      IMAGE:      '/products/:id/image',    // GET  取得商品圖片（MEDIUMBLOB → Base64）
      CREATE:     '/products/create',       // POST 新增商品（同時建 branch_inventory）
      UPDATE:     '/products/update',       // POST 修改商品資訊
      TOGGLE:     '/products/toggle',       // POST 上/下架切換（is_active）
    },

    // 分店庫存（BranchInventoryController，後端待建立）
    // ⚠ 注意：每個分店對同一商品可能有不同售價（branch_inventory.base_price）
    BRANCH_INVENTORY: {
      GET_BY_AREA: '/branch_inventory/:areaId',  // GET  取得該分店庫存清單
      UPDATE:      '/branch_inventory/update',   // POST 更新分店庫存或價格
    },

  },
};

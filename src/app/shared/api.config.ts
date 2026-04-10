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
  BASE_URL: '',  // ⚠ 串接時填入後端 URL，例如 'http://localhost:8080'
  TIMEOUT: 10000,  // 10 秒逾時

  // ── API 端點定義（與後端 Controller 路由完全對應）────

  ENDPOINTS: {

    // 購物車（CartController，無 @RequestMapping 前綴）
    // ⚠ 注意：路徑不含 /api/（舊版錯誤），正確格式為 cart/...
    CART: {
      VIEW:    'cart/:cartId',   // GET    查看購物車（?memberId=X）
      SYNC:    'cart/sync',      // POST   新增/更新商品
      REMOVE:  'cart/item',      // DELETE 刪除單品（@RequestBody CartRemoveReq）
      GIFT:    'cart/gift',      // POST   使用者選擇贈品（★新增）
      CLEAR:   'cart/clear',     // DELETE 清空購物車（★新增）
      // ⚠ coupon 端點已不存在，已移除
    },

    // 訂單（OrdersController，無 @RequestMapping 前綴，注意大寫 O）
    ORDERS: {
      CREATE:        'Orders/createOrdersRes',   // POST 成立訂單（UNPAID）
      PAY:           'Orders/pay',               // POST 結帳（→ COMPLETED）
      GET_ALL:       'Orders/GetAllOrdersList',  // POST 取得歷史訂單
      BY_PHONE:      'Orders/getOrderByPhone',   // GET  以電話查詢 UNPAID 訂單
      UPDATE_STATUS: 'Orders/ordersStatus',      // POST 退款/取消
    },

    // 促銷活動（PromotionsManageController，已完成！）
    // 注意：管理端用 /promotions/...（有斜線前綴）
    //       舊端點用 Promotions/...（無斜線，大寫 P）
    PROMOTIONS: {
      LIST:            '/promotions/list',              // GET  取得全部活動及贈品（管理端）
      CREATE:          '/promotions/create',            // POST 建立活動（可附贈品規則）
      TOGGLE:          '/promotions/toggle',            // POST 啟用/停用活動
      CALCULATE:       '/promotions/calculate',         // POST 結帳時計算促銷（折扣 + 贈品）
      AVAILABLE_GIFTS: 'Promotions/getAvailableGifts',  // POST 取得可選贈品（QueryParam: ?amount=xxx）
      // 舊管理端點（保留備用，建議優先使用上方新端點）
      ADD_PROMOTION:   'Promotions/addPromotion',       // POST 新增活動（舊）
      ADD_GIFT:        'Promotions/addPromotionGift',   // POST 新增贈品規則至活動（舊）
      DELETE:          'Promotions/deletePromotion',    // DELETE Promotions/deletePromotion/{id}（舊）
    },

    // 分店（GlobalAreaController，無 @RequestMapping 前綴）
    GLOBAL_AREA: {
      GET_ALL: 'global_area/get_all_branch',  // GET  取得全部分店
      CREATE:  'global_area/create',          // POST 新增分店
      UPDATE:  'global_area/update',          // POST 修改分店
      DELETE:  'global_area/delete',          // POST 刪除分店（支援批次）
    },

    // 稅率（RegionsController，@RequestMapping("/lazybaobao")）
    // ⚠ 前綴是 /lazybaobao，完整路徑：/lazybaobao/regions/...
    REGIONS: {
      GET_ALL: '/lazybaobao/regions/get_all_tax',  // GET  取得全部國家稅率
      CREATE:  '/lazybaobao/regions/create',       // POST 新增國家稅率
      UPDATE:  '/lazybaobao/regions/update',       // POST 更新國家稅率
    },

    // 匯率（ExchangeRatesController，無 @RequestMapping 前綴）
    // 匯率由後端排程自動更新，前端唯讀即可
    EXCHANGE_RATES: {
      GET_ALL:      'exchange_rates/get_all_rates',     // GET  全部匯率
      GET_BY_DATE:  'exchange_rates/get_rates_by_date', // POST 依日期查詢
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

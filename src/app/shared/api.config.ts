// =====================================================
// 檔案名稱：api.config.ts
// 位置說明：src/app/shared/api.config.ts
// 用途說明：API 基礎設定（對應後端 Spring Boot 實際路由）
// 最後更新：2026-04-24（WebConfig.configurePathMatch 對所有 @RestController 加 /lazybaobao 前綴）
// =====================================================

export const API_CONFIG = {
  /** MOCK_MODE: true = 不發 HTTP 請求，直接回傳假資料 */
  MOCK_MODE: false,

  BASE_URL: '', // 透過 Angular proxy 轉發，相對路徑即可（proxy.conf.json → localhost:8080）
  TIMEOUT: 10000, // 10 秒逾時

  ENDPOINTS: {
    // 購物車（CartController，@RequestMapping("/cart")，WebConfig 加 /lazybaobao 前綴）
    CART: {
      VIEW: 'lazybaobao/cart/:cartId', // GET    /lazybaobao/cart/{cartId}
      SYNC: 'lazybaobao/cart/sync', // POST   /lazybaobao/cart/sync
      REMOVE: 'lazybaobao/cart/item', // DELETE /lazybaobao/cart/item
      GIFT: 'lazybaobao/cart/gift', // POST   /lazybaobao/cart/gift
      CLEAR: 'lazybaobao/cart/clear', // DELETE /lazybaobao/cart/clear
      SWITCH_BRANCH: 'lazybaobao/cart/cart/switch-branch', // POST /lazybaobao/cart/cart/switch-branch
    },

    // 訂單（OrdersController，無 class-level mapping）
    ORDERS: {
      CREATE: 'lazybaobao/orders/create_orders', // POST
      PAY: 'lazybaobao/orders/pay', // POST
      GET_ALL: 'lazybaobao/orders/get_all_orders_list', // POST
      BY_PHONE: 'lazybaobao/orders/get_order_by_phone', // GET
      UPDATE_STATUS: 'lazybaobao/orders/orders_status', // POST
      KITCHEN_STATUS: 'lazybaobao/orders/kitchen_status', // POST (POS 廚房狀態)
      GET_STATUS: 'lazybaobao/orders/get_order_status', // GET  (顧客輪詢)
      CASH_CONFIRM: 'lazybaobao/orders/cash_confirm', // POST (現金收款確認)
    },

    // 促銷活動（PromotionsManageController，無 class-level mapping）
    PROMOTIONS: {
      LIST: 'lazybaobao/promotions/list', // GET
      CREATE: 'lazybaobao/promotions/create', // POST
      TOGGLE: 'lazybaobao/promotions/toggle', // POST
      CALCULATE: 'lazybaobao/promotions/calculate', // POST
      AVAILABLE_GIFTS: 'lazybaobao/promotions/getAvailableGifts', // POST
      ADD_GIFT: 'lazybaobao/promotions/addPromotionGift', // POST
      UPLOAD_IMAGE: 'lazybaobao/promotions/uploadImage/:id', // POST (multipart)
      UPDATE_DESCRIPTION: 'lazybaobao/promotions/updateDescription/:id', // POST
      GET_IMAGE: 'lazybaobao/promotions/image/:id', // GET
      DELETE: 'lazybaobao/promotions/deletePromotion/:id', // DELETE
    },

    // 分店（GlobalAreaController，無 class-level mapping）
    GLOBAL_AREA: {
      GET_ALL: 'lazybaobao/global_area/get_all_branch', // GET
      CREATE: 'lazybaobao/global_area/create', // POST
      UPDATE: 'lazybaobao/global_area/update', // POST
      DELETE: 'lazybaobao/global_area/delete', // POST
    },

    // 稅率（RegionsController，@RequestMapping 已移除，僅靠 WebConfig /lazybaobao 前綴）
    REGIONS: {
      GET_ALL: 'lazybaobao/regions/get_all_tax', // GET
      UPSERT: 'lazybaobao/regions/upsert', // POST
      UPDATE_USAGE_CAP: 'lazybaobao/regions/update_usage_cap', // POST
    },

    // 月報表（ReportsController，無 class-level mapping）
    REPORTS: {
      MONTHLY: 'lazybaobao/find_monthly_reports',
      MONTHLY_RANGE: 'lazybaobao/find_monthly_reports_by_date_range',
      REVENUE: 'lazybaobao/get_revenue_reports',
    },

    // 匯率（ExchangeRatesController，無 class-level mapping）
    EXCHANGE_RATES: {
      GET_ALL: 'lazybaobao/exchange_rates/get_all_rates', // GET
      GET_BY_DATE: 'lazybaobao/exchange_rates/get_rates_by_date', // POST
      FETCH: 'lazybaobao/exchange_rates/fetch', // POST（手動觸發爬取）
    },

    // AI（AiController，@RequestMapping("/ai")）
    AI: {
      PROMO_COPY: 'lazybaobao/ai/promo-copy', // POST multipart（活動文案，存 ai_generated）
      PRODUCT_DESC: 'lazybaobao/ai/product-desc', // ← 加這行
    },

    // 會員（MembersController，無 class-level mapping）
    MEMBERS: {
      REGISTER_GUEST: 'lazybaobao/members/register_guest', // POST
      REGISTER_MEMBER: 'lazybaobao/members/register_member', // POST
      LOGIN: 'lazybaobao/members/login', // POST
      LOGOUT: 'lazybaobao/members/logout', // GET
      UPDATE_PASSWORD: 'lazybaobao/members/update_password', // POST
      GET_BY_PHONE: 'lazybaobao/members/get_by_phone', // GET ?phone= (POS 查詢正式會員)
    },

    // 員工（StaffController，無 class-level mapping）
    STAFF: {
      LOGIN: 'lazybaobao/api/auth/login', // POST
      LOGOUT: 'lazybaobao/api/auth/logout', // GET
      GET_ALL: 'lazybaobao/api/admin/staff', // GET
      CREATE: 'lazybaobao/api/admin/staff', // POST
      UPDATE_STATUS: 'lazybaobao/api/admin/staff/:id/status', // PATCH
      CHANGE_PASSWORD: 'lazybaobao/api/admin/staff/:id/password', // PATCH
      PROMOTE: 'lazybaobao/api/admin/staff/:id/promote', // PATCH
      SELF_CHANGE_PASSWORD: 'lazybaobao/api/staff/password', // PATCH
    },

    // 商品（ProductsController，@RequestMapping("/product")）
    PRODUCTS: {
      LIST: 'lazybaobao/product/list', // GET（管理端全部商品）
      TRASH: 'lazybaobao/product/trash', // GET（已刪除商品）
      DETAIL: 'lazybaobao/product/detail/:id', // GET
      STATUS: 'lazybaobao/product/status/:id', // PATCH ?active=
      CREATE: 'lazybaobao/product/create', // POST（multipart）
      UPDATE: 'lazybaobao/product/update', // POST（multipart）
      MENU: 'lazybaobao/inventory/menu/:globalAreaId', // GET（前台菜單）
      MONTHLY_SALES_RM: 'lazybaobao/product/api/rm/monthly-sales',
      MONTHLY_SALES_ADMIN: 'lazybaobao/product/api/admin/top5-monthly-sales',
    },

    // 分店庫存（BranchInventoryController，@RequestMapping("/inventory")）
    BRANCH_INVENTORY: {
      GET_BY_AREA: 'lazybaobao/inventory/branch/:areaId', // GET
      GET_BY_PRODUCT: 'lazybaobao/inventory/product/:productId', // GET
      UPDATE: 'lazybaobao/inventory/update', // POST (全欄位更新)
      UPDATE_STOCK: 'lazybaobao/inventory/update-stock', // POST (僅更新庫存數量)
    },

    // 支付（OrdersController）
    PAYMENT: {
      GO_PAY: 'lazybaobao/goPay', // GET ?orderDateId=&id=&way=ECPAY|LINEPAY
      LINEPAY_CONFIRM: 'lazybaobao/linepay/confirm', // GET
    },
  },
};

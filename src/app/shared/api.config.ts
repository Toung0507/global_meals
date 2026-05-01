// =====================================================
// 檔案名稱：api.config.ts
// 位置說明：src/app/shared/api.config.ts
// 用途說明：API 基礎設定（對應後端 Spring Boot 實際路由）
// 最後更新：2026-04-30（依後端 PR #36 全面修正：STAFF /api/ → /staff/、REGIONS 路徑重構、orders get_by_phone、產品銷售報表路徑）
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
      SWITCH_BRANCH: 'lazybaobao/cart/switch-branch', // POST /lazybaobao/cart/switch-branch
    },

    // 訂單（OrdersController，@RequestMapping("/orders")）
    ORDERS: {
      CREATE: 'lazybaobao/orders/create_orders', // POST
      PAY: 'lazybaobao/orders/pay', // POST
      GET_ALL: 'lazybaobao/orders/get_all_orders_list', // GET ?memberId=
      GET_TODAY_ALL: 'lazybaobao/orders/get_today_all_orders_list', // GET（無 globalAreaId，依 session）
      GET_TODAY_BY_MEMBER: 'lazybaobao/orders/get_today_orders_by_member', // GET（依 session 會員，回傳今日訂單狀態）
      BY_PHONE: 'lazybaobao/orders/get_by_phone', // GET ?phone=（原 get_order_by_phone）
      UPDATE_STATUS: 'lazybaobao/orders/orders_status', // POST（UpdateOrdersStatusReq，欄位 ordersStatus）
      KITCHEN_STATUS: 'lazybaobao/orders/kitchen_status', // POST (POS 廚房狀態，未實作)
      GET_STATUS: 'lazybaobao/orders/get_order_status', // GET  (顧客輪詢)
      CASH_CONFIRM: 'lazybaobao/orders/cash_confirm', // POST (現金收款確認，未實作)
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

    // 分店（GlobalAreaController，@RequestMapping("/global-area")）
    GLOBAL_AREA: {
      GET_ALL: 'lazybaobao/global-area/get_all_branch', // GET
      CREATE: 'lazybaobao/global-area/create', // POST
      UPDATE: 'lazybaobao/global-area/update', // POST
      DELETE: 'lazybaobao/global-area/delete', // POST
    },

    // 稅率（RegionsController，@RequestMapping("/regions")）
    REGIONS: {
      GET_ALL: 'lazybaobao/regions/get_all', // GET（原 get_all_tax）
      INSERT: 'lazybaobao/regions/insert', // POST 新增國家稅率（CreateRegionsReq：含 country/currencyCode/countryCode/taxRate/taxType/usageCap）
      UPDATE: 'lazybaobao/regions/update', // POST 更新既有國家（UpdateRegionsReq：含 id/taxRate/taxType/usageCap）
    },

    // 月報表（ReportsController，@RequestMapping("/reports")）
    REPORTS: {
      MONTHLY: 'lazybaobao/reports/find_monthly_reports', // POST
      MONTHLY_RANGE: 'lazybaobao/reports/find_monthly_reports_by_date_range', // POST
      REVENUE: 'lazybaobao/reports/get_revenue_reports', // POST
    },

    // 匯率（ExchangeRatesController，@RequestMapping("/exchange-rates")）
    EXCHANGE_RATES: {
      GET_ALL: 'lazybaobao/exchange-rates/get_all_rates', // GET（僅此端點，排程自動更新）
    },

    // AI（AiController，@RequestMapping("/ai")）
    AI: {
      PROMO_COPY: 'lazybaobao/ai/promo-copy', // POST multipart（活動文案，存 ai_generated）
      PRODUCT_DESC: 'lazybaobao/ai/product-desc', // POST
    },

    // 會員（MembersController，無 class-level mapping）
    MEMBERS: {
      REGISTER_GUEST: 'lazybaobao/members/register_guest', // POST
      REGISTER_MEMBER: 'lazybaobao/members/register_member', // POST
      LOGIN: 'lazybaobao/members/login', // POST
      LOGOUT: 'lazybaobao/members/logout', // GET
      UPDATE_PASSWORD: 'lazybaobao/members/update-password', // POST
      GET_BY_PHONE: 'lazybaobao/members/get_by_phone', // GET ?phone= (POS 查詢正式會員)
    },

    // 員工（StaffController，@RequestMapping("/staff")）
    STAFF: {
      LOGIN: 'lazybaobao/staff/auth/login', // POST（原 /api/auth/login）
      LOGOUT: 'lazybaobao/staff/auth/logout', // GET（原 /api/auth/logout）
      GET_ALL: 'lazybaobao/staff/admin/staff', // GET（原 /api/admin/staff）
      CREATE: 'lazybaobao/staff/admin/staff', // POST（原 /api/admin/staff）
      UPDATE_STATUS: 'lazybaobao/staff/admin/staff/:id/status', // PATCH
      CHANGE_PASSWORD: 'lazybaobao/staff/admin/staff/:id/password', // PATCH
      PROMOTE: 'lazybaobao/staff/admin/staff/:id/toggle', // PATCH（原 promote，現合併晉升/降級為 toggle）
      SELF_CHANGE_PASSWORD: 'lazybaobao/staff/staff/password', // PATCH（原 /api/staff/password）
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
      MONTHLY_SALES_RM: 'lazybaobao/product/rm/monthlysales', // GET（原 /api/rm/monthly-sales）
      MONTHLY_SALES_ADMIN: 'lazybaobao/product/admin/top5monthlysales', // GET（原 /api/admin/top5-monthly-sales）
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
      GO_PAY: 'lazybaobao/orders/goPay', // GET ?orderDateId=&id=&way=ECPAY|LINEPAY
      LINEPAY_CONFIRM: 'lazybaobao/orders/linepay/confirm', // GET
    },
  },
};

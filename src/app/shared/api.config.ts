// =====================================================
// 檔案名稱：api.config.ts
// 位置說明：src/app/shared/api.config.ts
// 用途說明：API 基礎設定
//           ⚠ Demo 階段：BASE_URL 先留空，串接時填入後端 URL
// =====================================================

export const API_CONFIG = {
  BASE_URL: '',  // ⚠ 串接時改為後端 URL，例如 'https://api.lazybao.com'
  VERSION: 'v1',
  TIMEOUT: 10000,  // 10 秒逾時

  // ── API 端點定義 ────────────────────────────────
  ENDPOINTS: {

    // 認證相關
    AUTH: {
      LOGIN:    '/auth/login',
      LOGOUT:   '/auth/logout',
      REGISTER: '/auth/register',
      REFRESH:  '/auth/refresh',
    },

    // 菜單相關
    MENU: {
      LIST:     '/menu/items',
      DETAIL:   '/menu/items/:id',
      CATEGORY: '/menu/categories',
    },

    // 訂單相關
    ORDER: {
      CREATE:   '/orders',
      LIST:     '/orders',
      DETAIL:   '/orders/:id',
      UPDATE:   '/orders/:id/status',
    },

    // 員工相關
    STAFF: {
      LIST:     '/staff',
      DETAIL:   '/staff/:id',
    },

    // 分析數據（老闆後台）
    ANALYTICS: {
      DAILY:    '/analytics/daily',
      MONTHLY:  '/analytics/monthly',
      REVENUE:  '/analytics/revenue',
    },

  },
};

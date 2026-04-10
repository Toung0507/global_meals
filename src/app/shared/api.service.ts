/*
 * =====================================================
 * 檔案名稱：api.service.ts
 * 位置說明：src/app/shared/api.service.ts
 * 用途說明：集中管理所有後端 API 呼叫
 *
 * ⚠ 使用說明（串接流程）：
 *   1. 確認 app.config.ts 已有 provideHttpClient()（已完成）
 *   2. 確認 api.config.ts 的 BASE_URL 已填入後端位址
 *   3. 在目標元件中注入此 Service：
 *        constructor(private apiService: ApiService) {}
 *        或 Angular 17+ 寫法：
 *        private apiService = inject(ApiService);
 *   4. 找到元件內對應的 ⚠ TODO [API串接點] 區塊，
 *      取消其中的 API 呼叫程式碼，並移除或保留 mock 邏輯
 *
 * ⚠ Demo 期間說明：
 *   此 Service 已在後台待命，但各元件尚未注入它，
 *   所有操作仍走 mock 資料，不影響 4/13 Demo。
 *
 * ⚠ CORS 注意事項：
 *   後端 Controller 已設定 @CrossOrigin(origins = "http://localhost:4200")
 *   正式部署時需更新後端的 CORS 白名單為正式 domain。
 * =====================================================
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

/* ════════════════════════════════════════════════════
 * Request / Response 型別定義（與後端 entity/req/res 對應）
 * ════════════════════════════════════════════════════ */

/* ── Cart（購物車）────────────────────────────────── */

export interface CartSyncReq {
  cartId: number;               /* 購物車 ID（0 = 新建購物車，後端回傳新 ID） */
  globalAreaId: number;         /* 分店 ID（對應 global_area.id）*/
  productId: number;            /* 商品 ID（對應 products.id）*/
  quantity: number;             /* 數量（正數增加，負數減少）*/
  operation: number;            /* 操作員 ID（staff.id 或 member.id）*/
  operationType: 'STAFF' | 'CUSTOMER';
}

export interface CartRemoveReq {
  cartId: number;
  productId: number;
}

export interface CartCouponReq {
  cartId: number;
  memberId: number;
  useDiscount: boolean;         /* true = 套用 8 折折價券 */
}

export interface CartViewRes {
  cartId: number;
  items: CartItemVO[];
  subtotal: number;
  taxAmount: number;
  total: number;
  isDiscountApplied: boolean;
  message?: string;
}

export interface CartItemVO {
  productId: number;
  name: string;
  quantity: number;
  price: number;                /* 含稅後單價 */
  isGift: boolean;
  discountNote?: string;
}

/* ── Orders（訂單）────────────────────────────────── */

export interface CreateOrdersReq {
  cartId: number;
  globalAreaId: number;
  memberId: number;             /* 訪客傳 0 */
  phone: string;
  paymentMethod: string;        /* 'CASH' | 'CREDIT_CARD' | 'MOBILE_PAY' */
}

export interface CreateOrdersRes {
  orderId: string;              /* 訂單 id（4碼流水號）*/
  orderDateId: string;          /* 日期 YYYYMMDD（複合主鍵）*/
  message: string;
}

export interface PayReq {
  orderId: string;
  orderDateId: string;
  transactionId?: string;       /* 非現金付款時的交易序號 */
}

export interface HistoricalOrdersReq {
  memberId: number;
  phone?: string;
}

export interface RefundedReq {
  orderId: string;
  orderDateId: string;
  status: 'CANCELLED' | 'REFUNDED';
}

export interface BasicRes {
  message: string;
  success: boolean;
}

export interface GetAllOrdersRes {
  orders: GetOrdersVo[];
  message: string;
}

export interface GetOrdersVo {
  orderId: string;
  orderDateId: string;
  totalAmount: number;
  status: string;               /* UNPAID / COMPLETED / CANCELLED / REFUNDED */
  completedAt: string;
  details: GetOrdersDetailVo[];
}

export interface GetOrdersDetailVo {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  isGift: boolean;
}

/* ── GlobalArea（分店）────────────────────────────── */

export interface CreateGlobalAreaReq {
  country: string;
  branch: string;               /* 分店名稱 */
  address: string;
  phone: string;
}

export interface UpdateGlobalAreaReq {
  id: number;
  country: string;
  branch: string;
  address: string;
  phone: string;
}

export interface DeleteGlobalAreaReq {
  id: number;
}

export interface GlobalAreaRes {
  branches: GlobalAreaVO[];
  message: string;
}

export interface GlobalAreaVO {
  id: number;
  country: string;
  branch: string;
  address: string;
  phone: string;
}

/* ── Regions（稅率）────────────────────────────────── */

export interface CreateRegionsReq {
  country: string;
  currencyCode: string;         /* 三碼貨幣代碼，例如 'TWD' 'JPY' 'THB' */
  taxRate: number;              /* 小數點格式，例如 0.05 = 5% */
  taxType: 'INCLUSIVE' | 'EXCLUSIVE';
}

export interface UpdateRegionsReq {
  id: number;
  country: string;
  currencyCode: string;
  taxRate: number;
  taxType: 'INCLUSIVE' | 'EXCLUSIVE';
}

export interface RegionsRes {
  regions: RegionVO[];
  message: string;
}

export interface RegionVO {
  id: number;
  country: string;
  currencyCode: string;
  taxRate: number;              /* 小數點格式（0.05 = 5%）*/
  taxType: string;
}

/* ── ExchangeRates（匯率）──────────────────────────── */

export interface ExchangeRatesReq {
  date: string;                 /* 格式：YYYY-MM-DD */
}

export interface ExchangeRatesRes {
  rates: ExchangeRateVO[];
  message: string;
}

export interface ExchangeRateVO {
  id: number;
  currencyCode: string;
  rateToTwd: number;            /* 1 單位外幣 = rateToTwd 台幣 */
  updatedAt: string;
}


/* ════════════════════════════════════════════════════
 * ApiService
 * ════════════════════════════════════════════════════ */
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly BASE = API_CONFIG.BASE_URL;

  constructor(private http: HttpClient) {}

  /* ══════════════════════════════════════════════════
   * Cart API  →  /api/cart
   * ══════════════════════════════════════════════════ */

  /** 查看購物車（含會員折扣試算）。memberId 有值時後端會計算折扣 */
  viewCart(cartId: number, memberId?: number): Observable<CartViewRes> {
    const params = memberId ? `?memberId=${memberId}` : '';
    return this.http.get<CartViewRes>(
      `${this.BASE}${API_CONFIG.ENDPOINTS.CART.VIEW.replace(':cartId', String(cartId))}${params}`
    );
  }

  /** 新增/更新購物車商品（quantity 為負數時減少數量）*/
  syncCart(req: CartSyncReq): Observable<CartViewRes> {
    return this.http.post<CartViewRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.CART.SYNC}`, req);
  }

  /** 從購物車刪除整個品項 */
  removeCartItem(req: CartRemoveReq): Observable<CartViewRes> {
    return this.http.delete<CartViewRes>(
      `${this.BASE}${API_CONFIG.ENDPOINTS.CART.REMOVE}`,
      { body: req }
    );
  }

  /** 套用或取消折價券（8 折）*/
  applyCoupon(req: CartCouponReq): Observable<CartViewRes> {
    return this.http.post<CartViewRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.CART.COUPON}`, req);
  }

  /* ══════════════════════════════════════════════════
   * Orders API
   * ══════════════════════════════════════════════════ */

  /** 成立訂單（狀態：UNPAID，尚未結帳）*/
  createOrder(req: CreateOrdersReq): Observable<CreateOrdersRes> {
    return this.http.post<CreateOrdersRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.ORDERS.CREATE}`, req);
  }

  /** 結帳（將訂單狀態改為 COMPLETED）*/
  pay(req: PayReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.ORDERS.PAY}`, req);
  }

  /** 取得會員歷史訂單清單 */
  getAllOrders(req: HistoricalOrdersReq): Observable<GetAllOrdersRes> {
    return this.http.post<GetAllOrdersRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.ORDERS.GET_ALL}`, req);
  }

  /** 以電話號碼查詢 UNPAID 訂單（POS 取餐用）*/
  getOrderByPhone(phone: string): Observable<CreateOrdersRes> {
    return this.http.get<CreateOrdersRes>(
      `${this.BASE}${API_CONFIG.ENDPOINTS.ORDERS.BY_PHONE}?phone=${encodeURIComponent(phone)}`
    );
  }

  /** 更改訂單狀態（取消 CANCELLED 或退款 REFUNDED）*/
  updateOrderStatus(req: RefundedReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS}`, req);
  }

  /* ══════════════════════════════════════════════════
   * GlobalArea API  →  /global_area
   * ══════════════════════════════════════════════════ */

  /** 取得全部分店清單 */
  getAllBranches(): Observable<GlobalAreaRes> {
    return this.http.get<GlobalAreaRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.GLOBAL_AREA.GET_ALL}`);
  }

  /** 新增分店 */
  createBranch(req: CreateGlobalAreaReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.GLOBAL_AREA.CREATE}`, req);
  }

  /** 修改分店資料 */
  updateBranch(req: UpdateGlobalAreaReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.GLOBAL_AREA.UPDATE}`, req);
  }

  /** 刪除分店 */
  deleteBranch(req: DeleteGlobalAreaReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.GLOBAL_AREA.DELETE}`, req);
  }

  /* ══════════════════════════════════════════════════
   * Regions API  →  /lazybaobao/regions
   * ══════════════════════════════════════════════════ */

  /** 取得全部國家稅率 */
  getAllTax(): Observable<RegionsRes> {
    return this.http.get<RegionsRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.REGIONS.GET_ALL}`);
  }

  /** 新增國家稅率 */
  createRegion(req: CreateRegionsReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.REGIONS.CREATE}`, req);
  }

  /** 更新國家稅率 */
  updateRegion(req: UpdateRegionsReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.REGIONS.UPDATE}`, req);
  }

  /* ══════════════════════════════════════════════════
   * ExchangeRates API  →  /exchange_rates
   * ══════════════════════════════════════════════════ */

  /** 取得全部匯率歷史紀錄 */
  getAllRates(): Observable<ExchangeRatesRes> {
    return this.http.get<ExchangeRatesRes>(`${this.BASE}${API_CONFIG.ENDPOINTS.EXCHANGE_RATES.GET_ALL}`);
  }

  /** 取得特定日期的匯率 */
  getRatesByDate(req: ExchangeRatesReq): Observable<ExchangeRatesRes> {
    return this.http.post<ExchangeRatesRes>(
      `${this.BASE}${API_CONFIG.ENDPOINTS.EXCHANGE_RATES.GET_BY_DATE}`, req
    );
  }
}

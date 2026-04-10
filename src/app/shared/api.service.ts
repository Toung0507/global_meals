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
 *   所有操作仍走 mock 資料，不影響 Demo。
 *
 * ⚠ CORS 注意事項：
 *   後端 Controller 已設定 @CrossOrigin(origins = "http://localhost:4200")
 *   正式部署時需更新後端的 CORS 白名單為正式 domain。
 *
 * 最後更新：2026-04-10（依後端 Req/Res 欄位修正所有介面）
 * =====================================================
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

/* ════════════════════════════════════════════════════
 * Request / Response 型別定義（與後端 entity/req/res 對應）
 * ════════════════════════════════════════════════════ */

/* ── 通用 ────────────────────────────────────────── */

export interface BasicRes {
  code: number;
  message: string;
}

/* ── Cart（購物車）────────────────────────────────── */

/* POST cart/sync
 * ⚠ cartId 新建時傳 null；memberId 訪客傳 1
 * ⚠ 舊版的 operation 欄位已移除（後端不存在此欄位）
 */
export interface CartSyncReq {
  cartId: number | null;        /* 新建購物車傳 null；已有購物車傳 id */
  globalAreaId: number | null;  /* 新建時必填；已有購物車可傳 null */
  productId: number;            /* 必填，最小值 1 */
  quantity: number;             /* 必填，最小值 0（0 不合法，減少用 DELETE /cart/item） */
  operationType: 'STAFF' | 'CUSTOMER';
  memberId: number;             /* 訪客固定傳 1 */
  staffId?: number;             /* 員工操作時傳 staff.id；顧客傳 null 或不傳 */
}

/* DELETE cart/item
 * ⚠ memberId 為必填（舊版缺少此欄位）
 */
export interface CartRemoveReq {
  cartId: number;
  productId: number;
  memberId: number;  /* 訪客傳 1 */
}

/* POST cart/gift
 * 使用者從可用贈品清單選擇後呼叫
 * ⚠ giftRuleId 是 promotions_gifts.id，不是 productId
 */
export interface CartSelectGiftReq {
  cartId: number;
  memberId: number;   /* 訪客傳 1 */
  giftRuleId: number; /* promotions_gifts.id；後端用此 ID 精確定位贈品規則 */
}

/* DELETE cart/clear */
export interface CartClearReq {
  cartId: number;
  memberId: number;   /* 訪客傳 1 */
}

/* GET cart/{cartId}?memberId={memberId} 的回傳 */
export interface CartViewRes extends BasicRes {
  cartId: number;
  globalAreaId: number;
  operationType: string;
  items: CartItemVO[];
  subtotal: number;
  /* 使用者「有資格參加」的活動及可選贈品（以活動為單位的兩層結構）
   * 空陣列 = 消費未達任何門檻；有值 = 前端顯示贈品選擇 UI */
  availablePromotions: AvailablePromotionVO[];
  /* 稅務資訊（稅率、稅類型、稅額）；分店無稅務設定時為 null */
  taxInfo: TaxInfoVO | null;
  /* 最終總計（subtotal + taxAmount 或 subtotal，後端算好直接顯示） */
  totalAmount: number;
  /* 後端重新驗算時發現的警告（例如商品已下架、價格變動）；正常為空陣列 */
  warningMessages: string[];
}

/* CartViewRes.items[] 的單一商品 */
export interface CartItemVO {
  detailId: number;             /* order_cart_details.id */
  productId: number;
  productName: string;          /* ⚠ 欄位名是 productName，不是 name */
  quantity: number;
  price: number;                /* 加入購物車時的價格快照 */
  isGift: boolean;
  discountNote?: string;        /* 滿額贈說明（例如「滿300贈薯條」） */
  lineTotal: number;            /* 後端已算好的小計（price × quantity） */
}

/* CartViewRes.availablePromotions[] */
export interface AvailablePromotionVO {
  promotionId: number;
  promotionName: string;
  gifts: AvailableGiftVO[];
}

export interface AvailableGiftVO {
  giftRuleId: number;          /* promotions_gifts.id，選贈品時傳回後端 */
  giftProductId: number;
  giftProductName: string;
  fullAmount: number;
  available: boolean;
  unavailableReason?: string;  /* 無庫存等原因 */
}

/* CartViewRes.taxInfo */
export interface TaxInfoVO {
  taxRate: number;             /* 小數格式，例如 0.0500 = 5% */
  taxType: 'INCLUSIVE' | 'EXCLUSIVE';
  taxAmount: number;
}

/* ── Orders（訂單）────────────────────────────────── */

/* POST Orders/createOrdersRes
 * ⚠ orderCartId 是 String 型別（後端用 @NotBlank 驗證）
 * ⚠ paymentMethod 不在此請求，在 PayReq 階段才傳
 * ⚠ orderCartDetailsList 中的商品列表為必填
 */
export interface CreateOrdersReq {
  orderCartId: string;              /* ⚠ String，不是 number（需 String(cartId)） */
  globalAreaId: number;
  memberId: number;                 /* 訪客傳 1 */
  phone: string;
  subtotalBeforeTax: number;
  taxAmount: number;
  totalAmount: number;
  orderCartDetailsList: OrderCartDetailItem[];  /* 必填，不能為空陣列 */
}

export interface OrderCartDetailItem {
  productId: number;
  quantity: number;
  isGift: boolean;
}

/* POST Orders/createOrdersRes 的回傳 */
export interface CreateOrdersRes extends BasicRes {
  id: string;           /* ⚠ 欄位名是 id（不是 orderId）；4 碼流水號 */
  orderDateId: string;  /* YYYYMMDD，與 id 組成複合主鍵 */
  totalAmount: number;
}

/* POST Orders/pay
 * ⚠ id 取自 CreateOrdersRes.id
 * ⚠ paymentMethod 必填（@NotBlank）
 * ⚠ transactionId 必填（現金可傳 "CASH_PAYMENT"）
 */
export interface PayReq {
  id: string;             /* ⚠ 欄位名是 id（不是 orderId） */
  orderDateId: string;
  paymentMethod: string;  /* ⚠ 必填！例：'CASH' | 'CREDIT_CARD' | 'MOBILE_PAY' */
  transactionId: string;  /* ⚠ 必填！現金付款可傳 "CASH_PAYMENT" */
}

/* POST Orders/GetAllOrdersList 的請求 */
export interface HistoricalOrdersReq {
  memberId: number;
}

/* POST Orders/ordersStatus 的請求 */
export interface RefundedReq {
  id: string;             /* ⚠ 欄位名是 id（不是 orderId） */
  orderDateId: string;
  status: 'CANCELLED' | 'REFUNDED';
}

/* POST Orders/GetAllOrdersList 的回傳 */
export interface GetAllOrdersRes extends BasicRes {
  getOrderVoList: GetOrdersVo[];  /* ⚠ 欄位名是 getOrderVoList（不是 orders） */
}

export interface GetOrdersVo {
  id: string;             /* ⚠ 欄位名是 id（不是 orderId） */
  orderDateId: string;
  globalAreaId: number;
  totalAmount: number;
  status: string;         /* UNPAID / COMPLETED / CANCELLED / REFUNDED */
  completedAt: string;    /* ISO 日期時間字串 */
  getOrdersDetailVoList: GetOrdersDetailVo[];  /* ⚠ 欄位名注意大小寫 */
}

export interface GetOrdersDetailVo {
  productId: number;
  productName: string;  /* ⚠ 欄位名是 productName（不是 name） */
  quantity: number;
  price: number;
  isGift: boolean;
}

/* ── GlobalArea（分店）────────────────────────────── */

export interface CreateGlobalAreaReq {
  country: string;
  branch: string;
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
  id: number;   /* 支援批次時後端可能接受 id 陣列，需確認後端 Req */
}

export interface GlobalAreaRes extends BasicRes {
  globalAreaList: GlobalAreaVO[];  /* ⚠ 欄位名是 globalAreaList（不是 branches） */
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
  currencyCode: string;  /* 三碼貨幣代碼，例如 'TWD' 'JPY' */
  taxRate: number;       /* 小數格式，例如 0.05 = 5% */
  taxType: 'INCLUSIVE' | 'EXCLUSIVE';
}

export interface UpdateRegionsReq {
  id: number;
  country: string;
  currencyCode: string;
  taxRate: number;
  taxType: 'INCLUSIVE' | 'EXCLUSIVE';
}

export interface RegionsRes extends BasicRes {
  regionsList: RegionVO[];  /* ⚠ 欄位名是 regionsList（不是 regions） */
}

export interface RegionVO {
  id: number;
  country: string;
  currencyCode: string;
  taxRate: number;  /* 小數格式（0.05 = 5%），顯示時需 × 100 */
  taxType: string;
}

/* ── ExchangeRates（匯率）──────────────────────────── */

export interface ExchangeRatesReq {
  date: string;  /* 格式：YYYY-MM-DD */
}

export interface ExchangeRatesRes extends BasicRes {
  rates: ExchangeRateVO[];
}

export interface ExchangeRateVO {
  id: number;
  currencyCode: string;
  rateToTwd: number;  /* 1 單位外幣 = rateToTwd 台幣 */
  updatedAt: string;
}

/* ── Promotions（促銷活動）────────────────────────── */

/* POST /promotions/calculate 的請求
 * ⚠ memberId = 1 表示訪客（無折扣資格）
 * ⚠ selectedGiftId = 0 表示放棄選贈品
 * ⚠ originalAmount 需由前端計算好後傳入
 */
export interface PromotionsReq {
  cartId: number;
  memberId: number;         /* 1 = 訪客；>1 = 會員 */
  useCoupon: boolean;       /* 使用者是否勾選使用 8 折券 */
  selectedGiftId: number;   /* promotions_gifts.id；放棄傳 0 */
  originalAmount: number;   /* 購物車原始總金額（必填） */
}

/* POST /promotions/calculate 的回傳 */
export interface PromotionsRes {
  cartId: number;
  appliedPromotionIds: number[];
  appliedDiscountName: string;  /* 有折扣時為 "會員 8 折優惠"；無折扣為 "" */
  originalAmount: number;
  finalAmount: number;          /* int，已無條件進位 */
  receivedGifts: GiftItem[];
}

export interface GiftItem {
  promotionsGiftsId: number;
  productId: number;
  productName: string;
  quantity: number;  /* -1 = 無限供應 */
}

/* POST /promotions/create 和 /promotions/toggle 的請求
 * 新增活動時：name, startTime, endTime 必填
 * 新增贈品時：promotionsId, fullAmount, giftProductId 必填；quantity 預設 -1
 * toggle 時：promotionsId, active 必填
 */
export interface PromotionsManageReq {
  name: string;
  startTime: string;       /* 格式 YYYY-MM-DD */
  endTime: string;
  promotionsId?: number;
  fullAmount?: number;
  quantity?: number;       /* -1 = 無限供應 */
  giftProductId?: number;
  active?: boolean;        /* true 開啟 / false 關閉 */
}

/* GET /promotions/list 的回傳（管理端）*/
export interface PromotionsListRes {
  code: number;
  message: string;
  data: PromotionDetailVo[];
}

export interface PromotionDetailVo {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
  gifts: GiftDetailVo[];
}

export interface GiftDetailVo {
  id: number;
  fullAmount: number;
  quantity: number;    /* -1 = 無限供應；0 = 已送完 */
  giftProductId: number;
  productName: string;
  active: boolean;
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
   * Cart API  →  cart/（無 /api/ 前綴）
   * ══════════════════════════════════════════════════ */

  /** 查看購物車（含稅務、可用贈品清單、警告訊息）
   * @param cartId 購物車 ID
   * @param memberId 訪客傳 1；有值時後端計算折扣資格
   */
  viewCart(cartId: number, memberId: number = 1): Observable<CartViewRes> {
    const path = API_CONFIG.ENDPOINTS.CART.VIEW.replace(':cartId', String(cartId));
    return this.http.get<CartViewRes>(`${this.BASE}/${path}?memberId=${memberId}`);
  }

  /** 新增/更新購物車商品（quantity=0 不合法，減少數量請用 removeCartItem） */
  syncCart(req: CartSyncReq): Observable<CartViewRes> {
    return this.http.post<CartViewRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.CART.SYNC}`, req);
  }

  /** 從購物車刪除整個品項 */
  removeCartItem(req: CartRemoveReq): Observable<CartViewRes> {
    return this.http.delete<CartViewRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.CART.REMOVE}`,
      { body: req }
    );
  }

  /** 使用者確認選擇贈品（giftRuleId = promotions_gifts.id）*/
  selectGift(req: CartSelectGiftReq): Observable<CartViewRes> {
    return this.http.post<CartViewRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.CART.GIFT}`, req);
  }

  /** 清空購物車所有商品 */
  clearCart(req: CartClearReq): Observable<CartViewRes> {
    return this.http.delete<CartViewRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.CART.CLEAR}`,
      { body: req }
    );
  }

  /* ══════════════════════════════════════════════════
   * Orders API  →  Orders/（大寫 O，無前綴）
   * ══════════════════════════════════════════════════ */

  /** 成立訂單（狀態：UNPAID，尚未結帳）
   * 回傳 id 和 orderDateId，下一步 pay() 需要這兩個值
   */
  createOrder(req: CreateOrdersReq): Observable<CreateOrdersRes> {
    return this.http.post<CreateOrdersRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.CREATE}`, req);
  }

  /** 結帳（將訂單狀態改為 COMPLETED）
   * ⚠ paymentMethod 和 transactionId 皆為必填
   */
  pay(req: PayReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.PAY}`, req);
  }

  /** 取得會員歷史訂單清單 */
  getAllOrders(req: HistoricalOrdersReq): Observable<GetAllOrdersRes> {
    return this.http.post<GetAllOrdersRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.GET_ALL}`, req);
  }

  /** 以電話號碼查詢 UNPAID 訂單（POS 取餐用）*/
  getOrderByPhone(phone: string): Observable<CreateOrdersRes> {
    return this.http.get<CreateOrdersRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.BY_PHONE}?phone=${encodeURIComponent(phone)}`
    );
  }

  /** 更改訂單狀態（取消 CANCELLED 或退款 REFUNDED）*/
  updateOrderStatus(req: RefundedReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS}`, req);
  }

  /* ══════════════════════════════════════════════════
   * Promotions API  →  /promotions/（管理端）
   *                    Promotions/（顧客端，大寫 P）
   * ══════════════════════════════════════════════════ */

  /** 結帳時計算促銷結果（折扣 + 贈品）
   * selectedGiftId = 0 表示使用者放棄選贈品
   */
  calculatePromotion(req: PromotionsReq): Observable<PromotionsRes> {
    return this.http.post<PromotionsRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.CALCULATE}`, req
    );
  }

  /** 傳入消費金額，取得達標的可選贈品清單
   * ⚠ 後端用 @RequestParam，需拼接 Query String
   */
  getAvailableGifts(amount: number): Observable<GiftItem[]> {
    return this.http.post<GiftItem[]>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.AVAILABLE_GIFTS}?amount=${amount}`,
      null
    );
  }

  /** 取得全部活動及贈品清單（管理端列表頁）*/
  getPromotionsList(): Observable<PromotionsListRes> {
    return this.http.get<PromotionsListRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.LIST}`);
  }

  /** 建立促銷活動（可附帶建立一筆贈品規則）*/
  createPromotion(req: PromotionsManageReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.CREATE}`, req);
  }

  /** 啟用或停用促銷活動（active=false 時連帶停用底下所有贈品）*/
  togglePromotion(req: PromotionsManageReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.TOGGLE}`, req);
  }

  /* ══════════════════════════════════════════════════
   * GlobalArea API  →  global_area/
   * ══════════════════════════════════════════════════ */

  /** 取得全部分店清單 */
  getAllBranches(): Observable<GlobalAreaRes> {
    return this.http.get<GlobalAreaRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.GLOBAL_AREA.GET_ALL}`);
  }

  /** 新增分店 */
  createBranch(req: CreateGlobalAreaReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.GLOBAL_AREA.CREATE}`, req);
  }

  /** 修改分店資料 */
  updateBranch(req: UpdateGlobalAreaReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.GLOBAL_AREA.UPDATE}`, req);
  }

  /** 刪除分店 */
  deleteBranch(req: DeleteGlobalAreaReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.GLOBAL_AREA.DELETE}`, req);
  }

  /* ══════════════════════════════════════════════════
   * Regions API  →  /lazybaobao/regions/
   * ══════════════════════════════════════════════════ */

  /** 取得全部國家稅率 */
  getAllTax(): Observable<RegionsRes> {
    return this.http.get<RegionsRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.REGIONS.GET_ALL}`);
  }

  /** 新增國家稅率 */
  createRegion(req: CreateRegionsReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.REGIONS.CREATE}`, req);
  }

  /** 更新國家稅率 */
  updateRegion(req: UpdateRegionsReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.REGIONS.UPDATE}`, req);
  }

  /* ══════════════════════════════════════════════════
   * ExchangeRates API  →  exchange_rates/
   * ══════════════════════════════════════════════════ */

  /** 取得全部匯率歷史紀錄（由排程自動更新，前端唯讀）*/
  getAllRates(): Observable<ExchangeRatesRes> {
    return this.http.get<ExchangeRatesRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.EXCHANGE_RATES.GET_ALL}`);
  }

  /** 取得特定日期的匯率 */
  getRatesByDate(req: ExchangeRatesReq): Observable<ExchangeRatesRes> {
    return this.http.post<ExchangeRatesRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.EXCHANGE_RATES.GET_BY_DATE}`, req
    );
  }

  /* ══════════════════════════════════════════════════
   * ⚠ TODO [API串接點] — 以下 API 等後端建立 Controller 後再啟用
   * ══════════════════════════════════════════════════ */

  /*
   * ⚠ TODO [API串接點 - Members 會員登入]
   * 後端待建立 MembersController，建立後取消以下方法的註解。
   *
   * memberLogin(phone: string, password: string): Observable<{ code: number; message: string; memberId: number; name: string }> {
   *   return this.http.post<any>(`${this.BASE}/${API_CONFIG.ENDPOINTS.MEMBERS.LOGIN}`, { phone, password });
   * }
   *
   * memberRegister(req: { name: string; phone: string; password: string }): Observable<BasicRes> {
   *   return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.MEMBERS.REGISTER}`, req);
   * }
   *
   * getMemberProfile(memberId: number): Observable<any> {
   *   return this.http.get<any>(`${this.BASE}/${API_CONFIG.ENDPOINTS.MEMBERS.PROFILE}?memberId=${memberId}`);
   * }
   */

  /*
   * ⚠ TODO [API串接點 - Staff 員工登入]
   * 後端待建立 StaffController，建立後取消以下方法的註解。
   *
   * staffLogin(account: string, password: string): Observable<{ code: number; message: string; staffId: number; role: string; name: string }> {
   *   return this.http.post<any>(`${this.BASE}/${API_CONFIG.ENDPOINTS.STAFF.LOGIN}`, { account, password });
   * }
   *
   * getAllStaff(): Observable<any> {
   *   return this.http.get<any>(`${this.BASE}/${API_CONFIG.ENDPOINTS.STAFF.GET_ALL}`);
   * }
   *
   * toggleStaff(req: { id: number; isStatus: boolean }): Observable<BasicRes> {
   *   return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.STAFF.TOGGLE}`, req);
   * }
   */

  /*
   * ⚠ TODO [API串接點 - Products 商品管理]
   * 後端待建立 ProductsController，建立後取消以下方法的註解。
   * 注意：products 表無 price 欄位，價格在 branch_inventory.base_price。
   *
   * getActiveProducts(globalAreaId: number): Observable<any> {
   *   return this.http.get<any>(`${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.GET_ACTIVE}?areaId=${globalAreaId}`);
   * }
   *
   * getAllProducts(): Observable<any> {
   *   return this.http.get<any>(`${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.GET_ALL}`);
   * }
   *
   * getProductImage(productId: number): Observable<Blob> {
   *   const path = API_CONFIG.ENDPOINTS.PRODUCTS.IMAGE.replace(':id', String(productId));
   *   return this.http.get(`${this.BASE}/${path}`, { responseType: 'blob' });
   * }
   *
   * createProduct(req: any): Observable<BasicRes> {
   *   return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.CREATE}`, req);
   * }
   *
   * updateProduct(req: any): Observable<BasicRes> {
   *   return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE}`, req);
   * }
   *
   * toggleProduct(req: { id: number; active: boolean }): Observable<BasicRes> {
   *   return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.TOGGLE}`, req);
   * }
   */

  /*
   * ⚠ TODO [API串接點 - BranchInventory 分店庫存]
   * 後端待建立 BranchInventoryController，建立後取消以下方法的註解。
   *
   * getBranchInventory(areaId: number): Observable<any> {
   *   const path = API_CONFIG.ENDPOINTS.BRANCH_INVENTORY.GET_BY_AREA.replace(':areaId', String(areaId));
   *   return this.http.get<any>(`${this.BASE}/${path}`);
   * }
   *
   * updateBranchInventory(req: any): Observable<BasicRes> {
   *   return this.http.post<BasicRes>(`${this.BASE}/${API_CONFIG.ENDPOINTS.BRANCH_INVENTORY.UPDATE}`, req);
   * }
   */
}

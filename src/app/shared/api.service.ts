/*
 * =====================================================
 * 檔案名稱：api.service.ts
 * 位置說明：src/app/shared/api.service.ts
 * 用途說明：集中管理所有後端 API 呼叫
 * 最後更新：2026-04-24（依後端 Controller 實際路由全面修正）
 * =====================================================
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
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

export interface CartSyncReq {
  cartId: number | null;
  globalAreaId: number | null;
  productId: number;
  quantity: number;
  operationType: 'STAFF' | 'CUSTOMER';
  memberId: number;
  staffId?: number;
}

export interface CartRemoveReq {
  cartId: number;
  productId: number;
  memberId: number;
}

export interface CartSelectGiftReq {
  cartId: number;
  memberId: number;
  giftRuleId: number;
}

export interface CartClearReq {
  cartId: number;
  memberId: number;
}

export interface CartSwitchBranchReq {
  oldCartId: number;
  newGlobalAreaId: number;
  memberId: number;
}

export interface CartViewRes extends BasicRes {
  cartId: number;
  globalAreaId: number;
  operationType: string;
  items: CartItemVO[];
  subtotal: number;
  availablePromotions: AvailablePromotionVO[];
  taxInfo: TaxInfoVO | null;
  totalAmount: number;
  warningMessages: string[];
}

export interface CartItemVO {
  detailId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  isGift: boolean;
  discountNote?: string;
  lineTotal: number;
}

export interface AvailablePromotionVO {
  promotionId: number;
  promotionName: string;
  gifts: AvailableGiftVO[];
}

export interface AvailableGiftVO {
  giftRuleId: number;
  giftProductId: number;
  giftProductName: string;
  fullAmount: number;
  available: boolean;
  unavailableReason?: string;
}

export interface TaxInfoVO {
  taxRate: number;
  taxType: 'INCLUSIVE' | 'EXCLUSIVE';
  taxAmount: number;
}

/* ── Kitchen（廚房狀態）──────────────────────────── */

export interface UpdateKitchenStatusReq {
  id: string;
  orderDateId: string;
  kitchenStatus: 'COOKING' | 'READY';
}

export interface TodayOrderDetailVo {
  productName: string;
  quantity: number;
  gift: boolean;
}

export interface TodayOrderVo {
  id: string;
  orderDateId: string;
  totalAmount: number;
  kitchenStatus: string;
  paymentStatus: string;
  phone: string;
  items: TodayOrderDetailVo[];
}

// export interface GetTodayOrdersRes extends BasicRes {
//   orders: TodayOrderVo[];
// }

export interface GetTodayOrdersRes extends BasicRes {
  getOrderVoList: GetOrdersVo[];
}

/* ── Orders（訂單）────────────────────────────────── */

export interface CreateOrdersReq {
  orderCartId: string;
  globalAreaId: number;
  memberId: number;
  phone: string;
  subtotalBeforeTax: number;
  taxAmount: number;
  totalAmount: number;
  orderCartDetailsList: OrderCartDetailItem[];
  useDiscount?: boolean;
  promotionsId?: number;
  paymentMethod?: string; /* 'CASH' → 後端建立 PENDING_CASH 訂單 */
}

export interface OrderCartDetailItem {
  productId: number;
  quantity: number;
  isGift: boolean;
}

export interface CreateOrdersRes extends BasicRes {
  id: string;
  orderDateId: string;
  totalAmount: number;
  status?: string;
}

export interface PayReq {
  id: string;
  orderDateId: string;
  paymentMethod: string;
  transactionId: string;
  totalAmount: number;
}

export interface HistoricalOrdersReq {
  memberId: number;
}

export interface RefundedReq {
  id: string;
  orderDateId: string;
  status: 'CANCELLED' | 'REFUNDED' | 'AWAITING_PAYMENT';
}

export interface GetAllOrdersRes extends BasicRes {
  getOrderVoList: GetOrdersVo[];
}

export interface GetOrdersVo {
  id: string;
  orderDateId: string;
  globalAreaId: number;
  totalAmount: number;
  status: string;
  completedAt: string | null;
  kitchenStatus?: string | null;
  paymentMethod?: string; /* 後端可能用此欄位名 */
  payMethod?: string; /* 後端可能用此欄位名 */
  paymentStatus?: string; /* 舊版 TodayOrderVo 欄位名 */
  /* 後端實際回傳的欄位名（首字母大寫） */
  GetOrdersDetailVoList?: GetOrdersDetailVo[] | null;
  /* 小寫版本，部分端點可能用 */
  getOrdersDetailVoList?: GetOrdersDetailVo[] | null;
}

export interface GetOrdersDetailVo {
  productId?: number;
  name?: string;
  productName?: string;
  quantity: number;
  price?: number | null;
  isGift?: boolean; /* 舊版欄位名 */
  gift?: boolean; /* 後端實際回傳欄位名 */
  discountNote?: string | null;
}

/* ── Members（會員）──────────────────────────────── */

export interface RegisterMembersReq {
  name: string;
  phone: string;
  country: string;
  password?: string;
}

export interface LoginMembersReq {
  phone: string;
  password: string;
}

export interface MembersInfo {
  id: number;
  name: string;
  phone: string;
  country?: string;
  orderCount?: number;
  discount?: boolean;
  createdAt?: string;
}

export interface MembersRes extends BasicRes {
  members?: MembersInfo;
  memberId?: number;
  name?: string;
  phone?: string;
  orderCount?: number;
  isDiscount?: boolean;
}

export interface UpdatePasswordReq {
  id: number;
  oldPassword: string;
  newPassword: string;
}

/** POS 依電話查詢會員的回傳格式（對應後端 MembersRes + Members entity） */
export interface MemberLookupRes extends BasicRes {
  members?: {
    id: number;
    name: string;
    phone: string;
    orderCount: number;
    discount: boolean;
  };
}

/* ── Staff（員工）──────────────────────────────────── */

export interface LoginStaffReq {
  account: string;
  password: string;
}

export interface StaffVO {
  id: number;
  name: string;
  account: string;
  role: string;
  globalAreaId: number;
  status: boolean;
  hireAt: string;
}

export interface StaffSearchRes extends BasicRes {
  staffList?: StaffVO[];
}

export interface RegisterStaffReq {
  name: string;
  account: string;
  password: string;
  role: string;
  globalAreaId: number;
}

export interface UpdateStaffStatusReq {
  newStatus: boolean;
}

export interface AdminChangePasswordReq {
  newPassword: string;
}

export interface SelfChangePasswordReq {
  account: string;
  oldPassword: string;
  newPassword: string;
}

/* ── GlobalArea（分店）────────────────────────────── */

export interface CreateGlobalAreaReq {
  regionsId: number;
  branch: string;
  address: string;
  phone: string;
}

export interface UpdateGlobalAreaReq {
  id: number;
  regionsId: number;
  branch: string;
  address: string;
  phone: string;
}

export interface DeleteGlobalAreaReq {
  globalAreaIdList: number[];
}

export interface GlobalAreaRes extends BasicRes {
  globalAreaList: GlobalAreaVO[];
}

export interface GlobalAreaVO {
  id: number;
  regionsId: number;
  country: string;
  branch: string;
  address: string;
  phone: string;
}

/* ── Regions（稅率）────────────────────────────────── */

export interface UpsertRegionsTaxReq {
  country: string;
  currencyCode: string;
  countryCode: string;
  taxRate: number;
  taxType: 'INCLUSIVE' | 'EXCLUSIVE';
}

export interface UpdateRegionsUsageCapReq extends UpsertRegionsTaxReq {
  id: number;
  usageCap: number;
}

export interface RegionsRes extends BasicRes {
  regionsList: RegionVO[];
}

export interface RegionVO {
  id: number;
  country: string;
  countryCode: string;
  currencyCode: string;
  taxRate: number;
  taxType: string;
  usageCap: number;
}

/* ── Reports（月報表）────────────────────────────── */

export interface MonthlyProductsSalesVo {
  productName: string;
  totalQuantity: number;
}

export interface MonthlyProductsSalesRes extends BasicRes {
  salesList: MonthlyProductsSalesVo[];
}

export interface MonthlyReportReq {
  reportDate: string;
}

export interface MonthRangeReportsReq {
  startMonth: string;
  endMonth: string;
}

export interface RevenueQueryReq {
  startDate: string;
  endDate: string;
  branchId?: number;
  regionsId?: number;
}

export interface MonthlyReportDetail {
  reportDate: string;
  branchName: string;
  regionsName: string;
  totalAmount: number;
}

export interface MonthlyReportRes extends BasicRes {
  currentData: MonthlyReportDetail[];
  lastData: MonthlyReportDetail[];
}

export interface MonthRangeReportsRes extends BasicRes {
  currentMonth: MonthlyReportDetail[];
}

export interface RevenueData {
  branchName: string;
  regionsName: string;
  totalAmount: number;
}

export interface RevenueQueryRes extends BasicRes {
  revenueData: RevenueData[];
}

/* ── ExchangeRates（匯率）──────────────────────────── */

export interface ExchangeRatesReq {
  date: string;
}

export interface ExchangeRatesRes extends BasicRes {
  exchangeRatesList: ExchangeRateVO[];
}

export interface ExchangeRateVO {
  id: number;
  currencyCode: string;
  rateToTwd: number;
  updatedAt: string;
}

/* ── AI（AiController）─────────────────────────────── */
export interface AiRes extends BasicRes {
  generatedDescription?: string;
}

/* ── Products（商品）─────────────────────────────────
 * MenuVo: 前台菜單（/inventory/menu/{globalAreaId}）
 * ProductAdminVo: 管理端商品（/product/list）
 * ─────────────────────────────────────────────────── */

/** 前台菜單商品（來自 BranchInventoryController /inventory/menu/{id}） */
export interface MenuVo {
  productId: number; /* 商品 ID（注意：不是 id，是 productId） */
  name: string;
  category: string;
  description: string;
  foodImgBase64: string;
  basePrice: number;
  stockQuantity: number;
}

/** 前台菜單回傳（BaseListRes<MenuVo>） */
export interface MenuListRes extends BasicRes {
  data: MenuVo[];
}

/** 管理端商品 VO（ProductsController /product/list） */
export interface ProductAdminVo {
  id: number;
  name: string;
  category: string;
  description: string;
  active: boolean;
  foodImgBase64: string;
}

/** 管理端商品回傳（AdminProductRes） */
export interface AdminProductRes extends BasicRes {
  product?: ProductAdminVo;
  productList?: ProductAdminVo[];
  inventoryList?: InventoryDetailVo[];
}

/** 建立商品請求（對應後端 ProductCreateReq） */
export interface CreateProductReq {
  name: string;
  category: string;
  description?: string;
  active?: boolean;
}

/** 修改商品請求（對應後端 ProductUpdateReq extends ProductCreateReq） */
export interface UpdateProductReq {
  id: number;
  name: string;
  category: string;
  description?: string;
  active?: boolean;
}

/* ── BranchInventory（分店庫存）─────────────────────
 * InventoryDetailVo: 後端 vo/InventoryDetailVo.java
 * BranchInventoryRes: 後端 BaseListRes<InventoryDetailVo>
 * ─────────────────────────────────────────────────── */

export interface InventoryDetailVo {
  productId: number; /* 商品 ID */
  productName: string;
  globalAreaId: number;
  branchName: string;
  basePrice: number;
  stockQuantity: number;
  maxOrderQuantity: number;
}

export interface BranchInventoryRes extends BasicRes {
  data: InventoryDetailVo[]; /* 後端 BaseListRes.data */
}

export interface UpdateBranchInventoryReq {
  productId: number;
  globalAreaId: number;
  stockQuantity: number;
  basePrice: number;
  maxOrderQuantity: number;
}

/* ── Payment（支付）──────────────────────────────── */

export interface PaymentInitReq {
  orderDateId: string;
  id: string;
}

export interface LinePayRes extends BasicRes {
  paymentUrl: string;
}

/* ── Promotions（促銷活動）────────────────────────── */

export interface PromotionsReq {
  cartId: number;
  memberId: number;
  useCoupon: boolean;
  selectedGiftId: number;
  originalAmount: number;
}

export interface PromotionsRes {
  cartId: number;
  appliedPromotionIds: number[];
  appliedDiscountName: string;
  originalAmount: number;
  finalAmount: number;
  receivedGifts: GiftItem[];
}

export interface GiftItem {
  promotionsGiftsId: number;
  productId: number;
  productName: string;
  quantity: number;
}

export interface PromotionsManageReq {
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  promotionsId?: number;
  fullAmount?: number;
  quantity?: number;
  giftProductId?: number;
  active?: boolean;
}

export interface PromotionsListRes {
  code: number;
  message: string;
  data: PromotionDetailVo[];
}

export interface PromotionDetailVo {
  id: number;
  name: string;
  nameJP?: string;
  nameKR?: string;
  globalAreaId?: number;
  startTime: string;
  endTime: string;
  active: boolean;
  gifts: GiftDetailVo[];
  description?: string;
  promotionImg?: string;
}

export interface UpdatePromotionInfoReq {
  promotionsId: number;
  description?: string;
  promotionImg?: string;
}

export interface CreatePromotionRes extends BasicRes {
  id?: number;
}

export interface GiftDetailVo {
  id: number;
  fullAmount: number;
  quantity: number;
  giftProductId: number;
  productName: string;
  active: boolean;
}

/* ════════════════════════════════════════════════════
 * ApiService
 * ════════════════════════════════════════════════════ */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly BASE = API_CONFIG.BASE_URL;

  constructor(private http: HttpClient) {}

  private get isMock(): boolean {
    return API_CONFIG.MOCK_MODE;
  }

  private mockCartRes(cartId = 9999): CartViewRes {
    return {
      code: 200,
      message: 'ok',
      cartId,
      globalAreaId: 4,
      operationType: 'CUSTOMER',
      items: [],
      subtotal: 0,
      availablePromotions: [],
      taxInfo: null,
      totalAmount: 0,
      warningMessages: [],
    };
  }

  /* ══════════════════════════════════════════════════
   * Cart API  →  /cart/
   * ══════════════════════════════════════════════════ */

  viewCart(cartId: number, memberId: number = 1): Observable<CartViewRes> {
    const path = API_CONFIG.ENDPOINTS.CART.VIEW.replace(
      ':cartId',
      String(cartId),
    );
    return this.http.get<CartViewRes>(
      `${this.BASE}/${path}?memberId=${memberId}`,
    );
  }

  syncCart(req: CartSyncReq): Observable<CartViewRes> {
    if (this.isMock) return of(this.mockCartRes(req.cartId ?? 9999));
    return this.http.post<CartViewRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.CART.SYNC}`,
      req,
    );
  }

  removeCartItem(req: CartRemoveReq): Observable<CartViewRes> {
    if (this.isMock) return of(this.mockCartRes(req.cartId));
    return this.http.delete<CartViewRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.CART.REMOVE}`,
      { body: req },
    );
  }

  selectGift(req: CartSelectGiftReq): Observable<CartViewRes> {
    return this.http.post<CartViewRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.CART.GIFT}`,
      req,
    );
  }

  clearCart(req: CartClearReq): Observable<CartViewRes> {
    if (this.isMock) return of(this.mockCartRes(req.cartId));
    return this.http.delete<CartViewRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.CART.CLEAR}`,
      { body: req },
    );
  }

  switchBranch(req: CartSwitchBranchReq): Observable<CartViewRes> {
    return this.http.post<CartViewRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.CART.SWITCH_BRANCH}`,
      req,
      { withCredentials: true },
    );
  }

  /* ══════════════════════════════════════════════════
   * Orders API  →  /orders/
   * ══════════════════════════════════════════════════ */

  createOrder(req: CreateOrdersReq): Observable<CreateOrdersRes> {
    if (this.isMock) {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateId = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
      return of({
        code: 200,
        message: 'ok',
        id: 'DEMO',
        orderDateId: dateId,
        totalAmount: req.totalAmount,
      });
    }
    return this.http.post<CreateOrdersRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.CREATE}`,
      req,
      { withCredentials: true },
    );
  }

  pay(req: PayReq): Observable<BasicRes> {
    if (this.isMock) return of({ code: 200, message: 'ok' });
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.PAY}`,
      req,
      { withCredentials: true },
    );
  }

  getAllOrders(req: HistoricalOrdersReq): Observable<GetAllOrdersRes> {
    return this.http.post<GetAllOrdersRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.GET_ALL}`,
      req,
      { withCredentials: true },
    );
  }

  getOrderByPhone(phone: string): Observable<CreateOrdersRes> {
    return this.http.get<CreateOrdersRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.BY_PHONE}?phone=${encodeURIComponent(phone)}`,
    );
  }

  /** POS 依電話查詢正式會員（排除訪客），需員工 session（GET /members/get_by_phone） */
  getMemberByPhone(phone: string): Observable<MemberLookupRes> {
    return this.http.get<MemberLookupRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.MEMBERS.GET_BY_PHONE}?phone=${encodeURIComponent(phone)}`,
      { withCredentials: true },
    );
  }

  updateOrderStatus(req: RefundedReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS}`,
      req,
      { withCredentials: true },
    );
  }

  /** 後端無此端點，回傳空結果供元件靜默處理 */
  // getTodayOrders(): Observable<GetTodayOrdersRes> {
  //   return of({ code: 404, message: 'not implemented', orders: [] });
  // }
  /**真實呼叫 */
  getTodayOrders(globalAreaId: number): Observable<GetTodayOrdersRes> {
    return this.http.get<GetTodayOrdersRes>(
      `${this.BASE}/lazybaobao/orders/today?globalAreaId=${globalAreaId}`,
      { withCredentials: true },
    );
  }

  /** POS 廚房狀態更新 (COOKING / READY) */
  updateKitchenStatus(req: UpdateKitchenStatusReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.KITCHEN_STATUS}`,
      { id: req.id, orderDateId: req.orderDateId, status: req.kitchenStatus },
      { withCredentials: true },
    );
  }

  /** 顧客端輪詢單筆訂單狀態 */
  getOrderStatus(id: string, orderDateId: string): Observable<BasicRes> {
    return this.http.get<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.GET_STATUS}?id=${encodeURIComponent(id)}&orderDateId=${encodeURIComponent(orderDateId)}`,
      { withCredentials: true },
    );
  }

  /** POS 現金收款確認（READY → COMPLETED） */
  confirmCashPayment(id: string, orderDateId: string): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.ORDERS.CASH_CONFIRM}?id=${encodeURIComponent(id)}&orderDateId=${encodeURIComponent(orderDateId)}`,
      {},
      { withCredentials: true },
    );
  }

  /* ══════════════════════════════════════════════════
   * Promotions API  →  /promotions/
   * ══════════════════════════════════════════════════ */

  calculatePromotion(req: PromotionsReq): Observable<PromotionsRes> {
    return this.http.post<PromotionsRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.CALCULATE}`,
      req,
    );
  }

  /** POST /promotions/getAvailableGifts，body 為金額數字 */
  getAvailableGifts(amount: number): Observable<GiftItem[]> {
    return this.http.post<GiftItem[]>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.AVAILABLE_GIFTS}`,
      amount,
    );
  }

  getPromotionsList(globalAreaId?: number): Observable<PromotionsListRes> {
    const url = globalAreaId
      ? `${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.LIST}?globalAreaId=${globalAreaId}`
      : `${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.LIST}`;
    return this.http.get<PromotionsListRes>(url);
  }

  createPromotion(req: PromotionsManageReq): Observable<CreatePromotionRes> {
    return this.http.post<CreatePromotionRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.CREATE}`,
      req,
    );
  }

  togglePromotion(req: PromotionsManageReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.TOGGLE}`,
      req,
    );
  }

  /** POST /promotions/addPromotionGift */
  addGift(req: PromotionsManageReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PROMOTIONS.ADD_GIFT}`,
      req,
    );
  }

  /** DELETE /promotions/deletePromotion/{id} */
  deletePromotion(id: number): Observable<BasicRes> {
    const path = API_CONFIG.ENDPOINTS.PROMOTIONS.DELETE.replace(
      ':id',
      String(id),
    );
    return this.http.delete<BasicRes>(`${this.BASE}/${path}`, {
      withCredentials: true,
    });
  }

  /** GET /promotions/image/{id}，回傳可直接放入 img[src] 的 URL */
  getPromotionImageUrl(id: number): string {
    const path = API_CONFIG.ENDPOINTS.PROMOTIONS.GET_IMAGE.replace(
      ':id',
      String(id),
    );
    return `${this.BASE}/${path}`;
  }

  /** 上傳促銷活動圖片（multipart），description 已在 create 時一起帶入 */
  updatePromotionInfo(req: UpdatePromotionInfoReq): Observable<BasicRes> {
    if (!req.promotionImg) return of({ code: 200, message: 'ok' });
    const id = String(req.promotionsId);
    const imgPath = API_CONFIG.ENDPOINTS.PROMOTIONS.UPLOAD_IMAGE.replace(':id', id);
    const base64 = req.promotionImg.startsWith('data:')
      ? req.promotionImg.split(',')[1]
      : req.promotionImg;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    const form = new FormData();
    form.append('image', blob, 'promotion.jpg');
    return this.http.post<BasicRes>(`${this.BASE}/${imgPath}`, form);
  }

  /* ══════════════════════════════════════════════════
   * GlobalArea API  →  /global_area/
   * ══════════════════════════════════════════════════ */

  getAllBranches(): Observable<GlobalAreaRes> {
    return this.http.get<GlobalAreaRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.GLOBAL_AREA.GET_ALL}`,
    );
  }

  createBranch(req: CreateGlobalAreaReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.GLOBAL_AREA.CREATE}`,
      req,
    );
  }

  updateBranch(req: UpdateGlobalAreaReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.GLOBAL_AREA.UPDATE}`,
      req,
    );
  }

  deleteBranch(req: DeleteGlobalAreaReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.GLOBAL_AREA.DELETE}`,
      req,
    );
  }

  /* ══════════════════════════════════════════════════
   * Regions API  →  /lazybaobao/regions/
   * ══════════════════════════════════════════════════ */

  getAllTax(): Observable<RegionsRes> {
    return this.http.get<RegionsRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.REGIONS.GET_ALL}`,
    );
  }

  upsertRegion(req: UpsertRegionsTaxReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.REGIONS.UPSERT}`,
      req,
    );
  }

  updateRegionUsageCap(req: UpdateRegionsUsageCapReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.REGIONS.UPDATE_USAGE_CAP}`,
      req,
    );
  }

  /* ══════════════════════════════════════════════════
   * Reports API  →  /find_monthly_reports 等
   * ══════════════════════════════════════════════════ */

  getMonthlyReport(req: MonthlyReportReq): Observable<MonthlyReportRes> {
    return this.http.post<MonthlyReportRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.REPORTS.MONTHLY}`,
      req,
      { withCredentials: true },
    );
  }

  getMonthlyReportByRange(
    req: MonthRangeReportsReq,
  ): Observable<MonthRangeReportsRes> {
    return this.http.post<MonthRangeReportsRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.REPORTS.MONTHLY_RANGE}`,
      req,
      { withCredentials: true },
    );
  }

  getRevenueReports(req: RevenueQueryReq): Observable<RevenueQueryRes> {
    return this.http.post<RevenueQueryRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.REPORTS.REVENUE}`,
      req,
    );
  }

  getTop5MonthlySales(
    year: number,
    month: number,
    regionId: number,
  ): Observable<MonthlyProductsSalesRes> {
    return this.http.get<MonthlyProductsSalesRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.MONTHLY_SALES_ADMIN}?year=${year}&month=${month}&regionId=${regionId}`,
      { withCredentials: true },
    );
  }

  /* ══════════════════════════════════════════════════
   * ExchangeRates API  →  /exchange_rates/
   * ══════════════════════════════════════════════════ */

  getAllRates(): Observable<ExchangeRatesRes> {
    return this.http.get<ExchangeRatesRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.EXCHANGE_RATES.GET_ALL}`,
    );
  }

  getRatesByDate(req: ExchangeRatesReq): Observable<ExchangeRatesRes> {
    return this.http.post<ExchangeRatesRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.EXCHANGE_RATES.GET_BY_DATE}`,
      req,
    );
  }

  fetchRatesNow(): Observable<string> {
    return this.http.post(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.EXCHANGE_RATES.FETCH}`,
      {},
      { responseType: 'text' },
    );
  }

  /** POST /ai/promo-copy（multipart：data JSON + file 圖片），回傳含 generatedDescription，並存 ai_generated */
  generateAiPromoCopy(
    promotionsId: number,
    activityName: string,
    imageBlob: Blob,
  ): Observable<AiRes> {
    const form = new FormData();
    const dataBlob = new Blob(
      [JSON.stringify({ promotionsId, activityName })],
      { type: 'application/json' },
    );
    form.append('data', dataBlob);
    form.append('file', imageBlob, 'promo.jpg');
    return this.http.post<AiRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.AI.PROMO_COPY}`,
      form,
      { withCredentials: true },
    );
  }

  /** POST /ai/product-desc，回傳含 generatedDescription */
  generateAiProductDesc(
    productName: string,
    category: string,
  ): Observable<AiRes> {
    return this.http.post<AiRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.AI.PRODUCT_DESC}`,
      { productName, category },
      { withCredentials: true },
    );
  }

  /* ══════════════════════════════════════════════════
   * Members API  →  /members/
   * ══════════════════════════════════════════════════ */

  registerGuest(req: RegisterMembersReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.MEMBERS.REGISTER_GUEST}`,
      req,
      { withCredentials: true },
    );
  }

  registerMember(req: RegisterMembersReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.MEMBERS.REGISTER_MEMBER}`,
      req,
      { withCredentials: true },
    );
  }

  memberLogin(req: LoginMembersReq): Observable<MembersRes> {
    return this.http.post<MembersRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.MEMBERS.LOGIN}`,
      req,
      { withCredentials: true },
    );
  }

  memberLogout(): Observable<MembersRes> {
    return this.http.get<MembersRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.MEMBERS.LOGOUT}`,
      { withCredentials: true },
    );
  }

  updateMemberPassword(req: UpdatePasswordReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.MEMBERS.UPDATE_PASSWORD}`,
      req,
      { withCredentials: true },
    );
  }

  /* ══════════════════════════════════════════════════
   * Staff API  →  /api/auth/ 和 /api/admin/
   * ══════════════════════════════════════════════════ */

  staffLogin(req: LoginStaffReq): Observable<StaffSearchRes> {
    return this.http.post<StaffSearchRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.STAFF.LOGIN}`,
      req,
      { withCredentials: true },
    );
  }

  staffLogout(): Observable<BasicRes> {
    return this.http.get<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.STAFF.LOGOUT}`,
      { withCredentials: true },
    );
  }

  getAllStaff(): Observable<StaffSearchRes> {
    return this.http.get<StaffSearchRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.STAFF.GET_ALL}`,
      { withCredentials: true },
    );
  }

  createStaff(req: RegisterStaffReq): Observable<StaffSearchRes> {
    return this.http.post<StaffSearchRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.STAFF.CREATE}`,
      req,
      { withCredentials: true },
    );
  }

  updateStaffStatus(
    id: number,
    req: UpdateStaffStatusReq,
  ): Observable<StaffSearchRes> {
    const path = API_CONFIG.ENDPOINTS.STAFF.UPDATE_STATUS.replace(
      ':id',
      String(id),
    );
    return this.http.patch<StaffSearchRes>(`${this.BASE}/${path}`, req, {
      withCredentials: true,
    });
  }

  changeStaffPassword(
    id: number,
    req: AdminChangePasswordReq,
  ): Observable<StaffSearchRes> {
    const path = API_CONFIG.ENDPOINTS.STAFF.CHANGE_PASSWORD.replace(
      ':id',
      String(id),
    );
    return this.http.patch<StaffSearchRes>(`${this.BASE}/${path}`, req, {
      withCredentials: true,
    });
  }

  selfChangePassword(req: SelfChangePasswordReq): Observable<StaffSearchRes> {
    return this.http.patch<StaffSearchRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.STAFF.SELF_CHANGE_PASSWORD}`,
      req,
      { withCredentials: true },
    );
  }

  promoteStaff(id: number): Observable<StaffSearchRes> {
    const path = API_CONFIG.ENDPOINTS.STAFF.PROMOTE.replace(':id', String(id));
    return this.http.patch<StaffSearchRes>(
      `${this.BASE}/${path}`,
      {},
      { withCredentials: true },
    );
  }

  /* ══════════════════════════════════════════════════
   * Products API
   * 前台菜單：GET /inventory/menu/{globalAreaId} → MenuListRes { data: MenuVo[] }
   * 管理端：  GET /product/list → AdminProductRes { productList: ProductAdminVo[] }
   * ══════════════════════════════════════════════════ */

  /** 前台菜單：依分店取得上架商品（含圖片、庫存）*/
  getActiveProducts(globalAreaId: number): Observable<MenuListRes> {
    const path = API_CONFIG.ENDPOINTS.PRODUCTS.MENU.replace(
      ':globalAreaId',
      String(globalAreaId),
    );
    return this.http.get<MenuListRes>(`${this.BASE}/${path}`);
  }

  /** 管理端：取得全部商品（含下架）*/
  getAllProducts(_globalAreaId?: number): Observable<AdminProductRes> {
    return this.http.get<AdminProductRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.LIST}`,
      { withCredentials: true },
    );
  }

  /** 取得單一商品詳情 */
  getProductDetail(id: number): Observable<AdminProductRes> {
    const path = API_CONFIG.ENDPOINTS.PRODUCTS.DETAIL.replace(
      ':id',
      String(id),
    );
    return this.http.get<AdminProductRes>(`${this.BASE}/${path}`, {
      withCredentials: true,
    });
  }

  /** GET /product/trash — 已刪除商品清單（資源回收桶） */
  getTrashProducts(): Observable<AdminProductRes> {
    return this.http.get<AdminProductRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.TRASH}`,
      { withCredentials: true },
    );
  }

  /**
   * 新增商品（POST /product/create，multipart/form-data）
   * data 欄位：ProductCreateReq JSON；file 欄位：圖片檔案
   */
  createProduct(
    req: CreateProductReq,
    file?: File,
  ): Observable<AdminProductRes> {
    const form = new FormData();
    form.append(
      'data',
      new Blob([JSON.stringify(req)], { type: 'application/json' }),
    );
    if (file) form.append('file', file);
    return this.http.post<AdminProductRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.CREATE}`,
      form,
      { withCredentials: true },
    );
  }

  /**
   * 修改商品（POST /product/update，multipart/form-data）
   * data 欄位：ProductUpdateReq JSON；file 欄位：新圖片（選填）
   */
  updateProduct(
    req: UpdateProductReq,
    file?: File,
  ): Observable<AdminProductRes> {
    const form = new FormData();
    form.append(
      'data',
      new Blob([JSON.stringify(req)], { type: 'application/json' }),
    );
    if (file) form.append('file', file);
    return this.http.post<AdminProductRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE}`,
      form,
      { withCredentials: true },
    );
  }

  /**
   * 切換上/下架（PATCH /product/status/{id}?active=true|false）
   */
  toggleProduct(id: number, active: boolean): Observable<AdminProductRes> {
    const path = API_CONFIG.ENDPOINTS.PRODUCTS.STATUS.replace(
      ':id',
      String(id),
    );
    return this.http.patch<AdminProductRes>(
      `${this.BASE}/${path}?active=${active}`,
      {},
      { withCredentials: true },
    );
  }

  /* ══════════════════════════════════════════════════
   * BranchInventory API  →  /inventory/
   * 回傳 BranchInventoryRes { data: InventoryDetailVo[] }
   * ══════════════════════════════════════════════════ */

  getBranchInventory(areaId: number): Observable<BranchInventoryRes> {
    const path = API_CONFIG.ENDPOINTS.BRANCH_INVENTORY.GET_BY_AREA.replace(
      ':areaId',
      String(areaId),
    );
    return this.http.get<BranchInventoryRes>(`${this.BASE}/${path}`, {
      withCredentials: true,
    });
  }

  /**
   * 更新分店庫存售價（POST /inventory/update，body 為陣列）
   * 後端接受 List<BranchInventoryUpdateReq>，故包裝成 [req]
   */
  updateBranchInventory(req: UpdateBranchInventoryReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.BRANCH_INVENTORY.UPDATE}`,
      [req],
      { withCredentials: true },
    );
  }

  /** POS 庫存調整：僅更新 stockQuantity（POST /inventory/update-stock） */
  updateStockOnly(
    productId: number,
    globalAreaId: number,
    stockQuantity: number,
  ): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.BRANCH_INVENTORY.UPDATE_STOCK}`,
      { productId, globalAreaId, stockQuantity },
      { withCredentials: true },
    );
  }

  /* ══════════════════════════════════════════════════
   * Payment API  →  GET /goPay?way=ECPAY|LINEPAY
   * ══════════════════════════════════════════════════ */

  /** 前往付款：LINE Pay，後端重導向至 LINE Pay 付款頁 */
  getLinePayUrl(req: PaymentInitReq): Observable<string> {
    if (this.isMock)
      return of(
        'https://sandbox-web-pay.line.me/web/payment/wait?transactionReserveId=mock',
      );
    return this.http.get(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PAYMENT.GO_PAY}?orderDateId=${req.orderDateId}&id=${req.id}&way=LINEPAY`,
      { responseType: 'text' },
    );
  }

  /** 前往付款：ECPay，後端回傳自動提交 HTML 表單 */
  getEcpayForm(req: PaymentInitReq): Observable<string> {
    if (this.isMock) return of('<p>ECPay Mock</p>');
    return this.http.get(
      `${this.BASE}/${API_CONFIG.ENDPOINTS.PAYMENT.GO_PAY}?orderDateId=${req.orderDateId}&id=${req.id}&way=ECPAY`,
      { responseType: 'text' },
    );
  }
}

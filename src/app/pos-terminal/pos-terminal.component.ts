/*
 * =====================================================
 * 檔案名稱：pos-terminal.component.ts
 * 位置說明：src/app/pos-terminal/pos-terminal.component.ts
 * 用途說明：分店長 / 員工 POS 點餐終端機
 * 功能說明：
 *   - 登入保護：只允許 branch_manager / staff 角色
 *   - 頁籤切換（分店長 6 個 / 員工 4 個）
 *   - 商品卡點擊加入購物車
 *   - 購物車增減數量、小計、稅金（5%）、合計
 *   - 滿額贈品提示（小計未達 $300 時顯示）
 *   - 付款方式選擇
 *   - 結帳後推送至 OrderService → 客戶追蹤即時同步
 *   - 訂單看板：依狀態分欄，可拖拉流轉
 *   - 庫存管理：分店長可調整庫存數量（inline 編輯）
 *   - 員工帳號管理：可停/復權（分店長專屬）
 *   - 即時時鐘
 * =====================================================
 */

import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { gsap } from 'gsap';
import autoAnimate from '@formkit/auto-animate';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../shared/auth.service';
import { OrderService, LiveOrder } from '../shared/order.service';
import {
  ApiService,
  CartSyncReq,
  CartViewRes,
  AvailableGiftVO,
  PromotionDetailVo,
  CreateOrdersReq,
  OrderCartDetailItem,
  PayReq,
  GetOrdersDetailVo,
  InventoryDetailVo,
  UpdateBranchInventoryReq,
  SelfChangePasswordReq,
} from '../shared/api.service';
import { firstValueFrom } from 'rxjs';

/* ── 頁籤型別 ──────────────────────────────────────── */
export type PosTab = 'pos' | 'board' | 'stock' | 'promo' | 'staff' | 'report';

interface PosPromoEnriched {
  id: number;
  name: string;
  minThreshold: number;
  qualified: boolean;
  progressPct: number;
  gapAmount: number;
  gifts: AvailableGiftVO[];
}

/* ── 商品型別 ──────────────────────────────────────── */
interface PosProduct {
  id: number;
  name: string;
  eng: string;
  price: number;
  emoji: string;
  bg: string;
  imgSrc?: string; /* 實體食物照片路徑（有圖時優先顯示，無圖則 fallback 至 emoji+bg） */
  badge?: 'hot' | 'new' | 'low';
  stock: number;
  category: string;
}

/* ── 購物車品項型別 ─────────────────────────────────── */
interface CartItem {
  id: number;
  name: string;
  eng: string;
  price: number;
  qty: number;
}

/* ── 活動型別 ───────────────────────────────────────── */
interface PosPromo {
  id: number;
  title: string;
  isActive: boolean;
  color: string;
  ended: boolean;
  rawStartTime: string;
  rawEndTime: string;
  type: 'promotion' | 'announcement';
  description?: string;
  image?: string;
  badgeColor?: string;
  minAmount?: number;
}

/* ── 待付款現金訂單型別 ─────────────────────────────── */
interface PendingCashOrder {
  posId: string; /* DB-YYYYMMDD-XXXX */
  dbId: string; /* 0001 */
  orderDateId: string; /* YYYYMMDD */
  number: string; /* A-0001 */
  total: number;
  phone: string;
  items: string[];
  createdAt: string;
}

/* ── 員工帳號型別 ───────────────────────────────────── */
interface StaffAccount {
  id: number;
  name: string;
  account: string;
  backendRole: string;
  isActive: boolean;
  joinedAt: string;
}

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pos-terminal.component.html',
  styleUrls: ['./pos-terminal.component.scss'],
})
export class PosTerminalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cartListEl') private cartListEl!: ElementRef<HTMLElement>;
  @ViewChild('totalEl') private totalEl!: ElementRef<HTMLElement>;
  @ViewChild('checkoutBtnEl') private checkoutBtnEl!: ElementRef<HTMLElement>;

  /* ── 即時時鐘 ─────────────────────────────────────── */
  clockStr = signal('');

  /* ── 目前頁籤 ─────────────────────────────────────── */
  activeTab = signal<PosTab>('pos');

  /* ── 付款方式 ─────────────────────────────────────── */
  payMethod = signal<'cash' | 'card' | 'mobile'>('cash');

  /* ── 訂單類型（內用 / 外帶）────────────────────────── */
  orderType = signal<'dine-in' | 'takeout'>('dine-in');

  /* ── 備註（收銀員輸入）──────────────────────────────── */
  orderNote = signal('');

  /* ── 分類篩選 ─────────────────────────────────────── */
  activeCategory = signal<string>('all');

  /* ── 搜尋關鍵字 ───────────────────────────────────── */
  searchQuery = signal<string>('');

  /* ── 結帳成功狀態 ─────────────────────────────────── */
  checkoutSuccess = signal(false);
  lastOrderNum = signal('');

  /* ── 購物車 ───────────────────────────────────────── */
  cartItems = signal<CartItem[]>([]);

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.qty, 0),
  );
  /* 合計 = 小計（台灣不另加營業稅） */
  total = computed(() => this.subtotal());

  showPromoHint = computed(() => this.subtotal() > 0 && this.subtotal() < 300);
  promoRemain = computed(() => 300 - this.subtotal());

  /* ── 商品清單（Signal 化，支援庫存調整）──────────
   * imgSrc 已移除（POS 改採 SVG 圖示設計）
   * ──────────────────────────────────────────────── */
  products = signal<PosProduct[]>([
    {
      id: 1,
      name: '招牌滷肉飯',
      eng: 'Braised Pork Rice',
      price: 120,
      emoji: '',
      bg: 'linear-gradient(135deg,#2d1205,#5c2a10)',
      badge: 'hot',
      stock: 48,
      category: '台式',
    },
    {
      id: 2,
      name: '古早味排骨飯',
      eng: 'Pork Chop Rice',
      price: 145,
      emoji: '',
      bg: 'linear-gradient(135deg,#2d1a05,#5c3a10)',
      badge: 'hot',
      stock: 32,
      category: '台式',
    },
    {
      id: 3,
      name: '蚵仔煎',
      eng: 'Oyster Pancake',
      price: 80,
      emoji: '',
      bg: 'linear-gradient(135deg,#2d2005,#5c4510)',
      badge: 'low',
      stock: 5,
      category: '台式',
    },
    {
      id: 4,
      name: '三杯雞飯',
      eng: 'Three-Cup Chicken Rice',
      price: 150,
      emoji: '',
      bg: 'linear-gradient(135deg,#1e1208,#4a2e10)',
      stock: 24,
      category: '台式',
    },
    {
      id: 5,
      name: '牛排',
      eng: 'Steak',
      price: 280,
      emoji: '',
      bg: 'linear-gradient(135deg,#2d0e0a,#5c2018)',
      badge: 'new',
      stock: 18,
      category: '西式',
    },
    {
      id: 6,
      name: '蚵仔麵線',
      eng: 'Oyster Vermicelli',
      price: 70,
      emoji: '',
      bg: 'linear-gradient(135deg,#2d1005,#6b2a10)',
      stock: 15,
      category: '台式',
    },
    {
      id: 7,
      name: '黑糖珍珠奶茶',
      eng: 'Brown Sugar Boba',
      price: 75,
      emoji: '',
      bg: 'linear-gradient(135deg,#0a0805,#2a1a0a)',
      badge: 'hot',
      stock: 120,
      category: '飲品',
    },
    {
      id: 8,
      name: '招牌滷蛋',
      eng: 'Marinated Egg',
      price: 30,
      emoji: '',
      bg: 'linear-gradient(135deg,#1e1208,#4a2e10)',
      stock: 80,
      category: '輕食',
    },
    {
      id: 9,
      name: '仙草奶茶',
      eng: 'Grass Jelly Milk Tea',
      price: 65,
      emoji: '',
      bg: 'linear-gradient(135deg,#051a05,#103010)',
      stock: 60,
      category: '飲品',
    },
  ]);

  /* 篩選後商品清單 */
  filteredProducts = computed(() => {
    const cat = this.activeCategory();
    const q = this.searchQuery().trim().toLowerCase();
    return this.products().filter((p) => {
      const catMatch = cat === 'all' || p.category === cat;
      const nameMatch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.eng.toLowerCase().includes(q);
      return catMatch && nameMatch;
    });
  });

  /* ── 新增員工 Modal 狀態 ──────────────────────────── */
  showAddStaffModal = signal(false);
  newStaffName = signal('');
  newStaffAccount = signal('');
  newStaffPassword = signal('');

  showEditStaffModal = signal(false);
  editStaffId = signal<number | null>(null);
  editStaffDraft: { name: string; password: string; backendRole: string } = {
    name: '',
    password: '',
    backendRole: 'STAFF',
  };

  /* ── 活動管理 ─────────────────────────────────────── */
  posPromos = signal<PosPromo[]>([
    {
      id: 1,
      title: '滿 $300 贈招牌滷蛋×2',
      isActive: true,
      color: '#c49756',
      ended: false,
      rawStartTime: '2026-01-01',
      rawEndTime: '2099-12-31',
      type: 'promotion',
      description: '消費滿 $300 即贈招牌滷蛋兩顆，無使用期限。',
      badgeColor: '#c49756',
      minAmount: 300,
    },
    {
      id: 2,
      title: '週一 9 折優惠',
      isActive: true,
      color: '#4f8ef7',
      ended: false,
      rawStartTime: '2026-01-01',
      rawEndTime: '2026-06-30',
      type: 'promotion',
      description: '每週一全品項享 9 折優惠，適用於本分店。',
      badgeColor: '#4f8ef7',
    },
    {
      id: 3,
      title: '夏季新菜單上線公告',
      isActive: true,
      color: '#c084fc',
      ended: false,
      rawStartTime: '2026-04-01',
      rawEndTime: '2026-06-30',
      type: 'announcement',
      description: '2026 夏季菜單已正式上線，新增 6 款季節限定料理。',
      badgeColor: '#c084fc',
    },
    {
      id: 4,
      title: '週年慶全館 8 折',
      isActive: false,
      color: '#6b7280',
      ended: true,
      rawStartTime: '2025-01-01',
      rawEndTime: '2025-12-31',
      type: 'promotion',
      description: '週年慶期間全館商品享 8 折，活動已結束。',
      badgeColor: '#6b7280',
    },
  ]);
  showPosPromoPanel = signal(false);
  posPromoDraft = {
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    badgeColor: '#c49756',
    minAmount: null as number | null,
    image: '',
    currency: 'NT$',
  };
  posToastMsg = signal('');
  private posToastTimer: any = null;

  /* ── 待付款現金訂單（客戶端現金下單，尚未至櫃台付款）── */
  pendingCashOrders = signal<PendingCashOrder[]>([]);
  confirmingCashId = signal<string | null>(null); /* 收款中的訂單 posId */

  /* ── 會員/訪客模式 ─────────────────────────────────
   * 'none'   = 未選擇（顯示選擇按鈕）
   * 'member' = 已查詢會員（顯示會員資料 + 折扣進度條）
   * 'guest'  = 訪客（顯示手機號碼輸入欄）
   * ──────────────────────────────────────────────── */
  orderMode = signal<'none' | 'member' | 'guest'>('none');

  /* 查詢會員用的輸入（email 或手機號碼） */
  memberQuery = signal('');
  memberQueryError = signal('');

  /* 查詢到的會員資訊（不含密碼） */
  foundMember = signal<{
    id: number;
    name: string;
    phone: string;
    email: string;
    orderCount: number;
  } | null>(null);

  /* 訪客手機號碼 */
  guestPhone = signal('');

  /* ── 購物車後端 sync 狀態 ─────────────────────────── */
  cartSyncRes = signal<CartViewRes | null>(null);
  posSyncCartId = signal<number | null>(null);
  private _posCartSyncQueue: Promise<void> = Promise.resolve();

  /* ── 活動/贈品選擇（後端驅動）──────────────────────── */
  posAllPromos = signal<PromotionDetailVo[]>([]);
  posPromoDrawerOpen = signal(false);
  selectedPosPromoId = signal<number | null>(null);  // null=未選, -1=不參加
  selectedPosGiftRuleId = signal<number | null>(null);

  posAvailablePromos = computed(() =>
    this.cartSyncRes()?.availablePromotions ?? [],
  );

  posSelectedPromo = computed(() =>
    this.posAvailablePromos().find(p => p.promotionId === this.selectedPosPromoId()) ?? null,
  );

  posSelectedGiftName = computed(() => {
    const ruleId = this.selectedPosGiftRuleId();
    if (!ruleId || ruleId < 0) return '';
    return this.posSelectedPromo()?.gifts.find(g => g.giftRuleId === ruleId)?.giftProductName ?? '';
  });

  posEnrichedPromos = computed((): PosPromoEnriched[] => {
    const available = this.posAvailablePromos();
    const sub = this.subtotal();
    const now = new Date();

    return this.posAllPromos()
      .filter(p => p.active && new Date(p.endTime) > now)
      .map(promo => {
        const activeGifts = promo.gifts.filter(g => g.active);
        const minThreshold = activeGifts.length > 0
          ? Math.min(...activeGifts.map(g => g.fullAmount))
          : 0;
        const availPromo = available.find(a => a.promotionId === promo.id);
        const qualified = !!availPromo;
        const progressPct = minThreshold > 0
          ? Math.min(100, Math.round((sub / minThreshold) * 100))
          : 100;
        const gapAmount = Math.max(0, minThreshold - sub);
        return { id: promo.id, name: promo.name, minThreshold, qualified, progressPct, gapAmount, gifts: availPromo?.gifts ?? [] };
      });
  });

  selectPosPromo(promoId: number): void {
    if (promoId > 0 && this.selectedPosPromoId() === promoId) {
      this.selectedPosPromoId.set(null);
    } else {
      this.selectedPosPromoId.set(promoId);
    }
    this.selectedPosGiftRuleId.set(null);
  }

  pickPosGift(ruleId: number | null): void {
    this.selectedPosGiftRuleId.set(ruleId);
  }

  private _syncCartToBackend(productId: number, quantity: number): void {
    this._posCartSyncQueue = this._posCartSyncQueue.then(async () => {
      const staff = this.authService.currentStaff;
      const globalAreaId = staff?.globalAreaId ?? 4;
      const memberId = this.foundMember()?.id ?? 1;
      const req: CartSyncReq = {
        cartId: this.posSyncCartId(),
        globalAreaId,
        productId,
        quantity,
        operationType: 'STAFF',
        memberId,
        staffId: staff?.id,
      };
      try {
        const res = await firstValueFrom(this.apiService.syncCart(req));
        if (res.cartId > 0) this.posSyncCartId.set(res.cartId);
        this.cartSyncRes.set(res);
        /* 若已選活動不再符合資格，自動重置選擇 */
        const availIds = res.availablePromotions.map(p => p.promotionId);
        const cur = this.selectedPosPromoId();
        if (cur && cur > 0 && !availIds.includes(cur)) {
          this.selectedPosPromoId.set(null);
          this.selectedPosGiftRuleId.set(null);
        }
      } catch { /* 靜默失敗，不影響收銀作業 */ }
    });
  }

  private resetPosPromoState(): void {
    this.posSyncCartId.set(null);
    this.cartSyncRes.set(null);
    this.selectedPosPromoId.set(null);
    this.selectedPosGiftRuleId.set(null);
    this.posPromoDrawerOpen.set(false);
  }

  /* ── 折扣兌換券（與客戶端相同邏輯）────────────────── */
  useDiscountCoupon = signal(false);

  toggleDiscountCoupon(): void {
    this.useDiscountCoupon.update((v) => !v);
  }

  /* 模擬折扣卡累積資料（未來串接 API）
   * phone 存帶 dash 格式，用於顯示；比對時一律去除 dash
   * orderCount：累積訂單次數，每 10 次可兌換一次 8 折折扣券 */
  private readonly MOCK_MEMBER_DISCOUNT: Record<
    string,
    { name: string; phone: string; email: string; orderCount: number }
  > = {
    'test@lazybao.com': {
      name: '懶飽飽測試會員',
      phone: '0912-345-678',
      email: 'test@lazybao.com',
      orderCount: 9,
    },
  };

  /* 本次 Session 的會員訂單次數（查詢後從 MOCK 載入，結帳後即時更新） */
  posOrderCount = signal<number>(0);

  /* 切換成會員點餐模式 */
  enterMemberMode(): void {
    this.orderMode.set('member');
    this.memberQuery.set('');
    this.memberQueryError.set('');
    this.foundMember.set(null);
  }

  /* 切換成訪客模式 */
  enterGuestMode(): void {
    this.orderMode.set('guest');
    this.guestPhone.set('');
  }

  /* 取消，回到未選擇狀態 */
  cancelOrderMode(): void {
    this.orderMode.set('none');
    this.foundMember.set(null);
    this.posOrderCount.set(0);
    this.memberQuery.set('');
    this.memberQueryError.set('');
    this.guestPhone.set('');
    this.useDiscountCoupon.set(false);
    this.resetPosPromoState();
  }

  /* 查詢會員（比對時去除所有 dash，讓使用者輸入 0912345678 也能找到） */
  lookupMember(): void {
    const q = this.memberQuery().trim();
    if (!q) {
      this.memberQueryError.set('請輸入會員 Email 或手機號碼');
      return;
    }

    /* 台灣手機號碼正規化：0912345678 → +886912345678 */
    let phone = q.replace(/-/g, '');
    if (/^09\d{8}$/.test(phone)) {
      phone = '+886' + phone.slice(1);
    }

    this.apiService.getMemberByPhone(phone).subscribe({
      next: (res) => {
        const m = res?.members;
        if (res?.code === 200 && m) {
          this.foundMember.set({
            id: m.id,
            name: m.name,
            phone: m.phone,
            email: '',
            orderCount: m.orderCount,
          });
          this.posOrderCount.set(m.orderCount);
          this.memberQueryError.set('');
        } else {
          this.foundMember.set(null);
          this.posOrderCount.set(0);
          this.memberQueryError.set('查無此會員，請確認手機號碼');
        }
      },
      error: () => this.memberQueryError.set('查詢失敗，請確認後端連線'),
    });
  }

  /* 會員訂單次數累積進度（佔 10 次的百分比） */
  get memberOrderCountPct(): number {
    const count = this.posOrderCount();
    if (count === 0) return 0;
    return Math.min(100, (count % 10 === 0 ? 10 : count % 10) * 10);
  }

  /* 距離下一張折扣券還差幾次 */
  get memberOrdersUntilCoupon(): number {
    const count = this.posOrderCount();
    const rem = count % 10;
    if (rem === 0 && count > 0) return 0;
    return 10 - rem;
  }

  /* 會員訂單是否達成折扣券（每 10 次） */
  get memberHasDiscountReady(): boolean {
    const count = this.posOrderCount();
    return count > 0 && count % 10 === 0;
  }

  /* 折扣後合計（使用折扣券時 8 折） */
  get discountedTotal(): number {
    if (this.useDiscountCoupon()) {
      return Math.round(this.subtotal() * 0.8);
    }
    return this.subtotal();
  }

  /* 折扣省下金額 */
  get discountAmount(): number {
    return this.subtotal() - this.discountedTotal;
  }

  /* ── 庫存管理頁專用清單（含未上架商品，來自 getBranchInventory）── */
  posStockList = signal<InventoryDetailVo[]>([]);

  /* ── 庫存調整狀態 ─────────────────────────────────── */
  adjustingStockId = signal<number | null>(null);
  adjustStockAmount = signal<number>(0);
  adjustStockSavedId = signal<number | null>(null);

  /* ── 員工帳號清單（Signal 化） ──────────────────────── */
  staffAccounts = signal<StaffAccount[]>([
    {
      id: 1,
      name: '王小明',
      account: 'wang.xm',
      backendRole: 'STAFF',
      isActive: true,
      joinedAt: '2024-09-01',
    },
    {
      id: 2,
      name: '李佳靜',
      account: 'lee.jj',
      backendRole: 'STAFF',
      isActive: true,
      joinedAt: '2025-03-15',
    },
    {
      id: 3,
      name: '張偉成',
      account: 'chang.wc',
      backendRole: 'MANAGER_AGENT',
      isActive: true,
      joinedAt: '2023-11-20',
    },
  ]);

  /* ── 報電話號碼取餐 ───────────────────────────────── */
  phoneQuery = signal('');
  phoneSearchLoading = signal(false);
  phoneSearchResults = signal<import('../shared/api.service').GetOrdersVo[]>([]);
  phoneSearchDone = signal(false);
  phoneSearchError = signal('');

  /* 計時器 ID */
  private clockInterval: ReturnType<typeof setInterval> | null = null;
  /* POS 看板輪詢計時器 */
  private boardPollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    public authService: AuthService,
    public orderService: OrderService,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (
      !user ||
      (user.role !== 'branch_manager' &&
        user.role !== 'deputy_manager' &&
        user.role !== 'staff')
    ) {
      this.router.navigate(['/staff-login']);
      return;
    }
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    /* 立即拉一次今日訂單，之後每 5 秒輪詢 */
    this._fetchTodayOrders();
    this.boardPollInterval = setInterval(() => this._fetchTodayOrders(), 5000);

    const globalAreaId = this.authService.currentStaff?.globalAreaId ?? 4;
    this.apiService.getActiveProducts(globalAreaId).subscribe({
      next: (res) => {
        if (res?.data?.length) {
          this.products.set(
            res.data.map((p) => ({
              id: p.productId,
              name: p.name,
              eng: p.name,
              price: p.basePrice,
              emoji: '',
              bg: 'linear-gradient(135deg,#1e1a14,#3a2e20)',
              stock: p.stockQuantity,
              category: p.category,
              badge: p.stockQuantity <= 5 ? ('low' as const) : undefined,
            })),
          );
        }
      },
      error: (err) =>
        console.warn('[POS] 商品 API 失敗，使用本機 Demo 資料', err),
    });
    this.loadStockList();
    this.apiService.getPromotionsList(globalAreaId).subscribe({
      next: (res) => { if (res?.data?.length) this.posAllPromos.set(res.data); },
    });
    if (this.isBM) {
      this.apiService.getAllStaff().subscribe({
        next: (staffRes) => {
          if (staffRes?.staffList?.length) {
            this.staffAccounts.set(
              staffRes.staffList
                .filter(
                  (s) => s.role !== 'ADMIN' && s.role !== 'REGION_MANAGER',
                )
                .map((s) => ({
                  id: s.id,
                  name: s.name,
                  account: s.account,
                  backendRole: s.role,
                  isActive: s.status ?? true,
                  joinedAt: s.hireAt?.slice(0, 10) ?? '',
                })),
            );
          }
        },
        error: () => console.warn('[POS] 員工清單載入失敗'),
      });
    }
    this.apiService.getPromotionsList(globalAreaId).subscribe({
      next: (res) => {
        if (res?.data?.length) {
          this.posPromos.set(
            res.data.map((p) => ({
              id: p.id,
              title: p.name,
              isActive: p.active,
              color: p.active ? '#c49756' : '#6b7280',
              ended: !!p.endTime && new Date(p.endTime) < new Date(),
              rawStartTime: p.startTime,
              rawEndTime: p.endTime,
              type: 'promotion' as const,
              description: p.description ?? '',
              image: p.promotionImg
                ? p.promotionImg.startsWith('data:')
                  ? p.promotionImg
                  : `data:image/jpeg;base64,${p.promotionImg}`
                : '',
              badgeColor: p.active ? '#c49756' : '#6b7280',
              minAmount: p.gifts?.length
                ? Math.min(...p.gifts.map((g) => +g.fullAmount))
                : undefined,
            })),
          );
        }
      },
      error: () => console.warn('[POS] 活動 API 失敗，使用本機 Demo 資料'),
    });
  }

  ngAfterViewInit(): void {
    if (this.cartListEl?.nativeElement) {
      autoAnimate(this.cartListEl.nativeElement, { duration: 180 });
    }
  }

  ngOnDestroy(): void {
    if (this.clockInterval !== null) clearInterval(this.clockInterval);
    if (this.boardPollInterval !== null) clearInterval(this.boardPollInterval);
  }

  /* 從後端拉今日訂單，同步至 OrderService（已付款）或 pendingCashOrders（待付款） */
  private _fetchTodayOrders(): void {
    this.apiService.getTodayOrders().subscribe({
      next: (res) => {
        if (!res?.getOrderVoList) return;
        const pad = (n: number) => String(n).padStart(2, '0');
        const now = new Date();
        const nowStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const formatOrderNum = (orderDateId: string, id: string) =>
          `${orderDateId}-${id}`;

        res.getOrderVoList.forEach((o) => {
          const existingId = `DB-${o.orderDateId}-${o.id}`;

          const rawDetails: GetOrdersDetailVo[] = o.getOrdersDetailVoList ?? [];
          const itemTexts: string[] = rawDetails
            .filter((i) => !i.gift)
            .map(
              (i) => `${i.name || i.productName || '未知品項'} × ${i.quantity}`,
            );

          /* ── 付款方式：後端已回傳 paymentMethod 欄位 ── */
          const rawPayment: string =
            o.paymentMethod ?? o.payMethod ?? o.paymentStatus ?? '';
          const isCash =
            rawPayment === 'CASH' ||
            o.ordersStatus === 'PENDING_CASH' ||
            o.kitchenStatus === 'PENDING_CASH';

          /* ── 狀態映射：現金訂單 READY → 'ready'（讓客戶追蹤步驟3亮起）
           *            非現金 READY → 'done'（一般完成）────────────────── */
          const statusMap: Record<
            string,
            'pending-cash' | 'waiting' | 'cooking' | 'ready' | 'done'
          > = {
            PENDING_CASH: 'waiting',
            UNPAID: 'waiting',
            WAITING: 'waiting',
            COOKING: 'cooking',
            READY: isCash ? 'ready' : 'done',
            AWAITING_PAYMENT: 'pending-cash',
            COMPLETED: 'done',
          };
          const rawStatus = (o.kitchenStatus ?? '') || o.ordersStatus;
          const status =
            statusMap[rawStatus] ?? statusMap[o.ordersStatus] ?? 'waiting';

          const payMethod =
            o.ordersStatus === 'COMPLETED'
              ? '已付款'
              : isCash
                ? '現金'
                : rawPayment === 'CREDIT_CARD'
                  ? '信用卡'
                  : rawPayment === 'MOBILE_PAY'
                    ? '行動支付'
                    : '待付款';

          const existing = this.orderService
            .orders()
            .find((x) => x.id === existingId);
          if (!existing) {
            this.orderService.addOrder({
              id: existingId,
              number: formatOrderNum(o.orderDateId, o.id),
              status,
              estimatedMinutes: 10,
              items: itemTexts,
              total: Number(o.totalAmount),
              createdAt: nowStr,
              payMethod,
              isCash,
              source: 'customer',
              customerName: '',
            } as LiveOrder);
          } else {
            /* 'pending-cash' 和 'paid' 是純前端狀態，輪詢不可覆蓋 */
            const isProtected =
              existing.status === 'pending-cash' || existing.status === 'paid';
            if (!isProtected && existing.status !== status) {
              this.orderService.updateStatus(existingId, status);
            }
            if (
              isCash &&
              (!existing.isCash || existing.payMethod === '待付款')
            ) {
              this.orderService.updatePayMethodAndCash(
                existingId,
                '現金',
                true,
              );
            } else if (
              existing.payMethod === '待付款' &&
              payMethod !== '待付款'
            ) {
              this.orderService.updatePayMethod(existingId, payMethod);
            }
            if (itemTexts.length > 0 && existing.items.length === 0) {
              this.orderService.updateItems(existingId, itemTexts);
            }
          }
        });
      },
      error: () => {},
    });
  }

  /* 判斷是否為分店長 */
  get isBM(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'branch_manager' || role === 'deputy_manager';
  }

  /* 更新時鐘 */
  private updateClock(): void {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const day = days[now.getDay()];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    this.clockStr.set(`${yyyy}/${mo}/${dd} 星期${day} ${hh}:${mm}:${ss}`);
  }

  /* 切換頁籤 */
  setTab(tab: PosTab): void {
    if (tab === 'staff' && !this.isBM) return;
    this.activeTab.set(tab);
    setTimeout(() => {
      const panel = document.querySelector<HTMLElement>(
        '.page-panel, .pos-main',
      );
      if (panel)
        gsap.fromTo(
          panel,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' },
        );
    }, 0);
  }

  /* GSAP：合計數字彈跳（加入/移除品項時呼叫） */
  private animateTotal(): void {
    setTimeout(() => {
      const el = this.totalEl?.nativeElement;
      if (!el) return;
      gsap.fromTo(
        el,
        { scale: 1.07 },
        { scale: 1, duration: 0.24, ease: 'back.out(3)' },
      );
    }, 0);
  }

  /* 加入購物車，並同步扣減本地庫存顯示 */
  addToCart(product: PosProduct, event?: MouseEvent): void {
    if (product.stock <= 0) {
      this.posShowToast('⚠️ 此商品庫存不足');
      return;
    }
    const current = this.cartItems();
    const existing = current.find((c) => c.id === product.id);
    if (existing) {
      this.cartItems.set(
        current.map((c) =>
          c.id === product.id ? { ...c, qty: c.qty + 1 } : c,
        ),
      );
      this._syncCartToBackend(product.id, existing.qty + 1);
    } else {
      this.cartItems.set([
        ...current,
        {
          id: product.id,
          name: product.name,
          eng: product.eng,
          price: product.price,
          qty: 1,
        },
      ]);
      this._syncCartToBackend(product.id, 1);
    }
    /* 扣減本地庫存顯示 */
    this.products.update((list) =>
      list.map((p) => (p.id === product.id ? { ...p, stock: p.stock - 1 } : p)),
    );
    if (navigator.vibrate) navigator.vibrate(25);
    if (event?.currentTarget) {
      gsap.fromTo(
        event.currentTarget as HTMLElement,
        { scale: 0.95 },
        { scale: 1, duration: 0.18, ease: 'back.out(3)' },
      );
    }
    this.animateTotal();
  }

  /* 增減數量，並同步調整本地庫存顯示 */
  updateQty(id: number, delta: number): void {
    const current = this.cartItems();
    const item = current.find((c) => c.id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      /* 移除品項：將整個 qty 還回庫存 */
      this.products.update((list) =>
        list.map((p) => (p.id === id ? { ...p, stock: p.stock + item.qty } : p)),
      );
      this.cartItems.set(current.filter((c) => c.id !== id));
      this._syncCartToBackend(id, 0);
    } else {
      /* delta < 0 (減少) → 還回庫存；delta > 0 (增加) → 扣減庫存 */
      const productInCart = this.products().find((p) => p.id === id);
      if (delta > 0 && productInCart && productInCart.stock <= 0) {
        this.posShowToast('⚠️ 此商品庫存不足');
        return;
      }
      this.products.update((list) =>
        list.map((p) => (p.id === id ? { ...p, stock: p.stock - delta } : p)),
      );
      this.cartItems.set(
        current.map((c) => (c.id === id ? { ...c, qty: newQty } : c)),
      );
      this._syncCartToBackend(id, newQty);
    }
    this.animateTotal();
  }

  /* 清空購物車，歸還所有庫存顯示 */
  clearCart(): void {
    const items = this.cartItems();
    items.forEach((item) => {
      this.products.update((list) =>
        list.map((p) => (p.id === item.id ? { ...p, stock: p.stock + item.qty } : p)),
      );
    });
    this.cartItems.set([]);
    this.orderNote.set('');
  }

  /* 直接移除單一品項，歸還庫存顯示 */
  removeItem(id: number): void {
    const item = this.cartItems().find((c) => c.id === id);
    if (item) {
      this.products.update((list) =>
        list.map((p) => (p.id === id ? { ...p, stock: p.stock + item.qty } : p)),
      );
    }
    this.cartItems.update((list) => list.filter((c) => c.id !== id));
    this.animateTotal();
  }

  /* ── 現金計算器狀態 ───────────────────────────────── */
  showCashCalc = signal(false); /* 是否顯示現金計算鍵盤 */
  cashInput = signal(''); /* 收銀員輸入的收取金額（字串） */

  /* 收取金額（數字） */
  get cashReceived(): number {
    return parseInt(this.cashInput(), 10) || 0;
  }

  /* 找零金額 */
  get cashChange(): number {
    return this.cashReceived - this.discountedTotal;
  }

  /* 常見快速金額按鈕 */
  get quickCashAmounts(): number[] {
    const t = this.discountedTotal;
    /* 向上取整至 100 / 500 / 1000 */
    const c100 = Math.ceil(t / 100) * 100;
    const c500 = Math.ceil(t / 500) * 500;
    const c1000 = Math.ceil(t / 1000) * 1000;
    const set = new Set([t, c100, c500, c1000]);
    return Array.from(set).sort((a, b) => a - b);
  }

  /* 鍵盤按鍵輸入 */
  cashKeyPress(key: string): void {
    if (key === 'C') {
      this.cashInput.set('');
      return;
    }
    if (key === 'BS') {
      this.cashInput.update((v) => v.slice(0, -1));
      return;
    }
    /* 限制最大 6 位數 */
    if (this.cashInput().length >= 6) return;
    this.cashInput.update((v) => v + key);
  }

  /* 快速金額按鈕 */
  setCashAmount(amount: number): void {
    this.cashInput.set(String(amount));
  }

  /* 點擊結帳：若選現金 → 顯示計算器；其他方式直接結帳 */
  onCheckoutClick(): void {
    if (this.cartItems().length === 0) return;
    if (this.orderMode() === 'none') {
      this.posShowToast('⚠️ 請先選擇會員或訪客再結帳');
      return;
    }
    if (this.orderMode() === 'member' && !this.foundMember()) {
      this.posShowToast('⚠️ 尚未查詢到會員，請輸入 Email 或手機號碼查詢，或改選訪客模式');
      return;
    }
    const btn = this.checkoutBtnEl?.nativeElement;
    if (btn)
      gsap.fromTo(
        btn,
        { scale: 0.96 },
        { scale: 1, duration: 0.2, ease: 'back.out(2)' },
      );
    if (this.payMethod() === 'cash') {
      this.cashInput.set('');
      this.showCashCalc.set(true);
    } else {
      this.confirmCheckout();
    }
  }

  /* 取消現金計算 */
  cancelCashCalc(): void {
    this.showCashCalc.set(false);
    this.cashInput.set('');
  }

  /* ── 確認結帳：推送至後端 + OrderService ────────────── */
  async confirmCheckout(): Promise<void> {
    if (this.cartItems().length === 0) return;

    const staff = this.authService.currentStaff;
    const globalAreaId = staff?.globalAreaId ?? 4;
    const memberId = this.foundMember()?.id ?? 1;
    const phone =
      this.orderMode() === 'guest'
        ? this.guestPhone()
        : (this.foundMember()?.phone ?? '');
    const total = this.discountedTotal;
    const items = this.cartItems();
    const payMethodMap: Record<string, string> = {
      cash: 'CASH',
      card: 'CREDIT_CARD',
      mobile: 'MOBILE_PAY',
    };
    const payMethod = payMethodMap[this.payMethod()] ?? 'CASH';

    try {
      let cartId: number | null = null;
      for (const item of items) {
        const syncReq: CartSyncReq = {
          cartId,
          globalAreaId,
          productId: item.id,
          quantity: item.qty,
          operationType: 'STAFF',
          memberId,
          staffId: staff?.id,
        };
        const syncRes = await firstValueFrom(this.apiService.syncCart(syncReq));
        cartId = syncRes.cartId;
      }

      /* 若選了贈品，加入訂單明細 */
      const giftRuleId = this.selectedPosGiftRuleId() ?? 0;
      const giftDetailItem: OrderCartDetailItem[] = giftRuleId > 0
        ? [{ productId: 0, quantity: 1, gift: true, promotionsGiftsId: giftRuleId }]
        : [];

      const orderRes = await firstValueFrom(
        this.apiService.createOrder({
          orderCartId: String(cartId!),
          globalAreaId,
          memberId,
          phone,
          subtotalBeforeTax: total,
          taxAmount: 0,
          totalAmount: total,
          orderCartDetailsList: [
            ...items.map((i) => ({ productId: i.id, quantity: i.qty, gift: false })),
            ...giftDetailItem,
          ],
        } as CreateOrdersReq),
      );

      await firstValueFrom(
        this.apiService.pay({
          id: orderRes.id,
          orderDateId: orderRes.orderDateId,
          paymentMethod: payMethod,
          transactionId:
            payMethod === 'CASH' ? 'CASH_PAYMENT' : `POS_${Date.now()}`,
          totalAmount: orderRes.totalAmount,
        } as PayReq),
      );

      /* 結帳成功後批次扣減後端庫存 */
      const stockList = this.posStockList();
      const inventoryUpdates: UpdateBranchInventoryReq[] = items
        .map((cartItem) => {
          const inv = stockList.find((s) => s.productId === cartItem.id);
          if (!inv) return null;
          return {
            productId: cartItem.id,
            globalAreaId,
            stockQuantity: Math.max(0, inv.stockQuantity - cartItem.qty),
            basePrice: inv.basePrice,
            costPrice: inv.costPrice,
            maxOrderQuantity: inv.maxOrderQuantity,
            active: inv.active,
          } as UpdateBranchInventoryReq;
        })
        .filter((r): r is UpdateBranchInventoryReq => r !== null);

      if (inventoryUpdates.length > 0) {
        await firstValueFrom(this.apiService.deductInventoryBatch(inventoryUpdates));
      }
    } catch (err) {
      console.error('[POS] 結帳 API 失敗', err);
      this.posShowToast('⚠️ 訂單送出失敗，請確認後端連線');
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const orderNum = this.orderService.generateOrderNumber();
    const orderId = this.orderService.generateOrderId();
    const itemTexts = this.cartItems().map((i) => `${i.name} × ${i.qty}`);

    /* 若有滿額贈品（且非「不需要」），一併加入品項列表 */
    const gift = this.posSelectedGiftName();
    if (gift && gift !== '不需要滿額免費贈品') {
      itemTexts.push(`${gift}（滿額贈品）`);
    }

    const totalQty = this.cartItems().reduce((s, i) => s + i.qty, 0);
    const estMin = Math.max(5, Math.ceil(totalQty * 2));
    const payLabels: Record<string, string> = {
      cash: '現金',
      card: '信用卡',
      mobile: '行動支付',
    };

    this.orderService.addOrder({
      id: orderId,
      number: orderNum,
      status: 'waiting',
      estimatedMinutes: estMin,
      items: itemTexts,
      total: this.discountedTotal,
      createdAt: timeStr,
      payMethod: payLabels[this.payMethod()],
      source: 'pos',
      customerName: this.authService.currentUser?.name,
      orderType: this.orderType() === 'dine-in' ? '內用' : '外帶',
      note: this.orderNote().trim() || undefined,
    });

    this.lastOrderNum.set(orderNum);
    this.cartItems.set([]);
    this.orderNote.set('');
    this.resetPosPromoState();
    /* 結帳後從後端重新拉庫存，覆蓋本地暫存的扣減值 */
    this.loadStockList();
    this._reloadProductStock(globalAreaId);
    this.showCashCalc.set(false);
    this.cashInput.set('');

    /* 更新會員訂單次數：使用折扣券 → 重設為 1；未使用 → +1（上限 10，不超過） */
    if (this.foundMember()) {
      if (this.useDiscountCoupon()) {
        this.posOrderCount.set(1);
      } else {
        this.posOrderCount.update((c) => Math.min(c + 1, 10));
      }
    }

    /* 重置折扣券 & 贈品 & 活動選擇 */
    this.useDiscountCoupon.set(false);
    this.resetPosPromoState();

    this.checkoutSuccess.set(true);
    setTimeout(() => this.checkoutSuccess.set(false), 3000);
  }

  /* 設定分類篩選 */
  setCategory(cat: string): void {
    this.activeCategory.set(cat);
  }

  /* 搜尋關鍵字更新 */
  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  /* ── 現金收款確認（PENDING_CASH → COMPLETED → WAITING）── */
  async confirmCashPayment(order: PendingCashOrder): Promise<void> {
    if (this.confirmingCashId() === order.posId) return; /* 防重複點擊 */
    this.confirmingCashId.set(order.posId);
    try {
      const res = await firstValueFrom(
        this.apiService.pay({
          id: order.dbId,
          orderDateId: order.orderDateId,
          paymentMethod: 'CASH',
          transactionId: 'CASH_PAYMENT',
          totalAmount: order.total,
        }),
      );
      if (res?.code === 200) {
        /* 移出待付款列表，下次輪詢會自動帶進廚房看板 */
        this.pendingCashOrders.update((list) =>
          list.filter((p) => p.posId !== order.posId),
        );
        this.posShowToast(`收款完成：${order.number}`);
      } else {
        this.posShowToast('收款失敗，請重試');
      }
    } catch {
      this.posShowToast('收款失敗，請確認後端連線');
    } finally {
      this.confirmingCashId.set(null);
    }
  }

  /* ── 廚房完成後，將現金訂單移至待收款區 ──────────── */
  moveToCashPayment(order: LiveOrder): void {
    this.orderService.updateStatus(order.id, 'pending-cash');
    if (order.id.startsWith('DB-')) {
      const parts = order.id.split('-');
      if (parts.length >= 3) {
        const orderDateId = parts[1];
        const orderId = parts.slice(2).join('-');
        this.apiService
          .updateOrderStatus({
            id: orderId,
            orderDateId,
            ordersStatus: 'AWAITING_PAYMENT',
          })
          .subscribe({
            error: () => console.warn('[POS] AWAITING_PAYMENT 更新失敗'),
          });
      }
    }
  }

  /* ── 現金收款完成（POS 看板內移動的訂單）────────── */
  async completeCashOrder(order: LiveOrder): Promise<void> {
    /* 後端同步訂單（id 格式：DB-{orderDateId}-{orderId}）→ 呼叫 cash_confirm API
     * pay() 只接受 UNPAID 狀態，現金訂單到此已是 READY，需用 cash_confirm */
    if (order.id.startsWith('DB-')) {
      const parts = order.id.split('-');
      if (parts.length >= 3) {
        const orderDateId = parts[1];
        const orderId = parts.slice(2).join('-');
        try {
          await firstValueFrom(
            this.apiService.confirmCashPayment(orderId, orderDateId),
          );
        } catch {
          /* 靜默失敗，本地狀態仍更新 */
        }
      }
    }
    this.orderService.updateStatus(order.id, 'paid');
    this.posShowToast(`收款完成：${order.number}`);
  }

  /* ── 訂單看板：狀態流轉 ───────────────────────────── */
  startCooking(id: string): void {
    this.orderService.updateStatus(id, 'cooking');
    this._pushKitchenStatus(id, 'COOKING');
  }

  finishOrder(id: string): void {
    this.orderService.updateStatus(id, 'done');
    this._pushKitchenStatus(id, 'READY');
  }

  /** 將廚房狀態推送至後端（id 格式為 DB-YYYYMMDD-XXXX） */
  private _pushKitchenStatus(
    orderId: string,
    kitchenStatus: 'COOKING' | 'READY',
  ): void {
    /* DB 訂單 id 格式：DB-{orderDateId}-{id}，例如 DB-20260413-0001 */
    const match = orderId.match(/^DB-(\d{8})-(\d+)$/);
    if (!match) return; /* mock 訂單不推送 */
    this.apiService
      .updateKitchenStatus({
        id: match[2],
        orderDateId: match[1],
        kitchenStatus,
      })
      .subscribe({
        error: () => console.warn('[POS] kitchen_status 更新失敗'),
      });
  }

  /* ── 載入庫存管理頁清單 ──────────────────────────── */
  private loadStockList(): void {
    const globalAreaId = this.authService.currentStaff?.globalAreaId ?? 4;
    this.apiService.getBranchInventory(globalAreaId).subscribe({
      next: (res) => {
        if (res?.data?.length) this.posStockList.set(res.data);
      },
      error: () => console.warn('[POS] 庫存清單載入失敗'),
    });
  }

  /* 結帳後重新拉 POS 選單商品庫存，覆蓋本地暫存的扣減值 */
  private _reloadProductStock(globalAreaId: number): void {
    this.apiService.getActiveProducts(globalAreaId).subscribe({
      next: (res) => {
        if (res?.data?.length) {
          this.products.set(
            res.data.map((p) => ({
              id: p.productId,
              name: p.name,
              eng: p.name,
              price: p.basePrice,
              emoji: '',
              bg: 'linear-gradient(135deg,#1e1a14,#3a2e20)',
              stock: p.stockQuantity,
              category: p.category,
              badge: p.stockQuantity <= 5 ? ('low' as const) : undefined,
            })),
          );
        }
      },
      error: () => {},
    });
  }

  /* ── 庫存調整 ─────────────────────────────────────── */
  startAdjustStock(productId: number): void {
    const p = this.posStockList().find((x) => x.productId === productId);
    if (!p) return;
    this.adjustingStockId.set(productId);
    this.adjustStockAmount.set(p.stockQuantity);
  }

  cancelAdjustStock(): void {
    this.adjustingStockId.set(null);
  }

  onAdjustInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 0) this.adjustStockAmount.set(val);
  }

  stepStock(delta: number): void {
    this.adjustStockAmount.update((v) => Math.max(0, v + delta));
  }

  confirmAdjustStock(): void {
    const id = this.adjustingStockId();
    const amt = this.adjustStockAmount();
    if (id === null) return;
    this.posStockList.update((list) =>
      list.map((p) => (p.productId === id ? { ...p, stockQuantity: amt } : p)),
    );
    this.adjustingStockId.set(null);
    this.adjustStockSavedId.set(id);
    setTimeout(() => this.adjustStockSavedId.set(null), 1800);
    const globalAreaId = this.authService.currentStaff?.globalAreaId ?? 4;
    const existing = this.posStockList().find((p) => p.productId === id);
    if (existing) {
      this.apiService.deductInventoryBatch([{
        productId: id,
        globalAreaId,
        stockQuantity: amt,
        basePrice: existing.basePrice,
        costPrice: existing.costPrice,
        maxOrderQuantity: existing.maxOrderQuantity,
        active: existing.active,
      }]).subscribe({
        error: () => console.warn('[POS] 庫存同步後端失敗，前端已更新'),
      });
    }
  }

  /* ── 員工帳號：新增 Modal ────────────────────────── */
  openAddStaff(): void {
    this.newStaffName.set('');
    this.newStaffAccount.set('');
    this.newStaffPassword.set('');
    this.showAddStaffModal.set(true);
  }

  cancelAddStaff(): void {
    this.showAddStaffModal.set(false);
  }

  openEditStaff(id: number): void {
    const staff = this.staffAccounts().find((s) => s.id === id);
    if (!staff) return;
    this.editStaffId.set(id);
    this.editStaffDraft = {
      name: staff.name,
      password: '',
      backendRole: staff.backendRole,
    };
    this.showEditStaffModal.set(true);
  }

  get editStaffIsMA(): boolean {
    const id = this.editStaffId();
    if (id === null) return false;
    return (
      this.staffAccounts().find((s) => s.id === id)?.backendRole ===
      'MANAGER_AGENT'
    );
  }

  cancelEditStaff(): void {
    this.showEditStaffModal.set(false);
    this.editStaffId.set(null);
  }

  saveEditStaff(): void {
    const id = this.editStaffId();
    if (id === null) return;
    const { name, password, backendRole } = this.editStaffDraft;
    if (!name.trim()) {
      this.posShowToast('⚠️ 姓名為必填');
      return;
    }

    // 若有填新密碼，呼叫修改密碼 API
    if (password.trim()) {
      this.apiService
        .changeStaffPassword(id, { newPassword: password })
        .subscribe({
          next: () => this.posShowToast('✅ 密碼已更新'),
          error: () => this.posShowToast('⚠️ 密碼修改失敗'),
        });
    }

    // 若角色改為副店長，呼叫升遷 API
    const current = this.staffAccounts().find((s) => s.id === id);
    if (current?.backendRole === 'STAFF' && backendRole === 'MANAGER_AGENT') {
      this.apiService.promoteStaff(id).subscribe({
        next: () => {
          this.staffAccounts.update((list) =>
            list.map((s) =>
              s.id === id
                ? {
                    ...s,
                    name: name.trim(),
                    backendRole: 'MANAGER_AGENT',
                    account: s.account.replace(/^ST/, 'MA'),
                  }
                : s,
            ),
          );
          this.posShowToast('✅ 已升遷為副店長');
        },
        error: () => this.posShowToast('⚠️ 升遷失敗'),
      });
    } else {
      // 只更新本地姓名（後端目前無單獨更新姓名的端點）
      this.staffAccounts.update((list) =>
        list.map((s) => (s.id === id ? { ...s, name: name.trim() } : s)),
      );
      this.posShowToast('✅ 已更新');
    }

    this.showEditStaffModal.set(false);
    this.editStaffId.set(null);
  }

  confirmAddStaff(): void {
    const name = this.newStaffName().trim();
    if (!name) return;

    const globalAreaId = this.authService.currentStaff?.globalAreaId ?? 4;
    this.apiService
      .createStaff({
        name,
        role: 'STAFF',
        globalAreaId,
      })
      .subscribe({
        next: (res) => {
          this.showAddStaffModal.set(false);
          this.posShowToast('✅ 員工帳號已新增，帳號由系統自動產生');
          // 重新從後端拉員工清單
          this.apiService.getAllStaff().subscribe({
            next: (staffRes) => {
              if (staffRes?.staffList?.length) {
                this.staffAccounts.set(
                  staffRes.staffList
                    .filter(
                      (s) => s.role !== 'ADMIN' && s.role !== 'REGION_MANAGER',
                    )
                    .map((s) => ({
                      id: s.id,
                      name: s.name,
                      account: s.account,
                      backendRole: s.role,
                      isActive: s.status ?? true,
                      joinedAt: s.hireAt?.slice(0, 10) ?? '',
                    })),
                );
              }
            },
            error: () => {},
          });
        },
        error: () => this.posShowToast('⚠️ 新增失敗，請確認後端連線'),
      });
  }

  /* ── 員工帳號：停/復權 ────────────────────────────── */
  toggleStaff(id: number): void {
    const target = this.staffAccounts().find((s) => s.id === id);
    if (!target) return;
    const newStatus = !target.isActive;
    this.staffAccounts.update((list) =>
      list.map((s) => (s.id === id ? { ...s, isActive: newStatus } : s)),
    );
    this.apiService.updateStaffStatus(id, { newStatus: newStatus }).subscribe({
      next: () =>
        this.posShowToast(newStatus ? `✅ 帳號已復權` : `🔒 帳號已停權`),
      error: () => {
        this.staffAccounts.update((list) =>
          list.map((s) => (s.id === id ? { ...s, isActive: !newStatus } : s)),
        );
        this.posShowToast('⚠️ 更新失敗，請確認後端連線');
      },
    });
  }

  /* ── 活動管理方法 ─────────────────────────────────── */
  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  posShowToast(msg: string): void {
    this.posToastMsg.set(msg);
    clearTimeout(this.posToastTimer);
    this.posToastTimer = setTimeout(() => this.posToastMsg.set(''), 3000);
  }

  deletePromo(id: number): void {
    const promo = this.posPromos().find((p) => p.id === id);
    if (!promo) return;
    if (!confirm(`確定刪除活動「${promo.title}」？此操作無法復原。`)) return;
    this.posPromos.update((list) => list.filter((p) => p.id !== id));
    this.posShowToast(`活動「${promo.title}」已刪除`);
  }

  togglePromo(id: number): void {
    const current = this.posPromos().find((p) => p.id === id);
    if (!current || current.ended) return;
    this.posPromos.update((list) =>
      list.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
    );
  }

  openAddPromo(): void {
    this.posPromoDraft = {
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      badgeColor: '#c49756',
      minAmount: null,
      image: '',
      currency: 'NT$',
    };
    this.showPosPromoPanel.set(true);
  }

  closePromoPanel(): void {
    this.showPosPromoPanel.set(false);
  }

  onPromoBadgeColorPick(color: string): void {
    this.posPromoDraft.badgeColor = color;
  }

  onPromoImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.posPromoDraft.image = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }

  savePromo(): void {
    if (!this.posPromoDraft.name.trim()) {
      this.posShowToast('請輸入活動名稱');
      return;
    }
    if (!this.posPromoDraft.startTime || !this.posPromoDraft.endTime) {
      this.posShowToast('請填寫活動開始與結束日期');
      return;
    }
    const saved = { ...this.posPromoDraft };
    const ids = this.posPromos().map((p) => p.id);
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    this.posPromos.update((list) => [
      ...list,
      {
        id: newId,
        title: saved.name.trim(),
        isActive: true,
        color: saved.badgeColor || '#c49756',
        ended: false,
        rawStartTime: saved.startTime,
        rawEndTime: saved.endTime,
        type: 'promotion' as const,
        description: saved.description,
        image: saved.image,
        badgeColor: saved.badgeColor,
        minAmount: saved.minAmount ?? undefined,
      },
    ]);
    this.closePromoPanel();
    this.posShowToast(`活動「${saved.name.trim()}」已新增`);
  }

  /* ── 售價調整 ────────────────────────────────────── */
  adjustingPriceId = signal<number | null>(null);
  adjustPriceDraft = signal<number>(0);
  adjustPriceSavedId = signal<number | null>(null);

  startAdjustPrice(productId: number): void {
    const p = this.posStockList().find((x) => x.productId === productId);
    if (!p) return;
    this.adjustingPriceId.set(productId);
    this.adjustPriceDraft.set(p.basePrice);
  }

  cancelAdjustPrice(): void {
    this.adjustingPriceId.set(null);
  }

  onPriceInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 0) this.adjustPriceDraft.set(val);
  }

  confirmAdjustPrice(): void {
    const id = this.adjustingPriceId();
    const price = this.adjustPriceDraft();
    if (id === null) return;
    const p = this.posStockList().find((x) => x.productId === id);
    if (!p) return;
    if (price <= 0) {
      this.posShowToast('⚠️ 售價必須大於 0');
      return;
    }
    const globalAreaId = this.authService.currentStaff?.globalAreaId ?? 4;
    this.posStockList.update((list) =>
      list.map((x) => (x.productId === id ? { ...x, basePrice: price } : x)),
    );
    this.adjustingPriceId.set(null);
    this.adjustPriceSavedId.set(id);
    setTimeout(() => this.adjustPriceSavedId.set(null), 1800);
    this.apiService
      .updateBranchInventory({
        productId: id,
        globalAreaId,
        stockQuantity: p.stockQuantity,
        basePrice: price,
        costPrice: p.costPrice,
        maxOrderQuantity: p.maxOrderQuantity,
        active: p.active,
      })
      .subscribe({
        error: () => console.warn('[POS] 售價同步後端失敗，前端已更新'),
      });
  }

  /* ── 最大購買量調整（調整 → +10/-10 → 確認）──────── */
  adjustingMaxQtyId = signal<number | null>(null);
  adjustMaxQtyDraft = signal<number>(1);
  adjustMaxQtySavedId = signal<number | null>(null);

  startAdjustMaxQty(productId: number): void {
    const p = this.posStockList().find((x) => x.productId === productId);
    if (!p) return;
    this.adjustingMaxQtyId.set(productId);
    this.adjustMaxQtyDraft.set(p.maxOrderQuantity);
  }

  cancelAdjustMaxQty(): void {
    this.adjustingMaxQtyId.set(null);
  }

  onMaxQtyInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 1) this.adjustMaxQtyDraft.set(val);
  }

  stepMaxQty(delta: number): void {
    this.adjustMaxQtyDraft.update((v) => Math.max(1, v + delta));
  }

  confirmAdjustMaxQty(): void {
    const id = this.adjustingMaxQtyId();
    const newQty = this.adjustMaxQtyDraft();
    if (id === null) return;
    const p = this.posStockList().find((x) => x.productId === id);
    if (!p) return;
    const globalAreaId = this.authService.currentStaff?.globalAreaId ?? 4;
    this.posStockList.update((list) =>
      list.map((x) =>
        x.productId === id ? { ...x, maxOrderQuantity: newQty } : x,
      ),
    );
    this.adjustingMaxQtyId.set(null);
    this.adjustMaxQtySavedId.set(id);
    setTimeout(() => this.adjustMaxQtySavedId.set(null), 1800);
    this.apiService
      .updateBranchInventory({
        productId: id,
        globalAreaId,
        stockQuantity: p.stockQuantity,
        basePrice: p.basePrice,
        costPrice: p.costPrice,
        maxOrderQuantity: newQty,
        active: p.active,
      })
      .subscribe({
        error: () => console.warn('[POS] 最大購買量同步後端失敗，前端已更新'),
      });
  }

  /* ── 報電話號碼查詢取餐訂單 ─────────────────────── */
  searchByPhone(): void {
    const rawPhone = this.phoneQuery().trim().replace(/-/g, '');
    if (!rawPhone) {
      this.phoneSearchError.set('請輸入手機號碼');
      return;
    }
    const phone = /^09\d{8}$/.test(rawPhone)
      ? '+886' + rawPhone.slice(1)
      : rawPhone;
    this.phoneSearchLoading.set(true);
    this.phoneSearchDone.set(false);
    this.phoneSearchError.set('');
    this.phoneSearchResults.set([]);
    this.apiService.getOrderByPhone(phone).subscribe({
      next: (res) => {
        this.phoneSearchLoading.set(false);
        this.phoneSearchDone.set(true);
        if (res?.code === 200 && res.getOrderVoList?.length) {
          this.phoneSearchResults.set(res.getOrderVoList);
        } else {
          this.phoneSearchResults.set([]);
        }
      },
      error: () => {
        this.phoneSearchLoading.set(false);
        this.phoneSearchDone.set(true);
        this.phoneSearchError.set('查詢失敗，請確認後端連線');
      },
    });
  }

  clearPhoneSearch(): void {
    this.phoneQuery.set('');
    this.phoneSearchResults.set([]);
    this.phoneSearchDone.set(false);
    this.phoneSearchError.set('');
  }

  /* 判斷訂單是否屬於本分店 */
  isSameBranch(order: import('../shared/api.service').GetOrdersVo): boolean {
    const staffAreaId = this.authService.currentStaff?.globalAreaId;
    return staffAreaId == null || order.globalAreaId === staffAreaId;
  }

  /* 分店長切換至後台管理 */
  goToRmDashboard(): void {
    this.router.navigate(['/rm-dashboard']);
  }

  /* 登出 */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/staff-login']);
  }

  /* ── 員工自改密碼 ────────────────────────────────── */
  changePwOpen = signal(false);
  changePwOld = signal('');
  changePwNew = signal('');
  changePwConfirm = signal('');
  changePwError = signal('');

  /* 密碼顯示切換 */
  showAddStaffPwd  = signal(false);
  showEditStaffPwd = signal(false);
  showChangePwOld  = signal(false);
  showChangePwNew  = signal(false);
  showChangePwConf = signal(false);

  openChangePw(): void {
    this.changePwOld.set('');
    this.changePwNew.set('');
    this.changePwConfirm.set('');
    this.changePwError.set('');
    this.changePwOpen.set(true);
  }

  submitChangePw(): void {
    if (this.changePwNew() !== this.changePwConfirm()) {
      this.changePwError.set('兩次新密碼不一致');
      return;
    }
    if (this.changePwNew().length < 6) {
      this.changePwError.set('新密碼至少 6 位');
      return;
    }
    const staff = this.authService.currentStaff;
    if (!staff) return;
    const req: SelfChangePasswordReq = {
      account: staff.account,
      oldPassword: this.changePwOld(),
      newPassword: this.changePwNew(),
    };
    this.apiService.selfChangePassword(req).subscribe({
      next: () => {
        this.changePwOpen.set(false);
        this.posShowToast('✅ 密碼修改成功');
      },
      error: () => this.changePwError.set('舊密碼錯誤或伺服器異常'),
    });
  }
}

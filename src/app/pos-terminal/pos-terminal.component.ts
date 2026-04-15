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

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../shared/auth.service';
import { OrderService, LiveOrder } from '../shared/order.service';
import { ApiService } from '../shared/api.service';

/* ── 頁籤型別 ──────────────────────────────────────── */
export type PosTab = 'pos' | 'board' | 'stock' | 'promo' | 'staff' | 'report';

/* ── 商品型別 ──────────────────────────────────────── */
interface PosProduct {
  id: number;
  name: string;
  eng: string;
  price: number;
  emoji: string;
  bg: string;
  imgSrc?: string;    /* 實體食物照片路徑（有圖時優先顯示，無圖則 fallback 至 emoji+bg） */
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

/* ── 員工帳號型別 ───────────────────────────────────── */
interface StaffAccount {
  id: number;
  name: string;
  account: string;
  shift: string;
  isActive: boolean;
  lastLogin: string;
}

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pos-terminal.component.html',
  styleUrls: ['./pos-terminal.component.scss']
})
export class PosTerminalComponent implements OnInit, OnDestroy {

  /* ── 即時時鐘 ─────────────────────────────────────── */
  clockStr = signal('');

  /* ── 目前頁籤 ─────────────────────────────────────── */
  activeTab = signal<PosTab>('pos');

  /* ── 付款方式 ─────────────────────────────────────── */
  payMethod = signal<'cash' | 'card' | 'mobile'>('cash');

  /* ── 分類篩選 ─────────────────────────────────────── */
  activeCategory = signal<string>('all');

  /* ── 搜尋關鍵字 ───────────────────────────────────── */
  searchQuery = signal<string>('');

  /* ── 結帳成功狀態 ─────────────────────────────────── */
  checkoutSuccess = signal(false);
  lastOrderNum    = signal('');

  /* ── 購物車 ───────────────────────────────────────── */
  cartItems = signal<CartItem[]>([]);

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.qty, 0)
  );
  /* 合計 = 小計（台灣不另加營業稅） */
  total    = computed(() => this.subtotal());

  showPromoHint = computed(() => this.subtotal() > 0 && this.subtotal() < 300);
  promoRemain   = computed(() => 300 - this.subtotal());

  /* ── 商品清單（Signal 化，支援庫存調整）──────────
   * imgSrc 已移除（POS 改採 SVG 圖示設計）
   * ──────────────────────────────────────────────── */
  products = signal<PosProduct[]>([
    { id: 1, name: '招牌滷肉飯',   eng: 'Braised Pork Rice',         price: 120, emoji: '', bg: 'linear-gradient(135deg,#2d1205,#5c2a10)', badge: 'hot', stock: 48,  category: '台式' },
    { id: 2, name: '古早味排骨飯', eng: 'Pork Chop Rice',            price: 145, emoji: '', bg: 'linear-gradient(135deg,#2d1a05,#5c3a10)', badge: 'hot', stock: 32,  category: '台式' },
    { id: 3, name: '蚵仔煎',       eng: 'Oyster Pancake',            price: 80,  emoji: '', bg: 'linear-gradient(135deg,#2d2005,#5c4510)', badge: 'low', stock: 5,   category: '台式' },
    { id: 4, name: '三杯雞飯',     eng: 'Three-Cup Chicken Rice',    price: 150, emoji: '', bg: 'linear-gradient(135deg,#1e1208,#4a2e10)',               stock: 24,  category: '台式' },
    { id: 5, name: '牛排',         eng: 'Steak',                     price: 280, emoji: '', bg: 'linear-gradient(135deg,#2d0e0a,#5c2018)', badge: 'new', stock: 18,  category: '西式' },
    { id: 6, name: '蚵仔麵線',     eng: 'Oyster Vermicelli',         price: 70,  emoji: '', bg: 'linear-gradient(135deg,#2d1005,#6b2a10)',               stock: 15,  category: '台式' },
    { id: 7, name: '黑糖珍珠奶茶', eng: 'Brown Sugar Boba',          price: 75,  emoji: '', bg: 'linear-gradient(135deg,#0a0805,#2a1a0a)', badge: 'hot', stock: 120, category: '飲品' },
    { id: 8, name: '招牌滷蛋',     eng: 'Marinated Egg',             price: 30,  emoji: '', bg: 'linear-gradient(135deg,#1e1208,#4a2e10)',               stock: 80,  category: '輕食' },
    { id: 9, name: '仙草奶茶',     eng: 'Grass Jelly Milk Tea',      price: 65,  emoji: '', bg: 'linear-gradient(135deg,#051a05,#103010)',               stock: 60,  category: '飲品' },
  ]);

  /* 篩選後商品清單 */
  filteredProducts = computed(() => {
    const cat = this.activeCategory();
    const q   = this.searchQuery().trim().toLowerCase();
    return this.products().filter(p => {
      const catMatch  = cat === 'all' || p.category === cat;
      const nameMatch = q === '' || p.name.toLowerCase().includes(q)
                                 || p.eng.toLowerCase().includes(q);
      return catMatch && nameMatch;
    });
  });

  /* ── 新增員工 Modal 狀態 ──────────────────────────── */
  showAddStaffModal = signal(false);
  newStaffName      = signal('');
  newStaffAccount   = signal('');
  newStaffShift     = signal('早班');

  /* ── 會員/訪客模式 ─────────────────────────────────
   * 'none'   = 未選擇（顯示選擇按鈕）
   * 'member' = 已查詢會員（顯示會員資料 + 折扣進度條）
   * 'guest'  = 訪客（顯示手機號碼輸入欄）
   * ──────────────────────────────────────────────── */
  orderMode          = signal<'none' | 'member' | 'guest'>('none');

  /* 查詢會員用的輸入（email 或手機號碼） */
  memberQuery        = signal('');
  memberQueryError   = signal('');

  /* 查詢到的會員資訊（不含密碼） */
  foundMember        = signal<{ name: string; phone: string; email: string; orderCount: number } | null>(null);

  /* 訪客手機號碼 */
  guestPhone         = signal('');

  /* ── 贈品選擇（與客戶端相同選項，第一項為「不選贈品」）── */
  giftOptions: string[] = ['不需要滿額免費贈品', '招牌滷蛋 × 2', '特製泡菜 × 1', '古早味豆干 × 2'];
  selectedGift = signal<string>('');
  giftDropdownOpen = signal(false);

  toggleGiftDropdown(): void {
    this.giftDropdownOpen.update(v => !v);
  }

  selectGift(gift: string): void {
    this.selectedGift.set(gift);
    this.giftDropdownOpen.set(false);
  }

  /* ── 活動優惠選擇（與客戶端相同門檻與贈品清單）──── */
  readonly PROMO_ACTIVITIES = [
    {
      name: '新會員首單禮',
      minSpend: 150,
      gifts: ['招牌豆漿 × 1', '仙草奶茶 × 1'],
    },
    {
      name: '週末滿額禮',
      minSpend: 300,
      gifts: ['古早味豆干 × 2', '特製泡菜 × 1', '招牌滷蛋 × 2'],
    },
    {
      name: '消費達人大禮包',
      minSpend: 500,
      gifts: ['仙草奶茶 × 1 + 招牌滷蛋 × 2', '特製泡菜 × 1 + 古早味豆干 × 2'],
    },
  ];

  selectedPromoName     = signal<string>('');
  selectedPromoGift     = signal<string>('');
  promoDropdownOpen     = signal(false);
  promoGiftDropdownOpen = signal(false);

  unlockedPromos = computed(() =>
    this.PROMO_ACTIVITIES.filter(p => this.subtotal() >= p.minSpend)
  );

  get selectedPromoActivity() {
    return this.PROMO_ACTIVITIES.find(p => p.name === this.selectedPromoName()) ?? null;
  }

  togglePromoDropdown(): void { this.promoDropdownOpen.update(v => !v); }
  togglePromoGiftDropdown(): void { this.promoGiftDropdownOpen.update(v => !v); }

  selectPromo(name: string): void {
    this.selectedPromoName.set(name);
    this.selectedPromoGift.set('');
    this.promoDropdownOpen.set(false);
    this.promoGiftDropdownOpen.set(false);
  }

  selectPromoGift(gift: string): void {
    this.selectedPromoGift.set(gift);
    this.promoGiftDropdownOpen.set(false);
  }

  /* ── 折扣兌換券（與客戶端相同邏輯）────────────────── */
  useDiscountCoupon = signal(false);

  toggleDiscountCoupon(): void {
    this.useDiscountCoupon.update(v => !v);
  }

  /* 模擬折扣卡累積資料（未來串接 API）
   * phone 存帶 dash 格式，用於顯示；比對時一律去除 dash
   * orderCount：累積訂單次數，每 10 次可兌換一次 8 折折扣券 */
  private readonly MOCK_MEMBER_DISCOUNT: Record<string, { name: string; phone: string; email: string; orderCount: number }> = {
    'test@lazybao.com': { name: '懶飽飽測試會員', phone: '0912-345-678', email: 'test@lazybao.com', orderCount: 9 },
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
    this.selectedGift.set('');
    this.giftDropdownOpen.set(false);
    this.selectedPromoName.set('');
    this.selectedPromoGift.set('');
    this.promoDropdownOpen.set(false);
    this.promoGiftDropdownOpen.set(false);
  }

  /* 查詢會員（比對時去除所有 dash，讓使用者輸入 0912345678 也能找到） */
  lookupMember(): void {
    const q = this.memberQuery().trim();
    if (!q) {
      this.memberQueryError.set('請輸入會員 Email 或手機號碼');
      return;
    }

    // ⚠ TODO [API串接點 - 查詢會員]
    // 後端 MembersController 建立後，取消下方區塊，
    // 並移除下方整個 MOCK_MEMBER_DISCOUNT 比對邏輯：
    // this.apiService.getMemberByPhone(q).subscribe({
    //   next: (member) => {
    //     if (member) {
    //       this.foundMember.set({
    //         name: member.name,
    //         phone: member.phone,
    //         email: '',
    //         orderCount: member.orderCount
    //       });
    //       this.posOrderCount.set(member.orderCount);
    //       this.memberQueryError.set('');
    //     } else {
    //       this.foundMember.set(null);
    //       this.posOrderCount.set(0);
    //       this.memberQueryError.set('查無此會員，請確認手機號碼');
    //     }
    //   },
    //   error: () => this.memberQueryError.set('查詢失敗，請確認後端連線')
    // });
    // return;  // 加上 return 後，下方 mock 邏輯就不會執行

    const normalize = (s: string) => s.replace(/-/g, '');
    const match = Object.values(this.MOCK_MEMBER_DISCOUNT).find(
      m => m.email === q || normalize(m.phone) === normalize(q)
    );
    if (match) {
      this.foundMember.set(match);
      this.posOrderCount.set(match.orderCount);
      this.memberQueryError.set('');
    } else {
      this.foundMember.set(null);
      this.posOrderCount.set(0);
      this.memberQueryError.set('查無此會員，請確認 Email 或手機號碼');
    }
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

  /* ── 庫存調整狀態 ─────────────────────────────────── */
  adjustingStockId     = signal<number | null>(null);
  adjustStockAmount    = signal<number>(0);
  adjustStockSavedId   = signal<number | null>(null);

  /* ── 員工帳號清單（Signal 化） ──────────────────────── */
  staffAccounts = signal<StaffAccount[]>([
    { id: 1, name: '王小明', account: 'wang.xm', shift: '早班',  isActive: true,  lastLogin: '今日 09:00' },
    { id: 2, name: '李佳靜', account: 'lee.jj',  shift: '晚班',  isActive: true,  lastLogin: '昨日 17:00' },
    { id: 3, name: '張偉成', account: 'chang.wc', shift: '假日班', isActive: false, lastLogin: '3天前' },
  ]);

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
    if (!user || (user.role !== 'branch_manager' && user.role !== 'staff')) {
      this.router.navigate(['/staff-login']);
      return;
    }
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    /* 立即拉一次今日訂單，之後每 5 秒輪詢 */
    this._fetchTodayOrders();
    this.boardPollInterval = setInterval(() => this._fetchTodayOrders(), 5000);

    // ⚠ TODO [API串接點 - 載入商品清單]
    // 後端 ProductsController 建立後，取消下方區塊，
    // 並將 products signal 初始值改為空陣列 []：
    // this.apiService.getAllActiveProducts().subscribe({
    //   next: (res) => {
    //     this.products.set(res.products.map(p => ({
    //       id: p.id,
    //       name: p.name,
    //       eng: p.name,                    // 後端若有英文欄位則帶入
    //       price: p.basePrice,
    //       emoji: '',
    //       bg: 'linear-gradient(135deg,#1e1a14,#3a2e20)',
    //       imgSrc: `/api/products/${p.id}/image`,  // BLOB 圖片
    //       stock: p.stockQuantity,
    //       category: p.category
    //     })));
    //   },
    //   error: (err) => console.error('[POS] 載入商品失敗', err)
    // });
  }

  ngOnDestroy(): void {
    if (this.clockInterval !== null) clearInterval(this.clockInterval);
    if (this.boardPollInterval !== null) clearInterval(this.boardPollInterval);
  }

  /* 從後端拉今日訂單，同步至 OrderService */
  private _fetchTodayOrders(): void {
    this.apiService.getTodayOrders().subscribe({
      next: (res) => {
        if (!res?.orders) return;
        const pad = (n: number) => String(n).padStart(2, '0');
        res.orders.forEach(o => {
          const existingId = `DB-${o.orderDateId}-${o.id}`;
          const existing = this.orderService.orders().find(x => x.id === existingId);
          /* 狀態對應：WAITING→waiting, COOKING→cooking, READY→done */
          const statusMap: Record<string, 'waiting' | 'cooking' | 'ready' | 'done'> = {
            WAITING: 'waiting', COOKING: 'cooking', READY: 'done'
          };
          const status = statusMap[o.kitchenStatus] ?? 'waiting';
          const itemTexts = (o.items ?? [])
            .filter(i => !i.gift)
            .map(i => `${i.productName} × ${i.quantity}`);
          if (!existing) {
            /* 新訂單：加入看板 */
            const now = new Date();
            this.orderService.addOrder({
              id: existingId,
              number: `A-${o.id}`,
              status,
              estimatedMinutes: 10,
              items: itemTexts,
              total: Number(o.totalAmount),
              createdAt: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
              payMethod: '線上付款',
              source: 'customer',
              customerName: o.phone,
            } as LiveOrder);
          } else if (existing.status !== status) {
            /* 已存在但狀態有變 → 同步更新 */
            this.orderService.updateStatus(existingId, status);
          }
        });
      },
      error: () => { /* 靜默失敗，下次再重試 */ }
    });
  }

  /* 判斷是否為分店長 */
  get isBM(): boolean {
    return this.authService.currentUser?.role === 'branch_manager';
  }

  /* 更新時鐘 */
  private updateClock(): void {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mo   = String(now.getMonth() + 1).padStart(2, '0');
    const dd   = String(now.getDate()).padStart(2, '0');
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const day  = days[now.getDay()];
    const hh   = String(now.getHours()).padStart(2, '0');
    const mm   = String(now.getMinutes()).padStart(2, '0');
    const ss   = String(now.getSeconds()).padStart(2, '0');
    this.clockStr.set(`${yyyy}/${mo}/${dd} 星期${day} ${hh}:${mm}:${ss}`);
  }

  /* 切換頁籤 */
  setTab(tab: PosTab): void {
    if (tab === 'staff' && !this.isBM) return;
    this.activeTab.set(tab);
  }

  /* 加入購物車 */
  addToCart(product: PosProduct): void {
    const current = this.cartItems();
    const existing = current.find(c => c.id === product.id);
    if (existing) {
      this.cartItems.set(current.map(c =>
        c.id === product.id ? { ...c, qty: c.qty + 1 } : c
      ));
    } else {
      this.cartItems.set([...current, {
        id: product.id,
        name: product.name,
        eng: product.eng,
        price: product.price,
        qty: 1
      }]);
    }
    if (navigator.vibrate) navigator.vibrate(25);
  }

  /* 增減數量 */
  updateQty(id: number, delta: number): void {
    const current = this.cartItems();
    const item = current.find(c => c.id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      this.cartItems.set(current.filter(c => c.id !== id));
    } else {
      this.cartItems.set(current.map(c =>
        c.id === id ? { ...c, qty: newQty } : c
      ));
    }
  }

  /* 清空購物車 */
  clearCart(): void {
    this.cartItems.set([]);
  }

  /* ── 現金計算器狀態 ───────────────────────────────── */
  showCashCalc   = signal(false);     /* 是否顯示現金計算鍵盤 */
  cashInput      = signal('');        /* 收銀員輸入的收取金額（字串） */

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
    const c100  = Math.ceil(t / 100) * 100;
    const c500  = Math.ceil(t / 500) * 500;
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
      this.cashInput.update(v => v.slice(0, -1));
      return;
    }
    /* 限制最大 6 位數 */
    if (this.cashInput().length >= 6) return;
    this.cashInput.update(v => v + key);
  }

  /* 快速金額按鈕 */
  setCashAmount(amount: number): void {
    this.cashInput.set(String(amount));
  }

  /* 點擊結帳：若選現金 → 顯示計算器；其他方式直接結帳 */
  onCheckoutClick(): void {
    if (this.cartItems().length === 0) return;
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

  /* ── 確認結帳：推送至 OrderService ─────────────────── */
  confirmCheckout(): void {
    if (this.cartItems().length === 0) return;

    // ⚠ TODO [API串接點 - POS 下單與結帳]
    // 串接後，在此處加入後端 createOrder → pay 流程：
    // const user = this.authService.currentUser;
    // const member = this.foundMember();
    // this.apiService.createOrder({
    //   cartId: 0,                               // 0 = 讓後端建立新購物車
    //   globalAreaId: 1,                         // 需從登入資訊取得 global_area_id
    //   memberId: member ? /* member.id */ 0 : 0,
    //   phone: this.orderMode() === 'guest'
    //            ? this.guestPhone()
    //            : (member?.phone ?? ''),
    //   paymentMethod: this.payMethod() === 'cash'   ? 'CASH'
    //                : this.payMethod() === 'card'   ? 'CREDIT_CARD'
    //                : 'MOBILE_PAY'
    // }).subscribe({
    //   next: (orderRes) => {
    //     this.apiService.pay({
    //       orderId: orderRes.orderId,
    //       orderDateId: orderRes.orderDateId
    //     }).subscribe({
    //       next: () => { /* 清空購物車 + 顯示成功 */ },
    //       error: () => console.error('[POS] 結帳失敗')
    //     });
    //   },
    //   error: () => console.error('[POS] 建立訂單失敗')
    // });

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const orderNum = this.orderService.generateOrderNumber();
    const orderId  = this.orderService.generateOrderId();
    const itemTexts = this.cartItems().map(i => `${i.name} × ${i.qty}`);

    /* 若有滿額贈品（且非「不需要」），一併加入品項列表 */
    const gift = this.selectedGift();
    if (gift && gift !== '不需要滿額免費贈品') {
      itemTexts.push(`${gift}（滿額贈品）`);
    }

    /* 若有選擇活動贈品，加入品項列表 */
    const promoGift = this.selectedPromoGift();
    if (promoGift) {
      itemTexts.push(`${promoGift}（活動贈品）`);
    }

    const totalQty  = this.cartItems().reduce((s, i) => s + i.qty, 0);
    const estMin    = Math.max(5, Math.ceil(totalQty * 2));
    const payLabels: Record<string, string> = { cash: '現金', card: '信用卡', mobile: '行動支付' };

    this.orderService.addOrder({
      id:               orderId,
      number:           orderNum,
      status:           'waiting',
      estimatedMinutes: estMin,
      items:            itemTexts,
      total:            this.discountedTotal,
      createdAt:        timeStr,
      payMethod:        payLabels[this.payMethod()],
      source:           'pos',
      customerName:     this.authService.currentUser?.name
    });

    this.lastOrderNum.set(orderNum);
    this.clearCart();
    this.showCashCalc.set(false);
    this.cashInput.set('');

    /* 更新會員訂單次數：使用折扣券 → 重設為 1；未使用 → +1（上限 10，不超過） */
    if (this.foundMember()) {
      if (this.useDiscountCoupon()) {
        this.posOrderCount.set(1);
      } else {
        this.posOrderCount.update(c => Math.min(c + 1, 10));
      }
    }

    /* 重置折扣券 & 贈品 & 活動選擇 */
    this.useDiscountCoupon.set(false);
    this.selectedGift.set('');
    this.giftDropdownOpen.set(false);
    this.selectedPromoName.set('');
    this.selectedPromoGift.set('');
    this.promoDropdownOpen.set(false);
    this.promoGiftDropdownOpen.set(false);

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
  private _pushKitchenStatus(orderId: string, kitchenStatus: 'COOKING' | 'READY'): void {
    /* DB 訂單 id 格式：DB-{orderDateId}-{id}，例如 DB-20260413-0001 */
    const match = orderId.match(/^DB-(\d{8})-(\d+)$/);
    if (!match) return; /* mock 訂單不推送 */
    this.apiService.updateKitchenStatus({
      id: match[2],
      orderDateId: match[1],
      kitchenStatus,
    }).subscribe({ error: () => console.warn('[POS] kitchen_status 更新失敗') });
  }

  /* ── 庫存調整 ─────────────────────────────────────── */
  startAdjustStock(productId: number): void {
    const p = this.products().find(p => p.id === productId);
    if (!p) return;
    this.adjustingStockId.set(productId);
    this.adjustStockAmount.set(p.stock);
  }

  cancelAdjustStock(): void {
    this.adjustingStockId.set(null);
  }

  onAdjustInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 0) this.adjustStockAmount.set(val);
  }

  confirmAdjustStock(): void {
    const id  = this.adjustingStockId();
    const amt = this.adjustStockAmount();
    if (id === null) return;
    this.products.update(list =>
      list.map(p => p.id === id ? { ...p, stock: amt } : p)
    );
    this.adjustingStockId.set(null);
    /* 短暫顯示已儲存提示 */
    this.adjustStockSavedId.set(id);
    setTimeout(() => this.adjustStockSavedId.set(null), 1800);
    // ⚠ TODO [API串接點 - 調整分店庫存]
    // branch_inventory 資料表儲存「分店 × 商品」的庫存。
    // 後端若有獨立庫存 API，取消下方區塊（需後端新增庫存更新端點）：
    // this.apiService.updateBranchStock({
    //   globalAreaId: /* 從登入資訊取得 */,
    //   productId: id,
    //   stockQuantity: amt
    // }).subscribe({
    //   next: () => console.log('[POS] 庫存已同步至後端'),
    //   error: () => console.error('[POS] 庫存更新失敗')
    // });
  }

  /* ── 員工帳號：新增 Modal ────────────────────────── */
  openAddStaff(): void {
    this.newStaffName.set('');
    this.newStaffAccount.set('');
    this.newStaffShift.set('早班');
    this.showAddStaffModal.set(true);
  }

  cancelAddStaff(): void {
    this.showAddStaffModal.set(false);
  }

  confirmAddStaff(): void {
    const name    = this.newStaffName().trim();
    const account = this.newStaffAccount().trim();
    if (!name || !account) return;
    const newId = Math.max(...this.staffAccounts().map(s => s.id)) + 1;
    this.staffAccounts.update(list => [...list, {
      id:        newId,
      name,
      account,
      shift:     this.newStaffShift(),
      isActive:  true,
      lastLogin: '剛建立'
    }]);
    this.showAddStaffModal.set(false);
  }

  /* ── 員工帳號：停/復權 ────────────────────────────── */
  toggleStaff(id: number): void {
    this.staffAccounts.update(list =>
      list.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    );
  }

  /* 登出 */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/staff-login']);
  }
}

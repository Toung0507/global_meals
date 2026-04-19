/*
 * =====================================================
 * 檔案名稱：customer-home.component.ts
 * 位置說明：src/app/customer-home/customer-home.component.ts
 * 用途說明：客戶端登入後的主頁框架（Shell）
 * 功能說明：
 *   - 底部導覽列（主頁 / 菜單 / 結帳 / 追蹤 / 訂單管理）
 *   - 登入保護守衛（未登入者自動跳回登入頁）
 *   - 購物車狀態管理（供菜單、結帳頁共用）
 *   - 頁籤切換狀態管理
 *   - 下單後透過 OrderService 即時推送至 POS 看板
 * =====================================================
 */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
// import { RouterLink } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { LoadingService } from '../shared/loading.service';
import { OrderService } from '../shared/order.service';
import { firstValueFrom } from 'rxjs';
import { ApiService, GetOrdersVo, CartSyncReq, CreateOrdersReq, PayReq, CartRemoveReq, CartClearReq } from '../shared/api.service';
import { DEMO_BASE_URL } from '../shared/demo.config';
import { BranchService, CountryCode, CountryConfig } from '../shared/branch.service';

/* ── 購物車品項型別 ─────────────────────────────────── */
export interface CartItem {
  id: number;
  name: string;
  nameEn: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  note?: string;
}

/* ── 菜單品項型別 ─────────────────────────────────────── */
export interface MenuItem {
  id: number;
  name: string;
  nameEn: string;
  price: number;
  image: string;
  category: string;
  categoryEn: string;
  description: string;
  isHot?: boolean;
  isNew?: boolean;
  stock: number;
}

/* ── 訂單追蹤型別 ─────────────────────────────────────── */
export interface TrackingOrder {
  id: string;
  number: string;
  status: 'waiting' | 'cooking' | 'ready' | 'done';
  estimatedMinutes: number;
  items: string[];
  total: number;
  createdAt: string;
}

/* ── 頁籤型別 ──────────────────────────────────────────── */
export type TabId =
  | 'home'
  | 'menu'
  | 'checkout'
  | 'payment'
  | 'tracker'
  | 'orders'
  | 'promotions';

/* ── 頁籤定義型別 ──────────────────────────────────────── */
interface NavTab {
  id: TabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss'],
})
export class CustomerHomeComponent implements OnInit, OnDestroy {
  /* ── 當前頁籤 ───────────────────────────────────────── */
  activeTab = signal<TabId>('home');

  /* ── 首頁輪播 ───────────────────────────────────────── */
  heroSlideIndex = signal(0);
  readonly HERO_SLIDE_COUNT = 3;
  private heroTimer: ReturnType<typeof setInterval> | null = null;
  private heroPaused = false;

  /* ── 促銷橫幅輪播 ────────────────────────────────────── */
  promoBannerIndex = signal(0);
  private promoBannerTimer: ReturnType<typeof setInterval> | null = null;

  prevHeroSlide(): void {
    this.heroSlideIndex.update(
      (i) => (i - 1 + this.HERO_SLIDE_COUNT) % this.HERO_SLIDE_COUNT,
    );
  }

  nextHeroSlide(): void {
    this.heroSlideIndex.update((i) => (i + 1) % this.HERO_SLIDE_COUNT);
  }

  goToHeroSlide(index: number): void {
    this.heroSlideIndex.set(index);
  }

  pauseCarousel(): void {
    this.heroPaused = true;
  }

  resumeCarousel(): void {
    this.heroPaused = false;
  }

  /* ── 購物車 ─────────────────────────────────────────── */
  cartItems = signal<CartItem[]>([]);
  currentCartId = signal<number | null>(null);

  cartCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0),
  );

  cartTotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  /* ── 訪客判斷 ──────────────────────────────────────── */
  isGuest = computed(() => !!this.authService.currentUser?.isGuest);

  /* ── 身分識別格式化 ────────────────────────────── */
  userRoleLabel = computed(() => {
    const user = this.authService.currentUser;
    if (!user) return '';
    if (user.isGuest) return '訪客';
    return '會員';
  });

  formattedName = computed(() => {
    const user = this.authService.currentUser;
    if (!user) return '未登入';
    if (user.isGuest && user.phone) {
      return `訪客「${user.phone}」`;
    }
    return user.name || '無名氏';
  });

  /* ── 菜單：分類篩選 & 搜尋 ────────────────────────── */
  activeMenuCategory = signal<string>('all');
  menuSearchQuery = signal<string>('');

  setMenuCategory(cat: string): void {
    this.activeMenuCategory.set(cat);
  }

  onMenuSearch(event: Event): void {
    this.menuSearchQuery.set((event.target as HTMLInputElement).value);
  }

  /** 回傳該品項是否應顯示（分類 + 名稱模糊搜尋） */
  isMenuItemShown(name: string, category: string): boolean {
    const cat = this.activeMenuCategory();
    const q = this.menuSearchQuery().trim().toLowerCase();
    const catMatch = cat === 'all' || cat === category;
    const nameMatch = q === '' || name.toLowerCase().includes(q);
    return catMatch && nameMatch;
  }

  /** 回傳整個分類區塊是否應顯示（只要有任一品項符合篩選即顯示） */
  isSectionShown(
    sectionItems: Array<{ name: string; category: string }>,
  ): boolean {
    return sectionItems.some((item) =>
      this.isMenuItemShown(item.name, item.category),
    );
  }

  /* ── 側邊欄：個人資料抽屜狀態 ────────────────────── */
  isProfileExpanded = signal(false);
  isEditingProfile = signal(false);

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  /* ── 結帳：付款方式選擇 ────────────────────────────── */
  paymentMethod = signal<'credit' | 'mobile' | 'cash'>('cash');

  /* ── 訂單備註（暫停使用，以電話號碼欄取代）────────────── */
  orderNote = signal('');

  /* ── 電話號碼（結帳用）─────────────────────────────────
   * 會員：ngOnInit 自動填入 currentUser.phone
   * 訪客：空白，為必填欄位（提交前需驗證）
   * ────────────────────────────────────────────────── */
  phoneNumber = signal('');

  /** 訪客時電話為必填；會員時有預設值但可修改（均不能為空） */
  isPhoneValid = computed(() => this.phoneNumber().trim().length > 0);

  /* ── 信用卡表單 ─────────────────────────────────────────
   * Demo 假卡：4532 1234 5678 9012 / 12/28 / CVV:123
   * ─────────────────────────────────────────────────── */
  cardNumber  = signal('');
  cardExpiry  = signal('');
  cardCvv     = signal('');
  cardHolder  = signal('');
  cardFlipped = signal(false);   /* true = 顯示卡背面（CVV 輸入中） */

  /** 四欄均完整才視為有效 */
  isCreditCardValid = computed(() => {
    const num = this.cardNumber().replace(/\s/g, '');
    return (
      num.length === 16 &&
      /^\d{2}\/\d{2}$/.test(this.cardExpiry()) &&
      this.cardCvv().replace(/\D/g, '').length >= 3 &&
      this.cardHolder().trim().length > 0
    );
  });

  /** 格式化卡號：每 4 碼加空格 */
  onCardNumberInput(val: string): void {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    this.cardNumber.set(clean.match(/.{1,4}/g)?.join(' ') ?? clean);
  }

  /** 格式化到期日：第 3 碼前自動插入斜線 */
  onCardExpiryInput(val: string): void {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    this.cardExpiry.set(
      clean.length >= 3 ? clean.slice(0, 2) + '/' + clean.slice(2) : clean
    );
  }

  onCardCvvFocus(): void  { this.cardFlipped.set(true);  }
  onCardCvvBlur(): void   { this.cardFlipped.set(false); }
  onCvvInput(value: string): void { this.cardCvv.set(value.replace(/\D/g, '').slice(0, 4)); }

  /* ── 行動支付 QR Modal ──────────────────────────────── */
  showMobilePayModal  = signal(false);
  mobilePayCompleted  = signal(false);
  private mobilePayTimer: ReturnType<typeof setTimeout> | null = null;

  openMobilePayModal(): void {
    this.showMobilePayModal.set(true);
    this.mobilePayCompleted.set(false);
  }

  /** 使用者在 Modal 按下「確認付款」→ 顯示成功動畫 → 自動送出訂單 */
  completeMobilePayment(): void {
    this.mobilePayCompleted.set(true);
    this.mobilePayTimer = setTimeout(() => {
      this.showMobilePayModal.set(false);
      this._doPlaceOrder();
      this.isPlacingOrder.set(false);
    }, 2200);
  }

  closeMobilePayModal(): void {
    this.showMobilePayModal.set(false);
    this.mobilePayCompleted.set(false);
    if (this.mobilePayTimer) {
      clearTimeout(this.mobilePayTimer);
      this.mobilePayTimer = null;
    }
  }

  /* ── 下單中狀態（true 時按鈕顯示 spinner，防止重複送出） */
  isPlacingOrder = signal(false);

  setPaymentMethod(method: 'credit' | 'mobile' | 'cash'): void {
    this.paymentMethod.set(method);
  }

  toggleProfile(): void {
    if (this.isGuest()) return;
    this.isProfileExpanded.update((v) => !v);
    if (!this.isProfileExpanded()) {
      this.isEditingProfile.set(false);
      this.showPassword.set(false);
      this.showConfirmPassword.set(false);
    }
  }

  toggleEditProfile(): void {
    this.isEditingProfile.update((v) => !v);
    if (!this.isEditingProfile()) {
      this.showPassword.set(false);
      this.showConfirmPassword.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  /* ── 今日優惠橫向滾動 ───────────────────────────────── */
  scrollDeals(el: HTMLElement): void {
    /* 每次滾動一張卡片寬度（240px 卡片 + 12px gap） */
    el.scrollBy({ left: 252, behavior: 'smooth' });
  }

  scrollDealsLeft(el: HTMLElement): void {
    el.scrollBy({ left: -252, behavior: 'smooth' });
  }

  /* ── 活動優惠選擇（每個活動有獨立贈品清單）─────────── */
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

  /* 活動專區展示資料（含完整圖片、日期、文案） */
  readonly PROMO_DISPLAY = [
    {
      name: '新會員首單禮',
      tag: '新會員限定',
      tagType: 'new',
      image: '/assets/主頁輪播圖1.jpg',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      minSpend: 150,
      gifts: ['招牌豆漿 × 1', '仙草奶茶 × 1'],
      description: '首次在懶飽飽下單的新會員，單筆消費滿 NT$150 即可獲得精選贈品一份！不論您喜歡台灣在地風味還是跨國美食，這份專屬歡迎禮都是我們對您最誠摯的招待，讓您第一口就愛上懶飽飽。',
      highlights: ['首次消費即享', '任選一項贈品', '限首筆訂單使用', '可與菜單折扣並用'],
    },
    {
      name: '週末滿額禮',
      tag: '期間限定',
      tagType: 'promo',
      image: '/assets/主頁輪播圖2.jpg',
      startDate: '2026-04-05',
      endDate: '2026-05-31',
      minSpend: 300,
      gifts: ['古早味豆干 × 2', '特製泡菜 × 1', '招牌滷蛋 × 2'],
      description: '每逢週末，單筆消費滿 NT$300 即可選一份豐盛贈品！不論是和家人一起享用還是獨自犒賞自己，懶飽飽都準備了最道地的台灣小吃作為感謝禮，讓每個週末都過得更加美味。',
      highlights: ['僅限週六、日適用', '消費滿 NT$300', '三款贈品任選一', '每筆訂單限贈一次'],
    },
    {
      name: '消費達人大禮包',
      tag: '限時豪禮',
      tagType: 'premium',
      image: '/assets/主頁輪播圖3.jpg',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      minSpend: 500,
      gifts: ['仙草奶茶 × 1 + 招牌滷蛋 × 2', '特製泡菜 × 1 + 古早味豆干 × 2'],
      description: '單筆消費滿 NT$500，立享雙重組合贈品！這是懶飽飽為美食達人精心準備的超值回饋，豐盛組合讓您一次享受多種在地好味道，越吃越過癮，本月限定不容錯過。',
      highlights: ['本月限定活動', '消費滿 NT$500', '兩款組合禮任選一', '可搭配折扣券使用'],
    },
  ];

  /* 活動專區詳情 Modal */
  promoDetailIndex = signal<number | null>(null);

  openPromoDetail(index: number): void {
    this.promoDetailIndex.set(index);
  }

  closePromoDetail(): void {
    this.promoDetailIndex.set(null);
  }

  get selectedPromoDetail() {
    const i = this.promoDetailIndex();
    return i !== null ? this.PROMO_DISPLAY[i] : null;
  }

  /* 已選活動名稱（'' = 未選, '不參加活動優惠' = 放棄） */
  selectedPromoName  = signal<string>('');
  /* 已選活動內的贈品 */
  selectedPromoGift  = signal<string>('');
  /* 結帳頁綠色贈品面板是否展開 */
  promoGiftPanelOpen = signal(false);
  /* 菜單頁各活動進度條的展開狀態（key = 活動名稱） */
  promoProgressExpanded = signal<Record<string, boolean>>({});
  /* 菜單頁：整個活動抽屜是否展開 */
  promoDrawerOpen = signal<boolean>(false);

  /* 根據目前小計，篩出已達門檻的活動 */
  unlockedPromos = computed(() =>
    this.PROMO_ACTIVITIES.filter(p => this.cartTotal() >= p.minSpend)
  );

  /* 目前選中的活動物件 */
  get selectedPromoActivity() {
    return this.PROMO_ACTIVITIES.find(p => p.name === this.selectedPromoName()) ?? null;
  }

  /* 菜單頁：整個活動抽屜展開/收折 */
  togglePromoDrawer(): void {
    this.promoDrawerOpen.update(v => !v);
  }

  /* 菜單頁：切換特定活動進度條的展開/收折（抽屜內部） */
  togglePromoProgressBar(name: string): void {
    this.promoProgressExpanded.update(v => ({ ...v, [name]: !v[name] }));
  }

  isPromoBarExpanded(name: string): boolean {
    return this.promoProgressExpanded()[name] ?? false;
  }

  /* 菜單頁：已達門檻的活動數量 */
  get promoCompletedCount(): number {
    return this.PROMO_ACTIVITIES.filter(p => this.cartTotal() >= p.minSpend).length;
  }

  /* 結帳頁：切換綠色贈品面板 */
  togglePromoGiftPanel(): void {
    this.promoGiftPanelOpen.update(v => !v);
  }

  selectPromo(name: string): void {
    this.selectedPromoName.set(name);
    this.selectedPromoGift.set('');   /* 切換活動時重置贈品選擇 */
    this.promoGiftPanelOpen.set(true); /* 自動展開贈品面板 */
  }

  selectPromoGift(gift: string): void {
    this.selectedPromoGift.set(gift);
    this.promoGiftPanelOpen.set(false); /* 選完自動收折 */
  }

  /* ── 訂單預覽彈出視窗 ─────────────────────────────────── */
  showOrderPreview = signal(false);

  openOrderPreview(): void {
    if (this.cartItems().length === 0) return;
    /* 訪客必須填入電話號碼才能送出 */
    if (!this.isPhoneValid()) return;
    this.showOrderPreview.set(true);
  }

  closeOrderPreview(): void { this.showOrderPreview.set(false); }

  goToPayment(): void {
    this.showOrderPreview.set(false);
    this.setTab('payment');
  }

  /* 取消本次訂單：清空購物車並回到首頁 */
  cancelCurrentOrder(): void {
    this.clearCart();
    this.selectedPromoName.set('');
    this.selectedPromoGift.set('');
    this.promoGiftPanelOpen.set(false);
    this.useDiscountCoupon.set(false);
    /* 重置信用卡表單 */
    this.cardNumber.set('');
    this.cardExpiry.set('');
    this.cardCvv.set('');
    this.cardHolder.set('');
    this.cardFlipped.set(false);
    /* 重置行動支付 Modal */
    this.closeMobilePayModal();
    this.setTab('home');
  }

  /* ── 折扣兌換券 ─────────────────────────────────────── */
  useDiscountCoupon = signal(false);

  toggleDiscountCoupon(): void {
    this.useDiscountCoupon.update((v) => !v);
  }

  /* ── 側邊欄：進度與折扣邏輯 (模擬 Database) ────────── */
  memberOrderCount = signal(9);

  ordersUntilDiscount = computed(() => {
    const total = this.memberOrderCount();
    const remainder = total % 10;
    if (remainder === 0 && total > 0) return 0;
    return 10 - remainder;
  });

  hasDiscountReady = computed(() => {
    return this.memberOrderCount() > 0 && this.memberOrderCount() % 10 === 0;
  });

  /* 8折後總計（使用折扣券時才生效） */
  discountedTotal = computed(() => {
    if (this.useDiscountCoupon()) {
      return Math.round(this.cartTotal() * 0.8);
    }
    return this.cartTotal();
  });

  /* 折扣省下金額 */
  discountAmount = computed(() => {
    return this.cartTotal() - this.discountedTotal();
  });

  /* 行動支付 QR Code URL（手機掃碼後開啟的付款確認頁） */
  mobilePayUrl = computed(() => {
    const items = this.cartItems().map(i => ({ name: i.name, qty: i.quantity, price: i.price }));
    const params = new URLSearchParams({
      store: '懶飽飽 Lazy BaoBao',
      amount: this.discountedTotal().toString(),
      items: JSON.stringify(items),
      'ngrok-skip-browser-warning': 'true',
    });
    return `${DEMO_BASE_URL}/mobile-pay?${params.toString()}`;
  });

  /* ── 即時追蹤訂單（從 OrderService 取得最新客戶訂單） ── */
  trackingOrder = computed<TrackingOrder | null>(() => {
    const o = this.orderService.latestCustomerOrder();
    if (!o) return null;
    return {
      id: o.id,
      number: o.number,
      status: o.status,
      estimatedMinutes: o.estimatedMinutes,
      items: o.items,
      total: o.total,
      createdAt: o.createdAt,
    };
  });

  /* ── 底部導覽列定義 ───────────────────────────────── */
  private readonly ALL_TABS: NavTab[] = [
    { id: 'home', label: '首頁', icon: 'home' },
    { id: 'menu', label: '菜單', icon: 'menu' },
    { id: 'checkout', label: '購物車', icon: 'checkout' },
    { id: 'tracker', label: '訂單追蹤', icon: 'tracker' },
    { id: 'orders', label: '我的訂單', icon: 'orders' },
    { id: 'promotions', label: '活動專區', icon: 'promotions' },
  ];

  navTabs = computed<NavTab[]>(() =>
    this.isGuest()
      ? this.ALL_TABS.filter((t) => t.id !== 'orders')
      : this.ALL_TABS,
  );

  /* ── 訂單管理資料 ──────────────────────────────────── */
  activeOrderTab = signal<'completed' | 'cancelled' | 'refunded'>('completed');

  /* ── 退款申請 Modal ─────────────────────────────────── */
  refundModalOpen = signal(false);
  refundTargetOrder = signal<{ id: string; total: number } | null>(null);
  refundSubmitted = signal(false);

  refundReasons = signal([
    { id: 'r1', label: '餐點品項錯誤（與訂單內容不符）', checked: false },
    { id: 'r2', label: '食物有異物或異味', checked: false },
    { id: 'r3', label: '食物未熟透或過度烹調', checked: false },
    { id: 'r4', label: '份量明顯不足', checked: false },
    { id: 'r5', label: '餐點送達時已嚴重冷卻', checked: false },
    { id: 'r6', label: '包裝破損，影響食品衛生', checked: false },
    { id: 'r7', label: '含有過敏原且未事先告知', checked: false },
  ]);
  refundOtherText = signal('');

  hasRefundSelection = computed(() =>
    this.refundReasons().some((r) => r.checked) || this.refundOtherText().trim().length > 0
  );

  openRefundModal(order: { id: string; total: number }): void {
    this.refundTargetOrder.set(order);
    this.refundReasons.update((list) => list.map((r) => ({ ...r, checked: false })));
    this.refundOtherText.set('');
    this.refundSubmitted.set(false);
    this.refundModalOpen.set(true);
  }

  closeRefundModal(): void {
    this.refundModalOpen.set(false);
    this.refundTargetOrder.set(null);
  }

  toggleRefundReason(id: string): void {
    this.refundReasons.update((list) =>
      list.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r))
    );
  }

  updateRefundOther(value: string): void {
    this.refundOtherText.set(value);
  }

  submitRefund(): void {
    if (!this.hasRefundSelection()) return;
    const orderId = this.refundTargetOrder()?.id;
    // ⚠ TODO [API串接點]：呼叫 apiService.requestRefund({ orderId, reasons, other })
    console.log('[退款申請]', orderId, this.refundReasons().filter(r => r.checked).map(r => r.label), this.refundOtherText());
    this.refundSubmitted.set(true);
    setTimeout(() => {
      this.closeRefundModal();
    }, 2000);
  }

  orderHistoryList = signal([
    {
      id: 'LBB-20260115-001',
      date: '2026-01-15',
      items: '紅燒牛肉麵 × 1、滷蛋 × 2',
      total: 185,
      status: 'completed',
    },
    {
      id: 'LBB-20260210-002',
      date: '2026-02-10',
      items: '三杯雞飯 × 1、味噌湯 × 1',
      total: 150,
      status: 'completed',
    },
    {
      id: 'LBB-20260301-003',
      date: '2026-03-01',
      items: '咖哩雞飯 × 1、珍珠奶茶 × 2、小菜 × 1',
      total: 320,
      status: 'completed',
    },
    {
      id: 'LBB-20260318-004',
      date: '2026-03-18',
      items: '麻辣燙 × 1、白飯 × 1',
      total: 175,
      status: 'completed',
    },
    {
      id: 'LBB-20260325-005',
      date: '2026-03-25',
      items: '越南河粉 × 1、春捲 × 3',
      total: 210,
      status: 'completed',
    },
    {
      id: 'LBB-20260401-006',
      date: '2026-04-01',
      items: '印度咖哩飯 × 2、饢餅 × 1、優格飲 × 2',
      total: 395,
      status: 'completed',
    },
    {
      id: 'LBB-20260308-007',
      date: '2026-03-08',
      items: '鐵板燒套餐 × 2、冬瓜茶 × 2',
      total: 480,
      status: 'cancelled',
    },
    {
      id: 'LBB-20260220-008',
      date: '2026-02-20',
      items: '紅油抄手 × 2',
      total: 120,
      status: 'refunded',
    },
  ]);

  completedCount = computed(
    () =>
      this.orderHistoryList().filter((o) => o.status === 'completed').length,
  );
  cancelledCount = computed(
    () =>
      this.orderHistoryList().filter((o) => o.status === 'cancelled').length,
  );
  refundedCount = computed(
    () => this.orderHistoryList().filter((o) => o.status === 'refunded').length,
  );

  filteredOrders = computed(() => {
    return this.orderHistoryList().filter(
      (o) => o.status === this.activeOrderTab(),
    );
  });

  /* ── 國家切換 ──────────────────────────────────────── */
  allCountries = signal<CountryConfig[]>([]);
  activeCountry = signal<CountryCode>('TW');

  constructor(
    private router: Router,
    public authService: AuthService,
    private loadingService: LoadingService,
    public orderService: OrderService,
    private apiService: ApiService,
    private branchService: BranchService,
  ) {}

  selectCountry(code: CountryCode): void {
    this.branchService.setCountry(code);
    this.activeCountry.set(code);
  }

  ngOnInit(): void {
    if (!this.authService.currentUser) {
      this.authService.loginAsGuest('');
    }
    this.branchService.init();
    this.allCountries.set(this.branchService.allCountries);
    this.activeCountry.set(this.branchService.country);
    /* 啟動首頁輪播自動播放（5 秒換一張） */
    this.heroTimer = setInterval(() => {
      if (!this.heroPaused) {
        this.heroSlideIndex.update((i) => (i + 1) % this.HERO_SLIDE_COUNT);
      }
    }, 5000);

    /* 啟動促銷橫幅自動輪播（3 秒換一則活動） */
    this.promoBannerTimer = setInterval(() => {
      this.promoBannerIndex.update((i) => (i + 1) % this.PROMO_ACTIVITIES.length);
    }, 3000);

    /* 會員自動填入電話號碼（訪客保持空白，為必填） */
    const user = this.authService.currentUser;
    if (user && !user.isGuest && user.phone) {
      this.phoneNumber.set(user.phone);
    }

    // ⚠ TODO [API串接點 - 載入菜單商品]
    // 後端 ProductsController 建立後，取消下方區塊：
    // this.apiService.getAllActiveProducts().subscribe({
    //   next: (res) => {
    //     this.menuItems.set(res.products.map(p => ({
    //       id: p.id,
    //       name: p.name,
    //       nameEn: p.name,                // 後端若有英文名欄位則帶入
    //       price: p.basePrice,
    //       image: `/api/products/${p.id}/image`,  // BLOB 圖片路徑
    //       category: p.category,
    //       categoryEn: p.category,
    //       description: p.description ?? '',
    //       stock: p.stockQuantity,
    //       isActive: p.isActive
    //     })));
    //   },
    //   error: (err) => console.error('[Customer] 載入菜單失敗', err)
    // });

    /* 載入真實歷史訂單（僅會員，訪客跳過）
     * ⚠ 需後端 MembersController 建立後，memberId 才會對應真實資料庫 ID
     * 目前 AuthService 的 mock 帳號 id=1 為訪客預設，登入後 id 若有值則嘗試取得 */
    const userForOrders = this.authService.currentUser;
    if (!userForOrders?.isGuest && userForOrders?.id && userForOrders.id > 0) {
      this.apiService.getAllOrders({ memberId: userForOrders.id }).subscribe({
        next: (res) => {
          if (res?.getOrderVoList?.length) {
            this.orderHistoryList.set(res.getOrderVoList.map((o: GetOrdersVo) => ({
              id: o.id,
              date: o.completedAt?.slice(0, 10) ?? '',
              items: (o.getOrdersDetailVoList ?? [])
                .map(d => `${d.productName} × ${d.quantity}`)
                .join('、'),
              total: +o.totalAmount,
              status: o.status === 'COMPLETED' ? 'completed' as const
                    : o.status === 'CANCELLED' ? 'cancelled' as const
                    : o.status === 'REFUNDED'  ? 'refunded'  as const
                    : 'completed' as const
            })));
          }
          /* 若後端回空清單，保留 mock 歷史訂單供 Demo 使用 */
        },
        error: () => console.warn('[Customer] 訂單歷史 API 連線失敗，使用 Demo 資料')
      });
    }
  }

  /* 客戶端廚房狀態輪詢計時器 */
  private statusPollInterval: ReturnType<typeof setInterval> | null = null;
  /* 目前追蹤中訂單的 DB 識別碼 */
  private _activeOrderDbId: { id: string; orderDateId: string } | null = null;

  ngOnDestroy(): void {
    if (this.heroTimer) clearInterval(this.heroTimer);
    if (this.promoBannerTimer) clearInterval(this.promoBannerTimer);
    if (this.mobilePayTimer) clearTimeout(this.mobilePayTimer);
    if (this.statusPollInterval) clearInterval(this.statusPollInterval);
  }

  /* ── 切換頁籤 ─────────────────────────────────────── */
  setTab(tab: TabId): void {
    if (tab === 'orders' && this.isGuest()) {
      return;
    }
    this.activeTab.set(tab);
  }

  /* ── 加入購物車 ──────────────────────────────────── */
  addToCart(item: MenuItem): void {
    const current = this.cartItems();
    const existing = current.find((c) => c.id === item.id);
    const newQty = existing ? existing.quantity + 1 : 1;
    if (existing) {
      this.cartItems.set(
        current.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      this.cartItems.set([
        ...current,
        {
          id: item.id,
          name: item.name,
          nameEn: item.nameEn,
          price: item.price,
          quantity: 1,
          image: item.image,
          category: item.category,
        },
      ]);
    }
    if (navigator.vibrate) navigator.vibrate(30);
    this._syncCartItemToBackend(item.id, newQty);
  }

  private _syncCartItemToBackend(productId: number, quantity: number): void {
    const user = this.authService.currentUser;
    const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
    const req: CartSyncReq = {
      cartId: this.currentCartId(),
      globalAreaId: 1,
      productId,
      quantity,
      operationType: 'CUSTOMER',
      memberId,
    };
    this.apiService.syncCart(req).subscribe({
      next: (res) => this.currentCartId.set(res.cartId),
      error: (err) => console.warn('[Cart] sync_item 失敗', err),
    });
  }

  /* ── 更新購物車數量 ──────────────────────────────── */
  updateCartQuantity(id: number, delta: number): void {
    const current = this.cartItems();
    const item = current.find((c) => c.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.cartItems.set(current.filter((c) => c.id !== id));
      const cartId = this.currentCartId();
      if (cartId !== null) {
        const user = this.authService.currentUser;
        const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
        this.apiService.removeCartItem({ cartId, productId: id, memberId }).subscribe({
          error: (err) => console.warn('[Cart] remove_item 失敗', err),
        });
      }
    } else {
      this.cartItems.set(
        current.map((c) => (c.id === id ? { ...c, quantity: newQty } : c)),
      );
      this._syncCartItemToBackend(id, newQty);
    }
  }

  /* ── 從購物車移除 ─────────────────────────────────── */
  removeFromCart(id: number): void {
    const cartId = this.currentCartId();
    if (cartId !== null) {
      const user = this.authService.currentUser;
      const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
      this.apiService.removeCartItem({ cartId, productId: id, memberId }).subscribe({
        error: (err) => console.warn('[Cart] remove_item 失敗', err),
      });
    }
    this.cartItems.set(this.cartItems().filter((c) => c.id !== id));
  }

  /* ── 清空購物車（同步後端，用於取消訂單）──────────── */
  clearCart(): void {
    const cartId = this.currentCartId();
    if (cartId !== null) {
      const user = this.authService.currentUser;
      const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
      this.apiService.clearCart({ cartId, memberId }).subscribe({
        error: (err) => console.warn('[Cart] clear_cart 失敗', err),
      });
      this.currentCartId.set(null);
    }
    this.cartItems.set([]);
  }

  /* ── 訂單成功後重置本地購物車（不刪後端明細，保留訂單歷史）── */
  private resetLocalCart(): void {
    this.cartItems.set([]);
    this.currentCartId.set(null);
  }

  /* ── 前往結帳 ─────────────────────────────────────── */
  goToCheckout(): void {
    this.activeTab.set('checkout');
  }

  /* ── 送出訂單（完整流程）────────────────────────────
   * 1. 顯示「處理中」spinner（isPlacingOrder = true）
   * 2. 模擬後端處理延遲 1.2 秒
   * 3. 建立 LiveOrder 並推送至 OrderService（POS 看板即時同步）
   * 4. 新增至本地歷史訂單清單
   * 5. 清空購物車
   * 6. 導向訂單追蹤頁
   * ────────────────────────────────────────────────── */
  placeOrder(): void {
    if (this.cartItems().length === 0) return;
    if (this.isPlacingOrder()) return; /* 防重複送出 */
    /* 信用卡付款必須完整填寫卡片資料才能送出 */
    if (this.paymentMethod() === 'credit' && !this.isCreditCardValid()) return;

    this.isPlacingOrder.set(true);

    setTimeout(() => {
      this._doPlaceOrder();
      this.isPlacingOrder.set(false);
    }, 1200);
  }

  private _doPlaceOrder(): void {
    this._doPlaceOrderAsync().catch(err => {
      console.error('[Order] 下單失敗', err);
      this.isPlacingOrder.set(false);
    });
  }

  private async _doPlaceOrderAsync(): Promise<void> {
    const items = this.cartItems();
    const user  = this.authService.currentUser;
    const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
    const phone    = this.phoneNumber();

    /* ── Step 1：取得後端購物車 ID
     * eager sync 已完成 → 直接用；否則 fallback 逐筆同步 */
    let cartId = this.currentCartId();
    if (cartId === null) {
      for (const item of items) {
        const syncReq: CartSyncReq = {
          cartId,
          globalAreaId: 1,
          productId: item.id,
          quantity: item.quantity,
          operationType: 'CUSTOMER',
          memberId,
        };
        const cartRes = await firstValueFrom(this.apiService.syncCart(syncReq));
        cartId = cartRes.cartId;
      }
      if (!cartId) throw new Error('購物車同步失敗');
      this.currentCartId.set(cartId);
    }

    /* ── Step 2：建立訂單（UNPAID） ── */
    const orderReq: CreateOrdersReq = {
      orderCartId: String(cartId),
      globalAreaId: 1,
      memberId,
      phone,
      subtotalBeforeTax: this.cartTotal(),
      taxAmount: 0,
      totalAmount: this.cartTotal(),
      orderCartDetailsList: items.map(i => ({
        productId: i.id,
        quantity: i.quantity,
        isGift: false,
      })),
    };
    const orderRes = await firstValueFrom(this.apiService.createOrder(orderReq));

    /* ── Step 3：付款（→ COMPLETED） ── */
    const payMethodMap: Record<string, string> = {
      credit: 'CREDIT_CARD',
      mobile: 'MOBILE_PAY',
      cash:   'CASH',
    };
    const payReq: PayReq = {
      id:            orderRes.id,
      orderDateId:   orderRes.orderDateId,
      paymentMethod: payMethodMap[this.paymentMethod()] ?? 'CASH',
      transactionId: this.paymentMethod() === 'cash'
        ? 'CASH_PAYMENT'
        : `DEMO_TXN_${Date.now()}`,
    };
    await firstValueFrom(this.apiService.pay(payReq));

    /* ── 成功後更新本地狀態 ── */
    this._afterOrderSuccess(orderRes.id, orderRes.orderDateId);
  }

  private _afterOrderSuccess(orderId: string, orderDateId: string = ''): void {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const orderNum = this.orderService.generateOrderNumber();

    const itemTexts = this.cartItems().map((i) => `${i.name} × ${i.quantity}`);
    const promoGift = this.selectedPromoGift();
    const promoName = this.selectedPromoName();
    if (promoGift && promoName && promoName !== '不參加活動優惠') {
      itemTexts.push(`${promoName} - ${promoGift}`);
    }
    const totalQty = this.cartItems().reduce((s, i) => s + i.quantity, 0);
    const estMin   = Math.max(5, Math.ceil(totalQty * 2));

    const payLabels: Record<string, string> = {
      credit: '信用卡', mobile: '行動支付', cash: '現金',
    };
    const payLabel = payLabels[this.paymentMethod()] ?? '現金';

    /* 推送至 POS 看板（本機 in-memory，同視窗時即時同步） */
    this.orderService.addOrder({
      id: orderId,
      number: orderNum,
      status: 'waiting',
      estimatedMinutes: estMin,
      items: itemTexts,
      total: this.cartTotal(),
      createdAt: timeStr,
      payMethod: payLabel,
      source: 'customer',
      customerName: this.authService.currentUser?.name,
    });

    /* 儲存 DB 訂單識別碼，啟動廚房狀態輪詢（跨裝置同步） */
    if (orderDateId) {
      this._activeOrderDbId = { id: orderId, orderDateId };
      if (this.statusPollInterval) clearInterval(this.statusPollInterval);
      this.statusPollInterval = setInterval(() => {
        if (!this._activeOrderDbId) return;
        this.apiService.getOrderStatus(
          this._activeOrderDbId.id,
          this._activeOrderDbId.orderDateId
        ).subscribe({
          next: (res) => {
            if (res?.code !== 200) return;
            const statusMap: Record<string, 'waiting' | 'cooking' | 'ready' | 'done'> = {
              WAITING: 'waiting', COOKING: 'cooking', READY: 'done',
            };
            const newStatus = statusMap[res.message] ?? 'waiting';
            const current = this.orderService.orders().find(o => o.id === orderId);
            if (current && current.status !== newStatus) {
              this.orderService.updateStatus(orderId, newStatus);
            }
            /* 已完成則停止輪詢 */
            if (newStatus === 'done') {
              if (this.statusPollInterval) clearInterval(this.statusPollInterval);
              this.statusPollInterval = null;
            }
          },
          error: () => { /* 靜默失敗 */ }
        });
      }, 5000);
    }

    /* 加入本地歷史訂單 */
    this.orderHistoryList.set([
      {
        id: orderId,
        date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        items: itemTexts.join('、'),
        total: this.discountedTotal(),
        status: 'completed',
      },
      ...this.orderHistoryList(),
    ]);

    this.resetLocalCart();
    this.orderNote.set('');

    if (this.useDiscountCoupon()) {
      this.memberOrderCount.set(1);
      this.useDiscountCoupon.set(false);
    } else {
      this.memberOrderCount.update((c) => Math.min(c + 1, 10));
    }

    this.selectedPromoName.set('');
    this.selectedPromoGift.set('');
    this.promoGiftPanelOpen.set(false);
    this.isPlacingOrder.set(false);
    this.setTab('tracker');
  }

  /* ── 取得頭像文字 ────────────────────────────────── */
  getAvatarLetter(): string {
    const user = this.authService.currentUser;
    if (!user) return '?';
    if (user.isGuest) return 'G';
    return user.name?.charAt(0) ?? '?';
  }

  /* ── 登出 ─────────────────────────────────────────── */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/customer-login']);
  }
}

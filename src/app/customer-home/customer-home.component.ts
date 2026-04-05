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

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../shared/auth.service';
import { LoadingService } from '../shared/loading.service';
import { OrderService } from '../shared/order.service';

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
export type TabId = 'home' | 'menu' | 'checkout' | 'payment' | 'tracker' | 'orders';

/* ── 頁籤定義型別 ──────────────────────────────────────── */
interface NavTab { id: TabId; label: string; icon: string; }

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss']
})
export class CustomerHomeComponent implements OnInit {

  /* ── 當前頁籤 ───────────────────────────────────────── */
  activeTab = signal<TabId>('home');

  /* ── 購物車 ─────────────────────────────────────────── */
  cartItems = signal<CartItem[]>([]);

  cartCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  cartTotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
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
  menuSearchQuery    = signal<string>('');

  setMenuCategory(cat: string): void {
    this.activeMenuCategory.set(cat);
  }

  onMenuSearch(event: Event): void {
    this.menuSearchQuery.set((event.target as HTMLInputElement).value);
  }

  /** 回傳該品項是否應顯示（分類 + 名稱模糊搜尋） */
  isMenuItemShown(name: string, category: string): boolean {
    const cat = this.activeMenuCategory();
    const q   = this.menuSearchQuery().trim().toLowerCase();
    const catMatch  = cat === 'all' || cat === category;
    const nameMatch = q === '' || name.toLowerCase().includes(q);
    return catMatch && nameMatch;
  }

  /** 回傳整個分類區塊是否應顯示（只要有任一品項符合篩選即顯示） */
  isSectionShown(sectionItems: Array<{ name: string; category: string }>): boolean {
    return sectionItems.some(item => this.isMenuItemShown(item.name, item.category));
  }

  /* ── 側邊欄：個人資料抽屜狀態 ────────────────────── */
  isProfileExpanded = signal(false);
  isEditingProfile = signal(false);

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  /* ── 結帳：付款方式選擇 ────────────────────────────── */
  paymentMethod = signal<'credit' | 'mobile' | 'cash' | 'cod'>('cod');

  /* ── 訂單備註 ───────────────────────────────────────── */
  orderNote = signal('');

  /* ── 下單中狀態（true 時按鈕顯示 spinner，防止重複送出） */
  isPlacingOrder = signal(false);

  setPaymentMethod(method: 'credit' | 'mobile' | 'cash' | 'cod'): void {
    this.paymentMethod.set(method);
  }

  toggleProfile(): void {
    if (this.isGuest()) return;
    this.isProfileExpanded.update(v => !v);
    if (!this.isProfileExpanded()) {
      this.isEditingProfile.set(false);
      this.showPassword.set(false);
      this.showConfirmPassword.set(false);
    }
  }

  toggleEditProfile(): void {
    this.isEditingProfile.update(v => !v);
    if (!this.isEditingProfile()) {
      this.showPassword.set(false);
      this.showConfirmPassword.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  /* ── 側邊欄：進度與折扣邏輯 (模擬 Database) ────────── */
  memberOrderCount = signal(7);

  ordersUntilDiscount = computed(() => {
    const total = this.memberOrderCount();
    const remainder = total % 10;
    if (remainder === 0 && total > 0) return 0;
    return 10 - remainder;
  });

  hasDiscountReady = computed(() => {
    return this.memberOrderCount() > 0 && this.memberOrderCount() % 10 === 0;
  });

  /* ── 即時追蹤訂單（從 OrderService 取得最新客戶訂單） ── */
  trackingOrder = computed<TrackingOrder | null>(() => {
    const o = this.orderService.latestCustomerOrder();
    if (!o) return null;
    return {
      id:               o.id,
      number:           o.number,
      status:           o.status,
      estimatedMinutes: o.estimatedMinutes,
      items:            o.items,
      total:            o.total,
      createdAt:        o.createdAt
    };
  });

  /* ── 底部導覽列定義 ───────────────────────────────── */
  private readonly ALL_TABS: NavTab[] = [
    { id: 'home',     label: '首頁',   icon: 'home'     },
    { id: 'menu',     label: '菜單',   icon: 'menu'     },
    { id: 'checkout', label: '結帳',   icon: 'checkout' },
    { id: 'tracker',  label: '追蹤',   icon: 'tracker'  },
    { id: 'orders',   label: '訂單管理', icon: 'orders'   },
  ];

  navTabs = computed<NavTab[]>(() =>
    this.isGuest()
      ? this.ALL_TABS.filter(t => t.id !== 'orders')
      : this.ALL_TABS
  );

  /* ── 訂單管理資料 ──────────────────────────────────── */
  activeOrderTab = signal<'completed' | 'cancelled' | 'refunded'>('completed');

  orderHistoryList = signal([
    {
      id: 'LBB-20240315-001',
      date: '2024-03-15',
      items: '紅燒牛肉麵 × 1、滷蛋 × 2',
      total: 185,
      status: 'completed'
    },
    {
      id: 'LBB-20240320-002',
      date: '2024-03-20',
      items: '三杯雞飯 × 1、味噌湯 × 1',
      total: 150,
      status: 'completed'
    },
    {
      id: 'LBB-20240401-004',
      date: '2024-04-01',
      items: '咖哩雞飯 × 1、珍珠奶茶 × 2、小菜 × 1',
      total: 320,
      status: 'completed'
    },
    {
      id: 'LBB-20240408-005',
      date: '2024-04-08',
      items: '麻辣燙 × 1、白飯 × 1',
      total: 175,
      status: 'completed'
    },
    {
      id: 'LBB-20240418-007',
      date: '2024-04-18',
      items: '越南河粉 × 1、春捲 × 3',
      total: 210,
      status: 'completed'
    },
    {
      id: 'LBB-20240425-008',
      date: '2024-04-25',
      items: '印度咖哩飯 × 2、饢餅 × 1、優格飲 × 2',
      total: 395,
      status: 'completed'
    },
    {
      id: 'LBB-20240412-006',
      date: '2024-04-12',
      items: '鐵板燒套餐 × 2、冬瓜茶 × 2',
      total: 480,
      status: 'cancelled'
    },
    {
      id: 'LBB-20240402-003',
      date: '2024-04-02',
      items: '紅油抄手 × 2',
      total: 120,
      status: 'refunded'
    }
  ]);

  completedCount = computed(() => this.orderHistoryList().filter(o => o.status === 'completed').length);
  cancelledCount = computed(() => this.orderHistoryList().filter(o => o.status === 'cancelled').length);
  refundedCount  = computed(() => this.orderHistoryList().filter(o => o.status === 'refunded').length);

  filteredOrders = computed(() => {
    return this.orderHistoryList().filter(o => o.status === this.activeOrderTab());
  });


  constructor(
    private router: Router,
    public authService: AuthService,
    private loadingService: LoadingService,
    public orderService: OrderService
  ) {}

  ngOnInit(): void {
    if (!this.authService.currentUser) {
      this.router.navigate(['/customer-login']);
      return;
    }
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
    const existing = current.find(c => c.id === item.id);
    if (existing) {
      this.cartItems.set(current.map(c =>
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      this.cartItems.set([...current, {
        id: item.id,
        name: item.name,
        nameEn: item.nameEn,
        price: item.price,
        quantity: 1,
        image: item.image,
        category: item.category
      }]);
    }
    if (navigator.vibrate) navigator.vibrate(30);
  }

  /* ── 更新購物車數量 ──────────────────────────────── */
  updateCartQuantity(id: number, delta: number): void {
    const current = this.cartItems();
    const item = current.find(c => c.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.cartItems.set(current.filter(c => c.id !== id));
    } else {
      this.cartItems.set(current.map(c =>
        c.id === id ? { ...c, quantity: newQty } : c
      ));
    }
  }

  /* ── 從購物車移除 ─────────────────────────────────── */
  removeFromCart(id: number): void {
    this.cartItems.set(this.cartItems().filter(c => c.id !== id));
  }

  /* ── 清空購物車 ──────────────────────────────────── */
  clearCart(): void {
    this.cartItems.set([]);
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
    if (this.isPlacingOrder()) return;   /* 防重複送出 */

    this.isPlacingOrder.set(true);

    setTimeout(() => {
      this._doPlaceOrder();
      this.isPlacingOrder.set(false);
    }, 1200);
  }

  private _doPlaceOrder(): void {

    const now  = new Date();
    const pad  = (n: number) => String(n).padStart(2, '0');
    const dateStr   = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr   = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const orderNum  = this.orderService.generateOrderNumber();
    const orderId   = this.orderService.generateOrderId();

    const itemTexts = this.cartItems().map(i => `${i.name} × ${i.quantity}`);
    const totalQty  = this.cartItems().reduce((s, i) => s + i.quantity, 0);
    const estMin    = Math.max(5, Math.ceil(totalQty * 2));

    /* 付款方式標籤 */
    const payLabels: Record<string, string> = {
      credit: '信用卡', mobile: '行動支付', cash: '現金', cod: '取貨付款'
    };
    const payLabel = payLabels[this.paymentMethod()] ?? '現金';

    /* 推送至 OrderService → POS 看板即時同步 */
    this.orderService.addOrder({
      id:               orderId,
      number:           orderNum,
      status:           'waiting',
      estimatedMinutes: estMin,
      items:            itemTexts,
      total:            this.cartTotal(),
      createdAt:        timeStr,
      payMethod:        payLabel,
      source:           'customer',
      customerName:     this.authService.currentUser?.name
    });

    /* 加入本地歷史訂單（最新在最上方） */
    this.orderHistoryList.set([
      {
        id:     orderId,
        date:   `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        items:  itemTexts.join('、'),
        total:  this.cartTotal(),
        status: 'completed'
      },
      ...this.orderHistoryList()
    ]);

    /* 清空購物車與備註 */
    this.clearCart();
    this.orderNote.set('');

    /* 跳至訂單追蹤頁 */
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

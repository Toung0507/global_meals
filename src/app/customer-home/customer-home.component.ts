/*
 * =====================================================
 * 檔案名稱：customer-home.component.ts
 * 位置說明：src/app/customer-home/customer-home.component.ts
 * 用途說明：客戶端登入後的主頁框架（Shell）
 * 功能說明：
 *   - 底部導覽列（主頁 / 菜單 / 結帳 / 追蹤 / 會員）
 *   - 登入保護守衛（未登入者自動跳回登入頁）
 *   - 購物車狀態管理（供菜單、結帳頁共用）
 *   - 頁籤切換狀態管理
 * =====================================================
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../shared/auth.service';
import { LoadingService } from '../shared/loading.service';

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

  /* ── 側邊欄：個人資料抽屜狀態 ────────────────────── */
  isProfileExpanded = signal(false);
  isEditingProfile = signal(false);
  
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  /* ── 結帳：付款方式選擇 ────────────────────────────── */
  paymentMethod = signal('credit');

  setPaymentMethod(method: string): void {
    this.paymentMethod.set(method);
  }

  toggleProfile(): void {
    if (this.isGuest()) return; // 訪客不支援個人資料展開
    this.isProfileExpanded.update(v => !v);
    if (!this.isProfileExpanded()) {
      this.isEditingProfile.set(false); // 收合時重置編輯狀態
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
  memberOrderCount = signal(7); // 假資料：已點餐次數
  
  ordersUntilDiscount = computed(() => {
    const total = this.memberOrderCount();
    const remainder = total % 10;
    if (remainder === 0 && total > 0) return 0; // 可以領券了
    return 10 - remainder;
  });

  hasDiscountReady = computed(() => {
    return this.memberOrderCount() > 0 && this.memberOrderCount() % 10 === 0;
  });

  /* ── 模擬即時追蹤訂單 ──────────────────────────────── */
  trackingOrder = signal<TrackingOrder | null>({
    id: 'LBB-20260330-009',
    number: 'A-047',
    status: 'cooking',
    estimatedMinutes: 8,
    items: ['紅燒牛肉麵 × 1', '滷蛋 × 2', '珍珠奶茶 × 1'],
    total: 285,
    createdAt: '14:32'
  });

  /* ── 底部導覽列定義 (computed: 訪客不顯示「會員」頁籤) ── */
  private readonly ALL_TABS: NavTab[] = [
    { id: 'home',     label: '首頁',   icon: 'home'     },
    { id: 'menu',     label: '菜單',   icon: 'menu'     },
    { id: 'checkout', label: '結帳',   icon: 'checkout' },
    { id: 'tracker',  label: '追蹤',   icon: 'tracker'  },
    { id: 'orders',   label: '訂單管理', icon: 'orders'   },
  ];

  navTabs = computed<NavTab[]>(() =>
    this.isGuest()
      ? this.ALL_TABS.filter(t => t.id !== 'orders')   /* 訪客：暫不顯示訂單管理，視業務需求可開放 */
      : this.ALL_TABS
  );

  /* ── 訂單管理資料 ──────────────────────────────────────── */

  /* 目前篩選中的狀態頁籤 */
  activeOrderTab = signal<'completed' | 'cancelled' | 'refunded'>('completed');

  /*
   * 歷史訂單假資料（對應 auth.service.ts MOCK_ORDERS，未來串接後端時替換）
   * status 採用英文 key，方便與 CSS class 對應（badge-completed / badge-cancelled / badge-refunded）
   */
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

  /* 各狀態的訂單數量（用於篩選頁籤上的數量徽章） */
  completedCount = computed(() => this.orderHistoryList().filter(o => o.status === 'completed').length);
  cancelledCount = computed(() => this.orderHistoryList().filter(o => o.status === 'cancelled').length);
  refundedCount  = computed(() => this.orderHistoryList().filter(o => o.status === 'refunded').length);

  /* 依目前篩選頁籤過濾的訂單清單 */
  filteredOrders = computed(() => {
    return this.orderHistoryList().filter(o => o.status === this.activeOrderTab());
  });


  constructor(
    private router: Router,
    public authService: AuthService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    /* 登入保護 */
    if (!this.authService.currentUser) {
      this.router.navigate(['/customer-login']);
      return;
    }
  }

  /* ── 切換頁籤 ─────────────────────────────────────── */
  setTab(tab: TabId): void {
    if (tab === 'orders' && this.isGuest()) {
      return; /* 訪客保護 */
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
    /* 震動反饋（手機） */
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

  /* ── 取得頭像文字 ────────────────────────────────── */
  getAvatarLetter(): string {
    const user = this.authService.currentUser;
    if (!user) return '?';
    if (user.isGuest) return 'G'; /* Guest的首字母 */
    return user.name?.charAt(0) ?? '?';
  }

  /* ── 登出 ─────────────────────────────────────────── */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/customer-login']);
  }
}

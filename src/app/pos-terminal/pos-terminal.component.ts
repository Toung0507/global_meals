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
import { OrderService } from '../shared/order.service';

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
  tax      = computed(() => Math.round(this.subtotal() * 0.05));
  total    = computed(() => this.subtotal() + this.tax());

  showPromoHint = computed(() => this.subtotal() > 0 && this.subtotal() < 300);
  promoRemain   = computed(() => 300 - this.subtotal());

  /* ── 商品清單（Signal 化，支援庫存調整） ────────── */
  products = signal<PosProduct[]>([
    { id: 1, name: '招牌滷肉飯',   eng: 'Braised Pork Rice',         price: 120, emoji: '🍚', bg: 'linear-gradient(135deg,#2d1205,#5c2a10)', imgSrc: '/assets/招牌滷肉飯.jpg',   badge: 'hot', stock: 48,  category: '台式' },
    { id: 2, name: '古早味排骨飯', eng: 'Pork Chop Rice',            price: 145, emoji: '🍱', bg: 'linear-gradient(135deg,#2d1a05,#5c3a10)', imgSrc: '/assets/古早味排骨.jpg',   badge: 'hot', stock: 32,  category: '台式' },
    { id: 3, name: '蚵仔煎',       eng: 'Oyster Pancake',            price: 80,  emoji: '🥚', bg: 'linear-gradient(135deg,#2d2005,#5c4510)', imgSrc: '/assets/蚵仔煎.jpg',       badge: 'low', stock: 5,   category: '台式' },
    { id: 4, name: '三杯雞飯',     eng: 'Three-Cup Chicken Rice',    price: 150, emoji: '🍗', bg: 'linear-gradient(135deg,#1e1208,#4a2e10)', imgSrc: '/assets/三杯雞.jpg',                     stock: 24,  category: '台式' },
    { id: 5, name: '牛排',         eng: 'Steak',                     price: 280, emoji: '🥩', bg: 'linear-gradient(135deg,#2d0e0a,#5c2018)', imgSrc: '/assets/牛排.jpg',          badge: 'new', stock: 18,  category: '西式' },
    { id: 6, name: '蚵仔麵線',     eng: 'Oyster Vermicelli',         price: 70,  emoji: '🍜', bg: 'linear-gradient(135deg,#2d1005,#6b2a10)', imgSrc: '/assets/蚵仔麵線.jpg',                   stock: 15,  category: '台式' },
    { id: 7, name: '黑糖珍珠奶茶', eng: 'Brown Sugar Boba',          price: 75,  emoji: '🧋', bg: 'linear-gradient(135deg,#0a0805,#2a1a0a)', imgSrc: '/assets/黑糖珍珠奶茶.jpg', badge: 'hot', stock: 120, category: '飲品' },
    { id: 8, name: '招牌滷蛋',     eng: 'Marinated Egg',             price: 30,  emoji: '🥚', bg: 'linear-gradient(135deg,#1e1208,#4a2e10)',                                                   stock: 80,  category: '輕食' },
    { id: 9, name: '仙草奶茶',     eng: 'Grass Jelly Milk Tea',      price: 65,  emoji: '🌿', bg: 'linear-gradient(135deg,#051a05,#103010)', imgSrc: '/assets/仙草奶茶.jpg',                   stock: 60,  category: '飲品' },
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

  constructor(
    private router: Router,
    public authService: AuthService,
    public orderService: OrderService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user || (user.role !== 'branch_manager' && user.role !== 'staff')) {
      this.router.navigate(['/staff-login']);
      return;
    }
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval !== null) {
      clearInterval(this.clockInterval);
    }
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

  /* ── 結帳：推送至 OrderService ─────────────────────── */
  checkout(): void {
    if (this.cartItems().length === 0) return;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const orderNum = this.orderService.generateOrderNumber();
    const orderId  = this.orderService.generateOrderId();
    const itemTexts = this.cartItems().map(i => `${i.name} × ${i.qty}`);
    const totalQty  = this.cartItems().reduce((s, i) => s + i.qty, 0);
    const estMin    = Math.max(5, Math.ceil(totalQty * 2));
    const payLabels: Record<string, string> = { cash: '現金', card: '信用卡', mobile: '行動支付' };

    this.orderService.addOrder({
      id:               orderId,
      number:           orderNum,
      status:           'waiting',
      estimatedMinutes: estMin,
      items:            itemTexts,
      total:            this.total(),
      createdAt:        timeStr,
      payMethod:        payLabels[this.payMethod()],
      source:           'pos',
      customerName:     this.authService.currentUser?.name
    });

    this.lastOrderNum.set(orderNum);
    this.clearCart();
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
  }

  finishOrder(id: string): void {
    this.orderService.updateStatus(id, 'done');
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

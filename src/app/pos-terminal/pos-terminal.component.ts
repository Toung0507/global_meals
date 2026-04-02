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
 *   - 即時時鐘
 * =====================================================
 */

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../shared/auth.service';

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
  badge?: 'hot' | 'new' | 'low';
  stock: number;
}

/* ── 購物車品項型別 ─────────────────────────────────── */
interface CartItem {
  id: number;
  name: string;
  eng: string;
  price: number;
  qty: number;
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

  /* ── 購物車 ───────────────────────────────────────── */
  cartItems = signal<CartItem[]>([]);

  /* 小計 = 所有品項 price × qty 的總和 */
  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  /* 稅金 = 小計 × 5%，取整 */
  tax = computed(() => Math.round(this.subtotal() * 0.05));

  /* 合計 = 小計 + 稅金 */
  total = computed(() => this.subtotal() + this.tax());

  /* 滿額提示：小計 > 0 且 < 300 */
  showPromoHint = computed(() => this.subtotal() > 0 && this.subtotal() < 300);

  /* 距離 $300 的差額 */
  promoRemain = computed(() => 300 - this.subtotal());

  /* ── 商品清單（靜態假資料，未來替換為 API）────────── */
  readonly PRODUCTS: PosProduct[] = [
    /* 台灣分店商品清單（未來替換為 API 資料） */
    { id: 1, name: '招牌滷肉飯',   eng: 'Braised Pork Rice',         price: 120, emoji: '🍚', bg: 'linear-gradient(135deg,#2d1205,#5c2a10)', badge: 'hot', stock: 48 },
    { id: 2, name: '古早味排骨飯', eng: 'Pork Chop Rice',            price: 145, emoji: '🍱', bg: 'linear-gradient(135deg,#2d1a05,#5c3a10)', badge: 'hot', stock: 32 },
    { id: 3, name: '蚵仔煎',       eng: 'Oyster Pancake',            price: 80,  emoji: '🥚', bg: 'linear-gradient(135deg,#2d2005,#5c4510)', badge: 'low', stock: 5  },
    { id: 4, name: '三杯雞飯',     eng: 'Three-Cup Chicken Rice',    price: 150, emoji: '🍗', bg: 'linear-gradient(135deg,#1e1208,#4a2e10)', stock: 24 },
    { id: 5, name: '控肉飯',       eng: 'Braised Pork Belly Rice',   price: 130, emoji: '🥩', bg: 'linear-gradient(135deg,#2d0e0a,#5c2018)', badge: 'hot', stock: 18 },
    { id: 6, name: '蚵仔麵線',     eng: 'Oyster Vermicelli',         price: 70,  emoji: '🍜', bg: 'linear-gradient(135deg,#2d1005,#6b2a10)', stock: 15 },
    { id: 7, name: '黑糖珍珠奶茶', eng: 'Brown Sugar Boba',          price: 75,  emoji: '🧋', bg: 'linear-gradient(135deg,#0a0805,#2a1a0a)', badge: 'hot', stock: 120 },
    { id: 8, name: '招牌滷蛋',     eng: 'Marinated Egg',             price: 30,  emoji: '🥚', bg: 'linear-gradient(135deg,#1e1208,#4a2e10)', stock: 80 },
    { id: 9, name: '仙草奶茶',     eng: 'Grass Jelly Milk Tea',      price: 65,  emoji: '🌿', bg: 'linear-gradient(135deg,#051a05,#103010)', stock: 60 },
  ];

  /* 計時器 ID，用於 ngOnDestroy 清除 */
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    /* 登入保護：只允許 branch_manager / staff */
    const user = this.authService.currentUser;
    if (!user || (user.role !== 'branch_manager' && user.role !== 'staff')) {
      this.router.navigate(['/staff-login']);
      return;
    }

    /* 啟動即時時鐘 */
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval !== null) {
      clearInterval(this.clockInterval);
    }
  }

  /* 判斷是否為分店長（控制 bm-only 頁籤與庫存操作按鈕） */
  get isBM(): boolean {
    return this.authService.currentUser?.role === 'branch_manager';
  }

  /* 更新時鐘字串 */
  private updateClock(): void {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    this.clockStr.set(`${hh}:${mm}:${ss}`);
  }

  /* 切換頁籤 */
  setTab(tab: PosTab): void {
    if (tab === 'staff' && !this.isBM) return; /* 員工保護 */
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

  /* 結帳（示範：清空購物車） */
  checkout(): void {
    if (this.cartItems().length === 0) {
      alert('購物車是空的！');
      return;
    }
    alert('✅ 結帳成功！訂單 #TW-2061 已送出廚房。');
    this.clearCart();
  }

  /* 登出 */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/staff-login']);
  }

}

/*
 * =====================================================
 * 檔案名稱：manager-dashboard.component.ts
 * 位置說明：src/app/manager-dashboard/manager-dashboard.component.ts
 * 用途說明：老闆（boss）後台管理主控台
 * 功能說明：
 *   - 側邊欄 8 個頁籤切換（綜合總覽 / 訂單 / 商品 / 活動 / 庫存 / 帳號 / 稅率 / 財報）
 *   - 帳號管理子頁籤切換（分店長 / 員工）
 *   - 商品上/下架切換（Signal 驅動）
 *   - 庫存量即時調整（inline 編輯）
 *   - 訂單狀態篩選（select 篩選 + 分頁）
 *   - 活動啟用/停用（toggle switch Signal 驅動）
 *   - 帳號停/復權（Signal 驅動）
 *   - 稅率修改（inline input Signal 驅動）
 *   - 登入保護：非 boss 角色自動導回 staff-login
 *   - 即時時鐘顯示
 * =====================================================
 */

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../shared/auth.service';
// ⚠ TODO [API串接點 - 步驟1]：取消下方兩行 import
// import { ApiService, GlobalAreaVO, RegionVO } from '../shared/api.service';

/* ── 側邊欄頁籤型別 ─────────────────────────────────── */
export type DashTab = 'dashboard' | 'orders' | 'products' | 'promotions' | 'inventory' | 'users' | 'tax' | 'finance' | 'branches';

/* ── 帳號管理子頁籤型別 ─────────────────────────────── */
export type UserSubTab = 'bm' | 'staff';

/* ── 商品型別 ──────────────────────────────────────── */
interface DashProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
  emoji: string;
  emojiBg: string;
}

/* ── 活動型別 ──────────────────────────────────────── */
interface DashPromo {
  id: number;
  title: string;
  scope: string;
  isActive: boolean;
  color: string;
  ended: boolean;
}

/* ── 庫存型別 ──────────────────────────────────────── */
interface DashInventory {
  id: number;
  name: string;
  category: string;
  branch: string;
  stock: number;
  safeStock: number;
}

/* ── 帳號型別 ──────────────────────────────────────── */
interface DashAccount {
  id: number;
  name: string;
  account: string;
  branch?: string;
  shift?: string;
  lastLogin: string;
  isActive: boolean;
  role: 'bm' | 'staff';
}

/* ── 分店型別（對應 global_area 資料表）───────────── */
interface DashBranch {
  id: number;
  name: string;     /* 完整分店名稱，例：台灣台北店 (= branch) */
  city: string;     /* 城市，例：台北 */
  country: string;  /* 國家，例：台灣 */
  address: string;  /* 地址 */
  phone: string;    /* 電話 */
}

/* ── 稅率型別 ──────────────────────────────────────── */
interface DashTax {
  id: number;
  flag: string;
  country: string;
  branch: string;
  rate: number;
  editing: boolean;
  editValue: number;
}

/* ── 訂單型別 ──────────────────────────────────────── */
interface DashOrder {
  id: string;
  branch: string;
  branchClass: string;
  summary: string;
  amount: string;
  payMethod: string;
  time: string;
  statusClass: string;
  statusLabel: string;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss']
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {

  /* ── 頁籤狀態 ──────────────────────────────────── */
  /* 預設頁籤改為分店管理（綜合總覽等5個功能暫時停用） */
  activeTab    = signal<DashTab>('branches');
  userSubTab   = signal<UserSubTab>('bm');
  clockStr     = signal('');

  /* ── 頁籤標題 ──────────────────────────────────── */
  readonly TAB_TITLES: Record<DashTab, string> = {
    dashboard:  '📊 綜合總覽',
    orders:     '📋 訂單管理',
    products:   '🛍️ 商品管理',
    promotions: '🎯 活動管理',
    inventory:  '📦 庫存管理',
    users:      '👥 帳號管理',
    tax:        '🌍 稅率設定',
    finance:    '💰 財務報表',
    branches:   '🏪 分店管理'
  };

  /* ── 商品清單（Signal） ─────────────────────────── */
  products = signal<DashProduct[]>([
    { id: 1, name: '紅燒牛肉麵',    category: '台式', price: 165, stock: 48, isActive: true,  emoji: '🍜', emojiBg: 'linear-gradient(135deg,#c49756,#8b5e3c)' },
    { id: 2, name: '印度奶油咖哩飯', category: '南洋', price: 175, stock: 32, isActive: true,  emoji: '🍛', emojiBg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { id: 3, name: '越南牛肉河粉',   category: '南洋', price: 155, stock: 5,  isActive: true,  emoji: '🍲', emojiBg: 'linear-gradient(135deg,#3ecf8e,#10b981)' },
    { id: 4, name: '義式肉醬寬麵',   category: '西式', price: 185, stock: 0,  isActive: false, emoji: '🍝', emojiBg: 'linear-gradient(135deg,#818cf8,#6366f1)' },
    { id: 5, name: '墨西哥辣雞捲',   category: '西式', price: 145, stock: 18, isActive: true,  emoji: '🌮', emojiBg: 'linear-gradient(135deg,#f87171,#ef4444)' },
    { id: 6, name: '珍珠奶茶',       category: '飲品', price: 65,  stock: 120, isActive: true, emoji: '🧋', emojiBg: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
  ]);

  /* ── 活動清單（Signal） ─────────────────────────── */
  promos = signal<DashPromo[]>([
    { id: 1, title: '🎁 滿 $300 贈招牌滷蛋×2', scope: '全部分店 · 期限：無限期',      isActive: true,  color: '#c49756', ended: false },
    { id: 2, title: '🍱 週一 9 折優惠',          scope: '日本東京店 · 期限：2026-06-30', isActive: true,  color: '#4f8ef7', ended: false },
    { id: 3, title: '🥤 加購飲品 $29',            scope: '泰國曼谷店 · 期限：2026-05-01', isActive: true,  color: '#3ecf8e', ended: false },
    { id: 4, title: '🎊 週年慶全館 8 折',         scope: '全部分店 · 已結束',             isActive: false, color: 'rgba(255,255,255,0.15)', ended: true },
  ]);

  /* ── 庫存清單（Signal） ─────────────────────────── */
  inventory = signal<DashInventory[]>([
    { id: 1, name: '紅燒牛肉麵',   category: '台式', branch: '台北店', stock: 48, safeStock: 10 },
    { id: 2, name: '越南牛肉河粉', category: '南洋', branch: '曼谷店', stock: 5,  safeStock: 10 },
    { id: 3, name: '義式肉醬寬麵', category: '西式', branch: '東京店', stock: 0,  safeStock: 10 },
    { id: 4, name: '印度奶油咖哩飯', category: '南洋', branch: '台北店', stock: 32, safeStock: 10 },
    { id: 5, name: '珍珠奶茶',     category: '飲品', branch: '全部分店', stock: 120, safeStock: 30 },
  ]);

  /* 庫存調整狀態 */
  adjustingInventoryId  = signal<number | null>(null);
  adjustInventoryAmt    = signal<number>(0);
  adjustInventorySavedId = signal<number | null>(null);

  /* ── 帳號清單（Signal） ─────────────────────────── */
  accounts = signal<DashAccount[]>([
    { id: 1, name: '陳美玲',     account: 'chen.ml',  branch: '台灣台北店', lastLogin: '2026-04-01 09:12', isActive: true,  role: 'bm' },
    { id: 2, name: '田中一郎',   account: 'tanaka.i', branch: '日本東京店', lastLogin: '2026-04-01 08:55', isActive: true,  role: 'bm' },
    { id: 3, name: 'Somchai P.', account: 'somchai.p', branch: '泰國曼谷店', lastLogin: '2026-03-30 14:20', isActive: false, role: 'bm' },
    { id: 4, name: '王小明',     account: 'wang.xm',  shift: '早班', lastLogin: '今日 09:00', isActive: true,  role: 'staff', branch: '台北店' },
    { id: 5, name: '李佳靜',     account: 'lee.jj',   shift: '晚班', lastLogin: '昨日 17:00', isActive: true,  role: 'staff', branch: '台北店' },
    { id: 6, name: 'Yuki T.',    account: 'yuki.t',   shift: '全天', lastLogin: '今日 10:30', isActive: true,  role: 'staff', branch: '東京店' },
  ]);

  bmAccounts    = computed(() => this.accounts().filter(a => a.role === 'bm'));
  staffAccounts = computed(() => this.accounts().filter(a => a.role === 'staff'));

  /* ── 稅率清單（Signal） ─────────────────────────── */
  taxes = signal<DashTax[]>([
    { id: 1, flag: '🇹🇼', country: '台灣', branch: '台灣台北店', rate: 5,  editing: false, editValue: 5  },
    { id: 2, flag: '🇯🇵', country: '日本', branch: '日本東京店', rate: 10, editing: false, editValue: 10 },
    { id: 3, flag: '🇹🇭', country: '泰國', branch: '泰國曼谷店', rate: 7,  editing: false, editValue: 7  },
  ]);

  /* ── 商品篩選 ─────────────────────────────────── */
  productCategoryFilter = signal<string>('全部分類');
  productSearch         = signal<string>('');

  filteredProducts = computed(() => {
    const catMap: Record<string, string> = {
      '全部分類': '', '🍜 台式': '台式', '🍛 南洋': '南洋', '🍝 西式': '西式', '🧋 飲品': '飲品'
    };
    const catKey = catMap[this.productCategoryFilter()] ?? '';
    const q      = this.productSearch().toLowerCase();
    return this.products().filter(p => {
      const catOk = catKey === '' || p.category === catKey;
      const qOk   = q === '' || p.name.toLowerCase().includes(q);
      return catOk && qOk;
    });
  });

  /* ── Toast 通知 ─────────────────────────────────── */
  toastMsg     = signal<string>('');
  toastLeaving = signal<boolean>(false);   /* true 時觸發 CSS 淡出動畫 */
  private toastTimer:   ReturnType<typeof setTimeout> | null = null;
  private toastLeaveTimer: ReturnType<typeof setTimeout> | null = null;

  /* ── CSV 匯出中狀態 ──────────────────────────────── */
  isExporting = signal<boolean>(false);

  /* ── 財務頁籤：數字計數動畫目前值 ─────────────────── */
  financeRevenue = signal<number>(0);
  financeOrders  = signal<number>(0);
  financeAvgPrice = signal<number>(0);

  /* ── 分店清單（Signal，對應 global_area 資料表）─── */
  branches = signal<DashBranch[]>([
    { id: 1, name: '台灣台北店', city: '台北', country: '台灣', address: '台北市中山區南京東路一段 88 號', phone: '02-2345-6789' },
    { id: 2, name: '日本東京店', city: '東京', country: '日本', address: '東京都新宿区新宿3-10-1',          phone: '+81-3-1234-5678' },
    { id: 3, name: '泰國曼谷店', city: '曼谷', country: '泰國', address: '101 Sukhumvit Rd, Bangkok',       phone: '+66-2-987-6543' },
  ]);

  /* ── Modal 狀態 ─────────────────────────────────────── */
  activeModal       = signal<'orderDetail' | 'addProduct' | 'addPromo' | 'addAccount' | 'addCountry' | 'addBranch' | 'editBranch' | null>(null);
  selectedOrder     = signal<DashOrder | null>(null);
  editingAccountId  = signal<number | null>(null);
  editingProductId  = signal<number | null>(null);

  /* ── 表單草稿（普通屬性，開啟 modal 時重置） ─────────── */
  productDraft = { name: '', category: '台式', price: 165, stock: 0, emoji: '🍜' };
  promoDraft   = { title: '', scope: '全部分店 · 期限：無限期', color: '#c49756' };
  accountDraft: { name: string; account: string; branch: string; shift: string; role: 'bm' | 'staff'; isActive: boolean } =
    { name: '', account: '', branch: '台灣台北店', shift: '早班', role: 'bm', isActive: true };
  taxDraft = { flag: '🇹🇼', country: '', branch: '', rate: 5 };
  branchDraft     = { name: '', city: '', country: '', address: '', phone: '' };
  editBranchDraft = { id: 0, name: '', city: '', country: '', address: '', phone: '' };

  showToast(msg: string): void {
    /* 清除所有計時器，重置離場狀態 */
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    if (this.toastLeaveTimer !== null) clearTimeout(this.toastLeaveTimer);
    this.toastLeaving.set(false);
    this.toastMsg.set(msg);

    /* 2300ms 後啟動淡出動畫（300ms），2600ms 後真正隱藏 */
    this.toastLeaveTimer = setTimeout(() => {
      this.toastLeaving.set(true);
      this.toastTimer = setTimeout(() => {
        this.toastMsg.set('');
        this.toastLeaving.set(false);
      }, 300);
    }, 2300);
  }

  /* 財務頁籤數字計數動畫（GSAP countTo 效果，純 JS 實作） */
  runFinanceCounter(): void {
    const duration = 900;   /* 動畫時長 ms */
    const fps = 60;
    const steps = Math.round(duration / (1000 / fps));

    const targets = [
      { signal: this.financeRevenue,  target: 1248000 },
      { signal: this.financeOrders,   target: 6284    },
      { signal: this.financeAvgPrice, target: 198     },
    ];

    targets.forEach(({ signal, target }) => {
      signal.set(0);
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        /* ease-out: 1 - (1 - t)^3 */
        const eased = 1 - Math.pow(1 - progress, 3);
        signal.set(Math.round(target * eased));
        if (step >= steps) {
          clearInterval(interval);
          signal.set(target);
        }
      }, 1000 / fps);
    });
  }

  /* ── 訂單篩選 ─────────────────────────────────── */
  orderFilterBranch = signal<string>('all');
  orderFilterStatus = signal<string>('all');

  allOrders = signal<DashOrder[]>([
    { id: '#TW-2060', branch: '台北', branchClass: 'badge-blue',  summary: '紅燒牛肉麵×1, 滷蛋×2',    amount: '$285',   payMethod: '現金',  time: '14:32', statusClass: 'badge-warn', statusLabel: '製作中' },
    { id: '#JP-1138', branch: '東京', branchClass: 'badge-teal',  summary: '印度咖哩飯×2, 饢餅×1',    amount: '¥1,900', payMethod: '信用卡', time: '14:28', statusClass: 'badge-ok',   statusLabel: '已完成' },
    { id: '#TH-0442', branch: '曼谷', branchClass: 'badge-ok',    summary: '越南河粉×1, 春捲×3',      amount: '฿380',   payMethod: 'QR Pay', time: '14:25', statusClass: 'badge-ok',   statusLabel: '已完成' },
    { id: '#TW-2058', branch: '台北', branchClass: 'badge-blue',  summary: '麻辣燙×1, 白飯×2',        amount: '$220',   payMethod: '現金',  time: '14:05', statusClass: 'badge-err',  statusLabel: '已取消' },
    { id: '#JP-1137', branch: '東京', branchClass: 'badge-teal',  summary: '牛肉河粉×1, 炒飯×1',      amount: '¥2,400', payMethod: '信用卡', time: '14:10', statusClass: 'badge-ok',   statusLabel: '已完成' },
    { id: '#TW-2057', branch: '台北', branchClass: 'badge-blue',  summary: '三杯雞飯×2',              amount: '$300',   payMethod: '行動支付', time: '13:55', statusClass: 'badge-ok',   statusLabel: '已完成' },
  ]);

  filteredOrders = computed(() => {
    return this.allOrders().filter(o => {
      const bf = this.orderFilterBranch();
      const sf = this.orderFilterStatus();
      /* 以完整分店名稱包含簡稱來比對（例：'台灣台北店'.includes('台北')） */
      const branchOk = bf === 'all' || bf.includes(o.branch);
      const statusOk = sf === 'all' || o.statusLabel === sf;
      return branchOk && statusOk;
    });
  });

  /* 計時器 ID */
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    public authService: AuthService,
    // ⚠ TODO [API串接點 - 步驟2]：取消下方 apiService 參數
    // private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user || user.role !== 'boss') {
      this.router.navigate(['/staff-login']);
      return;
    }
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    // ⚠ TODO [API串接點 - 載入分店清單]
    // 取消下方區塊，並將 branches signal 的初始值改為空陣列 []
    // this.apiService.getAllBranches().subscribe({
    //   next: (res) => {
    //     this.branches.set(res.branches.map((b: GlobalAreaVO) => ({
    //       id: b.id,
    //       name: b.branch,
    //       city: '',              // city 欄位後端未分離，可從 branch 名稱推導
    //       country: b.country,
    //       address: b.address,
    //       phone: b.phone
    //     })));
    //   },
    //   error: (err) => console.error('[Manager] 載入分店失敗', err)
    // });

    // ⚠ TODO [API串接點 - 載入稅率清單]
    // 取消下方區塊，並將 taxes signal 的初始值改為空陣列 []
    // this.apiService.getAllTax().subscribe({
    //   next: (res) => {
    //     this.taxes.set(res.regions.map((r: RegionVO) => ({
    //       id: r.id,
    //       flag: '🏳️',           // 後端無 flag，可用 country 對應旗幟
    //       country: r.country,
    //       branch: r.country + '分店',
    //       rate: +(r.taxRate * 100).toFixed(2),   // 0.05 → 5
    //       editing: false,
    //       editValue: +(r.taxRate * 100).toFixed(2)
    //     })));
    //   },
    //   error: (err) => console.error('[Manager] 載入稅率失敗', err)
    // });
  }

  ngOnDestroy(): void {
    if (this.clockInterval    !== null) clearInterval(this.clockInterval);
    if (this.toastTimer       !== null) clearTimeout(this.toastTimer);
    if (this.toastLeaveTimer  !== null) clearTimeout(this.toastLeaveTimer);
  }

  private updateClock(): void {
    const now  = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const yy   = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const dd   = String(now.getDate()).padStart(2, '0');
    const hh   = String(now.getHours()).padStart(2, '0');
    const min  = String(now.getMinutes()).padStart(2, '0');
    this.clockStr.set(`${yy}-${mm}-${dd} 星期${days[now.getDay()]} ${hh}:${min}`);
  }

  setTab(tab: DashTab): void {
    this.activeTab.set(tab);
    if (tab === 'finance') {
      /* 切換到財務頁時執行數字計數動畫 */
      setTimeout(() => this.runFinanceCounter(), 80);
    }
  }
  setUserSubTab(sub: UserSubTab): void { this.userSubTab.set(sub); }

  get topbarTitle(): string {
    return this.TAB_TITLES[this.activeTab()];
  }

  getAvatarLetter(): string {
    return this.authService.currentUser?.name?.charAt(0) ?? '?';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/staff-login']);
  }

  /* ── 商品：上/下架切換 ─────────────────────────── */
  toggleProduct(id: number): void {
    this.products.update(list =>
      list.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p)
    );
  }

  /* ── 活動：啟用/停用切換 ─────────────────────────── */
  togglePromo(id: number): void {
    this.promos.update(list =>
      list.map(p => p.id === id && !p.ended ? { ...p, isActive: !p.isActive } : p)
    );
  }

  /* ── 庫存：inline 調整 ─────────────────────────── */
  startAdjustInventory(id: number): void {
    const item = this.inventory().find(i => i.id === id);
    if (!item) return;
    this.adjustingInventoryId.set(id);
    this.adjustInventoryAmt.set(item.stock);
  }

  cancelAdjustInventory(): void {
    this.adjustingInventoryId.set(null);
  }

  onInventoryInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 0) this.adjustInventoryAmt.set(val);
  }

  confirmAdjustInventory(): void {
    const id  = this.adjustingInventoryId();
    const amt = this.adjustInventoryAmt();
    if (id === null) return;
    this.inventory.update(list =>
      list.map(i => i.id === id ? { ...i, stock: amt } : i)
    );
    this.adjustingInventoryId.set(null);
    this.adjustInventorySavedId.set(id);
    setTimeout(() => this.adjustInventorySavedId.set(null), 1800);
  }

  /* ── 帳號：停/復權 ─────────────────────────────── */
  toggleAccount(id: number): void {
    this.accounts.update(list =>
      list.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a)
    );
  }

  /* ── 稅率：啟動編輯 ─────────────────────────────── */
  startEditTax(id: number): void {
    this.taxes.update(list =>
      list.map(t => t.id === id ? { ...t, editing: true, editValue: t.rate } : t)
    );
  }

  onTaxInput(id: number, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this.taxes.update(list =>
        list.map(t => t.id === id ? { ...t, editValue: val } : t)
      );
    }
  }

  saveTax(id: number): void {
    this.taxes.update(list =>
      list.map(t => t.id === id ? { ...t, rate: t.editValue, editing: false } : t)
    );
    // ⚠ TODO [API串接點 - 更新稅率]
    // 取消下方區塊（需從稅率清單取得 country / currencyCode 等欄位）：
    // const target = this.taxes().find(t => t.id === id);
    // if (!target) return;
    // this.apiService.updateRegion({
    //   id: target.id,
    //   country: target.country,
    //   currencyCode: 'TWD',        // 需後端回傳 currencyCode，或建立 country→code 對照表
    //   taxRate: target.editValue / 100,  // UI 顯示 5 → 後端存 0.05
    //   taxType: 'INCLUSIVE'        // 依各國設定，可擴充為下拉選單
    // }).subscribe({
    //   next: () => this.showToast('✅ 稅率已同步至後端'),
    //   error: () => this.showToast('❌ 稅率更新失敗，請確認後端連線')
    // });
  }

  cancelEditTax(id: number): void {
    this.taxes.update(list =>
      list.map(t => t.id === id ? { ...t, editing: false } : t)
    );
  }

  /* ── 商品篩選 ─────────────────────────────────── */
  onCategoryFilter(event: Event): void {
    this.productCategoryFilter.set((event.target as HTMLSelectElement).value);
  }

  onProductSearch(event: Event): void {
    this.productSearch.set((event.target as HTMLInputElement).value);
  }

  /* ── Modal 關閉 ─────────────────────────────────────── */
  closeModal(): void {
    this.activeModal.set(null);
    this.selectedOrder.set(null);
    this.editingProductId.set(null);
  }

  /* ── 訂單：詳情 Modal ─────────────────────────────── */
  openOrderDetail(order: DashOrder): void {
    this.selectedOrder.set(order);
    this.activeModal.set('orderDetail');
  }

  /* ── 新增 / 編輯商品 Modal ─────────────────────────── */
  openAddProduct(): void {
    this.editingProductId.set(null);
    this.productDraft = { name: '', category: '台式', price: 165, stock: 0, emoji: '🍜' };
    this.activeModal.set('addProduct');
  }

  openEditProduct(id: number): void {
    const p = this.products().find(x => x.id === id);
    if (!p) return;
    this.editingProductId.set(id);
    this.productDraft = { name: p.name, category: p.category, price: p.price, stock: p.stock, emoji: p.emoji };
    this.activeModal.set('addProduct');
  }

  saveProduct(): void {
    if (!this.productDraft.name.trim()) { this.showToast('⚠️ 請輸入商品名稱'); return; }
    const emojiGradients: Record<string, string> = {
      '🍜': 'linear-gradient(135deg,#c49756,#8b5e3c)',
      '🍛': 'linear-gradient(135deg,#f59e0b,#d97706)',
      '🍲': 'linear-gradient(135deg,#3ecf8e,#10b981)',
      '🍝': 'linear-gradient(135deg,#818cf8,#6366f1)',
      '🌮': 'linear-gradient(135deg,#f87171,#ef4444)',
      '🧋': 'linear-gradient(135deg,#06b6d4,#0891b2)',
      '🍱': 'linear-gradient(135deg,#a78bfa,#7c3aed)',
      '🍣': 'linear-gradient(135deg,#fb923c,#ea580c)',
      '🍔': 'linear-gradient(135deg,#fbbf24,#d97706)',
      '🥗': 'linear-gradient(135deg,#4ade80,#16a34a)',
    };
    const editId = this.editingProductId();
    const savedName = this.productDraft.name;
    if (editId !== null) {
      /* 編輯既有商品 */
      this.products.update(list => list.map(p => p.id === editId ? {
        ...p,
        name: this.productDraft.name,
        category: this.productDraft.category,
        price: this.productDraft.price,
        stock: this.productDraft.stock,
        emoji: this.productDraft.emoji,
        emojiBg: emojiGradients[this.productDraft.emoji] ?? p.emojiBg
      } : p));
      this.closeModal();
      this.showToast(`✅ 商品「${savedName}」已更新`);
    } else {
      /* 新增商品 */
      const ids = this.products().map(p => p.id);
      const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      this.products.update(list => [...list, {
        id: newId,
        name: this.productDraft.name,
        category: this.productDraft.category,
        price: this.productDraft.price,
        stock: this.productDraft.stock,
        isActive: true,
        emoji: this.productDraft.emoji,
        emojiBg: emojiGradients[this.productDraft.emoji] ?? 'linear-gradient(135deg,#c49756,#8b5e3c)'
      }]);
      this.closeModal();
      this.showToast(`✅ 商品「${savedName}」已新增`);
    }
  }

  /* ── 新增活動 Modal ─────────────────────────────────── */
  openAddPromo(): void {
    this.promoDraft = { title: '', scope: '全部分店 · 期限：無限期', color: '#c49756' };
    this.activeModal.set('addPromo');
  }

  savePromo(): void {
    if (!this.promoDraft.title.trim()) { this.showToast('⚠️ 請輸入活動標題'); return; }
    const ids = this.promos().map(p => p.id);
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const savedTitle = this.promoDraft.title;
    this.promos.update(list => [...list, {
      id: newId,
      title: this.promoDraft.title,
      scope: this.promoDraft.scope,
      isActive: true,
      color: this.promoDraft.color,
      ended: false
    }]);
    this.closeModal();
    this.showToast(`✅ 活動「${savedTitle}」已新增`);
  }

  /* ── 新增 / 編輯帳號 Modal ─────────────────────────── */
  openAddAccount(): void {
    this.editingAccountId.set(null);
    this.accountDraft = { name: '', account: '', branch: '台灣台北店', shift: '早班', role: 'bm', isActive: true };
    this.activeModal.set('addAccount');
  }

  openEditAccount(id: number): void {
    const acc = this.accounts().find(a => a.id === id);
    if (!acc) return;
    this.editingAccountId.set(id);
    this.accountDraft = {
      name: acc.name,
      account: acc.account,
      branch: acc.branch ?? '台灣台北店',
      shift: acc.shift ?? '早班',
      role: acc.role,
      isActive: acc.isActive
    };
    this.activeModal.set('addAccount');
  }

  saveAccount(): void {
    if (!this.accountDraft.name.trim() || !this.accountDraft.account.trim()) {
      this.showToast('⚠️ 姓名與帳號為必填'); return;
    }
    const editId = this.editingAccountId();
    const savedName = this.accountDraft.name;
    if (editId !== null) {
      this.accounts.update(list => list.map(a => a.id === editId ? {
        ...a,
        name: this.accountDraft.name,
        account: this.accountDraft.account,
        branch: this.accountDraft.branch,
        shift: this.accountDraft.role === 'staff' ? this.accountDraft.shift : undefined,
        role: this.accountDraft.role,
        isActive: this.accountDraft.isActive
      } : a));
      this.closeModal();
      this.showToast(`✅ 帳號「${savedName}」已更新`);
    } else {
      const ids = this.accounts().map(a => a.id);
      const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      this.accounts.update(list => [...list, {
        id: newId,
        name: this.accountDraft.name,
        account: this.accountDraft.account,
        branch: this.accountDraft.branch,
        shift: this.accountDraft.role === 'staff' ? this.accountDraft.shift : undefined,
        lastLogin: '從未登入',
        isActive: this.accountDraft.isActive,
        role: this.accountDraft.role
      }]);
      this.closeModal();
      this.showToast(`✅ 帳號「${savedName}」已新增`);
    }
  }

  /* ── 新增國家稅率 Modal ─────────────────────────────── */
  openAddCountry(): void {
    this.taxDraft = { flag: '🏳️', country: '', branch: '', rate: 5 };
    this.activeModal.set('addCountry');
  }

  saveCountry(): void {
    if (!this.taxDraft.country.trim()) { this.showToast('⚠️ 請輸入國家名稱'); return; }
    const ids = this.taxes().map(t => t.id);
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const saved = { ...this.taxDraft };
    this.taxes.update(list => [...list, {
      id: newId,
      flag: saved.flag,
      country: saved.country,
      branch: saved.branch || `${saved.country}分店`,
      rate: saved.rate,
      editing: false,
      editValue: saved.rate
    }]);
    this.closeModal();
    this.showToast(`✅ 已新增 ${saved.flag} ${saved.country} 稅率 ${saved.rate}%`);
    // ⚠ TODO [API串接點 - 新增國家稅率]
    // 取消下方區塊，並移除上方 taxes.update / closeModal / showToast 這三行：
    // this.apiService.createRegion({
    //   country: saved.country.trim(),
    //   currencyCode: 'TWD',          // 可擴充為表單欄位
    //   taxRate: saved.rate / 100,    // UI 輸入 5 → 後端存 0.05
    //   taxType: 'INCLUSIVE'          // 可擴充為下拉選單
    // }).subscribe({
    //   next: () => {
    //     this.apiService.getAllTax().subscribe(res => {
    //       this.taxes.set(res.regions.map((r: RegionVO) => ({
    //         id: r.id, flag: '🏳️', country: r.country,
    //         branch: r.country + '分店',
    //         rate: +(r.taxRate * 100).toFixed(2),
    //         editing: false, editValue: +(r.taxRate * 100).toFixed(2)
    //       })));
    //     });
    //     this.closeModal();
    //     this.showToast(`✅ 已新增 ${saved.flag} ${saved.country} 稅率 ${saved.rate}%`);
    //   },
    //   error: () => this.showToast('❌ 新增失敗，請確認後端連線')
    // });
  }

  /* ── 財務報表：匯出 CSV（isExporting spinner 保護）── */
  exportCsv(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);

    /* 模擬非同步處理 600ms（實際串接後可改為真實 API call） */
    setTimeout(() => {
      const headers = ['訂單編號', '分店', '品項摘要', '金額', '付款方式', '時間', '狀態'];
      const rows = this.allOrders().map(o =>
        [o.id, o.branch, o.summary, o.amount, o.payMethod, o.time, o.statusLabel]
      );
      const csv = [headers, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.isExporting.set(false);
      this.showToast('✅ CSV 匯出成功，共 ' + this.allOrders().length + ' 筆訂單');
    }, 600);
  }

  /* ── 分店：新增 Modal ─────────────────────────────── */
  openAddBranch(): void {
    this.branchDraft = { name: '', city: '', country: '', address: '', phone: '' };
    this.activeModal.set('addBranch');
  }

  saveBranch(): void {
    if (!this.branchDraft.name.trim()) { this.showToast('⚠️ 請輸入分店名稱'); return; }
    const ids = this.branches().map(b => b.id);
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const saved = { ...this.branchDraft };
    this.branches.update(list => [...list, {
      id: newId,
      name: saved.name.trim(),
      city: saved.city.trim(),
      country: saved.country.trim(),
      address: saved.address.trim(),
      phone: saved.phone.trim()
    }]);
    this.closeModal();
    this.showToast(`✅ 分店「${saved.name.trim()}」已新增`);
    // ⚠ TODO [API串接點 - 新增分店]
    // 取消下方區塊，並移除上方 branches.update / closeModal / showToast 這三行：
    // this.apiService.createBranch({
    //   country: saved.country.trim(),
    //   branch: saved.name.trim(),
    //   address: saved.address.trim(),
    //   phone: saved.phone.trim()
    // }).subscribe({
    //   next: () => {
    //     this.apiService.getAllBranches().subscribe(res => {
    //       this.branches.set(res.branches.map((b: GlobalAreaVO) => ({
    //         id: b.id, name: b.branch, city: '', country: b.country,
    //         address: b.address, phone: b.phone
    //       })));
    //     });
    //     this.closeModal();
    //     this.showToast(`✅ 分店「${saved.name.trim()}」已新增`);
    //   },
    //   error: () => this.showToast('❌ 新增失敗，請確認後端連線')
    // });
  }

  /* ── 分店：編輯 Modal ─────────────────────────────── */
  openEditBranch(id: number): void {
    const b = this.branches().find(x => x.id === id);
    if (!b) return;
    this.editBranchDraft = { ...b };
    this.activeModal.set('editBranch');
  }

  saveEditBranch(): void {
    if (!this.editBranchDraft.name.trim()) { this.showToast('⚠️ 請輸入分店名稱'); return; }
    const saved = { ...this.editBranchDraft };
    this.branches.update(list =>
      list.map(b => b.id === saved.id ? {
        ...b,
        name:    saved.name.trim(),
        city:    saved.city.trim(),
        country: saved.country.trim(),
        address: saved.address.trim(),
        phone:   saved.phone.trim()
      } : b)
    );
    this.closeModal();
    this.showToast(`✅ 分店「${saved.name.trim()}」已更新`);
    // ⚠ TODO [API串接點 - 修改分店]
    // 取消下方區塊，並移除上方 branches.update / closeModal / showToast 這三行：
    // this.apiService.updateBranch({
    //   id: saved.id,
    //   country: saved.country.trim(),
    //   branch: saved.name.trim(),
    //   address: saved.address.trim(),
    //   phone: saved.phone.trim()
    // }).subscribe({
    //   next: () => {
    //     this.apiService.getAllBranches().subscribe(res => {
    //       this.branches.set(res.branches.map((b: GlobalAreaVO) => ({
    //         id: b.id, name: b.branch, city: '', country: b.country,
    //         address: b.address, phone: b.phone
    //       })));
    //     });
    //     this.closeModal();
    //     this.showToast(`✅ 分店「${saved.name.trim()}」已更新`);
    //   },
    //   error: () => this.showToast('❌ 更新失敗，請確認後端連線')
    // });
  }

  /* ── 分店：刪除 ───────────────────────────────────── */
  deleteBranch(id: number): void {
    const b = this.branches().find(x => x.id === id);
    if (!b) return;
    if (!confirm(`確定刪除分店「${b.name}」？此操作無法復原。`)) return;
    this.branches.update(list => list.filter(x => x.id !== id));
    this.showToast(`🗑️ 分店「${b.name}」已刪除`);
    // ⚠ TODO [API串接點 - 刪除分店]
    // 取消下方區塊，並移除上方 branches.update / showToast 這兩行：
    // this.apiService.deleteBranch({ id }).subscribe({
    //   next: () => {
    //     this.branches.update(list => list.filter(x => x.id !== id));
    //     this.showToast(`🗑️ 分店「${b.name}」已刪除`);
    //   },
    //   error: () => this.showToast('❌ 刪除失敗，請確認後端連線')
    // });
  }

  /* ── 訂單篩選 ─────────────────────────────────── */
  onBranchFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    /* '全部分店' → 'all'；其餘直接使用完整分店名稱供 filteredOrders 比對 */
    this.orderFilterBranch.set(val === '全部分店' ? 'all' : val);
  }

  onStatusFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const map: Record<string, string> = {
      '全部': 'all', '待製作': '待製作', '製作中': '製作中', '已完成': '已完成', '已取消': '已取消'
    };
    this.orderFilterStatus.set(map[val] ?? 'all');
  }
}

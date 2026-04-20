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
import { ApiService, GlobalAreaVO, RegionVO, PromotionDetailVo, ProductVO, BranchInventoryVO } from '../shared/api.service';

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
  rawName: string;       /* API 原始名稱，toggle 時帶回後端（@NotBlank 需要）*/
  rawStartTime: string;  /* YYYY-MM-DD，toggle 時帶回後端（@NotNull 需要）*/
  rawEndTime: string;    /* YYYY-MM-DD，toggle 時帶回後端（@NotNull 需要）*/
  type: 'promotion' | 'announcement';
  description?: string;
  image?: string;
  badgeColor?: string;
  minAmount?: number;
}

/* ── 庫存型別 ──────────────────────────────────────── */
interface DashInventory {
  id: number;
  productId: number;
  globalAreaId: number;
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
  joinedAt: string;
  isActive: boolean;
  role: 'bm' | 'staff';
  country?: string;
}

/* ── 分店型別（對應 global_area 資料表）───────────── */
interface DashBranch {
  id: number;
  name: string;      /* 完整分店名稱，例：台灣台北店 (= branch) */
  city: string;      /* 城市，例：台北 */
  country: string;   /* 國家，例：台灣（顯示用） */
  regionsId: number; /* 對應 Regions 表 id（API 用） */
  address: string;   /* 地址 */
  phone: string;     /* 電話 */
}

/* ── 稅率型別 ──────────────────────────────────────── */
interface DashTax {
  id: number;
  country: string;
  countryCode: string; /* 國別代碼，例 TW / JP / KR */
  currency: string;    /* 幣別代碼，例 TWD / JPY / KRW */
  taxType: string;     /* 'INCLUSIVE'（內含稅）| 'EXCLUSIVE'（外加稅） */
  rate: number;
  discountLimit?: number; /* 折扣上限金額（當地幣別） */
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
    orders:     '📋 我的訂單',
    products:   '🛍️ 商品管理',
    promotions: '🎯 活動管理',
    inventory:  '📦 庫存管理',
    users:      '👥 帳號管理',
    tax:        '🌍 國家基本設定',
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
    { id: 1, title: '滿 $300 贈招牌滷蛋×2',  scope: '全部分店',    isActive: true,  color: '#c49756', ended: false, rawName: '滿 $300 贈招牌滷蛋×2',  rawStartTime: '2026-01-01', rawEndTime: '2099-12-31', type: 'promotion',    description: '消費滿 $300 即贈招牌滷蛋兩顆，無使用期限。', badgeColor: '#c49756', minAmount: 300 },
    { id: 2, title: '週一 9 折優惠',          scope: '日本東京店',  isActive: true,  color: '#4f8ef7', ended: false, rawName: '週一 9 折優惠',          rawStartTime: '2026-01-01', rawEndTime: '2026-06-30', type: 'promotion',    description: '每週一全品項享 9 折優惠，適用於東京店。',     badgeColor: '#4f8ef7', minAmount: undefined },
    { id: 3, title: '夏季新菜單上線公告',      scope: '全部分店',    isActive: true,  color: '#c084fc', ended: false, rawName: '夏季新菜單上線公告',      rawStartTime: '2026-04-01', rawEndTime: '2026-06-30', type: 'announcement', description: '2026 夏季菜單已正式上線，新增 6 款季節限定料理。', badgeColor: '#c084fc', minAmount: undefined },
    { id: 4, title: '週年慶全館 8 折',         scope: '全部分店',    isActive: false, color: '#6b7280', ended: true,  rawName: '週年慶全館 8 折',         rawStartTime: '2025-01-01', rawEndTime: '2025-12-31', type: 'promotion',    description: '週年慶期間全館商品享 8 折，活動已結束。',     badgeColor: '#6b7280', minAmount: undefined },
  ]);

  /* ── 活動分類篩選 Tab ────────────────────────────── */
  promoTypeTab = signal<'all' | 'promotion' | 'announcement'>('all');

  filteredPromos = computed(() => {
    const tab = this.promoTypeTab();
    if (tab === 'all') return this.promos();
    return this.promos().filter(p => p.type === tab);
  });

  promoPromotionCount = computed(() => this.promos().filter(p => p.type === 'promotion').length);
  promoAnnouncementCount = computed(() => this.promos().filter(p => p.type === 'announcement').length);

  /* ── 庫存清單（Signal） ─────────────────────────── */
  inventory = signal<DashInventory[]>([
    { id: 1, productId: 1, globalAreaId: 1, name: '紅燒牛肉麵',    category: '台式', branch: '台北店',   stock: 48,  safeStock: 10 },
    { id: 2, productId: 3, globalAreaId: 2, name: '越南牛肉河粉',  category: '南洋', branch: '曼谷店',   stock: 5,   safeStock: 10 },
    { id: 3, productId: 4, globalAreaId: 3, name: '義式肉醬寬麵',  category: '西式', branch: '東京店',   stock: 0,   safeStock: 10 },
    { id: 4, productId: 2, globalAreaId: 1, name: '印度奶油咖哩飯',category: '南洋', branch: '台北店',   stock: 32,  safeStock: 10 },
    { id: 5, productId: 6, globalAreaId: 1, name: '珍珠奶茶',      category: '飲品', branch: '全部分店', stock: 120, safeStock: 30 },
  ]);

  /* 庫存調整狀態 */
  adjustingInventoryId  = signal<number | null>(null);
  adjustInventoryAmt    = signal<number>(0);
  adjustInventorySavedId = signal<number | null>(null);

  /* ── 帳號清單（Signal） ─────────────────────────── */
  accounts = signal<DashAccount[]>([
    { id: 1, name: '陳美玲',     account: 'chen.ml',   branch: '台灣台北店', joinedAt: '2024-03-15', isActive: true,  role: 'bm',    country: 'TW' },
    { id: 2, name: '田中一郎',   account: 'tanaka.i',  branch: '日本東京店', joinedAt: '2024-06-01', isActive: true,  role: 'bm',    country: 'JP' },
    { id: 3, name: 'Somchai P.', account: 'somchai.p', branch: '泰國曼谷店', joinedAt: '2024-09-20', isActive: false, role: 'bm',    country: 'TH' },
    { id: 4, name: '王小明',     account: 'wang.xm',   shift: '早班',        joinedAt: '2025-01-10', isActive: true,  role: 'staff', branch: '台北店', country: 'TW' },
    { id: 5, name: '李佳靜',     account: 'lee.jj',    shift: '晚班',        joinedAt: '2025-03-22', isActive: true,  role: 'staff', branch: '台北店', country: 'TW' },
    { id: 6, name: 'Yuki T.',    account: 'yuki.t',    shift: '全天',        joinedAt: '2025-07-08', isActive: true,  role: 'staff', branch: '東京店', country: 'JP' },
  ]);

  bmAccounts    = computed(() => this.accounts().filter(a => a.role === 'bm'));
  staffAccounts = computed(() => this.accounts().filter(a => a.role === 'staff'));

  /* ── 稅率清單（Signal） ─────────────────────────── */
  taxes = signal<DashTax[]>([
    { id: 1, country: '台灣', countryCode: 'TW', currency: 'TWD', taxType: 'INCLUSIVE', rate: 5,  discountLimit: 200,   editing: false, editValue: 5  },
    { id: 2, country: '日本', countryCode: 'JP', currency: 'JPY', taxType: 'INCLUSIVE', rate: 10, discountLimit: 1000,  editing: false, editValue: 10 },
    { id: 3, country: '韓國', countryCode: 'KR', currency: 'KRW', taxType: 'EXCLUSIVE', rate: 10, discountLimit: 10000, editing: false, editValue: 10 },
  ]);

  /* ── 國家設定子頁籤 ──────────────────────────────── */
  taxSubTab = signal<'tax' | 'discount'>('tax');

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
    { id: 1, name: '台灣台北店', city: '台北', country: '台灣', regionsId: 1, address: '台北市中山區南京東路一段 88 號', phone: '02-2345-6789' },
    { id: 2, name: '日本東京店', city: '東京', country: '日本', regionsId: 2, address: '東京都新宿区新宿3-10-1',          phone: '+81-3-1234-5678' },
    { id: 3, name: '泰國曼谷店', city: '曼谷', country: '泰國', regionsId: 3, address: '101 Sukhumvit Rd, Bangkok',       phone: '+66-2-987-6543' },
  ]);

  /* ── Modal 狀態 ─────────────────────────────────────── */
  activeModal       = signal<'orderDetail' | 'addProduct' | 'addPromo' | 'addGift' | 'addAccount' | 'addCountry' | 'addBranch' | 'editBranch' | null>(null);
  selectedOrder     = signal<DashOrder | null>(null);
  editingAccountId  = signal<number | null>(null);
  editingProductId  = signal<number | null>(null);

  /* ── 表單草稿（普通屬性，開啟 modal 時重置） ─────────── */
  productDraft = { name: '', category: '台式', price: 165, stock: 0, emoji: '🍜' };
  promoDraft   = { name: '', type: 'promotion' as 'promotion' | 'announcement', description: '', startTime: '', endTime: '', color: '#c49756', badgeColor: '#c49756', minAmount: null as number | null, image: '', currency: 'NT$' };
  showPromoPanel = signal(false);
  giftDraft    = { promoId: 0, rawName: '', rawStartTime: '', rawEndTime: '', fullAmount: 300, giftProductId: null as number | null, quantity: -1 };
  accountDraft: { name: string; account: string; password: string; branch: string; shift: string; role: 'bm' | 'staff'; isActive: boolean; country: string } =
    { name: '', account: '', password: '', branch: '台灣台北店', shift: '早班', role: 'bm', isActive: true, country: 'TW' };
  taxDraft: { country: string; countryCode: string; currency: string; taxType: 'INCLUSIVE' | 'EXCLUSIVE'; rate: number; effectiveDate: string; discountLimit: number } =
    { country: '', countryCode: '', currency: '', taxType: 'INCLUSIVE', rate: 5, effectiveDate: '', discountLimit: 0 };
  branchDraft     = { regionsId: 0, city: '', address: '', phone: '' };
  editBranchDraft = { id: 0, regionsId: 0, city: '', address: '', phone: '' };

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
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user || user.role !== 'boss') {
      this.router.navigate(['/staff-login']);
      return;
    }
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.loadBranches();
    this.loadTaxes();
    this.loadPromos();
    this.loadProducts();
    this.loadInventory();
  }

  ngOnDestroy(): void {
    if (this.clockInterval    !== null) clearInterval(this.clockInterval);
    if (this.toastTimer       !== null) clearTimeout(this.toastTimer);
    if (this.toastLeaveTimer  !== null) clearTimeout(this.toastLeaveTimer);
  }

  /* ── 國家 → 旗幟 Emoji 對照 ─────────────────────── */
  private countryToFlag(country: string): string {
    const map: Record<string, string> = {
      '台灣': '🇹🇼', '日本': '🇯🇵', '泰國': '🇹🇭', '韓國': '🇰🇷',
      '美國': '🇺🇸', '英國': '🇬🇧', '法國': '🇫🇷', '德國': '🇩🇪',
      '中國': '🇨🇳', '印度': '🇮🇳', '澳洲': '🇦🇺', '加拿大': '🇨🇦',
      '新加坡': '🇸🇬', '馬來西亞': '🇲🇾', '印尼': '🇮🇩', '越南': '🇻🇳',
    };
    return map[country] ?? '🏳️';
  }

  /* ── 從後端重新載入分店清單 ──────────────────────── */
  private loadBranches(): void {
    this.apiService.getAllBranches().subscribe({
      next: (res) => {
        if (res?.globalAreaList?.length) {
          this.branches.set(res.globalAreaList.map((b: GlobalAreaVO) => ({
            id: b.id, name: b.branch, city: '',
            country: b.country, regionsId: b.regionsId ?? 0,
            address: b.address, phone: b.phone
          })));
        }
        /* 若後端回傳空清單，保留 mock 初始值供 Demo 使用 */
      },
      error: () => console.warn('[Manager] 分店 API 連線失敗，使用 Demo 資料')
    });
  }

  /* ── 從後端重新載入稅率清單 ──────────────────────── */
  private loadTaxes(): void {
    this.apiService.getAllTax().subscribe({
      next: (res) => {
        if (res?.regionsList?.length) {
          this.taxes.set(res.regionsList.map((r: RegionVO) => ({
            id:          r.id,
            country:     r.country,
            countryCode: '',
            currency:    r.currencyCode,
            taxType:     r.taxType ?? 'INCLUSIVE',
            rate:        +(+r.taxRate * 100).toFixed(2),
            editing:     false,
            editValue:   +(+r.taxRate * 100).toFixed(2)
          })));
        }
      },
      error: () => console.warn('[Manager] 稅率 API 連線失敗，使用 Demo 資料')
    });
  }

  /* ── 從後端重新載入促銷活動清單 ─────────────────── */
  private loadPromos(): void {
    this.apiService.getPromotionsList().subscribe({
      next: (res) => {
        if (res?.data?.length) {
          this.promos.set(res.data.map((p: PromotionDetailVo) => ({
            id: p.id,
            title: p.name + (p.gifts?.length ? `（${p.gifts.length} 項贈品）` : ''),
            scope: `${p.startTime} ～ ${p.endTime}`,
            isActive: p.active,
            color: p.active ? '#c49756' : 'rgba(255,255,255,0.18)',
            ended: !!p.endTime && new Date(p.endTime) < new Date(),
            rawName:      p.name,
            rawStartTime: p.startTime,
            rawEndTime:   p.endTime,
            type:         'promotion' as const,
          })));
        }
      },
      error: () => console.warn('[Manager] 活動 API 連線失敗，使用 Demo 資料')
    });
  }

  /* ── 從後端載入商品清單 ──────────────────────────── */
  private loadProducts(globalAreaId = 1): void {
    this.apiService.getAllProducts(globalAreaId).subscribe({
      next: (res) => {
        if (res?.products?.length) {
          const emojiMap: Record<string, string> = {
            '台式': '🍜', '南洋': '🍛', '西式': '🍝', '飲品': '🧋'
          };
          const bgMap: Record<string, string> = {
            '台式': 'linear-gradient(135deg,#c49756,#8b5e3c)',
            '南洋': 'linear-gradient(135deg,#f59e0b,#d97706)',
            '西式': 'linear-gradient(135deg,#818cf8,#6366f1)',
            '飲品': 'linear-gradient(135deg,#06b6d4,#0891b2)',
          };
          this.products.set(res.products.map((p: ProductVO) => ({
            id:       p.id,
            name:     p.name,
            category: p.category,
            price:    p.basePrice,
            stock:    p.stockQuantity,
            isActive: p.active,
            emoji:    emojiMap[p.category] ?? '🍽️',
            emojiBg:  bgMap[p.category]   ?? 'linear-gradient(135deg,#6b7280,#374151)',
          })));
        }
        /* 若後端回空清單，保留 mock 初始值供 Demo 使用 */
      },
      error: () => console.warn('[Manager] 商品 API 連線失敗，使用 Demo 資料')
    });
  }

  /* ── 從後端載入庫存清單 ──────────────────────────── */
  private loadInventory(globalAreaId = 1): void {
    this.apiService.getBranchInventory(globalAreaId).subscribe({
      next: (res) => {
        if (res?.inventory?.length) {
          this.inventory.set(res.inventory.map((inv: BranchInventoryVO) => ({
            id:           inv.id,
            productId:    inv.productId,
            globalAreaId: inv.globalAreaId,
            name:         inv.productName,
            category:     inv.category,
            branch:       `分店 ${inv.globalAreaId}`,
            stock:        inv.stockQuantity,
            safeStock:    10,
          })));
        }
        /* 若後端回空清單，保留 mock 初始值供 Demo 使用 */
      },
      error: () => console.warn('[Manager] 庫存 API 連線失敗，使用 Demo 資料')
    });
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
    const p = this.products().find(x => x.id === id);
    if (!p) return;
    const newActive = !p.isActive;
    /* 樂觀更新 UI */
    this.products.update(list =>
      list.map(x => x.id === id ? { ...x, isActive: newActive } : x)
    );
    this.apiService.toggleProduct({ id, active: newActive }).subscribe({
      next: () => this.loadProducts(),
      error: () => {
        /* 失敗時還原 */
        this.products.update(list =>
          list.map(x => x.id === id ? { ...x, isActive: !newActive } : x)
        );
        this.showToast('⚠️ 切換上下架失敗，請重試');
      }
    });
  }

  /* ── 今日日期（YYYY-MM-DD），供活動開始日期 [min] 使用 ── */
  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /* ── 活動：刪除 ─────────────────────────────────── */
  deletePromo(id: number): void {
    const promo = this.promos().find(p => p.id === id);
    if (!promo) return;
    if (!confirm(`確定刪除活動「${promo.rawName}」？此操作無法復原。`)) return;
    this.promos.update(list => list.filter(p => p.id !== id));
    this.showToast(`🗑️ 活動「${promo.rawName}」已刪除`);
  }

  /* ── 活動：啟用/停用切換 ─────────────────────────── */
  togglePromo(id: number): void {
    const current = this.promos().find(p => p.id === id);
    if (!current || current.ended) return;
    const newActive = !current.isActive;
    /* 樂觀更新 UI */
    this.promos.update(list =>
      list.map(p => p.id === id ? { ...p, isActive: newActive, color: newActive ? '#c49756' : 'rgba(255,255,255,0.18)' } : p)
    );
    this.apiService.togglePromotion({
      name:      current.rawName,
      startTime: current.rawStartTime,
      endTime:   current.rawEndTime,
      promotionsId: id,
      active:    newActive
    }).subscribe({
      next: () => this.showToast(newActive ? '✅ 活動已啟用' : '⏸️ 活動已暫停'),
      error: () => {
        /* API 失敗時還原 */
        this.promos.update(list =>
          list.map(p => p.id === id ? { ...p, isActive: !newActive, color: !newActive ? '#c49756' : 'rgba(255,255,255,0.18)' } : p)
        );
        this.showToast('❌ 切換失敗，請確認後端連線');
      }
    });
  }

  /* ── 活動：新增贈品規則 ─────────────────────────── */
  openAddGift(promoId: number): void {
    const promo = this.promos().find(p => p.id === promoId);
    if (!promo) return;
    this.giftDraft = {
      promoId,
      rawName:      promo.rawName,
      rawStartTime: promo.rawStartTime,
      rawEndTime:   promo.rawEndTime,
      fullAmount:   300,
      giftProductId: null,
      quantity:     -1,
    };
    this.activeModal.set('addGift');
  }

  saveGift(): void {
    if (this.giftDraft.giftProductId == null || this.giftDraft.giftProductId < 1) { this.showToast('⚠️ 請輸入贈品商品 ID（需大於 0）'); return; }
    if (this.giftDraft.fullAmount <= 0) { this.showToast('⚠️ 滿額門檻需大於 0'); return; }
    const d = this.giftDraft;
    this.apiService.addGift({
      name:         d.rawName,
      startTime:    d.rawStartTime,
      endTime:      d.rawEndTime,
      promotionsId: d.promoId,
      fullAmount:   d.fullAmount,
      giftProductId: d.giftProductId!,
      quantity:     d.quantity,
    }).subscribe({
      next: () => {
        this.loadPromos();
        this.closeModal();
        this.showToast('✅ 贈品規則已新增');
      },
      error: () => this.showToast('❌ 新增失敗，請確認後端連線'),
    });
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
    const item = this.inventory().find(i => i.id === id);
    this.inventory.update(list =>
      list.map(i => i.id === id ? { ...i, stock: amt } : i)
    );
    this.adjustingInventoryId.set(null);
    this.adjustInventorySavedId.set(id);
    setTimeout(() => this.adjustInventorySavedId.set(null), 1800);
    if (item) {
      this.apiService.updateBranchInventory({
        productId:    item.productId,
        globalAreaId: item.globalAreaId,
        stockQuantity: amt,
      }).subscribe({
        next:  () => this.loadInventory(),
        error: () => this.showToast('⚠️ 庫存更新失敗，本地已儲存'),
      });
    }
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
    /* 先樂觀更新 UI */
    this.taxes.update(list =>
      list.map(t => t.id === id ? { ...t, rate: t.editValue, editing: false } : t)
    );
    const target = this.taxes().find(t => t.id === id);
    if (!target) return;
    /* 同步至後端（currencyCode 以國家查詢，或以 TWD 作預設） */
    const currencyMap: Record<string, string> = {
      '台灣': 'TWD', '日本': 'JPY', '泰國': 'THB', '韓國': 'KRW',
      '美國': 'USD', '英國': 'GBP', '法國': 'EUR', '德國': 'EUR',
      '新加坡': 'SGD', '馬來西亞': 'MYR', '印尼': 'IDR', '越南': 'VND',
    };
    this.apiService.updateRegion({
      id: target.id,
      country: target.country,
      currencyCode: target.currency || currencyMap[target.country] || 'USD',
      taxRate: target.editValue / 100,
      taxType: target.taxType as 'INCLUSIVE' | 'EXCLUSIVE'
    }).subscribe({
      next: () => this.showToast('稅率已同步至後端'),
      error: () => this.showToast('稅率已更新，後端同步失敗（請確認連線）')
    });
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
      this.apiService.updateProduct({ id: editId, name: this.productDraft.name, category: this.productDraft.category }).subscribe({
        next: () => this.loadProducts(),
        error: () => this.showToast('⚠️ 後端更新失敗，本地已儲存')
      });
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
      this.apiService.createProduct({
        name: this.productDraft.name,
        category: this.productDraft.category,
        globalAreaId: 1,
        basePrice: this.productDraft.price,
        stockQuantity: this.productDraft.stock,
      }).subscribe({
        next: () => this.loadProducts(),
        error: () => this.showToast('⚠️ 後端新增失敗，本地已儲存')
      });
    }
  }

  /* ── 新增活動 Slide-in Panel ───────────────────────── */
  openAddPromo(): void {
    this.promoDraft = { name: '', type: 'promotion', description: '', startTime: '', endTime: '', color: '#c49756', badgeColor: '#c49756', minAmount: null, image: '', currency: 'NT$' };
    this.showPromoPanel.set(true);
  }

  closePromoPanel(): void {
    this.showPromoPanel.set(false);
  }

  onPromoBadgeColorPick(color: string): void {
    this.promoDraft.badgeColor = color;
    this.promoDraft.color = color;
  }

  onPromoImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = (e) => { this.promoDraft.image = e.target?.result as string; };
    reader.readAsDataURL(input.files[0]);
  }

  savePromo(): void {
    if (!this.promoDraft.name.trim()) { this.showToast('請輸入活動名稱'); return; }
    if (!this.promoDraft.startTime || !this.promoDraft.endTime) {
      this.showToast('請填寫活動開始與結束日期'); return;
    }
    const saved = { ...this.promoDraft };
    this.apiService.createPromotion({
      name: saved.name.trim(),
      startTime: saved.startTime,
      endTime: saved.endTime
    }).subscribe({
      next: () => {
        this.loadPromos();
        this.closePromoPanel();
        this.showToast(`活動「${saved.name.trim()}」已新增`);
      },
      error: () => {
        const ids = this.promos().map(p => p.id);
        const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        this.promos.update(list => [...list, {
          id: newId,
          title: saved.name.trim(),
          scope: `${saved.startTime} ～ ${saved.endTime}`,
          isActive: true,
          color: saved.badgeColor || '#c49756',
          ended: false,
          rawName:      saved.name.trim(),
          rawStartTime: saved.startTime,
          rawEndTime:   saved.endTime,
          type:         saved.type,
          description:  saved.description,
          image:        saved.image,
          badgeColor:   saved.badgeColor,
          minAmount:    saved.minAmount ?? undefined,
        }]);
        this.closePromoPanel();
        this.showToast(`後端暫不可用，已本地新增「${saved.name.trim()}」`);
      }
    });
  }

  /* ── 新增 / 編輯帳號 Modal ─────────────────────────── */
  openAddAccount(): void {
    this.editingAccountId.set(null);
    this.accountDraft = { name: '', account: '', password: '', branch: '台灣台北店', shift: '早班', role: 'bm', isActive: true, country: 'TW' };
    this.activeModal.set('addAccount');
  }

  openEditAccount(id: number): void {
    const acc = this.accounts().find(a => a.id === id);
    if (!acc) return;
    this.editingAccountId.set(id);
    this.accountDraft = {
      name: acc.name,
      account: acc.account,
      password: '',
      branch: acc.branch ?? '台灣台北店',
      shift: acc.shift ?? '早班',
      role: acc.role,
      isActive: acc.isActive,
      country: acc.country ?? 'TW'
    };
    this.activeModal.set('addAccount');
  }

  saveAccount(): void {
    if (!this.accountDraft.name.trim() || !this.accountDraft.account.trim()) {
      this.showToast('⚠️ 姓名與帳號為必填'); return;
    }
    if (this.editingAccountId() === null && !this.accountDraft.password.trim()) {
      this.showToast('⚠️ 新增帳號時密碼為必填'); return;
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
        isActive: this.accountDraft.isActive,
        country: this.accountDraft.country
      } : a));
      this.closeModal();
      this.showToast(`✅ 帳號「${savedName}」已更新`);
    } else {
      const ids = this.accounts().map(a => a.id);
      const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      const today = new Date().toISOString().slice(0, 10);
      this.accounts.update(list => [...list, {
        id: newId,
        name: this.accountDraft.name,
        account: this.accountDraft.account,
        branch: this.accountDraft.branch,
        shift: this.accountDraft.role === 'staff' ? this.accountDraft.shift : undefined,
        joinedAt: today,
        isActive: this.accountDraft.isActive,
        role: this.accountDraft.role,
        country: this.accountDraft.country
      }]);
      this.closeModal();
      this.showToast(`✅ 帳號「${savedName}」已新增`);
    }
  }

  /* ── 新增國家稅率 Modal ─────────────────────────────── */
  openAddCountry(): void {
    this.taxDraft = { country: '', countryCode: '', currency: '', taxType: 'INCLUSIVE', rate: 5, effectiveDate: '', discountLimit: 0 };
    this.activeModal.set('addCountry');
  }

  saveCountry(): void {
    if (!this.taxDraft.country.trim()) { this.showToast('請輸入國家／地區名稱'); return; }
    const saved = { ...this.taxDraft };
    const currencyMap: Record<string, string> = {
      '台灣': 'TWD', '日本': 'JPY', '泰國': 'THB', '韓國': 'KRW',
      '美國': 'USD', '英國': 'GBP', '法國': 'EUR', '德國': 'EUR',
      '新加坡': 'SGD', '馬來西亞': 'MYR', '印尼': 'IDR', '越南': 'VND',
    };
    const resolvedCurrency = saved.currency.trim() || currencyMap[saved.country.trim()] || 'USD';
    const taxTypeLabel = saved.taxType === 'INCLUSIVE' ? '內含稅' : '外加稅';
    this.apiService.createRegion({
      country: saved.country.trim(),
      currencyCode: resolvedCurrency,
      taxRate: saved.rate / 100,
      taxType: saved.taxType as 'INCLUSIVE' | 'EXCLUSIVE'
    }).subscribe({
      next: () => {
        this.loadTaxes();
        this.closeModal();
        this.showToast(`已新增 ${saved.country}（${resolvedCurrency}）${taxTypeLabel} ${saved.rate}%`);
      },
      error: () => {
        /* API 失敗時降級為本地更新 */
        const ids = this.taxes().map(t => t.id);
        const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        this.taxes.update(list => [...list, {
          id: newId,
          country: saved.country,
          countryCode: saved.countryCode.trim().toUpperCase(),
          currency: resolvedCurrency,
          taxType: saved.taxType,
          rate: saved.rate,
          discountLimit: saved.discountLimit || undefined,
          editing: false,
          editValue: saved.rate
        }]);
        this.closeModal();
        this.showToast(`後端暫不可用，已本地新增 ${saved.country}（${resolvedCurrency}）`);
      }
    });
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

  /* ── 分店：輔助 — 依 regionsId 查國家名稱 ────────── */
  getBranchCountryName(regionsId: number): string {
    return this.taxes().find(t => t.id === regionsId)?.country ?? '';
  }

  /* ── 分店：新增 Modal ─────────────────────────────── */
  openAddBranch(): void {
    this.branchDraft = { regionsId: 0, city: '', address: '', phone: '' };
    this.activeModal.set('addBranch');
  }

  saveBranch(): void {
    if (!this.branchDraft.regionsId || !this.branchDraft.city.trim()) {
      this.showToast('⚠️ 請選擇國家與城市'); return;
    }
    const saved = { ...this.branchDraft };
    const countryName = this.getBranchCountryName(saved.regionsId);
    const autoName    = `${countryName}${saved.city.trim()}店`;
    this.apiService.createBranch({
      regionsId: saved.regionsId,
      branch:    autoName,
      address:   saved.address.trim(),
      phone:     saved.phone.trim(),
    }).subscribe({
      next: () => {
        this.loadBranches();
        this.closeModal();
        this.showToast(`✅ 分店「${autoName}」已新增`);
      },
      error: () => {
        const ids   = this.branches().map(b => b.id);
        const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        this.branches.update(list => [...list, {
          id: newId, name: autoName, city: saved.city.trim(),
          country: countryName, regionsId: saved.regionsId,
          address: saved.address.trim(), phone: saved.phone.trim(),
        }]);
        this.closeModal();
        this.showToast(`⚠️ 後端暫不可用，僅本地新增分店「${autoName}」`);
      },
    });
  }

  /* ── 分店：編輯 Modal ─────────────────────────────── */
  openEditBranch(id: number): void {
    const b = this.branches().find(x => x.id === id);
    if (!b) return;
    this.editBranchDraft = { id: b.id, regionsId: b.regionsId, city: b.city, address: b.address, phone: b.phone };
    this.activeModal.set('editBranch');
  }

  saveEditBranch(): void {
    if (!this.editBranchDraft.regionsId || !this.editBranchDraft.city.trim()) {
      this.showToast('⚠️ 請選擇國家與城市'); return;
    }
    const saved       = { ...this.editBranchDraft };
    const countryName = this.getBranchCountryName(saved.regionsId);
    const autoName    = `${countryName}${saved.city.trim()}店`;
    this.apiService.updateBranch({
      id:        saved.id,
      regionsId: saved.regionsId,
      branch:    autoName,
      address:   saved.address.trim(),
      phone:     saved.phone.trim(),
    }).subscribe({
      next: () => {
        this.loadBranches();
        this.closeModal();
        this.showToast(`✅ 分店「${autoName}」已更新`);
      },
      error: () => {
        this.branches.update(list =>
          list.map(b => b.id === saved.id ? {
            ...b, name: autoName, city: saved.city.trim(),
            country: countryName, regionsId: saved.regionsId,
            address: saved.address.trim(), phone: saved.phone.trim(),
          } : b)
        );
        this.closeModal();
        this.showToast(`⚠️ 後端暫不可用，僅本地更新分店「${autoName}」`);
      },
    });
  }

  /* ── 分店：刪除 ───────────────────────────────────── */
  deleteBranch(id: number): void {
    const b = this.branches().find(x => x.id === id);
    if (!b) return;
    if (!confirm(`確定刪除分店「${b.name}」？此操作無法復原。`)) return;
    this.apiService.deleteBranch({ globalAreaIdList: [id] }).subscribe({
      next: () => {
        this.branches.update(list => list.filter(x => x.id !== id));
        this.showToast(`🗑️ 分店「${b.name}」已刪除`);
      },
      error: () => {
        /* API 失敗時降級為本地刪除 */
        this.branches.update(list => list.filter(x => x.id !== id));
        this.showToast(`⚠️ 後端暫不可用，僅本地移除分店「${b.name}」`);
      }
    });
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

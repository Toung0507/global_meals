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
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../shared/auth.service';
import {
  ApiService,
  GlobalAreaVO,
  RegionVO,
  PromotionDetailVo,
  GiftDetailVo,
  ProductAdminVo,
  InventoryDetailVo,
  MonthlyReportRes,
  MonthlyReportDetail,
  MonthRangeReportsReq,
  RevenueQueryRes,
  MonthlyProductsSalesVo,
  StaffVO,
  UpdatePromotionInfoReq,
  CreatePromotionRes,
  ExchangeRateVO,
  ExchangeRatesByDateReq,
  AiRes,
  PromotionsManageReq,
  DiscountRecord,
  DiscountReq,
} from '../shared/api.service';


/* ── 側邊欄頁籤型別 ─────────────────────────────────── */
export type DashTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'promotions'
  | 'inventory'
  | 'users'
  | 'tax'
  | 'finance'
  | 'branches'
  | 'discount'
  | 'member';

/* ── 帳號管理子頁籤型別 ─────────────────────────────── */
export type UserSubTab = 'bm' | 'ma' | 'staff';

/* ── 商品型別 ──────────────────────────────────────── */
interface DashProduct {
  id: number;
  name: string;
  category: string;
  style: string;
  price: number;
  stock: number;
  isActive: boolean;
  emoji: string;
  emojiBg: string;
  foodImgBase64: string;
}

/* ── 活動型別 ──────────────────────────────────────── */
interface DashPromo {
  id: number;
  title: string;
  scope: string;
  isActive: boolean;
  color: string;
  ended: boolean;
  rawName: string; /* API 原始名稱，toggle 時帶回後端（@NotBlank 需要）*/
  rawStartTime: string; /* YYYY-MM-DD，toggle 時帶回後端（@NotNull 需要）*/
  rawEndTime: string; /* YYYY-MM-DD，toggle 時帶回後端（@NotNull 需要）*/
  type: 'promotion' | 'announcement';
  description?: string;
  image?: string;
  badgeColor?: string;
  minAmount?: number;
  gifts?: GiftDetailVo[];
}

/* ── 庫存型別 ──────────────────────────────────────── */
interface DashInventory {
  id: number;
  productId: number;
  globalAreaId: number;
  name: string;
  branch: string;
  stock: number;
  safeStock: number;
  basePrice: number;
  costPrice: number;
  maxOrderQuantity: number;
  active: boolean;
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
  role: 'bm' | 'ma' | 'staff';
  backendRole?: string; // ← 加這行
  country?: string;
}

/* ── 分店型別（對應 global_area 資料表）───────────── */
interface DashBranch {
  id: number;
  name: string; /* 完整分店名稱，例：台灣台北店 (= branch) */
  city: string; /* 城市，例：台北 */
  country: string; /* 國家，例：台灣（顯示用） */
  regionsId: number; /* 對應 Regions 表 id（API 用） */
  address: string; /* 地址 */
  phone: string; /* 電話 */
}

/* ── 稅率型別 ──────────────────────────────────────── */
interface DashTax {
  id: number;
  country: string;
  countryCode: string;
  currency: string;
  taxType: string;
  rate: number;
  discountLimit: number;
  editing: boolean;
  editRate: number;
  editTaxType: string;
  editDiscountLimit: number;
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
  styleUrls: ['./manager-dashboard.component.scss'],
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  /* ── 頁籤狀態 ──────────────────────────────────── */
  /* 預設頁籤：帳號管理 */
  activeTab = signal<DashTab>('users');
  userSubTab = signal<UserSubTab>('bm');
  clockStr = signal('');

  /* ── 頁籤標題 ──────────────────────────────────── */
  readonly TAB_TITLES: Record<DashTab, string> = {
    dashboard: '📊 綜合總覽',
    orders: '📋 我的訂單',
    products: '🛍️ 商品管理',
    promotions: '🎯 活動管理',
    inventory: '📦 庫存管理',
    users: '👥 帳號管理',
    tax: '🌍 國家基本設定',
    finance: '💰 財務報表',
    branches: '🏪 分店管理',
    discount: '🏷️ 折抵管理',
    member: '🎁 會員設定',
  };

  /* ── 商品清單（Signal） ─────────────────────────── */
  products = signal<DashProduct[]>([
    // {
    //   id: 1,
    //   name: '紅燒牛肉麵',
    //   category: '台式',
    //   price: 165,
    //   stock: 48,
    //   isActive: true,
    //   emoji: '🍜',
    //   emojiBg: 'linear-gradient(135deg,#c49756,#8b5e3c)',
    //   foodImgBase64: '',
    // },
    // {
    //   id: 2,
    //   name: '印度奶油咖哩飯',
    //   category: '南洋',
    //   price: 175,
    //   stock: 32,
    //   isActive: true,
    //   emoji: '🍛',
    //   emojiBg: 'linear-gradient(135deg,#f59e0b,#d97706)',
    //   foodImgBase64: '',
    // },
    // {
    //   id: 3,
    //   name: '越南牛肉河粉',
    //   category: '南洋',
    //   price: 155,
    //   stock: 5,
    //   isActive: true,
    //   emoji: '🍲',
    //   emojiBg: 'linear-gradient(135deg,#3ecf8e,#10b981)',
    //   foodImgBase64: '',
    // },
    // {
    //   id: 4,
    //   name: '義式肉醬寬麵',
    //   category: '西式',
    //   price: 185,
    //   stock: 0,
    //   isActive: false,
    //   emoji: '🍝',
    //   emojiBg: 'linear-gradient(135deg,#818cf8,#6366f1)',
    //   foodImgBase64: '',
    // },
    // {
    //   id: 5,
    //   name: '墨西哥辣雞捲',
    //   category: '西式',
    //   price: 145,
    //   stock: 18,
    //   isActive: true,
    //   emoji: '🌮',
    //   emojiBg: 'linear-gradient(135deg,#f87171,#ef4444)',
    //   foodImgBase64: '',
    // },
    // {
    //   id: 6,
    //   name: '珍珠奶茶',
    //   category: '飲品',
    //   price: 65,
    //   stock: 120,
    //   isActive: true,
    //   emoji: '🧋',
    //   emojiBg: 'linear-gradient(135deg,#06b6d4,#0891b2)',
    //   foodImgBase64: '',
    // },
  ]);

  trashProducts = signal<DashProduct[]>([]);
  showTrash = signal(false);

  /* ── 活動清單（Signal） ─────────────────────────── */
  promos = signal<DashPromo[]>([]);

  /* ── 活動分類篩選 Tab ────────────────────────────── */
  promoTypeTab = signal<'all' | 'promotion' | 'announcement'>('all');

  filteredPromos = computed(() => {
    const tab = this.promoTypeTab();
    if (tab === 'all') return this.promos();
    return this.promos().filter((p) => p.type === tab);
  });

  promoPromotionCount = computed(
    () => this.promos().filter((p) => p.type === 'promotion').length,
  );
  promoAnnouncementCount = computed(
    () => this.promos().filter((p) => p.type === 'announcement').length,
  );

  /* ── 庫存清單（Signal） ─────────────────────────── */
  inventory = signal<DashInventory[]>([
  
  ]);

  /* 庫存調整狀態 */
  adjustingInventoryId = signal<number | null>(null);
  adjustInventoryAmt = signal<number>(0);
  adjustInventorySavedId = signal<number | null>(null);

  /* ── 折抵清單（Signal） ─────────────────────────── */
  discounts = signal<DiscountRecord[]>([]);
  discountLoading = signal(false);
  editingDiscountId = signal<number | null>(null);
  editDiscountCap = signal(0);
  editDiscountCount = signal(0);
  discountDraft: DiscountReq = { regionsId: 0, usageCap: 0, count: 0 };

  /* ── 會員設定：合併 taxes + discounts ───────────── */
  memberData = computed(() =>
    this.taxes().map((tax) => {
      const disc = this.discounts().find((d) => d.regionsId === tax.id);
      return { tax, disc };
    }),
  );
  editingMemberRegionId = signal<number | null>(null);
  editMemberLimit = signal(0);
  editMemberCap = signal(0);

  /* ── 帳號清單（Signal） ─────────────────────────── */
  accounts = signal<DashAccount[]>([
  
  ]);

  bmAccounts = computed(() => this.accounts().filter((a) => a.role === 'bm'));
  maAccounts = computed(() => this.accounts().filter((a) => a.role === 'ma'));
  staffAccounts = computed(() =>
    this.accounts().filter((a) => a.role === 'staff'),
  );

  private resolveAccountRole(
    account: string,
    backendRole?: string,
  ): 'bm' | 'ma' | 'staff' {
    if (backendRole === 'REGION_MANAGER') return 'bm';
    if (backendRole === 'MANAGER_AGENT') return 'ma';
    if (backendRole === 'STAFF') return 'staff';

    const prefix = account.trim().slice(0, 2).toUpperCase();
    if (prefix === 'RM') return 'bm';
    if (prefix === 'MA') return 'ma';
    return 'staff';
  }

  /* ── 帳號管理 computed ──────────────────────────── */
  uniqueCountries = computed(() => [
    ...new Set(
      this.branches()
        .map((b) => b.country)
        .filter(Boolean),
    ),
  ]);

  accountModalCountry = signal('');

  filteredAccountBranches = computed(() => {
    const c = this.accountModalCountry();
    if (!c) return this.branches();
    return this.branches().filter((b) => b.country === c);
  });

  /* ── 財務報表 computed ──────────────────────────── */
  financeCountries = computed(() => this.taxes().map((t) => t.country));

  filteredFinanceBranches = computed(() => {
    const country = this.financeCountry();
    if (country === '全部') return this.branches();
    return this.branches().filter((b) => b.country === country);
  });

  financeRegionsId = computed<number | null>(() => {
    const country = this.financeCountry();
    if (country === '全部') return null;
    const tax = this.taxes().find((t) => t.country === country);
    return tax?.id ?? null;
  });

  financeCurrentData = computed(() => {
    const report = this.financeMonthResult();
    if (!report?.currentData) return [];
    return this.filterFinanceData(report.currentData);
  });

  financeLastData = computed(() => {
    const report = this.financeMonthResult();
    if (!report?.lastData) return [];
    return this.filterFinanceData(report.lastData);
  });

  financeLastDataMap = computed(() => {
    const map = new Map<string, MonthlyReportDetail>();
    this.financeLastData().forEach((d) => map.set(d.branchName, d));
    return map;
  });

  // 「各分店」表格只用國家過濾（不限分店），才能顯示全部分店的比較
  private financeCurrentDataByCountry = computed(() => {
    const report = this.financeMonthResult();
    if (!report?.currentData) return [];
    return this.filterByCountryOnly(report.currentData);
  });
  private financeLastDataByCountry = computed(() => {
    const report = this.financeMonthResult();
    if (!report?.lastData) return [];
    return this.filterByCountryOnly(report.lastData);
  });
  private financeLastDataByCountryMap = computed(() => {
    const map = new Map<string, MonthlyReportDetail>();
    this.financeLastDataByCountry().forEach((d) => map.set(d.branchName, d));
    return map;
  });

  // 表格顯示資料：優先本月（國家層），沒有則保底上月
  financeDisplayCurrentData = computed(() => {
    const current = this.financeCurrentDataByCountry();
    if (current.length > 0) return current;
    return this.financeLastDataByCountry();
  });

  // 表格「上月」欄：本月有資料時用上月國家層，否則無上月資料
  financeDisplayLastDataMap = computed(() =>
    this.financeCurrentDataByCountry().length > 0
      ? this.financeLastDataByCountryMap()
      : new Map<string, MonthlyReportDetail>(),
  );

  financeUsingLastFallback = computed(
    () =>
      this.financeCurrentDataByCountry().length === 0 &&
      this.financeLastDataByCountry().length > 0,
  );

  financeCurrentTotal = computed(() => {
    const isAll = this.financeCountry() === '全部';
    return this.financeCurrentData().reduce(
      (s, d) =>
        s +
        (isAll
          ? this.convertToTwd(Number(d.totalAmount), d.regionsName)
          : Number(d.totalAmount)),
      0,
    );
  });

  financeLastTotal = computed(() => {
    const isAll = this.financeCountry() === '全部';
    return this.financeLastData().reduce(
      (s, d) =>
        s +
        (isAll
          ? this.convertToTwd(Number(d.totalAmount), d.regionsName)
          : Number(d.totalAmount)),
      0,
    );
  });

  financeCurrentCostTotal = computed(() => {
    const isAll = this.financeCountry() === '全部';
    return this.financeCurrentData().reduce(
      (s, d) =>
        s +
        (isAll
          ? this.convertToTwd(Number(d.totalCost ?? 0), d.regionsName)
          : Number(d.totalCost ?? 0)),
      0,
    );
  });

  financeLastCostTotal = computed(() => {
    const isAll = this.financeCountry() === '全部';
    return this.financeLastData().reduce(
      (s, d) =>
        s +
        (isAll
          ? this.convertToTwd(Number(d.totalCost ?? 0), d.regionsName)
          : Number(d.totalCost ?? 0)),
      0,
    );
  });

  financeGrowth = computed(() => {
    const last = this.financeLastTotal();
    if (last === 0) return 0;
    return ((this.financeCurrentTotal() - last) / last) * 100;
  });

  financeRangeData = computed(
    () => this.financeRangeResult()?.revenueData ?? [],
  );

  financeRangeTotal = computed(() => {
    const isAll = this.financeCountry() === '全部';
    return this.financeRangeData().reduce(
      (s, d) =>
        s +
        (isAll
          ? this.convertToTwd(Number(d.totalAmount), d.regionsName)
          : Number(d.totalAmount)),
      0,
    );
  });

  /* ── 財務報表：台幣匯率換算 ─────────────────────── */
  showTwdConversion = signal(false);

  financeRateToTwd = computed<number>(() => {
    const currency = this.getFinanceCurrencyLabel();
    if (!currency || currency === 'TWD') return 1;
    // rateToTwd = X 外幣 / 1 TWD，取倒數得「1 外幣 = ? TWD」
    const rate = this.allRates().find((r) => r.currencyCode === currency)?.rateToTwd ?? 0;
    return rate > 0 ? 1 / rate : 0;
  });

  // 從長條圖取最新 / 前一個 bar（與圖表顯示的資料一致）
  private financeChartLastBar = computed(() => {
    const d = this.financeChartData();
    return d.length ? d[d.length - 1] : null;
  });
  private financeChartPrevBar = computed(() => {
    const d = this.financeChartData();
    return d.length >= 2 ? d[d.length - 2] : null;
  });

  // 台幣換算用數值：優先用 filterFinanceData 合計，為 0 時保底用長條圖
  financeRevenueForTwd = computed(() => {
    const v = this.financeCurrentTotal();
    return v > 0 ? v : (this.financeChartLastBar()?.revenue ?? 0);
  });
  financePrevRevenueForTwd = computed(() => {
    const v = this.financeLastTotal();
    if (v > 0) return v;
    // 沒有上月 filtered 資料時，取長條圖倒數第二 bar（若只有一 bar 則取最後一 bar）
    return this.financeChartPrevBar()?.revenue ?? this.financeChartLastBar()?.revenue ?? 0;
  });
  financeCostForTwd = computed(() => {
    const v = this.financeCurrentCostTotal();
    return v > 0 ? v : (this.financeChartLastBar()?.cost ?? 0);
  });

  financeCurrentTotalTwd = computed(() =>
    Math.round(this.financeRevenueForTwd() * this.financeRateToTwd()),
  );

  financeLastTotalTwd = computed(() =>
    Math.round(this.financePrevRevenueForTwd() * this.financeRateToTwd()),
  );

  financeCurrentCostTotalTwd = computed(() =>
    Math.round(this.financeCostForTwd() * this.financeRateToTwd()),
  );

  /* ── 稅率清單（Signal） ─────────────────────────── */
  taxes = signal<DashTax[]>([

  ]);

  /* ── 國家設定子頁籤 ──────────────────────────────── */
  showRates = signal(false);

  /* ── 匯率查詢 ────────────────────────────────────── */
  allRates = signal<ExchangeRateVO[]>([]);
  ratesLoading = signal(false);
  rateQueryDate = signal<string>('');
  rateError = signal<string | null>(null);
  latestRateUpdatedAt = computed(() => {
    const updatedList = this.allRates()
      .map((r) => r.updatedAt)
      .filter(Boolean)
      .sort();
    return updatedList.length ? updatedList[updatedList.length - 1] : '';
  });

  /* ── 商品篩選 ─────────────────────────────────── */
  productCategoryFilter = signal<string>('');
  productSearch = signal<string>('');

  filteredProducts = computed(() => {
    const styleKey = this.productCategoryFilter();
    const q = this.productSearch().toLowerCase();
    return this.products().filter((p) => {
      const styleOk = styleKey === '' || p.style === styleKey;
      const qOk = q === '' || p.name.toLowerCase().includes(q);
      return styleOk && qOk;
    });
  });

  /* ── Toast 通知 ─────────────────────────────────── */
  toastMsg = signal<string>('');
  toastLeaving = signal<boolean>(false); /* true 時觸發 CSS 淡出動畫 */
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastLeaveTimer: ReturnType<typeof setTimeout> | null = null;

  /* ── CSV 匯出中狀態 ──────────────────────────────── */
  isExporting = signal<boolean>(false);

  /* ── 財務頁籤：數字計數動畫目前值 ─────────────────── */
  financeRevenue = signal<number>(0);
  financeOrders = signal<number>(0);
  financeAvgPrice = signal<number>(0);

  /* ── 財務報表查詢狀態 ────────────────────────────── */
  financeCountry = signal<string>('全部');
  financeBranchId = signal<number | null>(null);
  financeMode = signal<'month' | 'range'>('month');
  financeMonth = signal<string>(
    (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })(),
  );
  financeStart = signal<string>('');
  financeEnd = signal<string>('');
  financeLoading = signal<boolean>(false);
  financeMonthResult = signal<MonthlyReportRes | null>(null);
  financeRangeResult = signal<RevenueQueryRes | null>(null);
  financeTopProducts = signal<MonthlyProductsSalesVo[]>([]);
  financeChartData = signal<{ month: string; revenue: number; cost: number }[]>([]);
  chartAnimKey = signal(0);
  animatedChartData = computed(() => {
    const k = this.chartAnimKey();
    return this.financeChartData().map((d) => ({ ...d, _k: k }));
  });

  financeChartMax = computed(() => {
    const data = this.financeChartData();
    if (!data.length) return 1;
    return Math.max(...data.map((d) => Math.max(d.revenue, d.cost)), 1);
  });

  get currentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /* ── 財務數字動畫當前顯示值 ─────────────────────── */
  animatedCurrentTotal = signal<number>(0);
  animatedLastTotal = signal<number>(0);
  animatedBranchCount = signal<number>(0);
  private animTimer1: ReturnType<typeof setInterval> | null = null;
  private animTimer2: ReturnType<typeof setInterval> | null = null;
  private animTimer3: ReturnType<typeof setInterval> | null = null;

  private animateValue(
    targetSignal: ReturnType<typeof signal<number>>,
    target: number,
    timerRef: 'animTimer1' | 'animTimer2' | 'animTimer3',
    duration = 1800,
  ): void {
    if (this[timerRef]) clearInterval(this[timerRef]!);
    const fps = 60;
    const steps = Math.round(duration / (1000 / fps));
    let step = 0;
    targetSignal.set(0);
    this[timerRef] = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      targetSignal.set(Math.round(target * eased));
      if (step >= steps) {
        clearInterval(this[timerRef]!);
        this[timerRef] = null;
        targetSignal.set(target);
      }
    }, 1000 / fps);
  }

  /* ── 批次刪除模式 ───────────────────────────────── */
  bulkDeleteMode = signal(false);
  selectedPromoIds = signal<Set<number>>(new Set());
  /** 刪除確認狀態：active-warning / confirm / bulk */
  deleteConfirmState = signal<null | {
    type: 'active-warning' | 'confirm' | 'bulk';
    ids: number[];
  }>(null);

  toggleBulkDeleteMode(): void {
    const next = !this.bulkDeleteMode();
    this.bulkDeleteMode.set(next);
    if (!next) this.selectedPromoIds.set(new Set());
  }

  isPromoSelected(id: number): boolean {
    return this.selectedPromoIds().has(id);
  }

  togglePromoSelection(id: number): void {
    this.selectedPromoIds.update((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  selectedCount(): number {
    return this.selectedPromoIds().size;
  }

  requestBulkDelete(): void {
    if (!this.selectedPromoIds().size) {
      this.showToast('請先勾選要刪除的活動');
      return;
    }
    this.deleteConfirmState.set({
      type: 'bulk',
      ids: Array.from(this.selectedPromoIds()),
    });
  }

  /** 點刪除按鈕時呼叫，依狀態顯示對應 modal */
  requestDeletePromo(promo: DashPromo): void {
    if (promo.isActive && !promo.ended) {
      this.deleteConfirmState.set({ type: 'active-warning', ids: [promo.id] });
    } else {
      this.deleteConfirmState.set({ type: 'confirm', ids: [promo.id] });
    }
  }

  confirmDelete(): void {
    const state = this.deleteConfirmState();
    if (!state) return;
    this.deleteConfirmState.set(null);

    forkJoin(
      state.ids.map((id) => this.apiService.deletePromotion(id)),
    ).subscribe({
      next: () => {
        state.ids.forEach((id) =>
          this.promos.update((list) => list.filter((p) => p.id !== id)),
        );
        this.showToast(
          state.ids.length > 1
            ? `🗑️ 已刪除 ${state.ids.length} 個活動`
            : '🗑️ 活動已刪除',
        );
        this.bulkDeleteMode.set(false);
        this.selectedPromoIds.set(new Set());
        this.selectedPromo.set(null);
      },
      error: () => this.showToast('⚠️ 刪除失敗，請確認後端連線'),
    });
  }

  cancelDeleteConfirm(): void {
    this.deleteConfirmState.set(null);
  }

  /* ── 活動詳情 ────────────────────────────────────── */
  selectedPromo = signal<DashPromo | null>(null);

  openPromoDetail(promo: DashPromo): void {
    this.selectedPromo.set(promo);
  }
  closePromoDetail(): void {
    this.selectedPromo.set(null);
  }

  /* ── 編輯活動資訊（文案 + 封面圖）────────────────── */
  editPromoInfoId = signal<number | null>(null);
  editPromoInfoDraft = {
    description: '',
    image: '',
    name: '',
    startTime: '',
    endTime: '',
  };
  editPromoInfoSaving = signal(false);

  openEditPromoInfo(promo: DashPromo): void {
    this.editPromoInfoDraft = {
      description: promo.description ?? '',
      image: promo.image ?? '',
      name: promo.rawName, // ← 補
      startTime: promo.rawStartTime, // ← 補
      endTime: promo.rawEndTime, // ← 補
    };
    this.editPromoInfoId.set(promo.id);
  }

  closeEditPromoInfo(): void {
    this.editPromoInfoId.set(null);
  }

  onEditPromoImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.editPromoInfoDraft.image = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }

  /* ── 一鍵 AI 文案生成 ───────────────────────────── */
  generatingAiCopy = signal(false);

  generateAiCopy(): void {
    const id = this.editPromoInfoId();
    if (id === null) return;
    const promo = this.promos().find((p) => p.id === id);
    if (!promo) return;

    const imageStr = this.editPromoInfoDraft.image;
    if (!imageStr) {
      this.showToast('⚠️ 請先上傳活動封面圖片');
      return;
    }

    /* 有封面圖 → 走後端（自動存 ai_generated） */
    this.generatingAiCopy.set(true);
    const base64 = imageStr.startsWith('data:')
      ? imageStr.split(',')[1]
      : imageStr;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    this.apiService.generateAiPromoCopy(id, promo.rawName, blob).subscribe({
      next: (res: AiRes) => {
        this.editPromoInfoDraft.description = res?.generatedDescription ?? '';
        this.generatingAiCopy.set(false);
      },
      error: () => {
        this.generatingAiCopy.set(false);
        this.showToast('❌ AI 生成失敗，請確認後端連線');
      },
    });
  }

  saveEditPromoInfo(): void {
    const id = this.editPromoInfoId();
    if (id === null || id < 0) return;
    this.editPromoInfoSaving.set(true);
    const req: UpdatePromotionInfoReq = {
      promotionsId: id,
      description: this.editPromoInfoDraft.description,
      promotionImg: this.editPromoInfoDraft.image || undefined,
    };
    this.apiService.updatePromotionInfo(req).subscribe({
      next: () => {
        const saved = { ...this.editPromoInfoDraft };
        this.promos.update((list) =>
          list.map((p) =>
            p.id === id
              ? {
                  ...p,
                  description: saved.description,
                  image: saved.image.startsWith('data:')
                    ? `${this.apiService.getPromotionImageUrl(id)}?t=${Date.now()}`
                    : saved.image,
                }
              : p,
          ),
        );
        /* 如果詳情 modal 也打開著，同步更新 */
        const sel = this.selectedPromo();
        if (sel?.id === id) {
          this.selectedPromo.update((s) =>
            s
              ? {
                  ...s,
                  description: saved.description,
                  image: saved.image.startsWith('data:')
                    ? `${this.apiService.getPromotionImageUrl(id)}?t=${Date.now()}`
                    : saved.image,
                }
              : null,
          );
        }
        this.editPromoInfoSaving.set(false);
        this.closeEditPromoInfo();
        this.showToast('✅ 活動資訊已更新');
      },
      error: () => {
        this.editPromoInfoSaving.set(false);
        this.showToast('❌ 更新失敗，請確認後端連線');
      },
    });
  }

  /* ── 分店清單（Signal，對應 global_area 資料表）─── */
  branches = signal<DashBranch[]>([

  ]);

  /* ── Modal 狀態 ─────────────────────────────────────── */
  activeModal = signal<
    | 'orderDetail'
    | 'addProduct'
    | 'addPromo'
    | 'addGift'
    | 'addAccount'
    | 'addCountry'
    | 'addBranch'
    | 'editBranch'
    | 'addDiscount'
    | 'transferBranch'
    | 'addMemberLimit'
    | null
  >(null);
  transferTargetId = signal<number | null>(null);
  transferNewAreaId = signal<number | null>(null);
  selectedOrder = signal<DashOrder | null>(null);
  editingAccountId = signal<number | null>(null);
  newStaffResult = signal<{ name: string; account: string } | null>(null);
  editingProductId = signal<number | null>(null);
  styleOptions = signal<string[]>([]);
  categoryOptions = signal<string[]>([]);

  /* ── 表單草稿（普通屬性，開啟 modal 時重置） ─────────── */
  productDraft = {
    name: '',
    category: '台式',
    style: '台式經典',
    price: 165,
    stock: 0,
    emoji: '🍜',
    description: '',
    active: true,
  };
  productImageFile: File | null = null;
  productImagePreview = signal<string>('');
  generatingAiDesc = signal(false);
  generatingPromoAiDesc = signal(false);
  promoDraft = {
    name: '',
    type: 'promotion' as 'promotion' | 'announcement',
    description: '',
    startTime: '',
    endTime: '',
    color: '#c49756',
    badgeColor: '#c49756',
    minAmount: null as number | null,
    image: '',
    currency: 'NT$',
    giftFullAmount: null as number | null,
    giftProductId: null as number | null,
    giftQuantity: -1,
  };
  showPromoPanel = signal(false);
  giftDraft = {
    promoId: 0,
    rawName: '',
    rawStartTime: '',
    rawEndTime: '',
    fullAmount: 300,
    giftProductId: null as number | null,
    quantity: -1,
  };
  giftProductList = signal<ProductAdminVo[]>([]);
  accountDraft: {
    name: string;
    account: string;
    password: string;
    branch: string;
    shift: string;
    role: 'bm' | 'ma' | 'staff';
    isActive: boolean;
    country: string;
  } = {
    name: '',
    account: '',
    password: '',
    branch: '台灣台北店',
    shift: '早班',
    role: 'bm',
    isActive: true,
    country: '台灣',
  };
  readonly COUNTRY_DATA: { name: string; code: string; currency: string }[] = [
    // 東亞
    { name: '台灣', code: 'TW', currency: 'TWD' },
    { name: '日本', code: 'JP', currency: 'JPY' },
    { name: '韓國', code: 'KR', currency: 'KRW' },
    { name: '中國', code: 'CN', currency: 'CNY' },
    { name: '香港', code: 'HK', currency: 'HKD' },
    { name: '澳門', code: 'MO', currency: 'MOP' },
    { name: '蒙古', code: 'MN', currency: 'MNT' },
    // 東南亞
    { name: '泰國', code: 'TH', currency: 'THB' },
    { name: '越南', code: 'VN', currency: 'VND' },
    { name: '印尼', code: 'ID', currency: 'IDR' },
    { name: '馬來西亞', code: 'MY', currency: 'MYR' },
    { name: '新加坡', code: 'SG', currency: 'SGD' },
    { name: '菲律賓', code: 'PH', currency: 'PHP' },
    { name: '柬埔寨', code: 'KH', currency: 'KHR' },
    { name: '緬甸', code: 'MM', currency: 'MMK' },
    { name: '寮國', code: 'LA', currency: 'LAK' },
    { name: '汶萊', code: 'BN', currency: 'BND' },
    { name: '東帝汶', code: 'TL', currency: 'USD' },
    // 南亞
    { name: '印度', code: 'IN', currency: 'INR' },
    { name: '孟加拉', code: 'BD', currency: 'BDT' },
    { name: '巴基斯坦', code: 'PK', currency: 'PKR' },
    { name: '斯里蘭卡', code: 'LK', currency: 'LKR' },
    { name: '尼泊爾', code: 'NP', currency: 'NPR' },
    { name: '不丹', code: 'BT', currency: 'BTN' },
    { name: '馬爾地夫', code: 'MV', currency: 'MVR' },
    // 中亞
    { name: '哈薩克', code: 'KZ', currency: 'KZT' },
    { name: '烏茲別克', code: 'UZ', currency: 'UZS' },
    { name: '吉爾吉斯', code: 'KG', currency: 'KGS' },
    { name: '塔吉克', code: 'TJ', currency: 'TJS' },
    { name: '土庫曼', code: 'TM', currency: 'TMT' },
    // 西亞／中東
    { name: '阿拉伯聯合大公國', code: 'AE', currency: 'AED' },
    { name: '沙烏地阿拉伯', code: 'SA', currency: 'SAR' },
    { name: '卡達', code: 'QA', currency: 'QAR' },
    { name: '科威特', code: 'KW', currency: 'KWD' },
    { name: '巴林', code: 'BH', currency: 'BHD' },
    { name: '以色列', code: 'IL', currency: 'ILS' },
    { name: '土耳其', code: 'TR', currency: 'TRY' },
    { name: '伊朗', code: 'IR', currency: 'IRR' },
  ];

  taxDraft: {
    country: string;
    countryCode: string;
    currency: string;
    taxType: 'INCLUSIVE' | 'EXCLUSIVE';
    rate: number;
  } = {
    country: '',
    countryCode: '',
    currency: '',
    taxType: 'INCLUSIVE',
    rate: 0,
  };

  onCountrySelect(name: string): void {
    const found = this.COUNTRY_DATA.find((c) => c.name === name);
    if (found) {
      this.taxDraft.countryCode = found.code;
      this.taxDraft.currency = found.currency;
    }
  }

  branchDraft = { regionsId: 0, city: '', address: '', phone: '' };
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
    const duration = 900; /* 動畫時長 ms */
    const fps = 60;
    const steps = Math.round(duration / (1000 / fps));

    const targets = [
      { signal: this.financeRevenue, target: 1248000 },
      { signal: this.financeOrders, target: 6284 },
      { signal: this.financeAvgPrice, target: 198 },
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

  ]);

  filteredOrders = computed(() => {
    return this.allOrders().filter((o) => {
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
    this.loadTaxes(() => this.loadBranches(() => this.loadStaff()));
    this.loadPromos();
    this.loadAllRates();
    this.loadStyles();
    this.loadCategories();
    this.loadProducts();
    this.loadInventory();
    this.loadDiscounts();
  }

  ngOnDestroy(): void {
    if (this.clockInterval !== null) clearInterval(this.clockInterval);
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    if (this.toastLeaveTimer !== null) clearTimeout(this.toastLeaveTimer);
    if (this.animTimer1) clearInterval(this.animTimer1);
    if (this.animTimer2) clearInterval(this.animTimer2);
    if (this.animTimer3) clearInterval(this.animTimer3);
  }

  /* ── 國家 → 旗幟 Emoji 對照 ─────────────────────── */
  private countryToFlag(country: string): string {
    const map: Record<string, string> = {
      台灣: '🇹🇼',
      日本: '🇯🇵',
      泰國: '🇹🇭',
      韓國: '🇰🇷',
      美國: '🇺🇸',
      英國: '🇬🇧',
      法國: '🇫🇷',
      德國: '🇩🇪',
      中國: '🇨🇳',
      印度: '🇮🇳',
      澳洲: '🇦🇺',
      加拿大: '🇨🇦',
      新加坡: '🇸🇬',
      馬來西亞: '🇲🇾',
      印尼: '🇮🇩',
      越南: '🇻🇳',
    };
    return map[country] ?? '🏳️';
  }

  /* ── 從後端重新載入分店清單 ──────────────────────── */
  private readonly KNOWN_COUNTRIES = ['台灣', '日本', '韓國', '泰國', '新加坡'];
  private readonly KNOWN_CITIES = [
    '台北',
    '台中',
    '台南',
    '高雄',
    '東京',
    '大阪',
    '京都',
    '名古屋',
    '首爾',
    '釜山',
    '濟州',
    '曼谷',
    '清邁',
    '普吉',
    '新加坡',
  ];

  private extractCity(branch: string): string {
    let s = branch;
    for (const c of this.KNOWN_COUNTRIES) {
      s = s.split(c).join(''); /* replaceAll 相容寫法 */
    }
    s = s.replace(/店$/, '').trim();
    /* 若剩餘字串剛好是已知城市，直接用 */
    if (this.KNOWN_CITIES.includes(s)) return s;
    /* 嘗試在原始 branch 名稱中找到已知城市關鍵字 */
    const found = this.KNOWN_CITIES.find((c) => branch.includes(c));
    return found ?? s;
  }

  private loadBranches(onComplete?: () => void): void {
    this.apiService.getAllBranches().subscribe({
      next: (res) => {
        if (res?.globalAreaList?.length) {
          this.branches.set(
            res.globalAreaList.map((b: GlobalAreaVO) => {
              const country =
                b.country ||
                this.taxes().find((t) => t.id === (b.regionsId ?? 0))
                  ?.country ||
                '';
              const city = this.extractCity(b.branch ?? '');
              return {
                id: b.id,
                name: b.branch,
                city,
                country,
                regionsId: b.regionsId ?? 0,
                address: b.address,
                phone: b.phone,
              };
            }),
          );
        }
        /* 若後端回傳空清單，保留 mock 初始值供 Demo 使用 */
        onComplete?.();
      },
      error: () => {
        console.warn('[Manager] 分店 API 連線失敗，使用 Demo 資料');
        onComplete?.();
      },
    });
  }

  /* ── 從後端重新載入稅率清單 ──────────────────────── */
  private loadTaxes(onComplete?: () => void): void {
    this.apiService.getAllTax().subscribe({
      next: (res) => {
        if (res?.regionsList?.length) {
          const seen = new Set<string>();
          const deduped = res.regionsList.filter((r: RegionVO) => {
            if (seen.has(r.country)) return false;
            seen.add(r.country);
            return true;
          });
          this.taxes.set(
            deduped.map((r: RegionVO) => {
              const rate = +(+r.taxRate * 100).toFixed(2);
              // regions/update 後端不支援 usageCap 欄位，改由 localStorage 持久化
              const saved = localStorage.getItem(`discountLimit_${r.id}`);
              const cap = saved !== null ? +saved : (r.usageCap ?? 0);
              return {
                id: r.id,
                country: r.country,
                countryCode: (r.countryCode ?? '').toUpperCase(),
                currency: r.currencyCode.toUpperCase(),
                taxType: r.taxType ?? 'INCLUSIVE',
                rate,
                discountLimit: cap,
                editing: false,
                editRate: rate,
                editTaxType: r.taxType ?? 'INCLUSIVE',
                editDiscountLimit: cap,
              };
            }),
          );
        }
        onComplete?.();
      },
      error: () => {
        console.warn('[Manager] 稅率 API 連線失敗，使用 Demo 資料');
        onComplete?.();
      },
    });
  }

  /* ── 從後端重新載入促銷活動清單 ─────────────────── */
  private loadPromos(): void {
    this.apiService.getPromotionsList().subscribe({
      next: (res) => {
        this.promos.set(
          (res?.data ?? []).map((p: PromotionDetailVo) => {
            const imageUrl = `${this.apiService.getPromotionImageUrl(p.id)}?v=${p.id}-${p.startTime}-${p.endTime}`;
            const minAmount = p.gifts?.length
              ? Math.min(...p.gifts.map((g: { fullAmount: number }) => +g.fullAmount))
              : undefined;
            return {
              id: p.id,
              title: p.name + (p.gifts?.length ? `（${p.gifts.length} 項贈品）` : ''),
              scope: `${p.startTime} ～ ${p.endTime}`,
              isActive: p.active,
              color: p.active ? '#c49756' : 'rgba(255,255,255,0.18)',
              badgeColor: p.active ? '#c49756' : '#6b7280',
              ended: !!p.endTime && new Date(p.endTime) < new Date(),
              rawName: p.name,
              rawStartTime: p.startTime,
              rawEndTime: p.endTime,
              type: 'promotion' as const,
              description: p.description ?? '',
              image: imageUrl,
              minAmount,
              gifts: p.gifts ?? [],
            };
          }),
        );
      },
      error: () => {
        console.warn('[Manager] 活動 API 連線失敗');
      },
    });
  }

  /* ── 從後端載入商品清單 ──────────────────────────── */
  private readonly EMOJI_MAP: Record<string, string> = {
    台式: '🍜',
    飯食: '🍱',
    小吃: '🦪',
    麵食: '🍜',
    飲品: '🧋',
    甜點: '🍰',
    湯食: '🍲',
    鍋類: '🫕',
    辣食: '🌶️',
    台食: '🍽️',
    南洋: '🍛',
    西式: '🍝',
  };
  private readonly BG_MAP: Record<string, string> = {
    台式: 'linear-gradient(135deg,#c49756,#8b5e3c)',
    飯食: 'linear-gradient(135deg,#e8834a,#c05a20)',
    小吃: 'linear-gradient(135deg,#3ecf8e,#10b981)',
    麵食: 'linear-gradient(135deg,#c49756,#8b5e3c)',
    飲品: 'linear-gradient(135deg,#06b6d4,#0891b2)',
    甜點: 'linear-gradient(135deg,#f472b6,#db2777)',
    湯食: 'linear-gradient(135deg,#f59e0b,#d97706)',
    鍋類: 'linear-gradient(135deg,#ef4444,#b91c1c)',
    辣食: 'linear-gradient(135deg,#dc2626,#991b1b)',
    台食: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
    南洋: 'linear-gradient(135deg,#f59e0b,#d97706)',
    西式: 'linear-gradient(135deg,#818cf8,#6366f1)',
  };

  // ↓ 新增這個函式
  private cleanBase64(raw: string): string {
    if (!raw) return '';
    if (raw.startsWith('data:')) return raw.replace(/[\r\n\s]/g, '');
    const cleaned = raw.replace(/[\r\n\s]/g, '');
    return `data:image/jpeg;base64,${cleaned}`;
  }

  private toImg(raw: string): string {
    if (!raw) return '';
    // PR #52: 後端 foodImgBase64 現在回傳 URL 路徑 /lazybaobao/product/image/{id}?v=...
    if (raw.startsWith('/') || raw.startsWith('http')) return raw;
    return this.cleanBase64(raw);
  }

  private loadStyles(): void {
  this.apiService.getStyles().subscribe({
    next: (list) => {
      const unique = [...new Set(list.map((s) => s.name).filter(Boolean))];
      this.styleOptions.set(unique);
    },
    error: (err) => console.error('❌ loadStyles 失敗:', err),
  });
}

private loadCategories(): void {
  this.apiService.getCategories().subscribe({
    next: (list) => {
      const unique = [...new Set(list.map((c) => c.name).filter(Boolean))];
      this.categoryOptions.set(unique);
    },
    error: (err) => console.error('❌ loadCategories 失敗:', err),
  });
}

  private loadProducts(): void {
    forkJoin({
      inventory: this.apiService.getBranchInventory(19),
      allProducts: this.apiService.getAllProducts(),
    }).subscribe({
      next: ({ inventory, allProducts }) => {
        const invData = inventory?.data ?? [];
        const prodMap = new Map(
          (allProducts?.productList ?? []).map((p) => [p.id, p]),
        );

        const toInit = invData.filter(
          (inv) => inv.stockQuantity === 0 && inv.basePrice === 0,
        );
        if (toInit.length > 0) {
          this.apiService
            .deductInventoryBatch(
              toInit.map((inv) => ({
                productId: inv.productId,
                globalAreaId: inv.globalAreaId,
                stockQuantity: 100,
                basePrice: 100,
                costPrice: 0,
                maxOrderQuantity: 10,
                active: inv.active,
              })),
            )
            .subscribe({
              next: () => this.loadProducts(),
              error: () => console.error('❌ 批量初始化庫存失敗'),
            });
          return;
        }

        this.products.set(
          invData.map((inv) => {
            const prod = prodMap.get(inv.productId);
            const cat = inv.category || prod?.category || '';
            return {
              id: inv.productId,
              name: inv.productName,
              category: cat,
              style: inv.style || prod?.style || '台式經典',
              price: inv.basePrice,
              stock: inv.stockQuantity,
              isActive: prod?.active ?? inv.active,
              emoji: this.EMOJI_MAP[cat] ?? '🍽️',
              emojiBg:
                this.BG_MAP[cat] ?? 'linear-gradient(135deg,#6b7280,#374151)',
              foodImgBase64: this.toImg(prod?.foodImgBase64 ?? ''),
            };
          }),
        );
      },
      error: (err) => console.error('❌ loadProducts 失敗:', err),
    });
  }

  private loadTrashProducts(): void {
    this.apiService.getTrashProducts().subscribe({
      next: (res) => {
        this.trashProducts.set(
          (res?.productList ?? []).map((p) => {
            const cat = p.category ?? '';
            return {
              id: p.id,
              name: p.name,
              category: cat,
              style: p.style ?? '台式經典',
              price: 0,
              stock: 0,
              isActive: false,
              emoji: this.EMOJI_MAP[cat] ?? '🍽️',
              emojiBg:
                this.BG_MAP[cat] ?? 'linear-gradient(135deg,#6b7280,#374151)',
              foodImgBase64: this.toImg(p.foodImgBase64 ?? ''),
            };
          }),
        );
      },
      error: (err) => console.error('❌ loadTrashProducts 失敗:', err),
    });
  }

  toggleTrash(): void {
    const next = !this.showTrash();
    this.showTrash.set(next);
    if (next) this.loadTrashProducts();
  }

  deleteProductItem(id: number): void {
    this.apiService.deleteProduct(id).subscribe({
      next: (res) => {
        if (res?.code === 200) {
          this.products.update((list) => list.filter((p) => p.id !== id));
          this.showToast('✅ 商品已刪除');
          if (this.showTrash()) this.loadTrashProducts();
        } else {
          this.showToast('⚠️ 刪除失敗：' + res?.message);
        }
      },
      error: () => this.showToast('❌ 刪除失敗'),
    });
  }

  /* ── 從後端載入庫存清單 ──────────────────────────── */
  private loadInventory(globalAreaId = 19): void {
    this.apiService.getBranchInventory(globalAreaId).subscribe({
      next: (res) => {
        if (res?.data?.length) {
          this.inventory.set(
            res.data.map((inv: InventoryDetailVo) => ({
              id: inv.productId,
              productId: inv.productId,
              globalAreaId: inv.globalAreaId,
              name: inv.productName,
              branch: inv.branchName,
              stock: inv.stockQuantity,
              safeStock: 10,
              basePrice: inv.basePrice,
              costPrice: inv.costPrice,
              maxOrderQuantity: inv.maxOrderQuantity,
              active: inv.active,
            })),
          );
        }
        /* 若後端回空清單，保留 mock 初始值供 Demo 使用 */
      },
      error: () => console.warn('[Manager] 庫存 API 連線失敗，使用 Demo 資料'),
    });
  }

  /* ── 庫存：切換上下架狀態 ────────────────────────── */
  toggleInventoryActive(item: DashInventory): void {
    const newActive = !item.active;
    this.inventory.update((list) =>
      list.map((i) => (i.id === item.id ? { ...i, active: newActive } : i)),
    );
    this.apiService
      .toggleBranchActiveStatus(item.productId, item.globalAreaId, newActive)
      .subscribe({
        next: () =>
          this.showToast(
            newActive ? `✅ ${item.name} 已上架` : `🔒 ${item.name} 已下架`,
          ),
        error: () => {
          this.inventory.update((list) =>
            list.map((i) =>
              i.id === item.id ? { ...i, active: !newActive } : i,
            ),
          );
          this.showToast('⚠️ 狀態更新失敗');
        },
      });
  }

  /* ── 折抵：載入清單 ──────────────────────────────── */
  private loadDiscounts(): void {
    this.discountLoading.set(true);
    this.apiService.getDiscountList().subscribe({
      next: (res) => {
        this.discounts.set(res?.discountList ?? []);
        this.discountLoading.set(false);
      },
      error: () => {
        this.discountLoading.set(false);
        console.warn('[Manager] 折抵 API 連線失敗，使用空清單');
      },
    });
  }

  /* ── 折抵：inline 編輯 ───────────────────────────── */
  startEditDiscount(d: DiscountRecord): void {
    this.editingDiscountId.set(d.id);
    this.editDiscountCap.set(d.usageCap);
    this.editDiscountCount.set(d.count);
  }

  cancelEditDiscount(): void {
    this.editingDiscountId.set(null);
  }

  saveEditDiscount(d: DiscountRecord): void {
    const req: DiscountReq = {
      id: d.id,
      regionsId: d.regionsId,
      count: this.editDiscountCount(),
      usageCap: this.editDiscountCap(),
    };
    this.apiService.updateDiscountSettings(req).subscribe({
      next: () => {
        this.loadDiscounts();
        this.editingDiscountId.set(null);
        this.showToast('✅ 折抵設定已更新');
      },
      error: () => this.showToast('❌ 更新失敗'),
    });
  }

  /* ── 折抵：刪除 ──────────────────────────────────── */
  deleteDiscountRecord(id: number): void {
    this.apiService.deleteDiscount(id).subscribe({
      next: () => {
        this.discounts.update((list) => list.filter((d) => d.id !== id));
        this.showToast('🗑️ 折抵記錄已刪除');
      },
      error: () => this.showToast('❌ 刪除失敗'),
    });
  }

  /* ── 折抵：新增 Modal ─────────────────────────────── */
  openAddDiscount(): void {
    this.discountDraft = { regionsId: 0, usageCap: 0, count: 0 };
    this.activeModal.set('addDiscount');
  }

  saveCreateDiscount(): void {
    if (!this.discountDraft.regionsId || !this.discountDraft.usageCap) {
      this.showToast('⚠️ 請填寫地區與折抵上限');
      return;
    }
    this.apiService.createDiscount(this.discountDraft).subscribe({
      next: () => {
        this.loadDiscounts();
        this.closeModal();
        this.showToast('✅ 折抵記錄已新增');
      },
      error: () => this.showToast('❌ 新增失敗'),
    });
  }

  /* ── 折抵：依 regionsId 取得國家名稱 ──────────────── */
  getDiscountCountryName(regionsId: number): string {
    return (
      this.taxes().find((t) => t.id === regionsId)?.country ??
      `地區 #${regionsId}`
    );
  }

  private loadStaff(): void {
    this.apiService.getAllStaff().subscribe({
      next: (res) => {
        if (res?.staffList?.length) {
          this.accounts.set(
            res.staffList
              .filter((s: StaffVO) => s.role !== 'ADMIN')
              .map((s: StaffVO) => {
                const branchData = this.branches().find(
                  (b) => b.id === s.globalAreaId,
                );
                const branchName = branchData?.name ?? `分店 ${s.globalAreaId}`;
                const role = this.resolveAccountRole(s.account, s.role);
                return {
                  id: s.id,
                  name: s.name,
                  account: s.account,
                  branch: branchName,
                  joinedAt: s.hireAt?.slice(0, 10) ?? '',
                  isActive: s.status ?? true,
                  role,
                  backendRole: s.role,
                  country: branchData?.country ?? '',
                };
              })
              .sort((a, b) => a.account.localeCompare(b.account)),
          );
        }
      },
      error: () => console.warn('[Manager] 員工 API 連線失敗，使用 Demo 資料'),
    });
  }

  private updateClock(): void {
    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const yy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    this.clockStr.set(
      `${yy}-${mm}-${dd} 星期${days[now.getDay()]} ${hh}:${min}`,
    );
  }

  setTab(tab: DashTab): void {
    this.activeTab.set(tab);
  }
  setUserSubTab(sub: UserSubTab): void {
    this.userSubTab.set(sub);
  }

  get topbarTitle(): string {
    return this.TAB_TITLES[this.activeTab()];
  }

  get isAdmin(): boolean {
    return this.authService.currentUser?.role === 'boss';
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
    const p = this.products().find((x) => x.id === id);
    if (!p) return;
    const newActive = !p.isActive;
    this.products.update((list) =>
      list.map((x) => (x.id === id ? { ...x, isActive: newActive } : x)),
    );
    this.apiService.toggleProduct(id, newActive).subscribe({
      next: () => {
        // loadProducts() 已移除，避免覆蓋 isActive
        this.showToast(newActive ? '✅ 商品已上架' : '⏸️ 商品已下架');
      },
      error: () => {
        this.products.update((list) =>
          list.map((x) => (x.id === id ? { ...x, isActive: !newActive } : x)),
        );
        this.showToast('⚠️ 切換上下架失敗，請重試');
      },
    });
  }

  /* ── 今日日期（YYYY-MM-DD），供活動開始日期 [min] 使用 ── */
  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /* ── 活動：刪除（由 confirmDelete 執行，不直接呼叫）── */
  deletePromo(id: number): void {
    const promo = this.promos().find((p) => p.id === id);
    if (promo) this.requestDeletePromo(promo);
  }

  /* ── 活動：啟用/停用切換 ─────────────────────────── */
  togglePromo(id: number): void {
    const current = this.promos().find((p) => p.id === id);
    if (!current || current.ended) return;
    const newActive = !current.isActive;
    /* 樂觀更新 UI */
    this.promos.update((list) =>
      list.map((p) =>
        p.id === id
          ? {
              ...p,
              isActive: newActive,
              color: newActive ? '#c49756' : 'rgba(255,255,255,0.18)',
            }
          : p,
      ),
    );
    this.apiService
      .togglePromotion({
        name: current.rawName,
        startTime: current.rawStartTime,
        endTime: current.rawEndTime,
        promotionsId: id,
        active: newActive,
      })
      .subscribe({
        next: () =>
          this.showToast(newActive ? '✅ 活動已啟用' : '⏸️ 活動已暫停'),
        error: () => {
          /* API 失敗時還原 */
          this.promos.update((list) =>
            list.map((p) =>
              p.id === id
                ? {
                    ...p,
                    isActive: !newActive,
                    color: !newActive ? '#c49756' : 'rgba(255,255,255,0.18)',
                  }
                : p,
            ),
          );
          this.showToast('❌ 切換失敗，請確認後端連線');
        },
      });
  }

  /* ── 活動：新增贈品規則 ─────────────────────────── */
  openAddGift(promoId: number): void {
    const promo = this.promos().find((p) => p.id === promoId);
    if (!promo) return;
    this.giftDraft = {
      promoId,
      rawName: promo.rawName,
      rawStartTime: promo.rawStartTime,
      rawEndTime: promo.rawEndTime,
      fullAmount: 300,
      giftProductId: null,
      quantity: -1,
    };
    if (this.giftProductList().length === 0) {
      this.apiService.getBranchInventory(19).subscribe({
        next: (res) =>
          this.giftProductList.set(
            (res?.data ?? []).map(
              (inv: InventoryDetailVo) =>
                ({
                  id: inv.productId,
                  name: inv.productName,
                  category: '',
                  description: '',
                  active: true,
                  foodImgBase64: '',
                }) as ProductAdminVo,
            ),
          ),
      });
    }
    this.activeModal.set('addGift');
  }

  saveGift(): void {
    if (
      this.giftDraft.giftProductId == null ||
      this.giftDraft.giftProductId < 1
    ) {
      this.showToast('⚠️ 請輸入贈品商品 ID（需大於 0）');
      return;
    }
    if (this.giftDraft.fullAmount <= 0) {
      this.showToast('⚠️ 滿額門檻需大於 0');
      return;
    }
    const d = this.giftDraft;
    this.apiService
      .addGift({
        name: d.rawName,
        startTime: d.rawStartTime,
        endTime: d.rawEndTime,
        promotionsId: d.promoId,
        fullAmount: d.fullAmount,
        giftProductId: d.giftProductId!,
        quantity: d.quantity,
      })
      .subscribe({
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
    const item = this.inventory().find((i) => i.id === id);
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
    const id = this.adjustingInventoryId();
    const amt = this.adjustInventoryAmt();
    if (id === null) return;
    const item = this.inventory().find((i) => i.id === id);
    this.inventory.update((list) =>
      list.map((i) => (i.id === id ? { ...i, stock: amt } : i)),
    );
    this.adjustingInventoryId.set(null);
    this.adjustInventorySavedId.set(id);
    setTimeout(() => this.adjustInventorySavedId.set(null), 1800);
    if (item) {
      this.apiService
        .updateBranchInventory({
          productId: item.productId,
          globalAreaId: item.globalAreaId,
          stockQuantity: amt,
          basePrice: item.basePrice,
          costPrice: item.costPrice,
          maxOrderQuantity: item.maxOrderQuantity,
          active: item.active,
        })
        .subscribe({
          next: () => this.loadInventory(),
          error: () => this.showToast('⚠️ 庫存更新失敗，本地已儲存'),
        });
    }
  }

  /* ── 帳號：停/復權 ─────────────────────────────── */
  toggleAccount(id: number): void {
    const target = this.accounts().find((a) => a.id === id);
    if (!target) return;
    const newStatus = !target.isActive;
    this.accounts.update((list) =>
      list.map((a) => (a.id === id ? { ...a, isActive: newStatus } : a)),
    );
    this.apiService.updateStaffStatus(id, { newStatus: newStatus }).subscribe({
      next: () =>
        this.showToast(
          newStatus
            ? `✅ 帳號「${target.name}」已復權`
            : `🔒 帳號「${target.name}」已停權`,
        ),
      error: () => {
        this.accounts.update((list) =>
          list.map((a) => (a.id === id ? { ...a, isActive: !newStatus } : a)),
        );
        this.showToast('⚠️ 更新失敗，請確認後端連線');
      },
    });
  }

  /* ── 帳號：晉升為副店長（RM 分店長用，manager-dashboard 不使用）── */
  promoteAccount(id: number): void {
    const target = this.accounts().find((a) => a.id === id);
    if (!target) return;
    this.apiService.toggleStaff(id).subscribe({
      next: () => {
        this.showToast(`✅ 帳號「${target.name}」已晉升為副店長`);
        this.loadStaff();
      },
      error: () => this.showToast('⚠️ 晉升失敗，請確認後端連線'),
    });
  }

  /* ── 帳號：重設密碼（老闆對 RM 操作） ────────────── */
  resetPasswordAccount(id: number): void {
    const target = this.accounts().find((a) => a.id === id);
    if (!target) return;
    this.apiService.changeStaffPassword(id).subscribe({
      next: () => this.showToast(`✅「${target.name}」密碼已重設為預設值 00000`),
      error: () => this.showToast('⚠️ 重設密碼失敗，請確認後端連線'),
    });
  }

  /* ── 帳號：老闆調整職務 ──────────────────────────── */
  adminChangeRoleAction(id: number, targetRole: string): void {
    const target = this.accounts().find((a) => a.id === id);
    if (!target) return;
    const roleLabel: Record<string, string> = {
      REGION_MANAGER: '分店長',
      MANAGER_AGENT: '副店長',
      STAFF: '員工',
    };
    this.apiService.adminChangeStaffRole(id, targetRole).subscribe({
      next: () => {
        this.showToast(`✅「${target.name}」已調整為${roleLabel[targetRole]}`);
        this.loadStaff();
      },
      error: () => this.showToast('⚠️ 職務調整失敗，請確認後端連線'),
    });
  }

  /* ── 帳號：老闆調換分店 ──────────────────────────── */
  get transferTarget(): DashAccount | undefined {
    return this.accounts().find((a) => a.id === this.transferTargetId());
  }

  openTransferBranch(id: number): void {
    this.transferTargetId.set(id);
    this.transferNewAreaId.set(null);
    this.activeModal.set('transferBranch');
  }

  confirmTransfer(): void {
    const id = this.transferTargetId();
    const newAreaId = this.transferNewAreaId();
    if (!id || !newAreaId) {
      this.showToast('⚠️ 請選擇目標分店');
      return;
    }
    const target = this.accounts().find((a) => a.id === id);
    this.apiService.transferStaff(id, newAreaId).subscribe({
      next: () => {
        this.showToast(`✅「${target?.name}」已調換至新分店`);
        this.closeModal();
        this.loadStaff();
      },
      error: () => this.showToast('⚠️ 調換分店失敗，請確認後端連線'),
    });
  }

  /* ── 稅率：啟動編輯 ─────────────────────────────── */
  //   startEditTax(id: number): void {
  //     this.taxes.update((list) =>
  //       list.map((t) =>
  //         t.id === id ? { ...t, editing: true, editValue: t.rate } : t,
  //       ),
  //     );
  //   }

  //   onTaxInput(id: number, event: Event): void {
  //     const val = parseFloat((event.target as HTMLInputElement).value);
  //     if (!isNaN(val)) {
  //       this.taxes.update((list) =>
  //         list.map((t) => (t.id === id ? { ...t, editValue: val } : t)),
  //       );
  //     }
  //   }

  //   saveTax(id: number): void {
  //     /* 先樂觀更新 UI */
  //     this.taxes.update((list) =>
  //       list.map((t) =>
  //         t.id === id ? { ...t, rate: t.editValue, editing: false } : t,
  //       ),
  //     );
  //     const target = this.taxes().find((t) => t.id === id);
  //     if (!target) return;
  //     /* 同步至後端（currencyCode 以國家查詢，或以 TWD 作預設） */
  //     const currencyMap: Record<string, string> = {
  //       台灣: 'TWD',
  //       日本: 'JPY',
  //       泰國: 'THB',
  //       韓國: 'KRW',
  //       美國: 'USD',
  //       英國: 'GBP',
  //       法國: 'EUR',
  //       德國: 'EUR',
  //       新加坡: 'SGD',
  //       馬來西亞: 'MYR',
  //       印尼: 'IDR',
  //       越南: 'VND',
  //     };
  //     this.apiService
  //       .updateRegion({
  //         id,
  //         taxRate: target.editValue / 100,
  //         taxType: target.taxType,
  //       })
  //       .subscribe({
  //         next: () => this.showToast('稅率已同步至後端'),
  //         error: () => this.showToast('稅率已更新，後端同步失敗（請確認連線）'),
  //       });
  //   }

  //   cancelEditTax(id: number): void {
  //     this.taxes.update((list) =>
  //       list.map((t) => (t.id === id ? { ...t, editing: false } : t)),
  //     );
  //   }

  /* ── 折扣上限：啟動編輯 ─────────────────────────── */
  //   startEditDiscount(id: number): void {
  //     this.taxes.update((list) =>
  //       list.map((t) =>
  //         t.id === id
  //           ? { ...t, editingDiscount: true, editDiscountValue: t.discountLimit }
  //           : t,
  //       ),
  //     );
  //   }

  //   onDiscountInput(id: number, event: Event): void {
  //     const val = parseFloat((event.target as HTMLInputElement).value);
  //     if (!isNaN(val) && val >= 0) {
  //       this.taxes.update((list) =>
  //         list.map((t) => (t.id === id ? { ...t, editDiscountValue: val } : t)),
  //       );
  //     }
  //   }

  //   saveDiscount(id: number): void {
  //     const target = this.taxes().find((t) => t.id === id);
  //     if (!target) return;
  //     this.taxes.update((list) =>
  //       list.map((t) =>
  //         t.id === id
  //           ? { ...t, discountLimit: t.editDiscountValue, editingDiscount: false }
  //           : t,
  //       ),
  //     );
  //     this.apiService
  //       .updateRegion({
  //         id,
  //         taxRate: target.rate / 100,
  //         taxType: target.taxType,
  //         usageCap: target.editDiscountValue,
  //       })
  //       .subscribe({
  //         next: () => this.showToast('✅ 折扣上限已更新'),
  //         error: () => this.showToast('⚠️ 更新失敗，請確認後端連線'),
  //       });
  //   }

  //   cancelEditDiscount(id: number): void {
  //     this.taxes.update((list) =>
  //       list.map((t) => (t.id === id ? { ...t, editingDiscount: false } : t)),
  //     );
  //   }

  startEditTax(id: number): void {
    this.taxes.update((list) =>
      list.map((t) =>
        t.id === id
          ? {
              ...t,
              editing: true,
              editRate: t.rate,
              editTaxType: t.taxType,
              editDiscountLimit: t.discountLimit,
            }
          : t,
      ),
    );
  }

  cancelEditTax(id: number): void {
    this.taxes.update((list) =>
      list.map((t) => (t.id === id ? { ...t, editing: false } : t)),
    );
  }

  saveTax(id: number): void {
    const target = this.taxes().find((t) => t.id === id);
    if (!target) return;
    this.taxes.update((list) =>
      list.map((t) =>
        t.id === id
          ? {
              ...t,
              rate: t.editRate,
              taxType: target.editTaxType || target.taxType,
              discountLimit: t.editDiscountLimit,
              editing: false,
            }
          : t,
      ),
    );
    this.apiService
      .updateRegion({
        id,
        taxRate: target.editRate / 100,
        taxType: target.editTaxType,
        usageCap: target.editDiscountLimit,
      })
      .subscribe({
        next: () => this.showToast('✅ 設定已更新'),
        error: () => this.showToast('⚠️ 更新失敗，請確認後端連線'),
      });
  }

  /* ── 會員設定：新增上限 Modal ───────────────────── */
  addLimitRegionsId = signal(0);
  addLimitAmount = signal(0);
  addLimitCount = signal(0);
  addLimitSelectedTax = computed(() =>
    this.taxes().find((t) => t.id === this.addLimitRegionsId()),
  );

  openAddMemberLimit(): void {
    this.addLimitRegionsId.set(0);
    this.addLimitAmount.set(0);
    this.addLimitCount.set(0);
    this.activeModal.set('addMemberLimit');
  }

  saveAddMemberLimit(): void {
    const regionsId = this.addLimitRegionsId();
    const limitAmount = this.addLimitAmount();
    const countThreshold = this.addLimitCount();
    if (!regionsId) {
      this.showToast('請選擇國家／地區');
      return;
    }
    const row = this.memberData().find((r) => r.tax.id === regionsId);
    if (!row) return;
    const { tax, disc } = row;

    const regionReq$ = this.apiService.updateRegion({
      id: regionsId,
      taxRate: tax.rate / 100,
      taxType: tax.taxType,
      usageCap: limitAmount,
    });
    const discReq$ = disc
      ? this.apiService.updateDiscountSettings({ id: disc.id, usageCap: countThreshold, count: disc.count })
      : this.apiService.createDiscount({ regionsId, usageCap: countThreshold, count: 0 });

    forkJoin([regionReq$, discReq$]).subscribe({
      next: () => {
        localStorage.setItem(`discountLimit_${regionsId}`, String(limitAmount));
        this.taxes.update((list) =>
          list.map((t) =>
            t.id === regionsId
              ? { ...t, discountLimit: limitAmount, editDiscountLimit: limitAmount }
              : t,
          ),
        );
        this.loadDiscounts();
        this.closeModal();
        this.showToast('✅ 優惠上限已設定');
      },
      error: () => this.showToast('⚠️ 設定失敗，請確認後端連線'),
    });
  }

  /* ── 會員設定：啟動 / 儲存 / 取消 ─────────────── */
  startEditMember(taxId: number): void {
    const row = this.memberData().find((r) => r.tax.id === taxId);
    if (!row) return;
    this.editingMemberRegionId.set(taxId);
    this.editMemberLimit.set(row.tax.discountLimit);
    this.editMemberCap.set(row.disc?.usageCap ?? 0);
  }

  cancelEditMember(): void {
    this.editingMemberRegionId.set(null);
  }

  saveMemberSettings(taxId: number): void {
    const row = this.memberData().find((r) => r.tax.id === taxId);
    if (!row) return;
    const { tax, disc } = row;
    const newLimit = this.editMemberLimit();
    const newCap = this.editMemberCap();

    // 更新 region discountLimit（需帶入現有 taxRate 與 taxType）
    const regionReq$ = this.apiService.updateRegion({
      id: taxId,
      taxRate: tax.rate / 100,
      taxType: tax.taxType,
      usageCap: newLimit,
    });

    // 更新 or 新增 discount 累積次數
    const discReq$ = disc
      ? this.apiService.updateDiscountSettings({ id: disc.id, usageCap: newCap, count: disc.count })
      : this.apiService.createDiscount({ regionsId: taxId, usageCap: newCap, count: 0 });

    forkJoin([regionReq$, discReq$]).subscribe({
      next: () => {
        // regions/update 後端不持久化 usageCap，改存 localStorage 保留 F5 後的值
        localStorage.setItem(`discountLimit_${taxId}`, String(newLimit));
        this.taxes.update((list) =>
          list.map((t) =>
            t.id === taxId
              ? { ...t, discountLimit: newLimit, editDiscountLimit: newLimit }
              : t,
          ),
        );
        this.loadDiscounts();
        this.editingMemberRegionId.set(null);
        this.showToast('✅ 會員設定已更新');
      },
      error: () => this.showToast('⚠️ 更新失敗，請確認後端連線'),
    });
  }

  /* ── 匯率：載入全部（最新）──────────────────────── */
  loadAllRates(): void {
    this.rateQueryDate.set('');
    this.rateError.set(null);
    this.ratesLoading.set(true);
    this.apiService.getAllRates().subscribe({
      next: (res) => {
        this.allRates.set(this.normalizeRates(res?.exchangeRatesList ?? []));
        this.ratesLoading.set(false);
      },
      error: () => {
        this.allRates.set([]);
        this.rateError.set('匯率載入失敗，請確認後端連線');
        this.ratesLoading.set(false);
        this.showToast('⚠️ 匯率載入失敗，請確認後端連線');
      },
    });
  }

  /* ── 匯率：依日期查詢 ───────────────────────────── */
  loadRatesByDate(): void {
    const d = this.rateQueryDate();
    if (!d) {
      this.loadAllRates();
      return;
    }
    this.rateError.set(null);
    this.ratesLoading.set(true);
    this.apiService.getRatesByDate({ date: d }).subscribe({
      next: (res) => {
        this.allRates.set(this.normalizeRates(res?.exchangeRatesList ?? []));
        this.ratesLoading.set(false);
      },
      error: () => {
        this.allRates.set([]);
        this.rateError.set('日期查詢失敗，請確認日期與後端連線');
        this.ratesLoading.set(false);
        this.showToast('⚠️ 查詢失敗，請確認日期與後端連線');
      },
    });
  }

  toggleRatesPanel(): void {
    const next = !this.showRates();
    this.showRates.set(next);
    if (next && this.allRates().length === 0 && !this.ratesLoading()) {
      this.loadAllRates();
    }
  }

  private normalizeRates(rates: ExchangeRateVO[]): ExchangeRateVO[] {
    return rates
      .map((r) => ({
        ...r,
        currencyCode: r.currencyCode?.toUpperCase() ?? '',
        rateToTwd: Number(r.rateToTwd),
      }))
      .filter((r) => r.currencyCode && Number.isFinite(r.rateToTwd))
      .sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
  }

  formatRate(value: number): string {
    return new Intl.NumberFormat('zh-TW', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(value);
  }

  formatRateUpdatedAt(value: string): string {
    if (!value) return '—';
    return value.replace('T', ' ').slice(0, 19);
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
    this.newStaffResult.set(null);
  }

  /* ── 訂單：詳情 Modal ─────────────────────────────── */
  openOrderDetail(order: DashOrder): void {
    this.selectedOrder.set(order);
    this.activeModal.set('orderDetail');
  }

  /* ── 新增 / 編輯商品 Modal ─────────────────────────── */
  openAddProduct(): void {
    this.editingProductId.set(null);
    this.productDraft = {
      name: '',
      category: '',
      style: '',
      price: 165,
      stock: 0,
      emoji: '🍜',
      description: '',
      active: true,
    };
    this.productImageFile = null;
    this.productImagePreview.set('');
    this.activeModal.set('addProduct');
  }

  openEditProduct(id: number): void {
    const p = this.products().find((x) => x.id === id);
    if (!p) return;
    this.editingProductId.set(id);
    this.productDraft = {
      name: p.name,
      category: p.category || '',
      style: p.style || '',
      price: p.price,
      stock: p.stock,
      emoji: p.emoji,
      description: '',
      active: p.isActive,
    };
    this.productImageFile = null;
    this.productImagePreview.set('');
    this.activeModal.set('addProduct');

    /* 呼叫 API 補齊後端 description 與圖片 */
    this.apiService.getProductDetail(id).subscribe({
      next: (res) => {
        if (res?.product) {
          this.productDraft = {
            ...this.productDraft,
            description: res.product.description ?? '',
            category: res.product.category || this.productDraft.category,
            style: res.product.style || this.productDraft.style,
          };
        }
        if (res?.product?.foodImgBase64) {
          const raw = res.product.foodImgBase64;
          // PR #52: 後端現在回傳 URL 路徑，直接使用；舊版 Base64 也相容
          const src =
            raw.startsWith('/') || raw.startsWith('http')
              ? raw
              : raw.startsWith('data:')
                ? raw
                : `data:image/jpeg;base64,${raw}`;
          this.productImagePreview.set(src);
        }
      },
      error: () => {
        /* 靜默失敗，保留本地資料 */
      },
    });
  }

  onProductImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.productImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) =>
      this.productImagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  generateAiDesc(): void {
    if (!this.productDraft.name.trim()) {
      this.showToast('⚠️ 請先填寫商品名稱');
      return;
    }
    if (!this.productImageFile) {
      this.showToast('⚠️ 請先上傳商品圖片，AI 需要圖片才能生成描述');
      return;
    }
    this.generatingAiDesc.set(true);
    this.apiService
      .generateAiProductDesc(
        this.productDraft.name,
        this.productDraft.category,
        this.productDraft.style,
        this.productImageFile,
      )
      .subscribe({
        next: (res: AiRes) => {
          this.productDraft.description = res?.generatedDescription ?? '';
          this.generatingAiDesc.set(false);
        },
        error: () => {
          this.showToast('⚠️ AI 生成失敗');
          this.generatingAiDesc.set(false);
        },
      });
  }

  generatePromoAiDesc(): void {
    if (!this.promoDraft.name.trim()) {
      this.showToast('⚠️ 請先填寫活動名稱');
      return;
    }
    if (!this.promoDraft.image) {
      this.showToast('⚠️ 請先上傳封面圖片才能 AI 生成文案');
      return;
    }
    this.generatingPromoAiDesc.set(true);

    const base64 = this.promoDraft.image.startsWith('data:')
      ? this.promoDraft.image.split(',')[1]
      : this.promoDraft.image;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    // promotionsId 新增時後端還沒建立，傳 0 讓後端只生成文案不儲存
    this.apiService
      .generateAiPromoCopy(0, this.promoDraft.name.trim(), blob)
      .subscribe({
        next: (res: AiRes) => {
          this.promoDraft.description = res?.generatedDescription ?? '';
          this.generatingPromoAiDesc.set(false);
        },
        error: () => {
          this.showToast('❌ AI 生成失敗，請確認後端連線');
          this.generatingPromoAiDesc.set(false);
        },
      });
  }

  saveProduct(): void {
    if (!this.productDraft.name.trim()) {
      this.showToast('⚠️ 請輸入商品名稱');
      return;
    }
    if (this.editingProductId() === null && !this.productImageFile) {
      this.showToast('⚠️ 新增商品需要上傳圖片');
      return;
    }
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
      this.products.update((list) =>
        list.map((p) =>
          p.id === editId
            ? {
                ...p,
                name: this.productDraft.name,
                category: this.productDraft.category,
                price: this.productDraft.price,
                stock: this.productDraft.stock,
                emoji: this.productDraft.emoji,
                emojiBg: emojiGradients[this.productDraft.emoji] ?? p.emojiBg,
                foodImgBase64: '',
              }
            : p,
        ),
      );
      this.closeModal();
      this.showToast(`✅ 商品「${savedName}」已更新`);
      const invReq = {
        productId: editId,
        globalAreaId: 19,
        stockQuantity: this.productDraft.stock,
        basePrice: this.productDraft.price,
        costPrice: 0,
        maxOrderQuantity: 10,
        active: this.productDraft.active,
      };
      this.apiService
        .updateProduct(
          {
            id: editId,
            name: this.productDraft.name,
            category: this.productDraft.category,
            style: this.productDraft.style,
            description: this.productDraft.description,
            active: this.productDraft.active,
          },
          this.productImageFile ?? undefined,
        )
        .subscribe({
          next: () =>
            this.apiService
              .updateBranchInventory(invReq)
              .subscribe({ next: () => this.loadProducts(), error: () => this.loadProducts() }),
          error: (err) => {
  const msg = err?.error?.message ?? '⚠️ 後端更新失敗，本地已儲存';
  this.showToast(msg);
},
        });
    } else {
      /* 新增商品 */
      const ids = this.products().map((p) => p.id);
      const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      this.products.update((list) => [
        ...list,
        {
          id: newId,
          name: this.productDraft.name,
          category: this.productDraft.category,
          style: this.productDraft.style,
          price: this.productDraft.price,
          stock: this.productDraft.stock,
          isActive: true,
          emoji: this.productDraft.emoji,
          emojiBg:
            emojiGradients[this.productDraft.emoji] ??
            'linear-gradient(135deg,#c49756,#8b5e3c)',
          foodImgBase64: '',
        },
      ]);
      this.closeModal();
      this.showToast(`✅ 商品「${savedName}」已新增`);
      const draftPrice = this.productDraft.price;
      const draftStock = this.productDraft.stock;
      this.apiService
        .createProduct(
          {
            name: this.productDraft.name,
            category: this.productDraft.category,
            style: this.productDraft.style,
            description: this.productDraft.description,
          },
          this.productImageFile ?? undefined,
        )
        .subscribe({
          next: (res) => {
            const pid = res?.product?.id;
            if (pid) {
              this.apiService
                .updateBranchInventory({
                  productId: pid,
                  globalAreaId: 19,
                  stockQuantity: draftStock,
                  basePrice: draftPrice,
                  costPrice: 0,
                  maxOrderQuantity: 10,
                  active: true,
                })
                .subscribe({ next: () => this.loadProducts(), error: () => this.loadProducts() });
            } else {
              this.loadProducts();
            }
          },
          error: () => this.showToast('⚠️ 後端新增失敗，本地已儲存'),
        });
    }
  }

  /* ── 新增活動 Slide-in Panel ───────────────────────── */
  openAddPromo(): void {
    this.promoDraft = {
      name: '',
      type: 'promotion',
      description: '',
      startTime: '',
      endTime: '',
      color: '#c49756',
      badgeColor: '#c49756',
      minAmount: null,
      image: '',
      currency: 'NT$',
      giftFullAmount: null,
      giftProductId: null,
      giftQuantity: -1,
    };
    if (this.giftProductList().length === 0) {
      this.apiService.getBranchInventory(19).subscribe({
        next: (res) =>
          this.giftProductList.set(
            (res?.data ?? []).map(
              (inv: InventoryDetailVo) =>
                ({
                  id: inv.productId,
                  name: inv.productName,
                  category: '',
                  description: '',
                  active: true,
                  foodImgBase64: '',
                }) as ProductAdminVo,
            ),
          ),
      });
    }
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
    reader.onload = (e) => {
      this.promoDraft.image = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }

  savePromo(): void {
    if (!this.promoDraft.name.trim()) {
      this.showToast('請輸入活動名稱');
      return;
    }
    if (!this.promoDraft.startTime || !this.promoDraft.endTime) {
      this.showToast('請填寫活動開始與結束日期');
      return;
    }
    if (!this.promoDraft.image) {
      this.showToast('請上傳活動封面圖片（必填）');
      return;
    }
    if (
      !this.promoDraft.giftFullAmount ||
      this.promoDraft.giftFullAmount <= 0
    ) {
      this.showToast('⚠️ 請填寫滿額門檻');
      return;
    }
    if (!this.promoDraft.giftProductId) {
      this.showToast('⚠️ 請選擇贈品商品');
      return;
    }

    const saved = { ...this.promoDraft };
    const req: PromotionsManageReq = {
      name: saved.name.trim(),
      startTime: saved.startTime,
      endTime: saved.endTime,
      description: saved.description?.trim() || undefined,
    };
    if (
      saved.giftProductId != null &&
      saved.giftProductId > 0 &&
      saved.giftFullAmount != null &&
      saved.giftFullAmount > 0
    ) {
      req.giftProductId = saved.giftProductId;
      req.fullAmount = saved.giftFullAmount;
      req.quantity = saved.giftQuantity;
    }
    this.apiService.createPromotion(req, saved.image).subscribe({
      next: () => {
        this.loadPromos();
        this.closePromoPanel();
        this.showToast(`活動「${saved.name.trim()}」已新增`);
      },
      error: () => {
        this.showToast('活動新增失敗，請確認後端服務是否正常');
      },
    });
  }

  /* ── 新增 / 編輯帳號 Modal ─────────────────────────── */
  openAddAccount(): void {
    this.editingAccountId.set(null);
    const firstBranch = this.branches()[0];
    const country = firstBranch?.country ?? '';
    this.accountModalCountry.set(country);
    const subTab = this.userSubTab();
    const defaultRole: 'bm' | 'ma' | 'staff' =
      subTab === 'bm' ? 'bm' : subTab === 'ma' ? 'ma' : 'staff';
    this.accountDraft = {
      name: '',
      account: '',
      password: '',
      branch: firstBranch?.name ?? '',
      shift: '早班',
      role: defaultRole,
      isActive: true,
      country,
    };
    this.activeModal.set('addAccount');
  }

  onAccountCountryChange(country: string): void {
    this.accountModalCountry.set(country);
    const match = this.branches().find((b) => b.country === country);
    if (match) this.accountDraft.branch = match.name;
  }

  openEditAccount(id: number): void {
    const acc = this.accounts().find((a) => a.id === id);
    if (!acc) return;
    this.editingAccountId.set(id);
    const country = acc.country ?? '';
    this.accountModalCountry.set(country);
    this.accountDraft = {
      name: acc.name,
      account: acc.account,
      password: '',
      branch: acc.branch ?? '',
      shift: acc.shift ?? '早班',
      role: acc.role,
      isActive: acc.isActive,
      country,
    };
    this.activeModal.set('addAccount');
  }

  saveAccount(): void {
    if (!this.accountDraft.name.trim()) {
      this.showToast('⚠️ 姓名為必填');
      return;
    }
    const editId = this.editingAccountId();
    const savedName = this.accountDraft.name;
    if (editId !== null) {
      this.accounts.update((list) =>
        list.map((a) =>
          a.id === editId
            ? {
                ...a,
                name: this.accountDraft.name,
                branch: this.accountDraft.branch,
                shift:
                  this.accountDraft.role === 'staff'
                    ? this.accountDraft.shift
                    : undefined,
                role: this.accountDraft.role,
                isActive: this.accountDraft.isActive,
                country: this.accountDraft.country,
              }
            : a,
        ),
      );
      this.closeModal();
      this.showToast(`✅ 帳號「${savedName}」已更新`);
    } else {
      const globalAreaId =
        this.branches().find((b) => b.name === this.accountDraft.branch)?.id ??
        1;
      const backendRole =
        this.accountDraft.role === 'bm' ? 'REGION_MANAGER'
        : this.accountDraft.role === 'ma' ? 'MANAGER_AGENT'
        : 'STAFF';
      this.apiService
        .createStaff({
          name: this.accountDraft.name,
          role: backendRole,
          globalAreaId,
        })
        .subscribe({
          next: (res) => {
            this.loadStaff();
            const created = res?.staffList?.[0];
            if (created?.account) {
              this.newStaffResult.set({
                name: created.name,
                account: created.account,
              });
            } else {
              this.closeModal();
              this.showToast(`✅ 帳號「${savedName}」已新增`);
            }
          },
          error: () => this.showToast('⚠️ 新增失敗，請確認後端連線'),
        });
    }
  }

  confirmNewStaff(): void {
    this.newStaffResult.set(null);
    this.closeModal();
  }

  /* ── 新增國家稅率 Modal ─────────────────────────────── */
  openAddCountry(): void {
    this.taxDraft = {
      country: '',
      countryCode: '',
      currency: '',
      taxType: 'INCLUSIVE',
      rate: 0,
    };
    this.activeModal.set('addCountry');
  }

  saveCountry(): void {
    if (!this.taxDraft.country.trim()) {
      this.showToast('請輸入國家／地區名稱');
      return;
    }
    const saved = { ...this.taxDraft };
    const currencyMap: Record<string, string> = {
      台灣: 'TWD',
      日本: 'JPY',
      泰國: 'THB',
      韓國: 'KRW',
      美國: 'USD',
      英國: 'GBP',
      法國: 'EUR',
      德國: 'EUR',
      新加坡: 'SGD',
      馬來西亞: 'MYR',
      印尼: 'IDR',
      越南: 'VND',
    };
    const resolvedCurrency =
      saved.currency.trim() || currencyMap[saved.country.trim()] || 'USD';
    const taxTypeLabel = saved.taxType === 'INCLUSIVE' ? '內含稅' : '外加稅';
    this.apiService
      .insertRegion({
        country: saved.country.trim(),
        countryCode: saved.countryCode.trim().toUpperCase(),
        currencyCode: resolvedCurrency,
        taxRate: saved.rate / 100,
        taxType: saved.taxType as 'INCLUSIVE' | 'EXCLUSIVE',
        usageCap: 0,
      })
      .subscribe({
        next: () => {
          this.loadTaxes();
          this.closeModal();
          this.showToast(
            `已新增 ${saved.country}（${resolvedCurrency}）${taxTypeLabel} ${saved.rate}%`,
          );
        },
        error: () => {
          const ids = this.taxes().map((t) => t.id);
          const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
          this.taxes.update((list) => [
            ...list,
            {
              id: newId,
              country: saved.country,
              countryCode: saved.countryCode.trim().toUpperCase(),
              currency: resolvedCurrency,
              taxType: saved.taxType,
              rate: saved.rate,
              discountLimit: 0,
              editing: false,
              editRate: saved.rate,
              editTaxType: saved.taxType,
              editDiscountLimit: 0,
            },
          ]);
          this.closeModal();
          this.showToast(
            `後端暫不可用，已本地新增 ${saved.country}（${resolvedCurrency}）`,
          );
        },
      });
  }

  /* ── 財務報表：匯出 CSV（isExporting spinner 保護）── */
  exportCsv(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);

    /* 模擬非同步處理 600ms（實際串接後可改為真實 API call） */
    setTimeout(() => {
      const headers = [
        '訂單編號',
        '分店',
        '品項摘要',
        '金額',
        '付款方式',
        '時間',
        '狀態',
      ];
      const rows = this.allOrders().map((o) => [
        o.id,
        o.branch,
        o.summary,
        o.amount,
        o.payMethod,
        o.time,
        o.statusLabel,
      ]);
      const csv = [headers, ...rows]
        .map((r) =>
          r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
        )
        .join('\n');
      const blob = new Blob(['\ufeff' + csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.isExporting.set(false);
      this.showToast(
        '✅ CSV 匯出成功，共 ' + this.allOrders().length + ' 筆訂單',
      );
    }, 600);
  }

  /* ── 財務報表：查詢入口 ─────────────────────────── */
  onFinanceCountryChange(country: string): void {
    this.financeCountry.set(country);
    this.financeBranchId.set(null);
    this.financeMonthResult.set(null);
    this.financeRangeResult.set(null);
    this.financeTopProducts.set([]);
    this.financeChartData.set([]);
    this.showTwdConversion.set(false);
  }

  queryFinance(): void {
    if (this.financeMode() === 'month') {
      this.queryFinanceMonth();
    } else {
      this.queryFinanceRange();
    }
  }

  private queryFinanceMonth(): void {
    const month = this.financeMonth();
    if (!month) {
      this.showToast('⚠️ 請選擇月份');
      return;
    }
    this.financeLoading.set(true);
    this.financeMonthResult.set(null);
    this.financeTopProducts.set([]);
    this.financeChartData.set([]);

    this.apiService.getMonthlyReport({ reportDate: month }).subscribe({
      next: (res) => {
        this.financeMonthResult.set(res);
        this.financeLoading.set(false);
        this.animateValue(
          this.animatedCurrentTotal,
          this.financeCurrentTotal(),
          'animTimer1',
        );
        this.animateValue(
          this.animatedLastTotal,
          this.financeLastTotal(),
          'animTimer2',
        );
        this.animateValue(
          this.animatedBranchCount,
          this.financeCurrentData().length,
          'animTimer3',
          600,
        );
        const [year, monthNum] = month.split('-').map(Number);
        const regionsId = this.financeRegionsId();
        if (regionsId) {
          this.apiService
            .getTop5MonthlySales(year, monthNum, regionsId)
            .subscribe({
              next: (r) =>
                this.financeTopProducts.set(r?.salesList ?? []),
              error: () =>
                this.financeTopProducts.set([]),
            });
        }

        // 保底圖表：用本月 + 上月兩筆資料先渲染
        this.financeChartData.set(
          this.buildChartFrom2Months(res?.currentData ?? [], res?.lastData ?? []),
        );
        this.chartAnimKey.update((n) => n + 1);

        // 嘗試取近 6 個月趨勢（成功則覆蓋保底資料）
        const [cy, cm] = month.split('-').map(Number);
        const startDate = new Date(cy, cm - 6, 1);
        const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        this.apiService
          .getMonthlyReportByRange({ startMonth, endMonth: month } as MonthRangeReportsReq)
          .subscribe({
            next: (rangeRes) => {
              const rows = rangeRes?.reportList ?? [];
              if (rows.length === 0) return; // 沒資料就保留保底兩個月
              const country = this.financeCountry();
              const isAll = country === '全部';
              const filtered = isAll ? rows : rows.filter((r) => r.regionsName === country);
              const monthMap = new Map<string, { revenue: number; cost: number }>();
              filtered.forEach((r) => {
                const prev = monthMap.get(r.reportDate) ?? { revenue: 0, cost: 0 };
                monthMap.set(r.reportDate, {
                  revenue:
                    prev.revenue +
                    (isAll
                      ? this.convertToTwd(Number(r.totalAmount), r.regionsName)
                      : Number(r.totalAmount)),
                  cost:
                    prev.cost +
                    (isAll
                      ? this.convertToTwd(Number(r.totalCost ?? 0), r.regionsName)
                      : Number(r.totalCost ?? 0)),
                });
              });
              const chartData = Array.from(monthMap.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([m, v]) => ({ month: m, ...v }));
              if (chartData.length > 0) {
                this.financeChartData.set(chartData);
                this.chartAnimKey.update((n) => n + 1);
              }
            },
            error: () => {}, // 保底資料已設定，不需處理
          });
      },
      error: () => {
        this.financeLoading.set(false);
        this.showToast('⚠️ 報表載入失敗，請確認後端連線');
      },
    });
  }

  private buildChartFrom2Months(
    currentData: MonthlyReportDetail[],
    lastData: MonthlyReportDetail[],
  ): { month: string; revenue: number; cost: number }[] {
    const country = this.financeCountry();
    const isAll = country === '全部';
    const filterFn = (rows: MonthlyReportDetail[]) =>
      isAll ? rows : rows.filter((r) => r.regionsName === country);
    const sumFn = (
      rows: MonthlyReportDetail[],
    ): { revenue: number; cost: number } =>
      filterFn(rows).reduce(
        (s, r) => ({
          revenue:
            s.revenue +
            (isAll
              ? this.convertToTwd(Number(r.totalAmount), r.regionsName)
              : Number(r.totalAmount)),
          cost:
            s.cost +
            (isAll
              ? this.convertToTwd(Number(r.totalCost ?? 0), r.regionsName)
              : Number(r.totalCost ?? 0)),
        }),
        { revenue: 0, cost: 0 },
      );

    const result: { month: string; revenue: number; cost: number }[] = [];
    const lastMonth = lastData[0]?.reportDate;
    const currMonth = currentData[0]?.reportDate;
    if (lastMonth) result.push({ month: lastMonth, ...sumFn(lastData) });
    if (currMonth && currMonth !== lastMonth)
      result.push({ month: currMonth, ...sumFn(currentData) });
    return result;
  }

  private queryFinanceRange(): void {
    const start = this.financeStart();
    const end = this.financeEnd();
    if (!start || !end) {
      this.showToast('⚠️ 請選擇日期區間');
      return;
    }
    if (start > end) {
      this.showToast('⚠️ 開始日期不能晚於結束日期');
      return;
    }
    this.financeLoading.set(true);
    this.financeRangeResult.set(null);
    const branchId = this.financeBranchId() ?? undefined;
    const regionsId = this.financeRegionsId() ?? undefined;
    this.apiService
      .getRevenueReports({
        startDate: start,
        endDate: end,
        branchId,
        regionsId,
      })
      .subscribe({
        next: (res) => {
          this.financeRangeResult.set(res);
          this.financeLoading.set(false);
        },
        error: () => {
          this.financeLoading.set(false);
          this.showToast('⚠️ 查詢失敗，請確認後端連線');
        },
      });
  }

  private filterFinanceData(
    data: MonthlyReportDetail[],
  ): MonthlyReportDetail[] {
    const country = this.financeCountry();
    const branchId = this.financeBranchId();
    let filtered = data;
    if (country !== '全部') {
      filtered = filtered.filter((d) => d.regionsName === country);
    }
    if (branchId !== null) {
      const branch = this.branches().find((b) => b.id === branchId);
      if (branch)
        filtered = filtered.filter((d) => d.branchName === branch.name);
    }
    return filtered;
  }

  // 只用國家過濾（給「各分店」表格用，不受分店下拉影響）
  private filterByCountryOnly(data: MonthlyReportDetail[]): MonthlyReportDetail[] {
    const country = this.financeCountry();
    if (country === '全部') return data;
    return data.filter((d) => d.regionsName === country);
  }

  private convertToTwd(amount: number, regionsName: string): number {
    const currency = this.taxes().find(
      (t) => t.country === regionsName,
    )?.currency;
    if (!currency || currency === 'TWD') return amount;
    // rateToTwd 語意：X 單位外幣 = 1 TWD，故換算為 amount / rate
    const rate =
      this.allRates().find((r) => r.currencyCode === currency)?.rateToTwd ?? 1;
    return rate > 0 ? amount / rate : amount;
  }

  getFinanceCurrencyLabel(): string {
    const country = this.financeCountry();
    if (country === '全部') return 'TWD';
    return this.taxes().find((t) => t.country === country)?.currency ?? '';
  }

  toggleTwdConversion(): void {
    const next = !this.showTwdConversion();
    this.showTwdConversion.set(next);
    if (next && this.allRates().length === 0 && !this.ratesLoading()) {
      this.loadAllRates();
    }
  }

  formatChartMonth(ym: string): string {
    return `${+ym.slice(5)}月`;
  }

  abbreviateNum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return `${Math.round(n)}`;
  }

  getRowCurrencyLabel(regionsName: string): string {
    return this.taxes().find((t) => t.country === regionsName)?.currency ?? '';
  }

  /* ── 分店：輔助 — 依 regionsId 查國家名稱 ────────── */
  getBranchCountryName(regionsId: number): string {
    return this.taxes().find((t) => t.id === regionsId)?.country ?? '';
  }

  /* ── 分店：新增 Modal ─────────────────────────────── */
  openAddBranch(): void {
    this.branchDraft = { regionsId: 0, city: '', address: '', phone: '' };
    this.activeModal.set('addBranch');
  }

  saveBranch(): void {
    if (!this.branchDraft.regionsId || !this.branchDraft.city.trim()) {
      this.showToast('⚠️ 請選擇國家與城市');
      return;
    }
    if (!this.branchDraft.address.trim()) {
      this.showToast('⚠️ 請填寫分店地址');
      return;
    }
    if (!this.branchDraft.phone.trim()) {
      this.showToast('⚠️ 請填寫分店電話');
      return;
    }
    const saved = { ...this.branchDraft };
    const countryName = this.getBranchCountryName(saved.regionsId);
    const autoName = `${countryName}${saved.city.trim()}店`;
    this.apiService
      .createBranch({
        regionsId: saved.regionsId,
        branch: autoName,
        address: saved.address.trim(),
        phone: saved.phone.trim(),
      })
      .subscribe({
        next: (res) => {
          if (res?.code === 200) {
            this.loadBranches();
            this.closeModal();
            this.showToast(`✅ 分店「${autoName}」已新增`);
          } else {
            this.showToast(
              `⚠️ 新增失敗：${res?.message ?? '請確認電話格式是否正確'}`,
            );
          }
        },
        error: () => {
          this.showToast('⚠️ 後端連線失敗，請確認伺服器是否啟動');
        },
      });
  }

  /* ── 分店：編輯 Modal ─────────────────────────────── */
  openEditBranch(id: number): void {
    const b = this.branches().find((x) => x.id === id);
    if (!b) return;
    this.editBranchDraft = {
      id: b.id,
      regionsId: b.regionsId,
      city: b.city,
      address: b.address,
      phone: b.phone,
    };
    this.activeModal.set('editBranch');
  }

  saveEditBranch(): void {
    if (!this.editBranchDraft.regionsId || !this.editBranchDraft.city.trim()) {
      this.showToast('⚠️ 請選擇國家與城市');
      return;
    }
    if (!this.editBranchDraft.address.trim()) {
      this.showToast('⚠️ 請填寫分店地址');
      return;
    }
    if (!this.editBranchDraft.phone.trim()) {
      this.showToast('⚠️ 請填寫分店電話');
      return;
    }
    const saved = { ...this.editBranchDraft };
    const countryName = this.getBranchCountryName(saved.regionsId);
    const autoName = `${countryName}${saved.city.trim()}店`;
    this.apiService
      .updateBranch({
        id: saved.id,
        regionsId: saved.regionsId,
        branch: autoName,
        address: saved.address.trim(),
        phone: saved.phone.trim(),
      })
      .subscribe({
        next: (res) => {
          if (res?.code === 200) {
            this.loadBranches();
            this.closeModal();
            this.showToast(`✅ 分店「${autoName}」已更新`);
          } else {
            this.showToast(
              `⚠️ 更新失敗：${res?.message ?? '請確認電話格式是否正確'}`,
            );
          }
        },
        error: () => {
          this.showToast('⚠️ 後端連線失敗，請確認伺服器是否啟動');
        },
      });
  }

  /* ── 分店：刪除確認 Modal ────────────────────────── */
  deleteBranchConfirm = signal<{ id: number; name: string } | null>(null);

  requestDeleteBranch(id: number): void {
    const b = this.branches().find((x) => x.id === id);
    if (!b) return;
    this.deleteBranchConfirm.set({ id, name: b.name });
  }

  confirmDeleteBranch(): void {
    const target = this.deleteBranchConfirm();
    if (!target) return;
    this.deleteBranchConfirm.set(null);
    this.apiService.deleteBranch({ globalAreaIdList: [target.id] }).subscribe({
      next: () => {
        this.branches.update((list) => list.filter((x) => x.id !== target.id));
        this.showToast(`🗑️ 分店「${target.name}」已刪除`);
      },
      error: () => {
        this.branches.update((list) => list.filter((x) => x.id !== target.id));
        this.showToast(`⚠️ 後端暫不可用，僅本地移除分店「${target.name}」`);
      },
    });
  }

  cancelDeleteBranch(): void {
    this.deleteBranchConfirm.set(null);
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
      全部: 'all',
      待製作: '待製作',
      製作中: '製作中',
      已完成: '已完成',
      已取消: '已取消',
    };
    this.orderFilterStatus.set(map[val] ?? 'all');
  }
}

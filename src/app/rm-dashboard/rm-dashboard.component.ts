import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../shared/auth.service';
import { forkJoin } from 'rxjs';
import {
  ApiService,
  InventoryDetailVo,
  PromotionDetailVo,
  GiftDetailVo,
  StaffVO,
  RegisterStaffReq,
  MonthlyReportDetail,
  MonthlyProductsSalesVo,
  RegionVO,
  DiscountRecord,
} from '../shared/api.service';

/* ── 頁籤型別 ────────────────────────────────────── */
export type RmTab = 'inventory' | 'users' | 'promotions' | 'finance';
export type RmUserSubTab = 'bm' | 'staff';

/* ── 本地介面 ────────────────────────────────────── */
interface DashInventory {
  id: number;
  productId: number;
  globalAreaId: number;
  name: string;
  branch: string;
  category: string;
  style: string;
  stock: number;
  safeStock: number;
  basePrice: number;
  costPrice: number;
  maxOrderQuantity: number;
  active: boolean;
}

interface DashAccount {
  id: number;
  name: string;
  account: string;
  branch?: string;
  joinedAt: string;
  isActive: boolean;
  role: 'bm' | 'staff';
  backendRole?: string;
}

interface DashPromo {
  id: number;
  title: string;
  scope: string;
  isActive: boolean;
  color: string;
  ended: boolean;
  type: 'promotion' | 'announcement';
  description?: string;
  image?: string;
  badgeColor?: string;
  minAmount?: number;
  gifts?: GiftDetailVo[];
  rawStartTime: string;
  rawEndTime: string;
}

@Component({
  selector: 'app-rm-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rm-dashboard.component.html',
  styleUrls: ['./rm-dashboard.component.scss'],
})
export class RmDashboardComponent implements OnInit, OnDestroy {
  /* ── 頁籤狀態 ────────────────────────────────────── */
  activeTab = signal<RmTab>('inventory');
  userSubTab = signal<RmUserSubTab>('staff');
  clockStr = signal('');
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  readonly TAB_TITLES: Record<RmTab, string> = {
    inventory: '庫存管理',
    users: '員工管理',
    promotions: '活動一覽',
    finance: '財務報表',
  };

  /* ── 分店資訊 ─────────────────────────────────────── */
  branchId = 0;
  branchRegionsId = 0;
  branchName = signal<string>('');

  /* ── 會員設定 ────────────────────────────────────── */
  rmRegion = signal<RegionVO | null>(null);
  rmDiscount = signal<DiscountRecord | null>(null);
  editingMemberRegionId = signal<number | null>(null);
  editMemberLimit = signal(0);
  editMemberCap = signal(0);

  /* ── 庫存 ────────────────────────────────────────── */
  inventory = signal<DashInventory[]>([]);
  inventorySearch = signal('');

  filteredInventory = computed(() => {
    const q = this.inventorySearch().toLowerCase().trim();
    if (!q) return this.inventory();
    return this.inventory().filter((i) => i.name.toLowerCase().includes(q));
  });

  availableCategories = computed(() => [
    ...new Set(
      this.inventory()
        .map((i) => i.category)
        .filter(Boolean),
    ),
  ]);

  readonly STYLE_OPTIONS = ['台式經典', '日式簡約', '韓式風情', '美式辣食', '義式浪漫'];

  /* ── 調整庫存 Modal ────────────────────────────────── */
  showAdjustModal = signal(false);
  adjustModalItem = signal<DashInventory | null>(null);
  adjustDraft = {
    category: '',
    style: '',
    stock: 0,
    costPrice: 0,
    basePrice: 0,
    maxOrderQuantity: 1,
  };
  adjustLoading = signal(false);

  /* ── 員工 ────────────────────────────────────────── */
  accounts = signal<DashAccount[]>([]);

  isDeputyManager = computed(
    () => this.authService.currentUser?.role === 'deputy_manager',
  );

  bmAccounts = computed(() => this.accounts().filter((a) => a.role === 'bm'));
  staffAccounts = computed(() =>
    this.accounts().filter((a) => a.role === 'staff'),
  );


  /* ── 員工 modal ──────────────────────────────────── */
  activeModal = signal<'addStaff' | 'editStaff' | null>(null);
  newStaff = { name: '', role: 'STAFF' };
  addStaffError = signal<string | null>(null);
  addStaffLoading = signal(false);
  newStaffResult = signal<{ name: string; account: string } | null>(null);
  editStaffId = signal<number | null>(null);
  editStaffDraft: { name: string; password: string; backendRole: string } = {
    name: '',
    password: '',
    backendRole: 'STAFF',
  };
  showEditStaffPwd = signal(false);

  /* ── 活動 ────────────────────────────────────────── */
  promos = signal<DashPromo[]>([]);
  selectedPromo = signal<DashPromo | null>(null);

  /* ── 財務報表 ─────────────────────────────────────── */
  financeStart = signal('');
  financeEnd = signal('');
  financeLoading = signal(false);
  financeMonthlyData = signal<MonthlyReportDetail[]>([]);

  financeChartData = computed(() => {
    const rows = this.financeMonthlyData();
    if (!rows.length) return [] as { month: string; revenue: number; cost: number }[];
    const monthMap = new Map<string, { revenue: number; cost: number }>();
    rows.forEach((r) => {
      const prev = monthMap.get(r.reportDate) ?? { revenue: 0, cost: 0 };
      monthMap.set(r.reportDate, {
        revenue: prev.revenue + Number(r.totalAmount ?? 0),
        cost: prev.cost + Number(r.totalCost ?? 0),
      });
    });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));
  });

  financeChartMax = computed(() => {
    const data = this.financeChartData();
    if (!data.length) return 1;
    return Math.max(...data.map((d) => Math.max(d.revenue, d.cost)), 1);
  });

  financeTotal = computed(() =>
    this.financeChartData().reduce((s, d) => s + d.revenue, 0),
  );
  financeCostTotal = computed(() =>
    this.financeChartData().reduce((s, d) => s + d.cost, 0),
  );
  financeGrossProfit = computed(() => this.financeTotal() - this.financeCostTotal());
  financeMarginPct = computed(() => {
    const rev = this.financeTotal();
    if (!rev) return 0;
    return (this.financeGrossProfit() / rev) * 100;
  });

  /* ── 商品月銷售報表 ────────────────────────────────── */
  salesYear = signal(new Date().getFullYear());
  salesMonth = signal(new Date().getMonth() + 1);
  salesLoading = signal(false);
  salesData = signal<MonthlyProductsSalesVo[]>([]);

  /* ── Toast ───────────────────────────────────────── */
  toastMsg = signal('');
  toastLeaving = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastLeaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private router: Router,
    public authService: AuthService,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user || (user.role !== 'branch_manager' && user.role !== 'deputy_manager')) {
      this.router.navigate(['/staff-login']);
      return;
    }
    this.branchId = this.authService.currentStaff?.globalAreaId ?? 0;

    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    this.loadBranchName();
    this.loadInventory();
    this.loadStaff();
    this.loadPromos();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.toastLeaveTimer) clearTimeout(this.toastLeaveTimer);
  }

  /* ── 初始化：取得分店名稱 ───────────────────────── */
  private loadBranchName(): void {
    this.apiService.getAllBranches().subscribe({
      next: (res) => {
        const found = res?.globalAreaList?.find((b) => b.id === this.branchId);
        if (found) {
          this.branchName.set(found.branch);
          this.branchRegionsId = found.regionsId;
          this.loadMemberSettings();
        }
      },
      error: () => {},
    });
  }

  /* ── 會員設定：載入 ─────────────────────────────── */
  private loadMemberSettings(): void {
    const rid = this.branchRegionsId;
    if (!rid) return;
    forkJoin([
      this.apiService.getAllTax(),
      this.apiService.getDiscountList(),
    ]).subscribe({
      next: ([regRes, discRes]) => {
        const region = regRes?.regionsList?.find((r: RegionVO) => r.id === rid);
        if (region) this.rmRegion.set(region);
        const disc = discRes?.discountList?.find((d: DiscountRecord) => d.regionsId === rid);
        this.rmDiscount.set(disc ?? null);
      },
      error: () => {},
    });
  }

  startEditMember(): void {
    const region = this.rmRegion();
    if (!region) return;
    this.editingMemberRegionId.set(region.id);
    this.editMemberLimit.set(region.usageCap);
    this.editMemberCap.set(this.rmDiscount()?.usageCap ?? 0);
  }

  cancelEditMember(): void {
    this.editingMemberRegionId.set(null);
  }

  saveMemberSettings(): void {
    const region = this.rmRegion();
    if (!region) return;
    const disc = this.rmDiscount();
    const newLimit = this.editMemberLimit();
    const newCap = this.editMemberCap();

    const regionReq$ = this.apiService.updateRegion({
      id: region.id,
      taxRate: region.taxRate,
      taxType: region.taxType,
      usageCap: newLimit,
    });
    const discReq$ = disc
      ? this.apiService.updateDiscountSettings({ id: disc.id, usageCap: newCap, count: disc.count })
      : this.apiService.createDiscount({ regionsId: region.id, usageCap: newCap, count: 0 });

    forkJoin([regionReq$, discReq$]).subscribe({
      next: () => {
        this.editingMemberRegionId.set(null);
        this.loadMemberSettings();
        this.showToast('✅ 會員設定已更新');
      },
      error: () => this.showToast('⚠️ 更新失敗，請確認後端連線'),
    });
  }

  /* ── 庫存 ────────────────────────────────────────── */
  private loadInventory(): void {
    if (!this.branchId) return;
    this.apiService.getBranchInventory(this.branchId).subscribe({
      next: (res) => {
        if (res?.data?.length) {
          this.inventory.set(
            res.data.map((inv: InventoryDetailVo) => ({
              id: inv.productId,
              productId: inv.productId,
              globalAreaId: inv.globalAreaId,
              name: inv.productName,
              branch: inv.branchName,
              category: inv.category ?? '',
              style: inv.style ?? '',
              stock: inv.stockQuantity,
              safeStock: 10,
              basePrice: inv.basePrice,
              costPrice: inv.costPrice,
              maxOrderQuantity: inv.maxOrderQuantity,
              active: inv.active,
            })),
          );
        }
      },
      error: () => this.showToast('⚠️ 庫存載入失敗'),
    });
  }

  openAdjustModal(item: DashInventory): void {
    this.adjustModalItem.set(item);
    this.adjustDraft = {
      category: item.category,
      style: item.style,
      stock: item.stock,
      costPrice: item.costPrice,
      basePrice: item.basePrice,
      maxOrderQuantity: item.maxOrderQuantity,
    };
    this.showAdjustModal.set(true);
  }

  closeAdjustModal(): void {
    this.showAdjustModal.set(false);
    this.adjustModalItem.set(null);
  }

  confirmAdjustModal(): void {
    const item = this.adjustModalItem();
    if (!item) return;
    this.adjustLoading.set(true);

    const { category, style, stock, costPrice, basePrice, maxOrderQuantity } =
      this.adjustDraft;
    const metaChanged = category !== item.category || style !== item.style;

    this.apiService
      .updateBranchInventory({
        productId: item.productId,
        globalAreaId: item.globalAreaId,
        stockQuantity: stock,
        basePrice,
        costPrice,
        maxOrderQuantity,
        active: item.active,
      })
      .subscribe({
        next: () => {
          if (!metaChanged) {
            this.finishAdjust('✅ 庫存資料已更新');
            return;
          }
          this.apiService.getProductDetail(item.productId).subscribe({
            next: (res) => {
              const desc = res?.product?.description ?? '';
              if (!desc) {
                this.finishAdjust('⚠️ 原商品描述為空，無法更新分類');
                return;
              }
              this.apiService
                .updateProduct({
                  id: item.productId,
                  name: item.name,
                  category,
                  style,
                  description: desc,
                  active: item.active,
                })
                .subscribe({
                  next: () => this.finishAdjust('✅ 庫存資料已更新'),
                  error: () =>
                    this.finishAdjust('⚠️ 分類/風格更新失敗，其餘資料已儲存'),
                });
            },
            error: () => this.finishAdjust('⚠️ 分類/風格更新失敗，其餘資料已儲存'),
          });
        },
        error: () => {
          this.adjustLoading.set(false);
          this.showToast('⚠️ 庫存更新失敗');
        },
      });
  }

  private finishAdjust(msg: string): void {
    this.adjustLoading.set(false);
    this.closeAdjustModal();
    this.showToast(msg);
    this.loadInventory();
  }

  toggleInventoryActive(id: number): void {
    const item = this.inventory().find((i) => i.id === id);
    if (!item) return;
    const newActive = !item.active;
    this.inventory.update((list) =>
      list.map((i) => (i.id === id ? { ...i, active: newActive } : i)),
    );
    this.apiService
      .updateBranchInventory({
        productId: item.productId,
        globalAreaId: item.globalAreaId,
        stockQuantity: item.stock,
        basePrice: item.basePrice,
        costPrice: item.costPrice,
        maxOrderQuantity: item.maxOrderQuantity,
        active: newActive,
      })
      .subscribe({
        next: () => this.showToast(newActive ? '✅ 已上架' : '⏸️ 已下架'),
        error: () => {
          this.inventory.update((list) =>
            list.map((i) => (i.id === id ? { ...i, active: !newActive } : i)),
          );
          this.showToast('⚠️ 操作失敗，請確認後端連線');
        },
      });
  }

  /* ── 員工 ────────────────────────────────────────── */
  private loadStaff(): void {
    this.apiService.getAllStaff().subscribe({
      next: (res) => {
        if (res?.staffList?.length) {
          this.accounts.set(
            res.staffList
              .filter(
                (s: StaffVO) =>
                  s.role !== 'ADMIN' && s.globalAreaId === this.branchId,
              )
              .map((s: StaffVO) => ({
                id: s.id,
                name: s.name,
                account: s.account,
                branch: this.branchName(),
                joinedAt: s.hireAt?.slice(0, 10) ?? '',
                isActive: s.status ?? true,
                role:
                  s.role === 'REGION_MANAGER' || s.role === 'MANAGER_AGENT'
                    ? 'bm'
                    : ('staff' as 'bm' | 'staff'),
                backendRole: s.role,
              })),
          );
        }
      },
      error: () => this.showToast('⚠️ 員工資料載入失敗'),
    });
  }

  toggleAccount(id: number): void {
    const target = this.accounts().find((a) => a.id === id);
    if (!target) return;
    const newStatus = !target.isActive;
    this.accounts.update((list) =>
      list.map((a) => (a.id === id ? { ...a, isActive: newStatus } : a)),
    );
    this.apiService.updateStaffStatus(id, { newStatus }).subscribe({
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

  demoteAccount(id: number): void {
    const target = this.accounts().find((a) => a.id === id);
    if (!target) return;
    this.apiService.toggleStaff(id).subscribe({
      next: () => {
        this.showToast(`✅ 帳號「${target.name}」已降級為員工`);
        this.loadStaff();
      },
      error: () => this.showToast('⚠️ 降級失敗，請確認後端連線'),
    });
  }

  openEditStaff(id: number): void {
    const target = this.accounts().find((a) => a.id === id);
    if (!target) return;
    this.editStaffId.set(id);
    this.editStaffDraft = {
      name: target.name,
      password: '',
      backendRole: target.backendRole ?? 'STAFF',
    };
    this.showEditStaffPwd.set(false);
    this.activeModal.set('editStaff');
  }

  cancelEditStaff(): void {
    this.activeModal.set(null);
    this.editStaffId.set(null);
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.editStaffId.set(null);
    this.newStaffResult.set(null);
    this.addStaffError.set(null);
  }

  get editStaffIsMA(): boolean {
    const id = this.editStaffId();
    if (id === null) return false;
    return (
      this.accounts().find((a) => a.id === id)?.backendRole === 'MANAGER_AGENT'
    );
  }

  saveEditStaff(): void {
    const id = this.editStaffId();
    if (id === null) return;
    const { name, password, backendRole } = this.editStaffDraft;
    if (!name.trim()) {
      this.showToast('⚠️ 姓名為必填');
      return;
    }
    if (password.trim()) {
      this.apiService
        .changeStaffPassword(id)
        .subscribe({
          next: () => this.showToast('✅ 密碼已重設為預設值'),
          error: () => this.showToast('⚠️ 密碼修改失敗'),
        });
    }
    const current = this.accounts().find((a) => a.id === id);
    const roleChanged =
      (current?.backendRole === 'STAFF' && backendRole === 'MANAGER_AGENT') ||
      (current?.backendRole === 'MANAGER_AGENT' && backendRole === 'STAFF');
    if (roleChanged) {
      const isPromote = backendRole === 'MANAGER_AGENT';
      this.apiService.toggleStaff(id).subscribe({
        next: () => {
          this.showToast(
            isPromote
              ? `✅ 帳號「${name.trim()}」已晉升為副店長`
              : `✅ 帳號「${name.trim()}」已降級為員工`,
          );
          this.loadStaff();
        },
        error: () =>
          this.showToast(
            isPromote
              ? '⚠️ 晉升失敗，請確認後端連線'
              : '⚠️ 降級失敗，請確認後端連線',
          ),
      });
    } else {
      this.accounts.update((list) =>
        list.map((a) => (a.id === id ? { ...a, name: name.trim() } : a)),
      );
      this.showToast('✅ 已更新');
    }
    this.activeModal.set(null);
    this.editStaffId.set(null);
  }

  openAddStaffModal(): void {
    this.newStaff = { name: '', role: 'STAFF' };
    this.addStaffError.set(null);
    this.newStaffResult.set(null);
    this.activeModal.set('addStaff');
  }

  closeAddStaffModal(): void {
    this.activeModal.set(null);
  }

  submitAddStaff(): void {
    const { name, role } = this.newStaff;
    if (!name.trim()) {
      this.addStaffError.set('姓名為必填');
      return;
    }
    this.addStaffLoading.set(true);
    this.addStaffError.set(null);
    const req: RegisterStaffReq = {
      name: name.trim(),
      role,
      globalAreaId: this.branchId,
    };
    this.apiService.createStaff(req).subscribe({
      next: (res) => {
        this.addStaffLoading.set(false);
        const created = res?.staffList?.[0];
        if (created?.account) {
          this.newStaffResult.set({
            name: created.name,
            account: created.account,
          });
        } else {
          this.activeModal.set(null);
          this.showToast(`✅ 帳號「${name.trim()}」已新增`);
        }
        this.loadStaff();
      },
      error: () => {
        this.addStaffLoading.set(false);
        this.addStaffError.set('新增失敗，請確認後端連線');
      },
    });
  }

  confirmNewStaff(): void {
    this.newStaffResult.set(null);
    this.activeModal.set(null);
  }

  /* ── 活動 ────────────────────────────────────────── */
  private loadPromos(): void {
    this.apiService.getPromotionsList().subscribe({
      next: (res) => {
        if (res?.data?.length) {
          const colors = [
            '#c49756',
            '#4f8ef7',
            '#c084fc',
            '#10b981',
            '#f87171',
            '#f59e0b',
          ];
          this.promos.set(
            res.data.map((p: PromotionDetailVo, i: number) => ({
              id: p.id,
              title: p.name,
              scope: '全部分店',
              isActive: p.active,
              color: colors[i % colors.length],
              ended: p.endTime ? new Date(p.endTime) < new Date() : false,
              type: (p.gifts?.length ? 'promotion' : 'announcement') as
                | 'promotion'
                | 'announcement',
              description: p.description ?? '',
              image: `${this.apiService.getPromotionImageUrl(p.id)}?v=${p.id}`,
              badgeColor: colors[i % colors.length],
              minAmount: p.gifts?.[0]?.fullAmount ?? undefined,
              gifts: p.gifts ?? [],
              rawStartTime: p.startTime ?? '',
              rawEndTime: p.endTime ?? '',
            })),
          );
        }
      },
      error: () => this.showToast('⚠️ 活動資料載入失敗'),
    });
  }

  openPromoDetail(promo: DashPromo): void {
    this.selectedPromo.set(promo);
  }

  closePromoDetail(): void {
    this.selectedPromo.set(null);
  }

  togglePromo(id: number): void {
    const promo = this.promos().find((p) => p.id === id);
    if (!promo || promo.ended) return;
    const newActive = !promo.isActive;
    this.promos.update((list) =>
      list.map((p) => (p.id === id ? { ...p, isActive: newActive } : p)),
    );
    this.apiService
      .togglePromotion({
        name: promo.title,
        startTime: promo.rawStartTime,
        endTime: promo.rawEndTime,
        promotionsId: id,
        active: newActive,
      })
      .subscribe({
        next: () =>
          this.showToast(newActive ? '✅ 活動已啟用' : '⏸️ 活動已暫停'),
        error: () => {
          this.promos.update((list) =>
            list.map((p) => (p.id === id ? { ...p, isActive: !newActive } : p)),
          );
          this.showToast('⚠️ 操作失敗，請確認後端連線');
        },
      });
  }

  /* ── 財務報表 ─────────────────────────────────────── */
  queryFinance(): void {
    const start = this.financeStart();
    const end = this.financeEnd();
    if (!start || !end) {
      this.showToast('⚠️ 請選擇月份區間');
      return;
    }
    if (start > end) {
      this.showToast('⚠️ 起始月份不能晚於結束月份');
      return;
    }
    this.financeLoading.set(true);
    this.financeMonthlyData.set([]);
    this.apiService
      .getMonthlyReportByRange({ startMonth: start, endMonth: end })
      .subscribe({
        next: (res) => {
          this.financeMonthlyData.set(res?.reportList ?? []);
          this.financeLoading.set(false);
          if (!res?.reportList?.length) this.showToast('ℹ️ 此區間無報表資料');
        },
        error: () => {
          this.financeLoading.set(false);
          this.showToast('⚠️ 報表查詢失敗');
        },
      });
  }

  /* ── 商品月銷售報表 ────────────────────────────────── */
  queryRmSales(): void {
    const year = this.salesYear();
    const month = this.salesMonth();
    this.salesLoading.set(true);
    this.salesData.set([]);
    this.apiService.getRmMonthlySales(year, month).subscribe({
      next: (res) => {
        this.salesData.set(res?.salesList ?? []);
        this.salesLoading.set(false);
        if (!res?.salesList?.length) this.showToast('ℹ️ 此月份無銷售資料');
      },
      error: () => {
        this.salesLoading.set(false);
        this.showToast('⚠️ 銷售報表查詢失敗');
      },
    });
  }

  abbreviateNum(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'K';
    return String(Math.round(n));
  }

  formatChartMonth(m: string): string {
    const parts = m.split('-');
    return parts.length >= 2 ? parts[1] + '月' : m;
  }

  /* ── 工具 ────────────────────────────────────────── */
  setTab(tab: RmTab): void {
    this.activeTab.set(tab);
  }

  setUserSubTab(sub: RmUserSubTab): void {
    this.userSubTab.set(sub);
  }

  get topbarTitle(): string {
    return this.TAB_TITLES[this.activeTab()];
  }

  getAvatarLetter(): string {
    return this.authService.currentUser?.name?.charAt(0) ?? '?';
  }

  goToPos(): void {
    this.router.navigate(['/pos-terminal']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/staff-login']);
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

  showToast(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.toastLeaveTimer) clearTimeout(this.toastLeaveTimer);
    this.toastLeaving.set(false);
    this.toastMsg.set(msg);
    this.toastTimer = setTimeout(() => {
      this.toastLeaving.set(true);
      this.toastLeaveTimer = setTimeout(() => this.toastMsg.set(''), 400);
    }, 3000);
  }
}

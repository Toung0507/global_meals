import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../shared/auth.service';
import {
  ApiService,
  InventoryDetailVo,
  PromotionDetailVo,
  GiftDetailVo,
  StaffVO,
  RegisterStaffReq,
  RevenueData,
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
    inventory:   '庫存管理',
    users:       '員工管理',
    promotions:  '活動一覽',
    finance:     '財務報表',
  };

  /* ── 分店資訊 ─────────────────────────────────────── */
  branchId = 0;
  branchName = signal<string>('');

  /* ── 庫存 ────────────────────────────────────────── */
  inventory = signal<DashInventory[]>([]);
  inventorySearch = signal('');
  adjustingInventoryId = signal<number | null>(null);
  adjustInventoryAmt = signal<number>(0);
  adjustInventorySavedId = signal<number | null>(null);

  filteredInventory = computed(() => {
    const q = this.inventorySearch().toLowerCase().trim();
    if (!q) return this.inventory();
    return this.inventory().filter(i => i.name.toLowerCase().includes(q));
  });

  /* ── 員工 ────────────────────────────────────────── */
  accounts = signal<DashAccount[]>([]);

  bmAccounts = computed(() => this.accounts().filter(a => a.role === 'bm'));
  staffAccounts = computed(() => this.accounts().filter(a => a.role === 'staff'));

  /* ── 新增員工 modal ───────────────────────────────── */
  showAddStaffModal = signal(false);
  newStaff = { name: '', role: 'STAFF' };
  addStaffError = signal<string | null>(null);
  addStaffLoading = signal(false);

  /* ── 編輯員工 modal ───────────────────────────────── */
  showEditStaffModal = signal(false);
  editStaffId = signal<number | null>(null);
  editStaffDraft: { name: string; password: string; backendRole: string } = {
    name: '', password: '', backendRole: 'STAFF',
  };
  showEditStaffPwd = signal(false);

  /* ── 活動 ────────────────────────────────────────── */
  promos = signal<DashPromo[]>([]);
  selectedPromo = signal<DashPromo | null>(null);

  /* ── 財務報表 ─────────────────────────────────────── */
  financeStart = signal('');
  financeEnd = signal('');
  financeLoading = signal(false);
  financeData = signal<RevenueData[]>([]);
  financeTotal = computed(() =>
    this.financeData().reduce((s, d) => s + Number(d.totalAmount), 0),
  );

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
    if (!user || user.role !== 'branch_manager') {
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
      next: res => {
        const found = res?.globalAreaList?.find(b => b.id === this.branchId);
        if (found) this.branchName.set(found.branch);
      },
      error: () => {},
    });
  }

  /* ── 庫存 ────────────────────────────────────────── */
  private loadInventory(): void {
    if (!this.branchId) return;
    this.apiService.getBranchInventory(this.branchId).subscribe({
      next: res => {
        if (res?.data?.length) {
          this.inventory.set(
            res.data.map((inv: InventoryDetailVo) => ({
              id: inv.productId,
              productId: inv.productId,
              globalAreaId: inv.globalAreaId,
              name: inv.productName,
              branch: inv.branchName,
              category: inv.category ?? '',
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

  startAdjustInventory(id: number, currentStock: number): void {
    this.adjustingInventoryId.set(id);
    this.adjustInventoryAmt.set(currentStock);
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
    const item = this.inventory().find(i => i.id === id);
    this.inventory.update(list =>
      list.map(i => (i.id === id ? { ...i, stock: amt } : i)),
    );
    this.adjustingInventoryId.set(null);
    this.adjustInventorySavedId.set(id);
    setTimeout(() => this.adjustInventorySavedId.set(null), 1800);
    if (item) {
      this.apiService.updateBranchInventory({
        productId: item.productId,
        globalAreaId: item.globalAreaId,
        stockQuantity: amt,
        basePrice: item.basePrice,
        costPrice: item.costPrice,
        maxOrderQuantity: item.maxOrderQuantity,
        active: item.active,
      }).subscribe({
        next: () => this.loadInventory(),
        error: () => this.showToast('⚠️ 庫存更新失敗'),
      });
    }
  }

  toggleInventoryActive(id: number): void {
    const item = this.inventory().find(i => i.id === id);
    if (!item) return;
    const newActive = !item.active;
    this.inventory.update(list =>
      list.map(i => i.id === id ? { ...i, active: newActive } : i),
    );
    this.apiService.updateBranchInventory({
      productId: item.productId,
      globalAreaId: item.globalAreaId,
      stockQuantity: item.stock,
      basePrice: item.basePrice,
      costPrice: item.costPrice,
      maxOrderQuantity: item.maxOrderQuantity,
      active: newActive,
    }).subscribe({
      next: () => this.showToast(newActive ? '✅ 已上架' : '⏸️ 已下架'),
      error: () => {
        this.inventory.update(list =>
          list.map(i => i.id === id ? { ...i, active: !newActive } : i),
        );
        this.showToast('⚠️ 操作失敗，請確認後端連線');
      },
    });
  }

  /* ── 員工 ────────────────────────────────────────── */
  private loadStaff(): void {
    this.apiService.getAllStaff().subscribe({
      next: res => {
        if (res?.staffList?.length) {
          this.accounts.set(
            res.staffList
              .filter((s: StaffVO) =>
                s.role !== 'ADMIN' && s.globalAreaId === this.branchId,
              )
              .map((s: StaffVO) => ({
                id: s.id,
                name: s.name,
                account: s.account,
                branch: this.branchName(),
                joinedAt: s.hireAt?.slice(0, 10) ?? '',
                isActive: s.status ?? true,
                role: (s.role === 'REGION_MANAGER' || s.role === 'MANAGER_AGENT') ? 'bm' : 'staff' as 'bm' | 'staff',
                backendRole: s.role,
              })),
          );
        }
      },
      error: () => this.showToast('⚠️ 員工資料載入失敗'),
    });
  }

  toggleAccount(id: number): void {
    const target = this.accounts().find(a => a.id === id);
    if (!target) return;
    const newStatus = !target.isActive;
    this.accounts.update(list =>
      list.map(a => (a.id === id ? { ...a, isActive: newStatus } : a)),
    );
    this.apiService.updateStaffStatus(id, { newStatus }).subscribe({
      next: () =>
        this.showToast(
          newStatus ? `✅ 帳號「${target.name}」已復權` : `🔒 帳號「${target.name}」已停權`,
        ),
      error: () => {
        this.accounts.update(list =>
          list.map(a => (a.id === id ? { ...a, isActive: !newStatus } : a)),
        );
        this.showToast('⚠️ 更新失敗，請確認後端連線');
      },
    });
  }

  promoteAccount(id: number): void {
    const target = this.accounts().find(a => a.id === id);
    if (!target) return;
    this.apiService.promoteStaff(id).subscribe({
      next: () => {
        this.showToast(`✅ 帳號「${target.name}」已晉升為副店長`);
        this.loadStaff();
      },
      error: () => this.showToast('⚠️ 晉升失敗，請確認後端連線'),
    });
  }

  demoteAccount(id: number): void {
    const target = this.accounts().find(a => a.id === id);
    if (!target) return;
    this.apiService.promoteStaff(id).subscribe({
      next: () => {
        this.showToast(`✅ 帳號「${target.name}」已降級為員工`);
        this.loadStaff();
      },
      error: () => this.showToast('⚠️ 降級失敗，請確認後端連線'),
    });
  }

  openEditStaff(id: number): void {
    const target = this.accounts().find(a => a.id === id);
    if (!target) return;
    this.editStaffId.set(id);
    this.editStaffDraft = {
      name: target.name,
      password: '',
      backendRole: target.backendRole ?? 'STAFF',
    };
    this.showEditStaffPwd.set(false);
    this.showEditStaffModal.set(true);
  }

  cancelEditStaff(): void {
    this.showEditStaffModal.set(false);
    this.editStaffId.set(null);
  }

  get editStaffIsMA(): boolean {
    const id = this.editStaffId();
    if (id === null) return false;
    return this.accounts().find(a => a.id === id)?.backendRole === 'MANAGER_AGENT';
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
      this.apiService.changeStaffPassword(id, { newPassword: password.trim() }).subscribe({
        next: () => this.showToast('✅ 密碼已更新'),
        error: () => this.showToast('⚠️ 密碼修改失敗'),
      });
    }
    const current = this.accounts().find(a => a.id === id);
    if (current?.backendRole === 'STAFF' && backendRole === 'MANAGER_AGENT') {
      this.apiService.promoteStaff(id).subscribe({
        next: () => {
          this.showToast(`✅ 帳號「${name.trim()}」已晉升為副店長`);
          this.loadStaff();
        },
        error: () => this.showToast('⚠️ 晉升失敗，請確認後端連線'),
      });
    } else {
      this.accounts.update(list =>
        list.map(a => (a.id === id ? { ...a, name: name.trim() } : a)),
      );
      this.showToast('✅ 已更新');
    }
    this.showEditStaffModal.set(false);
    this.editStaffId.set(null);
  }

  openAddStaffModal(): void {
    this.newStaff = { name: '', role: 'STAFF' };
    this.addStaffError.set(null);
    this.showAddStaffModal.set(true);
  }

  closeAddStaffModal(): void {
    this.showAddStaffModal.set(false);
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
      next: () => {
        this.addStaffLoading.set(false);
        this.closeAddStaffModal();
        this.showToast(`✅ 帳號「${name.trim()}」已新增`);
        this.loadStaff();
      },
      error: () => {
        this.addStaffLoading.set(false);
        this.addStaffError.set('新增失敗，請確認後端連線');
      },
    });
  }

  /* ── 活動 ────────────────────────────────────────── */
  private loadPromos(): void {
    this.apiService.getPromotionsList().subscribe({
      next: res => {
        if (res?.data?.length) {
          const colors = ['#c49756', '#4f8ef7', '#c084fc', '#10b981', '#f87171', '#f59e0b'];
          this.promos.set(
            res.data.map((p: PromotionDetailVo, i: number) => ({
              id: p.id,
              title: p.name,
              scope: '全部分店',
              isActive: p.active,
              color: colors[i % colors.length],
              ended: p.endTime ? new Date(p.endTime) < new Date() : false,
              type: (p.gifts?.length ? 'promotion' : 'announcement') as 'promotion' | 'announcement',
              description: p.description ?? '',
              image: p.promotionImg
                ? (p.promotionImg.startsWith('data:') ? p.promotionImg : `data:image/jpeg;base64,${p.promotionImg}`)
                : '',
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
    const promo = this.promos().find(p => p.id === id);
    if (!promo || promo.ended) return;
    const newActive = !promo.isActive;
    this.promos.update(list =>
      list.map(p => (p.id === id ? { ...p, isActive: newActive } : p)),
    );
    this.apiService.togglePromotion({
      name: promo.title,
      startTime: promo.rawStartTime,
      endTime: promo.rawEndTime,
      promotionsId: id,
      active: newActive,
    }).subscribe({
      next: () => this.showToast(newActive ? '✅ 活動已啟用' : '⏸️ 活動已暫停'),
      error: () => {
        this.promos.update(list =>
          list.map(p => (p.id === id ? { ...p, isActive: !newActive } : p)),
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
      this.showToast('⚠️ 請選擇日期區間');
      return;
    }
    if (start > end) {
      this.showToast('⚠️ 開始日期不能晚於結束日期');
      return;
    }
    this.financeLoading.set(true);
    this.financeData.set([]);
    this.apiService.getRevenueReports({
      startDate: start,
      endDate: end,
      branchId: this.branchId,
    }).subscribe({
      next: res => {
        this.financeData.set(res?.revenueData ?? []);
        this.financeLoading.set(false);
        if (!res?.revenueData?.length) this.showToast('ℹ️ 此區間無報表資料');
      },
      error: () => {
        this.financeLoading.set(false);
        this.showToast('⚠️ 報表查詢失敗');
      },
    });
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
    this.clockStr.set(`${yy}-${mm}-${dd} 星期${days[now.getDay()]} ${hh}:${min}`);
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

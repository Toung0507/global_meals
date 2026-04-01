/*
 * =====================================================
 * 檔案名稱：manager-dashboard.component.ts
 * 位置說明：src/app/manager-dashboard/manager-dashboard.component.ts
 * 用途說明：老闆（boss）後台管理主控台
 * 功能說明：
 *   - 側邊欄 8 個頁籤切換（綜合總覽 / 訂單 / 商品 / 活動 / 庫存 / 帳號 / 稅率 / 財報）
 *   - 帳號管理子頁籤切換（分店長 / 員工）
 *   - 登入保護：非 boss 角色自動導回 staff-login
 *   - 即時時鐘顯示
 * =====================================================
 */

import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../shared/auth.service';

/* 側邊欄頁籤型別 */
export type DashTab = 'dashboard' | 'orders' | 'products' | 'promotions' | 'inventory' | 'users' | 'tax' | 'finance';

/* 帳號管理子頁籤型別 */
export type UserSubTab = 'bm' | 'staff';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss']
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {

  /* 目前選中的側邊欄頁籤，預設顯示綜合總覽 */
  activeTab = signal<DashTab>('dashboard');

  /* 帳號管理子頁籤，預設顯示分店長 */
  userSubTab = signal<UserSubTab>('bm');

  /* 即時時鐘 */
  clockStr = signal('');

  /* 頁籤標題對應表 */
  readonly TAB_TITLES: Record<DashTab, string> = {
    dashboard:  '📊 綜合總覽',
    orders:     '📋 訂單管理',
    products:   '🛍️ 商品管理',
    promotions: '🎯 活動管理',
    inventory:  '📦 庫存管理',
    users:      '👥 帳號管理',
    tax:        '🌍 稅率設定',
    finance:    '💰 財務報表'
  };

  /* 計時器 ID，用於 ngOnDestroy 清除 */
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    /* 登入保護：只允許 boss 進入此頁 */
    const user = this.authService.currentUser;
    if (!user || user.role !== 'boss') {
      this.router.navigate(['/staff-login']);
      return;
    }

    /* 啟動即時時鐘（每秒更新） */
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    /* 離開頁面時清除計時器，避免記憶體洩漏 */
    if (this.clockInterval !== null) {
      clearInterval(this.clockInterval);
    }
  }

  /* 更新時鐘顯示字串 */
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

  /* 切換側邊欄頁籤 */
  setTab(tab: DashTab): void {
    this.activeTab.set(tab);
  }

  /* 取得頂部標題文字 */
  get topbarTitle(): string {
    return this.TAB_TITLES[this.activeTab()];
  }

  /* 切換帳號管理子頁籤 */
  setUserSubTab(sub: UserSubTab): void {
    this.userSubTab.set(sub);
  }

  /* 取得目前登入使用者的頭像首字 */
  getAvatarLetter(): string {
    return this.authService.currentUser?.name?.charAt(0) ?? '?';
  }

  /* 登出並回到管理系統登入頁 */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/staff-login']);
  }

}

/*
 * =====================================================
 * 檔案名稱：staff-login.component.ts
 * 用途說明：管理系統登入頁面的 Angular 元件邏輯
 * 功能說明：
 *   - 控制「系統經理」與「現場收銀員」兩個角色分頁的切換
 *   - 控制密碼欄位的顯示 / 隱藏狀態
 *   - 表單欄位雙向綁定（email / password）
 *   - 呼叫 AuthService.staffLogin() 驗證帳號密碼
 *   - 登入成功後依角色導向對應後台頁面：
 *       boss           → /manager-dashboard
 *       branch_manager → /pos-terminal
 *       staff          → /pos-terminal
 *   - 點擊「客戶入口」時顯示 Loading 動畫再切換頁面
 * =====================================================
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LoadingService } from '../../shared/loading.service';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './staff-login.component.html',
  styleUrls: ['./staff-login.component.scss']
})
export class StaffLoginComponent {

  /* 目前選中的角色分頁：預設為 'M'（系統經理） */
  activeRole: string = 'M';

  /* 密碼是否明文顯示 */
  showPassword: boolean = false;

  /* 表單欄位 */
  email: string = '';
  password: string = '';

  /* 錯誤訊息（null = 無錯誤，不顯示） */
  errorMsg: string | null = null;

  constructor(
    private router: Router,
    private loadingService: LoadingService,
    public authService: AuthService
  ) {}

  /* 切換角色分頁 */
  setRole(role: string): void {
    this.activeRole = role;
    this.errorMsg = null;
  }

  /* 切換密碼顯示 / 隱藏 */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /*
   * 管理人員登入
   * 1. 呼叫 AuthService.staffLogin() 驗證帳號
   * 2. 登入成功 → 依 role 導向不同後台頁面
   * 3. 登入失敗 → 顯示錯誤訊息
   */
  submitLogin(): void {
    this.errorMsg = null;

    if (!this.email.trim() || !this.password.trim()) {
      this.errorMsg = '請輸入帳號與密碼';
      return;
    }

    const user = this.authService.staffLogin(this.email.trim(), this.password.trim());

    if (!user) {
      this.errorMsg = '帳號或密碼錯誤，請確認後重試';
      return;
    }

    /*
     * 驗證所選分頁與帳號角色是否相符
     * - 系統經理分頁（'M'）僅允許 boss 角色登入
     * - 現場收銀員分頁（'S'）僅允許 branch_manager / staff 角色登入
     */
    if (this.activeRole === 'M' && user.role !== 'boss') {
      this.errorMsg = '此帳號非系統經理，請切換至「現場收銀員」分頁';
      return;
    }

    if (this.activeRole === 'S' && user.role === 'boss') {
      this.errorMsg = '此帳號非現場收銀員，請切換至「系統經理」分頁';
      return;
    }

    /* 依角色導向對應頁面 */
    if (user.role === 'boss') {
      this.router.navigate(['/manager-dashboard']);
    } else {
      /* branch_manager / staff 都進 POS 終端機 */
      this.router.navigate(['/pos-terminal']);
    }
  }

  /*
   * 切換到客戶入口（含 Loading 動畫）
   * 顯示橘紅色 Loading 遮罩 → 等 1500ms → 導覽至 /customer-login
   */
  goToCustomer(): void {
    this.loadingService.showCustomerLoading();
    setTimeout(() => {
      this.router.navigate(['/customer-login']).then(() => {
        this.loadingService.hide();
      });
    }, 1500);
  }

}

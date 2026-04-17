/*
 * =====================================================
 * 檔案名稱：staff-login.component.ts
 * 用途說明：管理系統登入頁面的 Angular 元件邏輯
 * 功能說明：
 *   - 控制密碼欄位的顯示 / 隱藏狀態
 *   - 表單欄位雙向綁定（email / password）
 *   - 呼叫 AuthService.staffLogin() 驗證帳號密碼
 *   - 登入成功後依帳號 role 自動導向對應後台頁面：
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

  /*
   * 管理人員登入
   * 1. 呼叫 AuthService.staffLogin() 驗證帳號
   * 2. 登入成功 → 依帳號 role 自動導向對應後台頁面
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

    /* 依帳號 role 顯示對應 Loading 動畫，再導向對應頁面 */
    if (user.role === 'boss') {
      this.loadingService.showStaffLoading();
      setTimeout(() => {
        this.router.navigate(['/manager-dashboard']).then(() => {
          this.loadingService.hide();
        });
      }, 1400);
    } else {
      /* branch_manager / deputy_manager / staff 都進 POS 終端機 */
      this.loadingService.showPosLoading();
      setTimeout(() => {
        this.router.navigate(['/pos-terminal']).then(() => {
          this.loadingService.hide();
        });
      }, 1400);
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

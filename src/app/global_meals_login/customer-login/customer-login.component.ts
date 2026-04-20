/*
 * =====================================================
 * 檔案名稱：customer-login.component.ts
 * 用途說明：客戶登入頁面的 Angular 元件
 * 功能說明：
 *   - 控制密碼欄位的顯示 / 隱藏狀態
 *   - 執行客戶帳號登入驗證（暫時使用假資料）
 *   - 登入成功後導向至會員中心（/customer-member）
 *   - 顯示登入失敗的錯誤訊息
 *   - 點擊「管理系統」時顯示 Loading 動畫再切換頁面
 * Angular 知識點：
 *   - FormsModule  提供 [(ngModel)] 雙向資料綁定
 *   - RouterLink   仍保留給「前往註冊」與「訪客點餐」按鈕用
 *   - Router       用於含 Loading 的頁面切換
 *   - AuthService  帳號驗證服務
 *   - LoadingService  Loading 動畫狀態服務
 * =====================================================
 */

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../../shared/auth.service';
import { LoadingService } from '../../shared/loading.service';
import { BranchService, CountryCode, CountryConfig } from '../../shared/branch.service';

@Component({
  selector: 'app-customer-login',
  standalone: true,
  imports: [
    FormsModule,    /* 讓 [(ngModel)] 可以運作 */
    RouterLink      /* 保留給「前往註冊」與「訪客點餐」按鈕 */
  ],
  templateUrl: './customer-login.component.html',
  styleUrls: ['./customer-login.component.scss']
})
export class CustomerLoginComponent implements OnInit {

  /*
   * 密碼是否可見：預設為 false（隱藏）
   * 對應 HTML：[type]="showPassword ? 'text' : 'password'"
   */
  showPassword: boolean = false;

  /* 帳號輸入框的值，對應 HTML 的 [(ngModel)]="account" */
  account: string = '';

  /* 密碼輸入框的值，對應 HTML 的 [(ngModel)]="password" */
  password: string = '';

  /* 是否顯示登入失敗的錯誤訊息 */
  loginError: boolean = false;

  /*
   * constructor 建構函式
   * 注入需要的服務：
   *   router         → 頁面導覽
   *   authService    → 帳號驗證
   *   loadingService → Loading 動畫
   */
  get allCountries(): CountryConfig[] { return this.branchService.allCountries; }
  get activeCountry(): CountryCode { return this.branchService.country; }

  constructor(
    private router: Router,
    private authService: AuthService,
    private loadingService: LoadingService,
    private branchService: BranchService
  ) {}

  ngOnInit(): void {
    this.branchService.init();
  }

  selectCountry(code: CountryCode): void {
    this.branchService.setCountry(code);
  }

  /*
   * 切換密碼顯示 / 隱藏狀態
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /*
   * 執行登入驗證
   * 呼叫 AuthService.login() 驗證帳號密碼
   * 成功 → 播放 Loading 動畫 → 導向 /customer-member
   * 失敗 → 顯示錯誤訊息
   */
  onLogin(): void {

    /* 清除舊的錯誤訊息 */
    this.loginError = false;

    /* 呼叫 AuthService 驗證，回傳 true = 成功 */
    const success = this.authService.login(
      this.account.trim(),
      this.password
    );

    if (success) {

      /* 登入成功：顯示客戶端 Loading，再導向客戶主頁（含 5 個頁籤） */
      this.loadingService.showCustomerLoading();

      setTimeout(() => {
        this.router.navigate(['/customer-home']).then(() => {
          this.loadingService.hide();
        });
      }, 6200);

    } else {

      /* 登入失敗：顯示錯誤訊息 */
      this.loginError = true;

    }

  }

  /*
   * 切換到管理系統（含 Loading 動畫）
   */
  goToStaff(): void {
    this.loadingService.showStaffLoading();
    setTimeout(() => {
      this.router.navigate(['/staff-login']).then(() => {
        this.loadingService.hide();
      });
    }, 1500); /* 藍色旋轉圈：短暫過場即可，無進度條 */
  }

}

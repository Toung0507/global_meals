/*
 * =====================================================
 * 檔案名稱：customer-guest.component.ts
 * 用途說明：訪客快速點餐頁面 — 輸入手機號碼後直接進入菜單
 * =====================================================
 */
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { LoadingService } from '../../shared/loading.service';
import { BranchService } from '../../shared/branch.service';
import { ApiService } from '../../shared/api.service';

@Component({
  selector: 'app-customer-guest',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './customer-guest.component.html',
  styleUrls: ['./customer-guest.component.scss']
})
export class CustomerGuestComponent implements OnInit {

  /** 手機號碼欄位 */
  phone: string = '';

  /** 是否顯示格式錯誤 */
  phoneError: boolean = false;

  /** 目前語系翻譯字典（響應式 signal，自動隨國家切換更新） */
  get lang() { return this.branchService.lang(); }

  constructor(
    private router: Router,
    private authService: AuthService,
    private loadingService: LoadingService,
    public branchService: BranchService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.branchService.init();
  }

  /**
   * 進入點餐 — 驗證手機號碼格式後登入為訪客，導向主頁
   */
  enterMenu(): void {
    const cleaned = this.phone.replace(/\D/g, '');
    if (cleaned.length < 8) {
      this.phoneError = true;
      return;
    }
    this.phoneError = false;

    const proceed = () => {
      this.authService.loginAsGuest(this.phone.trim());
      this.loadingService.showCustomerLoading();
      setTimeout(() => {
        this.router.navigate(['/customer-home']).then(() => this.loadingService.hide());
      }, 6200);
    };

    this.apiService.registerGuest({
      name: '訪客',
      phone: this.phone.trim(),
      country: this.branchService.country
    }).subscribe({ next: proceed, error: proceed });
  }

  /** 清除錯誤狀態 */
  clearError(): void {
    this.phoneError = false;
  }
}

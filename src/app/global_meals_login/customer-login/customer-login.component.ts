import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';

import { AuthService } from '../../shared/auth.service';
import { LoadingService } from '../../shared/loading.service';
import { BranchService, CountryCode, CountryConfig } from '../../shared/branch.service';

@Component({
  selector: 'app-customer-login',
  standalone: true,
  imports: [FormsModule, RouterLink, QRCodeComponent],
  templateUrl: './customer-login.component.html',
  styleUrls: ['./customer-login.component.scss']
})
export class CustomerLoginComponent implements OnInit {

  showPassword = false;
  account = '';
  password = '';
  loginError = false;
  loginErrorMsg = '帳號或密碼錯誤，請再試一次';

  get allCountries(): CountryConfig[] { return this.branchService.allCountries; }
  get activeCountry(): CountryCode    { return this.branchService.country; }

  /** 給 HTML template 直接讀取 branchService.lang() */
  get lang() { return this.branchService.lang(); }

  /** QR Code URL：現場掃碼直接進訪客點餐 */
  get qrUrl(): string {
    return (typeof window !== 'undefined' ? window.location.origin : '') + '/customer-guest';
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private loadingService: LoadingService,
    public branchService: BranchService
  ) {}

  ngOnInit(): void {
    this.branchService.init();
  }

  selectCountry(code: CountryCode): void {
    this.branchService.setCountry(code);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    this.loginError = false;
    if (!this.account.trim()) {
      this.loginErrorMsg = '請輸入手機號碼或電子郵件';
      this.loginError = true;
      return;
    }
this.authService.loginMember(this.account.trim(), this.password).subscribe({
      next: (res) => {
        if (res.code === 200) {
          this.loadingService.showCustomerLoading();
          setTimeout(() => {
            this.router.navigate(['/customer-home']).then(() => this.loadingService.hide());
          }, 6200);
        } else {
          this.loginError = true;
        }
      },
      error: () => {
        this.loginError = true;
      }
    });
  }

  goToStaff(): void {
    this.loadingService.showStaffLoading();
    setTimeout(() => {
      this.router.navigate(['/staff-login']).then(() => this.loadingService.hide());
    }, 1500);
  }
}

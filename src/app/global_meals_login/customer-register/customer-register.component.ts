/*
 * =====================================================
 * 檔案名稱：customer-register.component.ts
 * 用途說明：客戶註冊頁面的 Angular Component 邏輯
 * =====================================================
 */
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BranchService } from '../../shared/branch.service';

@Component({
  selector: 'app-customer-register',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './customer-register.component.html',
  styleUrls: ['./customer-register.component.scss']
})
export class CustomerRegisterComponent implements OnInit {

  name: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  nameError: boolean = false;
  phoneError: boolean = false;
  phoneErrorMsg: string = '請輸入有效的手機號碼';
  passwordError: boolean = false;
  confirmError: boolean = false;

  constructor(private branchService: BranchService) {}

  ngOnInit(): void {
    this.branchService.init();
  }

  get dialCode(): string {
    return this.branchService.config.dialCode;
  }

  get dialLabel(): string {
    return `${this.branchService.config.nameLocal} ${this.branchService.config.dialCode}`;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  clearError(field: 'name' | 'phone' | 'password' | 'confirm'): void {
    if (field === 'name') this.nameError = false;
    if (field === 'phone') this.phoneError = false;
    if (field === 'password') this.passwordError = false;
    if (field === 'confirm') this.confirmError = false;
  }

  onRegister(): void {
    this.nameError = false;
    this.phoneError = false;
    this.passwordError = false;
    this.confirmError = false;

    let valid = true;

    if (!this.name.trim()) {
      this.nameError = true;
      valid = false;
    }

    const cleaned = this.phone.replace(/\D/g, '');
    if (cleaned.length < 6) {
      this.phoneError = true;
      this.phoneErrorMsg = '請輸入有效的電話號碼（至少 6 位數）';
      valid = false;
    }

    if (this.password.length < 6) {
      this.passwordError = true;
      valid = false;
    }

    if (this.password !== this.confirmPassword) {
      this.confirmError = true;
      valid = false;
    }

    if (!valid) return;

    /* TODO: 呼叫 ApiService.register() 傳送至後端 */
    const fullPhone = `${this.dialCode}${this.phone.trim()}`;
    console.log('[Register] 提交:', { name: this.name.trim(), phone: fullPhone, country: this.branchService.country });
  }
}

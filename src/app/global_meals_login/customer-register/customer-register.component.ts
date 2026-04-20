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

  name = '';
  phone = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;

  nameError = false;
  phoneError = false;
  phoneErrorMsg = '';
  passwordError = false;
  confirmError = false;

  constructor(public branchService: BranchService) {}

  ngOnInit(): void {
    this.branchService.init();
  }

  get lang() { return this.branchService.lang(); }
  get dialCode(): string { return this.branchService.config.dialCode; }
  get dialLabel(): string {
    return `${this.branchService.config.nameLocal} ${this.branchService.config.dialCode}`;
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  clearError(field: 'name' | 'phone' | 'password' | 'confirm'): void {
    if (field === 'name')     this.nameError = false;
    if (field === 'phone')    this.phoneError = false;
    if (field === 'password') this.passwordError = false;
    if (field === 'confirm')  this.confirmError = false;
  }

  onRegister(): void {
    this.nameError = false;
    this.phoneError = false;
    this.passwordError = false;
    this.confirmError = false;
    let valid = true;

    if (!this.name.trim()) { this.nameError = true; valid = false; }

    const cleaned = this.phone.replace(/\D/g, '');
    if (cleaned.length < 6) {
      this.phoneError = true;
      this.phoneErrorMsg = this.lang.phonePlaceholder;
      valid = false;
    }

    if (this.password.length < 6) { this.passwordError = true; valid = false; }
    if (this.password !== this.confirmPassword) { this.confirmError = true; valid = false; }

    if (!valid) return;

    const fullPhone = `${this.dialCode}${this.phone.trim()}`;
    console.log('[Register]', { name: this.name.trim(), phone: fullPhone, country: this.branchService.country });
  }
}

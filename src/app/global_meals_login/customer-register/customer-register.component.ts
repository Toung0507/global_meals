/*
 * =====================================================
 * 檔案名稱：customer-register.component.ts
 * 用途說明：客戶註冊頁面的 Angular Component 邏輯
 * 必填欄位：會員名稱（name）、手機號碼（phone）、密碼（password）
 *           對應資料庫 members 資料表
 * =====================================================
 */
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-customer-register',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './customer-register.component.html',
  styleUrls: ['./customer-register.component.scss']
})
export class CustomerRegisterComponent {

  /* ── 密碼顯示 / 隱藏狀態 ── */
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  /* 切換密碼欄位的顯示狀態 */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /* 切換確認密碼欄位的顯示狀態 */
  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

}

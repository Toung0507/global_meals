/*
 * =====================================================
 * 檔案名稱：customer-login.component.ts
 * 用途說明：客戶登入頁面的 Angular 元件
 * 功能說明：
 *   - 此頁面目前為純展示頁面，不含複雜邏輯
 *   - 頁面包含：會員登入、前往註冊、訪客快速點餐 三個入口
 * Angular 知識點：
 *   - standalone: true 表示這是獨立元件，不需要 NgModule
 *   - imports 陣列用來引入此元件需要用到的其他 Angular 功能
 *   - RouterLink 讓 HTML 裡的 [routerLink] 指令可以運作（頁面導覽用）
 *   - templateUrl 指向 HTML 檔案的相對路徑
 *   - styleUrls 陣列指向 SCSS 樣式檔的相對路徑（可以有多個）
 * =====================================================
 */

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-login',   /* HTML 標籤名稱：<app-customer-login> */
  standalone: true,                  /* 宣告這是獨立元件（Angular 14+ 特性） */
  imports: [RouterLink],             /* 使用 RouterLink 指令來做頁面導覽 */
  templateUrl: './customer-login.component.html',
  styleUrls: ['./customer-login.component.scss']
})
export class CustomerLoginComponent {

  /*
   * 密碼是否可見：預設為 false（隱藏）
   * 對應 HTML：[type]="showPassword ? 'text' : 'password'"
   */
  showPassword: boolean = false;

  /*
   * 切換密碼顯示 / 隱藏狀態
   * true  → input type="text"（明文顯示）
   * false → input type="password"（遮罩顯示）
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

}

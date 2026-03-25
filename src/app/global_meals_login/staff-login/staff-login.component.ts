/*
 * =====================================================
 * 檔案名稱：staff-login.component.ts
 * 用途說明：管理系統登入頁面的 Angular 元件邏輯
 * 功能說明：
 *   - 控制「系統經理」與「現場收銀員」兩個角色分頁的切換
 *   - 控制密碼欄位的顯示 / 隱藏狀態
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
  selector: 'app-staff-login',      /* HTML 標籤名稱：<app-staff-login> */
  standalone: true,                  /* 宣告這是獨立元件（Angular 14+ 特性） */
  imports: [RouterLink],             /* 使用 RouterLink 指令來做頁面導覽 */
  templateUrl: './staff-login.component.html',
  styleUrls: ['./staff-login.component.scss']
})
export class StaffLoginComponent {

  /* 目前選中的角色：預設為 'M'（系統經理） */
  activeRole: string = 'M';

  /*
   * 密碼是否可見：預設為 false（隱藏）
   * 對應 HTML：[type]="showPassword ? 'text' : 'password'"
   * 切換時呼叫 togglePassword()
   */
  showPassword: boolean = false;

  /*
   * 切換角色分頁
   * 參數 role：傳入 'M'（系統經理）或 'S'（現場收銀員）
   */
  setRole(role: string): void {
    this.activeRole = role;
  }

  /*
   * 切換密碼顯示 / 隱藏狀態
   * true  → input type="text"（明文顯示）
   * false → input type="password"（遮罩顯示）
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

}

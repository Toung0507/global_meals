/*
 * =====================================================
 * 檔案名稱：staff-login.component.ts
 * 用途說明：管理系統登入頁面的 Angular 元件邏輯
 * 功能說明：
 *   - 控制「系統經理」與「現場收銀員」兩個角色分頁的切換
 *   - 控制密碼欄位的顯示 / 隱藏狀態
 *   - 點擊「客戶入口」時顯示 Loading 動畫再切換頁面
 * Angular 知識點：
 *   - standalone: true 表示這是獨立元件，不需要 NgModule
 *   - templateUrl 指向 HTML 檔案的相對路徑
 *   - styleUrls 陣列指向 SCSS 樣式檔的相對路徑
 *   - Router  Angular 內建的導覽服務，用 navigate() 切換頁面
 *             比 [routerLink] 更適合在切換前先執行 Loading 動畫
 *   - LoadingService  我們自己建立的服務，控制全域 Loading 遮罩
 * =====================================================
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';

/* 我們自己建立的 Loading 服務，路徑從此檔案相對計算 */
import { LoadingService } from '../../shared/loading.service';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [],                /* 頁面導覽改用 Router，不再需要 RouterLink */
  templateUrl: './staff-login.component.html',
  styleUrls: ['./staff-login.component.scss']
})
export class StaffLoginComponent {

  /* 目前選中的角色：預設為 'M'（系統經理） */
  activeRole: string = 'M';

  /*
   * 密碼是否可見：預設為 false（隱藏）
   * 對應 HTML：[type]="showPassword ? 'text' : 'password'"
   */
  showPassword: boolean = false;

  /*
   * constructor 建構函式
   * Angular 依賴注入（DI）自動傳入以下兩個物件：
   *   router        → Angular 路由器，用來切換頁面（navigate）
   *   loadingService → 我們的 Loading 狀態服務
   * private 表示只在此元件內使用
   */
  constructor(
    private router: Router,
    private loadingService: LoadingService
  ) {}

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

  /*
   * 切換到客戶入口（含 Loading 動畫）
   * 執行流程：
   *   步驟 1：呼叫 loadingService 顯示橘紅色客戶端 Loading 遮罩
   *   步驟 2：等待 1500ms，讓使用者看到完整的 Loading 動畫
   *   步驟 3：呼叫 router.navigate() 切換到 /customer-login 頁面
   *   步驟 4：navigate() 完成後（.then()）隱藏 Loading 遮罩
   *
   * 為什麼用 setTimeout？
   *   Angular 的路由切換非常快（幾乎瞬間）
   *   如果不等待，Loading 動畫還沒播完就消失了
   *   1500ms 讓 GSAP 動畫有足夠時間展示
   */
  goToCustomer(): void {

    /* 步驟 1：顯示客戶端橘紅色 Loading */
    this.loadingService.showCustomerLoading();

    /* 步驟 2 + 3：等待 1500ms 後才導覽 */
    setTimeout(() => {

      /* 步驟 3：切換到客戶登入頁 */
      this.router.navigate(['/customer-login']).then(() => {

        /* 步驟 4：頁面切換完成，隱藏 Loading */
        this.loadingService.hide();

      });

    }, 1500);

  }

}

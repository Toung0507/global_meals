/*
 * =====================================================
 * 檔案名稱：loading.service.ts
 * 位置說明：src/app/shared/loading.service.ts
 * 用途說明：管理全域 Loading 動畫狀態的服務
 * 功能說明：
 *   - 記錄目前是否正在顯示 Loading 遮罩（isLoading）
 *   - 記錄 Loading 的類型（管理端藍色 or 客戶端橘色）
 * Angular 知識點：
 *   - @Injectable({ providedIn: 'root' })
 *     表示這是全域單例服務（Singleton）
 *     整個應用只會建立一個實例，所有元件拿到的都是同一份資料
 *     → 所以 staff-login 修改了 isLoading，app.component 馬上就看得到
 * =====================================================
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'   /* 全域服務：不需要在任何 NgModule 或元件裡手動提供 */
})
export class LoadingService {

  /* 是否顯示 Loading 遮罩，預設 false（隱藏） */
  isLoading: boolean = false;

  /*
   * Loading 的風格類型
   *   'staff'    → 深海軍藍風格（管理系統）
   *   'customer' → 橘紅暖色風格（客戶入口）
   */
  loadingType: string = 'staff';

  /*
   * 顯示管理端 Loading（深海軍藍 + 金黃色圓環）
   * 呼叫時機：使用者點擊「切換到管理系統」的導覽連結
   */
  showStaffLoading(): void {
    this.loadingType = 'staff';
    this.isLoading = true;
  }

  /*
   * 顯示客戶端 Loading（奶油白底 + 橘紅彈跳動畫）
   * 呼叫時機：使用者點擊「切換到客戶入口」的導覽連結
   */
  showCustomerLoading(): void {
    this.loadingType = 'customer';
    this.isLoading = true;
  }

  /*
   * 隱藏 Loading 遮罩
   * 呼叫時機：Router.navigate() 完成後（頁面已成功切換）
   */
  hide(): void {
    this.isLoading = false;
  }

}

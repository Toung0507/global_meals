/*
 * =====================================================
 * 檔案名稱：customer-member.component.ts
 * 位置說明：src/app/customer-member/customer-member.component.ts
 * 用途說明：客戶會員中心頁面的邏輯
 * 功能說明：
 *   - 顯示會員基本資料（名稱、手機、電子郵件、密碼）
 *   - 切換「檢視模式」與「編輯模式」
 *   - 左右（桌機）/ 上下（手機）雙欄版面：同時顯示基本資料與訂單紀錄
 *   - 登入驗證守衛（未登入者自動跳回登入頁）
 *   - 登出功能
 * Angular 知識點：
 *   - OnInit  生命週期鉤子，元件初始化時執行 ngOnInit()
 *             用來做登入狀態檢查（保護此頁面）
 *   - Router  切換頁面（導覽到登入頁或管理系統）
 *   - AuthService  取得目前登入的使用者資料
 *   - LoadingService  切換到管理系統時顯示 Loading
 * =====================================================
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../shared/auth.service';
import { LoadingService } from '../shared/loading.service';

/* MockOrder 型別，供 TypeScript 標注 orders 陣列用 */
import { MockOrder } from '../shared/auth.service';

@Component({
  selector: 'app-customer-member',
  standalone: true,
  imports: [FormsModule],    /* FormsModule 提供 [(ngModel)] 雙向綁定（編輯表單用） */
  templateUrl: './customer-member.component.html',
  styleUrls: ['./customer-member.component.scss']
})
export class CustomerMemberComponent implements OnInit {

  /* ── 編輯模式狀態 ─────────────────────────────────
     isEditing = false → 顯示資料（檢視模式）
     isEditing = true  → 顯示輸入框（編輯模式）
  ────────────────────────────────────────────────── */
  isEditing: boolean = false;

  /* 編輯中的暫存值（不影響原始資料，直到按下儲存） */
  editName: string = '';
  editPhone: string = '';
  editPassword: string = '';    /* 留空代表不修改密碼 */

  /* 儲存成功提示訊息（顯示 2 秒後自動消失） */
  saveSuccess: boolean = false;

  /* 訂單紀錄陣列 */
  orders: MockOrder[] = [];

  /*
   * constructor 建構函式
   * 注入需要用到的服務：
   *   router         → 頁面導覽（保護守衛、登出跳轉）
   *   authService    → 讀取/更新目前登入的使用者資料（public：HTML 模板也能讀取）
   *   loadingService → 切換到管理系統時的 Loading 動畫
   */
  constructor(
    private router: Router,
    public authService: AuthService,
    private loadingService: LoadingService
  ) {}


  /*
   * ngOnInit：元件初始化時自動執行
   * ① 登入保護：沒有登入的人直接踢回登入頁
   * ② 載入訂單資料
   */
  ngOnInit(): void {

    /* ① 登入保護 */
    if (!this.authService.currentUser) {
      this.router.navigate(['/customer-login']);
      return;
    }

    /* ② 載入假訂單資料 */
    this.orders = this.authService.getOrders();
  }


  /* ── 進入編輯模式 ─────────────────────────────────
     將目前的使用者資料複製到暫存欄位，再開啟編輯模式
     這樣使用者取消時，原始資料不會被破壞
  ────────────────────────────────────────────────── */
  startEdit(): void {
    if (this.authService.currentUser) {
      this.editName     = this.authService.currentUser.name;
      this.editPhone    = this.authService.currentUser.phone;
      this.editPassword = '';   /* 密碼欄預設留空（不修改） */
    }
    this.isEditing = true;
  }


  /* ── 取消編輯 ─────────────────────────────────────
     清空暫存欄位，回到檢視模式
  ────────────────────────────────────────────────── */
  cancelEdit(): void {
    this.editName     = '';
    this.editPhone    = '';
    this.editPassword = '';
    this.isEditing    = false;
  }


  /* ── 儲存編輯 ─────────────────────────────────────
     呼叫 authService 更新資料，顯示成功提示後回到檢視模式
  ────────────────────────────────────────────────── */
  saveEdit(): void {

    /* 名稱不能為空 */
    if (this.editName.trim().length === 0) {
      return;
    }

    this.authService.updateProfile(
      this.editName.trim(),
      this.editPhone.trim(),
      this.editPassword
    );

    /* 回到檢視模式 */
    this.isEditing = false;

    /* 顯示「儲存成功」提示，2000ms 後自動隱藏 */
    this.saveSuccess = true;
    setTimeout(() => {
      this.saveSuccess = false;
    }, 2000);
  }


  /* ── 登出 ─────────────────────────────────────────
     清除登入狀態後跳回客戶登入頁
  ────────────────────────────────────────────────── */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/customer-login']);
  }


  /* ── 切換到管理系統（含 Loading）─────────────────
     與 customer-login 相同的流程：先 Loading，再導覽
  ────────────────────────────────────────────────── */
  goToStaff(): void {
    this.loadingService.showStaffLoading();
    setTimeout(() => {
      this.router.navigate(['/staff-login']).then(() => {
        this.loadingService.hide();
      });
    }, 1500);
  }


  /* ── 取得頭像顯示文字 ─────────────────────────────
     取名稱第一個字當作頭像縮寫（例：「懶飽飽測試會員」→「懶」）
  ────────────────────────────────────────────────── */
  getAvatarLetter(): string {
    if (this.authService.currentUser && this.authService.currentUser.name.length > 0) {
      return this.authService.currentUser.name.charAt(0);
    }
    return '?';
  }

}

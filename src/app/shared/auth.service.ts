/*
 * =====================================================
 * 檔案名稱：auth.service.ts
 * 位置說明：src/app/shared/auth.service.ts
 * 用途說明：暫時性的假帳號驗證服務（前端 Mock 版本）
 *
 * ⚠ 重要說明：
 *   此服務的所有帳號資料都是假的（hardcoded），
 *   等未來串接 MySQL 後端後，請將 login()、getOrders()、updateProfile()
 *   全部替換成 HttpClient 的 API 呼叫，帳號陣列也要全部移除。
 *
 * 未來帳號角色規劃（預留欄位 role）：
 *   'boss'           → 老闆 / 總經理（最高權限）
 *   'branch_manager' → 分店長（可能多國，需綁定 branchId）
 *   'staff'          → 員工（可能多國，需綁定 branchId）
 *   'customer'       → 一般會員 / 訪客
 *
 * TypeScript 知識點：
 *   interface → 型別介面，定義物件的屬性結構（不會被編譯成 JS，純型別檢查用）
 *   export    → 讓其他檔案可以 import 這個型別定義
 * =====================================================
 */

import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService, LoginMembersReq, LoginStaffReq, MembersRes, StaffSearchRes } from './api.service';


/* ── 使用者帳號的資料結構定義 ──────────────────────────
   ? 問號表示「可選屬性」，這個屬性可以不存在
──────────────────────────────────────────────────── */
export interface MockUser {
  id: number;
  role: string;       /* 身分類型：'customer' | 'staff' | 'branch_manager' | 'deputy_manager' | 'boss' | 'guest' */
  name: string;       /* 顯示名稱 */
  phone: string;      /* 手機號碼 */
  email: string;      /* 電子郵件 */
  password: string;   /* ⚠ 暫時明文，未來串接後端需改為 hash 驗證 */
  isGuest?: boolean;  /* 是否為訪客（無需帳號，只需手機號碼） */
}


/* ── 訂單資料的型別定義 ───────────────────────────── */
export interface MockOrder {
  id: string;        /* 訂單編號 */
  date: string;      /* 下單日期（YYYY-MM-DD 格式） */
  items: string;     /* 訂單品項描述文字 */
  total: number;     /* 訂單總金額（台幣） */
  status: string;    /* 訂單狀態：'已完成' | '備餐中' | '已取消' */
}


/* ─────────────────────────────────────────────────────
   ⚠ 暫時測試帳號資料（未來串接後端時全部移除）
   目前測試帳號：
     電子郵件：test@lazybao.com
     手機號碼：0912-345-678
     密碼：    test1234
─────────────────────────────────────────────────────── */
const MOCK_USERS: MockUser[] = [
  {
    id: 1,
    role: 'customer',
    name: '懶飽飽測試會員',
    phone: '0912-345-678',
    email: 'test@lazybao.com',
    password: 'test1234'
    /*
     * ── Demo 信用卡資料（付款頁面流程演示用，非真實卡號）──
     *   卡號：4532 1234 5678 9012
     *   到期日：12/28
     *   CVV：123
     *   持卡人：LAI PAO PAO（懶飽飽）
     *   發卡行：懶飽飽虛擬銀行（Demo Only）
     *
     *   ⚠ 以上均為假資料，未來串接真實金流時請移除此區塊
     *      並改用後端加密傳輸（如 TLS + tokenization）
     * ────────────────────────────────────────────────────── */
  },
  /*
   * ── 管理系統測試帳號（未來串接後端後全部移除）──
   *   老闆：   admin@lazybao.com   / admin1234
   *   分店長： manager@lazybao.com / mgr1234
   *   副店長： deputy@lazybao.com  / deputy1234
   *   員工：   staff@lazybao.com  / staff1234
   */
  {
    id: 2,
    role: 'boss',
    name: '林老闆',
    phone: '0900-000-001',
    email: 'admin@lazybao.com',
    password: 'admin1234'
  },
  {
    id: 3,
    role: 'branch_manager',
    name: '陳分店長',
    phone: '0900-000-002',
    email: 'manager@lazybao.com',
    password: 'mgr1234'
  },
  {
    id: 5,
    role: 'deputy_manager',
    name: '李副店長',
    phone: '0900-000-004',
    email: 'deputy@lazybao.com',
    password: 'deputy1234'
  },
  {
    id: 4,
    role: 'staff',
    name: '王小明',
    phone: '0900-000-003',
    email: 'staff@lazybao.com',
    password: 'staff1234'
  }
];


/* ── 暫時假訂單資料 ──────────────────────────────── */
const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'LBB-20240315-001',
    date: '2024-03-15',
    items: '紅燒牛肉麵 × 1、滷蛋 × 2',
    total: 185,
    status: '已完成'
  },
  {
    id: 'LBB-20240320-002',
    date: '2024-03-20',
    items: '三杯雞飯 × 1、味噌湯 × 1',
    total: 150,
    status: '已完成'
  },
  {
    id: 'LBB-20240325-003',
    date: '2024-03-25',
    items: '叉燒拉麵 × 2',
    total: 260,
    status: '備餐中'
  },
  {
    id: 'LBB-20240401-004',
    date: '2024-04-01',
    items: '咖哩雞飯 × 1、珍珠奶茶 × 2、小菜 × 1',
    total: 320,
    status: '已完成'
  },
  {
    id: 'LBB-20240408-005',
    date: '2024-04-08',
    items: '麻辣燙 × 1、白飯 × 1',
    total: 175,
    status: '已完成'
  },
  {
    id: 'LBB-20240412-006',
    date: '2024-04-12',
    items: '鐵板燒套餐 × 2、冬瓜茶 × 2',
    total: 480,
    status: '已取消'
  },
  {
    id: 'LBB-20240418-007',
    date: '2024-04-18',
    items: '越南河粉 × 1、春捲 × 3',
    total: 210,
    status: '已完成'
  },
  {
    id: 'LBB-20240425-008',
    date: '2024-04-25',
    items: '印度咖哩飯 × 2、饢餅 × 1、優格飲 × 2',
    total: 395,
    status: '已完成'
  }
];


/* ── 員工資料結構（串接後端後使用）──────────────────── */
export interface StaffUser {
  id: number;
  role: string;   /* ADMIN / REGION_MANAGER / MANAGER_AGENT / STAFF */
  name: string;
  account: string;
  globalAreaId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /* 目前登入中的員工（後端 Session 驗證後儲存）*/
  currentStaff: StaffUser | null = (() => {
    try {
      const saved = sessionStorage.getItem('currentStaff');
      return saved ? JSON.parse(saved) as StaffUser : null;
    } catch { return null; }
  })();

  /*
   * 目前登入中的使用者
   * null  = 尚未登入（未驗證狀態）
   * MockUser = 已成功登入的使用者物件
   *
   * 初始化時從 sessionStorage 還原登入狀態，
   * 讓使用者重新整理頁面後不需要重新登入。
   * sessionStorage 會在瀏覽器分頁關閉後自動清除。
   *
   * ⚠ TODO [API串接點]：串接後端後改為驗證 JWT token，
   *   不再使用 sessionStorage 儲存使用者物件
   */
  /* 目前登入中的客戶（MockUser 保留向後相容，真實登入資料存 currentMember）*/
  currentMember: MembersRes | null = (() => {
    try {
      const saved = sessionStorage.getItem('currentMember');
      return saved ? JSON.parse(saved) as MembersRes : null;
    } catch { return null; }
  })();

  currentUser: MockUser | null = (() => {
    try {
      const saved = sessionStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) as MockUser : null;
    } catch {
      return null;
    }
  })();


  constructor(private apiService: ApiService) {}

  /* ── 會員登入（真實後端版本）───────────────────────
   * 呼叫後端 POST members/login，由後端 Session 管理狀態
   * 回傳 Observable<MembersRes>，讓元件訂閱並處理結果
   * ────────────────────────────────────────────────── */
  loginMember(phone: string, password: string): Observable<MembersRes> {
    const req: LoginMembersReq = { phone, password };
    return this.apiService.memberLogin(req).pipe(
      tap(res => {
        if (res.code === 200) {
          this.currentMember = res;
          sessionStorage.setItem('currentMember', JSON.stringify(res));
          // 同步更新 currentUser 以維持向後相容（舊元件讀 currentUser）
          if (res.memberId) {
            this.currentUser = {
              id: res.memberId,
              role: 'customer',
              name: res.name ?? '',
              phone: res.phone ?? phone,
              email: '',
              password: ''
            };
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          }
        }
      })
    );
  }

  /* ── 員工登入（真實後端版本）───────────────────────
   * 呼叫後端 POST api/auth/login，由後端 Session 管理狀態
   * 回傳 Observable<StaffSearchRes>，讓元件訂閱並處理結果
   * ────────────────────────────────────────────────── */
  loginStaffApi(account: string, password: string): Observable<StaffSearchRes> {
    const req: LoginStaffReq = { account, password };
    return this.apiService.staffLogin(req).pipe(
      tap(res => {
        if (res.code === 200 && res.staffList && res.staffList.length > 0) {
          const staff = res.staffList[0];
          const staffUser: StaffUser = {
            id: staff.id,
            role: staff.role,
            name: staff.name,
            account: staff.account,
            globalAreaId: staff.globalAreaId
          };
          this.currentStaff = staffUser;
          sessionStorage.setItem('currentStaff', JSON.stringify(staffUser));
          // 同步更新 currentUser 讓舊元件讀到
          this.currentUser = {
            id: staff.id,
            role: this.mapStaffRole(staff.role),
            name: staff.name,
            phone: '',
            email: staff.account,
            password: ''
          };
          sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
      })
    );
  }

  /* 將後端 role 字串轉換為前端舊版 role 字串（向後相容）*/
  private mapStaffRole(backendRole: string): string {
    const map: Record<string, string> = {
      'ADMIN': 'boss',
      'REGION_MANAGER': 'branch_manager',
      'MANAGER_AGENT': 'deputy_manager',
      'STAFF': 'staff'
    };
    return map[backendRole] ?? 'staff';
  }

  /* ── 登入驗證（Mock 版本，保留向後相容）──────────────
   * ⚠ 此方法保留給尚未完成後端串接的頁面使用
   * ────────────────────────────────────────────────── */
  login(account: string, password: string): boolean {
    const found = MOCK_USERS.find(function(user) {
      return (user.email === account || user.phone === account)
          && user.password === password;
    });

    if (found) {
      this.currentUser = found;
      sessionStorage.setItem('currentUser', JSON.stringify(found));
      return true;
    }

    return false;
  }


  /* ── 登出（清除所有 Session 狀態）─────────────────
   * 同時呼叫後端 logout，清除 Server-side Session
   * ─────────────────────────────────────────────────*/
  logout(): void {
    // 清除前端 Session 狀態
    this.currentUser = null;
    this.currentMember = null;
    this.currentStaff = null;
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentMember');
    sessionStorage.removeItem('currentStaff');
    // 同步通知後端清除 Server-side Session（不等待回傳，fire-and-forget）
    this.apiService.staffLogout().subscribe({ error: () => {} });
  }


  /* ── 管理人員登入（Mock 版本，保留向後相容）────────────
   * ⚠ 此方法保留給 staff-login 元件過渡期使用
   *   已新增 loginStaffApi() 方法供正式串接後端使用
   * ─────────────────────────────────────────────────*/
  staffLogin(email: string, password: string): MockUser | null {
    const found = MOCK_USERS.find(function(user) {
      return user.email === email
          && user.password === password
          && (user.role === 'boss' || user.role === 'branch_manager' || user.role === 'deputy_manager' || user.role === 'staff');
    });

    if (found) {
      this.currentUser = found;
      sessionStorage.setItem('currentUser', JSON.stringify(found));
      return found;
    }

    return null;
  }


  /*
   * ── 訪客登入（暫時版本）────────────────────────────
   * 不需要帳號密碼，只需手機號碼，以訪客身份進入點餐
   * 未來替換：可在後端建立暫時 session 紀錄訪客行為
   * ─────────────────────────────────────────────────*/
  loginAsGuest(phone: string): void {
    const guest: MockUser = {
      id: 0,
      role: 'guest',
      name: '訪客',
      phone: phone,
      email: '',
      password: '',
      isGuest: true
    };
    this.currentUser = guest;
    sessionStorage.setItem('currentUser', JSON.stringify(guest));
  }


  /*
   * ── 取得訂單紀錄（暫時版本）──────────────────────
   * 未來替換：
   *   this.http.get<Order[]>(`/api/orders?userId=${this.currentUser?.id}`)
   * ────────────────────────────────────────────────── */
  getOrders(): MockOrder[] {
    return MOCK_ORDERS;
  }


  /*
   * ── 更新個人資料（暫時版本）──────────────────────
   * 直接修改記憶體中的假資料（重新整理頁面後會消失）
   * 未來替換：
   *   this.http.put('/api/user/profile', { name, phone })
   * ────────────────────────────────────────────────── */
  updateProfile(name: string, phone: string, newPassword: string): void {
    if (this.currentUser) {
      this.currentUser.name = name;
      this.currentUser.phone = phone;
      /* 只有使用者有輸入新密碼時才更新 */
      if (newPassword.trim().length > 0) {
        this.currentUser.password = newPassword;
      }
      /* sessionStorage 同步更新，確保重新整理後資料不回復 */
      sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
  }

}

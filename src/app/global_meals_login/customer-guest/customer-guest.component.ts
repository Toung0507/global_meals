/*
 * =====================================================
 * 檔案名稱：customer-guest.component.ts
 * 用途說明：訪客快速點餐頁面的 Angular Component 邏輯
 * 功能說明：訪客不需要登入，只需輸入手機號碼即可進入點餐
 * =====================================================
 */
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-customer-guest',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './customer-guest.component.html',
  styleUrls: ['./customer-guest.component.scss']
})
export class CustomerGuestComponent {

}

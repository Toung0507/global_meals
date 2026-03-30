import { Routes } from '@angular/router';
import { StaffLoginComponent } from './global_meals_login/staff-login/staff-login.component';
import { CustomerLoginComponent } from './global_meals_login/customer-login/customer-login.component';
import { CustomerRegisterComponent } from './global_meals_login/customer-register/customer-register.component';
import { CustomerGuestComponent } from './global_meals_login/customer-guest/customer-guest.component';
import { CustomerMemberComponent } from './customer-member/customer-member.component';

export const routes: Routes = [
  { path: 'staff-login',       component: StaffLoginComponent },
  { path: 'customer-login',    component: CustomerLoginComponent },
  { path: 'customer-register', component: CustomerRegisterComponent },
  { path: 'customer-guest',    component: CustomerGuestComponent },
  { path: 'customer-member',   component: CustomerMemberComponent },   /* 會員中心 */
  { path: '',                  redirectTo: 'staff-login', pathMatch: 'full' },
];

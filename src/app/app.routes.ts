import { Routes } from '@angular/router';
import { StaffLoginComponent } from './global_meals_login/staff-login/staff-login.component';
import { CustomerLoginComponent } from './global_meals_login/customer-login/customer-login.component';

export const routes: Routes = [
  { path: 'staff-login',    component: StaffLoginComponent },
  { path: 'customer-login', component: CustomerLoginComponent },
  { path: '',               redirectTo: 'staff-login', pathMatch: 'full' },
];

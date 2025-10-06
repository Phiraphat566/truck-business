// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './layout/main/main.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      { path: 'general',      loadComponent: () => import('./pages/general/general.component').then(m => m.GeneralComponent) },
      { path: 'time-in-out',  loadComponent: () => import('./pages/time-in-out/time-in-out.component').then(m => m.TimeInOutComponent) },
      { path: 'employee',     loadComponent: () => import('./pages/employee/employee.component').then(m => m.EmployeeComponent) },
      { path: 'billing',      loadComponent: () => import('./pages/billing/billing.component').then(m => m.BillingComponent) },
      { path: 'income',       loadComponent: () => import('./pages/income/income.component').then(m => m.IncomeComponent) },
      { path: 'truck-detail', loadComponent: () => import('./pages/truck-detail/truck-detail.component').then(m => m.TruckDetailComponent) },
      { path: 'chat-call',    loadComponent: () => import('./pages/chat-call/chat-call.component').then(m => m.ChatCallComponent) },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

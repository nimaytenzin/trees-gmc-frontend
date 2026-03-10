import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
];

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
  {
    path: 'survey-areas',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./survey-areas/survey-areas.component').then(
        (m) => m.SurveyAreasComponent,
      ),
  },
  {
    path: 'species',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./species-management/species-management.component').then(
        (m) => m.SpeciesManagementComponent,
      ),
  },
  {
    path: 'users',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./user-management/user-management.component').then(
        (m) => m.UserManagementComponent,
      ),
  },
];

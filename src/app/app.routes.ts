import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
   
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'map',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/map-view/map-view.component').then(
            (m) => m.MapViewComponent,
          ),
      },
      {
        path: 'trees',
        loadChildren: () =>
          import('./features/trees/trees.routes').then((m) => m.TREES_ROUTES),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];

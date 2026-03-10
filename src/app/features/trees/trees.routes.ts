import { Routes } from '@angular/router';

export const TREES_ROUTES: Routes = [
  {
    path: 'survey-area-select',
    loadComponent: () =>
      import('./survey-area-select/survey-area-select.component').then(
        (m) => m.SurveyAreaSelectComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./tree-register/tree-register.component').then(
        (m) => m.TreeRegisterComponent,
      ),
  },
  {
    path: 'growth-metric',
    loadComponent: () =>
      import('./growth-metric-form/growth-metric-form.component').then(
        (m) => m.GrowthMetricFormComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./tree-detail/tree-detail.component').then(
        (m) => m.TreeDetailComponent,
      ),
  },
];

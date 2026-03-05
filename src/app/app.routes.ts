import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'public',
    loadComponent: () => import('./pages/public/public').then((m) => m.PublicComponent),
  },

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },

  {
    path: '',
    redirectTo: 'public',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: 'public',
  },
];

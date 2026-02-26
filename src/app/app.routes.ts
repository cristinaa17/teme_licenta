import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'public',
    loadComponent: () => import('./pages/public/public').then((m) => m.PublicComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'public',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

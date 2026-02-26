import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (user && user.email?.endsWith('@ulbsibiu.ro')) {
    return true;
  }

  return router.createUrlTree(['/login']); 
};

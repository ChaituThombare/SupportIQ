import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = route => {
  const router = inject(Router);
  const storedUser = localStorage.getItem('supportiq_user');

  if(!storedUser) {
    return router.createUrlTree(['/auth']);
  }
  
  try{
    const user = JSON.parse(storedUser);
    const role = String(user.role ?? '').toLowerCase();
    const allowedRoles = route.data['roles'] as string[] | undefined;

    if(allowedRoles?.includes(role)){
      return true;
    }

    const homeRoutes: Record<string, string> = {
      customer: '/customer/dashboard',
      agent: '/agent/workspace',
      admin: '/admin/workspace',
    };

    return router.createUrlTree([homeRoutes[role] ?? '/auth']);
  }catch{
    localStorage.removeItem('supportiq_token');
    localStorage.removeItem('supportiq_user');
    return router.createUrlTree(['/auth']);
  }
};

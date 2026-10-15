import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('supportiq_token');
  const user = localStorage.getItem('supportiq_user');

  if(!token || !user) {
    return router.createUrlTree(['/auth']);
  }
  
  try{
    const parsed = JSON.parse(user);
    if(!parsed?.role){
      localStorage.removeItem('supportiq_token');
      localStorage.removeItem('supportiq_user');
      return router.createUrlTree(['/auth']);
    }
    return true;
  }catch{
    localStorage.removeItem('supportiq_token');
    localStorage.removeItem('supportiq_user');
    return router.createUrlTree(['/auth']);
  }

};

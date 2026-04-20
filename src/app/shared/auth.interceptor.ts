import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_CONFIG } from './api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (API_CONFIG.MOCK_MODE) return next(req);

  const auth = inject(AuthService);
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        auth.handleSessionExpired();
      }
      return throwError(() => err);
    })
  );
};

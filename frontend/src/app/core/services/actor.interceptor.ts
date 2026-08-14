import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { IdentityService } from './identity.service';

export const actorInterceptor: HttpInterceptorFn = (req, next) => {
  const name = inject(IdentityService).name().trim();
  if (!name) return next(req);
  return next(req.clone({ setHeaders: { 'X-Actor-Name': encodeURIComponent(name) } }));
};

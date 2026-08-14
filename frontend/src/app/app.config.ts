import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { catchError, firstValueFrom, of, tap } from 'rxjs';

import { routes } from './app.routes';
import { RuntimeConfigService } from './core/services/runtime-config.service';
import { actorInterceptor } from './core/services/actor.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([actorInterceptor])),
    provideAnimationsAsync(),
    provideAppInitializer(() => {
      const http = inject(HttpClient);
      const config = inject(RuntimeConfigService);
      return firstValueFrom(
        http.get<{ apiUrl?: string }>('/config.json').pipe(
          tap((runtime) => config.set(runtime)),
          catchError(() => {
            config.set({ apiUrl: '/api' });
            return of(null);
          })
        )
      );
    }),
  ],
};

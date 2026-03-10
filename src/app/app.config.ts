import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

const GmcPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e6f3ef',
      100: '#c0e1d7',
      200: '#97cebd',
      300: '#6dbba3',
      400: '#3fa88a',
      500: '#00563E',
      600: '#004e38',
      700: '#004430',
      800: '#003b28',
      900: '#003222',
      950: '#001d14',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: GmcPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
        },
      },
    }),
  ],
};

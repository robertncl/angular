import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Signals drive every update, so zone.js isn't needed (and isn't loaded).
    provideZonelessChangeDetection(),
    // Binds the ?city= query parameter to HazeDashboardComponent's `city` input.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch())
  ]
};

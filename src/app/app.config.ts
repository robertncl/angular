import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Signals drive every update, so zone.js isn't needed (and isn't loaded).
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch())
  ]
};

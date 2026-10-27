import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { I18n } from './i18n/i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Signals drive every update, so zone.js isn't needed (and isn't loaded).
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    // Load the saved or browser language before first render, so non-English
    // readers never see an English flash. English needs no fetch.
    provideAppInitializer(() => inject(I18n).init())
  ]
};

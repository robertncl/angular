import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

import { en, type Messages } from './messages/en';

export type { Messages } from './messages/en';

export type LangCode = 'en' | 'zh' | 'id' | 'ms' | 'th' | 'vi' | 'fil';

export interface Language {
  code: LangCode;
  /** Shown in the picker in its own language, so people can find theirs. */
  nativeName: string;
  /** For <html lang>, which picks fonts and screen-reader voices. */
  htmlLang: string;
  /** For Intl dates and numbers. */
  locale: string;
}

export const LANGUAGES: readonly Language[] = [
  { code: 'en', nativeName: 'English', htmlLang: 'en', locale: 'en-GB' },
  { code: 'zh', nativeName: '简体中文', htmlLang: 'zh-Hans', locale: 'zh-CN' },
  { code: 'id', nativeName: 'Bahasa Indonesia', htmlLang: 'id', locale: 'id-ID' },
  { code: 'ms', nativeName: 'Bahasa Melayu', htmlLang: 'ms', locale: 'ms-MY' },
  { code: 'th', nativeName: 'ไทย', htmlLang: 'th', locale: 'th-TH' },
  { code: 'vi', nativeName: 'Tiếng Việt', htmlLang: 'vi', locale: 'vi-VN' },
  { code: 'fil', nativeName: 'Filipino', htmlLang: 'fil', locale: 'fil-PH' }
];

const BY_CODE = new Map(LANGUAGES.map(l => [l.code, l]));

/** English ships in the main bundle; every other language is its own lazy chunk. */
const LOADERS: Record<Exclude<LangCode, 'en'>, () => Promise<Messages>> = {
  zh: () => import('./messages/zh').then(m => m.zh),
  id: () => import('./messages/id').then(m => m.id),
  ms: () => import('./messages/ms').then(m => m.ms),
  th: () => import('./messages/th').then(m => m.th),
  vi: () => import('./messages/vi').then(m => m.vi),
  fil: () => import('./messages/fil').then(m => m.fil)
};

const STORAGE_KEY = 'hazewatch.lang';

/**
 * Best match for the browser's preferred languages, by primary subtag.
 * `in` and `tl` are the legacy/alternate codes for Indonesian and Tagalog.
 */
export function detectLanguage(preferred: readonly string[]): LangCode {
  const aliases: Record<string, LangCode> = { in: 'id', tl: 'fil' };
  for (const tag of preferred) {
    const primary = tag.toLowerCase().split('-')[0];
    const code = aliases[primary] ?? primary;
    if (BY_CODE.has(code as LangCode)) return code as LangCode;
  }
  return 'en';
}

@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<LangCode>('en');
  private readonly messages = signal<Messages>(en);
  private requestId = 0;

  readonly lang = this.current.asReadonly();
  /** The active strings. Read it in templates as `t().key`; it updates in place on a language change. */
  readonly t = this.messages.asReadonly();
  readonly language = computed(() => BY_CODE.get(this.current()) as Language);
  readonly locale = computed(() => this.language().locale);

  /** Run before first render (an app initializer) so the page never flashes English. */
  init(): Promise<void> {
    return this.use(this.savedLanguage() ?? detectLanguage(this.document.defaultView?.navigator.languages ?? []), false);
  }

  /**
   * Switch language. If a translation can't be fetched (offline web visit),
   * the page stays in the current language rather than failing.
   */
  async use(code: LangCode, remember = true): Promise<void> {
    if (!BY_CODE.has(code)) code = 'en';
    const request = ++this.requestId;
    let messages: Messages;
    try {
      messages = code === 'en' ? en : await LOADERS[code]();
    } catch {
      return;
    }
    // A later choice won while this one was loading.
    if (request !== this.requestId) return;
    this.messages.set(messages);
    this.current.set(code);
    this.document.documentElement.lang = (BY_CODE.get(code) as Language).htmlLang;
    if (remember) {
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // Storage can be blocked; the choice still applies for this visit.
      }
    }
  }

  /** "Central Kalimantan" → "Kalimantan Tengah"; untranslated names stay English. */
  area(name: string): string {
    return this.messages().areas[name] ?? name;
  }

  cityName(id: string, fallback: string): string {
    return this.messages().cityNames[id] ?? fallback;
  }

  private savedLanguage(): LangCode | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && BY_CODE.has(saved as LangCode) ? (saved as LangCode) : null;
    } catch {
      return null;
    }
  }
}

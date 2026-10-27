import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CITIES, CITY_BY_ID } from '../haze/cities';
import { I18n, LANGUAGES, detectLanguage } from './i18n';
import { en, type Messages } from './messages/en';
import { fil } from './messages/fil';
import { id } from './messages/id';
import { ms } from './messages/ms';
import { th } from './messages/th';
import { vi } from './messages/vi';
import { zh } from './messages/zh';

const TRANSLATIONS: Record<string, Messages> = { zh, id, ms, th, vi, fil };

describe('detectLanguage', () => {
  it('matches browser preferences by primary subtag, in order', () => {
    expect(detectLanguage(['zh-SG', 'en'])).toBe('zh');
    expect(detectLanguage(['ms-MY'])).toBe('ms');
    expect(detectLanguage(['fr-FR', 'th-TH'])).toBe('th');
    expect(detectLanguage(['vi'])).toBe('vi');
  });

  it('accepts the legacy codes for Indonesian and Tagalog', () => {
    expect(detectLanguage(['in-ID'])).toBe('id');
    expect(detectLanguage(['tl-PH'])).toBe('fil');
  });

  it('falls back to English', () => {
    expect(detectLanguage(['fr-FR', 'de'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });
});

describe('I18n', () => {
  let i18n: I18n;

  beforeEach(() => {
    localStorage.removeItem('hazewatch.lang');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    i18n = TestBed.inject(I18n);
  });

  afterEach(() => {
    localStorage.removeItem('hazewatch.lang');
    document.documentElement.lang = 'en';
  });

  it('starts in English', () => {
    expect(i18n.lang()).toBe('en');
    expect(i18n.t().refresh).toBe('Refresh');
  });

  it('loads a language, sets <html lang> and remembers the choice', async () => {
    await i18n.use('zh');

    expect(i18n.lang()).toBe('zh');
    expect(i18n.t().refresh).toBe('刷新');
    expect(i18n.locale()).toBe('zh-CN');
    expect(document.documentElement.lang).toBe('zh-Hans');
    expect(localStorage.getItem('hazewatch.lang')).toBe('zh');
  });

  it('prefers a remembered choice over the browser language', async () => {
    localStorage.setItem('hazewatch.lang', 'th');
    await i18n.init();
    expect(i18n.lang()).toBe('th');
  });

  it('keeps the latest choice when two loads overlap', async () => {
    const first = i18n.use('zh');
    const second = i18n.use('vi');
    await Promise.all([first, second]);
    expect(i18n.lang()).toBe('vi');
  });

  it('translates place names with English fallback', async () => {
    await i18n.use('id');
    expect(i18n.area('Central Kalimantan')).toBe('Kalimantan Tengah');
    expect(i18n.area('Riau')).toBe('Riau');
    expect(i18n.cityName('singapore', 'Singapore')).toBe('Singapura');
    expect(i18n.cityName('bangkok', 'Bangkok')).toBe('Bangkok');
  });
});

describe('translations', () => {
  const areas = new Set(CITIES.map(c => c.area).filter(Boolean));

  /** Every string, including function results, as a flat list. */
  function strings(m: Messages): string[] {
    const out: string[] = [];
    const walk = (v: unknown): void => {
      if (typeof v === 'string') out.push(v);
      else if (typeof v === 'function') out.push(String((v as (...a: unknown[]) => unknown)('X', 2, 'worst')));
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(m);
    return out;
  }

  it('offers every language in the picker', () => {
    expect(LANGUAGES.map(l => l.code as string).sort()).toEqual(['en', ...Object.keys(TRANSLATIONS)].sort());
  });

  for (const [code, m] of Object.entries(TRANSLATIONS)) {
    describe(code, () => {
      it('has no empty strings', () => {
        expect(strings(m).filter(s => !s.trim())).toEqual([]);
      });

      it('gives advice for every AQI band', () => {
        for (const cat of Object.keys(en.categories) as (keyof Messages['categories'])[]) {
          expect(m.categories[cat].advice.length).withContext(cat).toBeGreaterThan(10);
        }
      });

      it('only names real cities and areas', () => {
        for (const cityId of Object.keys(m.cityNames)) expect(CITY_BY_ID.has(cityId)).withContext(cityId).toBeTrue();
        for (const area of Object.keys(m.areas)) expect(areas.has(area)).withContext(area).toBeTrue();
      });
    });
  }
});

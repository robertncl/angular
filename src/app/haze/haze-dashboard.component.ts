import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Subject, catchError, finalize, map, of, switchMap } from 'rxjs';

import { AqiChartComponent } from './aqi-chart.component';
import { AirQualityError, AirQualityService, CityOutlook, CityReading, nextHourBoundary } from './air-quality.service';
import {
  AQI_CATEGORIES,
  AqiCategory,
  AqiCategoryId,
  WHO_PM25_24H,
  aqiCategory,
  compassPoint,
  dailySummaries,
  formatAqi,
  formatConcentration,
  hazeLevel,
  safeFormatter
} from './aqi';
import { CITIES, CITY_BY_ID, COUNTRIES, City, CountryCode, DEFAULT_CITY_ID, countryName, placeLabel } from './cities';
import { HazeMapComponent } from './haze-map.component';
import { I18n, LANGUAGES, type LangCode } from '../i18n/i18n';

export type SortOrder = 'worst' | 'best' | 'name';

/** Alert tones by band. Only danger looks different: a red rule and title. */
export type AlertTone = 'success' | 'info' | 'warning' | 'danger';

const ADVICE_TONE: Record<AqiCategoryId, AlertTone> = {
  good: 'success',
  moderate: 'info',
  sensitive: 'warning',
  unhealthy: 'warning',
  'very-unhealthy': 'danger',
  hazardous: 'danger'
};

const CITY_STORAGE_KEY = 'hazewatch.city';

const MINUTE_MS = 60 * 1000;
/** Fetch this long after the hour turns, spread so open tabs don't all hit the API at once. */
const REFRESH_DELAY_MS = { min: MINUTE_MS, spread: 2 * MINUTE_MS };
/** If the API still serves the previous hour, look again after this. */
const LATE_DATA_RETRY_MS = 5 * MINUTE_MS;
const MAX_BACKOFF_MS = 15 * MINUTE_MS;
/** How often to check the schedule. Background tabs are throttled to about this anyway. */
const TICK_MS = 30 * 1000;
/**
 * The page clock (chart "Now", daily "Today") advances on half-hours, which
 * covers every city's local midnight, Myanmar's UTC+6:30 included.
 */
const CLOCK_STEP_MS = 30 * MINUTE_MS;

type OutlookState =
  | { status: 'loading' }
  | { status: 'ready'; outlook: CityOutlook }
  | { status: 'error'; error: AirQualityError };

@Component({
  selector: 'app-haze-dashboard',
  imports: [AqiChartComponent, HazeMapComponent],
  templateUrl: './haze-dashboard.component.html',
  styleUrl: './haze-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HazeDashboardComponent implements OnInit {
  private readonly airQuality = inject(AirQualityService);
  private readonly location = inject(Location);
  private readonly title = inject(Title);
  private readonly i18n = inject(I18n);
  /** Active strings; templates read `t().key`. */
  protected readonly t = this.i18n.t;
  protected readonly lang = this.i18n.lang;
  protected readonly languages = LANGUAGES;
  private readonly destroyRef = inject(DestroyRef);
  private readonly detailPanel = viewChild<ElementRef<HTMLElement>>('detailPanel');
  private readonly topbar = viewChild.required<ElementRef<HTMLElement>>('topbar');

  protected readonly categories = AQI_CATEGORIES;
  protected readonly countries = COUNTRIES.filter(c => CITIES.some(city => city.country === c.code));
  protected readonly whoPm25 = WHO_PM25_24H;
  protected readonly cityCount = CITIES.length;

  protected readonly readings = signal<readonly CityReading[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<AirQualityError | null>(null);
  /** When the last successful fetch finished (the "checked" time). */
  protected readonly updatedAt = signal<number | null>(null);
  /** Page clock, stepped on half-hours so time-dependent views stay current without re-rendering every tick. */
  protected readonly now = signal(Date.now());
  /** The model hour the readings describe, which can lag the fetch time by up to an hour. */
  protected readonly dataTime = computed(() => {
    const times = this.readings().map(r => r.time);
    return times.length ? Math.max(...times) : null;
  });
  protected readonly selectedId = signal(DEFAULT_CITY_ID);
  protected readonly countryFilter = signal<CountryCode | 'all'>('all');
  protected readonly sortOrder = signal<SortOrder>('worst');
  protected readonly outlookState = signal<OutlookState>({ status: 'loading' });
  /** Read out by the page's single polite live region. */
  protected readonly announcement = signal('');

  private readonly byId = computed(() => new Map(this.readings().map(r => [r.city.id, r])));

  protected readonly selectedCity = computed<City>(
    () => CITY_BY_ID.get(this.selectedId()) ?? (CITY_BY_ID.get(DEFAULT_CITY_ID) as City)
  );
  protected readonly selected = computed(() => this.byId().get(this.selectedCity().id) ?? null);
  protected readonly selectedCategory = computed(() => aqiCategory(this.selected()?.usAqi));

  protected readonly visibleReadings = computed(() => {
    const country = this.countryFilter();
    const order = this.sortOrder();
    const rows = this.readings().filter(r => country === 'all' || r.city.country === country);
    const locale = this.i18n.locale();
    const name = (r: CityReading) => this.cityName(r.city);
    return [...rows].sort((a, b) => compareReadings(a, b, order, name, locale));
  });

  /** "39 cities, worst air first" / "13 in Indonesia, A–Z". */
  protected readonly listSummary = computed(() => {
    const country = this.countryFilter();
    const t = this.t();
    return t.listSummary(this.visibleReadings().length, country === 'all' ? null : t.countries[country], this.sortOrder());
  });

  protected readonly overview = computed(() => {
    const rated = this.readings().filter(r => r.usAqi != null);
    const counts = new Map(AQI_CATEGORIES.map(c => [c.id, 0]));
    for (const r of rated) {
      const id = aqiCategory(r.usAqi)!.id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const worst = rated.reduce<CityReading | null>((w, r) => (w == null || r.usAqi! > w.usAqi! ? r : w), null);
    const unhealthy = rated.filter(r => r.usAqi! > 150).length;
    const sensitive = rated.filter(r => r.usAqi! > 100).length;
    const t = this.t();
    let headline: string;
    if (!rated.length) headline = t.headlineNone;
    else if (unhealthy) headline = t.headlineUnhealthy(unhealthy, rated.length);
    else if (sensitive) headline = t.headlineSensitive(sensitive, rated.length);
    else headline = t.headlineClear(rated.length);
    return { headline, worst, worstCategory: aqiCategory(worst?.usAqi), counts };
  });

  protected readonly daily = computed(() => {
    const state = this.outlookState();
    if (state.status !== 'ready') return [];
    return dailySummaries(state.outlook.points, state.outlook.timeZone, this.now(), 4, this.i18n.locale());
  });

  private readonly outlookRequests = new Subject<{ city: City; force: boolean }>();
  private fetching = false;
  /** When the scheduler should fetch next; Infinity until the first fetch settles. */
  private nextRefreshAt = Number.POSITIVE_INFINITY;
  private consecutiveFailures = 0;

  constructor() {
    this.outlookRequests
      .pipe(
        switchMap(({ city, force }) => {
          this.outlookState.set({ status: 'loading' });
          return this.airQuality.getOutlook(city, force).pipe(
            map((outlook): OutlookState => ({ status: 'ready', outlook })),
            catchError((error: AirQualityError) => of<OutlookState>({ status: 'error', error }))
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(state => this.outlookState.set(state));

    // Back/forward to a different ?city= moves the selection.
    const stopListening = this.location.onUrlChange(url => {
      const id = cityFromUrl(url);
      if (id) this.selectedId.set(id);
    });
    this.destroyRef.onDestroy(stopListening);

    effect(() => {
      const city = this.selectedCity();
      untracked(() => this.outlookRequests.next({ city, force: false }));
    });

    effect(() => {
      const r = this.selected();
      const cat = aqiCategory(r?.usAqi);
      const t = this.t();
      this.title.setTitle(
        r && cat ? t.cityPageTitle(this.cityName(r.city), formatAqi(r.usAqi), t.categories[cat.id].label) : t.pageTitle
      );
    });

    this.scheduleRefreshes();
    afterNextRender(() => this.trackTopbarHeight());
  }

  ngOnInit(): void {
    const id = cityFromUrl(this.location.path()) ?? readStoredCity();
    if (id) this.selectedId.set(id);
    this.refresh();
  }

  refresh(): void {
    if (this.fetching) return;
    this.fetching = true;
    this.loading.set(true);
    this.airQuality
      .getCurrent(CITIES)
      .pipe(
        finalize(() => {
          this.fetching = false;
          this.loading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        // Emits once air quality arrives and again when wind fills in.
        next: readings => {
          this.readings.set(readings);
          this.updatedAt.set(Date.now());
          this.loadError.set(null);
          this.loading.set(false);
          this.consecutiveFailures = 0;
          this.nextRefreshAt = planNextRefresh(readings, Date.now());
        },
        // Keep showing the last good snapshot; the banner explains it's stale.
        error: (err: AirQualityError) => {
          this.loadError.set(err);
          this.consecutiveFailures++;
          this.nextRefreshAt = Date.now() + backoff(this.consecutiveFailures);
        }
      });
    if (this.updatedAt() != null) this.outlookRequests.next({ city: this.selectedCity(), force: true });
  }

  protected retryOutlook(): void {
    this.outlookRequests.next({ city: this.selectedCity(), force: true });
  }

  protected select(id: string): void {
    if (!CITY_BY_ID.has(id)) return;
    this.selectedId.set(id);
    try {
      localStorage.setItem(CITY_STORAGE_KEY, id);
    } catch {
      // Storage can be blocked; the URL still carries the selection.
    }
    // Ids are URL-safe slugs. replaceState keeps the history stack flat.
    const [path] = this.location.path().split('?');
    this.location.replaceState(path, `city=${id}`);

    const r = this.byId().get(id);
    const cat = aqiCategory(r?.usAqi);
    const name = this.cityName(CITY_BY_ID.get(id)!);
    const t = this.t();
    this.announcement.set(
      cat ? t.showing(name, formatAqi(r!.usAqi), t.categories[cat.id].label) : t.showingNoData(name)
    );

    this.revealDetail();
  }

  protected setCountry(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.countryFilter.set(value === 'all' || COUNTRIES.some(c => c.code === value) ? (value as CountryCode | 'all') : 'all');
  }

  protected setSort(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortOrder.set(value === 'best' || value === 'name' ? value : 'worst');
  }

  protected setLanguage(event: Event): void {
    void this.i18n.use((event.target as HTMLSelectElement).value as LangCode);
  }

  protected skipToContent(event: Event): void {
    // A plain #fragment would resolve against <base href> and reload the page
    // without the ?city= query, so move focus by hand.
    event.preventDefault();
    document.getElementById('content')?.focus();
  }

  // --- Template helpers ---------------------------------------------------

  protected categoryOf(aqi: number | null | undefined): AqiCategory | null {
    return aqiCategory(aqi);
  }

  protected adviceTone(category: AqiCategory): AlertTone {
    return ADVICE_TONE[category.id];
  }

  protected aqi(value: number | null | undefined): string {
    return formatAqi(value);
  }

  protected concentration(value: number | null | undefined): string {
    return formatConcentration(value, this.i18n.locale());
  }

  protected decimal(value: number | null, digits: number): string {
    if (value == null) return '–';
    return new Intl.NumberFormat(this.i18n.locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  }

  protected cityName(city: City): string {
    return this.i18n.cityName(city.id, city.name);
  }

  protected place(city: City): string {
    return placeLabel(city, this.t());
  }

  protected country(city: City): string {
    return countryName(city.country, this.t());
  }

  protected haze(aod: number | null): string {
    const level = hazeLevel(aod);
    return level ? this.t().hazeLevels[level] : '–';
  }

  protected wind(r: CityReading): string {
    const t = this.t();
    if (r.windSpeed == null || r.windFrom == null) return t.windUnavailable;
    if (r.windSpeed < 1) return t.windCalm;
    return t.windFrom(Math.round(r.windSpeed), t.compass[compassPoint(r.windFrom)]);
  }

  /** A failed load, in the reader's language. */
  protected errorText(error: AirQualityError): string {
    const errors = this.t().errors;
    switch (error.code) {
      case 'offline':
        return errors.offline;
      case 'rate-limited':
        return errors.rateLimited;
      case 'api':
        return errors.api(error.detail ?? '');
      default:
        return errors.unexpected;
    }
  }

  /** The arrow points where the wind is blowing to — where smoke drifts. */
  protected windArrowRotation(r: CityReading): number {
    return ((r.windFrom ?? 0) + 180) % 360;
  }

  protected cityTime(r: CityReading): string {
    return safeFormatter(
      r.timeZone,
      { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' },
      this.i18n.locale()
    ).format(r.time);
  }

  protected localTime(epochMs: number): string {
    return new Intl.DateTimeFormat(this.i18n.locale(), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(epochMs);
  }

  // --- Internals ----------------------------------------------------------

  /**
   * On a phone the detail card sits below the map and above the list, so a
   * selection from either can leave it off-screen. Scroll it into view — but
   * leave focus where it is; the live region announces the change.
   */
  private revealDetail(): void {
    const el = this.detailPanel()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // The sticky top bar covers the top of the viewport, so "in view" starts below it.
    const covered = this.topbar().nativeElement.getBoundingClientRect().bottom;
    if (rect.top >= covered && rect.top < window.innerHeight * 0.5) return;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }

  /**
   * Publish the sticky top bar's real height as --topbar-h on <html>. It wraps
   * on phones, grows with the Android status-bar inset and with text size, so
   * scroll-padding (scrollIntoView, the skip link, focus scrolling) and the
   * sticky detail column read it instead of assuming a fixed height.
   */
  private trackTopbarHeight(): void {
    const bar = this.topbar().nativeElement;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty('--topbar-h', `${bar.offsetHeight}px`));
    observer.observe(bar);
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      root.style.removeProperty('--topbar-h');
    });
  }

  /**
   * Fetch just after each hour turns, when Open-Meteo starts serving the new
   * model hour, rather than on a fixed interval that can trail it by half an
   * hour. Hidden tabs and backgrounded apps catch up as soon as they're
   * visible, and coming back online retries at once.
   */
  private scheduleRefreshes(): void {
    const tick = () => {
      const t = Date.now();
      if (Math.floor(t / CLOCK_STEP_MS) !== Math.floor(this.now() / CLOCK_STEP_MS)) this.now.set(t);
      if (document.visibilityState === 'visible' && t >= this.nextRefreshAt) this.refresh();
    };
    const onOnline = () => {
      // The outage is over: drop the backoff instead of waiting it out.
      this.consecutiveFailures = 0;
      if (this.loadError() != null) this.nextRefreshAt = 0;
      tick();
    };
    const timer = setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('online', onOnline);
    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('online', onOnline);
    });
  }
}

/**
 * Next fetch: shortly after the hour following the newest reading. If that
 * moment has already passed, the API is still serving last hour's data, so
 * look again in a few minutes.
 */
export function planNextRefresh(readings: readonly CityReading[], now: number, random = Math.random): number {
  if (!readings.length) return now + LATE_DATA_RETRY_MS;
  const newest = Math.max(...readings.map(r => r.time));
  const due = nextHourBoundary(newest) + REFRESH_DELAY_MS.min + random() * REFRESH_DELAY_MS.spread;
  return due > now ? due : now + LATE_DATA_RETRY_MS;
}

/** 1, 2, 4, 8 … minutes after consecutive failures, capped at 15. */
export function backoff(failures: number): number {
  return Math.min(MAX_BACKOFF_MS, MINUTE_MS * 2 ** Math.max(0, failures - 1));
}

function compareReadings(
  a: CityReading,
  b: CityReading,
  order: SortOrder,
  name: (r: CityReading) => string,
  locale: string
): number {
  const byName = () => name(a).localeCompare(name(b), locale);
  if (order === 'name') return byName();
  // Cities without a reading always sink to the bottom.
  if (a.usAqi == null || b.usAqi == null) {
    if (a.usAqi == null && b.usAqi == null) return byName();
    return a.usAqi == null ? 1 : -1;
  }
  const diff = order === 'worst' ? b.usAqi - a.usAqi : a.usAqi - b.usAqi;
  return diff || byName();
}

/** The ?city= id in a URL or path, if it names a known city. */
function cityFromUrl(url: string): string | null {
  const query = url.split('#')[0].split('?')[1] ?? '';
  const id = new URLSearchParams(query).get('city');
  return id && CITY_BY_ID.has(id) ? id : null;
}

function readStoredCity(): string | null {
  try {
    const id = localStorage.getItem(CITY_STORAGE_KEY);
    return id && CITY_BY_ID.has(id) ? id : null;
  } catch {
    return null;
  }
}

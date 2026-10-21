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
import { AirQualityService, CityOutlook, CityReading } from './air-quality.service';
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

const SORT_LABEL: Record<SortOrder, string> = {
  worst: 'worst air first',
  best: 'cleanest air first',
  name: 'A–Z'
};

const CITY_STORAGE_KEY = 'hazewatch.city';
/** CAMS publishes hourly; refreshing more often than this gains nothing. */
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

type OutlookState =
  | { status: 'loading' }
  | { status: 'ready'; outlook: CityOutlook }
  | { status: 'error'; message: string };

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly detailPanel = viewChild<ElementRef<HTMLElement>>('detailPanel');
  private readonly topbar = viewChild.required<ElementRef<HTMLElement>>('topbar');

  protected readonly categories = AQI_CATEGORIES;
  protected readonly countries = COUNTRIES.filter(c => CITIES.some(city => city.country === c.code));
  protected readonly whoPm25 = WHO_PM25_24H;
  protected readonly cityCount = CITIES.length;

  protected readonly readings = signal<readonly CityReading[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly updatedAt = signal<number | null>(null);
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
    return [...rows].sort((a, b) => compareReadings(a, b, order));
  });

  /** "39 cities, worst air first" / "13 in Indonesia, A–Z". */
  protected readonly listSummary = computed(() => {
    const n = this.visibleReadings().length;
    const country = this.countryFilter();
    const scope = country === 'all' ? `${n} ${n === 1 ? 'city' : 'cities'}` : `${n} in ${countryName(country)}`;
    return `${scope}, ${SORT_LABEL[this.sortOrder()]}`;
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
    let headline: string;
    if (!rated.length) headline = 'No readings available right now';
    else if (unhealthy) headline = `Unhealthy air in ${unhealthy} of ${rated.length} cities`;
    else if (sensitive) headline = `Unhealthy for sensitive groups in ${sensitive} of ${rated.length} cities`;
    else headline = `Good or moderate air in all ${rated.length} cities`;
    return { headline, worst, worstCategory: aqiCategory(worst?.usAqi), counts };
  });

  protected readonly daily = computed(() => {
    const state = this.outlookState();
    if (state.status !== 'ready') return [];
    return dailySummaries(state.outlook.points, state.outlook.timeZone, Date.now());
  });

  private readonly outlookRequests = new Subject<{ city: City; force: boolean }>();
  private fetching = false;

  constructor() {
    this.outlookRequests
      .pipe(
        switchMap(({ city, force }) => {
          this.outlookState.set({ status: 'loading' });
          return this.airQuality.getOutlook(city, force).pipe(
            map((outlook): OutlookState => ({ status: 'ready', outlook })),
            catchError((err: Error) => of<OutlookState>({ status: 'error', message: err.message }))
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
      this.title.setTitle(
        r && cat
          ? `${r.city.name}: US AQI ${formatAqi(r.usAqi)} (${cat.label}) · Haze Watch`
          : 'Haze Watch · Southeast Asia air quality'
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
        next: readings => {
          this.readings.set(readings);
          this.updatedAt.set(Date.now());
          this.errorMessage.set(null);
        },
        // Keep showing the last good snapshot; the banner explains it's stale.
        error: (err: Error) => this.errorMessage.set(err.message)
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
    const city = CITY_BY_ID.get(id)!;
    this.announcement.set(
      cat ? `Showing ${city.name}: US AQI ${formatAqi(r!.usAqi)}, ${cat.label}.` : `Showing ${city.name}.`
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
    return formatConcentration(value);
  }

  protected place(city: City): string {
    return placeLabel(city);
  }

  protected country(city: City): string {
    return countryName(city.country);
  }

  protected haze(aod: number | null): string {
    return hazeLevel(aod) ?? '–';
  }

  protected wind(r: CityReading): string {
    if (r.windSpeed == null || r.windFrom == null) return 'Not available';
    if (r.windSpeed < 1) return 'Calm';
    return `${Math.round(r.windSpeed)} km/h from the ${compassPoint(r.windFrom)}`;
  }

  /** The arrow points where the wind is blowing to — where smoke drifts. */
  protected windArrowRotation(r: CityReading): number {
    return ((r.windFrom ?? 0) + 180) % 360;
  }

  protected cityTime(r: CityReading): string {
    return safeFormatter(r.timeZone, { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(r.time);
  }

  protected localTime(epochMs: number): string {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(epochMs);
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
   * Refresh every half hour while the page is visible, and catch up straight
   * away when a hidden tab or a backgrounded app comes back.
   */
  private scheduleRefreshes(): void {
    const isStale = () => {
      const at = this.updatedAt();
      return at != null && Date.now() - at >= REFRESH_INTERVAL_MS;
    };
    const maybeRefresh = () => {
      if (document.visibilityState === 'visible' && isStale()) this.refresh();
    };
    const timer = setInterval(maybeRefresh, 60 * 1000);
    document.addEventListener('visibilitychange', maybeRefresh);
    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', maybeRefresh);
    });
  }
}

function compareReadings(a: CityReading, b: CityReading, order: SortOrder): number {
  if (order === 'name') return a.city.name.localeCompare(b.city.name);
  // Cities without a reading always sink to the bottom.
  if (a.usAqi == null || b.usAqi == null) {
    if (a.usAqi == null && b.usAqi == null) return a.city.name.localeCompare(b.city.name);
    return a.usAqi == null ? 1 : -1;
  }
  const diff = order === 'worst' ? b.usAqi - a.usAqi : a.usAqi - b.usAqi;
  return diff || a.city.name.localeCompare(b.city.name);
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

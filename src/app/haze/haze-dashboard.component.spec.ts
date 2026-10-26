import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { SpyLocation, provideLocationMocks } from '@angular/common/testing';

import { AIR_QUALITY_API, CityReading, WEATHER_API } from './air-quality.service';
import { CITIES, City } from './cities';
import { HazeDashboardComponent, backoff, planNextRefresh } from './haze-dashboard.component';

const NOW_S = Math.floor(Date.now() / 1000 / 3600) * 3600;

/** A smoky day: three cities in the Unhealthy-or-worse bands, the rest milder. */
const AQI: Record<string, number> = {
  'palangka-raya': 245,
  pekanbaru: 178,
  singapore: 164,
  'chiang-mai': 35
};

function currentAir(cities: readonly City[]) {
  return cities.map((c, i) => ({
    timezone: c.country === 'ID' ? 'Asia/Jakarta' : 'Asia/Singapore',
    current: {
      time: NOW_S,
      us_aqi: AQI[c.id] ?? 60 + (i % 40),
      pm2_5: (AQI[c.id] ?? 60) / 2,
      pm10: 50,
      carbon_monoxide: 900,
      nitrogen_dioxide: 10,
      ozone: 80,
      aerosol_optical_depth: c.id === 'pekanbaru' ? 3.2 : 0.4
    }
  }));
}

function currentWind(cities: readonly City[]) {
  return cities.map(() => ({ current: { time: NOW_S, wind_speed_10m: 12, wind_direction_10m: 135 } }));
}

function hourly(aqi: number) {
  const times = Array.from({ length: 144 }, (_, i) => NOW_S - 48 * 3600 + i * 3600);
  return {
    timezone: 'Asia/Singapore',
    hourly: { time: times, us_aqi: times.map(() => aqi), pm2_5: times.map(() => aqi / 2) }
  };
}

describe('HazeDashboardComponent', () => {
  let fixture: ComponentFixture<HazeDashboardComponent>;
  let http: HttpTestingController;
  let location: SpyLocation;
  let el: HTMLElement;

  beforeEach(() => {
    try {
      localStorage.removeItem('hazewatch.city');
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [HazeDashboardComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideLocationMocks()],
      // Keep the Leaflet map out of these tests; it has its own spec.
      deferBlockBehavior: DeferBlockBehavior.Manual
    });
    http = TestBed.inject(HttpTestingController);
    location = TestBed.inject(Location) as SpyLocation;
    fixture = TestBed.createComponent(HazeDashboardComponent);
    el = fixture.nativeElement;
  });

  afterEach(() => {
    http.verify();
    try {
      localStorage.removeItem('hazewatch.city');
    } catch {
      // ignore
    }
  });

  function currentRequests(): { air: TestRequest; wind: TestRequest } {
    return {
      air: http.expectOne(req => req.url === AIR_QUALITY_API && req.params.has('current')),
      wind: http.expectOne(req => req.url === WEATHER_API)
    };
  }

  function outlookRequest(city: City): TestRequest {
    return http.expectOne(
      req => req.url === AIR_QUALITY_API && req.params.has('hourly') && req.params.get('latitude') === String(city.lat)
    );
  }

  async function loadAll(): Promise<void> {
    await fixture.whenStable();
    const { air, wind } = currentRequests();
    air.flush(currentAir(CITIES));
    wind.flush(currentWind(CITIES));
    await fixture.whenStable();
  }

  function city(id: string): City {
    return CITIES.find(c => c.id === id)!;
  }

  function rows(): HTMLButtonElement[] {
    return Array.from(el.querySelectorAll<HTMLButtonElement>('.city-row'));
  }

  function rowNames(): string[] {
    return rows().map(r => r.querySelector('.city-row__name')!.textContent!.trim());
  }

  it('summarises the region and ranks cities worst-first', async () => {
    await loadAll();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    expect(el.querySelector('.overview__headline')?.textContent).toContain(`Unhealthy air in 3 of ${CITIES.length} cities`);
    expect(el.querySelector('.overview__worst')?.textContent).toContain('Palangka Raya');
    expect(rowNames().slice(0, 3)).toEqual(['Palangka Raya', 'Pekanbaru', 'Singapore']);
    expect(rows().length).toBe(CITIES.length);
  });

  it('shows the default city, with advice, wind and a daily outlook', async () => {
    await loadAll();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    expect(el.querySelector('.detail__city')?.textContent).toContain('Singapore');
    expect(el.querySelector('.reading__number')?.textContent?.trim()).toBe('164');
    expect(el.querySelector('.reading__label')?.textContent).toContain('Unhealthy');
    expect(el.querySelector('.reading')?.getAttribute('data-cat')).toBe('unhealthy');
    expect(el.querySelector('.advice')?.textContent).toContain('N95');
    expect(el.textContent).toContain('12 km/h from the SE');
    expect(el.querySelector('app-aqi-chart')).toBeTruthy();
    expect(el.querySelectorAll('.daily tbody tr').length).toBeGreaterThan(0);
    expect(TestBed.inject(Title).getTitle()).toBe('Singapore: US AQI 164 (Unhealthy) · Haze Watch');
  });

  it('switches city from the list, remembers it, and puts it in the URL', async () => {
    await loadAll();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    rows()
      .find(r => r.textContent!.includes('Pekanbaru'))!
      .click();
    await fixture.whenStable();
    outlookRequest(city('pekanbaru')).flush(hourly(178));
    await fixture.whenStable();

    expect(el.querySelector('.detail__city')?.textContent).toContain('Pekanbaru');
    expect(el.textContent).toContain('Thick haze');
    expect(rows().find(r => r.getAttribute('aria-current') === 'true')?.textContent).toContain('Pekanbaru');
    expect(location.urlChanges).toContain('replace: ?city=pekanbaru');
    expect(localStorage.getItem('hazewatch.city')).toBe('pekanbaru');
    expect(el.querySelector('.announcer[aria-live="polite"]')?.textContent).toContain('Showing Pekanbaru: US AQI 178, Unhealthy.');
  });

  it('opens on the city named in the ?city= link', async () => {
    location.setInitialPath('?city=chiang-mai');
    await loadAll();
    outlookRequest(city('chiang-mai')).flush(hourly(35));
    await fixture.whenStable();

    expect(el.querySelector('.detail__city')?.textContent).toContain('Chiang Mai');
    expect(el.querySelector('.reading__label')?.textContent).toContain('Good');
  });

  it('ignores an unknown ?city= and falls back to the default', async () => {
    location.setInitialPath('?city=atlantis');
    await loadAll();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    expect(el.querySelector('.detail__city')?.textContent).toContain('Singapore');
  });

  it('follows back/forward to a different ?city=', async () => {
    await loadAll();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    location.simulateUrlPop('?city=pekanbaru');
    await fixture.whenStable();
    outlookRequest(city('pekanbaru')).flush(hourly(178));
    await fixture.whenStable();

    expect(el.querySelector('.detail__city')?.textContent).toContain('Pekanbaru');
  });

  it('filters by country and re-sorts', async () => {
    await loadAll();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    const country = el.querySelector<HTMLSelectElement>('#country-filter')!;
    country.value = 'TH';
    country.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    const thai = CITIES.filter(c => c.country === 'TH').map(c => c.name);
    expect(rowNames().sort()).toEqual([...thai].sort());

    const sort = el.querySelector<HTMLSelectElement>('#sort-order')!;
    sort.value = 'name';
    sort.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(rowNames()).toEqual([...thai].sort((a, b) => a.localeCompare(b)));
  });

  it('explains a failed load and retries on request', async () => {
    await fixture.whenStable();
    const first = currentRequests();
    first.air.error(new ProgressEvent('error'), { status: 0 });
    expect(first.wind.cancelled).toBeTrue();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    const alert = el.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Could not reach the air-quality service');
    expect(el.querySelector('.overview__headline')?.textContent).toContain('unavailable');

    alert!.querySelector('button')!.click();
    await fixture.whenStable();
    const retry = currentRequests();
    retry.air.flush(currentAir(CITIES));
    retry.wind.flush(currentWind(CITIES));
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(rows().length).toBe(CITIES.length);
  });

  it('offers a retry when only the forecast fails', async () => {
    await loadAll();
    outlookRequest(city('singapore')).flush({ error: true, reason: 'Boom' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(el.querySelector('.inline-error')?.textContent).toContain("Couldn't load the forecast");

    el.querySelector<HTMLButtonElement>('.inline-error button')!.click();
    await fixture.whenStable();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    expect(el.querySelector('.inline-error')).toBeNull();
    expect(el.querySelector('app-aqi-chart')).toBeTruthy();
  });

  it('labels the header with the data hour, not just the fetch time', async () => {
    await loadAll();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    const text = el.querySelector('.updated')?.textContent ?? '';
    expect(text).toContain('Data for');
    expect(text).toContain('checked');
  });

  describe('refresh schedule', () => {
    const HOUR = 3600 * 1000;
    const dataHour = NOW_S * 1000;
    const nextHour = dataHour + HOUR;
    let clock: jasmine.Spy<() => number>;

    beforeEach(() => (clock = spyOn(Date, 'now').and.returnValue(dataHour + 10 * 60 * 1000)));

    async function tick(): Promise<void> {
      document.dispatchEvent(new Event('visibilitychange'));
      await fixture.whenStable();
    }

    function pendingCurrent(): number {
      return http.match(req => req.url === AIR_QUALITY_API && req.params.has('current')).length;
    }

    it('fetches again just after the next hour turns, not before', async () => {
      await loadAll();
      outlookRequest(city('singapore')).flush(hourly(164));

      clock.and.returnValue(nextHour - 60 * 1000);
      await tick();
      expect(pendingCurrent()).toBe(0);

      clock.and.returnValue(nextHour + 4 * 60 * 1000);
      await tick();
      const { air, wind } = currentRequests();
      air.flush(currentAir(CITIES));
      wind.flush(currentWind(CITIES));
      // The forecast is refetched with the new hour too.
      outlookRequest(city('singapore')).flush(hourly(164));
    });

    it('backs off after a failure, and retries at once when the browser comes back online', async () => {
      await fixture.whenStable();
      currentRequests().air.error(new ProgressEvent('error'), { status: 0 });
      outlookRequest(city('singapore')).flush(hourly(164));
      await fixture.whenStable();

      // 30 s later: still inside the 1-minute backoff.
      clock.and.returnValue(dataHour + 10 * 60 * 1000 + 30 * 1000);
      await tick();
      expect(pendingCurrent()).toBe(0);

      window.dispatchEvent(new Event('online'));
      await fixture.whenStable();
      const { air, wind } = currentRequests();
      air.flush(currentAir(CITIES));
      wind.flush(currentWind(CITIES));
      await fixture.whenStable();
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });
  });
});

describe('planNextRefresh', () => {
  const HOUR = 3600 * 1000;
  const hour12 = Date.UTC(2026, 9, 26, 12, 0);
  const reading = (time: number) => ({ time }) as CityReading;

  it('lands 1–3 minutes after the hour following the newest reading', () => {
    const now = hour12 + 20 * 60 * 1000;
    expect(planNextRefresh([reading(hour12)], now, () => 0)).toBe(hour12 + HOUR + 60 * 1000);
    expect(planNextRefresh([reading(hour12)], now, () => 1)).toBe(hour12 + HOUR + 3 * 60 * 1000);
  });

  it('retries in 5 minutes when the API is still serving the previous hour', () => {
    const now = hour12 + HOUR + 10 * 60 * 1000;
    expect(planNextRefresh([reading(hour12)], now, () => 0)).toBe(now + 5 * 60 * 1000);
  });

  it('uses the newest reading when hours differ', () => {
    const now = hour12 + 30 * 60 * 1000;
    expect(planNextRefresh([reading(hour12 - HOUR), reading(hour12)], now, () => 0)).toBe(hour12 + HOUR + 60 * 1000);
  });
});

describe('backoff', () => {
  it('doubles from one minute and caps at fifteen', () => {
    expect([1, 2, 3, 4, 5, 9].map(n => backoff(n) / 60000)).toEqual([1, 2, 4, 8, 15, 15]);
  });
});

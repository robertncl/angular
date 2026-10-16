import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { AIR_QUALITY_API, WEATHER_API } from './air-quality.service';
import { CITIES, City } from './cities';
import { HazeDashboardComponent } from './haze-dashboard.component';

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
  let navigate: jasmine.Spy;
  let el: HTMLElement;

  beforeEach(() => {
    try {
      localStorage.removeItem('hazewatch.city');
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [HazeDashboardComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      // Keep the Leaflet map out of these tests; it has its own spec.
      deferBlockBehavior: DeferBlockBehavior.Manual
    });
    http = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
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
    expect(navigate).toHaveBeenCalledWith([], { queryParams: { city: 'pekanbaru' }, replaceUrl: true });
    expect(localStorage.getItem('hazewatch.city')).toBe('pekanbaru');
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('Showing Pekanbaru: US AQI 178, Unhealthy.');
  });

  it('opens on the city named in the ?city= link', async () => {
    fixture.componentRef.setInput('city', 'chiang-mai');
    await loadAll();
    outlookRequest(city('chiang-mai')).flush(hourly(35));
    await fixture.whenStable();

    expect(el.querySelector('.detail__city')?.textContent).toContain('Chiang Mai');
    expect(el.querySelector('.reading__label')?.textContent).toContain('Good');
  });

  it('ignores an unknown ?city= and falls back to the default', async () => {
    fixture.componentRef.setInput('city', 'atlantis');
    await loadAll();
    outlookRequest(city('singapore')).flush(hourly(164));
    await fixture.whenStable();

    expect(el.querySelector('.detail__city')?.textContent).toContain('Singapore');
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
});

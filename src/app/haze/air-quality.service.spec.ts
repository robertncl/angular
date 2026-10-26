import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AIR_QUALITY_API, AirQualityService, CityOutlook, CityReading, WEATHER_API, nextHourBoundary } from './air-quality.service';
import { CITY_BY_ID, City } from './cities';

describe('AirQualityService', () => {
  let service: AirQualityService;
  let http: HttpTestingController;

  const singapore = CITY_BY_ID.get('singapore')!;
  const pekanbaru = CITY_BY_ID.get('pekanbaru')!;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AirQualityService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function airRequest(): TestRequest {
    return http.expectOne(req => req.url === AIR_QUALITY_API && req.params.has('current'));
  }

  function windRequest(): TestRequest {
    return http.expectOne(req => req.url === WEATHER_API);
  }

  function airLocation(overrides: Record<string, unknown> = {}) {
    return {
      timezone: 'Asia/Singapore',
      current: {
        time: 1_792_134_000,
        us_aqi: 164,
        pm2_5: 83.4,
        pm10: 89.6,
        carbon_monoxide: 1466,
        nitrogen_dioxide: 12.5,
        ozone: 301,
        aerosol_optical_depth: 1.95,
        ...overrides
      }
    };
  }

  function windLocation(speed: unknown = 5.7, direction: unknown = 145) {
    return { current: { time: 1_792_134_000, wind_speed_10m: speed, wind_direction_10m: direction } };
  }

  describe('getCurrent', () => {
    it('asks for every city in one request per API', () => {
      service.getCurrent([singapore, pekanbaru]).subscribe();

      const air = airRequest();
      expect(air.request.params.get('latitude')).toBe(`${singapore.lat},${pekanbaru.lat}`);
      expect(air.request.params.get('longitude')).toBe(`${singapore.lon},${pekanbaru.lon}`);
      expect(air.request.params.get('current')).toContain('us_aqi');
      expect(air.request.params.get('current')).toContain('aerosol_optical_depth');
      expect(air.request.params.get('timeformat')).toBe('unixtime');
      expect(air.request.params.get('timezone')).toBe('auto');

      const wind = windRequest();
      expect(wind.request.params.get('current')).toBe('wind_speed_10m,wind_direction_10m');
      expect(wind.request.params.get('wind_speed_unit')).toBe('kmh');

      air.flush([airLocation(), airLocation()]);
      wind.flush([windLocation(), windLocation()]);
    });

    it('maps each location onto its city, in order', () => {
      let result: CityReading[] = [];
      service.getCurrent([singapore, pekanbaru]).subscribe(r => (result = r));

      airRequest().flush([airLocation(), { ...airLocation({ us_aqi: 178 }), timezone: 'Asia/Jakarta' }]);
      windRequest().flush([windLocation(), windLocation(1.3, 124)]);

      expect(result.length).toBe(2);
      expect(result[0].city).toBe(singapore);
      expect(result[0].usAqi).toBe(164);
      expect(result[0].pm25).toBe(83.4);
      expect(result[0].aerosolOpticalDepth).toBe(1.95);
      expect(result[0].time).toBe(1_792_134_000 * 1000);
      expect(result[0].timeZone).toBe('Asia/Singapore');
      expect(result[0].windSpeed).toBe(5.7);
      expect(result[0].windFrom).toBe(145);
      expect(result[1].city).toBe(pekanbaru);
      expect(result[1].usAqi).toBe(178);
      expect(result[1].timeZone).toBe('Asia/Jakarta');
      expect(result[1].windFrom).toBe(124);
    });

    it('accepts the single-object response Open-Meteo sends for one location', () => {
      let result: CityReading[] = [];
      service.getCurrent([singapore]).subscribe(r => (result = r));

      airRequest().flush(airLocation());
      windRequest().flush(windLocation());

      expect(result.length).toBe(1);
      expect(result[0].usAqi).toBe(164);
    });

    it('treats anything but a finite number as missing', () => {
      let result: CityReading[] = [];
      service.getCurrent([singapore]).subscribe(r => (result = r));

      airRequest().flush(airLocation({ us_aqi: '164', pm2_5: null, pm10: '<script>' }));
      windRequest().flush(windLocation('fast', null));

      expect(result[0].usAqi).toBeNull();
      expect(result[0].pm25).toBeNull();
      expect(result[0].pm10).toBeNull();
      expect(result[0].windSpeed).toBeNull();
      expect(result[0].windFrom).toBeNull();
    });

    it('still returns air quality when the wind request fails', () => {
      let result: CityReading[] = [];
      service.getCurrent([singapore]).subscribe(r => (result = r));

      airRequest().flush(airLocation());
      windRequest().flush({ error: true }, { status: 500, statusText: 'Server Error' });

      expect(result[0].usAqi).toBe(164);
      expect(result[0].windSpeed).toBeNull();
    });

    it('explains a network failure', () => {
      let message = '';
      service.getCurrent([singapore]).subscribe({ error: (e: Error) => (message = e.message) });

      const wind = windRequest();
      airRequest().error(new ProgressEvent('error'), { status: 0 });

      expect(message).toContain('Could not reach');
      // forkJoin drops the still-pending wind request once air quality fails.
      expect(wind.cancelled).toBeTrue();
    });

    it('explains rate limiting', () => {
      let message = '';
      service.getCurrent([singapore]).subscribe({ error: (e: Error) => (message = e.message) });

      const wind = windRequest();
      airRequest().flush({ error: true, reason: 'Too many requests' }, { status: 429, statusText: 'Too Many Requests' });
      expect(wind.cancelled).toBeTrue();

      expect(message).toContain('rate-limiting');
    });

    it("passes on the API's reason for a bad request", () => {
      let message = '';
      service.getCurrent([singapore]).subscribe({ error: (e: Error) => (message = e.message) });

      const wind = windRequest();
      airRequest().flush({ error: true, reason: 'Latitude must be in range' }, { status: 400, statusText: 'Bad Request' });
      expect(wind.cancelled).toBeTrue();

      expect(message).toContain('Latitude must be in range');
    });

    it('rejects a response that does not line up with the cities asked for', () => {
      let message = '';
      service.getCurrent([singapore, pekanbaru]).subscribe({ error: (e: Error) => (message = e.message) });

      const wind = windRequest();
      airRequest().flush([airLocation()]);

      expect(message).toContain('Unexpected response');
      expect(wind.cancelled).toBeTrue();
    });

    it('shows air quality without waiting for wind, then fills wind in', () => {
      const emitted: CityReading[][] = [];
      service.getCurrent([singapore]).subscribe(r => emitted.push(r));

      const wind = windRequest();
      airRequest().flush(airLocation());
      expect(emitted.length).toBe(1);
      expect(emitted[0][0].usAqi).toBe(164);
      expect(emitted[0][0].windSpeed).toBeNull();

      wind.flush(windLocation());
      expect(emitted.length).toBe(2);
      expect(emitted[1][0].windSpeed).toBe(5.7);
    });

    it('emits once when wind answers first', () => {
      const emitted: CityReading[][] = [];
      service.getCurrent([singapore]).subscribe(r => emitted.push(r));

      windRequest().flush(windLocation());
      airRequest().flush(airLocation());

      expect(emitted.length).toBe(1);
      expect(emitted[0][0].windSpeed).toBe(5.7);
    });
  });

  describe('getOutlook', () => {
    function outlookRequest(city: City): TestRequest {
      return http.expectOne(
        req => req.url === AIR_QUALITY_API && req.params.has('hourly') && req.params.get('latitude') === String(city.lat)
      );
    }

    const hourly = {
      timezone: 'Asia/Jakarta',
      hourly: { time: [1000, 4600, 8200], us_aqi: [150, null, 210], pm2_5: [55, 60, 140] }
    };

    it('requests two days back and four ahead, hourly', () => {
      service.getOutlook(pekanbaru).subscribe();
      const req = outlookRequest(pekanbaru);
      expect(req.request.params.get('hourly')).toBe('us_aqi,pm2_5');
      expect(req.request.params.get('past_days')).toBe('2');
      expect(req.request.params.get('forecast_days')).toBe('4');
      req.flush(hourly);
    });

    it('maps hourly arrays into points', () => {
      let outlook: CityOutlook | undefined;
      service.getOutlook(pekanbaru).subscribe(o => (outlook = o));
      outlookRequest(pekanbaru).flush(hourly);

      expect(outlook?.cityId).toBe('pekanbaru');
      expect(outlook?.timeZone).toBe('Asia/Jakarta');
      expect(outlook?.points).toEqual([
        { time: 1_000_000, usAqi: 150, pm25: 55 },
        { time: 4_600_000, usAqi: null, pm25: 60 },
        { time: 8_200_000, usAqi: 210, pm25: 140 }
      ]);
    });

    it('serves a recent outlook from cache, unless forced', () => {
      service.getOutlook(pekanbaru).subscribe();
      outlookRequest(pekanbaru).flush(hourly);

      let cached: CityOutlook | undefined;
      service.getOutlook(pekanbaru).subscribe(o => (cached = o));
      http.expectNone(req => req.params.has('hourly'));
      expect(cached?.points.length).toBe(3);

      service.getOutlook(pekanbaru, true).subscribe();
      outlookRequest(pekanbaru).flush(hourly);
    });

    describe('cache expiry', () => {
      afterEach(() => jasmine.clock().uninstall());

      it('drops a cached outlook when the hour turns, even within 15 minutes', () => {
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date(Date.UTC(2026, 9, 26, 12, 58)));
        service.getOutlook(pekanbaru).subscribe();
        outlookRequest(pekanbaru).flush(hourly);

        jasmine.clock().mockDate(new Date(Date.UTC(2026, 9, 26, 12, 59, 59)));
        service.getOutlook(pekanbaru).subscribe();
        http.expectNone(req => req.params.has('hourly'));

        jasmine.clock().mockDate(new Date(Date.UTC(2026, 9, 26, 13, 0, 1)));
        service.getOutlook(pekanbaru).subscribe();
        outlookRequest(pekanbaru).flush(hourly);
      });

      it('still expires after 15 minutes within one hour', () => {
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date(Date.UTC(2026, 9, 26, 12, 5)));
        service.getOutlook(pekanbaru).subscribe();
        outlookRequest(pekanbaru).flush(hourly);

        jasmine.clock().mockDate(new Date(Date.UTC(2026, 9, 26, 12, 21)));
        service.getOutlook(pekanbaru).subscribe();
        outlookRequest(pekanbaru).flush(hourly);
      });
    });
  });

  describe('nextHourBoundary', () => {
    it('returns the next UTC hour, strictly after the given time', () => {
      expect(nextHourBoundary(Date.UTC(2026, 9, 26, 12, 0))).toBe(Date.UTC(2026, 9, 26, 13, 0));
      expect(nextHourBoundary(Date.UTC(2026, 9, 26, 12, 59, 59))).toBe(Date.UTC(2026, 9, 26, 13, 0));
    });
  });
});

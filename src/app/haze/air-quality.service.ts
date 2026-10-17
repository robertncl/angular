import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, tap, throwError } from 'rxjs';

import { OutlookPoint } from './aqi';
import { City } from './cities';

/**
 * Open-Meteo serves CAMS (Copernicus Atmosphere Monitoring Service) model
 * output with no API key and `Access-Control-Allow-Origin: *`, so the browser
 * and the Capacitor WebView can call it directly — no proxy needed.
 * https://open-meteo.com/en/docs/air-quality-api
 */
export const AIR_QUALITY_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';
export const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

const CURRENT_AIR = [
  'us_aqi',
  'pm2_5',
  'pm10',
  'carbon_monoxide',
  'nitrogen_dioxide',
  'ozone',
  'aerosol_optical_depth'
] as const;

const OUTLOOK_TTL_MS = 15 * 60 * 1000;

export interface CityReading {
  city: City;
  /** Epoch milliseconds of the model hour the values describe. */
  time: number;
  /** IANA zone of the city, for showing times in local terms. */
  timeZone: string;
  usAqi: number | null;
  /** µg/m³ */
  pm25: number | null;
  pm10: number | null;
  carbonMonoxide: number | null;
  nitrogenDioxide: number | null;
  ozone: number | null;
  aerosolOpticalDepth: number | null;
  /** km/h */
  windSpeed: number | null;
  /** Bearing the wind blows from, in degrees. */
  windFrom: number | null;
}

export interface CityOutlook {
  cityId: string;
  timeZone: string;
  points: OutlookPoint[];
}

/** The subset of an Open-Meteo location object this app reads. */
interface OmLocation {
  timezone?: string;
  current?: Record<string, unknown>;
  hourly?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class AirQualityService {
  private readonly http = inject(HttpClient);
  private readonly outlookCache = new Map<string, { fetchedAt: number; outlook: CityOutlook }>();

  /**
   * Latest model hour for every city, in one request per API: Open-Meteo
   * accepts comma-separated coordinates and returns an array in the same order.
   * Wind is a nice-to-have, so a failure there degrades to nulls instead of
   * failing the whole snapshot.
   */
  getCurrent(cities: readonly City[]): Observable<CityReading[]> {
    const latitude = cities.map(c => c.lat).join(',');
    const longitude = cities.map(c => c.lon).join(',');

    const air$ = this.http.get<OmLocation | OmLocation[]>(AIR_QUALITY_API, {
      params: { latitude, longitude, current: CURRENT_AIR.join(','), timezone: 'auto', timeformat: 'unixtime' }
    });
    const wind$ = this.http
      .get<OmLocation | OmLocation[]>(WEATHER_API, {
        params: {
          latitude,
          longitude,
          current: 'wind_speed_10m,wind_direction_10m',
          wind_speed_unit: 'kmh',
          timezone: 'auto',
          timeformat: 'unixtime'
        }
      })
      .pipe(catchError(() => of(null)));

    return forkJoin([air$, wind$]).pipe(
      map(([airRes, windRes]) => {
        const air = asList(airRes);
        if (air.length !== cities.length) throw new Error('Unexpected response from the air-quality service.');
        const wind = windRes ? asList(windRes) : [];
        return cities.map((city, i) => toReading(city, air[i], wind.length === cities.length ? wind[i] : undefined));
      }),
      catchError(err => throwError(() => new Error(describeError(err))))
    );
  }

  /**
   * Two days of history plus the four-day forecast, hourly. Cached briefly so
   * flicking between cities doesn't refetch; `force` bypasses the cache.
   */
  getOutlook(city: City, force = false): Observable<CityOutlook> {
    const cached = this.outlookCache.get(city.id);
    if (!force && cached && Date.now() - cached.fetchedAt < OUTLOOK_TTL_MS) return of(cached.outlook);

    return this.http
      .get<OmLocation>(AIR_QUALITY_API, {
        params: {
          latitude: city.lat,
          longitude: city.lon,
          hourly: 'us_aqi,pm2_5',
          past_days: 2,
          forecast_days: 4,
          timezone: 'auto',
          timeformat: 'unixtime'
        }
      })
      .pipe(
        map(res => toOutlook(city, res)),
        tap(outlook => this.outlookCache.set(city.id, { fetchedAt: Date.now(), outlook })),
        catchError(err => throwError(() => new Error(describeError(err))))
      );
  }
}

function asList(res: OmLocation | OmLocation[] | null | undefined): OmLocation[] {
  if (Array.isArray(res)) return res;
  return res ? [res] : [];
}

function toReading(city: City, air: OmLocation, wind: OmLocation | undefined): CityReading {
  const cur = air.current ?? {};
  const w = wind?.current ?? {};
  const time = num(cur['time']);
  return {
    city,
    time: time == null ? Date.now() : time * 1000,
    timeZone: typeof air.timezone === 'string' ? air.timezone : 'UTC',
    usAqi: num(cur['us_aqi']),
    pm25: num(cur['pm2_5']),
    pm10: num(cur['pm10']),
    carbonMonoxide: num(cur['carbon_monoxide']),
    nitrogenDioxide: num(cur['nitrogen_dioxide']),
    ozone: num(cur['ozone']),
    aerosolOpticalDepth: num(cur['aerosol_optical_depth']),
    windSpeed: num(w['wind_speed_10m']),
    windFrom: num(w['wind_direction_10m'])
  };
}

function toOutlook(city: City, res: OmLocation): CityOutlook {
  const hourly = res.hourly ?? {};
  const times = Array.isArray(hourly['time']) ? (hourly['time'] as unknown[]) : [];
  const aqi = Array.isArray(hourly['us_aqi']) ? (hourly['us_aqi'] as unknown[]) : [];
  const pm25 = Array.isArray(hourly['pm2_5']) ? (hourly['pm2_5'] as unknown[]) : [];
  const points: OutlookPoint[] = [];
  times.forEach((t, i) => {
    const seconds = num(t);
    if (seconds == null) return;
    points.push({ time: seconds * 1000, usAqi: num(aqi[i]), pm25: num(pm25[i]) });
  });
  return { cityId: city.id, timeZone: typeof res.timezone === 'string' ? res.timezone : 'UTC', points };
}

/** API payloads are untrusted: only finite numbers get through. */
function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function describeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Could not reach the air-quality service. Check your connection and try again.';
    if (err.status === 429) return 'The air-quality service is rate-limiting requests. Try again in a few minutes.';
    const reason = (err.error as { reason?: unknown } | null)?.reason;
    if (typeof reason === 'string') return `The air-quality service returned an error: ${reason}`;
    return `The air-quality service returned an error (HTTP ${err.status}).`;
  }
  return err instanceof Error ? err.message : 'Something went wrong while loading air-quality data.';
}

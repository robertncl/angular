export type AqiCategoryId =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous';

/** Labels and health advice are per language: see `categories` in i18n/messages. */
export interface AqiCategory {
  id: AqiCategoryId;
  /** Inclusive US AQI range. Hazardous is open-ended: heavy smoke runs past 500. */
  min: number;
  max: number;
  /** "51–100", "301+" */
  range: string;
}

/**
 * US EPA AQI bands. Colours live in styles.css as --aqi-<id> so that chips,
 * map markers and chart bands all key off the same `data-cat` attribute.
 */
export const AQI_CATEGORIES: readonly AqiCategory[] = [
  { id: 'good', min: 0, max: 50, range: '0–50' },
  { id: 'moderate', min: 51, max: 100, range: '51–100' },
  { id: 'sensitive', min: 101, max: 150, range: '101–150' },
  { id: 'unhealthy', min: 151, max: 200, range: '151–200' },
  { id: 'very-unhealthy', min: 201, max: 300, range: '201–300' },
  { id: 'hazardous', min: 301, max: Number.POSITIVE_INFINITY, range: '301+' }
];

/** Upper edges of each band below Hazardous, used for chart bands and gridlines. */
export const AQI_BREAKPOINTS: readonly number[] = [50, 100, 150, 200, 300];

export function aqiCategory(aqi: number | null | undefined): AqiCategory | null {
  if (aqi == null || !Number.isFinite(aqi) || aqi < 0) return null;
  const rounded = Math.round(aqi);
  return AQI_CATEGORIES.find(c => rounded <= c.max) ?? null;
}

/** WHO 2021 air quality guideline for 24-hour mean PM2.5, in µg/m³. */
export const WHO_PM25_24H = 15;

export type HazeLevel = 'clear' | 'light' | 'hazy' | 'thick';

/**
 * Rough reading of aerosol optical depth at 550 nm: how much sunlight the
 * column of smoke and dust blocks, which tracks how hazy the sky looks.
 */
export function hazeLevel(aod: number | null | undefined): HazeLevel | null {
  if (aod == null || !Number.isFinite(aod) || aod < 0) return null;
  if (aod < 0.25) return 'clear';
  if (aod < 0.6) return 'light';
  if (aod < 1) return 'hazy';
  return 'thick';
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type CompassPoint = (typeof COMPASS)[number];

/** Eight-point compass code for a bearing in degrees; the words are per language. */
export function compassPoint(degrees: number): CompassPoint {
  const normalized = ((degrees % 360) + 360) % 360;
  return COMPASS[Math.round(normalized / 45) % COMPASS.length];
}

/**
 * "8.4" below 10, "84" above: enough precision without false accuracy.
 * Separators follow the locale ("8,4" and "1.466" in Indonesian).
 */
export function formatConcentration(value: number | null | undefined, locale = 'en'): string {
  if (value == null || !Number.isFinite(value)) return '–';
  const digits = value < 10 ? 1 : 0;
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatAqi(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? '–' : String(Math.round(value));
}

export interface OutlookPoint {
  /** Epoch milliseconds. */
  time: number;
  usAqi: number | null;
  pm25: number | null;
}

export interface DailySummary {
  /** YYYY-MM-DD in the city's own time zone. */
  date: string;
  /** Today and tomorrow get words from the messages; later days use `label`. */
  relative: 'today' | 'tomorrow' | null;
  /** "Thu 29 Oct", in the given locale. */
  label: string;
  peakAqi: number | null;
  peakPm25: number | null;
}

/**
 * Collapse hourly points into one row per local calendar day, starting from
 * the city's "today", for the outlook table under the chart.
 */
export function dailySummaries(
  points: readonly OutlookPoint[],
  timeZone: string,
  now: number,
  days = 4,
  locale = 'en-GB'
): DailySummary[] {
  const dayKey = dateKeyFormatter(timeZone);
  const today = dayKey(now);
  const byDay = new Map<string, OutlookPoint[]>();
  for (const p of points) {
    const key = dayKey(p.time);
    if (key < today) continue;
    const bucket = byDay.get(key);
    if (bucket) bucket.push(p);
    else byDay.set(key, [p]);
  }

  const weekday = safeFormatter(timeZone, { weekday: 'short', day: 'numeric', month: 'short' }, locale);
  const tomorrow = nextDay(today);
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, days)
    .map(([date, dayPoints]) => ({
      date,
      relative: date === today ? 'today' : date === tomorrow ? 'tomorrow' : null,
      label: weekday.format(dayPoints[0].time),
      peakAqi: maxOf(dayPoints.map(p => p.usAqi)),
      peakPm25: maxOf(dayPoints.map(p => p.pm25))
    }));
}

function nextDay(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function maxOf(values: readonly (number | null)[]): number | null {
  let max: number | null = null;
  for (const v of values) {
    if (v != null && Number.isFinite(v) && (max == null || v > max)) max = v;
  }
  return max;
}

/** en-CA formats dates as YYYY-MM-DD, which sorts lexically. */
function dateKeyFormatter(timeZone: string): (epochMs: number) => string {
  const fmt = safeFormatter(timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA');
  return epochMs => fmt.format(epochMs);
}

/**
 * Intl throws on an unknown time zone. Open-Meteo returns IANA names, but
 * fall back to UTC rather than take the whole page down if one slips through.
 */
export function safeFormatter(
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
  locale = 'en-GB'
): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone });
  } catch {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
  }
}

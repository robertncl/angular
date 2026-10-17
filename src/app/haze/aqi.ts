export type AqiCategoryId =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous';

export interface AqiCategory {
  id: AqiCategoryId;
  label: string;
  /** Fits in a list row or a map tooltip. */
  shortLabel: string;
  /** Inclusive US AQI range. Hazardous is open-ended: heavy smoke runs past 500. */
  min: number;
  max: number;
  /** "51–100", "301+" */
  range: string;
  advice: string;
}

/**
 * US EPA AQI bands. Colours live in styles.css as --acme-color-aqi-<id> so that chips,
 * map markers and chart bands all key off the same `data-cat` attribute.
 */
export const AQI_CATEGORIES: readonly AqiCategory[] = [
  {
    id: 'good',
    label: 'Good',
    shortLabel: 'Good',
    min: 0,
    max: 50,
    range: '0–50',
    advice: 'Air quality is satisfactory. Enjoy your usual outdoor activities.'
  },
  {
    id: 'moderate',
    label: 'Moderate',
    shortLabel: 'Moderate',
    min: 51,
    max: 100,
    range: '51–100',
    advice:
      'Acceptable for most people. If you are unusually sensitive to air pollution, consider shorter or less intense outdoor activity.'
  },
  {
    id: 'sensitive',
    label: 'Unhealthy for sensitive groups',
    shortLabel: 'Sensitive groups',
    min: 101,
    max: 150,
    range: '101–150',
    advice:
      'Children, older adults, pregnant women and people with heart or lung conditions should cut back on long or strenuous outdoor activity.'
  },
  {
    id: 'unhealthy',
    label: 'Unhealthy',
    shortLabel: 'Unhealthy',
    min: 151,
    max: 200,
    range: '151–200',
    advice:
      'Everyone should reduce long or strenuous outdoor activity; sensitive groups should avoid it. Wear a well-fitted N95 mask if you must be outdoors for long.'
  },
  {
    id: 'very-unhealthy',
    label: 'Very unhealthy',
    shortLabel: 'Very unhealthy',
    min: 201,
    max: 300,
    range: '201–300',
    advice:
      'Everyone should avoid long or strenuous outdoor activity. Sensitive groups should stay indoors with windows closed and an air purifier running if possible.'
  },
  {
    id: 'hazardous',
    label: 'Hazardous',
    shortLabel: 'Hazardous',
    min: 301,
    max: Number.POSITIVE_INFINITY,
    range: '301+',
    advice:
      'Everyone should avoid all outdoor physical activity and stay indoors with windows closed. Follow the advice of local health authorities.'
  }
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

export type HazeLevel = 'Clear' | 'Light haze' | 'Hazy' | 'Thick haze';

/**
 * Rough reading of aerosol optical depth at 550 nm: how much sunlight the
 * column of smoke and dust blocks, which tracks how hazy the sky looks.
 */
export function hazeLevel(aod: number | null | undefined): HazeLevel | null {
  if (aod == null || !Number.isFinite(aod) || aod < 0) return null;
  if (aod < 0.25) return 'Clear';
  if (aod < 0.6) return 'Light haze';
  if (aod < 1) return 'Hazy';
  return 'Thick haze';
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

/** Eight-point compass label for a bearing in degrees. */
export function compassPoint(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  return COMPASS[Math.round(normalized / 45) % COMPASS.length];
}

/** "8.4" below 10, "84" above: enough precision without false accuracy. */
export function formatConcentration(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '–';
  if (value < 10) return value.toFixed(1);
  return Math.round(value).toLocaleString('en');
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
  days = 4
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

  const weekday = safeFormatter(timeZone, { weekday: 'short', day: 'numeric', month: 'short' });
  const tomorrow = nextDay(today);
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, days)
    .map(([date, dayPoints]) => ({
      date,
      label: date === today ? 'Today' : date === tomorrow ? 'Tomorrow' : weekday.format(dayPoints[0].time),
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

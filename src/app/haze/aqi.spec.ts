import {
  AQI_CATEGORIES,
  AqiCategoryId,
  OutlookPoint,
  aqiCategory,
  compassPoint,
  dailySummaries,
  formatAqi,
  formatConcentration,
  hazeLevel
} from './aqi';

describe('aqiCategory', () => {
  const cases: [number, AqiCategoryId][] = [
    [0, 'good'],
    [50, 'good'],
    [50.4, 'good'],
    [50.6, 'moderate'],
    [51, 'moderate'],
    [100, 'moderate'],
    [101, 'sensitive'],
    [150, 'sensitive'],
    [151, 'unhealthy'],
    [200, 'unhealthy'],
    [201, 'very-unhealthy'],
    [300, 'very-unhealthy'],
    [301, 'hazardous'],
    [500, 'hazardous'],
    [812, 'hazardous']
  ];

  for (const [aqi, id] of cases) {
    it(`puts ${aqi} in ${id}`, () => {
      expect(aqiCategory(aqi)?.id).toBe(id);
    });
  }

  it('returns null for missing or invalid values', () => {
    expect(aqiCategory(null)).toBeNull();
    expect(aqiCategory(undefined)).toBeNull();
    expect(aqiCategory(-1)).toBeNull();
    expect(aqiCategory(Number.NaN)).toBeNull();
    expect(aqiCategory(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('defines contiguous bands', () => {
    AQI_CATEGORIES.forEach((c, i) => {
      if (i > 0) expect(c.min).toBe(AQI_CATEGORIES[i - 1].max + 1);
    });
  });

  it('leaves Hazardous open-ended, since smoke can push the index past 500', () => {
    const hazardous = AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
    expect(hazardous.range).toBe('301+');
    expect(aqiCategory(957)?.id).toBe('hazardous');
  });
});

describe('hazeLevel', () => {
  it('maps aerosol optical depth to a plain-language level', () => {
    expect(hazeLevel(0.1)).toBe('clear');
    expect(hazeLevel(0.25)).toBe('light');
    expect(hazeLevel(0.8)).toBe('hazy');
    expect(hazeLevel(1)).toBe('thick');
    expect(hazeLevel(3.2)).toBe('thick');
  });

  it('returns null without a usable value', () => {
    expect(hazeLevel(null)).toBeNull();
    expect(hazeLevel(-0.1)).toBeNull();
  });
});

describe('compassPoint', () => {
  it('rounds bearings to the nearest of eight points', () => {
    expect(compassPoint(0)).toBe('N');
    expect(compassPoint(22)).toBe('N');
    expect(compassPoint(23)).toBe('NE');
    expect(compassPoint(90)).toBe('E');
    expect(compassPoint(145)).toBe('SE');
    expect(compassPoint(225)).toBe('SW');
    expect(compassPoint(359)).toBe('N');
  });

  it('normalises out-of-range bearings', () => {
    expect(compassPoint(-90)).toBe('W');
    expect(compassPoint(720)).toBe('N');
  });
});

describe('formatting', () => {
  it('formats concentrations with sensible precision', () => {
    expect(formatConcentration(null)).toBe('–');
    expect(formatConcentration(8.44)).toBe('8.4');
    expect(formatConcentration(84.4)).toBe('84');
    expect(formatConcentration(1466)).toBe('1,466');
  });

  it('formats concentrations with the locale’s separators', () => {
    expect(formatConcentration(8.44, 'id-ID')).toBe('8,4');
    expect(formatConcentration(1466, 'id-ID')).toBe('1.466');
  });

  it('formats AQI as a whole number', () => {
    expect(formatAqi(163.6)).toBe('164');
    expect(formatAqi(null)).toBe('–');
  });
});

describe('dailySummaries', () => {
  const HOUR = 3600 * 1000;
  // Midnight on Fri 16 Oct 2026 in Singapore (UTC+8).
  const todayStart = Date.UTC(2026, 9, 15, 16, 0, 0);
  const now = todayStart + 15 * HOUR;

  function hourly(fromMs: number, hours: number, value: (i: number, t: number) => number | null): OutlookPoint[] {
    return Array.from({ length: hours }, (_, i) => {
      const time = fromMs + i * HOUR;
      const v = value(i, time);
      return { time, usAqi: v, pm25: v == null ? null : v / 2 };
    });
  }

  it('groups by local day from today, labelling today and tomorrow', () => {
    const tomorrowPeak = todayStart + 24 * HOUR + 14 * HOUR;
    const points = hourly(todayStart - 24 * HOUR, 24 * 5, (_, t) => (t === tomorrowPeak ? 240 : 80));

    const days = dailySummaries(points, 'Asia/Singapore', now);

    expect(days.map(d => d.date)).toEqual(['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19']);
    expect(days.map(d => d.relative)).toEqual(['today', 'tomorrow', null, null]);
    expect(days[2].label).toContain('18');
    expect(days[1].peakAqi).toBe(240);
    expect(days[1].peakPm25).toBe(120);
    expect(days[0].peakAqi).toBe(80);
  });

  it('names later days in the requested locale', () => {
    const points = hourly(todayStart, 24 * 4, () => 60);
    const [, , sunday] = dailySummaries(points, 'Asia/Singapore', now, 4, 'id-ID');
    expect(sunday.label).toContain('Min');
  });

  it('respects the requested number of days', () => {
    const points = hourly(todayStart, 24 * 4, () => 60);
    expect(dailySummaries(points, 'Asia/Singapore', now, 2).length).toBe(2);
  });

  it('ignores gaps when finding peaks', () => {
    const points = hourly(todayStart, 24, i => (i % 2 ? null : 40 + i));
    const [today] = dailySummaries(points, 'Asia/Singapore', now);
    expect(today.peakAqi).toBe(62);
  });

  it('falls back to UTC for an unknown time zone instead of throwing', () => {
    const points = hourly(todayStart, 48, () => 30);
    expect(() => dailySummaries(points, 'Not/AZone', now)).not.toThrow();
  });
});

import {
  ALLOC_COLORS,
  CATEGORIES,
  CATEGORY_SYMBOLS,
  HOLDINGS,
  NEWS_PUBLISHERS,
  ORDER_HISTORY,
  RANGE_COUNTS,
  RANGE_IDS,
  STOCKS,
  buildChart,
  fmtMoney,
  fmtNum,
  fmtPct,
  seededSeries
} from './trading-data';

describe('trading-data formatters', () => {
  describe('fmtMoney', () => {
    it('formats a positive number as USD with two decimals', () => {
      expect(fmtMoney(1234.5)).toBe('$1,234.50');
    });

    it('formats zero', () => {
      expect(fmtMoney(0)).toBe('$0.00');
    });

    it('formats a negative number', () => {
      expect(fmtMoney(-42.1)).toBe('$-42.10');
    });

    it('returns an em dash for null', () => {
      expect(fmtMoney(null)).toBe('—');
    });

    it('returns an em dash for undefined', () => {
      expect(fmtMoney(undefined)).toBe('—');
    });

    it('returns an em dash for NaN', () => {
      expect(fmtMoney(NaN)).toBe('—');
    });
  });

  describe('fmtPct', () => {
    it('prefixes a positive value with +', () => {
      expect(fmtPct(1.8)).toBe('+1.80%');
    });

    it('prefixes zero with + (>= 0 branch)', () => {
      expect(fmtPct(0)).toBe('+0.00%');
    });

    it('does not prefix a negative value', () => {
      expect(fmtPct(-3.375)).toBe('-3.38%');
    });
  });

  describe('fmtNum', () => {
    it('returns an em dash for 0 (falsy)', () => {
      expect(fmtNum(0)).toBe('—');
    });

    it('formats billions', () => {
      expect(fmtNum(2_350_000_000)).toBe('2.35B');
    });

    it('formats millions', () => {
      expect(fmtNum(58_230_000)).toBe('58.23M');
    });

    it('formats thousands', () => {
      expect(fmtNum(4_500)).toBe('4.5K');
    });

    it('returns the plain number below one thousand', () => {
      expect(fmtNum(842)).toBe('842');
    });
  });

  describe('seededSeries', () => {
    it('returns `count` points', () => {
      expect(seededSeries('AAPL1M', 100, 30).length).toBe(30);
    });

    it('is deterministic for the same seed', () => {
      const a = seededSeries('AAPL1M', 231.52, 30);
      const b = seededSeries('AAPL1M', 231.52, 30);
      expect(a).toEqual(b);
    });

    it('produces a different series for a different seed', () => {
      const a = seededSeries('AAPL1M', 231.52, 30);
      const b = seededSeries('MSFT1M', 468.20, 30);
      expect(a).not.toEqual(b);
    });

    it('forces the final point to equal the base price', () => {
      const series = seededSeries('NVDA1Y', 142.85, 52);
      expect(series[series.length - 1]).toBe(142.85);
    });

    it('keeps every point within the [0.75x, 1.15x] clamp band', () => {
      const base = 500;
      const series = seededSeries('QQQ3M', base, 45);
      for (const p of series) {
        expect(p).toBeGreaterThanOrEqual(base * 0.75 - 1e-9);
        expect(p).toBeLessThanOrEqual(base * 1.15 + 1e-9);
      }
    });

    it('handles a single-point series without dividing by zero', () => {
      const series = seededSeries('X', 10, 1);
      expect(series.length).toBe(1);
      expect(series[0]).toBe(10);
    });
  });

  describe('buildChart', () => {
    it('starts the path with M and joins remaining points with L', () => {
      const { path } = buildChart([1, 2, 3]);
      expect(path.startsWith('M')).toBeTrue();
      expect(path.split(' ').filter(seg => seg.startsWith('L')).length).toBe(2);
    });

    it('closes the area path back to the baseline', () => {
      const { areaPath } = buildChart([1, 2, 3]);
      expect(areaPath.endsWith('Z')).toBeTrue();
    });

    it('marks rising when the series ends at or above where it started', () => {
      expect(buildChart([1, 2, 3]).rising).toBeTrue();
      expect(buildChart([1, 2, 3]).falling).toBeFalse();
    });

    it('marks falling when the series ends below where it started', () => {
      expect(buildChart([3, 2, 1]).rising).toBeFalse();
      expect(buildChart([3, 2, 1]).falling).toBeTrue();
    });

    it('treats an equal start/end as rising (>=, not >)', () => {
      expect(buildChart([5, 9, 1, 5]).rising).toBeTrue();
    });

    it('does not divide by zero when every point is equal (span=0 falls back to 1)', () => {
      const { path } = buildChart([7, 7, 7]);
      expect(path).not.toContain('NaN');
      expect(path).not.toContain('Infinity');
    });

    it('uses the default 800x220 viewport when none is given', () => {
      const { path } = buildChart([1, 2]);
      // last point's x should be the full default width (800)
      expect(path).toContain('800.00');
    });

    it('honors a custom width/height and switches to the tighter 10px padding', () => {
      const { path, areaPath } = buildChart([1, 2], 360, 160);
      expect(path).toContain('360.00');
      // padBottom is 10 for height < 200, so the area path closes at y=150
      expect(areaPath).toContain(',150');
    });
  });
});

describe('trading-data constants', () => {
  it('RANGE_COUNTS has an entry for every RANGE_IDS value', () => {
    for (const r of RANGE_IDS) {
      expect(RANGE_COUNTS[r]).toBeGreaterThan(0);
    }
  });

  it('CATEGORY_SYMBOLS covers every non-watch CATEGORIES id', () => {
    for (const c of CATEGORIES) {
      if (c.id === 'watch') continue;
      expect((CATEGORY_SYMBOLS as Record<string, string[]>)[c.id]?.length).toBeGreaterThan(0);
    }
  });

  it('every symbol referenced by CATEGORY_SYMBOLS exists in STOCKS', () => {
    for (const symbols of Object.values(CATEGORY_SYMBOLS)) {
      for (const sym of symbols) {
        expect(STOCKS[sym]).withContext(sym).toBeDefined();
      }
    }
  });

  it('every HOLDINGS symbol exists in STOCKS', () => {
    for (const h of HOLDINGS) {
      expect(STOCKS[h.symbol]).withContext(h.symbol).toBeDefined();
    }
  });

  it('every ORDER_HISTORY symbol exists in STOCKS', () => {
    for (const o of ORDER_HISTORY) {
      expect(STOCKS[o.symbol]).withContext(o.symbol).toBeDefined();
    }
  });

  it('has at least one alloc color and one news publisher', () => {
    expect(ALLOC_COLORS.length).toBeGreaterThan(0);
    expect(NEWS_PUBLISHERS.length).toBeGreaterThan(0);
  });
});

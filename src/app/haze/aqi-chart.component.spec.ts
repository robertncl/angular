import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AqiChartComponent, buildChart } from './aqi-chart.component';
import { OutlookPoint } from './aqi';

const HOUR = 3600 * 1000;
// Midnight, Fri 16 Oct 2026 in Singapore.
const START = Date.UTC(2026, 9, 15, 16, 0, 0);

function series(values: (number | null)[], start = START): OutlookPoint[] {
  return values.map((v, i) => ({ time: start + i * HOUR, usAqi: v, pm25: v == null ? null : v / 2 }));
}

describe('buildChart', () => {
  it('needs at least two readings', () => {
    expect(buildChart(series([80]), 'Asia/Singapore', START, 600)).toBeNull();
    expect(buildChart(series([null, null, 80]), 'Asia/Singapore', START, 600)).toBeNull();
  });

  it('always shows the scale up to Unhealthy, and grows to fit a peak', () => {
    const calm = buildChart(series([40, 60, 120]), 'Asia/Singapore', START, 600)!;
    expect(calm.yTicks.map(t => t.label)).toEqual(['0', '50', '100', '150', '200']);
    expect(calm.bands.map(b => b.id)).toEqual(['good', 'moderate', 'sensitive', 'unhealthy']);

    const smoky = buildChart(series([100, 260, 180]), 'Asia/Singapore', START, 600)!;
    expect(smoky.yTicks.map(t => t.label)).toContain('300');
    expect(smoky.bands.map(b => b.id)).toContain('very-unhealthy');
  });

  it('keeps scaling past 500 for extreme smoke, with Hazardous up to the top', () => {
    const m = buildChart(series([320, 622, 957]), 'Asia/Singapore', START, 600)!;
    const labels = m.yTicks.map(t => t.label);

    expect(labels).toContain('500');
    expect(labels[labels.length - 1]).toBe('1000');
    const top = m.bands[m.bands.length - 1];
    expect(top.id).toBe('hazardous');
    expect(top.y).toBeCloseTo(m.top, 5);
    // Every point sits below the top edge rather than being clamped to it.
    expect(Math.min(...m.plot.map(p => p.y!))).toBeGreaterThan(m.top);
  });

  it('drops y-axis labels that would collide', () => {
    const m = buildChart(series([100, 957]), 'Asia/Singapore', START, 600)!;
    for (let i = 1; i < m.yTicks.length; i++) {
      expect(m.yTicks[i - 1].pos - m.yTicks[i].pos).toBeGreaterThanOrEqual(13);
    }
    expect(m.yTicks[0].label).toBe('0');
  });

  it('breaks the line at missing hours rather than bridging them', () => {
    const m = buildChart(series([50, 60, null, 70, 80]), 'Asia/Singapore', START + 10 * HOUR, 600)!;
    expect(m.pastPath.match(/M/g)?.length).toBe(2);
  });

  it('splits history from forecast at "now" and finds the forecast peak', () => {
    const values = Array.from({ length: 48 }, (_, i) => (i === 30 ? 220 : 90));
    const now = START + 12 * HOUR;
    const m = buildChart(series(values), 'Asia/Singapore', now, 600)!;

    expect(m.nowX).not.toBeNull();
    expect(m.pastPath).toMatch(/^M/);
    expect(m.forecastPath).toMatch(/^M/);
    expect(m.peak?.usAqi).toBe(220);
    expect(m.peak?.time).toBe(START + 30 * HOUR);
    expect(m.current?.time).toBe(now);
  });

  it('labels local midnights on the time axis', () => {
    const m = buildChart(series(Array(72).fill(50)), 'Asia/Singapore', START, 600)!;
    // Points start at midnight, so the next two midnights get ticks.
    expect(m.xTicks.length).toBe(2);
    expect(m.xTicks[0].label).toContain('17');
  });

  it('keeps every point inside the plot area', () => {
    const m = buildChart(series([0, 499, 250, 600]), 'Asia/Singapore', START, 400)!;
    for (const p of m.plot) {
      expect(p.x).toBeGreaterThanOrEqual(m.left);
      expect(p.x).toBeLessThanOrEqual(m.right);
      expect(p.y!).toBeGreaterThanOrEqual(m.top);
      expect(p.y!).toBeLessThanOrEqual(m.bottom);
    }
  });
});

describe('AqiChartComponent', () => {
  let fixture: ComponentFixture<AqiChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AqiChartComponent],
      providers: [provideZonelessChangeDetection()]
    });
    fixture = TestBed.createComponent(AqiChartComponent);
    fixture.componentRef.setInput('timeZone', 'Asia/Singapore');
  });

  it('draws the chart with an accessible summary', async () => {
    const values = Array.from({ length: 48 }, (_, i) => (i === 30 ? 220 : 90));
    fixture.componentRef.setInput('points', series(values));
    fixture.componentRef.setInput('now', START + 12 * HOUR);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    const svg = el.querySelector('svg[role="img"]')!;
    expect(svg).toBeTruthy();
    const title = el.querySelector(`#${svg.getAttribute('aria-labelledby')}`)!;
    expect(title.textContent).toContain('Forecast peak 220 (very unhealthy)');
    expect(el.querySelector('.chart__summary')?.textContent).toContain('Now 90 (moderate)');
    expect(el.querySelectorAll('.band').length).toBeGreaterThan(0);
  });

  it('says so when there is not enough data', async () => {
    fixture.componentRef.setInput('points', series([null, 50]));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Not enough hourly data');
  });
});

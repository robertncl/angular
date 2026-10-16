import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  signal,
  viewChild
} from '@angular/core';

import {
  AQI_BREAKPOINTS,
  AQI_CATEGORIES,
  AqiCategoryId,
  OutlookPoint,
  aqiCategory,
  formatAqi,
  formatConcentration,
  safeFormatter
} from './aqi';

const HEIGHT = 200;
const PAD = { top: 10, right: 10, bottom: 24, left: 38 };
/** Closest two y-axis labels may sit, in px, before the upper one is dropped. */
const MIN_TICK_GAP = 13;

interface Band {
  id: AqiCategoryId;
  y: number;
  height: number;
}

interface Tick {
  pos: number;
  label: string;
}

interface PlotPoint extends OutlookPoint {
  x: number;
  y: number | null;
}

export interface ChartModel {
  width: number;
  height: number;
  /** Plot-area edges, inside the axis labels. */
  left: number;
  right: number;
  top: number;
  bottom: number;
  bands: Band[];
  yTicks: Tick[];
  xTicks: Tick[];
  pastPath: string;
  forecastPath: string;
  nowX: number | null;
  plot: PlotPoint[];
  peak: PlotPoint | null;
  current: PlotPoint | null;
}

/**
 * Pure geometry for the outlook chart, kept outside the component so it can
 * be unit-tested without rendering. Returns null when there is too little
 * data to draw a meaningful line.
 */
export function buildChart(
  points: readonly OutlookPoint[],
  timeZone: string,
  now: number,
  width: number
): ChartModel | null {
  const valid = points.filter(p => p.usAqi != null);
  if (valid.length < 2 || width < PAD.left + PAD.right + 20) return null;

  const t0 = points[0].time;
  const t1 = points[points.length - 1].time;
  const span = Math.max(1, t1 - t0);
  const maxAqi = Math.max(...valid.map(p => p.usAqi as number));
  // Always show up to "Unhealthy" so a clean week still reads as clean, then
  // grow to fit the peak — in 50s, or 100s once smoke pushes past 500.
  const step = maxAqi > 480 ? 100 : 50;
  const yMax = Math.max(200, Math.ceil((maxAqi + 20) / step) * step);

  const left = PAD.left;
  const right = width - PAD.right;
  const top = PAD.top;
  const bottom = HEIGHT - PAD.bottom;
  const x = (t: number) => left + ((t - t0) / span) * (right - left);
  const y = (v: number) => bottom - (Math.min(v, yMax) / yMax) * (bottom - top);

  // Band edges: 0, 50 … 300, then Hazardous all the way to the top.
  const edges = [0, ...AQI_BREAKPOINTS, Math.max(500, yMax)];
  const bands: Band[] = [];
  for (let i = 0; i < AQI_CATEGORIES.length && edges[i] < yMax; i++) {
    const yTop = y(Math.min(edges[i + 1], yMax));
    bands.push({ id: AQI_CATEGORIES[i].id, y: yTop, height: y(edges[i]) - yTop });
  }

  // Gridlines at the category edges (plus the top when it's past 500),
  // dropping any that would sit too close to the one below to label.
  const yTicks: Tick[] = [];
  for (const v of [0, ...AQI_BREAKPOINTS, 500, ...(yMax > 500 ? [yMax] : [])]) {
    if (v > yMax) continue;
    const pos = y(v);
    const below = yTicks[yTicks.length - 1];
    if (!below || below.pos - pos >= MIN_TICK_GAP) yTicks.push({ pos, label: String(v) });
  }

  const hourOf = safeFormatter(timeZone, { hour: '2-digit', hourCycle: 'h23' });
  const dayLabel = safeFormatter(timeZone, { weekday: 'short', day: 'numeric' });
  const xTicks: Tick[] = points
    .filter(p => Number(hourOf.format(p.time)) === 0 && p.time > t0)
    .map(p => ({ pos: x(p.time), label: dayLabel.format(p.time) }));

  const plot: PlotPoint[] = points.map(p => ({ ...p, x: x(p.time), y: p.usAqi == null ? null : y(p.usAqi) }));
  const lastPast = findLastIndex(plot, p => p.time <= now);
  const pastPath = linePath(plot.slice(0, lastPast + 1));
  const forecastPath = linePath(plot.slice(Math.max(lastPast, 0)));

  const forecast = plot.filter(p => p.time >= now && p.usAqi != null);
  const peak = forecast.reduce<PlotPoint | null>((best, p) => (best == null || (p.usAqi as number) > (best.usAqi as number) ? p : best), null);
  const current = lastPast >= 0 ? [...plot.slice(0, lastPast + 1)].reverse().find(p => p.usAqi != null) ?? null : null;

  return {
    width,
    height: HEIGHT,
    left,
    right,
    top,
    bottom,
    bands,
    yTicks,
    xTicks,
    pastPath,
    forecastPath,
    nowX: now >= t0 && now <= t1 ? x(now) : null,
    plot,
    peak,
    current
  };
}

/** Breaks the line at gaps instead of interpolating across missing hours. */
function linePath(points: readonly PlotPoint[]): string {
  let d = '';
  let pen = false;
  for (const p of points) {
    if (p.y == null) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    pen = true;
  }
  return d;
}

function findLastIndex<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) if (predicate(items[i])) return i;
  return -1;
}

let nextId = 0;

@Component({
  selector: 'app-aqi-chart',
  templateUrl: './aqi-chart.component.html',
  styleUrl: './aqi-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AqiChartComponent {
  readonly points = input.required<readonly OutlookPoint[]>();
  readonly timeZone = input.required<string>();
  /** Injectable clock, so tests don't depend on the wall time. */
  readonly now = input<number>(Date.now());

  readonly titleId = `aqi-chart-title-${nextId++}`;
  private readonly width = signal(640);
  private readonly frame = viewChild<ElementRef<HTMLElement>>('frame');
  protected readonly hoverIndex = signal<number | null>(null);

  readonly model = computed(() => buildChart(this.points(), this.timeZone(), this.now(), this.width()));

  private readonly whenFormat = computed(() =>
    safeFormatter(this.timeZone(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  );

  readonly summary = computed(() => {
    const m = this.model();
    if (!m) return '';
    const parts: string[] = [];
    if (m.current) parts.push(`Now ${describe(m.current.usAqi)}.`);
    if (m.peak) parts.push(`Forecast peak ${describe(m.peak.usAqi)} on ${this.whenFormat().format(m.peak.time)}.`);
    return parts.join(' ');
  });

  protected readonly hovered = computed(() => {
    const i = this.hoverIndex();
    const m = this.model();
    if (i == null || !m) return null;
    const p = m.plot[i];
    return p && p.y != null ? p : null;
  });

  protected readonly readout = computed(() => {
    const p = this.hovered();
    if (!p) return '';
    return `${this.whenFormat().format(p.time)} · US AQI ${describe(p.usAqi)} · PM2.5 ${formatConcentration(p.pm25)} µg/m³`;
  });

  constructor() {
    // Size the SVG in real pixels so tick labels stay legible on phones,
    // instead of scaling one fixed viewBox down to an unreadable size.
    effect(onCleanup => {
      const el = this.frame()?.nativeElement;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(entries => {
        const w = Math.round(entries[0]?.contentRect.width ?? 0);
        if (w > 0 && w !== this.width()) this.width.set(w);
      });
      observer.observe(el);
      onCleanup(() => observer.disconnect());
    });
  }

  protected onPointerMove(event: PointerEvent): void {
    const m = this.model();
    const target = event.currentTarget as Element | null;
    if (!m || !target || m.plot.length < 2) return;
    const rect = target.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * m.width;
    const first = m.plot[0].x;
    const last = m.plot[m.plot.length - 1].x;
    const ratio = (px - first) / Math.max(1, last - first);
    const index = Math.round(ratio * (m.plot.length - 1));
    this.hoverIndex.set(Math.min(m.plot.length - 1, Math.max(0, index)));
  }
}

function describe(aqi: number | null): string {
  const cat = aqiCategory(aqi);
  return cat ? `${formatAqi(aqi)} (${cat.label.toLowerCase()})` : formatAqi(aqi);
}

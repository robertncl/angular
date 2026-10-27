import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import * as L from 'leaflet';

import { CityReading } from './air-quality.service';
import { aqiCategory, formatAqi } from './aqi';
import { placeLabel } from './cities';
import { I18n } from '../i18n/i18n';

/**
 * OpenStreetMap's standard tiles: no key, but the usage policy applies —
 * visible attribution, a Referer from web pages (so keep Referrer-Policy at
 * strict-origin-when-cross-origin or looser) and no bulk downloading.
 * https://operations.osmfoundation.org/policies/tiles/
 * For heavy traffic, switch this URL to a hosted provider and update img-src
 * in the CSP (src/index.html and security-headers.conf).
 */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
/** The licence line itself; the lead-in word ("Base map") is translated. */
const OSM_CREDIT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Roughly Myanmar to Timor-Leste, Sumatra to the Philippines. */
const REGION_BOUNDS: L.LatLngBoundsExpression = [
  [-9.5, 95],
  [23, 127]
];
const MAX_BOUNDS: L.LatLngBoundsExpression = [
  [-25, 75],
  [38, 150]
];
const FIT_PADDING: L.PointExpression = [12, 12];
/** Below this zoom, 39 numbered pills overlap; draw colour dots instead. */
const PILL_ZOOM = 6;

@Component({
  selector: 'app-haze-map',
  template: `<div #mapEl class="haze-map" role="group" [attr.aria-label]="t().mapLabel"></div>`,
  styleUrl: './haze-map.component.css',
  // Leaflet builds marker and tooltip DOM itself, outside Angular's template,
  // so emulated encapsulation can't reach it. Rules are scoped under the
  // component's own classes instead.
  encapsulation: ViewEncapsulation.None,
  host: { class: 'haze-map-host' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HazeMapComponent {
  readonly readings = input.required<readonly CityReading[]>();
  readonly selectedId = input<string | null>(null);
  readonly citySelected = output<string>();

  private readonly mapEl = viewChild.required<ElementRef<HTMLElement>>('mapEl');
  private readonly destroyRef = inject(DestroyRef);
  private readonly ready = signal(false);
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private attribution = '';

  private map?: L.Map;
  private markerLayer?: L.LayerGroup;
  private readonly markers = new Map<string, { marker: L.Marker; el: HTMLElement }>();

  constructor() {
    afterNextRender(() => this.initMap());

    effect(() => {
      const readings = this.readings();
      // Tooltips are built as DOM, so a language change rebuilds them too.
      this.t();
      if (!this.ready()) return;
      this.renderMarkers(readings);
      // Re-apply the current highlight to the new markers without panning;
      // untracked so a selection change doesn't rebuild every marker.
      this.highlight(untracked(this.selectedId), false);
    });

    effect(() => {
      const id = this.selectedId();
      if (!this.ready()) return;
      this.highlight(id, true);
    });

    effect(() => {
      const credit = `${this.t().mapAttribution}: ${OSM_CREDIT}`;
      if (!this.ready() || !this.map) return;
      // Static strings only (messages and the constant above), never API data.
      this.map.attributionControl.removeAttribution(this.attribution).addAttribution(credit);
      this.attribution = credit;
    });
  }

  private initMap(): void {
    const container = this.mapEl().nativeElement;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      // Fractional zoom lets the whole region fit any screen width exactly;
      // the +/- buttons still step one level at a time.
      zoomSnap: 0.25,
      zoomDelta: 1,
      // Don't hijack page scrolling; zoom with the buttons, keyboard or a pinch.
      scrollWheelZoom: false,
      minZoom: 3,
      maxZoom: 11,
      maxBounds: MAX_BOUNDS,
      maxBoundsViscosity: 0.8,
      zoomAnimation: !reduceMotion,
      fadeAnimation: !reduceMotion,
      markerZoomAnimation: !reduceMotion
    });
    map.attributionControl.setPrefix(false);
    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);
    this.markerLayer = L.layerGroup().addTo(map);

    const syncMarkerSize = () => container.classList.toggle('is-compact', map.getZoom() < PILL_ZOOM);
    map.on('zoomend', syncMarkerSize);
    map.fitBounds(REGION_BOUNDS, { padding: FIT_PADDING });
    syncMarkerSize();

    // Keep the whole region in view when the width changes (rotation, a
    // resized window), until the user pans or zooms for themselves. Height-only
    // changes just resize: refitting on them would re-zoom the map whenever a
    // mobile address bar slides away mid-scroll.
    let userMoved = false;
    let fittedWidth = container.clientWidth;
    const markUserMoved = () => (userMoved = true);
    for (const type of ['pointerdown', 'wheel', 'keydown'] as const) container.addEventListener(type, markUserMoved, { passive: true });
    const resize = new ResizeObserver(() => {
      map.invalidateSize();
      const width = container.clientWidth;
      if (!userMoved && width !== fittedWidth) {
        fittedWidth = width;
        map.fitBounds(REGION_BOUNDS, { padding: FIT_PADDING, animate: false });
      }
    });
    resize.observe(container);

    this.destroyRef.onDestroy(() => {
      resize.disconnect();
      map.remove();
    });

    this.map = map;
    this.ready.set(true);
  }

  private renderMarkers(readings: readonly CityReading[]): void {
    this.markerLayer?.clearLayers();
    this.markers.clear();

    for (const r of readings) {
      const cat = aqiCategory(r.usAqi);
      const t = this.i18n.t();
      // Built with textContent rather than an HTML string so nothing from the
      // API ever reaches innerHTML.
      const el = document.createElement('span');
      el.className = 'haze-marker';
      el.dataset['cat'] = cat?.id ?? 'none';
      el.textContent = formatAqi(r.usAqi);

      const tip = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = this.i18n.cityName(r.city.id, r.city.name);
      tip.append(
        name,
        ` · ${placeLabel(r.city, t)}`,
        document.createElement('br'),
        `US AQI ${formatAqi(r.usAqi)}${cat ? ` — ${t.categories[cat.id].short}` : ''}`
      );

      const marker = L.marker([r.city.lat, r.city.lon], {
        icon: L.divIcon({ html: el, className: 'haze-marker-anchor', iconSize: [0, 0], iconAnchor: [0, 0] }),
        // The city list is the keyboard route to the same data; 39 extra tab
        // stops inside the map would just be in the way.
        keyboard: false,
        riseOnHover: true
      })
        .bindTooltip(tip, { direction: 'top', offset: [0, -12], className: 'haze-tooltip' })
        .on('click', () => this.citySelected.emit(r.city.id));

      marker.addTo(this.markerLayer!);
      this.markers.set(r.city.id, { marker, el });
    }
  }

  private highlight(id: string | null, pan: boolean): void {
    for (const [cityId, { marker, el }] of this.markers) {
      const selected = cityId === id;
      el.classList.toggle('is-selected', selected);
      marker.setZIndexOffset(selected ? 1000 : 0);
    }
    const target = id ? this.markers.get(id) : undefined;
    if (pan && target && this.map) {
      const animate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.map.panInside(target.marker.getLatLng(), { padding: [48, 48], animate });
    }
  }
}

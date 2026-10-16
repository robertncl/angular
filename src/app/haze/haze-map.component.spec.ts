import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type * as L from 'leaflet';

import { CityReading } from './air-quality.service';
import { CITY_BY_ID } from './cities';
import { HazeMapComponent } from './haze-map.component';

function reading(id: string, usAqi: number | null): CityReading {
  return {
    city: CITY_BY_ID.get(id)!,
    time: Date.now(),
    timeZone: 'Asia/Singapore',
    usAqi,
    pm25: null,
    pm10: null,
    carbonMonoxide: null,
    nitrogenDioxide: null,
    ozone: null,
    aerosolOpticalDepth: null,
    windSpeed: null,
    windFrom: null
  };
}

describe('HazeMapComponent', () => {
  let fixture: ComponentFixture<HazeMapComponent>;
  let host: HTMLElement;

  const readings = [reading('singapore', 164), reading('pekanbaru', 245), reading('bangkok', null)];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HazeMapComponent],
      providers: [provideZonelessChangeDetection()]
    });
    fixture = TestBed.createComponent(HazeMapComponent);
    host = fixture.nativeElement;
    host.style.blockSize = '400px';
    host.style.inlineSize = '600px';
    document.body.appendChild(host);
    fixture.componentRef.setInput('readings', readings);
    fixture.componentRef.setInput('selectedId', 'singapore');
    await fixture.whenStable();
  });

  afterEach(() => host.remove());

  function markers(): HTMLElement[] {
    return Array.from(host.querySelectorAll<HTMLElement>('.haze-marker'));
  }

  it('draws one labelled, colour-coded marker per city', () => {
    expect(markers().map(m => m.textContent)).toEqual(['164', '245', '–']);
    expect(markers().map(m => m.dataset['cat'])).toEqual(['unhealthy', 'very-unhealthy', 'none']);
  });

  it('shows colour dots at the regional zoom and keeps the selected city numbered', () => {
    // The whole region fits well below the zoom where numbered pills appear.
    expect(host.querySelector('.haze-map')!.classList).toContain('is-compact');
    const selected = host.querySelector<HTMLElement>('.haze-marker.is-selected')!;
    expect(getComputedStyle(selected).fontSize).not.toBe('0px');
    const other = markers().find(m => !m.classList.contains('is-selected'))!;
    expect(getComputedStyle(other).fontSize).toBe('0px');
  });

  it('highlights the selected city', async () => {
    expect(markers()[0].classList).toContain('is-selected');

    fixture.componentRef.setInput('selectedId', 'pekanbaru');
    await fixture.whenStable();

    expect(markers()[0].classList).not.toContain('is-selected');
    expect(markers()[1].classList).toContain('is-selected');
  });

  it('emits the city when a marker is clicked', () => {
    const picked: string[] = [];
    fixture.componentInstance.citySelected.subscribe(id => picked.push(id));

    markers()[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(picked).toEqual(['pekanbaru']);
  });

  it('redraws markers when readings change', async () => {
    fixture.componentRef.setInput('readings', [reading('singapore', 42)]);
    await fixture.whenStable();

    expect(markers().map(m => m.textContent)).toEqual(['42']);
    expect(markers()[0].dataset['cat']).toBe('good');
    expect(markers()[0].classList).toContain('is-selected');
  });

  /** ResizeObserver callbacks run during the next rendering steps. */
  async function nextFrames(): Promise<void> {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function leafletMap(): L.Map {
    return (fixture.componentInstance as unknown as { map: L.Map }).map;
  }

  it('refits the region when the map narrows, but not when only its height changes', async () => {
    const map = leafletMap();
    const zoom = map.getZoom();

    // e.g. a mobile address bar sliding away mid-scroll
    host.style.blockSize = '300px';
    await nextFrames();
    expect(map.getZoom()).toBe(zoom);

    // e.g. rotating a phone
    host.style.inlineSize = '320px';
    await nextFrames();
    expect(map.getZoom()).toBeLessThan(zoom);
  });

  it('leaves the view alone once the user has moved the map', async () => {
    const map = leafletMap();
    host.querySelector('.haze-map')!.dispatchEvent(new Event('pointerdown'));
    map.setZoom(7, { animate: false });

    host.style.inlineSize = '320px';
    await nextFrames();

    expect(map.getZoom()).toBe(7);
  });

  it('renders city names in tooltips as text, never as HTML', async () => {
    const hostile = { ...reading('singapore', 50), city: { ...CITY_BY_ID.get('singapore')!, name: '<img src=x onerror=alert(1)>' } };
    fixture.componentRef.setInput('readings', [hostile]);
    await fixture.whenStable();

    // Leaflet only builds tooltip DOM once the marker is hovered.
    markers()[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    const tooltip = host.querySelector('.haze-tooltip');
    expect(tooltip?.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(host.querySelector('img[src="x"]')).toBeNull();
  });
});

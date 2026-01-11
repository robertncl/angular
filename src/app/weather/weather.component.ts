import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherService, GeocodingResult } from '../weather.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';

declare var L: any;

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.css'
})
export class WeatherComponent implements OnInit, OnDestroy {
  map: any;
  marker: any;
  searchQuery: string = '';
  searchResults: GeocodingResult['results'] = [];
  showSearchResults: boolean = false;
  weatherData: any = null;
  loading: boolean = false;
  error: string = '';
  currentLocation: { lat: number; lng: number; name: string } = { lat: 51.505, lng: -0.09, name: 'London' };

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private weatherService: WeatherService) {}

  ngOnInit() {
    this.initMap();
    this.setupSearch();
    this.loadWeather(this.currentLocation.lat, this.currentLocation.lng);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  initMap() {
    // Wait a bit to ensure DOM is ready
    setTimeout(() => {
      this.map = L.map('map', {
        center: [this.currentLocation.lat, this.currentLocation.lng],
        zoom: 10
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      this.marker = L.marker([this.currentLocation.lat, this.currentLocation.lng])
        .addTo(this.map)
        .bindPopup(this.currentLocation.name);

      this.map.on('click', (e: any) => {
        this.onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }, 100);
  }

  setupSearch() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (query.trim().length >= 2) {
            return this.weatherService.searchLocation(query);
          }
          return of({ results: [] } as GeocodingResult);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (results) => {
          this.searchResults = results.results || [];
          this.showSearchResults = this.searchResults.length > 0;
        },
        error: (err) => {
          console.error('Search error:', err);
          this.searchResults = [];
          this.showSearchResults = false;
        }
      });
  }

  onSearchInput() {
    if (this.searchQuery.trim().length >= 2) {
      this.searchSubject.next(this.searchQuery);
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
    }
  }

  selectLocation(location: GeocodingResult['results'][0]) {
    this.currentLocation = {
      lat: location.latitude,
      lng: location.longitude,
      name: `${location.name}, ${location.country}`
    };
    this.searchQuery = this.currentLocation.name;
    this.searchResults = [];
    this.showSearchResults = false;
    this.updateMap();
    this.loadWeather(this.currentLocation.lat, this.currentLocation.lng);
  }

  onMapClick(lat: number, lng: number) {
    this.currentLocation = { lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    this.updateMap();
    this.loadWeather(lat, lng);
  }

  updateMap() {
    if (this.map && this.marker) {
      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 10);
      this.marker.setLatLng([this.currentLocation.lat, this.currentLocation.lng]);
      this.marker.setPopupContent(this.currentLocation.name).openPopup();
    }
  }

  loadWeather(lat: number, lng: number) {
    this.loading = true;
    this.error = '';
    this.weatherService.getWeather(lat, lng)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.weatherData = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load weather data. Please try again.';
          this.loading = false;
          console.error('Weather error:', err);
        }
      });
  }

  getWeatherDescription(code: number): string {
    return this.weatherService.getWeatherCodeDescription(code);
  }

  getTemperatureColor(temp: number): string {
    if (temp < 0) return '#4A90E2'; // Cold - blue
    if (temp < 15) return '#7ED321'; // Cool - green
    if (temp < 25) return '#F5A623'; // Warm - orange
    return '#D0021B'; // Hot - red
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weathercode: number[];
  };
}

export interface GeocodingResult {
  results: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    feature_code: string;
    country_code: string;
    admin1_id?: number;
    timezone: string;
    population?: number;
    country_id: number;
    country: string;
    admin1?: string;
  }>;
  generationtime_ms: number;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private weatherApiUrl = 'https://api.open-meteo.com/v1/forecast';
  private geocodingApiUrl = 'https://geocoding-api.open-meteo.com/v1/search';

  constructor(private http: HttpClient) {}

  getWeather(latitude: number, longitude: number): Observable<WeatherData> {
    const params = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current_weather: 'true',
      hourly: 'temperature_2m,weathercode',
      timezone: 'auto'
    };
    return this.http.get<WeatherData>(this.weatherApiUrl, { params });
  }

  searchLocation(query: string): Observable<GeocodingResult> {
    const params = {
      name: query,
      count: '5',
      language: 'en',
      format: 'json'
    };
    return this.http.get<GeocodingResult>(this.geocodingApiUrl, { params });
  }

  getWeatherCodeDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
  }
}

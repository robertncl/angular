# Haze Watch

[![Build, Dockerize, and Deploy](https://github.com/robertncl/angular/actions/workflows/build.yaml/badge.svg)](https://github.com/robertncl/angular/actions/workflows/build.yaml)

Tracks haze across Southeast Asia: modelled US AQI, PM2.5 and haze thickness for 39 cities, with a map, a 6-day
hourly chart (2 days back, 4 ahead), a daily outlook and health advice. The same Angular build ships as a website
(nginx in Docker) and as an Android app (Capacitor).

Cities are weighted toward the region's recurring burning areas: Riau, Jambi and South Sumatra and Kalimantan
(roughly July–October), and northern Thailand, Laos and Myanmar (roughly February–April).

## Data

| What | Source | Notes |
| --- | --- | --- |
| Air quality | [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (CAMS global model, ~45 km grid) | Free, no key, CORS-enabled, so the browser calls it directly. Free tier is for non-commercial use; attribution (CC BY 4.0) is in the page footer. |
| Wind | [Open-Meteo Forecast API](https://open-meteo.com/en/docs) | Optional: if it fails, the page still loads without wind. |
| Map tiles | [OpenStreetMap](https://www.openstreetmap.org/copyright) | Follow the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). For heavy traffic, switch `TILE_URL` in `haze-map.component.ts` to a hosted provider and update the CSP. |

These are **model estimates**, not station readings. The US AQI uses 24-hour averages for particulates, so it lags the
hourly PM2.5 figure. National indices (Singapore PSI, Malaysia API, Indonesia ISPU, Thailand AQI) are calculated
differently. The page links to the official sources.

Readings refresh every 30 minutes while the page is visible. A selected city is kept in the URL (`/?city=pekanbaru`) and
remembered in `localStorage`.

## Code map

```
src/app/haze/
  cities.ts                  city list (ids double as ?city= values)
  aqi.ts                     US AQI bands, advice, formatting, daily summaries
  air-quality.service.ts     Open-Meteo calls; validates every number from the API
  haze-dashboard.component   the page: overview, map, detail, city list
  haze-map.component         Leaflet map, lazy-loaded with @defer
  aqi-chart.component        SVG hourly chart, sized in real pixels
```

The app is zoneless (`provideZonelessChangeDetection`): signals drive change detection, and `zone.js` isn't installed.

## Development

```bash
npm ci
npm start          # http://localhost:4200
npm run build      # dist/angular/browser
npm test           # Karma + headless Chrome (set CHROME_BIN if Chrome isn't on PATH)
```

### Docker (production web)

```bash
docker build -t haze-watch .
docker run -p 8080:8080 haze-watch
```

nginx serves the bundle as an unprivileged user, with security headers from `security-headers.conf`.

### Android

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug    # needs JDK 21 and the Android SDK
```

## Content Security Policy

The policy lives in two places that must stay in sync: the `<meta>` tag in `src/index.html` (used by the Capacitor
WebView and any static host) and `security-headers.conf` (nginx, which adds `frame-ancestors`). The page has no inline
scripts. For the same reason critical-CSS inlining is turned off in `angular.json`: it injects an inline script to load
the stylesheet, and `script-src 'self'` blocks it. If you add a third-party origin, add it to both policies.

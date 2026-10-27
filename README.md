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

Open-Meteo's current values step on the UTC hour, so the page fetches 1–3 minutes after each hour turns (spread so
open tabs don't all call at once), catches up as soon as a hidden tab or backgrounded app is visible again, backs off
on errors (1, 2, 4 … 15 minutes) and retries at once when the browser comes back online. A selected city is kept in
the URL (`/?city=pekanbaru`) and remembered in `localStorage`.

## Code map

```
src/app/haze/
  cities.ts                  city list (ids double as ?city= values)
  aqi.ts                     US AQI bands, advice, formatting, daily summaries
  air-quality.service.ts     Open-Meteo calls; validates every number from the API
  haze-dashboard.component   the page: overview, map, detail, city list
  haze-map.component         Leaflet map, lazy-loaded with @defer
  aqi-chart.component        SVG hourly chart, sized in real pixels
src/app/i18n/
  i18n.ts                    language detection, lazy loading, the t() signal
  messages/                  one file per language; en.ts defines the shape
```

The app is zoneless (`provideZonelessChangeDetection`): signals drive change detection, and `zone.js` isn't installed.

## Languages

English, 简体中文, Bahasa Indonesia, Bahasa Melayu, ไทย, Tiếng Việt and Filipino: the languages of the countries most
affected by the region's haze. The page picks the reader's browser language on first visit, remembers a choice made
in the top-bar picker, and switches in place without a reload.

Strings live in `src/app/i18n/messages/`. `en.ts` is the source and defines the `Messages` type, so a translation that
misses a key or a parameter doesn't compile. Strings that take values are functions, which leaves word order and
plurals to each language. English ships in the main bundle; each other language is its own lazy chunk (about 3 kB
compressed), loaded by an app initializer before first render so there's no flash of English. Dates and numbers use
the language's locale (`8,4` and `1.466` in Indonesian). City names are translated where the script differs (Chinese,
Thai) or a common exonym exists (Vietnamese); untranslated names fall back to English.

To add a language: copy `en.ts`, translate it, and add it to `LANGUAGES` and `LOADERS` in `src/app/i18n/i18n.ts`.
Translations were written without native-speaker review; health advice in particular should be checked before
relying on it.

## Design

The UI follows the Modernist design system: Swiss layout on a flush-left 12-column grid (max 1280px, 24px
gutters), black on white, and rules instead of boxes. Sections open on a 2px ink rule and rows are separated by 1px
hairlines. There are no cards, shadows or rounded corners. Colour has two jobs: blue (`--blue`) means act or "you are
here" (links, focus, the selected city), and the data ramp (`--data-1` to `--data-6`) means severity. Red (`--red`)
is for errors only. The page is light-only. The tokens are custom properties at the top of `src/styles.css`, which
also holds the shared controls (`.button`, `.field`, `.alert`, `.link-button`, `.label`).

US AQI bands map onto the data ramp, Good (`--data-1`, white) to Hazardous (`--data-6`, ink). Lightness falls at
every step, so neighbouring bands differ in lightness, not just hue. Every AQI fill has a 1px ink edge, because Good
is the same white as the page, and every fill also prints its number and label.

Type is Archivo, with JetBrains Mono for codes, loaded from Google Fonts in `src/index.html`. Production builds
inline the font stylesheet. Offline (for example in the Android app with no connection) the stacks fall back to
Helvetica and Arial.

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
the stylesheet, and `script-src 'self'` blocks it. Google Fonts needs `https://fonts.googleapis.com` in
`style-src` and `https://fonts.gstatic.com` in `font-src`. If you add a third-party origin, add it to both policies.

/**
 * English: the source of truth for every user-facing string. Its shape is the
 * `Messages` type, so a translation that misses a key or a parameter doesn't
 * compile. Strings that take values are functions; word order and plurals are
 * each language's own business.
 */
export const en = {
  appName: 'Haze Watch',
  tagline: 'Southeast Asia air quality',
  pageTitle: 'Haze Watch · Southeast Asia air quality',
  cityPageTitle: (city: string, aqi: string, category: string) => `${city}: US AQI ${aqi} (${category}) · Haze Watch`,
  skipToContent: 'Skip to main content',
  language: 'Language',
  refresh: 'Refresh',
  dataFor: 'Data for',
  checked: (time: string) => `checked ${time}`,
  loadingReadings: 'Loading readings…',
  tryAgain: 'Try again',
  noData: 'No data',

  loadErrorTitle: 'Couldn’t load new readings',
  showingReadingsFor: (time: string) => `Showing readings for ${time}.`,
  errors: {
    offline: 'Could not reach the air-quality service. Check your connection and try again.',
    rateLimited: 'The air-quality service is rate-limiting requests. Try again in a few minutes.',
    api: (detail: string) => `The air-quality service returned an error: ${detail}`,
    unexpected: 'Something went wrong while loading air-quality data.'
  },

  overviewLabel: 'Regional overview',
  overviewMeta: (cities: number) => `${cities} cities · US AQI`,
  worstRightNow: 'Worst right now:',
  loadingOverview: (cities: number) => `Loading the latest readings for ${cities} cities…`,
  readingsUnavailable: 'Air-quality readings are unavailable',
  headlineNone: 'No readings available right now',
  headlineUnhealthy: (n: number, total: number) => `Unhealthy air in ${n} of ${total} cities`,
  headlineSensitive: (n: number, total: number) => `Unhealthy for sensitive groups in ${n} of ${total} cities`,
  headlineClear: (total: number) => `Good or moderate air in all ${total} cities`,
  legendLabel: 'Number of cities in each US AQI category',
  cityCount: (n: number): string => (n === 1 ? ' city' : ' cities'),

  mapTitle: 'Map · US AQI by city',
  mapLabel: 'Map of US AQI by city',
  mapLoading: 'Loading map…',
  mapHint: 'Markers show US AQI. Select one, or a city in the list, for details and a 4-day forecast.',
  mapAttribution: 'Base map',

  selectedCity: 'Selected city',
  modelEstimate: (time: string) =>
    `Model estimate for ${time}. The AQI averages particles over the past 24 hours, so it can stay high for a while after the air clears.`,
  healthAdvice: 'Health advice',
  pm25ThisHour: 'PM2.5 this hour',
  whoGuideline: (value: number) => `WHO 24-hour guideline: ${value}`,
  haze: 'Haze',
  aerosolOpticalDepth: (value: string) => `Aerosol optical depth ${value}`,
  wind: 'Wind',
  windNote: 'Arrow shows where smoke is drifting',
  windUnavailable: 'Not available',
  windCalm: 'Calm',
  windFrom: (kmh: number, direction: string) => `${kmh} km/h from the ${direction}`,
  ozone: 'Ozone',
  carbonMonoxide: 'Carbon monoxide',
  noReading: 'No reading is available for this city right now.',

  dailyOutlook: 'Daily outlook',
  localTimeIn: (city: string) => `${city} local time`,
  day: 'Day',
  peakUsAqi: 'Peak US AQI',
  peakPm25: 'Peak PM2.5',
  today: 'Today',
  tomorrow: 'Tomorrow',
  forecastError: 'Couldn’t load the forecast',

  chartTitle: 'Hourly US AQI',
  chartRange: 'Past 2 days and 4-day forecast.',
  chartAriaTitle: 'Hourly US AQI chart.',
  chartNow: (reading: string) => `Now ${reading}.`,
  chartForecastPeak: (reading: string, when: string) => `Forecast peak ${reading} on ${when}.`,
  chartNowLabel: 'Now',
  chartPeakLabel: (aqi: string, when: string) => `Peak ${aqi} · ${when}`,
  chartHint: 'Point at the chart to read an hour.',
  chartKeyHistory: 'Modelled history',
  chartKeyForecast: 'Forecast',
  chartKeyPeak: 'Forecast peak',
  chartEmpty: 'Not enough hourly data to draw a chart for this city.',

  citiesHeading: 'Cities',
  country: 'Country',
  allCountries: 'All countries',
  sort: 'Sort',
  sortWorst: 'Worst air first',
  sortBest: 'Cleanest air first',
  sortName: 'Name (A–Z)',
  listSummary: (n: number, country: string | null, order: 'worst' | 'best' | 'name') =>
    `${country ? `${n} in ${country}` : `${n} ${n === 1 ? 'city' : 'cities'}`}, ${
      { worst: 'worst air first', best: 'cleanest air first', name: 'A–Z' }[order]
    }`,
  noCitiesMatch: 'No cities match this filter.',

  showing: (city: string, aqi: string, category: string) => `Showing ${city}: US AQI ${aqi}, ${category}.`,
  showingNoData: (city: string) => `Showing ${city}.`,

  aboutHeading: 'About this data',
  aboutModelBefore: 'Readings are ',
  aboutModelStrong: 'model estimates',
  aboutModelAfter:
    ' from the Copernicus Atmosphere Monitoring Service (CAMS), served by Open-Meteo on a grid of roughly 45 km. They capture regional smoke well but can differ from ground stations, especially close to fires or in dense city centres. New values are fetched shortly after each hour while the page is open.',
  aboutIndex:
    'Values use the US EPA Air Quality Index. National indices are calculated differently, so Singapore’s PSI, Malaysia’s API and Indonesia’s ISPU won’t match these numbers exactly.',
  sourcesHeading: 'Official readings and advisories',
  sources: {
    sg: 'Singapore: NEA haze updates',
    my: 'Malaysia: Air Pollutant Index (APIMS)',
    id: 'Indonesia: Air Pollution Standard Index (ISPU)',
    th: 'Thailand: Air4Thai',
    asmc: 'ASEAN Specialised Meteorological Centre: regional haze and hotspots',
    firms: 'NASA FIRMS: active fire map'
  },
  footerDataBefore: 'Air-quality and wind data by ',
  footerDataAfter:
    ' (CC BY 4.0), generated using Copernicus Atmosphere Monitoring Service information. Map data © OpenStreetMap contributors.',
  footerDisclaimer: 'Not an official advisory. Follow the guidance of your local authorities.',

  categories: {
    good: {
      label: 'Good',
      short: 'Good',
      advice: 'Air quality is satisfactory. Enjoy your usual outdoor activities.'
    },
    moderate: {
      label: 'Moderate',
      short: 'Moderate',
      advice:
        'Acceptable for most people. If you are unusually sensitive to air pollution, consider shorter or less intense outdoor activity.'
    },
    sensitive: {
      label: 'Unhealthy for sensitive groups',
      short: 'Sensitive groups',
      advice:
        'Children, older adults, pregnant women and people with heart or lung conditions should cut back on long or strenuous outdoor activity.'
    },
    unhealthy: {
      label: 'Unhealthy',
      short: 'Unhealthy',
      advice:
        'Everyone should reduce long or strenuous outdoor activity; sensitive groups should avoid it. Wear a well-fitted N95 mask if you must be outdoors for long.'
    },
    'very-unhealthy': {
      label: 'Very unhealthy',
      short: 'Very unhealthy',
      advice:
        'Everyone should avoid long or strenuous outdoor activity. Sensitive groups should stay indoors with windows closed and an air purifier running if possible.'
    },
    hazardous: {
      label: 'Hazardous',
      short: 'Hazardous',
      advice:
        'Everyone should avoid all outdoor physical activity and stay indoors with windows closed. Follow the advice of local health authorities.'
    }
  },
  hazeLevels: { clear: 'Clear', light: 'Light haze', hazy: 'Hazy', thick: 'Thick haze' },
  compass: { N: 'N', NE: 'NE', E: 'E', SE: 'SE', S: 'S', SW: 'SW', W: 'W', NW: 'NW' },
  /** The line under a city's name, e.g. "Riau, Indonesia". */
  placeWithArea: (area: string, country: string) => `${area}, ${country}`,
  cityState: 'City-state',
  countries: {
    BN: 'Brunei',
    KH: 'Cambodia',
    ID: 'Indonesia',
    LA: 'Laos',
    MY: 'Malaysia',
    MM: 'Myanmar',
    PH: 'Philippines',
    SG: 'Singapore',
    TH: 'Thailand',
    TL: 'Timor-Leste',
    VN: 'Vietnam'
  },
  /** State/province names keyed by their English name; missing entries fall back to English. */
  areas: {} as Record<string, string>,
  /** City names keyed by city id; missing entries fall back to English. */
  cityNames: {} as Record<string, string>
};

export type Messages = typeof en;

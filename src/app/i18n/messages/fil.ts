import type { Messages } from './en';

/** Filipino */
export const fil: Messages = {
  appName: 'Haze Watch',
  tagline: 'Kalidad ng hangin sa Timog-Silangang Asya',
  pageTitle: 'Haze Watch · Kalidad ng hangin sa Timog-Silangang Asya',
  cityPageTitle: (city, aqi, category) => `${city}: US AQI ${aqi} (${category}) · Haze Watch`,
  skipToContent: 'Lumaktaw sa pangunahing nilalaman',
  language: 'Wika',
  refresh: 'I-refresh',
  dataFor: 'Datos para sa',
  checked: time => `sinuri ${time}`,
  loadingReadings: 'Nilo-load ang mga reading…',
  tryAgain: 'Subukan muli',
  noData: 'Walang datos',

  loadErrorTitle: 'Hindi ma-load ang mga bagong reading',
  showingReadingsFor: time => `Ipinapakita ang mga reading para sa ${time}.`,
  errors: {
    offline: 'Hindi maabot ang serbisyo ng kalidad ng hangin. Suriin ang iyong koneksyon at subukan muli.',
    rateLimited: 'Nililimitahan ng serbisyo ng kalidad ng hangin ang mga request. Subukan muli pagkalipas ng ilang minuto.',
    api: detail => `Nagbalik ng error ang serbisyo ng kalidad ng hangin: ${detail}`,
    unexpected: 'Nagkaproblema habang nilo-load ang datos ng kalidad ng hangin.'
  },

  overviewLabel: 'Pangkalahatang-tanaw ng rehiyon',
  overviewMeta: cities => `${cities} lungsod · US AQI`,
  worstRightNow: 'Pinakamalala ngayon:',
  loadingOverview: cities => `Nilo-load ang pinakabagong reading para sa ${cities} lungsod…`,
  readingsUnavailable: 'Walang available na reading ng kalidad ng hangin',
  headlineNone: 'Wala pang available na reading ngayon',
  headlineUnhealthy: (n, total) => `Hindi malusog ang hangin sa ${n} sa ${total} lungsod`,
  headlineSensitive: (n, total) => `Hindi malusog para sa mga sensitibong grupo sa ${n} sa ${total} lungsod`,
  headlineClear: total => `Mabuti o katamtaman ang hangin sa lahat ng ${total} lungsod`,
  legendLabel: 'Bilang ng lungsod sa bawat kategorya ng US AQI',
  cityCount: () => ' lungsod',

  mapTitle: 'Mapa · US AQI ayon sa lungsod',
  mapLabel: 'Mapa ng US AQI ayon sa lungsod',
  mapLoading: 'Nilo-load ang mapa…',
  mapHint: 'Ipinapakita ng mga marker ang US AQI. Pumili ng isa, o ng lungsod sa listahan, para sa detalye at 4 na araw na forecast.',
  mapAttribution: 'Base map',

  selectedCity: 'Napiling lungsod',
  modelEstimate: time =>
    `Tantiya ng modelo para sa ${time}. Ang AQI ay average ng mga particle sa nakalipas na 24 na oras, kaya maaaring manatili itong mataas nang ilang oras kahit luminis na ang hangin.`,
  healthAdvice: 'Payong pangkalusugan',
  pm25ThisHour: 'PM2.5 ngayong oras',
  whoGuideline: value => `24-oras na gabay ng WHO: ${value}`,
  haze: 'Usok/haze',
  aerosolOpticalDepth: value => `Aerosol optical depth ${value}`,
  wind: 'Hangin',
  windNote: 'Ipinapakita ng arrow kung saan napapadpad ang usok',
  windUnavailable: 'Hindi available',
  windCalm: 'Kalmado',
  windFrom: (kmh, direction) => `${kmh} km/h mula sa ${direction}`,
  ozone: 'Ozone',
  carbonMonoxide: 'Carbon monoxide',
  noReading: 'Walang available na reading para sa lungsod na ito ngayon.',

  dailyOutlook: 'Araw-araw na pananaw',
  localTimeIn: city => `lokal na oras sa ${city}`,
  day: 'Araw',
  peakUsAqi: 'Pinakamataas na US AQI',
  peakPm25: 'Pinakamataas na PM2.5',
  today: 'Ngayon',
  tomorrow: 'Bukas',
  forecastError: 'Hindi ma-load ang forecast',

  chartTitle: 'US AQI kada oras',
  chartRange: 'Nakalipas na 2 araw at 4 na araw na forecast.',
  chartAriaTitle: 'Chart ng US AQI kada oras.',
  chartNow: reading => `Ngayon ${reading}.`,
  chartForecastPeak: (reading, when) => `Pinakamataas sa forecast: ${reading} sa ${when}.`,
  chartNowLabel: 'Ngayon',
  chartPeakLabel: (aqi, when) => `Pinakamataas ${aqi} · ${when}`,
  chartHint: 'Itutok sa chart para mabasa ang bawat oras.',
  chartKeyHistory: 'Nakaraang datos ng modelo',
  chartKeyForecast: 'Forecast',
  chartKeyPeak: 'Pinakamataas sa forecast',
  chartEmpty: 'Kulang ang datos kada oras para makagawa ng chart para sa lungsod na ito.',

  citiesHeading: 'Mga lungsod',
  country: 'Bansa',
  allCountries: 'Lahat ng bansa',
  sort: 'Ayusin',
  sortWorst: 'Pinakamaruming hangin muna',
  sortBest: 'Pinakamalinis na hangin muna',
  sortName: 'Pangalan (A–Z)',
  listSummary: (n, country, order) =>
    `${country ? `${n} sa ${country}` : `${n} lungsod`}, ${{ worst: 'pinakamaruming hangin muna', best: 'pinakamalinis na hangin muna', name: 'A–Z' }[order]}`,
  noCitiesMatch: 'Walang lungsod na tugma sa filter na ito.',

  showing: (city, aqi, category) => `Ipinapakita ang ${city}: US AQI ${aqi}, ${category}.`,
  showingNoData: city => `Ipinapakita ang ${city}.`,

  aboutHeading: 'Tungkol sa datos na ito',
  aboutModelBefore: 'Ang mga reading ay ',
  aboutModelStrong: 'tantiya ng modelo',
  aboutModelAfter:
    ' mula sa Copernicus Atmosphere Monitoring Service (CAMS), na ibinibigay ng Open-Meteo sa grid na humigit-kumulang 45 km. Mahusay nitong naipapakita ang usok sa buong rehiyon, pero maaaring iba ito sa mga ground station, lalo na malapit sa sunog o sa siksik na sentro ng lungsod. Kumukuha ng bagong datos ilang sandali pagkatapos ng bawat oras habang bukas ang pahina.',
  aboutIndex:
    'Gumagamit ang mga value ng US EPA Air Quality Index. Iba ang pagkalkula ng mga pambansang index, kaya hindi eksaktong tutugma rito ang PSI ng Singapore, API ng Malaysia, at ISPU ng Indonesia.',
  sourcesHeading: 'Opisyal na reading at abiso',
  sources: {
    sg: 'Singapore: Mga update sa haze ng NEA',
    my: 'Malaysia: Air Pollutant Index (APIMS)',
    id: 'Indonesia: Air Pollution Standard Index (ISPU)',
    th: 'Thailand: Air4Thai',
    asmc: 'ASEAN Specialised Meteorological Centre: haze at hotspot sa rehiyon',
    firms: 'NASA FIRMS: mapa ng aktibong sunog'
  },
  footerDataBefore: 'Datos ng kalidad ng hangin at hangin mula sa ',
  footerDataAfter:
    ' (CC BY 4.0), ginawa gamit ang impormasyon ng Copernicus Atmosphere Monitoring Service. Datos ng mapa © mga contributor ng OpenStreetMap.',
  footerDisclaimer: 'Hindi ito opisyal na abiso. Sundin ang gabay ng inyong lokal na awtoridad.',

  categories: {
    good: { label: 'Mabuti', short: 'Mabuti', advice: 'Kasiya-siya ang kalidad ng hangin. Ituloy ang karaniwang gawain sa labas.' },
    moderate: {
      label: 'Katamtaman',
      short: 'Katamtaman',
      advice:
        'Katanggap-tanggap para sa karamihan. Kung lubha kang sensitibo sa polusyon sa hangin, paikliin o bawasan ang tindi ng gawain sa labas.'
    },
    sensitive: {
      label: 'Hindi malusog para sa mga sensitibong grupo',
      short: 'Sensitibong grupo',
      advice:
        'Ang mga bata, matatanda, buntis, at may sakit sa puso o baga ay dapat magbawas ng matagal o mabigat na gawain sa labas.'
    },
    unhealthy: {
      label: 'Hindi malusog',
      short: 'Hindi malusog',
      advice:
        'Dapat magbawas ang lahat ng matagal o mabigat na gawain sa labas; dapat itong iwasan ng mga sensitibong grupo. Magsuot ng maayos na nakalapat na N95 mask kung kailangang magtagal sa labas.'
    },
    'very-unhealthy': {
      label: 'Lubhang hindi malusog',
      short: 'Lubhang hindi malusog',
      advice:
        'Dapat iwasan ng lahat ang matagal o mabigat na gawain sa labas. Dapat manatili sa loob ang mga sensitibong grupo, nakasara ang mga bintana, at may gumaganang air purifier kung maaari.'
    },
    hazardous: {
      label: 'Mapanganib',
      short: 'Mapanganib',
      advice:
        'Dapat iwasan ng lahat ang anumang pisikal na gawain sa labas at manatili sa loob nang nakasara ang mga bintana. Sundin ang payo ng lokal na awtoridad pangkalusugan.'
    }
  },
  hazeLevels: { clear: 'Maaliwalas', light: 'Bahagyang haze', hazy: 'Mausok', thick: 'Makapal na haze' },
  compass: {
    N: 'hilaga',
    NE: 'hilagang-silangan',
    E: 'silangan',
    SE: 'timog-silangan',
    S: 'timog',
    SW: 'timog-kanluran',
    W: 'kanluran',
    NW: 'hilagang-kanluran'
  },
  placeWithArea: (area, country) => `${area}, ${country}`,
  cityState: 'Lungsod-estado',
  countries: {
    BN: 'Brunei',
    KH: 'Cambodia',
    ID: 'Indonesia',
    LA: 'Laos',
    MY: 'Malaysia',
    MM: 'Myanmar',
    PH: 'Pilipinas',
    SG: 'Singapore',
    TH: 'Thailand',
    TL: 'Timor-Leste',
    VN: 'Vietnam'
  },
  areas: {},
  cityNames: {}
};

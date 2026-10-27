import type { Messages } from './en';

/** Bahasa Melayu */
export const ms: Messages = {
  appName: 'Haze Watch',
  tagline: 'Kualiti udara Asia Tenggara',
  pageTitle: 'Haze Watch · Kualiti udara Asia Tenggara',
  cityPageTitle: (city, aqi, category) => `${city}: AQI AS ${aqi} (${category}) · Haze Watch`,
  skipToContent: 'Langkau ke kandungan utama',
  language: 'Bahasa',
  refresh: 'Muat semula',
  dataFor: 'Data untuk',
  checked: time => `disemak ${time}`,
  loadingReadings: 'Memuatkan bacaan…',
  tryAgain: 'Cuba lagi',
  noData: 'Tiada data',

  loadErrorTitle: 'Tidak dapat memuatkan bacaan terkini',
  showingReadingsFor: time => `Memaparkan bacaan untuk ${time}.`,
  errors: {
    offline: 'Tidak dapat menghubungi perkhidmatan kualiti udara. Semak sambungan anda dan cuba lagi.',
    rateLimited: 'Perkhidmatan kualiti udara sedang mengehadkan permintaan. Cuba lagi dalam beberapa minit.',
    api: detail => `Perkhidmatan kualiti udara memulangkan ralat: ${detail}`,
    unexpected: 'Berlaku ralat semasa memuatkan data kualiti udara.'
  },

  overviewLabel: 'Gambaran serantau',
  overviewMeta: cities => `${cities} bandar · AQI AS`,
  worstRightNow: 'Paling teruk sekarang:',
  loadingOverview: cities => `Memuatkan bacaan terkini untuk ${cities} bandar…`,
  readingsUnavailable: 'Bacaan kualiti udara tidak tersedia',
  headlineNone: 'Tiada bacaan tersedia buat masa ini',
  headlineUnhealthy: (n, total) => `Udara tidak sihat di ${n} daripada ${total} bandar`,
  headlineSensitive: (n, total) => `Tidak sihat bagi golongan sensitif di ${n} daripada ${total} bandar`,
  headlineClear: total => `Udara baik atau sederhana di semua ${total} bandar`,
  legendLabel: 'Bilangan bandar dalam setiap kategori AQI AS',
  cityCount: () => ' bandar',

  mapTitle: 'Peta · AQI AS mengikut bandar',
  mapLabel: 'Peta AQI AS mengikut bandar',
  mapLoading: 'Memuatkan peta…',
  mapHint: 'Penanda menunjukkan AQI AS. Pilih penanda atau bandar dalam senarai untuk butiran dan ramalan 4 hari.',
  mapAttribution: 'Peta asas',

  selectedCity: 'Bandar dipilih',
  modelEstimate: time =>
    `Anggaran model untuk ${time}. AQI dikira daripada purata zarahan dalam 24 jam lalu, jadi bacaan boleh kekal tinggi untuk seketika selepas udara pulih.`,
  healthAdvice: 'Nasihat kesihatan',
  pm25ThisHour: 'PM2.5 jam ini',
  whoGuideline: value => `Garis panduan WHO 24 jam: ${value}`,
  haze: 'Jerebu',
  aerosolOpticalDepth: value => `Kedalaman optik aerosol ${value}`,
  wind: 'Angin',
  windNote: 'Anak panah menunjukkan arah asap bergerak',
  windUnavailable: 'Tidak tersedia',
  windCalm: 'Tenang',
  windFrom: (kmh, direction) => `${kmh} km/j dari ${direction}`,
  ozone: 'Ozon',
  carbonMonoxide: 'Karbon monoksida',
  noReading: 'Tiada bacaan untuk bandar ini buat masa ini.',

  dailyOutlook: 'Tinjauan harian',
  localTimeIn: city => `waktu tempatan ${city}`,
  day: 'Hari',
  peakUsAqi: 'AQI AS tertinggi',
  peakPm25: 'PM2.5 tertinggi',
  today: 'Hari ini',
  tomorrow: 'Esok',
  forecastError: 'Tidak dapat memuatkan ramalan',

  chartTitle: 'AQI AS setiap jam',
  chartRange: '2 hari lalu dan ramalan 4 hari.',
  chartAriaTitle: 'Carta AQI AS setiap jam.',
  chartNow: reading => `Kini ${reading}.`,
  chartForecastPeak: (reading, when) => `Puncak ramalan ${reading} pada ${when}.`,
  chartNowLabel: 'Kini',
  chartPeakLabel: (aqi, when) => `Puncak ${aqi} · ${when}`,
  chartHint: 'Halakan ke carta untuk membaca nilai sejam.',
  chartKeyHistory: 'Sejarah model',
  chartKeyForecast: 'Ramalan',
  chartKeyPeak: 'Puncak ramalan',
  chartEmpty: 'Data setiap jam untuk bandar ini tidak mencukupi untuk melukis carta.',

  citiesHeading: 'Bandar',
  country: 'Negara',
  allCountries: 'Semua negara',
  sort: 'Isih',
  sortWorst: 'Udara paling teruk dahulu',
  sortBest: 'Udara paling bersih dahulu',
  sortName: 'Nama (A–Z)',
  listSummary: (n, country, order) =>
    `${country ? `${n} di ${country}` : `${n} bandar`}, ${{ worst: 'udara paling teruk dahulu', best: 'udara paling bersih dahulu', name: 'A–Z' }[order]}`,
  noCitiesMatch: 'Tiada bandar yang sepadan dengan penapis ini.',

  showing: (city, aqi, category) => `Memaparkan ${city}: AQI AS ${aqi}, ${category}.`,
  showingNoData: city => `Memaparkan ${city}.`,

  aboutHeading: 'Tentang data ini',
  aboutModelBefore: 'Bacaan ini ialah ',
  aboutModelStrong: 'anggaran model',
  aboutModelAfter:
    ' daripada Copernicus Atmosphere Monitoring Service (CAMS), disediakan oleh Open-Meteo pada grid kira-kira 45 km. Ia menggambarkan asap serantau dengan baik tetapi boleh berbeza daripada stesen pemantauan, terutamanya berhampiran kebakaran atau di pusat bandar yang padat. Nilai baharu diambil sejurus selepas setiap jam semasa halaman dibuka.',
  aboutIndex:
    'Nilai menggunakan Indeks Kualiti Udara (AQI) EPA AS. Indeks kebangsaan dikira secara berbeza, jadi PSI Singapura, IPU Malaysia dan ISPU Indonesia tidak akan sama tepat dengan angka ini.',
  sourcesHeading: 'Bacaan dan nasihat rasmi',
  sources: {
    sg: 'Singapura: Maklumat jerebu NEA',
    my: 'Malaysia: Indeks Pencemar Udara (APIMS)',
    id: 'Indonesia: Indeks Standard Pencemar Udara (ISPU)',
    th: 'Thailand: Air4Thai',
    asmc: 'ASEAN Specialised Meteorological Centre: jerebu dan titik panas serantau',
    firms: 'NASA FIRMS: peta kebakaran aktif'
  },
  footerDataBefore: 'Data kualiti udara dan angin oleh ',
  footerDataAfter:
    ' (CC BY 4.0), dijana menggunakan maklumat Copernicus Atmosphere Monitoring Service. Data peta © penyumbang OpenStreetMap.',
  footerDisclaimer: 'Bukan nasihat rasmi. Ikut panduan pihak berkuasa tempatan anda.',

  categories: {
    good: { label: 'Baik', short: 'Baik', advice: 'Kualiti udara memuaskan. Teruskan aktiviti luar seperti biasa.' },
    moderate: {
      label: 'Sederhana',
      short: 'Sederhana',
      advice:
        'Boleh diterima oleh kebanyakan orang. Jika anda sangat sensitif terhadap pencemaran udara, pertimbangkan untuk memendekkan atau mengurangkan intensiti aktiviti luar.'
    },
    sensitive: {
      label: 'Tidak sihat bagi golongan sensitif',
      short: 'Golongan sensitif',
      advice:
        'Kanak-kanak, warga emas, wanita hamil dan mereka yang mempunyai penyakit jantung atau paru-paru patut mengurangkan aktiviti luar yang lama atau berat.'
    },
    unhealthy: {
      label: 'Tidak sihat',
      short: 'Tidak sihat',
      advice:
        'Semua orang patut mengurangkan aktiviti luar yang lama atau berat; golongan sensitif patut mengelakkannya. Pakai topeng N95 yang muat dengan baik jika perlu berada lama di luar.'
    },
    'very-unhealthy': {
      label: 'Sangat tidak sihat',
      short: 'Sangat tidak sihat',
      advice:
        'Semua orang patut mengelakkan aktiviti luar yang lama atau berat. Golongan sensitif patut kekal di dalam rumah dengan tingkap tertutup dan, jika boleh, menghidupkan penulen udara.'
    },
    hazardous: {
      label: 'Berbahaya',
      short: 'Berbahaya',
      advice:
        'Semua orang patut mengelakkan semua aktiviti fizikal di luar dan kekal di dalam rumah dengan tingkap tertutup. Ikut nasihat pihak berkuasa kesihatan tempatan.'
    }
  },
  hazeLevels: { clear: 'Cerah', light: 'Jerebu nipis', hazy: 'Berjerebu', thick: 'Jerebu tebal' },
  compass: { N: 'utara', NE: 'timur laut', E: 'timur', SE: 'tenggara', S: 'selatan', SW: 'barat daya', W: 'barat', NW: 'barat laut' },
  placeWithArea: (area, country) => `${area}, ${country}`,
  cityState: 'Negara kota',
  countries: {
    BN: 'Brunei',
    KH: 'Kemboja',
    ID: 'Indonesia',
    LA: 'Laos',
    MY: 'Malaysia',
    MM: 'Myanmar',
    PH: 'Filipina',
    SG: 'Singapura',
    TH: 'Thailand',
    TL: 'Timor-Leste',
    VN: 'Vietnam'
  },
  areas: {
    Penang: 'Pulau Pinang',
    'East Java': 'Jawa Timur',
    'North Sumatra': 'Sumatera Utara',
    'Riau Islands': 'Kepulauan Riau',
    'South Sumatra': 'Sumatera Selatan',
    'West Kalimantan': 'Kalimantan Barat',
    'Central Kalimantan': 'Kalimantan Tengah',
    'South Kalimantan': 'Kalimantan Selatan',
    'East Kalimantan': 'Kalimantan Timur'
  },
  cityNames: {
    singapore: 'Singapura'
  }
};

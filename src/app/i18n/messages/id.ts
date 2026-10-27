import type { Messages } from './en';

/** Bahasa Indonesia */
export const id: Messages = {
  appName: 'Haze Watch',
  tagline: 'Kualitas udara Asia Tenggara',
  pageTitle: 'Haze Watch · Kualitas udara Asia Tenggara',
  cityPageTitle: (city, aqi, category) => `${city}: AQI AS ${aqi} (${category}) · Haze Watch`,
  skipToContent: 'Lewati ke konten utama',
  language: 'Bahasa',
  refresh: 'Muat ulang',
  dataFor: 'Data untuk',
  checked: time => `diperiksa ${time}`,
  loadingReadings: 'Memuat data…',
  tryAgain: 'Coba lagi',
  noData: 'Tidak ada data',

  loadErrorTitle: 'Gagal memuat data terbaru',
  showingReadingsFor: time => `Menampilkan data pukul ${time}.`,
  errors: {
    offline: 'Tidak dapat terhubung ke layanan kualitas udara. Periksa koneksi Anda, lalu coba lagi.',
    rateLimited: 'Layanan kualitas udara sedang membatasi permintaan. Coba lagi dalam beberapa menit.',
    api: detail => `Layanan kualitas udara mengembalikan galat: ${detail}`,
    unexpected: 'Terjadi kesalahan saat memuat data kualitas udara.'
  },

  overviewLabel: 'Ringkasan kawasan',
  overviewMeta: cities => `${cities} kota · AQI AS`,
  worstRightNow: 'Terburuk saat ini:',
  loadingOverview: cities => `Memuat data terbaru untuk ${cities} kota…`,
  readingsUnavailable: 'Data kualitas udara tidak tersedia',
  headlineNone: 'Belum ada data saat ini',
  headlineUnhealthy: (n, total) => `Udara tidak sehat di ${n} dari ${total} kota`,
  headlineSensitive: (n, total) => `Tidak sehat bagi kelompok sensitif di ${n} dari ${total} kota`,
  headlineClear: total => `Udara baik atau sedang di semua ${total} kota`,
  legendLabel: 'Jumlah kota di setiap kategori AQI AS',
  cityCount: () => ' kota',

  mapTitle: 'Peta · AQI AS per kota',
  mapLabel: 'Peta AQI AS per kota',
  mapLoading: 'Memuat peta…',
  mapHint: 'Penanda menunjukkan AQI AS. Pilih penanda atau kota di daftar untuk melihat detail dan prakiraan 4 hari.',
  mapAttribution: 'Peta dasar',

  selectedCity: 'Kota terpilih',
  modelEstimate: time =>
    `Perkiraan model untuk ${time}. AQI dihitung dari rata-rata partikel selama 24 jam terakhir, sehingga bisa tetap tinggi beberapa saat setelah udara membaik.`,
  healthAdvice: 'Saran kesehatan',
  pm25ThisHour: 'PM2.5 jam ini',
  whoGuideline: value => `Pedoman WHO 24 jam: ${value}`,
  haze: 'Kabut asap',
  aerosolOpticalDepth: value => `Kedalaman optik aerosol ${value}`,
  wind: 'Angin',
  windNote: 'Panah menunjukkan arah asap bergerak',
  windUnavailable: 'Tidak tersedia',
  windCalm: 'Tenang',
  windFrom: (kmh, direction) => `${kmh} km/jam dari ${direction}`,
  ozone: 'Ozon',
  carbonMonoxide: 'Karbon monoksida',
  noReading: 'Belum ada data untuk kota ini.',

  dailyOutlook: 'Prakiraan harian',
  localTimeIn: city => `waktu setempat ${city}`,
  day: 'Hari',
  peakUsAqi: 'AQI AS tertinggi',
  peakPm25: 'PM2.5 tertinggi',
  today: 'Hari ini',
  tomorrow: 'Besok',
  forecastError: 'Gagal memuat prakiraan',

  chartTitle: 'AQI AS per jam',
  chartRange: '2 hari terakhir dan prakiraan 4 hari.',
  chartAriaTitle: 'Grafik AQI AS per jam.',
  chartNow: reading => `Saat ini ${reading}.`,
  chartForecastPeak: (reading, when) => `Puncak prakiraan ${reading} pada ${when}.`,
  chartNowLabel: 'Kini',
  chartPeakLabel: (aqi, when) => `Puncak ${aqi} · ${when}`,
  chartHint: 'Arahkan ke grafik untuk membaca nilai per jam.',
  chartKeyHistory: 'Riwayat model',
  chartKeyForecast: 'Prakiraan',
  chartKeyPeak: 'Puncak prakiraan',
  chartEmpty: 'Data per jam untuk kota ini tidak cukup untuk menggambar grafik.',

  citiesHeading: 'Kota',
  country: 'Negara',
  allCountries: 'Semua negara',
  sort: 'Urutkan',
  sortWorst: 'Udara terburuk dulu',
  sortBest: 'Udara terbersih dulu',
  sortName: 'Nama (A–Z)',
  listSummary: (n, country, order) =>
    `${country ? `${n} di ${country}` : `${n} kota`}, ${{ worst: 'udara terburuk dulu', best: 'udara terbersih dulu', name: 'A–Z' }[order]}`,
  noCitiesMatch: 'Tidak ada kota yang cocok dengan filter ini.',

  showing: (city, aqi, category) => `Menampilkan ${city}: AQI AS ${aqi}, ${category}.`,
  showingNoData: city => `Menampilkan ${city}.`,

  aboutHeading: 'Tentang data ini',
  aboutModelBefore: 'Data ini adalah ',
  aboutModelStrong: 'perkiraan model',
  aboutModelAfter:
    ' dari Copernicus Atmosphere Monitoring Service (CAMS), disajikan oleh Open-Meteo pada grid sekitar 45 km. Data ini cukup baik menggambarkan asap regional, tetapi bisa berbeda dari stasiun pemantau di darat, terutama di dekat titik api atau di pusat kota yang padat. Nilai baru diambil sesaat setelah pergantian jam selama halaman terbuka.',
  aboutIndex:
    'Nilai menggunakan Indeks Kualitas Udara (AQI) EPA AS. Indeks nasional dihitung dengan cara berbeda, jadi PSI Singapura, API Malaysia, dan ISPU Indonesia tidak akan sama persis dengan angka ini.',
  sourcesHeading: 'Data dan imbauan resmi',
  sources: {
    sg: 'Singapura: Informasi kabut asap NEA',
    my: 'Malaysia: Indeks Pencemar Udara (APIMS)',
    id: 'Indonesia: Indeks Standar Pencemar Udara (ISPU)',
    th: 'Thailand: Air4Thai',
    asmc: 'ASEAN Specialised Meteorological Centre: kabut asap dan titik panas regional',
    firms: 'NASA FIRMS: peta titik api aktif'
  },
  footerDataBefore: 'Data kualitas udara dan angin dari ',
  footerDataAfter:
    ' (CC BY 4.0), dihasilkan menggunakan informasi Copernicus Atmosphere Monitoring Service. Data peta © kontributor OpenStreetMap.',
  footerDisclaimer: 'Bukan imbauan resmi. Ikuti arahan otoritas setempat.',

  categories: {
    good: { label: 'Baik', short: 'Baik', advice: 'Kualitas udara memuaskan. Silakan beraktivitas di luar ruangan seperti biasa.' },
    moderate: {
      label: 'Sedang',
      short: 'Sedang',
      advice:
        'Dapat diterima bagi kebanyakan orang. Jika Anda sangat peka terhadap polusi udara, pertimbangkan untuk mempersingkat atau mengurangi intensitas aktivitas di luar ruangan.'
    },
    sensitive: {
      label: 'Tidak sehat bagi kelompok sensitif',
      short: 'Kelompok sensitif',
      advice:
        'Anak-anak, lansia, ibu hamil, dan penderita penyakit jantung atau paru-paru sebaiknya mengurangi aktivitas luar ruangan yang lama atau berat.'
    },
    unhealthy: {
      label: 'Tidak sehat',
      short: 'Tidak sehat',
      advice:
        'Semua orang sebaiknya mengurangi aktivitas luar ruangan yang lama atau berat; kelompok sensitif sebaiknya menghindarinya. Pakai masker N95 yang pas jika harus lama di luar ruangan.'
    },
    'very-unhealthy': {
      label: 'Sangat tidak sehat',
      short: 'Sangat tidak sehat',
      advice:
        'Semua orang sebaiknya menghindari aktivitas luar ruangan yang lama atau berat. Kelompok sensitif sebaiknya tetap di dalam ruangan dengan jendela tertutup dan, bila memungkinkan, menyalakan pembersih udara.'
    },
    hazardous: {
      label: 'Berbahaya',
      short: 'Berbahaya',
      advice:
        'Semua orang sebaiknya menghindari semua aktivitas fisik di luar ruangan dan tetap di dalam ruangan dengan jendela tertutup. Ikuti saran otoritas kesehatan setempat.'
    }
  },
  hazeLevels: { clear: 'Cerah', light: 'Kabut asap tipis', hazy: 'Berkabut asap', thick: 'Kabut asap tebal' },
  compass: { N: 'utara', NE: 'timur laut', E: 'timur', SE: 'tenggara', S: 'selatan', SW: 'barat daya', W: 'barat', NW: 'barat laut' },
  placeWithArea: (area, country) => `${area}, ${country}`,
  cityState: 'Negara kota',
  countries: {
    BN: 'Brunei',
    KH: 'Kamboja',
    ID: 'Indonesia',
    LA: 'Laos',
    MY: 'Malaysia',
    MM: 'Myanmar',
    PH: 'Filipina',
    SG: 'Singapura',
    TH: 'Thailand',
    TL: 'Timor Leste',
    VN: 'Vietnam'
  },
  areas: {
    Penang: 'Penang',
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
    singapore: 'Singapura',
    melaka: 'Malaka'
  }
};

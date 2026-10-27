import { en, type Messages } from '../i18n/messages/en';

export type CountryCode = 'BN' | 'KH' | 'ID' | 'LA' | 'MY' | 'MM' | 'PH' | 'SG' | 'TH' | 'TL' | 'VN';

export interface Country {
  code: CountryCode;
  name: string;
}

export interface City {
  /** URL-safe slug, also used as the `?city=` query parameter. */
  id: string;
  name: string;
  country: CountryCode;
  /** State / province, shown to disambiguate and to point at burning regions. */
  area?: string;
  lat: number;
  lon: number;
}

export const COUNTRIES: readonly Country[] = [
  { code: 'BN', name: 'Brunei' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'LA', name: 'Laos' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'VN', name: 'Vietnam' }
];

/**
 * Capitals plus the cities nearest the region's recurring burning areas:
 * Riau, Jambi and South Sumatra and Kalimantan (Jul–Oct haze), and northern
 * Thailand, Laos and Myanmar (Feb–Apr haze).
 */
export const CITIES: readonly City[] = [
  { id: 'singapore', name: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198 },

  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'MY', lat: 3.139, lon: 101.6869 },
  { id: 'johor-bahru', name: 'Johor Bahru', country: 'MY', area: 'Johor', lat: 1.4927, lon: 103.7414 },
  { id: 'melaka', name: 'Melaka', country: 'MY', lat: 2.1896, lon: 102.2501 },
  { id: 'ipoh', name: 'Ipoh', country: 'MY', area: 'Perak', lat: 4.5975, lon: 101.0901 },
  { id: 'george-town', name: 'George Town', country: 'MY', area: 'Penang', lat: 5.4141, lon: 100.3288 },
  { id: 'kuantan', name: 'Kuantan', country: 'MY', area: 'Pahang', lat: 3.8077, lon: 103.326 },
  { id: 'kuching', name: 'Kuching', country: 'MY', area: 'Sarawak', lat: 1.5535, lon: 110.3593 },
  { id: 'miri', name: 'Miri', country: 'MY', area: 'Sarawak', lat: 4.3995, lon: 113.9914 },
  { id: 'kota-kinabalu', name: 'Kota Kinabalu', country: 'MY', area: 'Sabah', lat: 5.9804, lon: 116.0735 },

  { id: 'jakarta', name: 'Jakarta', country: 'ID', lat: -6.2088, lon: 106.8456 },
  { id: 'surabaya', name: 'Surabaya', country: 'ID', area: 'East Java', lat: -7.2575, lon: 112.7521 },
  { id: 'medan', name: 'Medan', country: 'ID', area: 'North Sumatra', lat: 3.5952, lon: 98.6722 },
  { id: 'pekanbaru', name: 'Pekanbaru', country: 'ID', area: 'Riau', lat: 0.5071, lon: 101.4478 },
  { id: 'batam', name: 'Batam', country: 'ID', area: 'Riau Islands', lat: 1.0456, lon: 104.0305 },
  { id: 'jambi', name: 'Jambi', country: 'ID', area: 'Jambi', lat: -1.6101, lon: 103.6131 },
  { id: 'palembang', name: 'Palembang', country: 'ID', area: 'South Sumatra', lat: -2.9761, lon: 104.7754 },
  { id: 'pontianak', name: 'Pontianak', country: 'ID', area: 'West Kalimantan', lat: -0.0263, lon: 109.3425 },
  { id: 'palangka-raya', name: 'Palangka Raya', country: 'ID', area: 'Central Kalimantan', lat: -2.2161, lon: 113.9135 },
  { id: 'banjarmasin', name: 'Banjarmasin', country: 'ID', area: 'South Kalimantan', lat: -3.3186, lon: 114.5944 },
  { id: 'samarinda', name: 'Samarinda', country: 'ID', area: 'East Kalimantan', lat: -0.5022, lon: 117.1536 },

  { id: 'bangkok', name: 'Bangkok', country: 'TH', lat: 13.7563, lon: 100.5018 },
  { id: 'chiang-mai', name: 'Chiang Mai', country: 'TH', lat: 18.7883, lon: 98.9853 },
  { id: 'chiang-rai', name: 'Chiang Rai', country: 'TH', lat: 19.9105, lon: 99.8406 },
  { id: 'khon-kaen', name: 'Khon Kaen', country: 'TH', lat: 16.4322, lon: 102.8236 },
  { id: 'hat-yai', name: 'Hat Yai', country: 'TH', area: 'Songkhla', lat: 7.0086, lon: 100.4747 },

  { id: 'bandar-seri-begawan', name: 'Bandar Seri Begawan', country: 'BN', lat: 4.9031, lon: 114.9398 },
  { id: 'phnom-penh', name: 'Phnom Penh', country: 'KH', lat: 11.5564, lon: 104.9282 },
  { id: 'siem-reap', name: 'Siem Reap', country: 'KH', lat: 13.3671, lon: 103.8448 },
  { id: 'vientiane', name: 'Vientiane', country: 'LA', lat: 17.9757, lon: 102.6331 },
  { id: 'luang-prabang', name: 'Luang Prabang', country: 'LA', lat: 19.8856, lon: 102.1347 },
  { id: 'yangon', name: 'Yangon', country: 'MM', lat: 16.8409, lon: 96.1735 },
  { id: 'mandalay', name: 'Mandalay', country: 'MM', lat: 21.9588, lon: 96.0891 },
  { id: 'hanoi', name: 'Hanoi', country: 'VN', lat: 21.0278, lon: 105.8342 },
  { id: 'ho-chi-minh-city', name: 'Ho Chi Minh City', country: 'VN', lat: 10.8231, lon: 106.6297 },
  { id: 'manila', name: 'Manila', country: 'PH', lat: 14.5995, lon: 120.9842 },
  { id: 'cebu', name: 'Cebu City', country: 'PH', lat: 10.3157, lon: 123.8854 },
  { id: 'davao', name: 'Davao City', country: 'PH', lat: 7.1907, lon: 125.4553 },
  { id: 'dili', name: 'Dili', country: 'TL', lat: -8.5569, lon: 125.5603 }
];

export const DEFAULT_CITY_ID = 'singapore';

export const CITY_BY_ID: ReadonlyMap<string, City> = new Map(CITIES.map(c => [c.id, c]));

export function countryName(code: CountryCode, messages: Messages = en): string {
  return messages.countries[code] ?? code;
}

/** "Riau, Indonesia" / "Singapore" — the line under a city's name, in the given language. */
export function placeLabel(city: City, messages: Messages = en): string {
  const country = countryName(city.country, messages);
  if (city.area) return messages.placeWithArea(messages.areas[city.area] ?? city.area, country);
  return city.name === en.countries[city.country] ? messages.cityState : country;
}

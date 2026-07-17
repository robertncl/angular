export interface StockData {
  name: string;
  exch: string;
  price: number;
  chgPct: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  wLow: number;
  wHigh: number;
  volume: number;
  cap: string;
}

export interface Holding {
  symbol: string;
  shares: number;
  avgCost: number;
}

export type Side = 'buy' | 'sell';
export type OrderStatus = 'filled' | 'pending' | 'canceled';
export type OrderType = 'market' | 'limit' | 'stop';
export type CategoryId = 'watch' | 'stocks' | 'etfs' | 'crypto';
export type RangeId = '1D' | '1W' | '1M' | '3M' | '1Y';
export type TicketStep = 'ticket' | 'confirm' | 'success';

export interface Order {
  id: string;
  date: string;
  symbol: string;
  side: Side;
  type: string;
  qty: number;
  price: number;
  status: OrderStatus;
}

export interface TicketState {
  symbol: string;
  side: Side;
  type: OrderType;
  qty: string;
  price: string;
  step: TicketStep;
  id?: string;
  status?: OrderStatus;
}

export interface ChartGeometry {
  path: string;
  areaPath: string;
  rising: boolean;
  falling: boolean;
}

export const CATEGORY_SYMBOLS: Record<Exclude<CategoryId, 'watch'>, string[]> = {
  stocks: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'NFLX', 'AMD'],
  etfs: ['SPY', 'QQQ', 'VTI'],
  crypto: ['BTC-USD', 'ETH-USD']
};

export const STOCKS: Record<string, StockData> = {
  AAPL: { name: 'Apple Inc.', exch: 'NASDAQ', price: 231.52, chgPct: 1.82, open: 228.10, dayHigh: 232.40, dayLow: 227.55, wLow: 164.08, wHigh: 237.23, volume: 58230000, cap: '3.58T' },
  MSFT: { name: 'Microsoft Corporation', exch: 'NASDAQ', price: 468.20, chgPct: 0.64, open: 465.80, dayHigh: 470.10, dayLow: 464.20, wLow: 385.58, wHigh: 480.00, volume: 19850000, cap: '3.48T' },
  NVDA: { name: 'NVIDIA Corporation', exch: 'NASDAQ', price: 142.85, chgPct: -1.24, open: 144.90, dayHigh: 145.60, dayLow: 141.90, wLow: 86.62, wHigh: 153.13, volume: 210450000, cap: '3.49T' },
  GOOGL: { name: 'Alphabet Inc.', exch: 'NASDAQ', price: 191.40, chgPct: 2.05, open: 187.60, dayHigh: 192.80, dayLow: 187.10, wLow: 140.53, wHigh: 195.50, volume: 27340000, cap: '2.35T' },
  AMZN: { name: 'Amazon.com, Inc.', exch: 'NASDAQ', price: 214.30, chgPct: 0.91, open: 212.50, dayHigh: 215.90, dayLow: 211.80, wLow: 151.61, wHigh: 220.53, volume: 34120000, cap: '2.27T' },
  META: { name: 'Meta Platforms, Inc.', exch: 'NASDAQ', price: 612.75, chgPct: 1.14, open: 605.90, dayHigh: 615.20, dayLow: 604.10, wLow: 414.50, wHigh: 638.40, volume: 12870000, cap: '1.55T' },
  TSLA: { name: 'Tesla, Inc.', exch: 'NASDAQ', price: 268.90, chgPct: -3.37, open: 279.40, dayHigh: 281.00, dayLow: 267.55, wLow: 138.80, wHigh: 488.54, volume: 98450000, cap: '860.2B' },
  JPM: { name: 'JPMorgan Chase & Co.', exch: 'NYSE', price: 231.10, chgPct: 0.28, open: 230.30, dayHigh: 232.60, dayLow: 229.40, wLow: 179.20, wHigh: 245.10, volume: 8320000, cap: '650.4B' },
  NFLX: { name: 'Netflix, Inc.', exch: 'NASDAQ', price: 985.40, chgPct: -0.52, open: 990.10, dayHigh: 995.80, dayLow: 981.20, wLow: 585.28, wHigh: 1064.50, volume: 2140000, cap: '425.1B' },
  AMD: { name: 'Advanced Micro Devices', exch: 'NASDAQ', price: 168.20, chgPct: 2.71, open: 163.80, dayHigh: 169.40, dayLow: 163.10, wLow: 93.12, wHigh: 187.28, volume: 45230000, cap: '272.6B' },
  SPY: { name: 'SPDR S&P 500 ETF Trust', exch: 'NYSEARCA', price: 612.34, chgPct: 0.42, open: 609.80, dayHigh: 613.50, dayLow: 608.90, wLow: 493.05, wHigh: 618.30, volume: 62340000, cap: '—' },
  QQQ: { name: 'Invesco QQQ Trust', exch: 'NASDAQ', price: 524.18, chgPct: 0.58, open: 521.30, dayHigh: 526.00, dayLow: 520.60, wLow: 402.39, wHigh: 530.20, volume: 41230000, cap: '—' },
  VTI: { name: 'Vanguard Total Stock Market ETF', exch: 'NYSEARCA', price: 312.66, chgPct: 0.39, open: 311.20, dayHigh: 313.50, dayLow: 310.80, wLow: 246.05, wHigh: 315.90, volume: 3120000, cap: '—' },
  'BTC-USD': { name: 'Bitcoin', exch: 'Crypto', price: 118420.00, chgPct: 2.15, open: 115900, dayHigh: 119800, dayLow: 114600, wLow: 52150, wHigh: 124500, volume: 0, cap: '2.35T' },
  'ETH-USD': { name: 'Ethereum', exch: 'Crypto', price: 4380.50, chgPct: -1.05, open: 4428.00, dayHigh: 4455.00, dayLow: 4350.00, wLow: 1890.40, wHigh: 4820.00, volume: 0, cap: '528.4B' }
};

export const HOLDINGS: Holding[] = [
  { symbol: 'AAPL', shares: 40, avgCost: 189.40 },
  { symbol: 'MSFT', shares: 15, avgCost: 365.20 },
  { symbol: 'NVDA', shares: 60, avgCost: 98.75 },
  { symbol: 'TSLA', shares: 20, avgCost: 240.60 },
  { symbol: 'GOOGL', shares: 25, avgCost: 150.30 },
  { symbol: 'QQQ', shares: 30, avgCost: 480.10 }
];

export const ORDER_HISTORY: Order[] = [
  { id: 'ORD-10482', date: 'Jul 16, 2026', symbol: 'AAPL', side: 'buy', type: 'Market', qty: 10, price: 229.80, status: 'filled' },
  { id: 'ORD-10475', date: 'Jul 15, 2026', symbol: 'TSLA', side: 'sell', type: 'Limit', qty: 5, price: 275.00, status: 'filled' },
  { id: 'ORD-10461', date: 'Jul 14, 2026', symbol: 'NVDA', side: 'buy', type: 'Limit', qty: 20, price: 140.00, status: 'pending' },
  { id: 'ORD-10450', date: 'Jul 12, 2026', symbol: 'MSFT', side: 'buy', type: 'Market', qty: 8, price: 462.10, status: 'filled' },
  { id: 'ORD-10439', date: 'Jul 10, 2026', symbol: 'GOOGL', side: 'sell', type: 'Stop', qty: 12, price: 182.50, status: 'canceled' },
  { id: 'ORD-10422', date: 'Jul 8, 2026', symbol: 'AMD', side: 'buy', type: 'Market', qty: 25, price: 159.40, status: 'filled' },
  { id: 'ORD-10410', date: 'Jul 6, 2026', symbol: 'QQQ', side: 'buy', type: 'Market', qty: 15, price: 518.30, status: 'filled' },
  { id: 'ORD-10398', date: 'Jul 3, 2026', symbol: 'META', side: 'sell', type: 'Limit', qty: 4, price: 625.00, status: 'pending' }
];

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'watch', label: 'Watch' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'etfs', label: 'ETFs' },
  { id: 'crypto', label: 'Crypto' }
];

export const RANGE_COUNTS: Record<RangeId, number> = { '1D': 24, '1W': 28, '1M': 30, '3M': 45, '1Y': 52 };
export const RANGE_IDS: RangeId[] = ['1D', '1W', '1M', '3M', '1Y'];
export const ALLOC_COLORS = ['#2563EB', '#3b7bf0', '#5c93f4', '#7ba9f7', '#9cbff9', '#bdd5fc'];
export const NEWS_PUBLISHERS = ['Market Wire', 'Ticker Daily', 'Desk Notes'];

export function fmtMoney(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—';
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function fmtPct(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return sign + v.toFixed(2) + '%';
}
export function fmtNum(v: number): string {
  if (!v) return '—';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return String(v);
}
export function seededSeries(seedStr: string, base: number, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
  function rnd() {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  }
  let v = base * 0.9;
  const pts: number[] = [];
  for (let i = 0; i < count; i++) {
    v += (rnd() - 0.47) * base * 0.018;
    v = Math.max(base * 0.75, Math.min(base * 1.15, v));
    pts.push(v);
  }
  pts[pts.length - 1] = base;
  return pts;
}
export function buildChart(points: number[], width = 800, height = 220): ChartGeometry {
  const padTop = height >= 200 ? 16 : 10, padBottom = height >= 200 ? 16 : 10;
  const min = Math.min(...points), max = Math.max(...points), span = (max - min) || 1;
  const innerH = height - padTop - padBottom;
  const xy = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = padTop + innerH - ((p - min) / span) * innerH;
    return { x, y };
  });
  const path = xy.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(2) + ',' + pt.y.toFixed(2)).join(' ');
  const areaPath = path + ' L' + xy[xy.length - 1].x.toFixed(2) + ',' + (height - padBottom) + ' L' + xy[0].x.toFixed(2) + ',' + (height - padBottom) + ' Z';
  const rising = points[points.length - 1] >= points[0];
  return { path, areaPath, rising, falling: !rising };
}

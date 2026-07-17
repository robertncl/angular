import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Theme = 'dark' | 'light';
type Screen = 'dashboard' | 'portfolio' | 'orders' | 'account';
type CategoryId = 'watch' | 'stocks' | 'etfs' | 'crypto';
type RangeId = '1D' | '1W' | '1M' | '3M' | '1Y';
type Side = 'buy' | 'sell';
type OrderType = 'market' | 'limit' | 'stop';
type OrderStatus = 'filled' | 'pending' | 'canceled';
type TicketStep = 'ticket' | 'confirm' | 'success';

interface StockData {
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

interface Holding {
  symbol: string;
  shares: number;
  avgCost: number;
}

interface Order {
  id: string;
  date: string;
  symbol: string;
  side: Side;
  type: string;
  qty: number;
  price: number;
  status: OrderStatus;
}

interface TicketState {
  symbol: string;
  side: Side;
  type: OrderType;
  qty: string;
  price: string;
  step: TicketStep;
  id?: string;
  status?: OrderStatus;
}

interface ChartGeometry {
  path: string;
  areaPath: string;
  rising: boolean;
  falling: boolean;
}

const CATEGORY_SYMBOLS: Record<Exclude<CategoryId, 'watch'>, string[]> = {
  stocks: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'NFLX', 'AMD'],
  etfs: ['SPY', 'QQQ', 'VTI'],
  crypto: ['BTC-USD', 'ETH-USD']
};

const STOCKS: Record<string, StockData> = {
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

const HOLDINGS: Holding[] = [
  { symbol: 'AAPL', shares: 40, avgCost: 189.40 },
  { symbol: 'MSFT', shares: 15, avgCost: 365.20 },
  { symbol: 'NVDA', shares: 60, avgCost: 98.75 },
  { symbol: 'TSLA', shares: 20, avgCost: 240.60 },
  { symbol: 'GOOGL', shares: 25, avgCost: 150.30 },
  { symbol: 'QQQ', shares: 30, avgCost: 480.10 }
];

const ORDER_HISTORY: Order[] = [
  { id: 'ORD-10482', date: 'Jul 16, 2026', symbol: 'AAPL', side: 'buy', type: 'Market', qty: 10, price: 229.80, status: 'filled' },
  { id: 'ORD-10475', date: 'Jul 15, 2026', symbol: 'TSLA', side: 'sell', type: 'Limit', qty: 5, price: 275.00, status: 'filled' },
  { id: 'ORD-10461', date: 'Jul 14, 2026', symbol: 'NVDA', side: 'buy', type: 'Limit', qty: 20, price: 140.00, status: 'pending' },
  { id: 'ORD-10450', date: 'Jul 12, 2026', symbol: 'MSFT', side: 'buy', type: 'Market', qty: 8, price: 462.10, status: 'filled' },
  { id: 'ORD-10439', date: 'Jul 10, 2026', symbol: 'GOOGL', side: 'sell', type: 'Stop', qty: 12, price: 182.50, status: 'canceled' },
  { id: 'ORD-10422', date: 'Jul 8, 2026', symbol: 'AMD', side: 'buy', type: 'Market', qty: 25, price: 159.40, status: 'filled' },
  { id: 'ORD-10410', date: 'Jul 6, 2026', symbol: 'QQQ', side: 'buy', type: 'Market', qty: 15, price: 518.30, status: 'filled' },
  { id: 'ORD-10398', date: 'Jul 3, 2026', symbol: 'META', side: 'sell', type: 'Limit', qty: 4, price: 625.00, status: 'pending' }
];

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'watch', label: 'Watch' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'etfs', label: 'ETFs' },
  { id: 'crypto', label: 'Crypto' }
];

const NAV: { id: Screen; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'orders', label: 'Orders' },
  { id: 'account', label: 'Account' }
];

const RANGE_COUNTS: Record<RangeId, number> = { '1D': 24, '1W': 28, '1M': 30, '3M': 45, '1Y': 52 };
const ALLOC_COLORS = ['#2563EB', '#3b7bf0', '#5c93f4', '#7ba9f7', '#9cbff9', '#bdd5fc'];
const NEWS_PUBLISHERS = ['Market Wire', 'Ticker Daily', 'Desk Notes'];

function fmtMoney(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—';
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return sign + v.toFixed(2) + '%';
}
function fmtNum(v: number): string {
  if (!v) return '—';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return String(v);
}
function seededSeries(seedStr: string, base: number, count: number): number[] {
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
function buildChart(points: number[]): ChartGeometry {
  const width = 800, height = 220, padTop = 16, padBottom = 16;
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

@Component({
  selector: 'app-trading-app',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './trading-app.component.html',
  styleUrl: './trading-app.component.css'
})
export class TradingAppComponent {
  readonly nav = NAV;
  readonly categories = CATEGORIES;
  readonly rangesIds: RangeId[] = ['1D', '1W', '1M', '3M', '1Y'];

  theme = signal<Theme>((document.documentElement.getAttribute('data-theme') as Theme) || 'dark');
  screen = signal<Screen>('dashboard');
  category = signal<CategoryId>('watch');
  activeSymbol = signal('AAPL');
  range = signal<RangeId>('1M');
  watchlist = signal<string[]>(['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA']);
  searchQuery = signal('');
  ticket = signal<TicketState | null>(null);
  orders = signal<Order[]>(ORDER_HISTORY.slice());
  notif = signal({ price: true, fills: true, news: false });
  twoFactor = signal(true);

  toggleTheme() {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    this.theme.set(next);
  }
  setScreen(s: Screen) { this.screen.set(s); }
  setCategory(c: CategoryId) { this.category.set(c); }
  selectSymbol(sym: string) { this.activeSymbol.set(sym); this.searchQuery.set(''); }
  setRange(r: RangeId) { this.range.set(r); }
  toggleWatch(sym: string) {
    this.watchlist.update(list => list.includes(sym) ? list.filter(x => x !== sym) : [...list, sym]);
  }
  onSearchChange(value: string) { this.searchQuery.set(value); }

  openTicket(symbol: string, side: Side) {
    this.ticket.set({ symbol, side, type: 'market', qty: '10', price: '', step: 'ticket' });
  }
  updateTicket(patch: Partial<TicketState>) {
    this.ticket.update(t => t ? { ...t, ...patch } : t);
  }
  reviewTicket() { this.updateTicket({ step: 'confirm' }); }
  backTicket() { this.updateTicket({ step: 'ticket' }); }
  placeOrder() {
    const t = this.ticket();
    if (!t) return;
    const stock = STOCKS[t.symbol];
    const price = t.type === 'market' ? stock.price : (parseFloat(t.price) || stock.price);
    const qty = parseInt(t.qty, 10) || 0;
    const id = 'ORD-' + Math.floor(10500 + Math.random() * 400);
    const status: OrderStatus = t.type === 'market' ? 'filled' : 'pending';
    const typeLabel = t.type === 'market' ? 'Market' : t.type === 'limit' ? 'Limit' : 'Stop';
    const order: Order = { id, date: 'Jul 17, 2026', symbol: t.symbol, side: t.side, type: typeLabel, qty, price, status };
    this.orders.update(list => [order, ...list]);
    this.ticket.set({ ...t, step: 'success', id, status, price: String(price), qty: String(qty) });
  }
  closeTicket() { this.ticket.set(null); }
  goToOrders() { this.ticket.set(null); this.screen.set('orders'); }
  toggleNotif(key: 'price' | 'fills' | 'news') {
    this.notif.update(n => ({ ...n, [key]: !n[key] }));
  }
  toggleTwoFactor() { this.twoFactor.update(v => !v); }

  // ---------- Derived view data ----------

  readonly stockData = computed(() => STOCKS[this.activeSymbol()]);

  readonly stock = computed(() => {
    const d = this.stockData();
    const change = d.price * d.chgPct / 100;
    const isUp = change >= 0;
    return {
      symbol: this.activeSymbol(),
      name: d.name,
      exch: d.exch,
      priceLabel: fmtMoney(d.price),
      changeLabel: (isUp ? '+' : '') + change.toFixed(2),
      changePctLabel: fmtPct(d.chgPct),
      isUp, isDown: !isUp,
      isWatched: this.watchlist().includes(this.activeSymbol())
    };
  });

  readonly chart = computed(() => {
    const series = seededSeries(this.activeSymbol() + this.range(), this.stockData().price, RANGE_COUNTS[this.range()]);
    return buildChart(series);
  });

  readonly stats = computed(() => {
    const d = this.stockData();
    const change = d.price * d.chgPct / 100;
    const prevClose = d.price - change;
    return [
      { label: 'Prev close', value: fmtMoney(prevClose) },
      { label: 'Day range', value: fmtMoney(d.dayLow) + ' – ' + fmtMoney(d.dayHigh) },
      { label: '52W range', value: fmtMoney(d.wLow) + ' – ' + fmtMoney(d.wHigh) },
      { label: 'Volume', value: fmtNum(d.volume) },
      { label: 'Market cap', value: d.cap },
      { label: 'Exchange', value: d.exch }
    ];
  });

  readonly news = computed(() => {
    const d = this.stockData();
    const sym = this.activeSymbol();
    return [
      { title: d.name + ' extends move as investors weigh the outlook', publisher: NEWS_PUBLISHERS[0], time: '2h ago' },
      { title: 'Analysts split on ' + sym + ' after latest guidance', publisher: NEWS_PUBLISHERS[1], time: '6h ago' },
      { title: 'What to watch in ' + d.name + ' shares this week', publisher: NEWS_PUBLISHERS[2], time: '1d ago' }
    ];
  });

  readonly rows = computed(() => {
    const cat = this.category();
    const symbols = cat === 'watch' ? this.watchlist() : CATEGORY_SYMBOLS[cat];
    return symbols.map(sym => {
      const d = STOCKS[sym];
      const c = d.price * d.chgPct / 100;
      const up = c >= 0;
      return {
        symbol: sym, name: d.name, priceLabel: fmtMoney(d.price),
        changeLabel: fmtPct(d.chgPct), isUp: up, isDown: !up,
        isActive: sym === this.activeSymbol()
      };
    });
  });

  readonly searchResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    return Object.keys(STOCKS)
      .filter(sym => sym.toLowerCase().includes(q) || STOCKS[sym].name.toLowerCase().includes(q))
      .slice(0, 8)
      .map(sym => ({ symbol: sym, name: STOCKS[sym].name }));
  });

  readonly holdings = computed(() => {
    return HOLDINGS.map(h => {
      const d = STOCKS[h.symbol];
      const value = h.shares * d.price;
      const cost = h.shares * h.avgCost;
      const gain = value - cost;
      const up = gain >= 0;
      return {
        symbol: h.symbol, shares: h.shares, avgCostLabel: fmtMoney(h.avgCost), priceLabel: fmtMoney(d.price),
        valueLabel: fmtMoney(value), gainLabel: (up ? '+' : '') + fmtMoney(gain),
        isUp: up, isDown: !up
      };
    });
  });

  readonly portfolio = computed(() => {
    let totalValue = 0, totalCost = 0, dayChange = 0;
    HOLDINGS.forEach(h => {
      const d = STOCKS[h.symbol];
      const value = h.shares * d.price;
      totalValue += value;
      totalCost += h.shares * h.avgCost;
      dayChange += value * d.chgPct / 100;
    });
    const totalGain = totalValue - totalCost;
    const gainUp = totalGain >= 0;
    const dayUp = dayChange >= 0;
    const allocation = HOLDINGS.map((h, i) => {
      const d = STOCKS[h.symbol];
      const value = h.shares * d.price;
      const pct = totalValue ? (value / totalValue) * 100 : 0;
      return { symbol: h.symbol, pct, pctLabel: pct.toFixed(1) + '%', color: ALLOC_COLORS[i % ALLOC_COLORS.length] };
    });
    return {
      totalLabel: fmtMoney(totalValue),
      dayLabel: (dayUp ? '+' : '') + fmtMoney(dayChange), dayUp, dayDown: !dayUp,
      gainLabel: (gainUp ? '+' : '') + fmtMoney(totalGain), gainUp, gainDown: !gainUp,
      gainPctLabel: fmtPct(totalCost ? (totalGain / totalCost) * 100 : 0),
      allocation
    };
  });

  readonly orderRows = computed(() => this.orders().map(o => ({
    id: o.id, date: o.date, symbol: o.symbol, side: o.side, type: o.type, qty: o.qty,
    priceLabel: fmtMoney(o.price), totalLabel: fmtMoney(o.qty * o.price),
    isFilled: o.status === 'filled', isPending: o.status === 'pending', isCanceled: o.status === 'canceled'
  })));

  readonly notifRows = computed(() => {
    const n = this.notif();
    return [
      { key: 'price' as const, label: 'Price alerts', sub: 'Notify on watchlist price moves', on: n.price },
      { key: 'fills' as const, label: 'Order fills', sub: 'Notify when an order fills', on: n.fills },
      { key: 'news' as const, label: 'News digest', sub: 'Daily summary for your watchlist', on: n.news }
    ];
  });

  readonly ticketView = computed(() => {
    const t = this.ticket();
    if (!t) return null;
    const td = STOCKS[t.symbol];
    const qty = parseInt(t.qty, 10) || 0;
    const est = t.type === 'market' ? td.price * qty : (parseFloat(t.price) || td.price) * qty;
    return {
      symbol: t.symbol,
      side: t.side,
      verb: t.side === 'buy' ? 'Buy' : 'Sell',
      type: t.type,
      typeLabel: t.type === 'market' ? 'Market' : t.type === 'limit' ? 'Limit' : 'Stop',
      qty: t.qty,
      price: t.price,
      priceLabel: t.type === 'market' ? 'Market price (' + fmtMoney(td.price) + ')' : fmtMoney(parseFloat(t.price) || td.price),
      estLabel: fmtMoney(est),
      needsPrice: t.type !== 'market',
      priceFieldLabel: t.type === 'limit' ? 'Limit price' : 'Stop price',
      step: t.step,
      orderId: t.id || '',
      successSummary: t.step === 'success'
        ? (t.side === 'buy' ? 'Bought ' : 'Sold ') + t.qty + ' shares of ' + t.symbol +
          (t.status === 'pending' ? ' — pending fill.' : ' — filled at ' + fmtMoney(parseFloat(t.price)) + '.')
        : ''
    };
  });
}

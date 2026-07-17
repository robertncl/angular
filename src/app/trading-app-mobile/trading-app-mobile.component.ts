import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ALLOC_COLORS, CATEGORIES, CATEGORY_SYMBOLS, CategoryId, NEWS_PUBLISHERS, Order, ORDER_HISTORY,
  HOLDINGS, RANGE_COUNTS, RANGE_IDS, RangeId, Side, STOCKS, TicketState, buildChart, fmtMoney, fmtNum,
  fmtPct, seededSeries
} from '../trading-app/trading-data';

type Theme = 'dark' | 'light';
type Screen = 'home' | 'detail' | 'portfolio' | 'orders' | 'account';

@Component({
  selector: 'app-trading-app-mobile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './trading-app-mobile.component.html',
  styleUrl: './trading-app-mobile.component.css'
})
export class TradingAppMobileComponent {
  readonly categories = CATEGORIES;
  readonly rangesIds = RANGE_IDS;

  theme = signal<Theme>((document.documentElement.getAttribute('data-theme') as Theme) || 'dark');
  screen = signal<Screen>('home');
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
  goHome() { this.screen.set('home'); }
  goPortfolio() { this.screen.set('portfolio'); }
  goOrders() { this.screen.set('orders'); }
  goAccount() { this.screen.set('account'); }
  setCategory(c: CategoryId) { this.category.set(c); }
  selectSymbol(sym: string) { this.activeSymbol.set(sym); this.searchQuery.set(''); this.screen.set('detail'); }
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
    const status = t.type === 'market' ? 'filled' : 'pending';
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
    return buildChart(series, 360, 160);
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
        changeLabel: fmtPct(d.chgPct), isUp: up, isDown: !up
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
        symbol: h.symbol, shares: h.shares, avgCostLabel: fmtMoney(h.avgCost),
        valueLabel: fmtMoney(value), gainLabel: (up ? '+' : '') + fmtMoney(gain),
        isUp: up, isDown: !up
      };
    });
  });

  readonly portfolio = computed(() => {
    let totalValue = 0, totalCost = 0;
    HOLDINGS.forEach(h => {
      const d = STOCKS[h.symbol];
      totalValue += h.shares * d.price;
      totalCost += h.shares * h.avgCost;
    });
    const totalGain = totalValue - totalCost;
    const gainUp = totalGain >= 0;
    const allocation = HOLDINGS.map((h, i) => {
      const d = STOCKS[h.symbol];
      const value = h.shares * d.price;
      const pct = totalValue ? (value / totalValue) * 100 : 0;
      return { symbol: h.symbol, pct, color: ALLOC_COLORS[i % ALLOC_COLORS.length] };
    });
    return {
      totalLabel: fmtMoney(totalValue),
      gainLabel: (gainUp ? '+' : '') + fmtMoney(totalGain), gainUp, gainDown: !gainUp,
      gainPctLabel: fmtPct(totalCost ? (totalGain / totalCost) * 100 : 0),
      allocation
    };
  });

  readonly orderRows = computed(() => this.orders().map(o => ({
    id: o.id, date: o.date, symbol: o.symbol, side: o.side, type: o.type, qty: o.qty,
    priceLabel: fmtMoney(o.price),
    isFilled: o.status === 'filled', isPending: o.status === 'pending', isCanceled: o.status === 'canceled'
  })));

  readonly notifRows = computed(() => {
    const n = this.notif();
    return [
      { key: 'price' as const, label: 'Price alerts', on: n.price },
      { key: 'fills' as const, label: 'Order fills', on: n.fills },
      { key: 'news' as const, label: 'News digest', on: n.news }
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

  readonly showTabBar = computed(() => this.screen() !== 'detail');
  readonly tabHomeActive = computed(() => this.screen() === 'home' || this.screen() === 'detail');
}

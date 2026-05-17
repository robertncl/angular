import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import {
  History,
  HistoryPoint,
  Quote,
  Range,
  StockService,
  SymbolMatch
} from '../stock.service';

interface WatchRow {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
}

const WATCHLIST_KEY = 'stockapp.watchlist.v1';
const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA'];
const DEFAULT_SYMBOL = 'AAPL';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})
export class StockComponent implements OnInit, OnDestroy {
  searchQuery = '';
  searchResults: SymbolMatch[] = [];
  showResults = false;

  quote = signal<Quote | null>(null);
  history = signal<History | null>(null);
  loadingQuote = signal(false);
  loadingHistory = signal(false);
  error = signal('');

  range = signal<Range>('1mo');
  readonly ranges: Range[] = ['1d', '5d', '1mo', '6mo', '1y', '5y'];

  watchlist = signal<WatchRow[]>([]);

  chart = computed(() => buildChart(this.history()?.points ?? []));

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private watchSub?: Subscription;

  constructor(private stocks: StockService) {}

  ngOnInit() {
    this.setupSearch();
    this.loadWatchlistFromStorage();
    this.refreshWatchlist();
    this.selectSymbol(DEFAULT_SYMBOL);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.watchSub?.unsubscribe();
  }

  // ---------- Search ----------

  private setupSearch() {
    this.searchSubject
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(q => (q.trim().length >= 1 ? this.stocks.search(q) : of([] as SymbolMatch[]))),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: results => {
          this.searchResults = results;
          this.showResults = results.length > 0;
        },
        error: () => {
          this.searchResults = [];
          this.showResults = false;
        }
      });
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  onSearchBlur() {
    setTimeout(() => (this.showResults = false), 150);
  }

  onSearchFocus() {
    if (this.searchResults.length) this.showResults = true;
  }

  selectMatch(match: SymbolMatch) {
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;
    this.selectSymbol(match.symbol);
  }

  // ---------- Detail load ----------

  selectSymbol(symbol: string) {
    this.error.set('');
    this.loadingQuote.set(true);
    this.loadingHistory.set(true);
    this.history.set(null);

    this.stocks.getQuote(symbol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: q => {
          this.quote.set(q);
          this.loadingQuote.set(false);
        },
        error: () => {
          this.error.set(`Could not load quote for "${symbol}".`);
          this.quote.set(null);
          this.loadingQuote.set(false);
        }
      });

    this.loadHistory(symbol, this.range());
  }

  setRange(r: Range) {
    if (this.range() === r) return;
    this.range.set(r);
    const sym = this.quote()?.symbol;
    if (sym) this.loadHistory(sym, r);
  }

  private loadHistory(symbol: string, r: Range) {
    this.loadingHistory.set(true);
    this.stocks.getHistory(symbol, r)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: h => {
          this.history.set(h);
          this.loadingHistory.set(false);
        },
        error: () => {
          this.history.set(null);
          this.loadingHistory.set(false);
        }
      });
  }

  // ---------- Watchlist ----------

  private loadWatchlistFromStorage() {
    let symbols = DEFAULT_WATCHLIST;
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every(s => typeof s === 'string')) {
          symbols = parsed;
        }
      }
    } catch {
      // ignore
    }
    this.watchlist.set(symbols.map(symbol => ({
      symbol,
      name: symbol,
      price: 0,
      changePercent: 0,
      currency: 'USD'
    })));
  }

  private saveWatchlist() {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(this.watchlist().map(r => r.symbol)));
    } catch {
      // ignore
    }
  }

  refreshWatchlist() {
    const rows = this.watchlist();
    if (!rows.length) return;
    this.watchSub?.unsubscribe();
    this.watchSub = forkJoin(rows.map(r => this.stocks.getQuote(r.symbol)))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: quotes => {
          this.watchlist.set(quotes.map(q => ({
            symbol: q.symbol,
            name: q.name,
            price: q.price,
            changePercent: q.changePercent,
            currency: q.currency
          })));
        },
        error: () => {
          // leave rows as-is
        }
      });
  }

  toggleWatchlist(symbol: string) {
    const rows = this.watchlist();
    if (rows.some(r => r.symbol === symbol)) {
      this.watchlist.set(rows.filter(r => r.symbol !== symbol));
    } else {
      const q = this.quote();
      this.watchlist.set([
        ...rows,
        {
          symbol,
          name: q?.name ?? symbol,
          price: q?.price ?? 0,
          changePercent: q?.changePercent ?? 0,
          currency: q?.currency ?? 'USD'
        }
      ]);
    }
    this.saveWatchlist();
    this.refreshWatchlist();
  }

  isWatched(symbol: string | undefined): boolean {
    if (!symbol) return false;
    return this.watchlist().some(r => r.symbol === symbol);
  }

  // ---------- Formatting ----------

  formatPrice(value: number | undefined, currency = 'USD'): string {
    if (value == null || isNaN(value)) return '—';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: value >= 1000 ? 2 : 4
      }).format(value);
    } catch {
      return value.toFixed(2);
    }
  }

  formatNumber(value: number | undefined): string {
    if (value == null || isNaN(value)) return '—';
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return value.toLocaleString();
  }

  formatPct(value: number | undefined): string {
    if (value == null || isNaN(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  formatTime(epochSec: number | undefined): string {
    if (!epochSec) return '';
    return new Date(epochSec * 1000).toLocaleString();
  }
}

// ---------- Chart geometry ----------

export interface ChartGeometry {
  width: number;
  height: number;
  path: string;
  areaPath: string;
  rising: boolean;
  min: number;
  max: number;
  firstClose: number;
  lastClose: number;
}

function buildChart(points: HistoryPoint[]): ChartGeometry | null {
  if (!points || points.length < 2) return null;
  const width = 800;
  const height = 280;
  const padding = { top: 16, right: 8, bottom: 16, left: 8 };

  const closes = points.map(p => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const xy = points.map((p, i) => {
    const x = padding.left + (i / (points.length - 1)) * innerW;
    const y = padding.top + innerH - ((p.close - min) / span) * innerH;
    return { x, y };
  });

  const path = xy.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');
  const areaPath = `${path} L${xy[xy.length - 1].x.toFixed(2)},${(padding.top + innerH).toFixed(2)} L${xy[0].x.toFixed(2)},${(padding.top + innerH).toFixed(2)} Z`;

  return {
    width,
    height,
    path,
    areaPath,
    rising: closes[closes.length - 1] >= closes[0],
    min,
    max,
    firstClose: closes[0],
    lastClose: closes[closes.length - 1]
  };
}

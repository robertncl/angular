import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StockComponent } from './stock.component';
import { StockService, Quote, NewsItem, History, SymbolMatch } from '../stock.service';

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 231.52,
    previousClose: 227.4,
    change: 4.12,
    changePercent: 1.81,
    open: 228.1,
    dayHigh: 232.4,
    dayLow: 227.55,
    fiftyTwoWeekHigh: 237.23,
    fiftyTwoWeekLow: 164.08,
    volume: 58230000,
    marketState: 'REGULAR',
    regularMarketTime: 1700000000,
    ...overrides
  };
}

describe('StockComponent', () => {
  let fixture: ComponentFixture<StockComponent>;
  let component: StockComponent;
  let stocks: jasmine.SpyObj<StockService>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    stocks = jasmine.createSpyObj<StockService>('StockService', ['search', 'getNews', 'getQuote', 'getHistory']);
    stocks.search.and.returnValue(of([]));
    stocks.getNews.and.returnValue(of([]));
    stocks.getQuote.and.returnValue(of(makeQuote()));
    stocks.getHistory.and.returnValue(of({ symbol: 'AAPL', currency: 'USD', points: [] } as History));

    TestBed.configureTestingModule({
      imports: [StockComponent],
      providers: [{ provide: StockService, useValue: stocks }]
    });

    fixture = TestBed.createComponent(StockComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('bootstraps dark theme by default', () => {
      fixture.detectChanges();
      expect(component.theme()).toBe('dark');
    });

    it('bootstraps light theme when data-theme="light" is already set', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      fixture.detectChanges();
      expect(component.theme()).toBe('light');
    });

    it('loads the default symbol (AAPL) on init', () => {
      fixture.detectChanges();
      expect(stocks.getQuote).toHaveBeenCalledWith('AAPL');
      expect(stocks.getHistory).toHaveBeenCalledWith('AAPL', '1mo');
      expect(stocks.getNews).toHaveBeenCalledWith('AAPL');
    });

    it('seeds the watch category from the default watchlist when localStorage is empty', () => {
      fixture.detectChanges();
      expect(component.rows().map(r => r.symbol)).toEqual(['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA']);
    });
  });

  describe('toggleTheme', () => {
    it('flips dark -> light and persists it', () => {
      fixture.detectChanges();
      component.toggleTheme();
      expect(component.theme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('stockwatch.theme')).toBe('light');
    });

    it('flips light -> dark', () => {
      fixture.detectChanges();
      component.toggleTheme();
      component.toggleTheme();
      expect(component.theme()).toBe('dark');
    });

    it('updates the color-scheme meta tag when present', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'color-scheme');
      document.head.appendChild(meta);
      fixture.detectChanges();
      component.toggleTheme();
      expect(meta.content).toBe('light');
      meta.remove();
    });

    it('does not throw when localStorage.setItem fails', () => {
      fixture.detectChanges();
      spyOn(localStorage, 'setItem').and.throwError('quota exceeded');
      expect(() => component.toggleTheme()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('completes destroy$ and unsubscribes the category subscription without throwing', () => {
      fixture.detectChanges();
      component.setCategory('stocks');
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('search', () => {
    it('debounces input and calls StockService.search after 250ms', fakeAsync(() => {
      fixture.detectChanges();
      stocks.search.and.returnValue(of([{ symbol: 'AAPL', shortname: 'Apple', exchange: 'NASDAQ', quoteType: 'EQUITY' } as SymbolMatch]));
      component.searchQuery = 'aap';
      component.onSearchInput();
      tick(249);
      expect(stocks.search).not.toHaveBeenCalled();
      tick(1);
      expect(stocks.search).toHaveBeenCalledWith('aap');
      expect(component.searchResults.length).toBe(1);
      expect(component.showResults).toBeTrue();
    }));

    it('does not call the search API for an empty/whitespace query', fakeAsync(() => {
      fixture.detectChanges();
      component.searchQuery = '   ';
      component.onSearchInput();
      tick(300);
      expect(stocks.search).not.toHaveBeenCalled();
      expect(component.searchResults).toEqual([]);
    }));

    it('clears results and hides the panel when the search call errors', fakeAsync(() => {
      fixture.detectChanges();
      stocks.search.and.returnValue(throwError(() => new Error('network')));
      component.searchQuery = 'zzz';
      component.onSearchInput();
      tick(300);
      expect(component.searchResults).toEqual([]);
      expect(component.showResults).toBeFalse();
    }));

    it('distinctUntilChanged suppresses a repeated identical query', fakeAsync(() => {
      fixture.detectChanges();
      component.searchQuery = 'aapl';
      component.onSearchInput();
      tick(300);
      const callsAfterFirst = stocks.search.calls.count();
      component.searchQuery = 'aapl';
      component.onSearchInput();
      tick(300);
      expect(stocks.search.calls.count()).toBe(callsAfterFirst);
    }));

    it('onSearchFocus reopens the panel when there are existing results', () => {
      fixture.detectChanges();
      component.searchResults = [{ symbol: 'AAPL', shortname: 'Apple', exchange: 'NASDAQ', quoteType: 'EQUITY' }];
      component.showResults = false;
      component.onSearchFocus();
      expect(component.showResults).toBeTrue();
    });

    it('onSearchFocus is a no-op when there are no results', () => {
      fixture.detectChanges();
      component.searchResults = [];
      component.showResults = false;
      component.onSearchFocus();
      expect(component.showResults).toBeFalse();
    });

    it('onSearchBlur hides the panel after a short delay', fakeAsync(() => {
      fixture.detectChanges();
      component.showResults = true;
      component.onSearchBlur();
      expect(component.showResults).toBeTrue();
      tick(150);
      expect(component.showResults).toBeFalse();
    }));

    it('selectMatch clears the query/results and loads the chosen symbol', () => {
      fixture.detectChanges();
      stocks.getQuote.calls.reset();
      component.searchQuery = 'msf';
      component.searchResults = [{ symbol: 'MSFT', shortname: 'Microsoft', exchange: 'NASDAQ', quoteType: 'EQUITY' }];
      component.showResults = true;
      component.selectMatch(component.searchResults[0]);
      expect(component.searchQuery).toBe('');
      expect(component.searchResults).toEqual([]);
      expect(component.showResults).toBeFalse();
      expect(stocks.getQuote).toHaveBeenCalledWith('MSFT');
    });
  });

  describe('selectSymbol', () => {
    it('populates quote/history/news on success', () => {
      const quote = makeQuote({ symbol: 'MSFT' });
      const news: NewsItem[] = [{ uuid: 'u', title: 't', publisher: 'p', link: 'l', providerPublishTime: 1 }];
      const history: History = { symbol: 'MSFT', currency: 'USD', points: [{ time: 1, close: 2 }] };
      stocks.getQuote.and.returnValue(of(quote));
      stocks.getNews.and.returnValue(of(news));
      stocks.getHistory.and.returnValue(of(history));

      fixture.detectChanges();
      component.selectSymbol('MSFT');

      expect(component.quote()).toEqual(quote);
      expect(component.news()).toEqual(news);
      expect(component.history()).toEqual(history);
      expect(component.loadingQuote()).toBeFalse();
      expect(component.loadingHistory()).toBeFalse();
      expect(component.loadingNews()).toBeFalse();
      expect(component.error()).toBe('');
    });

    it('sets an error and clears the quote when getQuote fails', () => {
      stocks.getQuote.and.returnValue(throwError(() => new Error('boom')));
      fixture.detectChanges();
      component.selectSymbol('BADSYM');
      expect(component.error()).toBe('Could not load quote for "BADSYM".');
      expect(component.quote()).toBeNull();
      expect(component.loadingQuote()).toBeFalse();
    });

    it('clears history and stops the loading flag when getHistory fails', () => {
      stocks.getHistory.and.returnValue(throwError(() => new Error('boom')));
      fixture.detectChanges();
      component.selectSymbol('AAPL');
      expect(component.history()).toBeNull();
      expect(component.loadingHistory()).toBeFalse();
    });

    it('clears news and stops the loading flag when getNews fails', () => {
      stocks.getNews.and.returnValue(throwError(() => new Error('boom')));
      fixture.detectChanges();
      component.selectSymbol('AAPL');
      expect(component.news()).toEqual([]);
      expect(component.loadingNews()).toBeFalse();
    });
  });

  describe('setRange', () => {
    it('is a no-op when re-selecting the current range', () => {
      fixture.detectChanges();
      stocks.getHistory.calls.reset();
      component.setRange('1mo');
      expect(stocks.getHistory).not.toHaveBeenCalled();
    });

    it('reloads history for the active symbol on a new range', () => {
      fixture.detectChanges();
      stocks.getHistory.calls.reset();
      component.setRange('1y');
      expect(component.range()).toBe('1y');
      expect(stocks.getHistory).toHaveBeenCalledWith('AAPL', '1y');
    });

    it('does not call getHistory when there is no active quote symbol', () => {
      fixture.detectChanges();
      component.quote.set(null);
      stocks.getHistory.calls.reset();
      component.setRange('5d');
      expect(stocks.getHistory).not.toHaveBeenCalled();
    });
  });

  describe('onCatTabKeydown', () => {
    function keyEvent(key: string): KeyboardEvent {
      return new KeyboardEvent('keydown', { key });
    }

    it('ArrowRight moves to the next category and wraps at the end', () => {
      fixture.detectChanges();
      const ev = keyEvent('ArrowRight');
      spyOn(ev, 'preventDefault');
      component.onCatTabKeydown(ev, 'commodities'); // last category -> wraps to first
      expect(ev.preventDefault).toHaveBeenCalled();
      expect(component.activeCategory()).toBe('watch');
    });

    it('ArrowLeft moves to the previous category and wraps at the start', () => {
      fixture.detectChanges();
      component.onCatTabKeydown(keyEvent('ArrowLeft'), 'watch');
      expect(component.activeCategory()).toBe('commodities');
    });

    it('Home jumps to the first category', () => {
      fixture.detectChanges();
      component.onCatTabKeydown(keyEvent('Home'), 'crypto');
      expect(component.activeCategory()).toBe('watch');
    });

    it('End jumps to the last category', () => {
      fixture.detectChanges();
      component.onCatTabKeydown(keyEvent('End'), 'watch');
      expect(component.activeCategory()).toBe('commodities');
    });

    it('ignores unrelated keys and does not call preventDefault', () => {
      fixture.detectChanges();
      const ev = keyEvent('Tab');
      spyOn(ev, 'preventDefault');
      component.onCatTabKeydown(ev, 'watch');
      expect(ev.preventDefault).not.toHaveBeenCalled();
      expect(component.activeCategory()).toBe('watch');
    });
  });

  describe('categories', () => {
    it('setCategory is a no-op when re-selecting the active category', () => {
      fixture.detectChanges();
      stocks.getQuote.calls.reset();
      component.setCategory('watch');
      expect(stocks.getQuote).not.toHaveBeenCalled();
    });

    it('setCategory switches category and loads quotes for its symbols', () => {
      fixture.detectChanges();
      stocks.getQuote.and.returnValue(of(makeQuote({ symbol: 'SPY', name: 'SPDR S&P 500', price: 612, changePercent: 0.4 })));
      component.setCategory('etfs');
      expect(component.activeCategory()).toBe('etfs');
      expect(component.rows().length).toBe(10);
      expect(component.rows()[0].symbol).toBe('SPY');
      expect(component.rows()[0].price).toBe(612);
    });

    it('tolerates a per-symbol quote failure by falling back to a zeroed row', () => {
      fixture.detectChanges();
      stocks.getQuote.and.callFake((sym: string) =>
        sym === 'QQQ' ? throwError(() => new Error('fail')) : of(makeQuote({ symbol: sym }))
      );
      component.setCategory('etfs');
      const qqqRow = component.rows().find(r => r.symbol === 'QQQ');
      expect(qqqRow).toEqual({ symbol: 'QQQ', name: 'QQQ', price: 0, changePercent: 0, currency: 'USD' });
    });

    it('refreshActive forces a reload of the current category even if already loaded', () => {
      fixture.detectChanges();
      component.setCategory('stocks');
      stocks.getQuote.calls.reset();
      component.refreshActive();
      expect(stocks.getQuote).toHaveBeenCalled();
    });

    it('does not re-fetch a category already loaded with the same symbol count', () => {
      fixture.detectChanges();
      component.setCategory('stocks');
      stocks.getQuote.calls.reset();
      component.setCategory('watch');
      component.setCategory('stocks');
      expect(stocks.getQuote).not.toHaveBeenCalled();
    });

    it('sets an empty row set for the watch category when the watchlist is empty', () => {
      localStorage.setItem('stockapp.watchlist.v1', JSON.stringify([]));
      fixture.detectChanges(); // ngOnInit: bootstrapWatchlist + loadCategory('watch') both see an empty list
      expect(component.rows()).toEqual([]);
    });

    it('stops the loadingCategory flag even when the combined forkJoin path completes with an error subscriber', () => {
      fixture.detectChanges();
      // getQuote errors are already caught per-symbol via catchError, so forkJoin itself
      // should always reach next(), never error() — this asserts loadingCategory settles to false.
      component.setCategory('crypto');
      expect(component.loadingCategory()).toBeFalse();
    });
  });

  describe('watchlist persistence', () => {
    it('reads the default watchlist when localStorage is empty', () => {
      fixture.detectChanges();
      expect(component.isWatched('TSLA')).toBeTrue();
      expect(component.isWatched('SPY')).toBeFalse();
    });

    it('falls back to defaults when localStorage contains invalid JSON', () => {
      localStorage.setItem('stockapp.watchlist.v1', '{not json');
      fixture.detectChanges();
      expect(component.isWatched('AAPL')).toBeTrue();
    });

    it('falls back to defaults when localStorage contains a non-array', () => {
      localStorage.setItem('stockapp.watchlist.v1', JSON.stringify({ not: 'an array' }));
      fixture.detectChanges();
      expect(component.isWatched('AAPL')).toBeTrue();
    });

    it('falls back to defaults when the array contains non-string entries', () => {
      localStorage.setItem('stockapp.watchlist.v1', JSON.stringify(['AAPL', 42]));
      fixture.detectChanges();
      expect(component.isWatched('AAPL')).toBeTrue();
      expect(component.rows().length).toBe(5); // default watchlist, not the malformed one
    });

    it('isWatched returns false for an undefined symbol', () => {
      fixture.detectChanges();
      expect(component.isWatched(undefined)).toBeFalse();
    });

    it('toggleWatchlist adds a symbol not yet on the list and persists it', () => {
      fixture.detectChanges();
      component.toggleWatchlist('SPY');
      expect(component.isWatched('SPY')).toBeTrue();
      const stored = JSON.parse(localStorage.getItem('stockapp.watchlist.v1')!);
      expect(stored).toContain('SPY');
    });

    it('toggleWatchlist removes a symbol already on the list', () => {
      fixture.detectChanges();
      component.toggleWatchlist('AAPL');
      expect(component.isWatched('AAPL')).toBeFalse();
      const stored = JSON.parse(localStorage.getItem('stockapp.watchlist.v1')!);
      expect(stored).not.toContain('AAPL');
    });

    it('toggleWatchlist refreshes the watch category rows', () => {
      // The default stub always resolves to an AAPL-shaped quote regardless of
      // the requested symbol, so echo the requested symbol back to prove each
      // row is keyed off its own quote.
      stocks.getQuote.and.callFake((sym: string) => of(makeQuote({ symbol: sym })));
      fixture.detectChanges();
      component.setCategory('etfs');
      component.toggleWatchlist('QQQ');
      component.setCategory('watch');
      expect(component.rows().some(r => r.symbol === 'QQQ')).toBeTrue();
    });

    it('does not throw when localStorage.setItem fails while toggling', () => {
      fixture.detectChanges();
      spyOn(localStorage, 'setItem').and.throwError('quota exceeded');
      expect(() => component.toggleWatchlist('SPY')).not.toThrow();
    });
  });

  describe('formatPrice', () => {
    it('formats a normal USD value as currency', () => {
      expect(component.formatPrice(231.5)).toBe('$231.50');
    });

    it('returns an em dash for undefined', () => {
      expect(component.formatPrice(undefined)).toBe('—');
    });

    it('returns an em dash for NaN', () => {
      expect(component.formatPrice(NaN)).toBe('—');
    });

    it('returns an em dash for exactly zero (placeholder row)', () => {
      expect(component.formatPrice(0)).toBe('—');
    });

    it('uses up to 4 fraction digits under $1000', () => {
      expect(component.formatPrice(0.1234)).toBe('$0.1234');
    });

    it('uses 2 fraction digits at/above $1000', () => {
      expect(component.formatPrice(1234.5)).toBe('$1,234.50');
    });

    it('respects a custom currency code', () => {
      expect(component.formatPrice(10, 'EUR')).toContain('10');
    });

    it('falls back to toFixed(2) when Intl.NumberFormat throws for a bad currency', () => {
      expect(component.formatPrice(10, 'NOT_A_CURRENCY')).toBe('10.00');
    });
  });

  describe('formatNumber', () => {
    it('formats trillions', () => {
      expect(component.formatNumber(3.58e12)).toBe('3.58T');
    });
    it('formats billions', () => {
      expect(component.formatNumber(650.4e9)).toBe('650.40B');
    });
    it('formats millions', () => {
      expect(component.formatNumber(58.23e6)).toBe('58.23M');
    });
    it('formats thousands', () => {
      expect(component.formatNumber(4.2e3)).toBe('4.20K');
    });
    it('uses toLocaleString below one thousand', () => {
      expect(component.formatNumber(842)).toBe((842).toLocaleString());
    });
    it('returns an em dash for undefined', () => {
      expect(component.formatNumber(undefined)).toBe('—');
    });
    it('returns an em dash for NaN', () => {
      expect(component.formatNumber(NaN)).toBe('—');
    });
  });

  describe('formatPct', () => {
    it('prefixes a positive value with +', () => {
      expect(component.formatPct(1.82)).toBe('+1.82%');
    });
    it('does not prefix zero (strictly > 0, unlike trading-data.fmtPct)', () => {
      expect(component.formatPct(0)).toBe('0.00%');
    });
    it('does not prefix a negative value', () => {
      expect(component.formatPct(-1.24)).toBe('-1.24%');
    });
    it('returns an em dash for undefined', () => {
      expect(component.formatPct(undefined)).toBe('—');
    });
    it('returns an em dash for NaN', () => {
      expect(component.formatPct(NaN)).toBe('—');
    });
  });

  describe('formatTime', () => {
    it('returns an empty string for a falsy epoch', () => {
      expect(component.formatTime(undefined)).toBe('');
      expect(component.formatTime(0)).toBe('');
    });
    it('formats a valid epoch as a locale date/time string', () => {
      const epoch = 1700000000;
      expect(component.formatTime(epoch)).toBe(new Date(epoch * 1000).toLocaleString());
    });
  });

  describe('formatNewsDate', () => {
    const NOW = new Date('2026-07-31T12:00:00Z').getTime();

    beforeEach(() => jasmine.clock().mockDate(new Date(NOW)));
    afterEach(() => jasmine.clock().uninstall());

    it('returns an empty string for a falsy epoch', () => {
      expect(component.formatNewsDate(0)).toBe('');
    });

    it('formats minutes-ago for < 1 hour', () => {
      const epoch = Math.floor((NOW - 5 * 60000) / 1000);
      expect(component.formatNewsDate(epoch)).toBe('5m ago');
    });

    it('formats hours-ago for < 24 hours', () => {
      const epoch = Math.floor((NOW - 3 * 3600000) / 1000);
      expect(component.formatNewsDate(epoch)).toBe('3h ago');
    });

    it('formats days-ago for < 7 days', () => {
      const epoch = Math.floor((NOW - 2 * 86400000) / 1000);
      expect(component.formatNewsDate(epoch)).toBe('2d ago');
    });

    it('formats a locale date for >= 7 days', () => {
      const epoch = Math.floor((NOW - 10 * 86400000) / 1000);
      const expected = new Date(epoch * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      expect(component.formatNewsDate(epoch)).toBe(expected);
    });
  });

  describe('derived signals', () => {
    it('activeCategoryMeta reflects the active category', () => {
      fixture.detectChanges();
      expect(component.activeCategoryMeta().id).toBe('watch');
      component.setCategory('crypto');
      expect(component.activeCategoryMeta().id).toBe('crypto');
    });

    it('chart is null when history has fewer than 2 points', () => {
      fixture.detectChanges();
      expect(component.chart()).toBeNull();
    });

    it('chart builds real geometry for 2+ history points', () => {
      stocks.getHistory.and.returnValue(of({
        symbol: 'AAPL', currency: 'USD',
        points: [{ time: 1, close: 10 }, { time: 2, close: 12 }, { time: 3, close: 11 }]
      }));
      fixture.detectChanges();
      const chart = component.chart();
      expect(chart).not.toBeNull();
      expect(chart!.rising).toBeTrue(); // 11 >= 10
      expect(chart!.firstClose).toBe(10);
      expect(chart!.lastClose).toBe(11);
    });
  });
});

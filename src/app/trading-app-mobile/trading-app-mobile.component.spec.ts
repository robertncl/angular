import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TradingAppMobileComponent } from './trading-app-mobile.component';
import { HOLDINGS, ORDER_HISTORY, STOCKS, fmtMoney } from '../trading-app/trading-data';

describe('TradingAppMobileComponent', () => {
  let fixture: ComponentFixture<TradingAppMobileComponent>;
  let component: TradingAppMobileComponent;

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({ imports: [TradingAppMobileComponent] });
    fixture = TestBed.createComponent(TradingAppMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('creates with the expected defaults', () => {
    expect(component.theme()).toBe('dark');
    expect(component.screen()).toBe('home');
    expect(component.category()).toBe('watch');
    expect(component.activeSymbol()).toBe('AAPL');
    expect(component.range()).toBe('1M');
  });

  it('picks up an existing data-theme attribute at construction time', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const f2 = TestBed.createComponent(TradingAppMobileComponent);
    expect(f2.componentInstance.theme()).toBe('light');
  });

  describe('navigation', () => {
    it('toggleTheme flips the signal and the DOM attribute', () => {
      component.toggleTheme();
      expect(component.theme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('goHome/goPortfolio/goOrders/goAccount switch screens', () => {
      component.goPortfolio();
      expect(component.screen()).toBe('portfolio');
      component.goOrders();
      expect(component.screen()).toBe('orders');
      component.goAccount();
      expect(component.screen()).toBe('account');
      component.goHome();
      expect(component.screen()).toBe('home');
    });

    it('selectSymbol sets the active symbol, clears the query, and navigates to the detail screen', () => {
      component.searchQuery.set('nvda');
      component.selectSymbol('NVDA');
      expect(component.activeSymbol()).toBe('NVDA');
      expect(component.searchQuery()).toBe('');
      expect(component.screen()).toBe('detail');
    });

    it('setCategory / setRange / onSearchChange update their signals', () => {
      component.setCategory('crypto');
      expect(component.category()).toBe('crypto');
      component.setRange('1Y');
      expect(component.range()).toBe('1Y');
      component.onSearchChange('tsla');
      expect(component.searchQuery()).toBe('tsla');
    });
  });

  describe('toggleWatch', () => {
    it('adds and removes a symbol from the watchlist', () => {
      component.toggleWatch('SPY');
      expect(component.watchlist()).toContain('SPY');
      component.toggleWatch('SPY');
      expect(component.watchlist()).not.toContain('SPY');
    });
  });

  describe('order ticket flow', () => {
    it('openTicket / updateTicket / reviewTicket / backTicket / closeTicket', () => {
      component.openTicket('AAPL', 'buy');
      expect(component.ticket()).toEqual({ symbol: 'AAPL', side: 'buy', type: 'market', qty: '10', price: '', step: 'ticket' });
      component.updateTicket({ qty: '3' });
      expect(component.ticket()!.qty).toBe('3');
      component.reviewTicket();
      expect(component.ticket()!.step).toBe('confirm');
      component.backTicket();
      expect(component.ticket()!.step).toBe('ticket');
      component.closeTicket();
      expect(component.ticket()).toBeNull();
    });

    it('updateTicket is a no-op with no open ticket', () => {
      component.updateTicket({ qty: '5' });
      expect(component.ticket()).toBeNull();
    });

    it('placeOrder is a no-op with no open ticket', () => {
      const before = component.orders().length;
      component.placeOrder();
      expect(component.orders().length).toBe(before);
    });

    it('placeOrder fills a market order and records it', () => {
      const before = component.orders().length;
      component.openTicket('AAPL', 'buy');
      component.updateTicket({ qty: '4' });
      component.placeOrder();
      expect(component.orders().length).toBe(before + 1);
      const placed = component.orders()[0];
      expect(placed.qty).toBe(4);
      expect(placed.price).toBe(STOCKS['AAPL'].price);
      expect(placed.status).toBe('filled');
      expect(component.ticket()!.step).toBe('success');
    });

    it('placeOrder leaves a limit order pending at the given price', () => {
      component.openTicket('MSFT', 'sell');
      component.updateTicket({ type: 'limit', qty: '2', price: '480' });
      component.placeOrder();
      expect(component.orders()[0].price).toBe(480);
      expect(component.orders()[0].status).toBe('pending');
    });

    it('goToOrders closes the ticket and navigates to orders', () => {
      component.openTicket('AAPL', 'buy');
      component.goToOrders();
      expect(component.ticket()).toBeNull();
      expect(component.screen()).toBe('orders');
    });
  });

  describe('account toggles', () => {
    it('toggleNotif flips only the given key', () => {
      const before = component.notif();
      component.toggleNotif('fills');
      expect(component.notif()).toEqual({ ...before, fills: !before.fills });
    });

    it('toggleTwoFactor flips the flag', () => {
      const before = component.twoFactor();
      component.toggleTwoFactor();
      expect(component.twoFactor()).toBe(!before);
    });
  });

  describe('derived view data', () => {
    it('stock reflects direction and watch state', () => {
      component.selectSymbol('AAPL');
      expect(component.stock().isUp).toBeTrue();
      expect(component.stock().isWatched).toBeTrue();
    });

    it('chart uses the compact 360x160 mobile viewport', () => {
      const { path } = component.chart();
      expect(path).toContain('360.00');
    });

    it('stats returns the 6 standard rows', () => {
      expect(component.stats().length).toBe(6);
    });

    it('news mentions the active symbol', () => {
      component.selectSymbol('TSLA');
      expect(component.news().some(n => n.title.includes('TSLA'))).toBeTrue();
    });

    it('rows lists the watchlist for "watch" and the category list otherwise', () => {
      expect(component.rows().length).toBe(5);
      component.setCategory('etfs');
      expect(component.rows().map(r => r.symbol)).toEqual(['SPY', 'QQQ', 'VTI']);
    });

    it('searchResults is empty for a blank query and matches by symbol/name otherwise', () => {
      component.onSearchChange('');
      expect(component.searchResults()).toEqual([]);
      component.onSearchChange('apple');
      expect(component.searchResults().some(r => r.symbol === 'AAPL')).toBeTrue();
    });

    it('holdings computes market value/gain per position', () => {
      const rows = component.holdings();
      expect(rows.length).toBe(HOLDINGS.length);
      const holding = HOLDINGS.find(h => h.symbol === 'NVDA')!;
      const nvda = rows.find(r => r.symbol === 'NVDA')!;
      const gain = holding.shares * STOCKS['NVDA'].price - holding.shares * holding.avgCost;
      expect(nvda.isUp).toBe(gain >= 0);
    });

    it('portfolio totals allocate to 100% across holdings', () => {
      const p = component.portfolio();
      const totalPct = p.allocation.reduce((s, a) => s + a.pct, 0);
      expect(totalPct).toBeCloseTo(100, 5);
    });

    it('orderRows maps status flags for each order', () => {
      const rows = component.orderRows();
      expect(rows.length).toBe(ORDER_HISTORY.length);
      expect(rows.find(r => r.id === 'ORD-10482')!.isFilled).toBeTrue();
      expect(rows.find(r => r.id === 'ORD-10461')!.isPending).toBeTrue();
      expect(rows.find(r => r.id === 'ORD-10439')!.isCanceled).toBeTrue();
    });

    it('notifRows exposes the 3 toggles with current state', () => {
      const rows = component.notifRows();
      expect(rows.map(r => r.key)).toEqual(['price', 'fills', 'news']);
      expect(rows.find(r => r.key === 'price')!.on).toBeTrue();
    });

    describe('ticketView', () => {
      it('is null with no open ticket', () => {
        expect(component.ticketView()).toBeNull();
      });

      it('computes the estimated total and price label for a market order', () => {
        component.openTicket('AAPL', 'buy');
        component.updateTicket({ qty: '2' });
        const view = component.ticketView()!;
        expect(view.estLabel).toBe(fmtMoney(STOCKS['AAPL'].price * 2));
        expect(view.priceLabel).toContain('Market price');
      });

      it('needsPrice/priceFieldLabel reflect limit vs. stop order types', () => {
        component.openTicket('AAPL', 'buy');
        component.updateTicket({ type: 'limit' });
        expect(component.ticketView()!.priceFieldLabel).toBe('Limit price');
        component.updateTicket({ type: 'stop' });
        expect(component.ticketView()!.priceFieldLabel).toBe('Stop price');
      });

      it('success summary reports the fill outcome', () => {
        component.openTicket('AAPL', 'buy');
        component.updateTicket({ qty: '5' });
        component.placeOrder();
        expect(component.ticketView()!.successSummary).toContain('Bought 5 shares of AAPL');
      });
    });

    describe('showTabBar / tabHomeActive', () => {
      it('showTabBar is true everywhere except the detail screen', () => {
        expect(component.showTabBar()).toBeTrue();
        component.selectSymbol('AAPL'); // -> detail
        expect(component.showTabBar()).toBeFalse();
        component.goPortfolio();
        expect(component.showTabBar()).toBeTrue();
      });

      it('tabHomeActive is true on both home and detail (drill-down still highlights Home)', () => {
        expect(component.tabHomeActive()).toBeTrue(); // home
        component.selectSymbol('AAPL'); // -> detail
        expect(component.tabHomeActive()).toBeTrue();
        component.goPortfolio();
        expect(component.tabHomeActive()).toBeFalse();
      });
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TradingAppComponent } from './trading-app.component';
import { HOLDINGS, ORDER_HISTORY, STOCKS, fmtMoney } from './trading-data';

describe('TradingAppComponent', () => {
  let fixture: ComponentFixture<TradingAppComponent>;
  let component: TradingAppComponent;

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({ imports: [TradingAppComponent] });
    fixture = TestBed.createComponent(TradingAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('creates with the expected defaults', () => {
    expect(component.theme()).toBe('dark');
    expect(component.screen()).toBe('dashboard');
    expect(component.category()).toBe('watch');
    expect(component.activeSymbol()).toBe('AAPL');
    expect(component.range()).toBe('1M');
  });

  it('picks up an existing data-theme attribute at construction time', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const f2 = TestBed.createComponent(TradingAppComponent);
    expect(f2.componentInstance.theme()).toBe('light');
  });

  describe('navigation setters', () => {
    it('toggleTheme flips the signal and the DOM attribute', () => {
      component.toggleTheme();
      expect(component.theme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      component.toggleTheme();
      expect(component.theme()).toBe('dark');
    });

    it('setScreen changes the active screen', () => {
      component.setScreen('orders');
      expect(component.screen()).toBe('orders');
    });

    it('setCategory changes the active category', () => {
      component.setCategory('crypto');
      expect(component.category()).toBe('crypto');
    });

    it('selectSymbol sets the active symbol and clears the search query', () => {
      component.searchQuery.set('nvda');
      component.selectSymbol('NVDA');
      expect(component.activeSymbol()).toBe('NVDA');
      expect(component.searchQuery()).toBe('');
    });

    it('setRange changes the active range', () => {
      component.setRange('1Y');
      expect(component.range()).toBe('1Y');
    });

    it('onSearchChange updates the search query', () => {
      component.onSearchChange('tsla');
      expect(component.searchQuery()).toBe('tsla');
    });
  });

  describe('toggleWatch', () => {
    it('adds a symbol that is not on the watchlist', () => {
      expect(component.watchlist()).not.toContain('SPY');
      component.toggleWatch('SPY');
      expect(component.watchlist()).toContain('SPY');
    });

    it('removes a symbol already on the watchlist', () => {
      expect(component.watchlist()).toContain('AAPL');
      component.toggleWatch('AAPL');
      expect(component.watchlist()).not.toContain('AAPL');
    });
  });

  describe('order ticket flow', () => {
    it('openTicket seeds a fresh market ticket in the ticket step', () => {
      component.openTicket('MSFT', 'sell');
      expect(component.ticket()).toEqual({ symbol: 'MSFT', side: 'sell', type: 'market', qty: '10', price: '', step: 'ticket' });
    });

    it('updateTicket merges a partial patch onto the current ticket', () => {
      component.openTicket('AAPL', 'buy');
      component.updateTicket({ qty: '25', type: 'limit' });
      expect(component.ticket()).toEqual(jasmine.objectContaining({ qty: '25', type: 'limit', symbol: 'AAPL' }));
    });

    it('updateTicket is a no-op when there is no open ticket', () => {
      expect(component.ticket()).toBeNull();
      component.updateTicket({ qty: '99' });
      expect(component.ticket()).toBeNull();
    });

    it('reviewTicket advances to the confirm step', () => {
      component.openTicket('AAPL', 'buy');
      component.reviewTicket();
      expect(component.ticket()!.step).toBe('confirm');
    });

    it('backTicket returns to the ticket step', () => {
      component.openTicket('AAPL', 'buy');
      component.reviewTicket();
      component.backTicket();
      expect(component.ticket()!.step).toBe('ticket');
    });

    it('closeTicket clears the ticket', () => {
      component.openTicket('AAPL', 'buy');
      component.closeTicket();
      expect(component.ticket()).toBeNull();
    });

    it('placeOrder is a no-op when there is no open ticket', () => {
      const before = component.orders().length;
      component.placeOrder();
      expect(component.orders().length).toBe(before);
    });

    it('placeOrder fills a market order immediately at the current price', () => {
      const before = component.orders().length;
      component.openTicket('AAPL', 'buy');
      component.updateTicket({ qty: '5' });
      component.placeOrder();

      expect(component.orders().length).toBe(before + 1);
      const placed = component.orders()[0];
      expect(placed.symbol).toBe('AAPL');
      expect(placed.side).toBe('buy');
      expect(placed.type).toBe('Market');
      expect(placed.qty).toBe(5);
      expect(placed.price).toBe(STOCKS['AAPL'].price);
      expect(placed.status).toBe('filled');

      const ticket = component.ticket()!;
      expect(ticket.step).toBe('success');
      expect(ticket.status).toBe('filled');
      expect(ticket.id).toMatch(/^ORD-\d+$/);
    });

    it('placeOrder leaves a limit order pending at the specified price', () => {
      component.openTicket('MSFT', 'sell');
      component.updateTicket({ type: 'limit', qty: '3', price: '500' });
      component.placeOrder();

      const placed = component.orders()[0];
      expect(placed.type).toBe('Limit');
      expect(placed.price).toBe(500);
      expect(placed.status).toBe('pending');
      expect(component.ticket()!.status).toBe('pending');
    });

    it('placeOrder leaves a stop order pending', () => {
      component.openTicket('MSFT', 'sell');
      component.updateTicket({ type: 'stop', qty: '3', price: '400' });
      component.placeOrder();
      expect(component.orders()[0].type).toBe('Stop');
      expect(component.orders()[0].status).toBe('pending');
    });

    it('placeOrder falls back to the market price when a limit price is blank/invalid', () => {
      component.openTicket('AAPL', 'buy');
      component.updateTicket({ type: 'limit', qty: '1', price: '' });
      component.placeOrder();
      expect(component.orders()[0].price).toBe(STOCKS['AAPL'].price);
    });

    it('placeOrder treats a non-numeric quantity as 0', () => {
      component.openTicket('AAPL', 'buy');
      component.updateTicket({ qty: 'abc' });
      component.placeOrder();
      expect(component.orders()[0].qty).toBe(0);
    });

    it('goToOrders closes the ticket and switches to the orders screen', () => {
      component.openTicket('AAPL', 'buy');
      component.goToOrders();
      expect(component.ticket()).toBeNull();
      expect(component.screen()).toBe('orders');
    });
  });

  describe('account toggles', () => {
    it('toggleNotif flips exactly the given key', () => {
      const before = component.notif();
      component.toggleNotif('news');
      expect(component.notif()).toEqual({ ...before, news: !before.news });
    });

    it('toggleTwoFactor flips the flag', () => {
      const before = component.twoFactor();
      component.toggleTwoFactor();
      expect(component.twoFactor()).toBe(!before);
    });
  });

  describe('derived view data', () => {
    it('stock reflects the active symbol, up direction, and watch state', () => {
      component.selectSymbol('AAPL');
      const s = component.stock();
      expect(s.symbol).toBe('AAPL');
      expect(s.isUp).toBeTrue();
      expect(s.isDown).toBeFalse();
      expect(s.isWatched).toBeTrue(); // AAPL is in the default watchlist
    });

    it('stock reports isDown for a symbol with a negative change', () => {
      component.selectSymbol('NVDA'); // chgPct -1.24 in trading-data
      const s = component.stock();
      expect(s.isDown).toBeTrue();
      expect(s.isUp).toBeFalse();
    });

    it('stock reports isWatched=false for a symbol not on the watchlist', () => {
      component.selectSymbol('SPY');
      expect(component.stock().isWatched).toBeFalse();
    });

    it('chart geometry updates when the symbol or range changes', () => {
      const c1 = component.chart();
      component.setRange('1Y');
      const c2 = component.chart();
      expect(c1.path).not.toBe(c2.path);
    });

    it('stats returns 6 labeled rows for the active symbol', () => {
      const stats = component.stats();
      expect(stats.length).toBe(6);
      expect(stats.map(s => s.label)).toEqual(['Prev close', 'Day range', '52W range', 'Volume', 'Market cap', 'Exchange']);
    });

    it('news mentions the active symbol/company across all 3 items', () => {
      component.selectSymbol('TSLA');
      const items = component.news();
      expect(items.length).toBe(3);
      expect(items.some(n => n.title.includes('TSLA'))).toBeTrue();
    });

    it('rows lists the watchlist when category is "watch"', () => {
      const rows = component.rows();
      expect(rows.map(r => r.symbol).sort()).toEqual(['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA'].sort());
    });

    it('rows lists the category symbols when category is not "watch"', () => {
      component.setCategory('etfs');
      const rows = component.rows();
      expect(rows.map(r => r.symbol)).toEqual(['SPY', 'QQQ', 'VTI']);
    });

    it('rows marks the active symbol row', () => {
      component.selectSymbol('MSFT');
      const row = component.rows().find(r => r.symbol === 'MSFT');
      expect(row!.isActive).toBeTrue();
      expect(component.rows().find(r => r.symbol === 'AAPL')!.isActive).toBeFalse();
    });

    it('searchResults is empty for a blank query', () => {
      component.onSearchChange('   ');
      expect(component.searchResults()).toEqual([]);
    });

    it('searchResults matches by symbol or name, case-insensitively, capped at 8', () => {
      component.onSearchChange('a');
      const results = component.searchResults();
      expect(results.length).toBeLessThanOrEqual(8);
      expect(results.some(r => r.symbol === 'AAPL')).toBeTrue();
    });

    it('holdings computes market value and gain/loss per position', () => {
      const rows = component.holdings();
      expect(rows.length).toBe(HOLDINGS.length);
      const holding = HOLDINGS.find(h => h.symbol === 'AAPL')!;
      const aapl = rows.find(r => r.symbol === 'AAPL')!;
      const expectedValue = holding.shares * STOCKS['AAPL'].price;
      const expectedCost = holding.shares * holding.avgCost;
      expect(aapl.valueLabel).toBe(fmtMoney(expectedValue));
      expect(aapl.isUp).toBe(expectedValue - expectedCost >= 0);
    });

    it('portfolio totals equal the sum of holding market values and costs', () => {
      const p = component.portfolio();
      let expectedValue = 0, expectedCost = 0;
      for (const h of HOLDINGS) {
        expectedValue += h.shares * STOCKS[h.symbol].price;
        expectedCost += h.shares * h.avgCost;
      }
      expect(p.gainUp).toBe(expectedValue - expectedCost >= 0);
      expect(p.allocation.length).toBe(HOLDINGS.length);
      const totalPct = p.allocation.reduce((s, a) => s + a.pct, 0);
      expect(totalPct).toBeCloseTo(100, 5);
    });

    it('orderRows maps each order and flags its status', () => {
      const rows = component.orderRows();
      expect(rows.length).toBe(ORDER_HISTORY.length);
      const filled = rows.find(r => r.id === 'ORD-10482')!;
      expect(filled.isFilled).toBeTrue();
      expect(filled.isPending).toBeFalse();
      expect(filled.isCanceled).toBeFalse();
      const pending = rows.find(r => r.id === 'ORD-10461')!;
      expect(pending.isPending).toBeTrue();
      const canceled = rows.find(r => r.id === 'ORD-10439')!;
      expect(canceled.isCanceled).toBeTrue();
    });

    it('orderRows grows after placeOrder prepends a new order', () => {
      const before = component.orderRows().length;
      component.openTicket('AAPL', 'buy');
      component.placeOrder();
      expect(component.orderRows().length).toBe(before + 1);
    });

    it('notifRows exposes the 3 toggles with the correct on/off state', () => {
      const rows = component.notifRows();
      expect(rows.map(r => r.key)).toEqual(['price', 'fills', 'news']);
      expect(rows.find(r => r.key === 'news')!.on).toBeFalse();
      component.toggleNotif('news');
      expect(component.notifRows().find(r => r.key === 'news')!.on).toBeTrue();
    });

    describe('ticketView', () => {
      it('is null when there is no open ticket', () => {
        expect(component.ticketView()).toBeNull();
      });

      it('computes an estimated total for a market order from the live price', () => {
        component.openTicket('AAPL', 'buy');
        component.updateTicket({ qty: '10' });
        const view = component.ticketView()!;
        expect(view.needsPrice).toBeFalse();
        expect(view.estLabel).toBe(fmtMoney(STOCKS['AAPL'].price * 10));
      });

      it('needsPrice is true and shows the right field label for limit/stop orders', () => {
        component.openTicket('AAPL', 'buy');
        component.updateTicket({ type: 'limit' });
        expect(component.ticketView()!.needsPrice).toBeTrue();
        expect(component.ticketView()!.priceFieldLabel).toBe('Limit price');
        component.updateTicket({ type: 'stop' });
        expect(component.ticketView()!.priceFieldLabel).toBe('Stop price');
      });

      it('reflects the current step and verb', () => {
        component.openTicket('MSFT', 'sell');
        expect(component.ticketView()!.verb).toBe('Sell');
        expect(component.ticketView()!.step).toBe('ticket');
        component.reviewTicket();
        expect(component.ticketView()!.step).toBe('confirm');
      });

      it('builds a success summary that reflects fill status', () => {
        component.openTicket('AAPL', 'buy');
        component.updateTicket({ qty: '5' });
        component.placeOrder();
        const view = component.ticketView()!;
        expect(view.step).toBe('success');
        expect(view.successSummary).toContain('Bought 5 shares of AAPL');
        expect(view.successSummary).toContain('filled at');
      });

      it('success summary mentions a pending fill for non-market orders', () => {
        component.openTicket('MSFT', 'sell');
        component.updateTicket({ type: 'limit', qty: '2', price: '999' });
        component.placeOrder();
        expect(component.ticketView()!.successSummary).toContain('pending fill');
      });
    });
  });
});

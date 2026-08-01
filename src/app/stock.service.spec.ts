import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { StockService } from './stock.service';

describe('StockService', () => {
  let service: StockService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(StockService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('search', () => {
    it('sends the query with quotesCount/newsCount params to the search endpoint', () => {
      service.search('AAPL').subscribe();
      const req = httpMock.expectOne(
        r => r.url === '/api/yf-search' && r.params.get('q') === 'AAPL'
      );
      expect(req.request.params.get('quotesCount')).toBe('8');
      expect(req.request.params.get('newsCount')).toBe('0');
      req.flush({ quotes: [] });
    });

    it('maps and filters quotes to supported quote types', () => {
      let result: any[] = [];
      service.search('AAPL').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-search');
      req.flush({
        quotes: [
          { symbol: 'AAPL', shortname: 'Apple', exchDisp: 'NASDAQ', quoteType: 'EQUITY' },
          { symbol: 'QQQ', longname: 'Invesco QQQ', quoteType: 'ETF' },
          { symbol: '^GSPC', quoteType: 'INDEX' },
          { symbol: 'BTC-USD', quoteType: 'CRYPTOCURRENCY' },
          { symbol: 'FUTURE', quoteType: 'FUTURE' }, // unsupported type, filtered out
          { shortname: 'No symbol', quoteType: 'EQUITY' } // no symbol, filtered out
        ]
      });
      expect(result.length).toBe(4);
      expect(result.map(r => r.symbol)).toEqual(['AAPL', 'QQQ', '^GSPC', 'BTC-USD']);
      expect(result[0]).toEqual({
        symbol: 'AAPL', shortname: 'Apple', longname: undefined, exchange: 'NASDAQ', quoteType: 'EQUITY'
      });
    });

    it('falls back to the symbol for shortname and empty string for exchange', () => {
      let result: any[] = [];
      service.search('QQQ').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-search');
      req.flush({ quotes: [{ symbol: 'QQQ', quoteType: 'ETF' }] });
      expect(result[0].shortname).toBe('QQQ');
      expect(result[0].exchange).toBe('');
    });

    it('returns an empty array when the response has no quotes field', () => {
      let result: any[] | undefined;
      service.search('zzz').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-search');
      req.flush({});
      expect(result).toEqual([]);
    });
  });

  describe('getNews', () => {
    it('sends the symbol with quotesCount=0/newsCount=8 to the search endpoint', () => {
      service.getNews('AAPL').subscribe();
      const req = httpMock.expectOne(
        r => r.url === '/api/yf-search' && r.params.get('q') === 'AAPL'
      );
      expect(req.request.params.get('quotesCount')).toBe('0');
      expect(req.request.params.get('newsCount')).toBe('8');
      req.flush({ news: [] });
    });

    it('maps news items and defaults missing fields', () => {
      let result: any[] = [];
      service.getNews('AAPL').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-search');
      req.flush({
        news: [
          { uuid: 'u1', title: 'Title', publisher: 'Pub', link: 'https://x', providerPublishTime: 123 },
          {}
        ]
      });
      expect(result[0]).toEqual({ uuid: 'u1', title: 'Title', publisher: 'Pub', link: 'https://x', providerPublishTime: 123 });
      expect(result[1]).toEqual({ uuid: '', title: '', publisher: '', link: '', providerPublishTime: 0 });
    });

    it('returns an empty array when the response has no news field', () => {
      let result: any[] | undefined;
      service.getNews('AAPL').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-search');
      req.flush({});
      expect(result).toEqual([]);
    });
  });

  describe('getQuote', () => {
    it('hits the chart endpoint for the symbol with interval=1d&range=5d', () => {
      service.getQuote('AAPL').subscribe();
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/AAPL');
      expect(req.request.params.get('interval')).toBe('1d');
      expect(req.request.params.get('range')).toBe('5d');
      req.flush({ chart: { result: [{ meta: { regularMarketPrice: 1 } }] } });
    });

    it('URL-encodes symbols containing special characters', () => {
      service.getQuote('BRK/B').subscribe();
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/BRK%2FB');
      req.flush({ chart: { result: [{ meta: { regularMarketPrice: 1 } }] } });
      expect(req.request.url).toContain('BRK%2FB');
    });

    it('computes change and changePercent from price vs. previous close', () => {
      let result: any;
      service.getQuote('AAPL').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/AAPL');
      req.flush({
        chart: {
          result: [{
            meta: {
              symbol: 'AAPL',
              longName: 'Apple Inc.',
              fullExchangeName: 'NASDAQ',
              currency: 'USD',
              regularMarketPrice: 110,
              chartPreviousClose: 100,
              regularMarketOpen: 101,
              regularMarketDayHigh: 112,
              regularMarketDayLow: 99,
              fiftyTwoWeekHigh: 150,
              fiftyTwoWeekLow: 80,
              regularMarketVolume: 5000,
              marketState: 'REGULAR',
              regularMarketTime: 1700000000
            }
          }]
        }
      });
      expect(result.price).toBe(110);
      expect(result.previousClose).toBe(100);
      expect(result.change).toBe(10);
      expect(result.changePercent).toBe(10);
      expect(result.name).toBe('Apple Inc.');
      expect(result.exchange).toBe('NASDAQ');
    });

    it('falls back to previousClose, then to price, when chartPreviousClose is absent', () => {
      let result: any;
      service.getQuote('AAPL').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/AAPL');
      req.flush({ chart: { result: [{ meta: { previousClose: 90, regularMarketPrice: 100 } }] } });
      expect(result.previousClose).toBe(90);
      expect(result.change).toBe(10);
    });

    it('yields changePercent 0 when there is no previous close to divide by', () => {
      let result: any;
      service.getQuote('NEW').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/NEW');
      // no previousClose/chartPreviousClose and price defaults to 0 -> previousClose falls back to price (0)
      req.flush({ chart: { result: [{ meta: {} }] } });
      expect(result.price).toBe(0);
      expect(result.previousClose).toBe(0);
      expect(result.changePercent).toBe(0);
    });

    it('falls back symbol/name to the requested symbol when meta omits them', () => {
      let result: any;
      service.getQuote('XYZ').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/XYZ');
      req.flush({ chart: { result: [{ meta: {} }] } });
      expect(result.symbol).toBe('XYZ');
      expect(result.name).toBe('XYZ');
      expect(result.currency).toBe('USD');
    });

    it('errors when the response has no chart result', done => {
      service.getQuote('MISSING').subscribe({
        next: () => fail('expected an error'),
        error: err => {
          expect(err.message).toBe('No data for symbol');
          done();
        }
      });
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/MISSING');
      req.flush({ chart: { result: [] } });
    });
  });

  describe('getHistory', () => {
    const rangeIntervals: Record<string, string> = {
      '1d': '5m', '5d': '30m', '1mo': '1d', '6mo': '1d', '1y': '1wk', '5y': '1mo'
    };

    it('maps each supported range to its documented interval', () => {
      for (const [range, interval] of Object.entries(rangeIntervals)) {
        service.getHistory('AAPL', range as any).subscribe();
        const req = httpMock.expectOne(r => r.url === '/api/yf-chart/AAPL');
        expect(req.request.params.get('interval')).withContext(range).toBe(interval);
        expect(req.request.params.get('range')).toBe(range);
        req.flush({ chart: { result: [{ meta: {}, timestamp: [], indicators: { quote: [{ close: [] }] } }] } });
      }
    });

    it('zips timestamps with closes, converting seconds to milliseconds', () => {
      let result: any;
      service.getHistory('AAPL', '1mo').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/AAPL');
      req.flush({
        chart: {
          result: [{
            meta: { symbol: 'AAPL', currency: 'USD' },
            timestamp: [1000, 2000, 3000],
            indicators: { quote: [{ close: [10, 11, 12] }] }
          }]
        }
      });
      expect(result.points).toEqual([
        { time: 1000000, close: 10 },
        { time: 2000000, close: 11 },
        { time: 3000000, close: 12 }
      ]);
    });

    it('skips points whose close is null, undefined, or NaN', () => {
      let result: any;
      service.getHistory('AAPL', '1mo').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/AAPL');
      req.flush({
        chart: {
          result: [{
            meta: {},
            timestamp: [1, 2, 3, 4],
            indicators: { quote: [{ close: [10, null, NaN, 13] }] }
          }]
        }
      });
      expect(result.points).toEqual([
        { time: 1000, close: 10 },
        { time: 4000, close: 13 }
      ]);
    });

    it('defaults currency to USD and falls back symbol to the requested symbol', () => {
      let result: any;
      service.getHistory('ZZZ', '1y').subscribe(r => (result = r));
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/ZZZ');
      req.flush({ chart: { result: [{ meta: {}, timestamp: [], indicators: { quote: [{ close: [] }] } }] } });
      expect(result.symbol).toBe('ZZZ');
      expect(result.currency).toBe('USD');
      expect(result.points).toEqual([]);
    });

    it('errors when the response has no chart result', done => {
      service.getHistory('MISSING', '1d').subscribe({
        next: () => fail('expected an error'),
        error: err => {
          expect(err.message).toBe('No data for symbol');
          done();
        }
      });
      const req = httpMock.expectOne(r => r.url === '/api/yf-chart/MISSING');
      req.flush({ chart: { result: [] } });
    });
  });
});

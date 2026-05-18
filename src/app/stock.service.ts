import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface SymbolMatch {
  symbol: string;
  shortname: string;
  longname?: string;
  exchange: string;
  quoteType: string;
}

export interface Quote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap?: number;
  volume?: number;
  marketState: string;
  regularMarketTime: number;
}

export interface HistoryPoint {
  time: number;
  close: number;
}

export interface History {
  symbol: string;
  currency: string;
  points: HistoryPoint[];
}

export type Range = '1d' | '5d' | '1mo' | '6mo' | '1y' | '5y';

const RANGE_INTERVAL: Record<Range, string> = {
  '1d': '5m',
  '5d': '30m',
  '1mo': '1d',
  '6mo': '1d',
  '1y': '1wk',
  '5y': '1mo'
};

@Injectable({ providedIn: 'root' })
export class StockService {
  // Free Yahoo Finance endpoints (no API key required).
  // Routed through the Angular dev-server proxy (see proxy.conf.json) so the browser
  // doesn't hit Yahoo's CORS restriction. For production, point these at an
  // equivalent reverse-proxy path on your own server.
  private chartUrl = '/api/yf-chart';
  private searchUrl = '/api/yf-search';

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SymbolMatch[]> {
    const params = { q: query, quotesCount: '8', newsCount: '0' };
    return this.http.get<any>(this.searchUrl, { params }).pipe(
      map(res => (res?.quotes ?? [])
        .filter((q: any) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX' || q.quoteType === 'CRYPTOCURRENCY'))
        .map((q: any): SymbolMatch => ({
          symbol: q.symbol,
          shortname: q.shortname ?? q.symbol,
          longname: q.longname,
          exchange: q.exchDisp ?? q.exchange ?? '',
          quoteType: q.quoteType
        })))
    );
  }

  getQuote(symbol: string): Observable<Quote> {
    const params = { interval: '1d', range: '5d' };
    return this.http.get<any>(`${this.chartUrl}/${encodeURIComponent(symbol)}`, { params }).pipe(
      map(res => {
        const result = res?.chart?.result?.[0];
        if (!result) throw new Error('No data for symbol');
        const meta = result.meta ?? {};
        const price = meta.regularMarketPrice ?? 0;
        const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const change = price - previousClose;
        const changePercent = previousClose ? (change / previousClose) * 100 : 0;
        return {
          symbol: meta.symbol ?? symbol,
          name: meta.longName ?? meta.shortName ?? meta.symbol ?? symbol,
          exchange: meta.fullExchangeName ?? meta.exchangeName ?? '',
          currency: meta.currency ?? 'USD',
          price,
          previousClose,
          change,
          changePercent,
          open: meta.regularMarketOpen ?? 0,
          dayHigh: meta.regularMarketDayHigh ?? 0,
          dayLow: meta.regularMarketDayLow ?? 0,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
          volume: meta.regularMarketVolume,
          marketState: meta.marketState ?? '',
          regularMarketTime: meta.regularMarketTime ?? 0
        };
      })
    );
  }

  getHistory(symbol: string, range: Range): Observable<History> {
    const params = { interval: RANGE_INTERVAL[range], range };
    return this.http.get<any>(`${this.chartUrl}/${encodeURIComponent(symbol)}`, { params }).pipe(
      map(res => {
        const result = res?.chart?.result?.[0];
        if (!result) throw new Error('No data for symbol');
        const timestamps: number[] = result.timestamp ?? [];
        const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
        const points: HistoryPoint[] = [];
        for (let i = 0; i < timestamps.length; i++) {
          const c = closes[i];
          if (c != null && !isNaN(c)) points.push({ time: timestamps[i] * 1000, close: c });
        }
        return {
          symbol: result.meta?.symbol ?? symbol,
          currency: result.meta?.currency ?? 'USD',
          points
        };
      })
    );
  }
}

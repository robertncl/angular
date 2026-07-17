import { Routes } from '@angular/router';
import { StockComponent } from './stock/stock.component';
import { TradingAppComponent } from './trading-app/trading-app.component';

export const routes: Routes = [
  { path: '', component: StockComponent },
  { path: 'trading', component: TradingAppComponent }
];

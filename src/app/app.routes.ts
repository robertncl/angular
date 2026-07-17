import { Routes } from '@angular/router';
import { StockComponent } from './stock/stock.component';
import { TradingAppComponent } from './trading-app/trading-app.component';
import { TradingAppMobileComponent } from './trading-app-mobile/trading-app-mobile.component';

export const routes: Routes = [
  { path: '', component: StockComponent },
  { path: 'trading', component: TradingAppComponent },
  { path: 'trading-mobile', component: TradingAppMobileComponent }
];

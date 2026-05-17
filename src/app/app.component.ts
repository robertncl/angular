import { Component } from '@angular/core';
import { StockComponent } from './stock/stock.component';

@Component({
  selector: 'app-root',
  imports: [StockComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Stockwatch';
}

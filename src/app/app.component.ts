import { Component } from '@angular/core';
import { HazeDashboardComponent } from './haze/haze-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [HazeDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}

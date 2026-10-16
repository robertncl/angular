import { Routes } from '@angular/router';

import { HazeDashboardComponent } from './haze/haze-dashboard.component';

export const routes: Routes = [
  { path: '', component: HazeDashboardComponent },
  { path: '**', redirectTo: '' }
];

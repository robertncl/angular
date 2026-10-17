import { provideZonelessChangeDetection } from '@angular/core';
import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideLocationMocks()],
      deferBlockBehavior: DeferBlockBehavior.Manual
    }).compileComponents();
  });

  it('renders the dashboard directly, without a router', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-haze-dashboard')).toBeTruthy();
  });
});

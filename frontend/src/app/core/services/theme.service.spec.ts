import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    document.documentElement.classList.remove('dark-theme');
    TestBed.configureTestingModule({});
  });

  it('defaults to light theme when nothing is stored', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('restores dark preference from localStorage', () => {
    localStorage.setItem('qa-theme-dark', 'true');
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('toggles theme and persists the preference', () => {
    const service = TestBed.inject(ThemeService);
    service.toggle();
    expect(service.isDark()).toBe(true);
    expect(localStorage.getItem('qa-theme-dark')).toBe('true');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);

    service.toggle();
    expect(service.isDark()).toBe(false);
    expect(localStorage.getItem('qa-theme-dark')).toBe('false');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });
});

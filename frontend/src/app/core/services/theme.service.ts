import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'qa-theme-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.readStoredPreference());

  constructor() {
    this.applyTheme(this.isDark());
  }

  toggle(): void {
    this.setDark(!this.isDark());
  }

  setDark(dark: boolean): void {
    this.isDark.set(dark);
    localStorage.setItem(STORAGE_KEY, String(dark));
    this.applyTheme(dark);
  }

  private readStoredPreference(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark-theme', dark);
  }
}

import { Injectable, signal } from '@angular/core';

const NAME_KEY = 'qa-actor-name';
const RECENT_KEY = 'qa-actor-recent';

@Injectable({ providedIn: 'root' })
export class IdentityService {
  readonly name = signal(this.readStoredName());
  readonly recentNames = signal(this.readRecent());

  get declared(): boolean {
    return this.name().trim().length > 0;
  }

  setName(name: string): void {
    const trimmed = name.trim().slice(0, 80);
    this.name.set(trimmed);
    if (!trimmed) {
      localStorage.removeItem(NAME_KEY);
      return;
    }
    localStorage.setItem(NAME_KEY, trimmed);
    const recent = [trimmed, ...this.recentNames().filter((item) => item !== trimmed)].slice(0, 10);
    this.recentNames.set(recent);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  mergeKnownNames(names: string[]): void {
    const merged = [
      ...this.recentNames(),
      ...names.map((name) => name.trim()).filter(Boolean),
    ];
    const unique = [...new Set(merged)].slice(0, 20);
    this.recentNames.set(unique);
  }

  private readStoredName(): string {
    return localStorage.getItem(NAME_KEY)?.trim() ?? '';
  }

  private readRecent(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    } catch {
      return [];
    }
  }
}

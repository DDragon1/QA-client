import { Injectable } from '@angular/core';

export interface RuntimeConfig {
  apiUrl?: string;
}

const DEFAULT_API_URL = '/api';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private apiUrlValue = DEFAULT_API_URL;

  set(config: RuntimeConfig): void {
    const raw = config.apiUrl?.trim();
    this.apiUrlValue = raw ? raw.replace(/\/+$/, '') : DEFAULT_API_URL;
  }

  get apiUrl(): string {
    return this.apiUrlValue;
  }
}

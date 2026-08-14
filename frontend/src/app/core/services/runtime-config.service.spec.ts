import { TestBed } from '@angular/core/testing';
import { RuntimeConfigService } from './runtime-config.service';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(RuntimeConfigService);
  });

  it('defaults to the relative /api path', () => {
    expect(service.apiUrl).toBe('/api');
  });

  it('stores an absolute API URL and strips a trailing slash', () => {
    service.set({ apiUrl: 'https://qa-api.example.com/api/' });
    expect(service.apiUrl).toBe('https://qa-api.example.com/api');
  });

  it('keeps the default when apiUrl is missing or blank', () => {
    service.set({});
    expect(service.apiUrl).toBe('/api');

    service.set({ apiUrl: '   ' });
    expect(service.apiUrl).toBe('/api');
  });
});

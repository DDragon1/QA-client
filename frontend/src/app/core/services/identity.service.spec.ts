import { TestBed } from '@angular/core/testing';
import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts unnamed when nothing is stored', () => {
    const service = TestBed.inject(IdentityService);
    expect(service.name()).toBe('');
    expect(service.declared).toBe(false);
  });

  it('persists a display name and recent names', () => {
    const service = TestBed.inject(IdentityService);
    service.setName('  דנה  ');
    expect(service.name()).toBe('דנה');
    expect(service.declared).toBe(true);
    expect(localStorage.getItem('qa-actor-name')).toBe('דנה');
    expect(service.recentNames()).toEqual(['דנה']);
  });

  it('restores a stored name', () => {
    localStorage.setItem('qa-actor-name', 'יוסי');
    const service = TestBed.inject(IdentityService);
    expect(service.name()).toBe('יוסי');
  });
});

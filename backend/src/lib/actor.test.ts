import { describe, expect, it } from 'vitest';
import { parseActorName } from './actor';

describe('parseActorName', () => {
  it('decodes URI-encoded Hebrew names from headers', () => {
    expect(parseActorName(encodeURIComponent('דנה'))).toBe('דנה');
  });

  it('rejects empty or oversized names', () => {
    expect(parseActorName('')).toBeUndefined();
    expect(parseActorName('   ')).toBeUndefined();
    expect(parseActorName('x'.repeat(81))).toBeUndefined();
    expect(parseActorName(12)).toBeUndefined();
  });
});

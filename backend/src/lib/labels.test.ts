import { describe, expect, it } from 'vitest';
import { labelResultStatus, labelRunStatus, labelTestType } from './labels';

describe('hebrew labels', () => {
  it('maps run statuses', () => {
    expect(labelRunStatus('need_to_run')).toBe('צריך להריץ');
    expect(labelRunStatus('done')).toBe('בוצע');
    expect(labelRunStatus('need_to_rerun')).toBe('צריך להריץ מחדש');
  });

  it('maps result statuses', () => {
    expect(labelResultStatus('success')).toBe('הצליח');
    expect(labelResultStatus('failed')).toBe('נכשל');
    expect(labelResultStatus('has_bug')).toBe('יש באג');
  });

  it('maps test types', () => {
    expect(labelTestType('manual')).toBe('ידני');
    expect(labelTestType('automatic')).toBe('אוטומטי');
  });
});

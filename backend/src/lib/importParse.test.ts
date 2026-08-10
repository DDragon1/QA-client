import { describe, expect, it } from 'vitest';
import { ResultStatus, RunStatus } from '@prisma/client';
import { COLUMN_MAP, findColumnIndex, parseExecuted } from './importParse';

describe('findColumnIndex', () => {
  it('finds Hebrew header columns by exact trimmed match', () => {
    const headers = ['תכולה', ' תרחיש ', 'שלבים לביצוע', 'תוצר צפוי'];

    expect(findColumnIndex(headers, COLUMN_MAP.feature)).toBe(0);
    expect(findColumnIndex(headers, COLUMN_MAP.scenario)).toBe(1);
    expect(findColumnIndex(headers, COLUMN_MAP.steps)).toBe(2);
    expect(findColumnIndex(headers, COLUMN_MAP.expected)).toBe(3);
  });

  it('returns -1 when a required column is missing', () => {
    expect(findColumnIndex(['תכולה', 'הערות'], COLUMN_MAP.scenario)).toBe(-1);
  });
});

describe('parseExecuted', () => {
  it.each([
    ['כן', RunStatus.done, ResultStatus.success],
    ['YES', RunStatus.done, ResultStatus.success],
    ['y', RunStatus.done, ResultStatus.success],
    ['לא', RunStatus.done, ResultStatus.failed],
    ['No', RunStatus.done, ResultStatus.failed],
    ['n', RunStatus.done, ResultStatus.failed],
  ])('parses %s as done with the matching result', (value, runStatus, resultStatus) => {
    expect(parseExecuted(value)).toEqual({ runStatus, resultStatus });
  });

  it.each([null, undefined, '', '  ', 'pending', 'אולי'])(
    'treats %j as need_to_run with no result',
    (value) => {
      expect(parseExecuted(value)).toEqual({
        runStatus: RunStatus.need_to_run,
        resultStatus: null,
      });
    }
  );
});

import { RunStatus, ResultStatus } from '@prisma/client';

export const COLUMN_MAP = {
  feature: ['תכולה'],
  scenario: ['תרחיש'],
  steps: ['שלבים לביצוע'],
  expected: ['תוצר צפוי'],
  executed: ['האם בוצע'],
  notes: ['הערות'],
};

export function findColumnIndex(headers: string[], keys: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = (headers[i] ?? '').toString().trim();
    if (keys.some((k) => header === k)) {
      return i;
    }
  }
  return -1;
}

export function parseExecuted(value: unknown): { runStatus: RunStatus; resultStatus: ResultStatus | null } {
  const text = (value ?? '').toString().trim().toLowerCase();
  if (text === 'כן' || text === 'yes' || text === 'y') {
    return { runStatus: RunStatus.done, resultStatus: ResultStatus.success };
  }
  if (text === 'לא' || text === 'no' || text === 'n') {
    return { runStatus: RunStatus.done, resultStatus: ResultStatus.failed };
  }
  return { runStatus: RunStatus.need_to_run, resultStatus: null };
}

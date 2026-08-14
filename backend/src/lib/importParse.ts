import { RunStatus, ResultStatus } from '@prisma/client';

export const COLUMN_MAP = {
  feature: ['תכולה'],
  team: ['צוות'],
  scenario: ['תרחיש'],
  steps: ['שלבים לביצוע'],
  expected: ['תוצר צפוי'],
  executed: ['האם בוצע'],
  notes: ['הערות'],
};

export type ParsedExecution = {
  runStatus: RunStatus;
  resultStatus: ResultStatus | null;
  explicit: boolean;
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

export function parseExecuted(value: unknown): ParsedExecution {
  const text = (value ?? '').toString().trim().toLowerCase();
  if (!text) {
    return { runStatus: RunStatus.need_to_run, resultStatus: null, explicit: false };
  }
  if (['כן', 'yes', 'y', 'הצליח', 'success'].includes(text)) {
    return { runStatus: RunStatus.done, resultStatus: ResultStatus.success, explicit: true };
  }
  if (['לא', 'no', 'n', 'נכשל', 'failed'].includes(text)) {
    return { runStatus: RunStatus.done, resultStatus: ResultStatus.failed, explicit: true };
  }
  if (['באג', 'bug', 'has_bug', 'יש באג'].includes(text)) {
    return { runStatus: RunStatus.done, resultStatus: ResultStatus.has_bug, explicit: true };
  }
  if (['rerun', 'need_to_rerun', 'להריץ מחדש', 'צריך להריץ מחדש'].includes(text)) {
    return { runStatus: RunStatus.need_to_rerun, resultStatus: null, explicit: true };
  }
  return { runStatus: RunStatus.need_to_run, resultStatus: null, explicit: false };
}

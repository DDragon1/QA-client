export const hebrewLabels = {
  runStatus: {
    need_to_run: 'צריך להריץ',
    done: 'בוצע',
    need_to_rerun: 'צריך להריץ מחדש',
  },
  resultStatus: {
    success: 'הצליח',
    failed: 'נכשל',
    has_bug: 'יש באג',
  },
  testType: {
    manual: 'ידני',
    automatic: 'אוטומטי',
  },
} as const;

export function labelRunStatus(status: keyof typeof hebrewLabels.runStatus): string {
  return hebrewLabels.runStatus[status];
}

export function labelResultStatus(status: keyof typeof hebrewLabels.resultStatus): string {
  return hebrewLabels.resultStatus[status];
}

export function labelTestType(type: keyof typeof hebrewLabels.testType): string {
  return hebrewLabels.testType[type];
}

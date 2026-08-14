import { AppVersion, VersionTestRun } from '../models';
import { LABELS } from '../i18n/he';

export function finishWarningMessages(
  version: AppVersion,
  runs?: Pick<VersionTestRun, 'runStatus' | 'resultStatus'>[]
): string[] {
  if (runs?.length) {
    const messages: string[] = [];
    if (runs.some((run) => run.runStatus === 'need_to_run')) {
      messages.push(LABELS.versions.finishIncomplete);
    }
    if (runs.some((run) => run.runStatus === 'done' && !run.resultStatus)) {
      messages.push(LABELS.versions.finishNoResult);
    }
    if (runs.some((run) => run.runStatus === 'need_to_run' && run.resultStatus)) {
      messages.push(LABELS.versions.finishResultPending);
    }
    return messages;
  }

  const messages: string[] = [];
  if (version.stats.needToRun > 0) {
    messages.push(LABELS.versions.finishIncomplete);
  }
  const results = version.stats.success + version.stats.failed + version.stats.hasBug;
  if (version.stats.done > results) {
    messages.push(LABELS.versions.finishNoResult);
  }
  return messages;
}

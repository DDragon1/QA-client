import { RunStatus, ResultStatus } from '@prisma/client';

export interface VersionStats {
  total: number;
  needToRun: number;
  done: number;
  needToRerun: number;
  success: number;
  failed: number;
  hasBug: number;
}

export function computeVersionStats(runs: Array<{ runStatus: RunStatus; resultStatus: ResultStatus | null }>): VersionStats {
  const stats: VersionStats = {
    total: runs.length,
    needToRun: 0,
    done: 0,
    needToRerun: 0,
    success: 0,
    failed: 0,
    hasBug: 0,
  };

  for (const run of runs) {
    switch (run.runStatus) {
      case RunStatus.need_to_run:
        stats.needToRun++;
        break;
      case RunStatus.done:
        stats.done++;
        break;
      case RunStatus.need_to_rerun:
        stats.needToRerun++;
        break;
    }

    switch (run.resultStatus) {
      case ResultStatus.success:
        stats.success++;
        break;
      case ResultStatus.failed:
        stats.failed++;
        break;
      case ResultStatus.has_bug:
        stats.hasBug++;
        break;
    }
  }

  return stats;
}

export type FinishWarning = 'unfinished' | 'doneWithoutResult' | 'resultBeforeDone';

export function computeFinishWarnings(
  runs: Array<{ runStatus: RunStatus; resultStatus: ResultStatus | null }>
): FinishWarning[] {
  const warnings: FinishWarning[] = [];
  if (runs.some((run) => run.runStatus === RunStatus.need_to_run)) {
    warnings.push('unfinished');
  }
  if (runs.some((run) => run.runStatus === RunStatus.done && !run.resultStatus)) {
    warnings.push('doneWithoutResult');
  }
  if (runs.some((run) => run.runStatus === RunStatus.need_to_run && run.resultStatus)) {
    warnings.push('resultBeforeDone');
  }
  return warnings;
}

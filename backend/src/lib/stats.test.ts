import { describe, expect, it } from 'vitest';
import { ResultStatus, RunStatus } from '@prisma/client';
import { computeVersionStats } from './stats';

describe('computeVersionStats', () => {
  it('returns zeros for an empty run list', () => {
    expect(computeVersionStats([])).toEqual({
      total: 0,
      needToRun: 0,
      done: 0,
      needToRerun: 0,
      success: 0,
      failed: 0,
      hasBug: 0,
    });
  });

  it('counts run and result statuses independently', () => {
    const stats = computeVersionStats([
      { runStatus: RunStatus.need_to_run, resultStatus: null },
      { runStatus: RunStatus.done, resultStatus: ResultStatus.success },
      { runStatus: RunStatus.done, resultStatus: ResultStatus.failed },
      { runStatus: RunStatus.need_to_rerun, resultStatus: ResultStatus.has_bug },
    ]);

    expect(stats).toEqual({
      total: 4,
      needToRun: 1,
      done: 2,
      needToRerun: 1,
      success: 1,
      failed: 1,
      hasBug: 1,
    });
  });

  it('ignores null result statuses when tallying outcomes', () => {
    const stats = computeVersionStats([
      { runStatus: RunStatus.need_to_run, resultStatus: null },
      { runStatus: RunStatus.need_to_rerun, resultStatus: null },
    ]);

    expect(stats.success).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.hasBug).toBe(0);
    expect(stats.total).toBe(2);
  });
});

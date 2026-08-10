import { describe, expect, it } from 'vitest';
import { Environment, ResultStatus, RunStatus, TestType } from '@prisma/client';
import {
  applyRunSnapshot,
  mapRunsWithSnapshots,
  snapshotFromTestCase,
  toVersionDto,
  type RunWithTestCase,
} from './versionSnapshot';

function makeRun(overrides: Partial<RunWithTestCase> = {}): RunWithTestCase {
  const base: RunWithTestCase = {
    id: 'run-1',
    versionId: 'ver-1',
    testCaseId: 'tc-1',
    runStatus: RunStatus.need_to_run,
    resultStatus: null,
    notes: null,
    rowVersion: 1,
    updatedAt: new Date('2026-01-01'),
    snapshotFeatureName: null,
    snapshotScenario: null,
    snapshotSteps: null,
    snapshotExpectedResult: null,
    snapshotType: null,
    testCase: {
      id: 'tc-1',
      featureId: 'feat-1',
      scenario: 'live scenario',
      steps: 'live steps',
      expectedResult: 'live expected',
      type: TestType.manual,
      isActive: true,
      sortOrder: 1,
      createdAt: new Date('2026-01-01'),
      feature: {
        id: 'feat-1',
        name: 'live feature',
        sortOrder: 1,
        createdAt: new Date('2026-01-01'),
      },
    },
  };

  return {
    ...base,
    ...overrides,
    testCase: {
      ...base.testCase,
      ...(overrides.testCase ?? {}),
      feature: {
        ...base.testCase.feature,
        ...(overrides.testCase?.feature ?? {}),
      },
    },
  };
}

describe('applyRunSnapshot', () => {
  it('returns live test case data when snapshot fields are missing', () => {
    const run = makeRun({
      snapshotFeatureName: 'frozen feature',
      snapshotScenario: null,
    });

    expect(applyRunSnapshot(run)).toBe(run);
    expect(applyRunSnapshot(run).testCase.scenario).toBe('live scenario');
  });

  it('overlays frozen snapshot fields when version was finished', () => {
    const run = makeRun({
      snapshotFeatureName: 'frozen feature',
      snapshotScenario: 'frozen scenario',
      snapshotSteps: 'frozen steps',
      snapshotExpectedResult: 'frozen expected',
      snapshotType: TestType.automatic,
    });

    const result = applyRunSnapshot(run);

    expect(result.testCase.scenario).toBe('frozen scenario');
    expect(result.testCase.steps).toBe('frozen steps');
    expect(result.testCase.expectedResult).toBe('frozen expected');
    expect(result.testCase.type).toBe(TestType.automatic);
    expect(result.testCase.feature.name).toBe('frozen feature');
    expect(result.testCase.id).toBe('tc-1');
  });
});

describe('mapRunsWithSnapshots', () => {
  it('maps each run through applyRunSnapshot', () => {
    const live = makeRun({ id: 'live' });
    const frozen = makeRun({
      id: 'frozen',
      snapshotFeatureName: 'frozen feature',
      snapshotScenario: 'frozen scenario',
      snapshotSteps: 'frozen steps',
      snapshotExpectedResult: 'frozen expected',
      snapshotType: TestType.automatic,
    });

    const mapped = mapRunsWithSnapshots([live, frozen]);

    expect(mapped[0]).toBe(live);
    expect(mapped[1].testCase.scenario).toBe('frozen scenario');
    expect(mapped[1].testCase.feature.name).toBe('frozen feature');
  });
});

describe('snapshotFromTestCase', () => {
  it('copies current catalog fields into snapshot columns', () => {
    const run = makeRun();
    expect(snapshotFromTestCase(run.testCase)).toEqual({
      snapshotFeatureName: 'live feature',
      snapshotScenario: 'live scenario',
      snapshotSteps: 'live steps',
      snapshotExpectedResult: 'live expected',
      snapshotType: TestType.manual,
    });
  });
});

describe('toVersionDto', () => {
  it('includes finishedAt and stats on the DTO', () => {
    const finishedAt = new Date('2026-08-01');
    const stats = {
      total: 2,
      needToRun: 1,
      done: 1,
      needToRerun: 0,
      success: 1,
      failed: 0,
      hasBug: 0,
    };

    expect(
      toVersionDto(
        {
          id: 'ver-1',
          name: '1.0',
          description: 'desc',
          environment: Environment.INT,
          createdAt: new Date('2026-01-01'),
          finishedAt,
        },
        stats
      )
    ).toEqual({
      id: 'ver-1',
      name: '1.0',
      description: 'desc',
      environment: Environment.INT,
      createdAt: new Date('2026-01-01'),
      finishedAt,
      stats,
    });
  });
});

import { AppVersion, Feature, TestCase, TestType, VersionTestRun } from '@prisma/client';
import { VersionStats } from './stats';

export type RunWithTestCase = VersionTestRun & {
  testCase: TestCase & { feature: Feature };
};

/** Prefer frozen snapshot fields when a version has been finished. */
export function applyRunSnapshot(run: RunWithTestCase): RunWithTestCase {
  if (
    run.snapshotScenario == null ||
    run.snapshotSteps == null ||
    run.snapshotExpectedResult == null ||
    run.snapshotType == null ||
    run.snapshotFeatureName == null
  ) {
    return run;
  }

  return {
    ...run,
    testCase: {
      ...run.testCase,
      scenario: run.snapshotScenario,
      steps: run.snapshotSteps,
      expectedResult: run.snapshotExpectedResult,
      type: run.snapshotType,
      feature: {
        ...run.testCase.feature,
        name: run.snapshotFeatureName,
      },
    },
  };
}

export function mapRunsWithSnapshots(runs: RunWithTestCase[]): RunWithTestCase[] {
  return runs.map(applyRunSnapshot);
}

export function toVersionDto(
  version: Pick<AppVersion, 'id' | 'name' | 'description' | 'createdAt' | 'finishedAt'>,
  stats: VersionStats
) {
  return {
    id: version.id,
    name: version.name,
    description: version.description,
    createdAt: version.createdAt,
    finishedAt: version.finishedAt,
    stats,
  };
}

export type SnapshotFields = {
  snapshotFeatureName: string;
  snapshotScenario: string;
  snapshotSteps: string;
  snapshotExpectedResult: string;
  snapshotType: TestType;
};

export function snapshotFromTestCase(testCase: TestCase & { feature: Feature }): SnapshotFields {
  return {
    snapshotFeatureName: testCase.feature.name,
    snapshotScenario: testCase.scenario,
    snapshotSteps: testCase.steps,
    snapshotExpectedResult: testCase.expectedResult,
    snapshotType: testCase.type,
  };
}

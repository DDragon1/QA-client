import { AppVersion, Feature, Team, TestCase, TestType, VersionTestRun } from '@prisma/client';
import { VersionStats } from './stats';

export type FeatureWithTeam = Feature & { team: Team | null };

export type RunWithTestCase = VersionTestRun & {
  testCase: TestCase & { feature: FeatureWithTeam };
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
        team: run.snapshotTeamName
          ? {
              id: run.testCase.feature.team?.id ?? 'snapshot-team',
              name: run.snapshotTeamName,
              sortOrder: run.testCase.feature.team?.sortOrder ?? 0,
              createdAt: run.testCase.feature.team?.createdAt ?? run.updatedAt,
            }
          : null,
      },
    },
  };
}

export function mapRunsWithSnapshots(runs: RunWithTestCase[]): RunWithTestCase[] {
  return runs.map(applyRunSnapshot);
}

export function toVersionDto(
  version: Pick<AppVersion, 'id' | 'name' | 'description' | 'environment' | 'createdAt' | 'finishedAt'>,
  stats: VersionStats
) {
  return {
    id: version.id,
    name: version.name,
    description: version.description,
    environment: version.environment,
    createdAt: version.createdAt,
    finishedAt: version.finishedAt,
    stats,
  };
}

export type SnapshotFields = {
  snapshotFeatureName: string;
  snapshotTeamName: string | null;
  snapshotScenario: string;
  snapshotSteps: string;
  snapshotExpectedResult: string;
  snapshotType: TestType;
};

export function snapshotFromTestCase(testCase: TestCase & { feature: FeatureWithTeam }): SnapshotFields {
  return {
    snapshotFeatureName: testCase.feature.name,
    snapshotTeamName: testCase.feature.team?.name ?? null,
    snapshotScenario: testCase.scenario,
    snapshotSteps: testCase.steps,
    snapshotExpectedResult: testCase.expectedResult,
    snapshotType: testCase.type,
  };
}

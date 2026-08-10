export type TestType = 'manual' | 'automatic';
export type RunStatus = 'need_to_run' | 'done' | 'need_to_rerun';
export type ResultStatus = 'success' | 'failed' | 'has_bug';

export interface Feature {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  testCases?: TestCase[];
}

export interface TestCase {
  id: string;
  featureId: string;
  scenario: string;
  steps: string;
  expectedResult: string;
  type: TestType;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  feature?: Feature;
}

export interface VersionStats {
  total: number;
  needToRun: number;
  done: number;
  needToRerun: number;
  success: number;
  failed: number;
  hasBug: number;
}

export interface AppVersion {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  stats: VersionStats;
}

export interface VersionTestRun {
  id: string;
  versionId: string;
  testCaseId: string;
  runStatus: RunStatus;
  resultStatus: ResultStatus | null;
  notes: string | null;
  rowVersion: number;
  updatedAt: string;
  testCase: TestCase & { feature: Feature };
}

export interface ImportResult {
  features: number;
  testCases: number;
}

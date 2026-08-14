import { finishWarningMessages } from './finish-warnings';
import { AppVersion } from '../models';

const version: AppVersion = {
  id: 'v1',
  name: '1.0',
  description: null,
  environment: 'INT',
  createdAt: '2026-01-01',
  finishedAt: null,
  stats: {
    total: 2,
    needToRun: 1,
    done: 1,
    needToRerun: 0,
    success: 0,
    failed: 0,
    hasBug: 0,
  },
};

describe('finishWarningMessages', () => {
  it('warns from version stats when runs are not provided', () => {
    const messages = finishWarningMessages(version);
    expect(messages.length).toBeGreaterThan(0);
  });

  it('returns no warnings for complete run lists', () => {
    expect(
      finishWarningMessages(version, [{ runStatus: 'done', resultStatus: 'success' }])
    ).toEqual([]);
  });
});

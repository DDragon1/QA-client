import { Prisma, PrismaClient, ResultStatus, RunStatus } from '@prisma/client';

export type RunSeed = {
  runStatus?: RunStatus;
  resultStatus?: ResultStatus | null;
  notes?: string | null;
  lastUpdatedBy?: string | null;
};

export async function attachTestCaseToOpenVersions(
  client: PrismaClient | Prisma.TransactionClient,
  testCaseId: string,
  seed: RunSeed = {},
  updateExisting = false
): Promise<void> {
  const openVersions = await client.appVersion.findMany({
    where: { finishedAt: null },
    select: { id: true },
  });

  for (const version of openVersions) {
    await client.versionTestRun.upsert({
      where: {
        versionId_testCaseId: {
          versionId: version.id,
          testCaseId,
        },
      },
      create: {
        versionId: version.id,
        testCaseId,
        runStatus: seed.runStatus ?? RunStatus.need_to_run,
        resultStatus: seed.resultStatus ?? null,
        notes: seed.notes ?? null,
        lastUpdatedBy: seed.lastUpdatedBy ?? null,
      },
      update: updateExisting
        ? {
            ...(seed.runStatus !== undefined ? { runStatus: seed.runStatus } : {}),
            ...(seed.resultStatus !== undefined ? { resultStatus: seed.resultStatus } : {}),
            ...(seed.notes !== undefined ? { notes: seed.notes } : {}),
            ...(seed.lastUpdatedBy !== undefined ? { lastUpdatedBy: seed.lastUpdatedBy } : {}),
          }
        : {},
    });
  }
}

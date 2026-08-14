import ExcelJS from 'exceljs';
import { Prisma, RunStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { COLUMN_MAP, findColumnIndex, parseExecuted } from '../lib/importParse';
import { attachTestCaseToOpenVersions } from '../lib/openVersions';

export async function importExcelFile(
  buffer: Buffer,
  actorName?: string
): Promise<{ features: number; testCases: number }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('הקובץ לא מכיל גיליונות');
  }

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = (cell.value ?? '').toString();
  });

  const colFeature = findColumnIndex(headers, COLUMN_MAP.feature);
  const colTeam = findColumnIndex(headers, COLUMN_MAP.team);
  const colScenario = findColumnIndex(headers, COLUMN_MAP.scenario);
  const colSteps = findColumnIndex(headers, COLUMN_MAP.steps);
  const colExpected = findColumnIndex(headers, COLUMN_MAP.expected);
  const colExecuted = findColumnIndex(headers, COLUMN_MAP.executed);
  const colNotes = findColumnIndex(headers, COLUMN_MAP.notes);

  if (colScenario === -1 || colSteps === -1 || colExpected === -1) {
    throw new Error('חסרות עמודות חובה: תרחיש, שלבים לביצוע, תוצר צפוי');
  }

  return prisma.$transaction(
    async (tx) => importRows(tx, sheet, {
      colFeature,
      colTeam,
      colScenario,
      colSteps,
      colExpected,
      colExecuted,
      colNotes,
      actorName,
    }),
    { timeout: 120_000, maxWait: 10_000 }
  );
}

async function importRows(
  tx: Prisma.TransactionClient,
  sheet: ExcelJS.Worksheet,
  cols: {
    colFeature: number;
    colTeam: number;
    colScenario: number;
    colSteps: number;
    colExpected: number;
    colExecuted: number;
    colNotes: number;
    actorName?: string;
  }
): Promise<{ features: number; testCases: number }> {
  let currentFeatureName = '';
  let currentTeamName: string | null = null;
  let featureCount = 0;
  let testCaseCount = 0;
  let featureSort = (await tx.feature.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;
  let teamSort = (await tx.team.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;

  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    const getCell = (col: number) => (col >= 0 ? row.getCell(col + 1).value : null);

    const featureCell = cols.colFeature >= 0 ? getCell(cols.colFeature) : null;
    const teamCell = cols.colTeam >= 0 ? getCell(cols.colTeam) : null;
    const scenario = (getCell(cols.colScenario) ?? '').toString().trim();
    const steps = (getCell(cols.colSteps) ?? '').toString().trim();
    const expected = (getCell(cols.colExpected) ?? '').toString().trim();

    if (!scenario && !steps && !expected) continue;

    if (featureCell) {
      const name = featureCell.toString().trim();
      if (name) currentFeatureName = name;
    }

    if (teamCell) {
      const name = teamCell.toString().trim();
      currentTeamName = name || null;
    }

    if (!currentFeatureName) {
      currentFeatureName = 'כללי';
    }

    if (!scenario || !steps || !expected) continue;

    let teamId: string | null = null;
    if (currentTeamName) {
      let team = await tx.team.findUnique({
        where: { name: currentTeamName },
      });
      if (!team) {
        teamSort++;
        team = await tx.team.create({
          data: { name: currentTeamName, sortOrder: teamSort },
        });
      }
      teamId = team.id;
    }

    let feature = await tx.feature.findFirst({
      where: { name: currentFeatureName },
    });

    if (!feature) {
      featureSort++;
      feature = await tx.feature.create({
        data: { name: currentFeatureName, sortOrder: featureSort, teamId },
      });
      featureCount++;
    } else if (teamId && feature.teamId !== teamId) {
      feature = await tx.feature.update({
        where: { id: feature.id },
        data: { teamId },
      });
    }

    const executed =
      cols.colExecuted >= 0
        ? parseExecuted(getCell(cols.colExecuted))
        : { runStatus: RunStatus.need_to_run, resultStatus: null, explicit: false };
    const notes =
      cols.colNotes >= 0 ? (getCell(cols.colNotes) ?? '').toString().trim() || null : null;

    let testCase = await tx.testCase.findFirst({
      where: {
        featureId: feature.id,
        scenario,
        steps,
        expectedResult: expected,
      },
    });

    if (!testCase) {
      const maxSort = await tx.testCase.aggregate({
        where: { featureId: feature.id },
        _max: { sortOrder: true },
      });

      testCase = await tx.testCase.create({
        data: {
          featureId: feature.id,
          scenario,
          steps,
          expectedResult: expected,
          sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        },
      });
      testCaseCount++;
    }

    await attachTestCaseToOpenVersions(
      tx,
      testCase.id,
      {
        runStatus: executed.explicit ? executed.runStatus : RunStatus.need_to_run,
        resultStatus: executed.explicit ? executed.resultStatus : null,
        notes,
        lastUpdatedBy: cols.actorName ?? null,
      },
      executed.explicit || notes != null
    );
  }

  return { features: featureCount, testCases: testCaseCount };
}

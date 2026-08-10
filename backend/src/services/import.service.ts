import ExcelJS from 'exceljs';
import { RunStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { COLUMN_MAP, findColumnIndex, parseExecuted } from '../lib/importParse';

export async function importExcelFile(buffer: Buffer): Promise<{ features: number; testCases: number }> {
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
  const colScenario = findColumnIndex(headers, COLUMN_MAP.scenario);
  const colSteps = findColumnIndex(headers, COLUMN_MAP.steps);
  const colExpected = findColumnIndex(headers, COLUMN_MAP.expected);
  const colExecuted = findColumnIndex(headers, COLUMN_MAP.executed);
  const colNotes = findColumnIndex(headers, COLUMN_MAP.notes);

  if (colScenario === -1 || colSteps === -1 || colExpected === -1) {
    throw new Error('חסרות עמודות חובה: תרחיש, שלבים לביצוע, תוצר צפוי');
  }

  let currentFeatureName = '';
  let featureCount = 0;
  let testCaseCount = 0;
  let featureSort = (await prisma.feature.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;

  const latestVersion = await prisma.appVersion.findFirst({
    where: { finishedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    const getCell = (col: number) => (col >= 0 ? row.getCell(col + 1).value : null);

    const featureCell = colFeature >= 0 ? getCell(colFeature) : null;
    const scenario = (getCell(colScenario) ?? '').toString().trim();
    const steps = (getCell(colSteps) ?? '').toString().trim();
    const expected = (getCell(colExpected) ?? '').toString().trim();

    if (!scenario && !steps && !expected) continue;

    if (featureCell) {
      const name = featureCell.toString().trim();
      if (name) currentFeatureName = name;
    }

    if (!currentFeatureName) {
      currentFeatureName = 'כללי';
    }

    if (!scenario || !steps || !expected) continue;

    let feature = await prisma.feature.findFirst({
      where: { name: currentFeatureName },
    });

    if (!feature) {
      featureSort++;
      feature = await prisma.feature.create({
        data: { name: currentFeatureName, sortOrder: featureSort },
      });
      featureCount++;
    }

    const maxSort = await prisma.testCase.aggregate({
      where: { featureId: feature.id },
      _max: { sortOrder: true },
    });

    const executed = colExecuted >= 0 ? parseExecuted(getCell(colExecuted)) : { runStatus: RunStatus.need_to_run, resultStatus: null };
    const notes = colNotes >= 0 ? (getCell(colNotes) ?? '').toString().trim() || null : null;

    const testCase = await prisma.testCase.create({
      data: {
        featureId: feature.id,
        scenario,
        steps,
        expectedResult: expected,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    testCaseCount++;

    if (latestVersion) {
      await prisma.versionTestRun.create({
        data: {
          versionId: latestVersion.id,
          testCaseId: testCase.id,
          runStatus: executed.runStatus,
          resultStatus: executed.resultStatus,
          notes,
        },
      });
    }
  }

  return { features: featureCount, testCases: testCaseCount };
}

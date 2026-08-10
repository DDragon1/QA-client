import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { AppVersion, RunStatus, ResultStatus, TestType } from '@prisma/client';
import { labelResultStatus, labelRunStatus, labelTestType } from '../lib/labels';

type RunWithTestCase = {
  id: string;
  runStatus: RunStatus;
  resultStatus: ResultStatus | null;
  notes: string | null;
  testCase: {
    scenario: string;
    steps: string;
    expectedResult: string;
    type: TestType;
    feature: { name: string };
  };
};

export async function generateExcelReport(version: AppVersion, runs: RunWithTestCase[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('דוח QA');

  sheet.columns = [
    { header: 'תכולה', key: 'feature', width: 20 },
    { header: 'תרחיש', key: 'scenario', width: 25 },
    { header: 'שלבים לביצוע', key: 'steps', width: 40 },
    { header: 'תוצר צפוי', key: 'expected', width: 30 },
    { header: 'סוג', key: 'type', width: 12 },
    { header: 'סטטוס הרצה', key: 'runStatus', width: 18 },
    { header: 'תוצאה', key: 'resultStatus', width: 15 },
    { header: 'הערות', key: 'notes', width: 30 },
  ];

  sheet.getRow(1).font = { bold: true };

  for (const run of runs) {
    sheet.addRow({
      feature: run.testCase.feature.name,
      scenario: run.testCase.scenario,
      steps: run.testCase.steps,
      expected: run.testCase.expectedResult,
      type: labelTestType(run.testCase.type),
      runStatus: labelRunStatus(run.runStatus),
      resultStatus: run.resultStatus ? labelResultStatus(run.resultStatus) : '',
      notes: run.notes ?? '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function generatePdfReport(version: AppVersion, runs: RunWithTestCase[], res: Response): void {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text(`דוח QA - ${version.name}`, { align: 'right' });
  doc.moveDown();
  doc.fontSize(10).text(`נוצר: ${new Date().toLocaleString('he-IL')}`, { align: 'right' });
  if (version.description) {
    doc.text(version.description, { align: 'right' });
  }
  doc.moveDown();

  let currentFeature = '';

  for (const run of runs) {
    if (run.testCase.feature.name !== currentFeature) {
      currentFeature = run.testCase.feature.name;
      doc.moveDown();
      doc.fontSize(14).fillColor('#1565C0').text(`תכולה: ${currentFeature}`, { align: 'right' });
      doc.fillColor('#000000');
      doc.moveDown(0.5);
    }

    doc.fontSize(11).text(`תרחיש: ${run.testCase.scenario}`, { align: 'right' });
    doc.fontSize(9).text(`סוג: ${labelTestType(run.testCase.type)}`, { align: 'right' });
    doc.text(`שלבים: ${run.testCase.steps}`, { align: 'right' });
    doc.text(`תוצר צפוי: ${run.testCase.expectedResult}`, { align: 'right' });
    doc.text(`סטטוס הרצה: ${labelRunStatus(run.runStatus)}`, { align: 'right' });
    doc.text(`תוצאה: ${run.resultStatus ? labelResultStatus(run.resultStatus) : '-'}`, { align: 'right' });
    if (run.notes) {
      doc.text(`הערות: ${run.notes}`, { align: 'right' });
    }
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E0E0E0');
    doc.moveDown(0.5);
  }

  doc.end();
}

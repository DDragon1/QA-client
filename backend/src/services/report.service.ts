import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer-core';
import { AppVersion, RunStatus, ResultStatus, TestType } from '@prisma/client';
import { labelResultStatus, labelRunStatus, labelTestType } from '../lib/labels';

const dejavuRoot = path.dirname(require.resolve('dejavu-fonts-ttf/package.json'));
const FONT_REGULAR = path.join(dejavuRoot, 'ttf', 'DejaVuSans.ttf');
const FONT_BOLD = path.join(dejavuRoot, 'ttf', 'DejaVuSans-Bold.ttf');

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fontDataUrl(filePath: string): string {
  return `data:font/ttf;base64,${fs.readFileSync(filePath).toString('base64')}`;
}

function resolveChromePath(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    'Chrome/Chromium not found. Install Chrome or set PUPPETEER_EXECUTABLE_PATH.'
  );
}

function buildReportHtml(version: AppVersion, runs: RunWithTestCase[]): string {
  const createdAt = new Date().toLocaleString('he-IL');
  const regularFont = fontDataUrl(FONT_REGULAR);
  const boldFont = fontDataUrl(FONT_BOLD);

  const sections: string[] = [];
  let currentFeature = '';

  for (const run of runs) {
    if (run.testCase.feature.name !== currentFeature) {
      currentFeature = run.testCase.feature.name;
      sections.push(`<h2>${escapeHtml(`תכולה: ${currentFeature}`)}</h2>`);
    }

    sections.push(`<article>
      <p class="scenario">${escapeHtml(`תרחיש: ${run.testCase.scenario}`)}</p>
      <p>${escapeHtml(`סוג: ${labelTestType(run.testCase.type)}`)}</p>
      <p>${escapeHtml(`שלבים: ${run.testCase.steps}`)}</p>
      <p>${escapeHtml(`תוצר צפוי: ${run.testCase.expectedResult}`)}</p>
      <p>${escapeHtml(`סטטוס הרצה: ${labelRunStatus(run.runStatus)}`)}</p>
      <p>${escapeHtml(`תוצאה: ${run.resultStatus ? labelResultStatus(run.resultStatus) : '-'}`)}</p>
      ${run.notes ? `<p>${escapeHtml(`הערות: ${run.notes}`)}</p>` : ''}
    </article>`);
  }

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
    @font-face {
      font-family: 'Report';
      src: url('${regularFont}') format('truetype');
      font-weight: 400;
    }
    @font-face {
      font-family: 'Report';
      src: url('${boldFont}') format('truetype');
      font-weight: 700;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: 'Report', Arial, sans-serif;
      color: #111;
      direction: rtl;
      text-align: right;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 700;
    }
    .meta {
      margin: 0 0 20px;
      font-size: 12px;
      color: #333;
    }
    h2 {
      margin: 20px 0 8px;
      font-size: 16px;
      font-weight: 700;
      color: #1565C0;
    }
    article {
      padding-bottom: 10px;
      margin-bottom: 10px;
      border-bottom: 1px solid #E0E0E0;
      font-size: 12px;
      line-height: 1.45;
    }
    article p { margin: 2px 0; }
    .scenario { font-size: 13px; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${escapeHtml(`דוח QA - ${version.name}`)}</h1>
  <p class="meta">${escapeHtml(`נוצר: ${createdAt}`)}</p>
  ${version.description ? `<p class="meta">${escapeHtml(version.description)}</p>` : ''}
  ${sections.join('\n')}
</body>
</html>`;
}

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

export async function generatePdfReport(
  version: AppVersion,
  runs: RunWithTestCase[]
): Promise<Buffer> {
  const html = buildReportHtml(version, runs);
  const browser = await puppeteer.launch({
    executablePath: resolveChromePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '14mm', bottom: '16mm', left: '14mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

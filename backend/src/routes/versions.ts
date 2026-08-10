import { Router } from 'express';
import { RunStatus, ResultStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { computeVersionStats } from '../lib/stats';
import { generateExcelReport, generatePdfReport } from '../services/report.service';

const router = Router();

const createVersionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateRunSchema = z.object({
  runStatus: z.nativeEnum(RunStatus).optional(),
  resultStatus: z.nativeEnum(ResultStatus).nullable().optional(),
  notes: z.string().nullable().optional(),
  rowVersion: z.number().int().positive(),
});

router.get('/', async (_req, res) => {
  const versions = await prisma.appVersion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      versionTestRuns: {
        select: { runStatus: true, resultStatus: true },
      },
    },
  });

  const result = versions.map((v) => ({
    id: v.id,
    name: v.name,
    description: v.description,
    createdAt: v.createdAt,
    stats: computeVersionStats(v.versionTestRuns),
  }));

  res.json(result);
});

router.post('/', async (req, res) => {
  const parsed = createVersionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
    return;
  }

  const activeTestCases = await prisma.testCase.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const version = await prisma.appVersion.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      versionTestRuns: {
        create: activeTestCases.map((tc) => ({
          testCaseId: tc.id,
          runStatus: RunStatus.need_to_run,
        })),
      },
    },
    include: {
      versionTestRuns: {
        select: { runStatus: true, resultStatus: true },
      },
    },
  });

  res.status(201).json({
    id: version.id,
    name: version.name,
    description: version.description,
    createdAt: version.createdAt,
    stats: computeVersionStats(version.versionTestRuns),
  });
});

router.get('/:id', async (req, res) => {
  const version = await prisma.appVersion.findUnique({
    where: { id: req.params.id },
    include: {
      versionTestRuns: {
        select: { runStatus: true, resultStatus: true },
      },
    },
  });

  if (!version) {
    res.status(404).json({ error: 'גרסה לא נמצאה' });
    return;
  }

  res.json({
    id: version.id,
    name: version.name,
    description: version.description,
    createdAt: version.createdAt,
    stats: computeVersionStats(version.versionTestRuns),
  });
});

router.get('/:id/runs', async (req, res) => {
  const version = await prisma.appVersion.findUnique({
    where: { id: req.params.id },
  });

  if (!version) {
    res.status(404).json({ error: 'גרסה לא נמצאה' });
    return;
  }

  const runs = await prisma.versionTestRun.findMany({
    where: { versionId: req.params.id },
    include: {
      testCase: {
        include: { feature: true },
      },
    },
    orderBy: [
      { testCase: { feature: { sortOrder: 'asc' } } },
      { testCase: { sortOrder: 'asc' } },
    ],
  });

  res.json(runs);
});

router.patch('/:versionId/runs/:runId', async (req, res) => {
  const parsed = updateRunSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.versionTestRun.findFirst({
    where: {
      id: req.params.runId,
      versionId: req.params.versionId,
    },
  });

  if (!existing) {
    res.status(404).json({ error: 'ריצת בדיקה לא נמצאה' });
    return;
  }

  if (existing.rowVersion !== parsed.data.rowVersion) {
    res.status(409).json({
      error: 'הרשומה עודכנה על ידי משתמש אחר',
      current: existing,
    });
    return;
  }

  const updateResult = await prisma.versionTestRun.updateMany({
    where: {
      id: req.params.runId,
      versionId: req.params.versionId,
      rowVersion: parsed.data.rowVersion,
    },
    data: {
      ...(parsed.data.runStatus !== undefined ? { runStatus: parsed.data.runStatus } : {}),
      ...(parsed.data.resultStatus !== undefined ? { resultStatus: parsed.data.resultStatus } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      rowVersion: { increment: 1 },
    },
  });

  if (updateResult.count === 0) {
    const current = await prisma.versionTestRun.findFirst({
      where: { id: req.params.runId, versionId: req.params.versionId },
    });
    res.status(409).json({
      error: 'הרשומה עודכנה על ידי משתמש אחר',
      current,
    });
    return;
  }

  const updated = await prisma.versionTestRun.findUnique({
    where: { id: req.params.runId },
    include: {
      testCase: {
        include: { feature: true },
      },
    },
  });

  res.json(updated);
});

router.get('/:id/report.xlsx', async (req, res) => {
  const version = await prisma.appVersion.findUnique({
    where: { id: req.params.id },
  });

  if (!version) {
    res.status(404).json({ error: 'גרסה לא נמצאה' });
    return;
  }

  const runs = await prisma.versionTestRun.findMany({
    where: { versionId: req.params.id },
    include: {
      testCase: {
        include: { feature: true },
      },
    },
    orderBy: [
      { testCase: { feature: { sortOrder: 'asc' } } },
      { testCase: { sortOrder: 'asc' } },
    ],
  });

  const buffer = await generateExcelReport(version, runs);
  const filename = encodeURIComponent(`qa-report-${version.name}.xlsx`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
  res.send(buffer);
});

router.get('/:id/report.pdf', async (req, res) => {
  const version = await prisma.appVersion.findUnique({
    where: { id: req.params.id },
  });

  if (!version) {
    res.status(404).json({ error: 'גרסה לא נמצאה' });
    return;
  }

  const runs = await prisma.versionTestRun.findMany({
    where: { versionId: req.params.id },
    include: {
      testCase: {
        include: { feature: true },
      },
    },
    orderBy: [
      { testCase: { feature: { sortOrder: 'asc' } } },
      { testCase: { sortOrder: 'asc' } },
    ],
  });

  res.setHeader('Content-Type', 'application/pdf');
  const filename = encodeURIComponent(`qa-report-${version.name}.pdf`);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
  generatePdfReport(version, runs, res);
});

export default router;

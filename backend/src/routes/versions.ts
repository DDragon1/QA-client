import { Router } from 'express';
import { Environment, RunStatus, ResultStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { computeVersionStats } from '../lib/stats';
import {
  mapRunsWithSnapshots,
  snapshotFromTestCase,
  toVersionDto,
} from '../lib/versionSnapshot';
import { generateExcelReport, generatePdfReport } from '../services/report.service';

const router = Router();

const createVersionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  environment: z.nativeEnum(Environment),
});

const updateRunSchema = z.object({
  runStatus: z.nativeEnum(RunStatus).optional(),
  resultStatus: z.nativeEnum(ResultStatus).nullable().optional(),
  notes: z.string().nullable().optional(),
  rowVersion: z.number().int().positive(),
});

const runInclude = {
  testCase: {
    include: { feature: true },
  },
} as const;

const runOrderBy = [
  { testCase: { feature: { sortOrder: 'asc' as const } } },
  { testCase: { sortOrder: 'asc' as const } },
];

router.get('/', async (_req, res) => {
  const versions = await prisma.appVersion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      versionTestRuns: {
        select: { runStatus: true, resultStatus: true },
      },
    },
  });

  res.json(
    versions.map((v) => toVersionDto(v, computeVersionStats(v.versionTestRuns)))
  );
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
      environment: parsed.data.environment,
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

  res.status(201).json(toVersionDto(version, computeVersionStats(version.versionTestRuns)));
});

router.post('/:id/finish', async (req, res) => {
  const version = await prisma.appVersion.findUnique({
    where: { id: req.params.id },
  });

  if (!version) {
    res.status(404).json({ error: 'גרסה לא נמצאה' });
    return;
  }

  if (version.finishedAt) {
    res.status(400).json({ error: 'הגרסה כבר הסתיימה' });
    return;
  }

  const finished = await prisma.$transaction(async (tx) => {
    const runs = await tx.versionTestRun.findMany({
      where: { versionId: version.id },
      include: runInclude,
    });

    for (const run of runs) {
      await tx.versionTestRun.update({
        where: { id: run.id },
        data: snapshotFromTestCase(run.testCase),
      });
    }

    return tx.appVersion.update({
      where: { id: version.id },
      data: { finishedAt: new Date() },
      include: {
        versionTestRuns: {
          select: { runStatus: true, resultStatus: true },
        },
      },
    });
  });

  res.json(toVersionDto(finished, computeVersionStats(finished.versionTestRuns)));
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

  res.json(toVersionDto(version, computeVersionStats(version.versionTestRuns)));
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
    include: runInclude,
    orderBy: runOrderBy,
  });

  res.json(mapRunsWithSnapshots(runs));
});

router.patch('/:versionId/runs/:runId', async (req, res) => {
  const parsed = updateRunSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
    return;
  }

  const version = await prisma.appVersion.findUnique({
    where: { id: req.params.versionId },
  });

  if (!version) {
    res.status(404).json({ error: 'גרסה לא נמצאה' });
    return;
  }

  if (version.finishedAt) {
    res.status(403).json({ error: 'לא ניתן לערוך גרסה שסיימה' });
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
    include: runInclude,
  });

  res.json(updated ? mapRunsWithSnapshots([updated])[0] : updated);
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
    include: runInclude,
    orderBy: runOrderBy,
  });

  const buffer = await generateExcelReport(version, mapRunsWithSnapshots(runs));
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
    include: runInclude,
    orderBy: runOrderBy,
  });

  const filename = encodeURIComponent(`qa-report-${version.name}.pdf`);
  const pdf = await generatePdfReport(version, mapRunsWithSnapshots(runs));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
  res.send(pdf);
});

export default router;

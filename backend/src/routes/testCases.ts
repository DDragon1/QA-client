import { Router } from 'express';
import { TestType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const createTestCaseSchema = z.object({
  featureId: z.string().uuid(),
  scenario: z.string().min(1),
  steps: z.string().min(1),
  expectedResult: z.string().min(1),
  type: z.nativeEnum(TestType).optional(),
  sortOrder: z.number().int().optional(),
});

const updateTestCaseSchema = z.object({
  featureId: z.string().uuid().optional(),
  scenario: z.string().min(1).optional(),
  steps: z.string().min(1).optional(),
  expectedResult: z.string().min(1).optional(),
  type: z.nativeEnum(TestType).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

router.get('/', async (req, res) => {
  const featureId = req.query.featureId as string | undefined;
  const includeInactive = req.query.includeInactive === 'true';

  const testCases = await prisma.testCase.findMany({
    where: {
      ...(featureId ? { featureId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { feature: true },
  });
  res.json(testCases);
});

router.post('/', async (req, res) => {
  const parsed = createTestCaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
    return;
  }

  const maxSort = await prisma.testCase.aggregate({
    where: { featureId: parsed.data.featureId },
    _max: { sortOrder: true },
  });

  const testCase = await prisma.testCase.create({
    data: {
      featureId: parsed.data.featureId,
      scenario: parsed.data.scenario,
      steps: parsed.data.steps,
      expectedResult: parsed.data.expectedResult,
      type: parsed.data.type ?? TestType.manual,
      sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
    },
    include: { feature: true },
  });

  const latestOpenVersion = await prisma.appVersion.findFirst({
    where: { finishedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (latestOpenVersion) {
    await prisma.versionTestRun.create({
      data: {
        versionId: latestOpenVersion.id,
        testCaseId: testCase.id,
      },
    });
  }

  res.status(201).json(testCase);
});

router.patch('/:id', async (req, res) => {
  const parsed = updateTestCaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
    return;
  }

  try {
    const testCase = await prisma.testCase.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { feature: true },
    });
    res.json(testCase);
  } catch {
    res.status(404).json({ error: 'בדיקה לא נמצאה' });
  }
});

router.delete('/:id', async (req, res) => {
  const existing = await prisma.testCase.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });

  if (!existing) {
    res.status(404).json({ error: 'בדיקה לא נמצאה' });
    return;
  }

  const lockedRun = await prisma.versionTestRun.findFirst({
    where: {
      testCaseId: req.params.id,
      version: { finishedAt: { not: null } },
    },
    select: { id: true },
  });

  if (lockedRun) {
    res.status(409).json({ error: 'לא ניתן למחוק בדיקה שכלולה בגרסה שסיימה' });
    return;
  }

  await prisma.testCase.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;

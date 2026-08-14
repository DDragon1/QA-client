import { Router } from 'express';
import { TestType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';
import { routeParam, validateUuidParam } from '../lib/params';
import { attachTestCaseToOpenVersions } from '../lib/openVersions';

const router = Router();
router.param('id', validateUuidParam);

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

router.get(
  '/',
  asyncHandler(async (req, res) => {
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
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
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

    await attachTestCaseToOpenVersions(prisma, testCase.id);
    res.status(201).json(testCase);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id');
    const parsed = updateTestCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
      return;
    }

    const testCase = await prisma.testCase.update({
      where: { id },
      data: parsed.data,
      include: { feature: true },
    });
    res.json(testCase);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id');
    const existing = await prisma.testCase.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'בדיקה לא נמצאה' });
      return;
    }

    const linkedRun = await prisma.versionTestRun.findFirst({
      where: { testCaseId: id },
      select: { id: true },
    });

    if (linkedRun) {
      res.status(409).json({ error: 'לא ניתן למחוק בדיקה שכלולה בגרסה' });
      return;
    }

    await prisma.testCase.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const createFeatureSchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

const updateFeatureSchema = z.object({
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

router.get('/', async (_req, res) => {
  const features = await prisma.feature.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      testCases: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });
  res.json(features);
});

router.post('/', async (req, res) => {
  const parsed = createFeatureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
    return;
  }

  const maxSort = await prisma.feature.aggregate({ _max: { sortOrder: true } });
  const feature = await prisma.feature.create({
    data: {
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  res.status(201).json(feature);
});

router.patch('/:id', async (req, res) => {
  const parsed = updateFeatureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
    return;
  }

  try {
    const feature = await prisma.feature.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(feature);
  } catch {
    res.status(404).json({ error: 'תכולה לא נמצאה' });
  }
});

router.delete('/:id', async (req, res) => {
  const existing = await prisma.feature.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });

  if (!existing) {
    res.status(404).json({ error: 'תכולה לא נמצאה' });
    return;
  }

  const lockedRun = await prisma.versionTestRun.findFirst({
    where: {
      testCase: { featureId: req.params.id },
      version: { finishedAt: { not: null } },
    },
    select: { id: true },
  });

  if (lockedRun) {
    res.status(409).json({ error: 'לא ניתן למחוק תכולה שכלולה בגרסה שסיימה' });
    return;
  }

  await prisma.feature.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;

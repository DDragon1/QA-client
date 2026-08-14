import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';
import { routeParam, validateUuidParam } from '../lib/params';

const router = Router();
router.param('id', validateUuidParam);

const createFeatureSchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().int().optional(),
  teamId: z.string().uuid().nullable().optional(),
});

const updateFeatureSchema = z.object({
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  teamId: z.string().uuid().nullable().optional(),
});

const featureInclude = (includeInactive: boolean) => ({
  team: true,
  testCases: {
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
  },
});

async function assertTeamExists(teamId: string | null | undefined): Promise<boolean> {
  if (!teamId) return true;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });
  return !!team;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const features = await prisma.feature.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: featureInclude(includeInactive),
    });
    res.json(features);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createFeatureSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
      return;
    }

    if (!(await assertTeamExists(parsed.data.teamId))) {
      res.status(400).json({ error: 'צוות לא נמצא' });
      return;
    }

    const maxSort = await prisma.feature.aggregate({ _max: { sortOrder: true } });
    const feature = await prisma.feature.create({
      data: {
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
        teamId: parsed.data.teamId ?? null,
      },
      include: featureInclude(true),
    });
    res.status(201).json(feature);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id');
    const parsed = updateFeatureSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
      return;
    }

    if (!(await assertTeamExists(parsed.data.teamId))) {
      res.status(400).json({ error: 'צוות לא נמצא' });
      return;
    }

    const feature = await prisma.feature.update({
      where: { id },
      data: parsed.data,
      include: featureInclude(true),
    });
    res.json(feature);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id');
    const existing = await prisma.feature.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'תכולה לא נמצאה' });
      return;
    }

    const linkedRun = await prisma.versionTestRun.findFirst({
      where: {
        testCase: { featureId: id },
      },
      select: { id: true },
    });

    if (linkedRun) {
      res.status(409).json({ error: 'לא ניתן למחוק תכולה שכלולה בגרסה' });
      return;
    }

    await prisma.feature.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;

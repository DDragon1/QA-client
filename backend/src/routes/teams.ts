import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';
import { routeParam, validateUuidParam } from '../lib/params';

const router = Router();
router.param('id', validateUuidParam);

const createTeamSchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const teams = await prisma.team.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { features: true } },
      },
    });

    res.json(
      teams.map(({ _count, ...team }) => ({
        ...team,
        featureCount: _count.features,
      }))
    );
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
      return;
    }

    const maxSort = await prisma.team.aggregate({ _max: { sortOrder: true } });

    try {
      const team = await prisma.team.create({
        data: {
          name: parsed.data.name,
          sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
        },
      });
      res.status(201).json({ ...team, featureCount: 0 });
    } catch (error) {
      if (isUniqueConstraint(error)) {
        res.status(409).json({ error: 'כבר קיים צוות עם שם זה' });
        return;
      }
      throw error;
    }
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id');
    const parsed = updateTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'נתונים לא תקינים', details: parsed.error.flatten() });
      return;
    }

    try {
      const { _count, ...team } = await prisma.team.update({
        where: { id },
        data: parsed.data,
        include: {
          _count: { select: { features: true } },
        },
      });
      res.json({
        ...team,
        featureCount: _count.features,
      });
    } catch (error) {
      if (isUniqueConstraint(error)) {
        res.status(409).json({ error: 'כבר קיים צוות עם שם זה' });
        return;
      }
      throw error;
    }
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id');
    const existing = await prisma.team.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'צוות לא נמצא' });
      return;
    }

    await prisma.team.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;

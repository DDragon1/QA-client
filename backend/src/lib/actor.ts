import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const ACTOR_HEADER = 'x-actor-name';

const actorSchema = z.string().trim().min(1).max(80);

export type ActorRequest = Request & { actorName?: string };

export function parseActorName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  const parsed = actorSchema.safeParse(decoded);
  return parsed.success ? parsed.data : undefined;
}

export function actorMiddleware(req: Request, res: Response, next: NextFunction): void {
  const raw = req.header('X-Actor-Name');
  if (raw == null || raw === '') {
    next();
    return;
  }

  const name = parseActorName(raw);
  if (!name) {
    res.status(400).json({ error: 'שם משתמש לא תקין' });
    return;
  }

  (req as ActorRequest).actorName = name;
  next();
}

export function requireActor(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }

  const actorName = (req as ActorRequest).actorName;
  if (!actorName) {
    res.status(400).json({ error: 'יש לציין מי מבצע את הפעולה' });
    return;
  }

  next();
}

export function getActorName(req: Request): string | undefined {
  return (req as ActorRequest).actorName;
}

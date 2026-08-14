import { NextFunction, Request, Response } from 'express';
import { isUuid } from './uuid';

export function routeParam(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function validateUuidParam(req: Request, res: Response, next: NextFunction, value: string): void {
  if (!isUuid(value)) {
    res.status(400).json({ error: 'מזהה לא תקין' });
    return;
  }
  next();
}

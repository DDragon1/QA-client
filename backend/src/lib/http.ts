import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'הקובץ גדול מדי (מקסימום 10MB)' });
      return;
    }
    res.status(400).json({ error: 'שגיאה בהעלאת הקובץ' });
    return;
  }

  if (err instanceof Error && err.message === 'INVALID_EXCEL') {
    res.status(400).json({ error: 'יש להעלות קובץ Excel' });
    return;
  }

  if (isClientHttpError(err)) {
    res.status(err.status).json({ error: 'נתונים לא תקינים' });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025' || err.code === 'P2023') {
      res.status(404).json({ error: 'לא נמצא' });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: 'שגיאת שרת' });
}

function isClientHttpError(err: unknown): err is { status: number } {
  if (typeof err !== 'object' || err == null || !('status' in err)) return false;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

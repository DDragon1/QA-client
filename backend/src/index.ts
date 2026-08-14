import express from 'express';
import cors from 'cors';
import featuresRouter from './routes/features';
import testCasesRouter from './routes/testCases';
import versionsRouter from './routes/versions';
import importRouter from './routes/import';
import teamsRouter from './routes/teams';
import { actorMiddleware, requireActor } from './lib/actor';
import { asyncHandler, errorHandler } from './lib/http';
import { prisma } from './lib/prisma';

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

app.use(
  cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'X-Actor-Name'],
    exposedHeaders: ['Content-Disposition'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(actorMiddleware);
app.use('/api', requireActor);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get(
  '/api/actors',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.versionTestRun.findMany({
      where: { lastUpdatedBy: { not: null } },
      distinct: ['lastUpdatedBy'],
      select: { lastUpdatedBy: true },
      orderBy: { lastUpdatedBy: 'asc' },
    });
    res.json(rows.map((row) => row.lastUpdatedBy).filter((name): name is string => !!name));
  })
);

app.use('/api/teams', teamsRouter);
app.use('/api/features', featuresRouter);
app.use('/api/test-cases', testCasesRouter);
app.use('/api/versions', versionsRouter);
app.use('/api/import', importRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'לא נמצא' });
});

app.use(errorHandler);

const server = app.listen(port, host, () => {
  console.log(`QA backend running on http://${host}:${port}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down`);
  server.close(() => {
    prisma
      .$disconnect()
      .catch((err) => console.error(err))
      .finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

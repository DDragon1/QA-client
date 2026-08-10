import express from 'express';
import cors from 'cors';
import featuresRouter from './routes/features';
import testCasesRouter from './routes/testCases';
import versionsRouter from './routes/versions';
import importRouter from './routes/import';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/features', featuresRouter);
app.use('/api/test-cases', testCasesRouter);
app.use('/api/versions', versionsRouter);
app.use('/api/import', importRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'לא נמצא' });
});

app.listen(port, () => {
  console.log(`QA backend running on http://localhost:${port}`);
});

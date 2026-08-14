import { Router } from 'express';
import multer from 'multer';
import { importExcelFile } from '../services/import.service';
import { getActorName } from '../lib/actor';
import { asyncHandler } from '../lib/http';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/\.xlsx?$/i.test(file.originalname)) {
      cb(new Error('INVALID_EXCEL'));
      return;
    }
    cb(null, true);
  },
});

router.post(
  '/excel',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'לא הועלה קובץ' });
      return;
    }

    const result = await importExcelFile(req.file.buffer, getActorName(req));
    res.json(result);
  })
);

export default router;

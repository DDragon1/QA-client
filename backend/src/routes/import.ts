import { Router } from 'express';
import multer from 'multer';
import { importExcelFile } from '../services/import.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'לא הועלה קובץ' });
    return;
  }

  try {
    const result = await importExcelFile(req.file.buffer);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בייבוא הקובץ';
    res.status(400).json({ error: message });
  }
});

export default router;

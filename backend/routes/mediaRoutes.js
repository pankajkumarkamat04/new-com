import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as mediaController from '../controllers/mediaController.js';
import { protectAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const fs = await import('fs/promises');
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || path.extname(file.mimetype) || '';
    const base = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 50);
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    cb(null, `${base}-${unique}${ext || '.bin'}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/|^video\/|^application\/pdf$/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, videos, and PDFs are allowed'));
    }
  },
});

const router = express.Router();

router.get('/', protectAdmin, mediaController.list);
router.post('/upload', protectAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }
    next();
  });
}, mediaController.upload);
router.delete('/:id', protectAdmin, mediaController.remove);

export default router;

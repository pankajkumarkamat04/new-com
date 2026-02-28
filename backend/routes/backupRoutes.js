import express from 'express';
import multer from 'multer';
import * as backupController from '../controllers/backupController.js';
import { protectSuperAdmin } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for backup JSON
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'application/json' || file.originalname?.toLowerCase().endsWith('.json');
    if (ok) cb(null, true);
    else cb(new Error('Only JSON files are allowed'));
  },
});

const router = express.Router();

router.get('/', protectSuperAdmin, backupController.createBackup);
router.post('/restore', protectSuperAdmin, (req, res, next) => {
  const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
  if (isMultipart) {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
      next();
    });
  } else {
    next();
  }
}, backupController.restoreBackup);

export default router;

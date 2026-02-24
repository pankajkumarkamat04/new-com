import Media from '../models/Media.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../uploads');

export const list = async (req, res) => {
  try {
    const { page = 1, limit = 24, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (type === 'image') {
      filter.mimeType = { $regex: /^image\// };
    } else if (type === 'video') {
      filter.mimeType = { $regex: /^video\// };
    } else if (type === 'document') {
      filter.mimeType = { $regex: /^(application\/pdf|text\/)/ };
    }

    const [items, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Media.countDocuments(filter),
    ]);

    // Always expose URLs under /api/uploads so they align with backend routing
    // (Nginx proxies all /api/* to this app).
    const itemsWithApiUrl = items.map((item) => ({
      ...item,
      url: `/api/uploads/${item.filename}`,
    }));
    res.json({
      success: true,
      data: itemsWithApiUrl,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const url = `/api/uploads/${req.file.filename}`;

    const media = await Media.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url,
      path: req.file.path,
    });

    res.status(201).json({
      success: true,
      data: {
        ...media.toObject(),
        url,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    try {
      await fs.unlink(media.path);
    } catch (err) {
      console.warn('Could not delete file from disk:', err.message);
    }

    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

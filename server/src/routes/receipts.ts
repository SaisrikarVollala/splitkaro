import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/requireAuth';
import { receiptQueue } from '../services/queue';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `receipt-${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only receipt images (JPEG, PNG, WEBP) are allowed'));
  }
});

// POST /api/receipts/upload - Ingest receipt asynchronously
router.post('/upload', requireAuth, upload.single('receipt'), async (req: any, res: any, next: any) => {
  try {
    const file = req.file;
    const { groupId, tempId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!groupId || !tempId) {
      // Clean up uploaded file if fields are missing
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'groupId and tempId are required parameters' });
    }

    const userId = req.user.id;
    const jobId = `job-${tempId}`;

    // Add job to BullMQ queue
    await receiptQueue.add('process-receipt', {
      userId,
      groupId,
      tempId,
      filePath: `/uploads/${file.filename}`, // relative URL path
      absolutePath: file.path,              // actual local file path
      originalName: file.originalname,
      mimeType: file.mimetype
    }, {
      jobId,
      removeOnComplete: true,
      removeOnFail: true
    });

    // Return immediate 202 Accepted
    return res.status(202).json({
      jobId,
      tempId,
      status: 'queued',
      message: 'Receipt upload accepted. Processing in background.'
    });

  } catch (error) {
    next(error);
  }
});

export default router;

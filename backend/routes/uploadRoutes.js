// routes/upload.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

// สร้าง folder uploads ถ้าไม่มีก่อน
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Route POST /api/upload
router.post('/', protect, upload.single('image'), (req, res) => {
  if (req.file) {
    // สร้าง Base URL อัตโนมัติตาม Server ที่รันอยู่
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.json({
      message: 'Image uploaded successfully',
      url: `${baseUrl}/uploads/${req.file.filename}` // 👈 ใช้ baseUrl แทน localhost
    });
  } else {
    res.status(400).json({ message: 'No file provided or invalid file type' });
  }
});

export default router;

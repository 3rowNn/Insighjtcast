import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/authmiddleware.js'; // 🛠️ FIX: แก้ชื่อไฟล์ให้ถูกต้อง

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

/**
 * @swagger
 * tags:
 * - name: Upload
 * description: อัปโหลดไฟล์รูปภาพ
 */

/**
 * @swagger
 * tags:
 *   - name: Upload
 *     description: อัปโหลดไฟล์รูปภาพ
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: อัปโหลดรูปภาพ
 *     description: อัปโหลดรูปภาพเพื่อใช้ในเนื้อหา (รองรับ jpg, jpeg, png, webp ขนาดไม่เกิน 5MB)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: ไฟล์รูปภาพที่ต้องการอัปโหลด
 *     responses:
 *       200:
 *         description: อัปโหลดสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 url:
 *                   type: string
 *                   description: URL ของรูปภาพที่อัปโหลด
 *                   example: http://localhost:5000/uploads/image-123456789.jpg
 *       400:
 *         description: ไม่ได้แนบไฟล์ หรือประเภทไฟล์ไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้รับอนุญาต (Token ไม่ถูกต้อง)
 */

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
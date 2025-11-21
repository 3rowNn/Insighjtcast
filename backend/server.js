// 1. นำเข้าไลบรารีที่จำเป็น
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import podcastRoutes from './routes/podcastRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import seriesRoutes from './routes/seriesRoutes.js'; // 1. 💥 NEW: Import Series Routes
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// 2. โหลด Environment Variables
dotenv.config();

// 3. เรียกใช้ฟังก์ชันเชื่อมต่อฐานข้อมูล
connectDB();

// 4. สร้าง instance ของ Express
const app = express();

// --- 'allowedOrigins' (ต้องอยู่ก่อน 'app.use(cors)') ---
const allowedOrigins = [
  'http://localhost:3000',
];

// 5. 🛠️ FIX: ย้าย 'cors' มาไว้ "บนสุด" (ก่อน 'uploads')
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// --- เพิ่ม limit (50mb) (เหมือนเดิม) ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 6. 🛠️ FIX: ตั้งค่า Static 'uploads' (ต้องอยู่หลัง 'cors') ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// 7. กำหนด Route พื้นฐาน (ต้องอยู่หลัง Middlewares)
app.use('/api/auth', authRoutes);
app.use('/api/podcasts', podcastRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/series', seriesRoutes); // 2. 💥 NEW: ใช้งาน Series Routes

// Route test
app.get('/', (req, res) => {
  res.send('API is running successfully and connected to MongoDB!');
});

// 8. กำหนด Port ที่ต้องการรัน
const PORT = process.env.PORT || 5000;

// 9. เริ่มต้น Server
app.listen(PORT, () => {
  console.log(`📡 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
// routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Endpoint สำหรับสมัครสมาชิก
router.post('/register', registerUser);

// Endpoint สำหรับเข้าสู่ระบบ
router.post('/login', loginUser);

export default router;
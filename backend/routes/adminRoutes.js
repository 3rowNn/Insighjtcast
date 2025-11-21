import express from 'express';
import {
    getAllUsers,
    updateUserRole,
    deleteUser,
    getAllReports,
    resolveReport,
    rejectApplication,
    sendMassNotification,
    sendTargetedNotification
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- User Routes ---
router.get('/users', protect, isAdmin, getAllUsers);
router.put('/users/:id/role', protect, isAdmin, updateUserRole);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.put('/users/:id/reject', protect, isAdmin, rejectApplication); // 2. 🛠️ FIX: เพิ่ม Route ใหม่

// --- Report Routes ---
router.get('/reports', protect, isAdmin, getAllReports);
router.put('/reports/:id', protect, isAdmin, resolveReport);
router.post('/notify', protect, isAdmin, sendMassNotification); 
router.post('/notify/:recipientId', protect, isAdmin, sendTargetedNotification);

export default router;
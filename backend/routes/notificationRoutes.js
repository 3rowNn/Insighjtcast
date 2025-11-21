import express from 'express';
import { protect } from '../middleware/authmiddleware.js';
import { getUserNotifications, markAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getUserNotifications);
router.put('/:id/read', protect, markAsRead);

export default router;
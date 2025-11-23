import express from 'express';
import { protect } from '../middleware/authmiddleware.js';
import { getUserNotifications, markAsRead } from '../controllers/notificationController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   -name: Notifications
 *   description: ระบบการแจ้งเตือน (Notifications) สำหรับผู้ใช้
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: ดึงรายการแจ้งเตือนทั้งหมดของฉัน
 *     description: ดึงข้อมูลการแจ้งเตือนของผู้ใช้ที่ล็อกอินอยู่ โดยเรียงจากใหม่ไปเก่า
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการแจ้งเตือนทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   recipient:
 *                     type: string
 *                     description: ID ผู้รับ
 *                   sender:
 *                     type: string
 *                     description: ID ผู้ส่ง
 *                   type:
 *                     type: string
 *                     enum: [announcement, private_message]
 *                     description: ประเภทการแจ้งเตือน
 *                   message:
 *                     type: string
 *                   isRead:
 *                     type: boolean
 *                     description: อ่านแล้วหรือไม่
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: ไม่ได้รับอนุญาต (Token ไม่ถูกต้อง)
 *       500:
 *         description: Server Error
 */
router.get('/', protect, getUserNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: เปลี่ยนสถานะแจ้งเตือนเป็น "อ่านแล้ว"
 *     description: อัปเดต isRead เป็น true เมื่อผู้ใช้กดอ่าน
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของการแจ้งเตือนที่ต้องการอ่าน
 *     responses:
 *       200:
 *         description: อัปเดตสถานะสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 isRead:
 *                   type: boolean
 *             example:
 *               _id: "661234abcd9f00aa99bb23"
 *               isRead: true
 *       401:
 *         description: ไม่ได้รับอนุญาต หรือไม่ใช่เจ้าของแจ้งเตือนนี้
 *       404:
 *         description: ไม่พบการแจ้งเตือน
 *       500:
 *         description: Server Error
 */
router.put('/:id/read', protect, markAsRead);

export default router;

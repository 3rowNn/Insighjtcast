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
import { protect, isAdmin } from '../middleware/authmiddleware.js'; // 🛠️ FIX: ใช้ชื่อ 'admin' และ 'authMiddleware.js'

const router = express.Router();

/**
 * @swagger
 * tags:
 * -name: Admin
 * description: API สำหรับผู้ดูแลระบบ (จัดการ Users, Reports, Notifications)
 */

// -----------------------------------------
// 👤 User Management
// -----------------------------------------

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: ดึงรายชื่อผู้ใช้ทั้งหมด
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายชื่อผู้ใช้ทั้งหมด รวมถึงสถานะการสมัคร Writer
 *       401:
 *         description: ไม่ได้รับอนุญาต (Token ไม่ถูกต้อง)
 *       403:
 *         description: ไม่ใช่ Admin
 */

router.get('/users', protect, isAdmin, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: เปลี่ยนบทบาทผู้ใช้
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของ User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, writer, admin]
 *     responses:
 *       200:
 *         description: เปลี่ยนบทบาทสำเร็จ
 *       404:
 *         description: ไม่พบผู้ใช้
 */

router.put('/users/:id/role', protect, isAdmin, updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: ลบผู้ใช้ถาวร
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ผู้ใช้ถูกลบเรียบร้อยแล้ว
 *       400:
 *         description: ไม่สามารถลบ Admin ได้
 *       404:
 *         description: ไม่พบผู้ใช้
 */

router.delete('/users/:id', protect, isAdmin, deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}/reject:
 *   put:
 *     summary: ปฏิเสธคำขอเป็นนักเขียน
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ปฏิเสธคำขอสำเร็จ
 *       404:
 *         description: ไม่พบผู้ใช้
 */

router.put('/users/:id/reject', protect, isAdmin, rejectApplication);

// -----------------------------------------
// 🚩 Report Management
// -----------------------------------------

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: ดึงรายการรายงานปัญหาทั้งหมด
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการ Report ทั้งหมด
 */

router.get('/reports', protect, isAdmin, getAllReports);

/**
 * @swagger
 * /api/admin/reports/{id}:
 *   put:
 *     summary: แก้ไขรายงานปัญหา (Resolve Report)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report ถูกจัดการเรียบร้อยแล้ว
 *       404:
 *         description: ไม่พบ Report
 */

router.put('/reports/:id', protect, isAdmin, resolveReport);

// -----------------------------------------
// 🔔 Notifications
// -----------------------------------------

/**
 * @swagger
 * /api/admin/notify:
 *   post:
 *     summary: ส่งประกาศหาทุกคนในระบบ
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: ระบบจะปิดปรับปรุงเวลา 22:00 น.
 *     responses:
 *       200:
 *         description: ส่งประกาศสำเร็จ
 */

router.post('/notify', protect, isAdmin, sendMassNotification);

/**
 * @swagger
 * /api/admin/notify/{recipientId}:
 *   post:
 *     summary: ส่งข้อความส่วนตัวให้ผู้ใช้
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของผู้รับ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: นิยายของคุณมีเนื้อหาไม่เหมาะสม กรุณาแก้ไข
 *     responses:
 *       200:
 *         description: ส่งข้อความสำเร็จ
 *       400:
 *         description: ID ผู้รับไม่ถูกต้อง
 *       404:
 *         description: ไม่พบผู้รับ
 */

router.post('/notify/:recipientId', protect, isAdmin, sendTargetedNotification);

export default router;
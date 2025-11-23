import express from 'express';
import { 
    createEpisode, getAllPodcasts, getPodcastById, updatePodcast,
    deletePodcast, getDeletedPodcasts, restorePodcast, forceDeletePodcast,
    createComment, deleteComment, likePodcast, reportPodcast, getCommentsByPodcast
} from '../controllers/podcastController.js';
import { protect } from '../middleware/authmiddleware.js'; // 🛠️ FIX: แก้ชื่อไฟล์ให้ถูกต้อง (authMiddleware.js)

const router = express.Router();

/**
 * @swagger
 * tags:
 * - name: Podcasts
 * description: จัดการตอนย่อย (Episodes) ภายในเรื่อง
 */

// Routes หลัก

/**
 * @swagger
 * /api/podcasts:
 *   get:
 *     summary: ดึงรายชื่อตอนทั้งหมดของฉัน (Dashboard)
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *       500:
 *         description: Server Error
 */

router.get('/', protect, getAllPodcasts);

/**
 * @swagger
 * /api/podcasts/{seriesId}:
 *   post:
 *     summary: สร้างตอนใหม่ใน Series ที่ระบุ
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของ Series
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบ
 */

router.post('/:seriesId', protect, createEpisode);

// ---------------------------------------------------------
// 💥 FIX: ต้องวาง Route '/trash' ไว้ตรงนี้ (ก่อน /:id) เท่านั้น!
// ---------------------------------------------------------

/**
 * @swagger
 * /api/podcasts/trash:
 *   get:
 *     summary: ดูรายการตอนในถังขยะ (Recycle Bin)
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 */

router.get('/trash', protect, getDeletedPodcasts);

/**
 * @swagger
 * /api/podcasts/{id}/restore:
 *   put:
 *     summary: กู้คืนตอนจากถังขยะ
 *     tags: [Podcasts]
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
 *         description: กู้คืนสำเร็จ
 */

router.put('/:id/restore', protect, restorePodcast);    

/**
 * @swagger
 * /api/podcasts/{id}/force:
 *   delete:
 *     summary: ลบตอนถาวร (Hard Delete)
 *     tags: [Podcasts]
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
 *         description: ลบถาวรสำเร็จ
 */

router.delete('/:id/force', protect, forceDeletePodcast); 


/**
 * @swagger
 * /api/podcasts/{id}:
 *   get:
 *     summary: ดึงข้อมูลตอนเพื่อแก้ไข
 *     tags: [Podcasts]
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
 *         description: สำเร็จ
 *   put:
 *     summary: บันทึกการแก้ไขตอน
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 *   delete:
 *     summary: ย้ายตอนลงถังขยะ (Soft Delete)
 *     tags: [Podcasts]
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
 *         description: ย้ายลงถังขยะสำเร็จ
 */
router.route('/:id')
    .get(protect, getPodcastById)
    .put(protect, updatePodcast)
    .delete(protect, deletePodcast); 

// Interaction Routes (Comments, Likes, Reports)

/**
 * @swagger
 * /api/podcasts/public/{id}/comments:
 *   get:
 *     summary: (Public) ดูคอมเมนต์ของตอน
 *     tags: [Podcasts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: สำเร็จ
 */

router.get('/public/:id/comments', getCommentsByPodcast);

/**
 * @swagger
 * /api/podcasts/{id}/comment:
 *   post:
 *     summary: คอมเมนต์ตอน
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: คอมเมนต์สำเร็จ
 */

router.post('/:id/comment', protect, createComment);

/**
 * @swagger
 * /api/podcasts/{id}/comment/{comment_id}:
 *   delete:
 *     summary: ลบคอมเมนต์ตอน
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: comment_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 */

router.delete('/:id/comment/:comment_id', protect, deleteComment);

/**
 * @swagger
 * /api/podcasts/{id}/like:
 *   put:
 *     summary: กดหัวใจตอน
 *     tags: [Podcasts]
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
 *         description: สำเร็จ
 */

router.put('/:id/like', protect, likePodcast);

/**
 * @swagger
 * /api/podcasts/{id}/report:
 *   post:
 *     summary: รายงานปัญหา (Report)
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: เหตุผล (Inappropriate, Spam, Broken, Other)
 *               details:
 *                 type: string
 *     responses:
 *       201:
 *         description: ส่งรายงานสำเร็จ
 */

router.post('/:id/report', protect, reportPodcast);

export default router;
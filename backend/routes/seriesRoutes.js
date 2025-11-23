import express from 'express';
import { 
    getMySeries, createSeries, getPublicSeries, getPublicSeriesByIdWithEpisodes,
    deleteSeries, getDeletedSeries, restoreSeries, forceDeleteSeries,
    updateSeries, getSingleSeries, createSeriesComment, getSeriesComments, deleteSeriesComment, likeSeries
} from '../controllers/seriesController.js';
import { protect } from '../middleware/authmiddleware.js'; 

const router = express.Router();

/**
 * @swagger
 * tags:
 * - name: Series
 * description: จัดการนิยาย/เรื่องราว (Series)
 */

// --- Public Routes ---

/**
 * @swagger
 * /api/series/public:
 *   get:
 *     summary: ดึงรายชื่อเรื่องทั้งหมด (Public)
 *     description: สำหรับแสดงหน้า Home หรือ Podcasts (แสดงเฉพาะเรื่องที่ยังไม่ถูกลบ)
 *     tags: [Series]
 *     security: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 */

router.get('/public', getPublicSeries);

/**
 * @swagger
 * /api/series/public/{id}:
 *   get:
 *     summary: ดึงเนื้อหาของเรื่องและตอนย่อย (Public)
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของ Series
 *     responses:
 *       200:
 *         description: สำเร็จ (คืนค่า seriesData และ episodesData)
 *       404:
 *         description: ไม่พบเรื่อง
 */

router.get('/public/:id', getPublicSeriesByIdWithEpisodes);

/**
 * @swagger
 * /api/series/public/{id}/comments:
 *   get:
 *     summary: ดึงคอมเมนต์ของเรื่อง (Public)
 *     tags: [Series]
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

router.get('/public/:id/comments', getSeriesComments); 

// ---------------------------------------------------------
// 💥 Routes สำหรับถังขยะ (ต้องวางไว้ก่อน /:id)
// ---------------------------------------------------------

/**
 * @swagger
 * /api/series/trash:
 *   get:
 *     summary: ดูรายการเรื่องในถังขยะ (Recycle Bin)
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 */

router.get('/trash', protect, getDeletedSeries);

/**
 * @swagger
 * /api/series/{id}/restore:
 *   put:
 *     summary: กู้คืนเรื่องจากถังขยะ
 *     tags: [Series]
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

router.put('/:id/restore', protect, restoreSeries);

/**
 * @swagger
 * /api/series/{id}/force:
 *   delete:
 *     summary: ลบเรื่องถาวร (Hard Delete)
 *     tags: [Series]
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

router.delete('/:id/force', protect, forceDeleteSeries);

// --- Protected Routes ---

// 1. Route หลัก: GET /api/series และ POST /api/series

/**
 * @swagger
 * /api/series:
 *   get:
 *     summary: ดึงเรื่องของฉัน (Dashboard)
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *   post:
 *     summary: สร้างเรื่องใหม่
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, desc, category]
 *             properties:
 *               title:
 *                 type: string
 *               desc:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Tech, Life, News, Story, Other]
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 */

router.route('/')
    .post(protect, createSeries) 
    .get(protect, getMySeries);


// 2. Route สำหรับ Series ID: PUT /api/series/:id และ DELETE /api/series/:id
/**
 * @swagger
 * /api/series/{id}:
 *   get:
 *     summary: ดึงข้อมูลเรื่องเพื่อแก้ไข
 *     tags: [Series]
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
 *     summary: แก้ไข/อัปเดตเรื่อง
 *     tags: [Series]
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
 *               desc:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 *   delete:
 *     summary: ย้ายเรื่องลงถังขยะ (Soft Delete)
 *     tags: [Series]
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
    .get(protect, getSingleSeries)
    .put(protect, updateSeries)    // 🎯 ใช้ updateSeries
    .delete(protect, deleteSeries);  // 🎯 ใช้ deleteSeries

// 3. Route สำหรับ Nested Resources (Comments/Likes)

/**
 * @swagger
 * /api/series/{id}/comment:
 *   post:
 *     summary: คอมเมนต์เรื่อง
 *     tags: [Series]
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

router.post('/:id/comment', protect, createSeriesComment); 

/**
 * @swagger
 * /api/series/{id}/comment/{comment_id}:
 *   delete:
 *     summary: ลบคอมเมนต์เรื่อง
 *     tags: [Series]
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

router.delete('/:id/comment/:comment_id', protect, deleteSeriesComment); 

/**
 * @swagger
 * /api/series/{id}/like:
 *   put:
 *     summary: กดหัวใจเรื่อง
 *     tags: [Series]
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

router.put('/:id/like', protect, likeSeries); 

export default router;
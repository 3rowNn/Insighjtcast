import express from 'express';
import {
    createSeries,
    getPublicSeries,
    getPublicSeriesByIdWithEpisodes,
    getMySeries,
    getSeriesComments,
    createSeriesComment,
    deleteSeriesComment,
    likeSeries,
    updateSeries,    
    deleteSeries,
    getSingleSeries,
    getDeletedSeries,
    restoreSeries,
    forceDeleteSeries,
} from '../controllers/seriesController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Public Routes ---
router.get('/public', getPublicSeries);
router.get('/public/:id', getPublicSeriesByIdWithEpisodes);
router.get('/public/:id/comments', getSeriesComments); 

    // 💥 Routes สำหรับถังขยะ (ต้องวางไว้ก่อน /:id)
router.get('/trash', protect, getDeletedSeries);
router.put('/:id/restore', protect, restoreSeries);
router.delete('/:id/force', protect, forceDeleteSeries);
// --- Protected Routes ---

// 1. Route หลัก: GET /api/series และ POST /api/series
router.route('/')
    .post(protect, createSeries) 
    .get(protect, getMySeries);


// 2. Route สำหรับ Series ID: PUT /api/series/:id และ DELETE /api/series/:id
router.route('/:id')
    .get(protect, getSingleSeries)
    .put(protect, updateSeries)     // 🎯 ใช้ updateSeries
    .delete(protect, deleteSeries);  // 🎯 ใช้ deleteSeries

// 3. Route สำหรับ Nested Resources (Comments/Likes)
router.post('/:id/comment', protect, createSeriesComment); 
router.delete('/:id/comment/:comment_id', protect, deleteSeriesComment); 
router.put('/:id/like', protect, likeSeries); 



export default router;
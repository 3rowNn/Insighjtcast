import express from 'express';
import { 
    createEpisode, getAllPodcasts, getPodcastById, updatePodcast,
    deletePodcast, getDeletedPodcasts, restorePodcast, forceDeletePodcast,
    createComment, deleteComment, likePodcast, reportPodcast, getCommentsByPodcast
} from '../controllers/podcastController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes หลัก
router.get('/', protect, getAllPodcasts);
router.post('/:seriesId', protect, createEpisode);

// ---------------------------------------------------------
// 💥 FIX: ต้องวาง Route '/trash' ไว้ตรงนี้ (ก่อน /:id) เท่านั้น!
// ---------------------------------------------------------
router.get('/trash', protect, getDeletedPodcasts);      // <--- ต้องอยู่บนสุด
router.put('/:id/restore', protect, restorePodcast);    // กู้คืน
router.delete('/:id/force', protect, forceDeletePodcast); // ลบถาวร

// Routes ราย ID (Dynamic Route)
// ถ้าวางไว้บนสุด มันจะดักคำว่า 'trash' ว่าเป็น id ทำให้เกิด Error
router.route('/:id')
    .get(protect, getPodcastById)
    .put(protect, updatePodcast)
    .delete(protect, deletePodcast); // Soft Delete

// Interaction Routes (Comments, Likes, Reports)
router.get('/public/:id/comments', getCommentsByPodcast);
router.post('/:id/comment', protect, createComment);
router.delete('/:id/comment/:comment_id', protect, deleteComment);
router.put('/:id/like', protect, likePodcast);
router.post('/:id/report', protect, reportPodcast);

export default router;
import Podcast from '../models/podcastModel.js';
import Series from '../models/seriesModel.js';
import Comment from '../models/commentModel.js'; // 💥 ต้องมี Model นี้
import Report from '../models/reportModel.js';   // 💥 ต้องมี Model นี้
import Notification from '../models/notificationModel.js';
import mongoose from 'mongoose';

// ==========================================
// 1. Active Content Management (CRUD)
// ==========================================

// @route   POST /api/podcasts/:seriesId
const createEpisode = async (req, res) => {
    const { title, content } = req.body;
    const { seriesId } = req.params;

    if (!title || !content) {
        return res.status(400).json({ message: 'Please provide Title and Content' });
    }

    try {
        const podcast = new Podcast({
            title,
            content,
            series: seriesId,
            author: req.user._id,
            isDeleted: false
        });

        const createdPodcast = await podcast.save();
        res.status(201).json(createdPodcast);
    } catch (error) {
        res.status(400).json({ message: 'Error creating episode', error: error.message });
    }
};

// @route   GET /api/podcasts (Writer Dashboard)
const getAllPodcasts = async (req, res) => {
    try {
        const query = { 
            $or: [ { isDeleted: false }, { isDeleted: { $exists: false } } ] 
        };
        
        // ถ้าไม่ใช่ Admin ให้ดูเฉพาะของตัวเอง
        if (req.user.role !== 'admin') {
            query.author = req.user._id;
        }

        const podcasts = await Podcast.find(query)
        .populate('series', 'title')
        .populate('author', 'username')
        .sort({ createdAt: -1 });
        
        res.json(podcasts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   GET /api/podcasts/:id (For Edit)
const getPodcastById = async (req, res) => {
    try {
        const podcast = await Podcast.findById(req.params.id);

        if (!podcast) {
            return res.status(404).json({ message: 'Podcast not found' });
        }

        if (podcast.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(podcast);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   PUT /api/podcasts/:id
const updatePodcast = async (req, res) => {
    const { title, content } = req.body;

    try {
        const podcast = await Podcast.findById(req.params.id);

        if (!podcast) {
            return res.status(404).json({ message: 'Podcast not found' });
        }

        if (podcast.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        podcast.title = title || podcast.title;
        podcast.content = content || podcast.content;

        const updatedPodcast = await podcast.save();
        res.json(updatedPodcast);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ==========================================
// 2. Trash System (Soft Delete / Restore / Force Delete)
// ==========================================

// @route   DELETE /api/podcasts/:id (Soft Delete)
const deletePodcast = async (req, res) => {
    const podcastId = req.params.id;
    
    const query = { _id: podcastId };
    if (req.user.role !== 'admin') {
        query.author = req.user._id;
    }

    try {
        const podcast = await Podcast.findOneAndUpdate(
            query,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!podcast) {
             return res.status(404).json({ message: 'Podcast not found or authorized' });
        }

        res.json({ message: 'Episode moved to trash' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   GET /api/podcasts/trash
const getDeletedPodcasts = async (req, res) => {
    try {
        const query = { isDeleted: true };
        if (req.user.role !== 'admin') {
            query.author = req.user._id;
        }

        const deletedList = await Podcast.find(query)
            .populate('series', 'title')
            .populate('author', 'username')
            .sort({ deletedAt: -1 });
            
        res.json(deletedList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   PUT /api/podcasts/:id/restore
const restorePodcast = async (req, res) => {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
        query.author = req.user._id;
    }

    try {
        const podcast = await Podcast.findOneAndUpdate(
            query,
            { isDeleted: false, deletedAt: null },
            { new: true }
        );

        if (!podcast) return res.status(404).json({ message: 'Not found or authorized' });
        res.json({ message: 'Episode restored' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   DELETE /api/podcasts/:id/force (Hard Delete)
const forceDeletePodcast = async (req, res) => {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
        query.author = req.user._id;
    }

    try {
        const ep = await Podcast.findOne(query);
        if (!ep) return res.status(404).json({ message: 'Not found or authorized' });
        
        await ep.deleteOne();
        
        // ลบคอมเมนต์ที่เกี่ยวข้องด้วย (ถ้ามี)
        await Comment.deleteMany({ podcast: ep._id });

        res.json({ message: 'Episode permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// 3. Interaction System (Comments, Likes, Reports)
// ==========================================

// @route   POST /api/podcasts/:id/comment
const createComment = async (req, res) => {
    try {
        const { text } = req.body;
        const podcast = await Podcast.findById(req.params.id);
        if (!podcast) return res.status(404).json({ message: 'Podcast not found' });

        const comment = new Comment({
            podcast: req.params.id,
            author: req.user._id,
            text
        });

        await comment.save();
        const newComment = await Comment.findById(comment._id).populate('author', 'username');

        // Optional: Notify author
        // ...

        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   DELETE /api/podcasts/:id/comment/:comment_id
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.comment_id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await comment.deleteOne();
        res.json({ message: 'Comment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   PUT /api/podcasts/:id/like
const likePodcast = async (req, res) => {
    try {
        const podcast = await Podcast.findById(req.params.id);
        if (!podcast) return res.status(404).json({ message: 'Podcast not found' });

        const userId = req.user._id;
        if (podcast.likes.includes(userId)) {
            podcast.likes.pull(userId);
        } else {
            podcast.likes.push(userId);
        }

        await podcast.save();
        res.json(podcast);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   POST /api/podcasts/:id/report
const reportPodcast = async (req, res) => {
    const { reason, details } = req.body;
    try {
         const podcast = await Podcast.findById(req.params.id);
         if (!podcast) return res.status(404).json({ message: 'Podcast not found' });

         const report = new Report({
             podcast: req.params.id,
             reporter: req.user._id,
             reason,
             details
         });

         await report.save();
         res.status(201).json({ message: 'Report submitted successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   GET /api/podcasts/public/:id/comments
const getCommentsByPodcast = async (req, res) => {
    try {
        const comments = await Comment.find({ podcast: req.params.id })
            .populate('author', 'username')
            .sort({ createdAt: 1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    createEpisode,
    getAllPodcasts,
    getPodcastById,
    updatePodcast,
    
    deletePodcast,
    getDeletedPodcasts,
    restorePodcast,
    forceDeletePodcast,

    createComment,
    deleteComment,
    likePodcast,
    reportPodcast,
    getCommentsByPodcast
};
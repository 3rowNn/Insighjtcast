import Series from '../models/seriesModel.js';
import Podcast from '../models/podcastModel.js'; 
import SeriesComment from '../models/seriesCommentModel.js'; 
import mongoose from 'mongoose';

// @route   POST /api/series
const createSeries = async (req, res) => { 
  const { title, desc, category } = req.body;

  if (!title || !desc) {
    return res.status(400).json({ message: 'Please provide Title and Description' });
  }

  try {
    const series = new Series({
      title,
      desc,
      category: category || 'Other',
      author: req.user._id, // Mongoose จะจัดการ cast เป็น ObjectId ให้เองตาม Schema
      isDeleted: false, 
    });

    const createdSeries = await series.save();
    res.status(201).json(createdSeries);
  } catch (error) {
    res.status(400).json({ message: 'Error creating series', error: error.message });
  }
};

// @route   GET /api/series/public
const getPublicSeries = async (req, res) => { 
    try {
        // แสดงเฉพาะเรื่องที่ยังไม่ถูกลบ
        const series = await Series.find({ 
            $or: [ { isDeleted: false }, { isDeleted: { $exists: false } } ]
        }) 
            .populate('author', 'username') 
            .sort({ createdAt: -1 });
        
        res.json(series);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route   GET /api/series/public/:id
const getPublicSeriesByIdWithEpisodes = async (req, res) => { 
    try {
        const series = await Series.findById(req.params.id)
            .populate('author', 'username');

        if (!series) {
            return res.status(404).json({ message: 'Series not found' });
        }
        // ถ้าถูกลบ และคนเรียกไม่ใช่ Admin หรือเจ้าของ ให้บอกว่าไม่เจอ
        if (series.isDeleted && req.user?.role !== 'admin' && series.author._id.toString() !== req.user?._id.toString()) {
            return res.status(404).json({ message: 'Series not found' });
        }

        const episodes = await Podcast.find({ 
            series: req.params.id,
            $or: [ { isDeleted: false }, { isDeleted: { $exists: false } } ]
        }) 
            .populate('author', 'username') 
            .populate('likes', 'username') 
            .sort({ createdAt: 1 }); 

        res.json({
            seriesData: series,
            episodesData: episodes
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route   GET /api/series (Dashboard)
const getMySeries = async (req, res) => { 
    // 💥 แปลง ID เป็น ObjectId เพื่อความชัวร์
    const authorObjectId = new mongoose.Types.ObjectId(req.user._id);

    try {
        const seriesList = await Series.find({ 
            author: authorObjectId, 
            $or: [ { isDeleted: false }, { isDeleted: { $exists: false } } ]
        })
        .sort({ createdAt: -1 })
        .populate('likes', 'username');

        res.status(200).json(seriesList);
    } catch (error) {
        console.error("Error in getMySeries:", error.message);
        res.status(500).json({ message: error.message })
    }
}

// @route   GET /api/series/:id (For Edit)
const getSingleSeries = async (req, res) => {
    try {
        const series = await Series.findById(req.params.id).populate('author', 'username');

        if (!series) {
            return res.status(404).json({ message: 'Series not found' });
        }

        if (series.author._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized for this action' });
        }
        
        res.status(200).json(series); 
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @route   PUT /api/series/:id
const updateSeries = async (req, res) => { 
  const { title, desc, category } = req.body;
  const authorId = req.user._id;

  try {
    const series = await Series.findById(req.params.id);

    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    if (series.author.toString() !== authorId.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized for this action' });
    }

    series.title = title || series.title;
    series.desc = desc || series.desc;
    series.category = category || series.category;

    const updatedSeries = await series.save();
    res.json(updatedSeries);

  } catch (error) {
    res.status(400).json({ message: 'Error updating series', error: error.message });
  }
};

// ---------------------------------------------------------
// 🗑️ TRASH SYSTEM (Soft Delete / Restore / Force Delete)
// ---------------------------------------------------------

// @route   DELETE /api/series/:id (Soft Delete)
const deleteSeries = async (req, res) => { 
    const seriesId = req.params.id;
    
    // 💥 FIX: สร้าง Query ที่แม่นยำขึ้น
    const query = { _id: seriesId };
    
    if (req.user.role !== 'admin') {
        // แปลง ID ของ user เป็น ObjectId เพื่อให้ตรงกับใน DB แน่นอน
        query.author = new mongoose.Types.ObjectId(req.user._id); 
    }

    try {
        // ใช้ findOneAndUpdate เพื่อ Soft Delete
        const series = await Series.findOneAndUpdate(
            query,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!series) {
            // ถ้าหาไม่เจอ ลองเช็คดูว่า Series มีอยู่จริงไหม (เพื่อ Debug Message)
            const exists = await Series.findById(seriesId);
            if (exists) {
                return res.status(401).json({ message: 'Not authorized to delete this series' });
            }
            return res.status(404).json({ message: 'Series not found' });
        }

        res.json({ message: 'Moved series to trash' });
    } catch (error) {
        console.error("Delete Series Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route   GET /api/series/trash
const getDeletedSeries = async (req, res) => {
    try {
        const query = { isDeleted: true };
        if (req.user.role !== 'admin') {
            // แปลง ID เพื่อความชัวร์
            query.author = new mongoose.Types.ObjectId(req.user._id);
        }

        const deletedList = await Series.find(query)
            .populate('author', 'username')
            .sort({ deletedAt: -1 });

        res.json(deletedList);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route   PUT /api/series/:id/restore
const restoreSeries = async (req, res) => { 
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
        query.author = new mongoose.Types.ObjectId(req.user._id);
    }

    try {
        const series = await Series.findOneAndUpdate(
            query,
            { isDeleted: false, deletedAt: null },
            { new: true }
        );

        if (!series) {
            return res.status(404).json({ message: 'Series not found or not authorized' });
        }

        res.json({ message: 'Series restored successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route   DELETE /api/series/:id/force (Hard Delete)
const forceDeleteSeries = async (req, res) => { 
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
        query.author = new mongoose.Types.ObjectId(req.user._id);
    }

    try {
        const series = await Series.findOne(query);
        if (!series) return res.status(404).json({ message: 'Series not found or not authorized' });

        await series.deleteOne();
        
        // Cascade Delete
        await Podcast.deleteMany({ series: series._id });      
        await SeriesComment.deleteMany({ series: series._id }); 
        
        res.json({ message: 'Permanently deleted series and related data' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// ---------------------------------------------------------
// 💬 COMMENTS & LIKES
// ---------------------------------------------------------

// @route   GET /api/series/public/:id/comments
const getSeriesComments = async (req, res) => { 
    try {
        const comments = await SeriesComment.find({ series: req.params.id })
            .populate('author', 'username') 
            .sort({ createdAt: 1 }); 

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route   POST /api/series/:id/comment
const createSeriesComment = async (req, res) => { 
    try {
        const series = await Series.findById(req.params.id);
        if (!series) {
            return res.status(404).json({ message: 'Series not found' });
        }

        const authorId = req.user._id; 
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const comment = new SeriesComment({
            series: req.params.id,
            author: authorId,
            text,
        });

        await comment.save();
        const newComment = await SeriesComment.findById(comment._id).populate('author', 'username');

        res.status(201).json(newComment);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route   DELETE /api/series/:id/comment/:comment_id
const deleteSeriesComment = async (req, res) => { 
    try {
        const comment = await SeriesComment.findById(req.params.comment_id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (
            comment.author.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin'
        ) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await comment.deleteOne();
        res.json({ message: 'Comment removed' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route   PUT /api/series/:id/like
const likeSeries = async (req, res) => { 
    const seriesId = req.params.id;
    const userId = req.user._id;

    try {
        const series = await Series.findById(seriesId).select('likes');

        if (!series) {
            return res.status(404).json({ message: 'ไม่พบเรื่องแม่ที่ต้องการ' });
        }

        const isLiked = series.likes.includes(userId);

        if (isLiked) {
            await Series.findByIdAndUpdate(
                seriesId,
                { $pull: { likes: userId } },
                { new: true }
            );
        } else {
            await Series.findByIdAndUpdate(
                seriesId,
                { $addToSet: { likes: userId } }, 
                { new: true }
            );
        }

        // 💥 FIX: คืนค่า Series ใหม่ที่ Populate Likes แล้ว เพื่อให้ Frontend อัปเดตชื่อคนกดใจทันที
        const updatedSeries = await Series.findById(seriesId).populate('likes', 'username');

        res.json({
            message: isLiked ? 'Unliked' : 'Liked',
            action: isLiked ? 'unliked' : 'liked',
            likeCount: updatedSeries.likes.length,
            likes: updatedSeries.likes // ส่งรายชื่อคนกดใจกลับไปให้ Frontend
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดำเนินการ Like' });
    }
};

export {
    createSeries,
    getPublicSeries,
    getPublicSeriesByIdWithEpisodes,
    getMySeries,
    getSingleSeries,
    getSeriesComments,
    createSeriesComment,
    deleteSeriesComment,
    likeSeries,
    updateSeries,
    
    // Trash System
    deleteSeries,       
    getDeletedSeries,   
    restoreSeries,      
    forceDeleteSeries,  
};
import Notification from '../models/notificationModel.js';

// @route   GET /api/notifications
// @desc    Get all notifications for the logged-in user
// @access  Protected
export const getUserNotifications = async (req, res) => {
    try {
        // 💥 สำคัญ: ต้องใช้ชื่อ field ให้ตรงกับ Model (user หรือ recipient)
        // จาก error ก่อนหน้า คุณน่าจะใช้ชื่อ field ว่า 'user'
        const notifications = await Notification.find({ recipient: req.user._id }) 
            .sort({ createdAt: -1 }); // ใหม่ที่สุดขึ้นก่อน

        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching notifications' });
    }
};

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // 💥 FIX: เปลี่ยนจาก .user เป็น .recipient ให้ตรงกับ Model
        if (notification.recipient.toString() !== req.user._id.toString()) {
             return res.status(401).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error("Mark as Read Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
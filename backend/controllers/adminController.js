import mongoose from 'mongoose'
import User from '../models/user.js';
import Podcast from '../models/podcastModel.js';
import Report from '../models/reportModel.js';
import Notification from '../models/notificationModel.js'; 


// @route GET /api/admin/users
// @desc  Get all users (except admins)
    export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } })
            .select('username email role writerApplicationReason writerApplicationStatus')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @route PUT /api/admin/users/:id/role
// @desc  Update a user's role (Approve/Demote)
export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = req.body.role || user.role;
    
    // ถ้าเป็น Writer ให้เปลี่ยนสถานะใบสมัครด้วย
    if (req.body.role === 'writer') {
        user.writerApplicationStatus = 'Approved';
    } else if (req.body.role === 'user') {
        user.writerApplicationStatus = 'None'; 
        user.writerApplicationReason = ''; // หรือสถานะอื่นที่เหมาะสม
    }

    const updatedUser = await user.save();

    // 💥 FIX: สร้าง Notification แจ้งเตือนผู้ใช้ (ใช้ 'recipient')
    await Notification.create({
      recipient: user._id, // <--- ต้องแก้ตรงนี้ให้เป็น recipient
      sender: req.user._id,
      type: 'private_message', // หรือ 'announcement' ตาม enum ที่ตั้งไว้
      message: `Your role has been updated to ${updatedUser.role}.`,
      isRead: false,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating role' });
  }
};

// @route DELETE /api/admin/users/:id
// @desc  Delete a user (and their podcasts)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 3. 🛠️ FIX: ห้าม Admin ลบ Admin คนอื่น
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete an administrator' });
        }

        // 4. 🛠️ FIX: (สำคัญมาก) ลบ Podcast ทั้งหมดที่ User/Writer คนนี้สร้างก่อน
        await Podcast.deleteMany({ author: user._id });

        // (Optional: ลบ Reports และ Comments ของ User นี้ด้วย)
        await Report.deleteMany({ reporter: user._id });
        // (Note: เราจะเก็บ Comment ของเขาไว้เพื่อไม่ให้บทสนทนาขาดตอน)

        // 5. 🛠️ FIX: ลบ User
        await user.deleteOne();

        res.json({ message: 'User and associated content removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route GET /api/admin/reports
// @desc  Get all pending reports
export const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({ status: 'Pending' }) // ดึงเฉพาะที่ "รอดำเนินการ"
            .populate('podcast', 'title') // ดึง "title" ของเรื่องที่ถูกรายงาน
            .populate('reporter', 'username email') // ดึง "username" ของคนที่รายงาน
            .sort({ createdAt: 1 }); // เรียงจากเก่าไปใหม่

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route PUT /api/admin/reports/:id
// @desc  Resolve a report
export const resolveReport = async (req, res) => {
    try {
        // 1. ค้นหา Report
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // 2. ลบ Report ออก (ถือว่าจัดการเสร็จแล้ว)
        // หรือจะแค่เปลี่ยน status ก็ได้ แต่ส่วนใหญ่มักจะลบออกจาก Inbox
        await Report.findByIdAndDelete(req.params.id);

        // 3. 💥 FIX: ส่ง Notification กลับไปหาคนแจ้ง (Reporter)
        // ต้องระบุ sender และ type ให้ครบ
        if (report.reporter) {
            await Notification.create({
                recipient: report.reporter, // ส่งหาคนแจ้ง
                sender: req.user._id,       // ผู้ส่งคือ Admin
                type: 'private_message',    // ระบุประเภท
                message: `ขอบคุณสำหรับการรายงานปัญหาเกี่ยวกับ "${report.reason}" ทางเราได้ดำเนินการตรวจสอบและแก้ไขเรียบร้อยแล้ว`,
                isRead: false
            });
        }

        res.json({ message: 'Report resolved and removed' });

    } catch (error) {
        console.error("Resolve Report Error:", error);
        res.status(500).json({ message: 'Server Error resolving report' });
    }
};

// @route PUT /api/admin/users/:id/reject
// @desc  Reject a writer application
export const rejectApplication = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot reject an admin' });
        }

        // ตั้งค่าสถานะ
        user.writerApplicationStatus = 'Rejected';
        user.writerApplicationReason = ''; 
        await user.save();

        // 💥 FIX: สร้าง Notification ให้ครบทุกฟิลด์ (sender, type)
        await Notification.create({
            recipient: user._id,  
            sender: req.user._id,      // <--- 1. ต้องระบุผู้ส่ง (Admin ที่กดปุ่ม)
            type: 'private_message',   // <--- 2. ต้องระบุประเภท (ตาม enum ใน Model)
            message: "เรารู้สึกเสียใจที่ต้องแจ้งให้คุณทราบว่าการสมัครเป็นนักเขียนของคุณยังไม่ได้รับการอนุมัติในขณะนี้",
            isRead: false
        });

        res.json({ message: 'Application rejected' });

    } catch (error) {
        console.error("Reject Application Error:", error); // เพิ่ม log เพื่อดู error ชัดๆ
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
export const sendMassNotification = async (req, res) => {
    const { message } = req.body; // ข้อความจาก Admin

    if (!message) {
        return res.status(400).json({ message: 'Notification message is required.' });
    }

    try {
        // 1. ดึง ID ของผู้ใช้ทุกคนที่เป็น 'user' หรือ 'writer'
        const activeUsers = await User.find({ role: { $in: ['user', 'writer'] } }).select('_id');
        
        if (activeUsers.length === 0) {
            return res.status(404).json({ message: 'No active users to notify.' });
        }
        
        // 2. เตรียมข้อมูล Notification
        // 🛠️ FIX: ใช้ key ชื่อ 'user' เพื่อให้ตรงกับ Model ที่แจ้ง Error ก่อนหน้า
        const notifications = activeUsers.map(u => ({
            recipient: u._id,  // <--- เปลี่ยนจาก recipient เป็น user
            sender: req.user._id,
            type: 'announcement',
            message: message,
            isRead: false
        }));

        // 3. บันทึกข้อมูลลงฐานข้อมูล (เรียกครั้งเดียว)
        // ใช้ ordered: false เพื่อให้บันทึกต่อได้แม้บางรายการจะมีปัญหา (เช่น ID ซ้ำ)
        await Notification.insertMany(notifications, { ordered: false });
        
        // 4. ส่ง Response กลับเมื่อสำเร็จ
        res.status(201).json({ 
            message: `Successfully sent notification to ${notifications.length} users.`,
            count: notifications.length
        });
        
    } catch (error) {
        // Log Error อย่างละเอียดเพื่อการตรวจสอบ
        console.error("Mass Notification Error:", error);
        if (error.name === 'ValidationError') {
            console.error("Validation Details:", error.errors);
        }
        
        res.status(500).json({ message: 'Server Error during notification dispatch.' });
    }
};

// @route   POST /api/admin/notify/:recipientId
// @desc   Send a targeted notification to a specific user/writer
// @access Protected (Admin)
export const sendTargetedNotification = async (req, res) => {
    const { recipientId } = req.params; 
    const { message } = req.body;      
    const senderId = req.user._id;     

    if (!message) {
        return res.status(400).json({ message: 'Notification message is required.' });
    }
    
    // 💥 FIX: 1. ตรวจสอบ Format ของ ID ด้วย Mongoose ก่อนค้นหา
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ message: 'Invalid recipient ID format. Please select a valid user.' });
    }

    try {
        // 2. ค้นหาผู้รับ
        const recipient = await User.findById(recipientId);
        
        // 💥 FIX: 2. หากค้นหาแล้วไม่พบ (recipient = null)
        if (!recipient) {
            // ไม่พบผู้รับด้วย ID ที่ส่งมา
            return res.status(404).json({ message: 'Recipient user not found.' }); 
        }

        // 3. สร้าง Notification
        await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type: 'private_message',
            message: message,
            isRead: false
        });

        res.status(201).json({ 
            message: `Successfully sent private notification to ${recipient.username}.`,
            recipient: recipient.username
        });
        
    } catch (error) {
        // ... (Error handling เดิม)
        console.error("Targeted Notification Error:", error);
        res.status(500).json({ message: 'Server Error during notification dispatch.' });
    }
};
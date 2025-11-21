import User from '../models/user.js';
import jwt from 'jsonwebtoken';

// (ฟังก์ชัน generateToken ไม่เปลี่ยนแปลง)
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
            username: user.username
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '30d',
        }
    );
};

// @route POST /api/auth/register
export const registerUser = async (req, res) => {
    // 1. 🛠️ FIX: รับ 'writerReason' (เหตุผล) จาก body
    const { email, password, writerReason } = req.body;
    const username = email.split('@')[0];

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // 2. 🛠️ FIX: บันทึกข้อมูลการสมัคร
    const user = await User.create({
        username,
        email,
        password,
        role: 'user', // 3. 🛠️ FIX: สมัครเป็น 'user' เสมอ
        // 4. 🛠️ FIX: ตั้งค่าสถานะคำขอ (Application)
        writerApplicationReason: writerReason || '',
        writerApplicationStatus: writerReason ? 'Pending' : 'None'
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @route POST /api/auth/login
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};
import jwt from 'jsonwebtoken'
import User from '../models/user.js'

// 'protect' (เหมือนเดิม) - ตรวจสอบแค่ว่าล็อกอินหรือยัง
const protect = async (req, res, next) => {
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next()
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' })
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' })
  }
}

// 💥 NEW: 'isAdmin' (ยามคนใหม่) - ตรวจสอบว่าเป็น Admin หรือไม่
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next() // ถ้าเป็น Admin -> ผ่าน
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' })
  }
}

export { protect, isAdmin } // 🛠️ FIX: export 'isAdmin' ด้วย
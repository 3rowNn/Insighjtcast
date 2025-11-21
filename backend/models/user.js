import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
    // (ฟิลด์ username, email, password, role ... เหมือนเดิม)
    username: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'writer'],
        default: 'user',
    },

    // --- 1. 💥 NEW: เพิ่มฟิลด์สำหรับ "การสมัคร Writer" ---
    writerApplicationReason: {
        type: String,
        default: '',
    },
    writerApplicationStatus: {
        type: String,
        enum: ['None', 'Pending', 'Approved', 'Rejected'],
        default: 'None',
    }
    // --- สิ้นสุดการแก้ไข ---

}, { timestamps: true });

// ... (โค้ด Middleware และ Methods ไม่เปลี่ยนแปลง) ...
// Middleware ก่อนบันทึก: เข้ารหัสรหัสผ่านก่อนบันทึก
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method สำหรับเปรียบเทียบรหัสผ่าน (ใช้ใน Login)
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', UserSchema);

export default mongoose.models.User || mongoose.model('User', userSchema);
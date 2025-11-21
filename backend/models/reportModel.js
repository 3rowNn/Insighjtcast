import mongoose from 'mongoose'

const reportSchema = mongoose.Schema(
    {
        // 1. เรื่องที่ถูกรายงาน
        podcast: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Podcast',
        },
        // 2. ผู้ใช้ที่รายงาน
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        // 3. เหตุผล
        reason: {
            type: String,
            required: true,
            enum: ['Inappropriate', 'Spam', 'Broken', 'Other'], // จำกัดเหตุผล
        },
        // 4. รายละเอียด (ถ้ามี)
        details: {
            type: String,
        },
        // 5. สถานะ
        status: {
            type: String,
            required: true,
            enum: ['Pending', 'Resolved'],
            default: 'Pending',
        },
    },
    {
        timestamps: true,
    }
)

const Report = mongoose.model('Report', reportSchema)
export default Report
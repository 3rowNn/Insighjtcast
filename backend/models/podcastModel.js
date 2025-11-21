import mongoose from 'mongoose'

// นี่คือ "พิมพ์เขียว" ที่ถูกดัดแปลงให้เป็น "ตอน" (Episode)
const PodcastSchema = new mongoose.Schema({
  title: { type: String, required: true }, // (นี่คือ "ชื่อตอน" เช่น "ตอนที่ 1: การเริ่มต้น")
  content: { type: String },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // (ยังคงเก็บ "ผู้เขียน" ไว้เพื่อความปลอดภัย)
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],


  series: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Series' 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
    deletedAt: { 
      type: Date, 
      default: null 
  },


},
  {
    timestamps: true,
  })

export default mongoose.models.Podcast || mongoose.model('Podcast', PodcastSchema)
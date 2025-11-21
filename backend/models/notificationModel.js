import mongoose from 'mongoose'

const notificationSchema = mongoose.Schema(
  {
    // 🛠️ FIX: เปลี่ยนจาก 'user' เป็น 'recipient'
    recipient: {  
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: ['announcement', 'private_message', 'new_comment'], 
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
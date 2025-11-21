import mongoose from 'mongoose'


const commentSchema = mongoose.Schema(
  {
    podcast: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Podcast',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Comment || mongoose.model('Comment', commentSchema)
import mongoose from 'mongoose'

// พิมพ์เขียวนี้สำหรับ "คอมเมนต์ของเรื่องแม่" (Series)
const seriesCommentSchema = mongoose.Schema(
  {
    series: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Series',
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

export default mongoose.models.SeriesComment || mongoose.model('SeriesComment', seriesCommentSchema)
import mongoose from 'mongoose'

const seriesSchema = mongoose.Schema(
  {
    // (title, desc, category, author ... เหมือนเดิม)
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Tech', 'Life', 'News', 'Story', 'Other'],
      default: 'Other',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', 
    },

    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
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
  }
)

export default mongoose.models.Series || mongoose.model('Series', seriesSchema)
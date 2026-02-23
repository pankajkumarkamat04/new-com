import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  mimeType: {
    type: String,
    required: true,
    trim: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  path: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
  collection: 'media',
});

export default mongoose.model('Media', mediaSchema);

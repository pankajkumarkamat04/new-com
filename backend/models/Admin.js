import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    minLength: 6,
    select: false,
  },
  role: {
    type: String,
    default: 'admin',
    enum: ['admin', 'superadmin'],
  },
}, {
  timestamps: true,
});

adminSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// email: unique: true in schema already creates index
adminSchema.index({ phone: 1 }, { unique: true, sparse: true });

export default mongoose.model('Admin', adminSchema);

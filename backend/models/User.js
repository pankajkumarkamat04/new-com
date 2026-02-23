import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
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
    default: 'user',
    enum: ['user'],
  },
}, {
  timestamps: true,
});

// At least one of email or phone required
userSchema.pre('validate', function () {
  if (!this.email && !this.phone) {
    throw new Error('Either email or phone is required');
  }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Unique indexes - sparse allows multiple nulls
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1, phone: 1 });

export default mongoose.model('User', userSchema);

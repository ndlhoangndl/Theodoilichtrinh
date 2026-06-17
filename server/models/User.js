import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  email: { type: String, required: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  gender: { type: String, required: true },
  dob: { type: String, required: true },
  country: { type: String, default: 'Vietnam' },
  bio: { type: String, default: '' },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  avatar: { type: String, default: '' },
  theme: { type: String, default: 'default' },
  createdAt: { type: Date, default: Date.now },
  resetCode: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null }
});

export default mongoose.model('User', userSchema);

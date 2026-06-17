import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habits: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      emoji: { type: String, required: true }
    }
  ]
});

// Unique index on userId
habitSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model('Habit', habitSchema);

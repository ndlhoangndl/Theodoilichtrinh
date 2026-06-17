import mongoose from 'mongoose';

const monthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  checks: { type: Map, of: [Boolean], default: {} },
  mood: { type: [Number], default: [] },
  motivation: { type: [Number], default: [] },
  diary: { type: [String], default: [] },
  goals: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
      completed: { type: Boolean, default: false },
      pinned: { type: Boolean, default: false }
    }
  ],
  weeklyGoals: [
    {
      id: { type: String, required: true },
      weekIndex: { type: Number, required: true },
      text: { type: String, required: true },
      completed: { type: Boolean, default: false },
      pinned: { type: Boolean, default: false }
    }
  ],
  wateredDays: { type: [Number], default: [] },
  monthlyReview: {
    q1: { type: String, default: '' },
    q2: { type: String, default: '' },
    q3: { type: String, default: '' },
    completedAt: { type: String, default: '' }
  },
  notes: { type: Map, of: [String], default: {} },
  selectedSeed: { type: String, default: 'oak' }
});

// Composite unique index on userId + year + month
monthRecordSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model('MonthRecord', monthRecordSchema);

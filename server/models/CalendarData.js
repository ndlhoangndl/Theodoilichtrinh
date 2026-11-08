import mongoose from 'mongoose';

const calendarDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  events: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String, default: '' },
      date: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      category: { type: String, default: 'calendar' },
      recurrence: { type: String, default: 'none' },
      excludedDates: { type: [String], default: [] }
    }
  ],
  tasks: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('CalendarData', calendarDataSchema);

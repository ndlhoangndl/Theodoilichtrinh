import Habit from '../models/Habit.js';
import MonthRecord from '../models/MonthRecord.js';
import CalendarData from '../models/CalendarData.js';

// GET /api/tracker/habits
export const getHabits = async (req, res) => {
  try {
    const userId = req.user.id;
    const habitRecord = await Habit.findOne({ userId });

    if (!habitRecord) {
      return res.json({ habits: [] });
    }

    res.json({ habits: habitRecord.habits });
  } catch (error) {
    console.error('getHabits error:', error);
    res.status(500).json({ message: 'Server error while fetching habits' });
  }
};

// POST /api/tracker/habits
export const saveHabits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { habits } = req.body;

    if (!habits || !Array.isArray(habits)) {
      return res.status(400).json({ message: 'Invalid habits data' });
    }

    const updatedRecord = await Habit.findOneAndUpdate(
      { userId },
      { habits },
      { new: true, upsert: true }
    );

    res.json({ message: 'Habits saved successfully', habits: updatedRecord.habits });
  } catch (error) {
    console.error('saveHabits error:', error);
    res.status(500).json({ message: 'Server error while saving habits' });
  }
};

// GET /api/tracker/record/:year/:month
export const getMonthRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month)) {
      return res.status(400).json({ message: 'Invalid year or month parameters' });
    }

    const record = await MonthRecord.findOne({ userId, year, month });

    if (!record) {
      return res.json({ record: null });
    }

    res.json({ record });
  } catch (error) {
    console.error('getMonthRecord error:', error);
    res.status(500).json({ message: 'Server error while fetching month record' });
  }
};

// POST /api/tracker/record/:year/:month
export const saveMonthRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const { record } = req.body;

    if (isNaN(year) || isNaN(month) || !record) {
      return res.status(400).json({ message: 'Invalid payload data' });
    }

    const updateData = {
      checks: record.checks || {},
      mood: record.mood || [],
      motivation: record.motivation || [],
      diary: record.diary || [],
      goals: record.goals || [],
      weeklyGoals: record.weeklyGoals || [],
      wateredDays: record.wateredDays || [],
      monthlyReview: record.monthlyReview || {},
      notes: record.notes || {},
      selectedSeed: record.selectedSeed || 'oak',
      coachChatHistory: record.coachChatHistory || []
    };

    const updatedRecord = await MonthRecord.findOneAndUpdate(
      { userId, year, month },
      updateData,
      { new: true, upsert: true }
    );

    res.json({ message: 'Month record saved successfully', record: updatedRecord });
  } catch (error) {
    console.error('saveMonthRecord error:', error);
    res.status(500).json({ message: 'Server error while saving month record' });
  }
};

// GET /api/tracker/calendar
export const getCalendarData = async (req, res) => {
  try {
    const userId = req.user.id;
    const calData = await CalendarData.findOne({ userId });

    if (!calData) {
      return res.json({ events: null, tasks: null });
    }

    res.json({
      events: calData.events || [],
      tasks: calData.tasks || []
    });
  } catch (error) {
    console.error('getCalendarData error:', error);
    res.status(500).json({ message: 'Server error while fetching calendar data' });
  }
};

// POST /api/tracker/calendar/events
export const saveCalendarEventsApi = async (req, res) => {
  try {
    const userId = req.user.id;
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ message: 'Invalid events data' });
    }

    const updated = await CalendarData.findOneAndUpdate(
      { userId },
      { $set: { events, updatedAt: new Date() } },
      { new: true, upsert: true }
    );

    res.json({ message: 'Calendar events saved to MongoDB', events: updated.events });
  } catch (error) {
    console.error('saveCalendarEventsApi error:', error);
    res.status(500).json({ message: 'Server error while saving calendar events' });
  }
};

// POST /api/tracker/calendar/tasks
export const saveCalendarTasksApi = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Invalid tasks data' });
    }

    const updated = await CalendarData.findOneAndUpdate(
      { userId },
      { $set: { tasks, updatedAt: new Date() } },
      { new: true, upsert: true }
    );

    res.json({ message: 'Calendar tasks saved to MongoDB', tasks: updated.tasks });
  } catch (error) {
    console.error('saveCalendarTasksApi error:', error);
    res.status(500).json({ message: 'Server error while saving calendar tasks' });
  }
};

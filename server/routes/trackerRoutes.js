import express from 'express';
import {
  getHabits,
  saveHabits,
  getMonthRecord,
  saveMonthRecord,
  getCalendarData,
  saveCalendarEventsApi,
  saveCalendarTasksApi
} from '../controllers/trackerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/habits', authenticateToken, getHabits);
router.post('/habits', authenticateToken, saveHabits);
router.get('/record/:year/:month', authenticateToken, getMonthRecord);
router.post('/record/:year/:month', authenticateToken, saveMonthRecord);
router.get('/calendar', authenticateToken, getCalendarData);
router.post('/calendar/events', authenticateToken, saveCalendarEventsApi);
router.post('/calendar/tasks', authenticateToken, saveCalendarTasksApi);

export default router;

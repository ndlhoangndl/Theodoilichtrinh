import express from 'express';
import { 
  getHistory, 
  sendMessage, 
  getAdminThreads, 
  markAsRead 
} from '../controllers/messageController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/history/:partnerId', authenticateToken, getHistory);
router.post('/', authenticateToken, sendMessage);
router.get('/admin/threads', authenticateToken, requireAdmin, getAdminThreads);
router.post('/read/:partnerId', authenticateToken, markAsRead);

export default router;

import express from 'express';
import { 
  getUsers, 
  deleteUser, 
  updateUserRole 
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/users', authenticateToken, requireAdmin, getUsers);
router.delete('/users/:userId', authenticateToken, requireAdmin, deleteUser);
router.post('/users/:userId/role', authenticateToken, requireAdmin, updateUserRole);

export default router;

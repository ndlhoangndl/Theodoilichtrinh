import express from 'express';
import {
  getOwnerProfile,
  login,
  updateProfile,
  changePassword
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/owner', getOwnerProfile);
router.post('/login', login);
router.post('/update-profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;

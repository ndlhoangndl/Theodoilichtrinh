import express from 'express';
import { 
  register, 
  login, 
  updateProfile, 
  changePassword, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/update-profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

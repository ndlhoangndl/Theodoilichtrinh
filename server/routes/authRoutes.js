import express from 'express';
import {
  getOwnerProfile,
  updateProfile
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/owner', getOwnerProfile);
router.post('/update-profile', authenticateToken, updateProfile);

export default router;

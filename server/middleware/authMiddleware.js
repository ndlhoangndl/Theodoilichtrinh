import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OWNER_USERNAME, ensurePersonalOwner } from '../config/db.js';

let cachedOwner = null;

async function getOwnerUser() {
  if (cachedOwner) return cachedOwner;
  let owner = await User.findOne({ username: OWNER_USERNAME });
  if (!owner) {
    owner = await ensurePersonalOwner();
  }
  if (owner) {
    cachedOwner = { id: owner._id.toString(), username: owner.username, role: owner.role };
  }
  return cachedOwner;
}

// Personal Single-User Authentication Middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      // Fallback to personal owner account in single-user mode
    }
  }

  try {
    const owner = await getOwnerUser();
    if (!owner) {
      return res.status(500).json({ message: 'Owner account not initialized' });
    }
    req.user = owner;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Server authentication error' });
  }
};

export const requireAdmin = (req, res, next) => {
  next();
};

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OWNER_USERNAME, ensurePersonalOwner } from '../config/db.js';

function formatUserResponse(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    gender: user.gender,
    dob: user.dob,
    country: user.country || 'Vietnam',
    bio: user.bio || '',
    avatar: user.avatar || '',
    theme: user.theme || 'cappuccino',
    lang: user.lang || 'vi',
    selectedYear: user.selectedYear || null,
    selectedMonth: user.selectedMonth !== undefined ? user.selectedMonth : null,
    geminiKey: user.geminiKey || '',
    pomoSettings: user.pomoSettings || { work: 25, short: 5, long: 15 },
    role: user.role || 'ADMIN'
  };
}

// GET /api/auth/owner
export const getOwnerProfile = async (req, res) => {
  try {
    let user = await User.findOne({ username: OWNER_USERNAME });
    if (!user) {
      user = await ensurePersonalOwner();
    }
    if (!user) {
      return res.status(404).json({ message: 'Owner profile not found' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'lichtrinh_secret',
      { expiresIn: '365d' }
    );

    res.json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Get owner profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'lichtrinh_secret',
      { expiresIn: '365d' }
    );

    res.json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/update-profile
export const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      email,
      gender,
      dob,
      country,
      bio,
      avatar,
      theme,
      lang,
      selectedYear,
      selectedMonth,
      geminiKey,
      pomoSettings
    } = req.body;

    let user = await User.findById(req.user.id);
    if (!user) {
      user = await User.findOne({ username: OWNER_USERNAME });
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName !== undefined) user.fullName = fullName || user.fullName;
    if (email !== undefined) user.email = email || user.email;
    if (gender !== undefined) user.gender = gender || user.gender;
    if (dob !== undefined) user.dob = dob || user.dob;
    if (country !== undefined) user.country = country;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (theme !== undefined) user.theme = theme;
    if (lang !== undefined) user.lang = lang;
    if (selectedYear !== undefined) user.selectedYear = selectedYear;
    if (selectedMonth !== undefined) user.selectedMonth = selectedMonth;
    if (geminiKey !== undefined) user.geminiKey = geminiKey;
    if (pomoSettings !== undefined) user.pomoSettings = pomoSettings;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const passwordRegex = /^[\x21-\x7E]{6,30}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must be 6-30 characters, containing only standard keyboard characters, and no icons.'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

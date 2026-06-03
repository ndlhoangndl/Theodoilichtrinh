import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

import User from './models/User.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Setup Nodemailer Transporter
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Nodemailer SMTP transporter initialized.');
} else {
  console.log('Nodemailer SMTP not configured (missing EMAIL_USER or EMAIL_PASS in .env). Email reset codes will print to server logs.');
}

let connectionUri = process.env.MONGODB_URI;

if (connectionUri) {
  try {
    const protocolMatch = connectionUri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
    if (protocolMatch) {
      const protocol = protocolMatch[1];
      const rest = protocolMatch[2];
      const lastAtIndex = rest.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const credentials = rest.substring(0, lastAtIndex);
        const hostInfo = rest.substring(lastAtIndex + 1);
        const colonIndex = credentials.indexOf(':');
        if (colonIndex !== -1) {
          const username = credentials.substring(0, colonIndex);
          const password = credentials.substring(colonIndex + 1);
          const encodedPassword = password.includes('%') ? password : encodeURIComponent(password);
          connectionUri = `${protocol}${username}:${encodedPassword}@${lastAtIndex !== -1 ? hostInfo : ''}`;
        }
      }
    }
  } catch (err) {
    console.error('URI sanitization error:', err);
  }
}

// Connect to MongoDB Atlas (forcing IPv4 to bypass Node.js DNS resolution bugs on Windows)
mongoose.connect(connectionUri, { family: 4 })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
    seedAdmin(); // Seed default admin account on successful connection
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Auto-seed default admin account
const seedAdmin = async () => {
  try {
    const adminUsername = 'ndlhoangndl';
    const adminPassword = 'Le@02052006';
    
    const existingAdmin = await User.findOne({ username: adminUsername });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      
      const defaultAdmin = new User({
        username: adminUsername,
        passwordHash,
        email: 'ndlhoangndl@gmail.com',
        fullName: 'Nguyễn Đăng Lê Hoàng',
        gender: 'male',
        dob: '2006-05-02',
        role: 'ADMIN'
      });
      
      await defaultAdmin.save();
      console.log('Default Admin account seeded successfully (ndlhoangndl / Le@02052006)!');
    }
  } catch (error) {
    console.error('Error seeding default admin account:', error);
  }
};

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin-only Access Middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Admin role required' });
  }
};

// --- AUTHENTICATION ROUTES ---

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, fullName, gender, dob } = req.body;
    
    if (!username || !password || !email || !fullName || !gender || !dob) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Auto-assign ADMIN role to ndlhoangndl
    const role = trimmedUsername === 'ndlhoangndl' ? 'ADMIN' : 'USER';

    const newUser = new User({
      username: trimmedUsername,
      passwordHash,
      email,
      fullName,
      gender,
      dob,
      role
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
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
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        gender: user.gender,
        dob: user.dob,
        country: user.country,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/update-profile
app.post('/api/auth/update-profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, gender, dob, country, bio } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.gender = gender || user.gender;
    user.dob = dob || user.dob;
    user.country = country !== undefined ? country : user.country;
    user.bio = bio !== undefined ? bio : user.bio;

    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        gender: user.gender,
        dob: user.dob,
        country: user.country,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
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
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // For security, don't expose if email is registered or not, just return generic success
      return res.json({ message: 'Mã xác nhận đặt lại mật khẩu đã được gửi (nếu email tồn tại trong hệ thống).' });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Try sending real email
    let sentRealEmail = false;
    if (transporter) {
      try {
        const mailOptions = {
          from: `"Lịch Trình Tracker" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'Mã xác nhận đặt lại mật khẩu - Lịch Trình Tracker',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #6d4c41; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
              <p>Chào bạn <strong>${user.fullName}</strong>,</p>
              <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu từ tài khoản của bạn (<strong>@${user.username}</strong>).</p>
              <p>Mã xác thực của bạn là:</p>
              <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; background: #efebe9; color: #5d4037; padding: 10px 20px; border-radius: 6px; letter-spacing: 4px;">
                  ${resetCode}
                </span>
              </div>
              <p style="color: #888; font-size: 12px;">Mã xác thực này sẽ hết hạn trong vòng 15 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
              <hr style="border: 0; border-top: 1px solid #eee;" />
              <p style="font-size: 11px; color: #aaa; text-align: center;">Lịch Trình Tracker - 📅 Trình theo dõi kỷ luật & thói quen</p>
            </div>
          `
        };
        await transporter.sendMail(mailOptions);
        sentRealEmail = true;
        console.log(`Password reset email sent successfully to ${user.email}`);
      } catch (mailError) {
        console.error('Error sending reset email via Nodemailer:', mailError);
      }
    }

    // Console mock print (crucial for local testing)
    if (!sentRealEmail) {
      console.log('\n=============================================================');
      console.log(`[MOCK EMAIL LOG] Password reset code for user @${user.username} (${user.email}) is: ${resetCode}`);
      console.log('=============================================================\n');
    }

    res.json({ message: 'Mã xác nhận đặt lại mật khẩu đã được gửi đến email của bạn!' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields (email, code, new password) are required' });
    }

    const user = await User.findOne({ 
      email: email.trim().toLowerCase(),
      resetCode: code.trim(),
      resetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
    }

    // Encrypt and save new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Clear code and expire time
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể dùng mật khẩu mới để đăng nhập.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- MESSAGING SYSTEM ROUTES ---

// GET /api/messages/history/:partnerId
app.get('/api/messages/history/:partnerId', authenticateToken, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const currentUserId = req.user.id;

    let partnerObjectId = partnerId;
    if (partnerId === 'admin') {
      const admin = await User.findOne({ username: 'ndlhoangndl' });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      partnerObjectId = admin._id;
    }

    // Fetch history
    const history = await Message.find({
      $or: [
        { sender: currentUserId, receiver: partnerObjectId },
        { sender: partnerObjectId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { sender: partnerObjectId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json(history);
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    let { receiverId } = req.body;
    const senderId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    // Default receiver to admin (ndlhoangndl) if user is a standard user and receiverId is not provided
    if (!receiverId) {
      if (req.user.role === 'ADMIN') {
        return res.status(400).json({ message: 'Receiver ID is required for admins' });
      }
      // Look up master admin ndlhoangndl
      const admin = await User.findOne({ username: 'ndlhoangndl' });
      if (!admin) {
        return res.status(404).json({ message: 'System Admin account not found' });
      }
      receiverId = admin._id;
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim()
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/admin/threads
app.get('/api/messages/admin/threads', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
      .populate('sender receiver', 'username fullName email')
      .sort({ createdAt: 1 });

    const threadsMap = new Map();

    messages.forEach(msg => {
      if (!msg.sender || !msg.receiver) return;

      const senderId = msg.sender._id.toString();
      const receiverId = msg.receiver._id.toString();
      
      const partner = senderId === req.user.id ? msg.receiver : msg.sender;
      const partnerId = partner._id.toString();

      const isUnread = (receiverId === req.user.id && !msg.isRead);

      const existing = threadsMap.get(partnerId);
      if (!existing || msg.createdAt > existing.lastMessageTime) {
        threadsMap.set(partnerId, {
          partnerId,
          username: partner.username,
          fullName: partner.fullName,
          email: partner.email,
          lastMessageContent: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: (existing ? existing.unreadCount : 0) + (isUnread ? 1 : 0)
        });
      } else {
        if (isUnread) {
          existing.unreadCount++;
        }
      }
    });

    const threads = Array.from(threadsMap.values()).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    res.json(threads);
  } catch (error) {
    console.error('Fetch threads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/read/:partnerId
app.post('/api/messages/read/:partnerId', authenticateToken, async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    let partnerObjectId = partnerId;
    if (partnerId === 'admin') {
      const admin = await User.findOne({ username: 'ndlhoangndl' });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      partnerObjectId = admin._id;
    }

    await Message.updateMany(
      { sender: partnerObjectId, receiver: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- ADMIN-ONLY CONTROL PANEL ROUTE ---

// GET /api/admin/users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allUsers = await User.find({}).select('-passwordHash');
    res.json(allUsers);
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:userId
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account!' });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToDelete.username === 'ndlhoangndl') {
      return res.status(400).json({ message: 'Cannot delete the master admin account!' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/users/:userId/role
app.post('/api/admin/users/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own role!' });
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToUpdate.username === 'ndlhoangndl') {
      return res.status(400).json({ message: 'Cannot change the role of the master admin account!' });
    }

    userToUpdate.role = role;
    await userToUpdate.save();

    res.json({ message: `Role updated to ${role}` });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

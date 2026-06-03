import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import transporter from '../config/nodemailer.js';

// POST /api/auth/register
export const register = async (req, res) => {
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
};

// POST /api/auth/update-profile
export const updateProfile = async (req, res) => {
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
};

// POST /api/auth/change-password
export const changePassword = async (req, res) => {
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
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
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
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
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
};

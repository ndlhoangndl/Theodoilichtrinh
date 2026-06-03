import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const connectDB = async () => {
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

  try {
    await mongoose.connect(connectionUri, { family: 4 });
    console.log('Successfully connected to MongoDB Atlas!');
    await seedAdmin();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

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

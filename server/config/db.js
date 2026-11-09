import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Habit from '../models/Habit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

export const OWNER_USERNAME = 'ndlhoangndl';

const DEFAULT_HABITS = [
  { id: 'h1', name: 'Dậy lúc 06:00', emoji: '⏰' },
  { id: 'h2', name: 'Thiền định', emoji: '🧘' },
  { id: 'h3', name: 'Tập Gym/Thể thao', emoji: '💪' },
  { id: 'h4', name: 'Tắm nước lạnh', emoji: '🚿' },
  { id: 'h5', name: 'Làm việc tập trung', emoji: '💻' },
  { id: 'h6', name: 'Đọc sách 10 trang', emoji: '📖' },
  { id: 'h7', name: 'Học kỹ năng mới', emoji: '📝' },
  { id: 'h8', name: 'Không ăn đường', emoji: '🍫' },
  { id: 'h9', name: 'Không bia rượu', emoji: '🍺' },
  { id: 'h10', name: 'Lập kế hoạch ngày', emoji: '🗒️' },
  { id: 'h11', name: 'Ngủ trước 23:00', emoji: '💤' }
];

let connectionPromise = null;
let ownerInitialized = false;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1 && ownerInitialized) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
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
            connectionUri = `${protocol}${username}:${encodedPassword}@${hostInfo}`;
          }
        }
      }
    } catch (err) {
      console.error('URI sanitization error:', err);
    }
  }

  connectionPromise = (async () => {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(connectionUri, { family: 4 });
        console.log('Successfully connected to MongoDB Atlas!');
      }
      if (!ownerInitialized) {
        await ensurePersonalOwner();
        ownerInitialized = true;
      }
      return mongoose.connection;
    } catch (err) {
      connectionPromise = null;
      console.error('MongoDB connection error:', err);
      throw err;
    }
  })();

  return connectionPromise;
};

export const ensurePersonalOwner = async () => {
  try {
    let owner = await User.findOne({ username: OWNER_USERNAME });
    if (!owner) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Le@02052006', salt);

      owner = new User({
        username: OWNER_USERNAME,
        passwordHash,
        email: 'ndlhoangndl@gmail.com',
        fullName: 'Nguyễn Đăng Lê Hoàng',
        gender: 'male',
        dob: '2006-05-02',
        country: 'Vietnam',
        bio: 'Không gian cá nhân quản lý lịch trình, kỷ luật và thói quen hàng ngày.',
        role: 'ADMIN',
        theme: 'cappuccino',
        lang: 'vi'
      });

      await owner.save();
      console.log('Personal owner account created in MongoDB (ndlhoangndl)!');
    }

    // Remove other public user accounts & old support messages since app is now strictly single-user
    await User.deleteMany({ username: { $ne: OWNER_USERNAME } });
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('messages').deleteMany({}).catch(() => {});
    }

    // Ensure default habits exist in MongoDB if not initialized yet
    const existingHabits = await Habit.findOne({ userId: owner._id });
    if (!existingHabits || !existingHabits.habits || existingHabits.habits.length === 0) {
      await Habit.findOneAndUpdate(
        { userId: owner._id },
        { habits: DEFAULT_HABITS },
        { upsert: true, new: true }
      );
      console.log('Default habits initialized in MongoDB for owner!');
    }

    return owner;
  } catch (error) {
    console.error('Error initializing personal owner account:', error);
    return null;
  }
};

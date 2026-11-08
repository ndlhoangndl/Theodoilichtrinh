import { User, Habit, MonthRecord } from '../types/types';
import { getDaysInMonth } from '../utils/calendar';
import { apiGetHabits, apiSaveHabits, apiGetRecord, apiSaveRecord, apiUpdateProfile } from './api';

// Local Storage Global Keys (used as fast local cache for MongoDB data)
const KEY_USERS = 'LICHTRINH_USERS';
const KEY_SESSION = 'LICHTRINH_SESSION';
const KEY_SEL_YEAR = 'LICHTRINH_SEL_YEAR';
const KEY_SEL_MONTH = 'LICHTRINH_SEL_MONTH';

export const DEFAULT_OWNER_USER: User = {
  username: 'ndlhoangndl',
  email: 'ndlhoangndl@gmail.com',
  fullName: 'Nguyễn Đăng Lê Hoàng',
  gender: 'male',
  dob: '2006-05-02',
  country: 'Vietnam',
  bio: 'Không gian cá nhân quản lý lịch trình, kỷ luật và thói quen hàng ngày.',
  role: 'ADMIN',
  theme: 'cappuccino',
  lang: 'vi'
};

// ---------------- PERSONAL OWNER SESSION OPERATIONS ----------------

export function getUsers(): User[] {
  const usersRaw = localStorage.getItem(KEY_USERS);
  if (usersRaw) {
    try {
      return JSON.parse(usersRaw);
    } catch (e) {
      console.error('Error parsing users list', e);
    }
  }
  return [DEFAULT_OWNER_USER];
}

export function updateUser(user: User): void {
  localStorage.setItem(KEY_USERS, JSON.stringify([user]));
}

export function createSession(user: User): void {
  localStorage.setItem(KEY_SESSION, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(KEY_SESSION);
}

export function getCurrentSession(): User {
  const sessionRaw = localStorage.getItem(KEY_SESSION);
  if (sessionRaw) {
    try {
      const parsed = JSON.parse(sessionRaw) as User;
      if (parsed && parsed.username) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing active session', e);
    }
  }
  createSession(DEFAULT_OWNER_USER);
  return { ...DEFAULT_OWNER_USER };
}

// ---------------- HABITS & RECORD DATA OPERATIONS (MONGODB SYNCED) ----------------

export function saveHabits(username: string, habits: Habit[]): void {
  const key = `LICHTRINH_${username}_HABITS`;
  localStorage.setItem(key, JSON.stringify(habits));

  // Sync to MongoDB
  apiSaveHabits(habits).catch(err => {
    console.error('Failed to sync habits to MongoDB:', err);
  });
}

export function loadHabits(username: string, defaultHabits: Habit[]): Habit[] {
  const key = `LICHTRINH_${username}_HABITS`;
  const habitsRaw = localStorage.getItem(key);
  if (habitsRaw) {
    try {
      const parsed = JSON.parse(habitsRaw) as Habit[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error(`Error parsing habits for ${username}`, e);
    }
  }

  saveHabits(username, defaultHabits);
  return [...defaultHabits];
}

export function saveSelectedDate(year: number, month: number): void {
  localStorage.setItem(KEY_SEL_YEAR, year.toString());
  localStorage.setItem(KEY_SEL_MONTH, month.toString());

  apiUpdateProfile({ selectedYear: year, selectedMonth: month }).catch(err => {
    console.error('Failed to sync selected date to MongoDB:', err);
  });
}

export function loadSelectedDate(): { year: number; month: number } {
  const savedYear = localStorage.getItem(KEY_SEL_YEAR);
  const savedMonth = localStorage.getItem(KEY_SEL_MONTH);

  if (savedYear && savedMonth) {
    return {
      year: parseInt(savedYear),
      month: parseInt(savedMonth)
    };
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth()
  };
}

export function saveRecord(username: string, year: number, month: number, record: MonthRecord): void {
  const recordKey = `LICHTRINH_${username}_RECORD_${year}_${month}`;
  localStorage.setItem(recordKey, JSON.stringify(record));

  // Sync to MongoDB
  apiSaveRecord(year, month, record).catch(err => {
    console.error(`Failed to sync monthly record ${year}-${month} to MongoDB:`, err);
  });
}

export function loadRecord(username: string, year: number, month: number, habits: Habit[]): MonthRecord {
  const recordKey = `LICHTRINH_${username}_RECORD_${year}_${month}`;
  const recordRaw = localStorage.getItem(recordKey);
  const daysCount = getDaysInMonth(year, month);

  if (recordRaw) {
    try {
      const record = JSON.parse(recordRaw) as MonthRecord;

      if (!record.checks) {
        record.checks = {};
      }

      habits.forEach(h => {
        if (!record.checks[h.id]) {
          record.checks[h.id] = new Array(daysCount).fill(false);
        } else if (record.checks[h.id].length !== daysCount) {
          const oldArray = record.checks[h.id];
          record.checks[h.id] = new Array(daysCount).fill(false);
          for (let i = 0; i < Math.min(oldArray.length, daysCount); i++) {
            record.checks[h.id][i] = oldArray[i];
          }
        }
      });

      if (!record.mood || record.mood.length !== daysCount) {
        const oldMood = record.mood || [];
        record.mood = new Array(daysCount).fill(0);
        for (let i = 0; i < Math.min(oldMood.length, daysCount); i++) {
          record.mood[i] = oldMood[i];
        }
      }

      if (!record.motivation || record.motivation.length !== daysCount) {
        const oldMotivation = record.motivation || [];
        record.motivation = new Array(daysCount).fill(0);
        for (let i = 0; i < Math.min(oldMotivation.length, daysCount); i++) {
          record.motivation[i] = oldMotivation[i];
        }
      }

      if (!record.diary || record.diary.length !== daysCount) {
        const oldDiary = record.diary || [];
        record.diary = new Array(daysCount).fill('');
        for (let i = 0; i < Math.min(oldDiary.length, daysCount); i++) {
          record.diary[i] = oldDiary[i];
        }
      }

      if (!record.goals) {
        record.goals = [];
      }

      if (!record.weeklyGoals) {
        record.weeklyGoals = [];
      }

      if (!record.wateredDays) {
        record.wateredDays = [];
      }

      if (!record.selectedSeed) {
        record.selectedSeed = 'oak';
      }

      return record;
    } catch (e) {
      console.error(`Error parsing MonthRecord for ${username}`, e);
    }
  }

  // Create new blank record
  const blankChecks: Record<string, boolean[]> = {};
  habits.forEach(h => {
    blankChecks[h.id] = new Array(daysCount).fill(false);
  });

  const record: MonthRecord = {
    year,
    month,
    checks: blankChecks,
    mood: new Array(daysCount).fill(0),
    motivation: new Array(daysCount).fill(0),
    diary: new Array(daysCount).fill(''),
    goals: [],
    weeklyGoals: [],
    wateredDays: [],
    selectedSeed: 'oak'
  };

  saveRecord(username, year, month, record);
  return record;
}

export async function syncHabitsFromServer(username: string): Promise<void> {
  try {
    const serverHabits = await apiGetHabits();
    const key = `LICHTRINH_${username}_HABITS`;
    const localRaw = localStorage.getItem(key);

    if (serverHabits && serverHabits.length > 0) {
      localStorage.setItem(key, JSON.stringify(serverHabits));
    } else if (localRaw) {
      try {
        const localHabits = JSON.parse(localRaw) as Habit[];
        if (localHabits.length > 0) {
          await apiSaveHabits(localHabits);
        }
      } catch (e) {
        console.error('Failed to parse local habits for migration:', e);
      }
    }
  } catch (err) {
    console.error('syncHabitsFromServer error:', err);
  }
}

export async function syncRecordFromServer(username: string, year: number, month: number): Promise<void> {
  try {
    const serverRecord = await apiGetRecord(year, month);
    const recordKey = `LICHTRINH_${username}_RECORD_${year}_${month}`;

    if (serverRecord) {
      localStorage.setItem(recordKey, JSON.stringify(serverRecord));
    } else {
      const localRaw = localStorage.getItem(recordKey);
      if (localRaw) {
        try {
          const localRecord = JSON.parse(localRaw) as MonthRecord;
          if (localRecord) {
            await apiSaveRecord(year, month, localRecord);
          }
        } catch (e) {
          console.error('Failed to parse local record for migration:', e);
        }
      }
    }
  } catch (err) {
    console.error('syncRecordFromServer error:', err);
  }
}

export async function migrateAllLocalRecordsToServer(username: string): Promise<void> {
  try {
    const prefix = `LICHTRINH_${username}_RECORD_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const suffix = key.substring(prefix.length);
        const parts = suffix.split('_');
        if (parts.length === 2) {
          const y = parseInt(parts[0]);
          const m = parseInt(parts[1]);
          if (!isNaN(y) && !isNaN(m)) {
            await syncRecordFromServer(username, y, m);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error migrating local records to MongoDB:', err);
  }
}

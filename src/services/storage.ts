import { User, Habit, MonthRecord } from '../types/types';
import { getDaysInMonth } from '../utils/calendar';

// Local Storage Global Keys
const KEY_USERS = 'LICHTRINH_USERS';
const KEY_SESSION = 'LICHTRINH_SESSION';
const KEY_SEL_YEAR = 'LICHTRINH_SEL_YEAR';
const KEY_SEL_MONTH = 'LICHTRINH_SEL_MONTH';

// ---------------- AUTHENTICATION OPERATIONS ----------------

// Fetch all registered users
export function getUsers(): User[] {
  const usersRaw = localStorage.getItem(KEY_USERS);
  if (usersRaw) {
    try {
      return JSON.parse(usersRaw);
    } catch (e) {
      console.error('Error parsing users list', e);
    }
  }
  return [];
}

// Save a new user. Returns true if successful, false if username already exists
export function saveUser(user: User): boolean {
  const users = getUsers();
  const exists = users.some(u => u.username.toLowerCase() === user.username.toLowerCase());
  
  if (exists) {
    return false;
  }
  
  users.push(user);
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
  return true;
}

// Update existing user details in registry
export function updateUser(user: User): void {
  const users = getUsers();
  const index = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
  if (index !== -1) {
    users[index] = user;
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
  }
}

// Verify login details. Returns User object if verified, null otherwise
export function verifyUser(username: string, passwordHash: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (user && user.passwordHash === passwordHash) {
    return user;
  }
  return null;
}

// Set active user session
export function createSession(user: User): void {
  localStorage.setItem(KEY_SESSION, JSON.stringify(user));
}

// Clear active user session (Logout)
export function clearSession(): void {
  localStorage.removeItem(KEY_SESSION);
}

// Get active session user
export function getCurrentSession(): User | null {
  const sessionRaw = localStorage.getItem(KEY_SESSION);
  if (sessionRaw) {
    try {
      return JSON.parse(sessionRaw);
    } catch (e) {
      console.error('Error parsing active session', e);
    }
  }
  return null;
}

// ---------------- USER-SPECIFIC RECORD DATA OPERATIONS ----------------

// Save habits list under user namespace
export function saveHabits(username: string, habits: Habit[]): void {
  const key = `LICHTRINH_${username}_HABITS`;
  localStorage.setItem(key, JSON.stringify(habits));
}

// Load habits list under user namespace
export function loadHabits(username: string, defaultHabits: Habit[]): Habit[] {
  const key = `LICHTRINH_${username}_HABITS`;
  const habitsRaw = localStorage.getItem(key);
  if (habitsRaw) {
    try {
      const parsed = JSON.parse(habitsRaw) as Habit[];
      return parsed;
    } catch (e) {
      console.error(`Error parsing habits for ${username}`, e);
    }
  }
  
  saveHabits(username, defaultHabits);
  return [...defaultHabits];
}

// Save selected date preferences globally (shared across login views)
export function saveSelectedDate(year: number, month: number): void {
  localStorage.setItem(KEY_SEL_YEAR, year.toString());
  localStorage.setItem(KEY_SEL_MONTH, month.toString());
}

// Load selected date preferences globally
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

// Save monthly record under user namespace
export function saveRecord(username: string, year: number, month: number, record: MonthRecord): void {
  const recordKey = `LICHTRINH_${username}_RECORD_${year}_${month}`;
  localStorage.setItem(recordKey, JSON.stringify(record));
}

// Load monthly record under user namespace, ensuring all structures are valid and aligned
export function loadRecord(username: string, year: number, month: number, habits: Habit[]): MonthRecord {
  const recordKey = `LICHTRINH_${username}_RECORD_${year}_${month}`;
  const recordRaw = localStorage.getItem(recordKey);
  const daysCount = getDaysInMonth(year, month);

  if (recordRaw) {
    try {
      const record = JSON.parse(recordRaw) as MonthRecord;

      // Sanity checks and data integrity migrations
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

      // Mood array validation
      if (!record.mood || record.mood.length !== daysCount) {
        const oldMood = record.mood || [];
        record.mood = new Array(daysCount).fill(0);
        for (let i = 0; i < Math.min(oldMood.length, daysCount); i++) {
          record.mood[i] = oldMood[i];
        }
      }

      // Motivation array validation
      if (!record.motivation || record.motivation.length !== daysCount) {
        const oldMotivation = record.motivation || [];
        record.motivation = new Array(daysCount).fill(0);
        for (let i = 0; i < Math.min(oldMotivation.length, daysCount); i++) {
          record.motivation[i] = oldMotivation[i];
        }
      }

      // Diary notes array validation
      if (!record.diary || record.diary.length !== daysCount) {
        const oldDiary = record.diary || [];
        record.diary = new Array(daysCount).fill('');
        for (let i = 0; i < Math.min(oldDiary.length, daysCount); i++) {
          record.diary[i] = oldDiary[i];
        }
      }

      // Goals array validation
      if (!record.goals) {
        record.goals = [];
      }

      // Weekly goals array validation
      if (!record.weeklyGoals) {
        record.weeklyGoals = [];
      }

      // Watered days array validation for the Habit Garden
      if (!record.wateredDays) {
        record.wateredDays = [];
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
    wateredDays: []
  };
  
  saveRecord(username, year, month, record);
  return record;
}

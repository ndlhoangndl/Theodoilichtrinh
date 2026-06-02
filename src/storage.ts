import { Habit, MonthRecord } from './types';
import { getDaysInMonth } from './calendar';

// Local Storage Keys
const KEY_HABITS = 'LICHTRINH_HABITS';
const KEY_SEL_YEAR = 'LICHTRINH_SEL_YEAR';
const KEY_SEL_MONTH = 'LICHTRINH_SEL_MONTH';

// Save habits to localStorage
export function saveHabits(habits: Habit[]): void {
  localStorage.setItem(KEY_HABITS, JSON.stringify(habits));
}

// Load habits from localStorage, falling back to default lists if empty
export function loadHabits(defaultHabits: Habit[]): Habit[] {
  const habitsRaw = localStorage.getItem(KEY_HABITS);
  if (habitsRaw) {
    try {
      return JSON.parse(habitsRaw);
    } catch (e) {
      console.error('Error parsing habits from localStorage, resetting to default', e);
    }
  }
  
  // Save default list initially
  saveHabits(defaultHabits);
  return [...defaultHabits];
}

// Save active selection year and month
export function saveSelectedDate(year: number, month: number): void {
  localStorage.setItem(KEY_SEL_YEAR, year.toString());
  localStorage.setItem(KEY_SEL_MONTH, month.toString());
}

// Load active selection year and month
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

// Save active monthly record log
export function saveRecord(year: number, month: number, record: MonthRecord): void {
  const recordKey = `LICHTRINH_RECORD_${year}_${month}`;
  localStorage.setItem(recordKey, JSON.stringify(record));
}

// Load monthly record log, verifying data structure sizes and aligning them with the habit list
export function loadRecord(year: number, month: number, habits: Habit[]): MonthRecord {
  const recordKey = `LICHTRINH_RECORD_${year}_${month}`;
  const recordRaw = localStorage.getItem(recordKey);
  const daysCount = getDaysInMonth(year, month);

  if (recordRaw) {
    try {
      const record = JSON.parse(recordRaw) as MonthRecord;

      // Initialize checks dictionary if missing
      if (!record.checks) {
        record.checks = {};
      }

      // Check each habit structure inside current month record
      habits.forEach(h => {
        if (!record.checks[h.id]) {
          record.checks[h.id] = new Array(daysCount).fill(false);
        } else if (record.checks[h.id].length !== daysCount) {
          // Adjust array length if daysCount changed or layout differs
          const oldArray = record.checks[h.id];
          record.checks[h.id] = new Array(daysCount).fill(false);
          for (let i = 0; i < Math.min(oldArray.length, daysCount); i++) {
            record.checks[h.id][i] = oldArray[i];
          }
        }
      });

      // Ensure mood array size matches daysCount
      if (!record.mood || record.mood.length !== daysCount) {
        const oldMood = record.mood || [];
        record.mood = new Array(daysCount).fill(0);
        for (let i = 0; i < Math.min(oldMood.length, daysCount); i++) {
          record.mood[i] = oldMood[i];
        }
      }

      // Ensure motivation array size matches daysCount
      if (!record.motivation || record.motivation.length !== daysCount) {
        const oldMotivation = record.motivation || [];
        record.motivation = new Array(daysCount).fill(0);
        for (let i = 0; i < Math.min(oldMotivation.length, daysCount); i++) {
          record.motivation[i] = oldMotivation[i];
        }
      }

      return record;
    } catch (e) {
      console.error('Error parsing MonthRecord from localStorage', e);
    }
  }

  // Create and persist a new blank record
  const blankChecks: Record<string, boolean[]> = {};
  habits.forEach(h => {
    blankChecks[h.id] = new Array(daysCount).fill(false);
  });

  const record: MonthRecord = {
    year,
    month,
    checks: blankChecks,
    mood: new Array(daysCount).fill(0),
    motivation: new Array(daysCount).fill(0)
  };
  
  saveRecord(year, month, record);
  return record;
}

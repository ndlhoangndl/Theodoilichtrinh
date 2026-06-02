export interface User {
  username: string;
  passwordHash: string; // Stored simply for mock auth purposes
  email: string;
  fullName: string;
  gender: string; // e.g. male, female, other, unknown
  dob: string; // e.g. YYYY-MM-DD
  country?: string;
  bio?: string;
  role?: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
}

export interface MonthRecord {
  year: number;
  month: number; // 0-11
  // Maps habitId to an array of booleans representing checks for each day of the month
  checks: Record<string, boolean[]>;
  // Array of ratings (1-10, or 0 if unset) for each day of the month
  mood: number[];
  motivation: number[];
  // Array of reflections/notes (or empty strings if unset) for each day of the month
  diary: string[];
  // Checklist for custom monthly targets
  goals: { id: string; text: string; completed: boolean }[];
}

export interface HabitStats {
  id: string;
  name: string;
  emoji: string;
  goal: number;
  actual: number;
  left: number;
  progress: number; // percentage (0 - 100)
  currentStreak: number;
  maxStreak: number;
}

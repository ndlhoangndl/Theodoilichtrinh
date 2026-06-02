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
}

export interface HabitStats {
  id: string;
  name: string;
  emoji: string;
  goal: number;
  actual: number;
  left: number;
  progress: number; // percentage (0 - 100)
}

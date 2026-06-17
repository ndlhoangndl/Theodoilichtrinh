import { User, Habit, MonthRecord } from '../../types/types';

export const state = {
  currentUser: null as User | null,
  habits: [] as Habit[],
  currentYear: 2026,
  currentMonth: 0, // 0 = Jan
  currentRecord: null as MonthRecord | null,
  currentLang: 'vi' as 'vi' | 'en',
  currentGoalWeek: 0,
  isCompactGrid: false,
  selectedWeekIdx: 0
};

// Default list of seed habits
export const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: 'Dậy lúc 06:00 ⏰', emoji: '⏰' },
  { id: 'h2', name: 'Thiền định 🧘', emoji: '🧘' },
  { id: 'h3', name: 'Tập Gym/Thể thao 💪', emoji: '💪' },
  { id: 'h4', name: 'Tắm nước lạnh 🚿', emoji: '🚿' },
  { id: 'h5', name: 'Làm việc tập trung 💻', emoji: '💻' },
  { id: 'h6', name: 'Đọc sách 10 trang 📖', emoji: '📖' },
  { id: 'h7', name: 'Học kỹ năng mới 📈', emoji: '📈' },
  { id: 'h8', name: 'Không ăn đường 🍫', emoji: '🍫' },
  { id: 'h9', name: 'Không bia rượu 🍺', emoji: '🍺' },
  { id: 'h10', name: 'Lập kế hoạch ngày 📝', emoji: '📝' },
  { id: 'h11', name: 'Ngủ trước 23:00 💤', emoji: '💤' }
];

export const WEEK_DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const WEEK_DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

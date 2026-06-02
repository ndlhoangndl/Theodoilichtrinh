import { User, Habit, MonthRecord, HabitStats } from './types';
import { MONTH_NAMES, getDaysInMonth, getDayOfWeek } from './calendar';
import {
  loadHabits,
  saveHabits,
  loadRecord,
  saveRecord,
  loadSelectedDate,
  saveSelectedDate,
  saveUser,
  updateUser,
  verifyUser,
  createSession,
  clearSession,
  getCurrentSession
} from './storage';
import {
  drawDailyProgressChart,
  drawWeeklyProgressChart,
  drawOverallDonutChart,
  drawMoodMotivationTrendChart
} from './charts';
import { triggerConfetti } from './confetti';

// Global Translations Dictionary
const TRANSLATIONS: Record<'vi' | 'en', Record<string, string>> = {
  vi: {
    auth_subtitle: 'Quản lý thói quen & Nhìn nhận bản thân mỗi ngày',
    login_title: 'Đăng Nhập',
    username: 'Tên đăng nhập',
    password: 'Mật khẩu',
    fullname: 'Họ và tên',
    email: 'Địa chỉ Email',
    confirm_password: 'Xác nhận mật khẩu',
    login_submit: 'Đăng nhập',
    register_title: 'Đăng Ký Tài Khoản',
    register_submit: 'Đăng ký tài khoản',
    app_title: 'Lịch Trình',
    btn_theme: '☕ Giao diện',
    btn_manage: '⚙️ Cấu hình',
    btn_reset: '🗑️ Xóa',
    btn_logout: '🚪 Đăng xuất',
    panel_calendar_settings: 'Cài đặt lịch',
    label_year: 'Năm',
    label_month: 'Tháng',
    panel_daily_progress: 'Tiến độ hàng ngày',
    panel_weekly_progress: 'Tiến độ hàng tuần',
    panel_goals_stats: 'Thống kê mục tiêu',
    stat_label_goal: 'Mục tiêu tổng:',
    stat_label_completed: 'Hoàn thành:',
    stat_label_left: 'Còn lại:',
    panel_overall_stats: 'Tổng quan',
    panel_spreadsheet: 'Bảng Theo Dõi Thói Quen (Lịch Trình Chi Tiết)',
    panel_trend: 'Biểu Đồ Xu Hướng Trạng Thái Tinh Thần (Mood & Motivation)',
    panel_journal: 'Nhật Ký Suy Nghĩ Hàng Ngày (Daily Reflections)',
    label_journal_day: 'Xem ngày:',
    panel_analysis: 'Phân tích chi tiết',
    th_habit: 'Thói quen',
    th_goal: 'Mục tiêu',
    th_actual: 'Đạt',
    th_left: 'Còn',
    th_streak: 'Chuỗi 🔥',
    th_progress: 'Tiến độ',
    panel_monthly_goals: 'Mục tiêu trong tháng',
    panel_leaderboard: 'Top Thói Quen Hàng Đầu',
    modal_manage_title: 'Quản lý thói quen',
    modal_label_emoji: 'Icon/Emoji',
    modal_btn_add: 'Thêm',
    modal_list_label: 'Danh sách hiện có (Có thể sắp xếp & chỉnh sửa):',
    modal_btn_save: 'Lưu cấu hình',

    // JSON Backup / Restore
    btn_backup: '💾 Sao lưu',
    btn_backup_title: 'Tải file sao lưu dữ liệu (.json)',
    btn_restore: '📂 Khôi phục',
    btn_restore_title: 'Nhập dữ liệu từ file sao lưu (.json)',
    alert_backup_invalid: 'File sao lưu không đúng định dạng!',
    alert_restore_success: 'Khôi phục dữ liệu thành công!',
    confirm_restore: 'Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại của bạn. Bạn có chắc chắn muốn tiếp tục?',

    // Profile Page
    tab_tracker: '📅 Lịch Trình',
    tab_profile: '👤 Cá Nhân',
    profile_title_banner: 'Trạng thái tài khoản',
    profile_title_settings: 'Settings & Actions',
    profile_custom_title: 'Tuỳ chỉnh hồ sơ',
    profile_btn_update_info: 'Cập nhật thông tin cơ bản',
    profile_btn_change_password: 'Đổi mật khẩu',
    profile_btn_logout: 'Đăng xuất khỏi hệ thống',
    profile_overview_details: 'Overview Details',
    profile_card_account: 'ACCOUNT',
    profile_card_email: 'EMAIL',
    profile_card_gender: 'GIỚI TÍNH',
    profile_card_country: 'QUỐC GIA',
    profile_card_dob: 'NGÀY SINH',
    profile_card_role: 'VAI TRÒ HỆ THỐNG',
    gender: 'Giới tính',
    gender_male: 'Nam',
    gender_female: 'Nữ',
    gender_other: 'Khác',
    dob: 'Ngày sinh',
    modal_edit_profile_title: 'Cập nhật thông tin cá nhân',
    modal_edit_password_title: 'Đổi mật khẩu bảo mật',
    password_old: 'Mật khẩu cũ',
    password_new: 'Mật khẩu mới',
    password_old_placeholder: 'Nhập mật khẩu hiện tại...',
    password_new_placeholder: 'Nhập mật khẩu mới...',
    profile_label_bio: 'Giới thiệu bản thân (Bio)',
    alert_profile_saved: 'Cập nhật thông tin cá nhân thành công!',
    alert_password_changed: 'Đổi mật khẩu thành công!',
    alert_password_wrong: 'Mật khẩu cũ không chính xác.',

    // Greeting
    greeting_prefix: 'Xin chào,',
    member: 'Thành viên',
    
    // Placeholders
    login_username_placeholder: 'Nhập tài khoản...',
    login_password_placeholder: 'Nhập mật khẩu...',
    register_username_placeholder: 'Viết liền không dấu...',
    register_fullname_placeholder: 'Nhập họ và tên đầy đủ...',
    register_email_placeholder: 'vi-du@email.com...',
    register_password_placeholder: 'Mật khẩu bảo mật...',
    register_confirm_password_placeholder: 'Nhập lại mật khẩu...',
    journal_placeholder: 'Hôm nay lịch trình của bạn thế nào? Có điều gì xảy ra tốt hay chưa tốt? Ghi lại cảm xúc hoặc bài học rút ra...',
    goals_input_placeholder: 'Đặt mục tiêu mới cho tháng...',
    modal_input_placeholder: 'Ví dụ: Đọc sách 30 phút...',
    
    // Tooltips (titles)
    prev_month: 'Tháng trước',
    next_month: 'Tháng sau',
    btn_theme_title: 'Chuyển đổi giao diện sáng/tối',
    btn_reset_title: 'Xóa dữ liệu thói quen của tháng hiện tại',
    btn_logout_title: 'Đăng xuất khỏi tài khoản',
    
    // Alerts and Confirms
    modal_confirm_title: 'Xác nhận',
    confirm_logout: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản thói quen?',
    confirm_reset: 'Cảnh báo: Hành động này sẽ xóa sạch toàn bộ lịch sử thói quen, tâm trạng, nhật ký và mục tiêu trong tháng hiện tại. Bạn có chắc chắn muốn làm mới?',
    confirm_delete_habit: 'Bạn có chắc chắn muốn xóa thói quen này? Dữ liệu lịch sử đã check sẽ biến mất.',
    confirm_delete_goal: 'Bạn có chắc chắn muốn xóa mục tiêu này?',
    alert_register_success: 'Tài khoản của bạn đã được đăng ký thành công.',
    alert_fields_required: 'Vui lòng điền đầy đủ các thông tin.',
    alert_username_spaces: 'Tên đăng nhập không được chứa dấu cách.',
    alert_password_mismatch: 'Xác nhận mật khẩu không khớp. Vui lòng nhập lại.',
    alert_username_taken: 'Tên tài khoản này đã được sử dụng. Vui lòng chọn tên khác.',
    alert_wrong_login: 'Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại.',
    alert_save_success: 'Lưu thành công!',
    autosave_status: '✓ Đã lưu tự động',
    no_goals_message: 'Chưa có mục tiêu cho tháng này. Hãy đặt mục tiêu mới ở trên!',
    
    // Emojis / Translation details
    habit_label: 'Thói quen',
    week_label: 'Tuần',
    mood_label: 'Tâm trạng',
    motivation_label: 'Động lực',
    completed_label: 'Hoàn thành',
    remaining_label: 'Còn lại',
    day_label: 'Ngày'
  },
  en: {
    auth_subtitle: 'Manage habits & reflect on your path daily',
    login_title: 'Sign In',
    username: 'Username',
    password: 'Password',
    fullname: 'Full Name',
    email: 'Email Address',
    confirm_password: 'Confirm Password',
    login_submit: 'Login',
    register_title: 'Register Account',
    register_submit: 'Create Account',
    app_title: 'Schedule',
    btn_theme: '☕ Theme',
    btn_manage: '⚙️ Configure',
    btn_reset: '🗑️ Reset',
    btn_logout: '🚪 Logout',
    panel_calendar_settings: 'Calendar Settings',
    label_year: 'Year',
    label_month: 'Month',
    panel_daily_progress: 'Daily Progress',
    panel_weekly_progress: 'Weekly Progress',
    panel_goals_stats: 'Goal Stats',
    stat_label_goal: 'Total Goal:',
    stat_label_completed: 'Completed:',
    stat_label_left: 'Remaining:',
    panel_overall_stats: 'Overall Stats',
    panel_spreadsheet: 'Habit Tracking Worksheet (Schedule Details)',
    panel_trend: 'Mental State Trend Analysis (Mood & Motivation)',
    panel_journal: 'Daily Journal / Reflections',
    label_journal_day: 'Select Day:',
    panel_analysis: 'Habits Performance Analysis',
    th_habit: 'Habit',
    th_goal: 'Goal',
    th_actual: 'Actual',
    th_left: 'Left',
    th_streak: 'Streak 🔥',
    th_progress: 'Progress',
    panel_monthly_goals: 'Monthly Goals',
    panel_leaderboard: 'Top Daily Habits',
    modal_manage_title: 'Manage Habits',
    modal_label_emoji: 'Icon/Emoji',
    modal_btn_add: 'Add',
    modal_list_label: 'Existing Habits (Drag & Edit):',
    modal_btn_save: 'Save Configuration',

    // JSON Backup / Restore
    btn_backup: '💾 Backup',
    btn_backup_title: 'Download backup data file (.json)',
    btn_restore: '📂 Restore',
    btn_restore_title: 'Import data from backup file (.json)',
    alert_backup_invalid: 'Invalid backup file format!',
    alert_restore_success: 'Data restored successfully!',
    confirm_restore: 'This action will overwrite all your current data. Are you sure you want to continue?',

    // Profile Page
    tab_tracker: '📅 Schedule',
    tab_profile: '👤 Profile',
    profile_title_banner: 'Account Status',
    profile_title_settings: 'Settings & Actions',
    profile_custom_title: 'Customize Profile',
    profile_btn_update_info: 'Update Basic Info',
    profile_btn_change_password: 'Change Password',
    profile_btn_logout: 'Log Out of System',
    profile_overview_details: 'Overview Details',
    profile_card_account: 'ACCOUNT',
    profile_card_email: 'EMAIL',
    profile_card_gender: 'GENDER',
    profile_card_country: 'COUNTRY',
    profile_card_dob: 'DATE OF BIRTH',
    profile_card_role: 'SYSTEM ROLE',
    gender: 'Gender',
    gender_male: 'Male',
    gender_female: 'Female',
    gender_other: 'Other',
    dob: 'Date of Birth',
    modal_edit_profile_title: 'Update Profile Details',
    modal_edit_password_title: 'Change Security Password',
    password_old: 'Old Password',
    password_new: 'New Password',
    password_old_placeholder: 'Enter current password...',
    password_new_placeholder: 'Enter new password...',
    profile_label_bio: 'Biography (Bio)',
    alert_profile_saved: 'Profile updated successfully!',
    alert_password_changed: 'Password updated successfully!',
    alert_password_wrong: 'Incorrect current password.',

    // Greeting
    greeting_prefix: 'Welcome,',
    member: 'Member',
    
    // Placeholders
    login_username_placeholder: 'Enter username...',
    login_password_placeholder: 'Enter password...',
    register_username_placeholder: 'No spaces allowed...',
    register_fullname_placeholder: 'Enter your full name...',
    register_email_placeholder: 'example@email.com...',
    register_password_placeholder: 'Secure password...',
    register_confirm_password_placeholder: 'Retype password...',
    journal_placeholder: 'How was your schedule today? Any wins or challenges? Record emotions or lessons learned...',
    goals_input_placeholder: 'Add new monthly goal...',
    modal_input_placeholder: 'e.g., Read 30 mins...',
    
    // Tooltips (titles)
    prev_month: 'Previous Month',
    next_month: 'Next Month',
    btn_theme_title: 'Switch between light and dark theme',
    btn_reset_title: 'Clear habits logs for the current month',
    btn_logout_title: 'Log out of your account',
    
    // Alerts and Confirms
    modal_confirm_title: 'Confirm',
    confirm_logout: 'Are you sure you want to log out of your habit tracker account?',
    confirm_reset: 'Warning: This action will clear all habits history, mood, diary notes and monthly goals for the current month. Are you sure you want to reset?',
    confirm_delete_habit: 'Are you sure you want to delete this habit? All checked history for this habit will be lost.',
    confirm_delete_goal: 'Are you sure you want to delete this goal?',
    alert_register_success: 'Your account has been registered successfully.',
    alert_fields_required: 'Please fill in all information fields.',
    alert_username_spaces: 'Username cannot contain spaces.',
    alert_password_mismatch: 'Confirm password does not match. Please retype.',
    alert_username_taken: 'Username is already taken. Please choose another.',
    alert_wrong_login: 'Invalid username or password. Please verify.',
    alert_save_success: 'Configuration saved successfully!',
    autosave_status: '✓ Auto-saved',
    no_goals_message: 'No goals set for this month. Create one above!',
    
    // Emojis / Translation details
    habit_label: 'Habit',
    week_label: 'Week',
    mood_label: 'Mood',
    motivation_label: 'Motivation',
    completed_label: 'Completed',
    remaining_label: 'Remaining',
    day_label: 'Day'
  }
};

const WEEK_DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEK_DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Global State
let currentUser: User | null = null;
let habits: Habit[] = [];
let currentYear: number = 2026;
let currentMonth: number = 0; // 0 = Jan
let currentRecord: MonthRecord;
let currentLang: 'vi' | 'en' = 'vi';

// Default list of seed habits
const DEFAULT_HABITS: Habit[] = [
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

let confirmResolve: ((value: boolean) => void) | null = null;

export function showConfirm(message: string): Promise<boolean> {
  const modal = document.getElementById('modal-confirm');
  const msgEl = document.getElementById('confirm-message');
  const titleEl = document.getElementById('confirm-title');
  
  if (modal && msgEl) {
    if (titleEl) {
      titleEl.textContent = currentLang === 'vi' ? 'Xác nhận' : 'Confirm';
    }
    msgEl.textContent = message;
    
    const btnYes = document.getElementById('confirm-btn-yes');
    const btnNo = document.getElementById('confirm-btn-no');
    if (btnYes) btnYes.textContent = currentLang === 'vi' ? 'Có' : 'Yes';
    if (btnNo) btnNo.textContent = currentLang === 'vi' ? 'Không' : 'No';
    
    modal.classList.add('active');
    
    return new Promise<boolean>((resolve) => {
      confirmResolve = resolve;
    });
  }
  return Promise.resolve(false);
}

// Initialize State
function initializeState(): void {
  if (!currentUser) return;
  habits = loadHabits(currentUser.username, DEFAULT_HABITS);

  const dateInfo = loadSelectedDate();
  currentYear = dateInfo.year;
  currentMonth = dateInfo.month;

  currentRecord = loadRecord(currentUser.username, currentYear, currentMonth, habits);
}

// Helper: Calculate Streak metrics for a checklist
function calculateStreak(checks: boolean[]): { currentStreak: number; maxStreak: number } {
  const today = new Date();
  const daysCount = checks.length;
  
  // 1. Calculate Max Streak
  let maxStreak = 0;
  let runningStreak = 0;
  for (let i = 0; i < daysCount; i++) {
    if (checks[i]) {
      runningStreak++;
      if (runningStreak > maxStreak) {
        maxStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  // 2. Calculate Current Streak
  let startIndex = daysCount - 1;
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  
  if (isCurrentMonth) {
    startIndex = Math.min(daysCount - 1, today.getDate() - 1);
  }

  let currentStreak = 0;
  
  if (startIndex >= 0) {
    let scanIdx = startIndex;
    if (!checks[scanIdx]) {
      if (scanIdx > 0 && checks[scanIdx - 1]) {
        scanIdx = scanIdx - 1;
      } else {
        scanIdx = -1;
      }
    }
    
    if (scanIdx >= 0) {
      for (let i = scanIdx; i >= 0; i--) {
        if (checks[i]) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  return { currentStreak, maxStreak };
}

// Calculate statistics and aggregates for the logged-in user
function calculateStats(): {
  totalGoal: number;
  totalCompleted: number;
  totalLeft: number;
  completionRate: number;
  habitStats: HabitStats[];
  dailyCompletionRates: number[];
  weeklyCompletionRates: number[];
} {
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const totalHabits = habits.length;
  
  const totalGoal = totalHabits * daysCount;
  let totalCompleted = 0;

  // Calculate statistics per habit (including streaks)
  const habitStats: HabitStats[] = habits.map(h => {
    const checks = currentRecord.checks[h.id] || new Array(daysCount).fill(false);
    const actual = checks.filter(c => c).length;
    const goal = daysCount;
    const left = goal - actual;
    const progress = goal > 0 ? Math.round((actual / goal) * 100) : 0;
    totalCompleted += actual;

    const { currentStreak, maxStreak } = calculateStreak(checks);

    return {
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      goal,
      actual,
      left,
      progress,
      currentStreak,
      maxStreak
    };
  });

  const totalLeft = totalGoal - totalCompleted;
  const completionRate = totalGoal > 0 ? (totalCompleted / totalGoal) * 100 : 0;

  // Calculate daily completion rates (for daily progress chart)
  const dailyCompletionRates: number[] = [];
  for (let d = 0; d < daysCount; d++) {
    let completedOnDay = 0;
    habits.forEach(h => {
      const checks = currentRecord.checks[h.id];
      if (checks && checks[d]) {
        completedOnDay++;
      }
    });
    const rate = totalHabits > 0 ? Math.round((completedOnDay / totalHabits) * 100) : 0;
    dailyCompletionRates.push(rate);
  }

  // Calculate weekly completion rates (for weekly progress chart)
  const weeklyCompletionRates: number[] = [];
  const weekSpans = [
    { start: 0, end: 6 },
    { start: 7, end: 13 },
    { start: 14, end: 20 },
    { start: 21, end: 27 },
    { start: 28, end: daysCount - 1 }
  ];

  weekSpans.forEach(span => {
    if (span.start >= daysCount) return;
    const endDay = Math.min(span.end, daysCount - 1);
    const spanDays = endDay - span.start + 1;
    const spanGoal = totalHabits * spanDays;
    
    let spanCompleted = 0;
    for (let d = span.start; d <= endDay; d++) {
      habits.forEach(h => {
        const checks = currentRecord.checks[h.id];
        if (checks && checks[d]) {
          spanCompleted++;
        }
      });
    }

    const rate = spanGoal > 0 ? Math.round((spanCompleted / spanGoal) * 100) : 0;
    weeklyCompletionRates.push(rate);
  });

  return {
    totalGoal,
    totalCompleted,
    totalLeft,
    completionRate,
    habitStats,
    dailyCompletionRates,
    weeklyCompletionRates
  };
}

// Run through the DOM to translate elements based on active currentLang
function translateUI(): void {
  // Update static HTML elements containing data-i18n tags
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n') || '';
    const translation = TRANSLATIONS[currentLang][key];
    if (translation) {
      el.textContent = translation;
    }
  });

  // Update input text placeholders containing data-i18n-placeholder tags
  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(el => {
    const input = el as HTMLInputElement | HTMLTextAreaElement;
    const key = input.getAttribute('data-i18n-placeholder') || '';
    const translation = TRANSLATIONS[currentLang][key];
    if (translation) {
      input.placeholder = translation;
    }
  });

  // Update titles/tooltips containing data-i18n-title tags
  const titles = document.querySelectorAll('[data-i18n-title]');
  titles.forEach(el => {
    const key = el.getAttribute('data-i18n-title') || '';
    const translation = TRANSLATIONS[currentLang][key];
    if (translation) {
      el.setAttribute('title', translation);
    }
  });

  // Update dynamic toggle links containing nested elements
  const loginToggle = document.getElementById('login-toggle-container');
  if (loginToggle) {
    if (currentLang === 'vi') {
      loginToggle.innerHTML = 'Chưa có tài khoản? <a href="#" id="btn-goto-register">Đăng ký ngay</a>';
    } else {
      loginToggle.innerHTML = 'Don\'t have an account? <a href="#" id="btn-goto-register">Register now</a>';
    }
    // Rebind toggling buttons
    const btnGotoReg = document.getElementById('btn-goto-register');
    if (btnGotoReg) {
      btnGotoReg.addEventListener('click', (e) => {
        e.preventDefault();
        const loginView = document.getElementById('auth-login-view') as HTMLElement;
        const registerView = document.getElementById('auth-register-view') as HTMLElement;
        if (loginView && registerView) {
          loginView.style.display = 'none';
          registerView.style.display = 'block';
        }
      });
    }
  }

  const registerToggle = document.getElementById('register-toggle-container');
  if (registerToggle) {
    if (currentLang === 'vi') {
      registerToggle.innerHTML = 'Đã có tài khoản? <a href="#" id="btn-goto-login">Đăng nhập</a>';
    } else {
      registerToggle.innerHTML = 'Already have an account? <a href="#" id="btn-goto-login">Sign in</a>';
    }
    // Rebind toggling buttons
    const btnGotoLog = document.getElementById('btn-goto-login');
    if (btnGotoLog) {
      btnGotoLog.addEventListener('click', (e) => {
        e.preventDefault();
        const loginView = document.getElementById('auth-login-view') as HTMLElement;
        const registerView = document.getElementById('auth-register-view') as HTMLElement;
        if (loginView && registerView) {
          registerView.style.display = 'none';
          loginView.style.display = 'block';
        }
      });
    }
  }

  // Update greeting prefix label
  const greetingLabel = document.getElementById('greeting-label-prefix');
  if (greetingLabel) {
    greetingLabel.textContent = TRANSLATIONS[currentLang].greeting_prefix;
  }

  // Update month select options translation
  const selectMonth = document.getElementById('select-month') as HTMLSelectElement;
  if (selectMonth) {
    const options = selectMonth.querySelectorAll('option');
    options.forEach((opt, idx) => {
      if (currentLang === 'vi') {
        opt.textContent = `Tháng ${idx + 1}`;
      } else {
        opt.textContent = MONTH_NAMES[idx];
      }
    });
  }

  // Translate toggle theme button text based on state
  const isDark = document.body.classList.contains('dark-theme');
  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  if (btnToggleTheme) {
    if (currentLang === 'vi') {
      btnToggleTheme.textContent = isDark ? '🌙 Espresso' : '☕ Cappuccino';
    } else {
      btnToggleTheme.textContent = isDark ? '🌙 Espresso' : '☕ Cappuccino';
    }
  }
}

// Master Render Method
function renderAll(): void {
  if (!currentUser) return;
  const stats = calculateStats();
  
  // Render header info
  const monthDisplay = document.getElementById('current-month-display');
  if (monthDisplay) {
    if (currentLang === 'vi') {
      monthDisplay.textContent = `- Tháng ${currentMonth + 1} / ${currentYear} -`;
    } else {
      monthDisplay.textContent = `- ${MONTH_NAMES[currentMonth].toUpperCase()} ${currentYear} -`;
    }
  }

  // User Greeting
  const userDisplayName = document.getElementById('user-display-name');
  if (userDisplayName) {
    userDisplayName.textContent = currentUser.fullName;
  }

  // Render stats cards
  const elGoal = document.getElementById('stat-goal');
  const elCompleted = document.getElementById('stat-completed');
  const elLeft = document.getElementById('stat-left');
  
  if (elGoal) elGoal.textContent = stats.totalGoal.toString();
  if (elCompleted) elCompleted.textContent = stats.totalCompleted.toString();
  if (elLeft) elLeft.textContent = stats.totalLeft.toString();

  // Render spreadsheet grid
  renderSpreadsheetGrid(stats.habitStats);

  // Render Analysis Table
  renderAnalysisTable(stats.habitStats);

  // Render Leaderboard
  renderLeaderboard(stats.habitStats);

  // Render Monthly Goals list
  renderGoalsList();

  // Draw Charts
  drawDailyProgressChart(stats.dailyCompletionRates);
  drawWeeklyProgressChart(stats.weeklyCompletionRates);
  drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
  drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
}

// Render dynamic spreadsheet check tables
function renderSpreadsheetGrid(habitStats: HabitStats[]): void {
  if (!currentUser) return;
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const dayNames = currentLang === 'vi' ? WEEK_DAYS_VN : WEEK_DAYS_EN;
  
  // 1. Render Week group header (e.g. Week 1, Week 2...)
  const weekHeader = document.getElementById('habit-grid-week-header');
  if (weekHeader) {
    const weekWord = currentLang === 'vi' ? 'Tuần' : 'Week';
    let html = `<th class="col-habit-name" rowspan="2">${currentLang === 'vi' ? 'Thói quen' : 'My Habits'}</th>`;
    
    html += `<th colspan="7" class="week-group-header">${weekWord} 1</th>`;
    html += `<th colspan="7" class="week-group-header">${weekWord} 2</th>`;
    html += `<th colspan="7" class="week-group-header">${weekWord} 3</th>`;
    html += `<th colspan="7" class="week-group-header">${weekWord} 4</th>`;
    
    const remainingDays = daysCount - 28;
    if (remainingDays > 0) {
      html += `<th colspan="${remainingDays}" class="week-group-header">${weekWord} 5</th>`;
    }
    
    weekHeader.innerHTML = html;
  }

  // 2. Render Days and Dates row (with Clickable Journal indicators)
  const daysHeader = document.getElementById('habit-grid-header');
  if (daysHeader) {
    let html = '';
    for (let d = 1; d <= daysCount; d++) {
      const dayIdx = getDayOfWeek(currentYear, currentMonth, d);
      const dayName = dayNames[dayIdx];
      const isWeekend = (dayIdx === 0 || dayIdx === 6);
      const cellClass = isWeekend ? 'col-day-header weekend' : 'col-day-header';
      
      const hasJournal = currentRecord.diary && currentRecord.diary[d - 1] && currentRecord.diary[d - 1].trim() !== '';
      const tooltipJournal = currentLang === 'vi' ? 'Có nhật ký' : 'Diary notes exist';
      const journalIndicator = hasJournal ? `<div style="font-size: 8px; color: var(--accent-orange); margin-top:-2px;" title="${tooltipJournal}">✏️</div>` : '';
      const headerTitle = currentLang === 'vi' ? 'Click để viết nhật ký ngày này' : 'Click to write diary for this day';

      html += `
        <th class="${cellClass}" style="cursor:pointer;" data-day="${d - 1}" title="${headerTitle}">
          <div>${dayName}</div>
          <div style="font-size: 11px; margin-top:2px; font-weight:700;">${d}</div>
          ${journalIndicator}
        </th>
      `;
    }
    daysHeader.innerHTML = html;

    // Click on date column header opens journal tab for that date
    const headers = daysHeader.querySelectorAll('th');
    headers.forEach(h => {
      h.addEventListener('click', () => {
        const dayIdx = parseInt(h.getAttribute('data-day') || '0');
        const selectDay = document.getElementById('select-journal-day') as HTMLSelectElement;
        const textarea = document.getElementById('textarea-journal') as HTMLTextAreaElement;

        if (selectDay && textarea) {
          selectDay.value = dayIdx.toString();
          textarea.value = currentRecord.diary[dayIdx] || '';
          
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          textarea.focus();
        }
      });
    });
  }

  // 3. Render grid rows for habits
  const gridBody = document.getElementById('habit-grid-body');
  if (gridBody) {
    let html = '';

    habitStats.forEach(h => {
      const checks = currentRecord.checks[h.id] || new Array(daysCount).fill(false);
      
      html += `<tr>`;
      html += `<td class="col-habit-name" title="${h.name}">${h.name}</td>`;
      
      for (let d = 0; d < daysCount; d++) {
        const isChecked = checks[d];
        const dayOfWeekIdx = getDayOfWeek(currentYear, currentMonth, d + 1);
        const isWeekend = (dayOfWeekIdx === 0 || dayOfWeekIdx === 6);
        const cellClass = isWeekend ? 'cell-checkbox weekend' : 'cell-checkbox';
        
        html += `
          <td class="${cellClass}" data-habit="${h.id}" data-day="${d}">
            <input type="checkbox" class="habit-checkbox" ${isChecked ? 'checked' : ''}>
          </td>
        `;
      }
      
      html += `</tr>`;
    });

    // 4. Render Mood Selector Row
    const labelMood = currentLang === 'vi' ? 'Mood (Tâm trạng)' : 'Mood';
    html += `<tr class="row-mental-state">`;
    html += `<td class="col-mental-label">${labelMood}</td>`;
    for (let d = 0; d < daysCount; d++) {
      const rating = currentRecord.mood[d] || 0;
      html += `
        <td>
          <select class="select-mental select-mood" data-day="${d}">
            <option value="0">-</option>
            ${Array.from({ length: 10 }, (_, i) => i + 1).map(num => `
              <option value="${num}" ${rating === num ? 'selected' : ''}>${num}</option>
            `).join('')}
          </select>
        </td>
      `;
    }
    html += `</tr>`;

    // 5. Render Motivation Selector Row
    const labelMot = currentLang === 'vi' ? 'Motivation (Động lực)' : 'Motivation';
    html += `<tr class="row-mental-state">`;
    html += `<td class="col-mental-label">${labelMot}</td>`;
    for (let d = 0; d < daysCount; d++) {
      const rating = currentRecord.motivation[d] || 0;
      html += `
        <td>
          <select class="select-mental select-motivation" data-day="${d}">
            <option value="0">-</option>
            ${Array.from({ length: 10 }, (_, i) => i + 1).map(num => `
              <option value="${num}" ${rating === num ? 'selected' : ''}>${num}</option>
            `).join('')}
          </select>
        </td>
      `;
    }
    html += `</tr>`;

    gridBody.innerHTML = html;

    // Attach checkbox events
    const cells = gridBody.querySelectorAll('.cell-checkbox');
    cells.forEach(cell => {
      cell.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const habitId = cell.getAttribute('data-habit') || '';
        const day = parseInt(cell.getAttribute('data-day') || '0');
        const checkbox = cell.querySelector('.habit-checkbox') as HTMLInputElement;

        if (target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }

        currentRecord.checks[habitId][day] = checkbox.checked;
        saveRecord(currentUser!.username, currentYear, currentMonth, currentRecord);
        
        if (checkbox.checked) {
          let dayCompletedCount = 0;
          habits.forEach(h => {
            if (currentRecord.checks[h.id] && currentRecord.checks[h.id][day]) {
              dayCompletedCount++;
            }
          });
          
          if (dayCompletedCount === habits.length) {
            triggerConfetti();
          }
        }

        const updatedStats = calculateStats();
        
        const elGoal = document.getElementById('stat-goal');
        const elCompleted = document.getElementById('stat-completed');
        const elLeft = document.getElementById('stat-left');
        if (elGoal) elGoal.textContent = updatedStats.totalGoal.toString();
        if (elCompleted) elCompleted.textContent = updatedStats.totalCompleted.toString();
        if (elLeft) elLeft.textContent = updatedStats.totalLeft.toString();

        renderAnalysisTable(updatedStats.habitStats);
        renderLeaderboard(updatedStats.habitStats);
        drawDailyProgressChart(updatedStats.dailyCompletionRates);
        drawWeeklyProgressChart(updatedStats.weeklyCompletionRates);
        drawOverallDonutChart(updatedStats.completionRate, updatedStats.totalCompleted, updatedStats.totalLeft);
      });
    });

    // Attach Mood select events
    const moodSelects = gridBody.querySelectorAll('.select-mood');
    moodSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const el = e.target as HTMLSelectElement;
        const day = parseInt(el.getAttribute('data-day') || '0');
        currentRecord.mood[day] = parseInt(el.value);
        saveRecord(currentUser!.username, currentYear, currentMonth, currentRecord);
        drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
      });
    });

    // Attach Motivation select events
    const motSelects = gridBody.querySelectorAll('.select-motivation');
    motSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const el = e.target as HTMLSelectElement;
        const day = parseInt(el.getAttribute('data-day') || '0');
        currentRecord.motivation[day] = parseInt(el.value);
        saveRecord(currentUser!.username, currentYear, currentMonth, currentRecord);
        drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
      });
    });
  }
}

// Render Analysis Panel Table (with Streaks)
function renderAnalysisTable(habitStats: HabitStats[]): void {
  const tableBody = document.getElementById('analysis-table-body');
  if (tableBody) {
    let html = '';
    
    habitStats.forEach(h => {
      const tooltipStreak = currentLang === 'vi' 
        ? `Hiện tại: ${h.currentStreak} ngày, Kỷ lục: ${h.maxStreak} ngày`
        : `Current: ${h.currentStreak} days, Best: ${h.maxStreak} days`;
        
      html += `
        <tr>
          <td class="col-align-left" title="${h.name}">${h.name}</td>
          <td>${h.goal}</td>
          <td style="color:var(--accent-green); font-weight:700;">${h.actual}</td>
          <td style="color:var(--text-muted);">${h.left}</td>
          <td style="font-weight: 600; color: var(--accent-orange);" title="${tooltipStreak}">
            🔥 ${h.currentStreak}
          </td>
          <td class="col-progress-bar-cell">
            <div class="progress-bar-container" title="${h.progress}%">
              <div class="progress-bar-fill" style="width: ${h.progress}%; background-color: ${h.progress >= 70 ? 'var(--accent-green)' : 'var(--accent-brown)'}"></div>
            </div>
          </td>
          <td style="font-weight: 700;">${h.progress}%</td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
  }
}

// Render Leaderboard Panel List
function renderLeaderboard(habitStats: HabitStats[]): void {
  const container = document.getElementById('leaderboard-list');
  if (container) {
    const sorted = [...habitStats].sort((a, b) => b.progress - a.progress);
    let html = '';
    
    sorted.slice(0, 10).forEach((h, index) => {
      html += `
        <div class="leaderboard-item">
          <div class="leaderboard-rank">${index + 1}</div>
          <div class="modal-habit-emoji">${h.emoji}</div>
          <div class="leaderboard-name" title="${h.name}">${h.name}</div>
          <div class="leaderboard-percentage">${h.progress}%</div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  }
}

// Render Monthly Goals panel list
function renderGoalsList(): void {
  if (!currentUser) return;
  const listContainer = document.getElementById('goals-list-container');
  const ratioLabel = document.getElementById('goals-progress-ratio');

  if (listContainer) {
    const goals = currentRecord.goals || [];
    const completedCount = goals.filter(g => g.completed).length;
    const totalCount = goals.length;

    if (ratioLabel) {
      ratioLabel.textContent = `${completedCount}/${totalCount}`;
    }

    if (totalCount === 0) {
      listContainer.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--text-muted); padding: 12px 0;">${TRANSLATIONS[currentLang].no_goals_message}</div>`;
      return;
    }

    let html = '';
    goals.forEach(goal => {
      html += `
        <div class="goal-item ${goal.completed ? 'completed' : ''}" data-id="${goal.id}">
          <div class="goal-left-side">
            <input type="checkbox" class="goal-checkbox-native" ${goal.completed ? 'checked' : ''}>
            <span class="goal-text">${goal.text}</span>
          </div>
          <button class="goal-delete-btn" title="${TRANSLATIONS[currentLang].confirm_delete_goal}">✕</button>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    // Attach list checking and deletion events
    const items = listContainer.querySelectorAll('.goal-item');
    items.forEach(item => {
      const goalId = item.getAttribute('data-id') || '';
      
      // Toggle check
      item.querySelector('.goal-left-side')?.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const nativeCheckbox = item.querySelector('.goal-checkbox-native') as HTMLInputElement;
        
        if (target !== nativeCheckbox) {
          nativeCheckbox.checked = !nativeCheckbox.checked;
        }

        const goalObj = currentRecord.goals.find(g => g.id === goalId);
        if (goalObj) {
          goalObj.completed = nativeCheckbox.checked;
          saveRecord(currentUser!.username, currentYear, currentMonth, currentRecord);
          
          if (goalObj.completed) {
            triggerConfetti();
          }

          renderGoalsList();
        }
      });

      // Delete Goal (with translated custom confirm dialog)
      item.querySelector('.goal-delete-btn')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await showConfirm(TRANSLATIONS[currentLang].confirm_delete_goal);
        if (confirmed) {
          currentRecord.goals = currentRecord.goals.filter(g => g.id !== goalId);
          saveRecord(currentUser!.username, currentYear, currentMonth, currentRecord);
          renderGoalsList();
        }
      });
    });
  }
}

// Render Habit Manager List Editor inside Modal
function renderManageHabitsList(): void {
  const container = document.getElementById('modal-habit-list-container');
  if (container) {
    let html = '';
    habits.forEach((h, index) => {
      const titleUp = currentLang === 'vi' ? 'Di chuyển lên' : 'Move up';
      const titleDown = currentLang === 'vi' ? 'Di chuyển xuống' : 'Move down';
      const titleDel = currentLang === 'vi' ? 'Xóa thói quen này' : 'Delete this habit';

      html += `
        <div class="modal-habit-item" data-id="${h.id}">
          <span class="modal-habit-drag-btn">☰</span>
          <input type="text" class="form-control modal-habit-emoji-input" value="${h.emoji}" style="width: 44px; text-align:center; padding: 4px;" maxlength="4">
          <input type="text" class="form-control modal-habit-name-input" value="${h.name}" style="flex:1; padding: 4px 8px;">
          <div style="display:flex; gap: 4px;">
            <button type="button" class="btn btn-icon btn-move-up" ${index === 0 ? 'disabled' : ''} title="${titleUp}">▲</button>
            <button type="button" class="btn btn-icon btn-move-down" ${index === habits.length - 1 ? 'disabled' : ''} title="${titleDown}">▼</button>
            <button type="button" class="btn btn-icon btn-delete" style="color:#a94442; border-color:#ebccd1; background:#f2dede;" title="${titleDel}">✕</button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

    // Attach list triggers
    const items = container.querySelectorAll('.modal-habit-item');
    items.forEach((item, index) => {
      // Move Up
      item.querySelector('.btn-move-up')?.addEventListener('click', () => {
        if (index > 0) {
          const temp = habits[index];
          habits[index] = habits[index - 1];
          habits[index - 1] = temp;
          renderManageHabitsList();
        }
      });

      // Move Down
      item.querySelector('.btn-move-down')?.addEventListener('click', () => {
        if (index < habits.length - 1) {
          const temp = habits[index];
          habits[index] = habits[index + 1];
          habits[index + 1] = temp;
          renderManageHabitsList();
        }
      });

      // Delete habit (with translated custom confirm)
      item.querySelector('.btn-delete')?.addEventListener('click', async () => {
        const confirmed = await showConfirm(TRANSLATIONS[currentLang].confirm_delete_habit);
        if (confirmed) {
          habits.splice(index, 1);
          renderManageHabitsList();
        }
      });

      // Bind name/emoji updates
      const emojiInput = item.querySelector('.modal-habit-emoji-input') as HTMLInputElement;
      emojiInput.addEventListener('change', () => {
        habits[index].emoji = emojiInput.value.trim() || '🎯';
      });

      const nameInput = item.querySelector('.modal-habit-name-input') as HTMLInputElement;
      nameInput.addEventListener('change', () => {
        habits[index].name = nameInput.value.trim() || 'Thói quen mới';
      });
    });
  }
}

// Export active user profile, habits list, goals, mood ratings and journal reflections to JSON file
function exportBackup(): void {
  if (!currentUser) return;
  const username = currentUser.username;
  const habitsKey = `LICHTRINH_${username}_HABITS`;
  const habitsRaw = localStorage.getItem(habitsKey) || '[]';
  
  const backupData: {
    username: string;
    fullName: string;
    email: string;
    habits: Habit[];
    records: Record<string, MonthRecord>;
  } = {
    username: currentUser.username,
    fullName: currentUser.fullName,
    email: currentUser.email,
    habits: JSON.parse(habitsRaw),
    records: {}
  };
  
  // Find all record keys for the current user in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`LICHTRINH_${username}_RECORD_`)) {
      const recordRaw = localStorage.getItem(key);
      if (recordRaw) {
        try {
          backupData.records[key] = JSON.parse(recordRaw);
        } catch (e) {
          console.error('Error parsing record in backup', e);
        }
      }
    }
  }
  
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const safeName = username.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `lich_trinh_backup_${safeName}_${Date.now()}.json`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Import backup file, mapping other-user properties to current user namespace if necessary
function importBackup(file: File): void {
  if (!currentUser) return;
  const username = currentUser.username;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target?.result as string;
    if (!content) return;
    
    try {
      const backupData = JSON.parse(content);
      
      // Simple validation: check if habits is array and records is object
      if (!backupData || !Array.isArray(backupData.habits) || typeof backupData.records !== 'object') {
        alert(TRANSLATIONS[currentLang].alert_backup_invalid || 'File sao lưu không đúng định dạng!');
        return;
      }
      
      const confirmed = await showConfirm(TRANSLATIONS[currentLang].confirm_restore);
      if (!confirmed) return;
      
      // 1. Save habits
      saveHabits(username, backupData.habits);
      
      // 2. Save records
      const recordKeys = Object.keys(backupData.records);
      recordKeys.forEach(key => {
        // Only restore keys matching LICHTRINH_${username}_RECORD_ to prevent cross-user pollution
        // If the backup file was generated by another user, we map the records to the current user
        let targetKey = key;
        const recordPrefix = `LICHTRINH_${backupData.username}_RECORD_`;
        if (key.startsWith(recordPrefix)) {
          const recordSuffix = key.substring(recordPrefix.length); // e.g. "2026_0"
          targetKey = `LICHTRINH_${username}_RECORD_${recordSuffix}`;
        }
        
        localStorage.setItem(targetKey, JSON.stringify(backupData.records[key]));
      });
      
      alert(TRANSLATIONS[currentLang].alert_restore_success || 'Khôi phục dữ liệu thành công!');
      window.location.reload();
    } catch (err) {
      console.error('Error parsing JSON backup file', err);
      alert(TRANSLATIONS[currentLang].alert_backup_invalid || 'File sao lưu không đúng định dạng!');
    }
  };
  reader.readAsText(file);
}

// Bind Authentication View Forms and State Switching
function initAuth(): void {
  const authContainer = document.getElementById('auth-container');
  const dashboardContainer = document.getElementById('dashboard-container');

  if (!authContainer || !dashboardContainer) return;

  const loginView = document.getElementById('auth-login-view') as HTMLElement;
  const registerView = document.getElementById('auth-register-view') as HTMLElement;
  const btnGotoRegister = document.getElementById('btn-goto-register');
  const btnGotoLogin = document.getElementById('btn-goto-login');

  if (btnGotoRegister && btnGotoLogin && loginView && registerView) {
    btnGotoRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginView.style.display = 'none';
      registerView.style.display = 'block';
      
      const errorReg = document.getElementById('register-error') as HTMLElement;
      if (errorReg) errorReg.style.display = 'none';
    });

    btnGotoLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerView.style.display = 'none';
      loginView.style.display = 'block';
      
      const errorLog = document.getElementById('login-error') as HTMLElement;
      if (errorLog) errorLog.style.display = 'none';
    });
  }

  // Handle Login form submit
  const formLogin = document.getElementById('form-login') as HTMLFormElement;
  const loginError = document.getElementById('login-error') as HTMLElement;

  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const uInput = (document.getElementById('login-username') as HTMLInputElement).value.trim();
      const pInput = (document.getElementById('login-password') as HTMLInputElement).value;

      if (!uInput || !pInput) {
        if (loginError) {
          loginError.textContent = TRANSLATIONS[currentLang].alert_fields_required;
          loginError.style.display = 'block';
        }
        return;
      }

      const verified = verifyUser(uInput, pInput);

      if (verified) {
        createSession(verified);
        currentUser = verified;
        
        formLogin.reset();
        if (loginError) loginError.style.display = 'none';

        authContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        
        initializeState();
        translateUI();
        setupJournalPanel();
        renderAll();
      } else {
        if (loginError) {
          loginError.textContent = TRANSLATIONS[currentLang].alert_wrong_login;
          loginError.style.display = 'block';
        }
      }
    });
  }

  // Handle Registration form submit
  const formRegister = document.getElementById('form-register') as HTMLFormElement;
  const registerError = document.getElementById('register-error') as HTMLElement;

  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const usernameVal = (document.getElementById('register-username') as HTMLInputElement).value.trim();
      const fullnameVal = (document.getElementById('register-fullname') as HTMLInputElement).value.trim();
      const emailVal = (document.getElementById('register-email') as HTMLInputElement).value.trim();
      const passwordVal = (document.getElementById('register-password') as HTMLInputElement).value;
      const confirmPasswordVal = (document.getElementById('register-confirm-password') as HTMLInputElement).value;
      const genderVal = (document.getElementById('register-gender') as HTMLSelectElement).value;
      const dobVal = (document.getElementById('register-dob') as HTMLInputElement).value;

      if (!usernameVal || !fullnameVal || !emailVal || !passwordVal || !confirmPasswordVal || !genderVal || !dobVal) {
        if (registerError) {
          registerError.textContent = TRANSLATIONS[currentLang].alert_fields_required;
          registerError.style.display = 'block';
        }
        return;
      }

      if (passwordVal !== confirmPasswordVal) {
        if (registerError) {
          registerError.textContent = TRANSLATIONS[currentLang].alert_password_mismatch;
          registerError.style.display = 'block';
        }
        return;
      }

      if (usernameVal.includes(' ')) {
        if (registerError) {
          registerError.textContent = TRANSLATIONS[currentLang].alert_username_spaces;
          registerError.style.display = 'block';
        }
        return;
      }

      const newUser: User = {
        username: usernameVal,
        passwordHash: passwordVal,
        email: emailVal,
        fullName: fullnameVal,
        gender: genderVal,
        dob: dobVal,
        country: 'Vietnam',
        bio: 'Đây là không gian dành riêng cho bạn. Nơi lưu giữ những thông tin cá nhân cơ bản và định hình trải nghiệm lịch trình của bạn.',
        role: 'USER'
      };

      const success = saveUser(newUser);

      if (success) {
        createSession(newUser);
        currentUser = newUser;
        
        formRegister.reset();
        if (registerError) registerError.style.display = 'none';

        authContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';

        initializeState();
        translateUI();
        setupJournalPanel();
        renderAll();
        
        alert(`${currentUser.fullName}! ${TRANSLATIONS[currentLang].alert_register_success}`);
      } else {
        if (registerError) {
          registerError.textContent = TRANSLATIONS[currentLang].alert_username_taken;
          registerError.style.display = 'block';
        }
      }
    });
  }

  // Bind Logout Button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logoutUser();
    });
  }
}

// Setup Daily Journal Selector options and keyboard inputs auto-saving
function setupJournalPanel(): void {
  if (!currentUser) return;
  const selectDay = document.getElementById('select-journal-day') as HTMLSelectElement;
  const textarea = document.getElementById('textarea-journal') as HTMLTextAreaElement;
  const saveStatus = document.getElementById('journal-save-status') as HTMLElement;
  const daysCount = getDaysInMonth(currentYear, currentMonth);

  if (selectDay && textarea) {
    let optionsHtml = '';
    const dayLabel = currentLang === 'vi' ? 'Ngày' : 'Day';
    for (let d = 1; d <= daysCount; d++) {
      optionsHtml += `<option value="${d - 1}">${dayLabel} ${d}</option>`;
    }
    selectDay.innerHTML = optionsHtml;

    const today = new Date();
    const isCurrent = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
    const defaultDay = isCurrent ? Math.min(daysCount - 1, today.getDate() - 1) : 0;
    
    selectDay.value = defaultDay.toString();
    textarea.value = currentRecord.diary[defaultDay] || '';

    // Handle day select change -> load diary entry
    selectDay.addEventListener('change', () => {
      const idx = parseInt(selectDay.value);
      textarea.value = currentRecord.diary[idx] || '';
      if (saveStatus) saveStatus.style.display = 'none';
    });

    // Handle auto-saving on textarea inputs
    let autoSaveTimeout: number;
    textarea.addEventListener('input', () => {
      const idx = parseInt(selectDay.value);
      currentRecord.diary[idx] = textarea.value;
      saveRecord(currentUser!.username, currentYear, currentMonth, currentRecord);

      if (saveStatus) {
        saveStatus.textContent = TRANSLATIONS[currentLang].autosave_status;
        saveStatus.style.display = 'inline';
        
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = window.setTimeout(() => {
          saveStatus.style.display = 'none';
        }, 1500);
      }

      // Live update grid pencil icons
      const daysHeader = document.getElementById('habit-grid-header');
      if (daysHeader) {
        const headers = daysHeader.querySelectorAll('th');
        const dayNames = currentLang === 'vi' ? WEEK_DAYS_VN : WEEK_DAYS_EN;
        headers.forEach((h, index) => {
          const hasJournal = currentRecord.diary && currentRecord.diary[index] && currentRecord.diary[index].trim() !== '';
          const indicator = h.querySelector('div[title="Có nhật ký"], div[title="Diary notes exist"]');
          
          if (hasJournal && !indicator) {
            const dayNum = index + 1;
            const dayOfWeekIdx = getDayOfWeek(currentYear, currentMonth, dayNum);
            const dayName = dayNames[dayOfWeekIdx];
            const tooltipJournal = currentLang === 'vi' ? 'Có nhật ký' : 'Diary notes exist';
            h.innerHTML = `
              <div>${dayName}</div>
              <div style="font-size: 11px; margin-top:2px; font-weight:700;">${dayNum}</div>
              <div style="font-size: 8px; color: var(--accent-orange); margin-top:-2px;" title="${tooltipJournal}">✏️</div>
            `;
          } else if (!hasJournal && indicator) {
            const dayNum = index + 1;
            const dayOfWeekIdx = getDayOfWeek(currentYear, currentMonth, dayNum);
            const dayName = dayNames[dayOfWeekIdx];
            h.innerHTML = `
              <div>${dayName}</div>
              <div style="font-size: 11px; margin-top:2px; font-weight:700;">${dayNum}</div>
            `;
          }
        });
      }
    });
  }
}

// Render Profile Page details (SONICLE layout)
function renderProfilePage(): void {
  if (!currentUser) return;
  
  const gender = currentUser.gender || 'unknown';
  const dob = currentUser.dob || '---';
  const country = currentUser.country || 'Vietnam';
  const bio = currentUser.bio || 'Đây là không gian dành riêng cho bạn. Nơi lưu giữ những thông tin cá nhân cơ bản và định hình trải nghiệm lịch trình của bạn.';
  const role = currentUser.role || 'USER';

  // Left banner panel values
  const fullnameDisplay = document.getElementById('profile-fullname-display');
  const usernameHandle = document.getElementById('profile-username-handle');
  const emailHandle = document.getElementById('profile-email-handle');
  const bioDisplay = document.getElementById('profile-bio-display');
  const avatarDisplay = document.getElementById('profile-avatar-display');

  if (fullnameDisplay) fullnameDisplay.textContent = currentUser.fullName;
  if (usernameHandle) usernameHandle.textContent = `@${currentUser.username}`;
  if (emailHandle) emailHandle.textContent = currentUser.email;
  if (bioDisplay) bioDisplay.textContent = bio;
  
  if (avatarDisplay) {
    if (gender === 'male') avatarDisplay.textContent = '👨‍💼';
    else if (gender === 'female') avatarDisplay.textContent = '👩‍💼';
    else avatarDisplay.textContent = '👤';
  }

  // Bottom overview details card values
  const valUsername = document.getElementById('profile-card-val-username');
  const valEmail = document.getElementById('profile-card-val-email');
  const valGender = document.getElementById('profile-card-val-gender');
  const valCountry = document.getElementById('profile-card-val-country');
  const valDob = document.getElementById('profile-card-val-dob');
  const valRole = document.getElementById('profile-card-val-role');

  if (valUsername) valUsername.textContent = currentUser.username;
  if (valEmail) valEmail.textContent = currentUser.email;
  if (valGender) {
    let genderText = 'Unknown';
    if (gender === 'male') genderText = currentLang === 'vi' ? 'Nam' : 'Male';
    else if (gender === 'female') genderText = currentLang === 'vi' ? 'Nữ' : 'Female';
    else if (gender === 'other') genderText = currentLang === 'vi' ? 'Khác' : 'Other';
    valGender.textContent = genderText;
  }
  if (valCountry) valCountry.textContent = country;
  if (valDob) valDob.textContent = dob;
  if (valRole) valRole.textContent = role;
}

// Log out user cleanly with confirm
async function logoutUser(): Promise<void> {
  const confirmed = await showConfirm(TRANSLATIONS[currentLang].confirm_logout);
  if (confirmed) {
    clearSession();
    currentUser = null;
    
    const dashboardContainer = document.getElementById('dashboard-container') as HTMLElement;
    const authContainer = document.getElementById('auth-container') as HTMLElement;
    const registerView = document.getElementById('auth-register-view') as HTMLElement;
    const loginView = document.getElementById('auth-login-view') as HTMLElement;
    
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    if (authContainer) authContainer.style.display = 'flex';
    if (registerView) registerView.style.display = 'none';
    if (loginView) loginView.style.display = 'block';
    
    // Reset active tabs on logout
    const tabTracker = document.getElementById('tab-tracker');
    const tabProfile = document.getElementById('tab-profile');
    const viewTracker = document.getElementById('view-tracker');
    const viewProfile = document.getElementById('view-profile');
    
    if (tabTracker) tabTracker.classList.add('active');
    if (tabProfile) tabProfile.classList.remove('active');
    if (viewTracker) viewTracker.style.display = 'flex';
    if (viewProfile) viewProfile.style.display = 'none';
  }
}

// Bind settings, configurations, language switchers, and theme controls
function initApp(): void {
  // Load language preference
  currentLang = (localStorage.getItem('LICHTRINH_LANG') || 'vi') as 'vi' | 'en';

  const sessionUser = getCurrentSession();
  const authContainer = document.getElementById('auth-container');
  const dashboardContainer = document.getElementById('dashboard-container');

  initAuth();

  // Load theme preference on load
  const savedTheme = localStorage.getItem('LICHTRINH_THEME');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  if (sessionUser) {
    currentUser = sessionUser;
    if (authContainer) authContainer.style.display = 'none';
    if (dashboardContainer) dashboardContainer.style.display = 'block';

    initializeState();
    translateUI();
    setupJournalPanel();
    renderAll();
  } else {
    currentUser = null;
    if (authContainer) authContainer.style.display = 'flex';
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    translateUI();
  }

  // Bind Language Selector dropdown
  const selectLang = document.getElementById('select-lang') as HTMLSelectElement;
  if (selectLang) {
    selectLang.value = currentLang;
    selectLang.addEventListener('change', () => {
      currentLang = selectLang.value as 'vi' | 'en';
      localStorage.setItem('LICHTRINH_LANG', currentLang);
      
      translateUI();
      if (currentUser) {
        setupJournalPanel();
        renderAll();
      }
    });
  }

  // Bind settings selections: Year / Month dropdowns
  const selectYear = document.getElementById('select-year') as HTMLSelectElement;
  const selectMonth = document.getElementById('select-month') as HTMLSelectElement;

  if (selectYear && selectMonth) {
    selectYear.addEventListener('change', () => {
      if (!currentUser) return;
      currentYear = parseInt(selectYear.value);
      saveSelectedDate(currentYear, currentMonth);
      currentRecord = loadRecord(currentUser.username, currentYear, currentMonth, habits);
      setupJournalPanel();
      renderAll();
    });

    selectMonth.addEventListener('change', () => {
      if (!currentUser) return;
      currentMonth = parseInt(selectMonth.value);
      saveSelectedDate(currentYear, currentMonth);
      currentRecord = loadRecord(currentUser.username, currentYear, currentMonth, habits);
      setupJournalPanel();
      renderAll();
    });
  }

  // Prev / Next month navigations
  const btnPrev = document.getElementById('btn-prev-month');
  const btnNext = document.getElementById('btn-next-month');

  if (btnPrev && btnNext) {
    btnPrev.addEventListener('click', () => {
      if (!currentUser) return;
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
      if (selectYear && selectMonth) {
        selectYear.value = currentYear.toString();
        selectMonth.value = currentMonth.toString();
      }
      saveSelectedDate(currentYear, currentMonth);
      currentRecord = loadRecord(currentUser.username, currentYear, currentMonth, habits);
      setupJournalPanel();
      renderAll();
    });

    btnNext.addEventListener('click', () => {
      if (!currentUser) return;
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else {
        currentMonth++;
      }
      if (selectYear && selectMonth) {
        selectYear.value = currentYear.toString();
        selectMonth.value = currentMonth.toString();
      }
      saveSelectedDate(currentYear, currentMonth);
      currentRecord = loadRecord(currentUser.username, currentYear, currentMonth, habits);
      setupJournalPanel();
      renderAll();
    });
  }

  // Reset/Clear month records data button (with translated custom confirm)
  const btnReset = document.getElementById('btn-reset-data');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (!currentUser) return;
      const confirmed = await showConfirm(TRANSLATIONS[currentLang].confirm_reset);
      if (confirmed) {
        const daysCount = getDaysInMonth(currentYear, currentMonth);
        const blankChecks: Record<string, boolean[]> = {};
        habits.forEach(h => {
          blankChecks[h.id] = new Array(daysCount).fill(false);
        });

        currentRecord = {
          year: currentYear,
          month: currentMonth,
          checks: blankChecks,
          mood: new Array(daysCount).fill(0),
          motivation: new Array(daysCount).fill(0),
          diary: new Array(daysCount).fill(''),
          goals: []
        };
        saveRecord(currentUser.username, currentYear, currentMonth, currentRecord);
        setupJournalPanel();
        renderAll();
      }
    });
  }

  // JSON Backup button
  const btnBackup = document.getElementById('btn-backup-json');
  if (btnBackup) {
    btnBackup.addEventListener('click', () => {
      exportBackup();
    });
  }

  // JSON Restore button
  const btnRestore = document.getElementById('btn-restore-json');
  const inputRestoreFile = document.getElementById('input-restore-file') as HTMLInputElement;
  if (btnRestore && inputRestoreFile) {
    btnRestore.addEventListener('click', () => {
      inputRestoreFile.click();
    });

    inputRestoreFile.addEventListener('change', () => {
      if (inputRestoreFile.files && inputRestoreFile.files[0]) {
        importBackup(inputRestoreFile.files[0]);
      }
    });
  }

  // Dark/Light Theme toggle button
  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      localStorage.setItem('LICHTRINH_THEME', isDark ? 'dark' : 'light');
      
      translateUI();
      
      if (currentUser) {
        const stats = calculateStats();
        drawDailyProgressChart(stats.dailyCompletionRates);
        drawWeeklyProgressChart(stats.weeklyCompletionRates);
        drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
        drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
      }
    });
  }

  // Add new monthly Goal form submit
  const formAddGoal = document.getElementById('form-add-goal') as HTMLFormElement;
  const inputGoalText = document.getElementById('input-new-goal') as HTMLInputElement;

  if (formAddGoal && inputGoalText) {
    formAddGoal.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentUser) return;
      const text = inputGoalText.value.trim();
      
      if (text) {
        const id = 'g_' + Date.now();
        if (!currentRecord.goals) {
          currentRecord.goals = [];
        }
        currentRecord.goals.push({ id, text, completed: false });
        saveRecord(currentUser.username, currentYear, currentMonth, currentRecord);
        
        inputGoalText.value = '';
        renderGoalsList();
      }
    });
  }

  // Modal toggle bindings: Quản lý thói quen
  const modal = document.getElementById('modal-manage-habits') as HTMLElement;
  const btnOpenModal = document.getElementById('btn-manage-habits');
  const btnCloseModal = document.getElementById('modal-close-btn');
  const btnSaveModal = document.getElementById('modal-save-btn');

  if (modal && btnOpenModal && btnCloseModal && btnSaveModal) {
    btnOpenModal.addEventListener('click', () => {
      renderManageHabitsList();
      modal.classList.add('active');
    });

    btnCloseModal.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    btnSaveModal.addEventListener('click', () => {
      if (!currentUser) return;
      saveHabits(currentUser.username, habits);
      currentRecord = loadRecord(currentUser.username, currentYear, currentMonth, habits);
      renderAll();
      modal.classList.remove('active');
    });
  }

  // Add new habit form submit (inside modal)
  const formAddHabit = document.getElementById('form-add-habit') as HTMLFormElement;
  const inputEmoji = document.getElementById('input-new-habit-emoji') as HTMLInputElement;
  const inputName = document.getElementById('input-new-habit-name') as HTMLInputElement;

  if (formAddHabit && inputEmoji && inputName) {
    formAddHabit.addEventListener('submit', (e) => {
      e.preventDefault();
      const emoji = inputEmoji.value.trim() || '🎯';
      const name = inputName.value.trim();
      
      if (name) {
        const id = 'h_' + Date.now();
        habits.push({ id, name, emoji });
        
        inputName.value = '';
        inputEmoji.value = '🎯';
        
        renderManageHabitsList();
      }
    });
  }

  // Redraw graph plots on window resizes
  window.addEventListener('resize', () => {
    if (currentUser) {
      const stats = calculateStats();
      drawDailyProgressChart(stats.dailyCompletionRates);
      drawWeeklyProgressChart(stats.weeklyCompletionRates);
      drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
      drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
    }
  });

  // Bind Custom Confirm dialog actions
  const btnConfirmYes = document.getElementById('confirm-btn-yes');
  const btnConfirmNo = document.getElementById('confirm-btn-no');
  const modalConfirm = document.getElementById('modal-confirm');
  
  if (btnConfirmYes && btnConfirmNo && modalConfirm) {
    btnConfirmYes.addEventListener('click', () => {
      modalConfirm.classList.remove('active');
      if (confirmResolve) {
        confirmResolve(true);
        confirmResolve = null;
      }
    });
    
    btnConfirmNo.addEventListener('click', () => {
      modalConfirm.classList.remove('active');
      if (confirmResolve) {
        confirmResolve(false);
        confirmResolve = null;
      }
    });

    modalConfirm.addEventListener('click', (e) => {
      if (e.target === modalConfirm) {
        modalConfirm.classList.remove('active');
        if (confirmResolve) {
          confirmResolve(false);
          confirmResolve = null;
        }
      }
    });
  }

  // Tabs Navigation switching
  const tabTracker = document.getElementById('tab-tracker');
  const tabProfile = document.getElementById('tab-profile');
  const viewTracker = document.getElementById('view-tracker');
  const viewProfile = document.getElementById('view-profile');

  if (tabTracker && tabProfile && viewTracker && viewProfile) {
    tabTracker.addEventListener('click', () => {
      tabTracker.classList.add('active');
      tabProfile.classList.remove('active');
      viewTracker.style.display = 'flex';
      viewProfile.style.display = 'none';
      
      // Re-trigger graphs draw on tab show
      if (currentUser) {
        const stats = calculateStats();
        drawDailyProgressChart(stats.dailyCompletionRates);
        drawWeeklyProgressChart(stats.weeklyCompletionRates);
        drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
        drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
      }
    });

    tabProfile.addEventListener('click', () => {
      tabProfile.classList.add('active');
      tabTracker.classList.remove('active');
      viewTracker.style.display = 'none';
      viewProfile.style.display = 'block';
      renderProfilePage();
    });
  }

  // Profile actions modal: edit profile info
  const modalEditProfile = document.getElementById('modal-edit-profile') as HTMLElement;
  const btnEditProfileTrigger = document.getElementById('btn-edit-profile-trigger');
  
  if (modalEditProfile && btnEditProfileTrigger) {
    btnEditProfileTrigger.addEventListener('click', () => {
      if (!currentUser) return;
      
      const inputFullname = document.getElementById('edit-profile-fullname') as HTMLInputElement;
      const inputEmail = document.getElementById('edit-profile-email') as HTMLInputElement;
      const inputGender = document.getElementById('edit-profile-gender') as HTMLSelectElement;
      const inputDob = document.getElementById('edit-profile-dob') as HTMLInputElement;
      const inputCountry = document.getElementById('edit-profile-country') as HTMLInputElement;
      const inputBio = document.getElementById('edit-profile-bio') as HTMLTextAreaElement;

      if (inputFullname) inputFullname.value = currentUser.fullName;
      if (inputEmail) inputEmail.value = currentUser.email;
      if (inputGender) inputGender.value = currentUser.gender || 'male';
      if (inputDob) inputDob.value = currentUser.dob || '';
      if (inputCountry) inputCountry.value = currentUser.country || 'Vietnam';
      if (inputBio) inputBio.value = currentUser.bio || '';

      modalEditProfile.classList.add('active');
    });

    // Close triggers
    modalEditProfile.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => modalEditProfile.classList.remove('active'));
    });
    window.addEventListener('click', (e) => {
      if (e.target === modalEditProfile) modalEditProfile.classList.remove('active');
    });

    // Submit handler
    const formEditProfile = document.getElementById('form-edit-profile') as HTMLFormElement;
    if (formEditProfile) {
      formEditProfile.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const inputFullname = document.getElementById('edit-profile-fullname') as HTMLInputElement;
        const inputEmail = document.getElementById('edit-profile-email') as HTMLInputElement;
        const inputGender = document.getElementById('edit-profile-gender') as HTMLSelectElement;
        const inputDob = document.getElementById('edit-profile-dob') as HTMLInputElement;
        const inputCountry = document.getElementById('edit-profile-country') as HTMLInputElement;
        const inputBio = document.getElementById('edit-profile-bio') as HTMLTextAreaElement;

        currentUser.fullName = inputFullname.value.trim();
        currentUser.email = inputEmail.value.trim();
        currentUser.gender = inputGender.value;
        currentUser.dob = inputDob.value;
        currentUser.country = inputCountry.value.trim() || 'Vietnam';
        currentUser.bio = inputBio.value.trim();

        // Update database
        updateUser(currentUser);
        createSession(currentUser); // update active session

        renderProfilePage();
        renderAll();
        modalEditProfile.classList.remove('active');
        alert(TRANSLATIONS[currentLang].alert_profile_saved);
      });
    }
  }

  // Profile actions modal: change password
  const modalEditPassword = document.getElementById('modal-edit-password') as HTMLElement;
  const btnEditPasswordTrigger = document.getElementById('btn-edit-password-trigger');
  
  if (modalEditPassword && btnEditPasswordTrigger) {
    btnEditPasswordTrigger.addEventListener('click', () => {
      const formEditPassword = document.getElementById('form-edit-password') as HTMLFormElement;
      if (formEditPassword) formEditPassword.reset();
      const errEl = document.getElementById('edit-password-error');
      if (errEl) errEl.style.display = 'none';

      modalEditPassword.classList.add('active');
    });

    modalEditPassword.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => modalEditPassword.classList.remove('active'));
    });
    window.addEventListener('click', (e) => {
      if (e.target === modalEditPassword) modalEditPassword.classList.remove('active');
    });

    const formEditPassword = document.getElementById('form-edit-password') as HTMLFormElement;
    if (formEditPassword) {
      formEditPassword.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const oldPass = (document.getElementById('edit-password-old') as HTMLInputElement).value;
        const newPass = (document.getElementById('edit-password-new') as HTMLInputElement).value;
        const confirmPass = (document.getElementById('edit-password-confirm') as HTMLInputElement).value;
        const errEl = document.getElementById('edit-password-error');

        if (currentUser.passwordHash !== oldPass) {
          if (errEl) {
            errEl.textContent = TRANSLATIONS[currentLang].alert_password_wrong;
            errEl.style.display = 'block';
          }
          return;
        }

        if (newPass !== confirmPass) {
          if (errEl) {
            errEl.textContent = TRANSLATIONS[currentLang].alert_password_mismatch;
            errEl.style.display = 'block';
          }
          return;
        }

        currentUser.passwordHash = newPass;
        updateUser(currentUser);
        createSession(currentUser);

        modalEditPassword.classList.remove('active');
        alert(TRANSLATIONS[currentLang].alert_password_changed);
      });
    }
  }

  // Logout from profile tab
  const btnProfileLogout = document.getElementById('btn-profile-logout');
  if (btnProfileLogout) {
    btnProfileLogout.addEventListener('click', () => {
      logoutUser();
    });
  }
}

// Start execution when DOM is ready
window.addEventListener('DOMContentLoaded', initApp);

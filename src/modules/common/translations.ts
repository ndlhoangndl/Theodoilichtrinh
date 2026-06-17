import { state } from './state';
import { MONTH_NAMES } from '../../utils/calendar';

export const TRANSLATIONS: Record<'vi' | 'en', Record<string, string>> = {
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
    label_week: 'Tuần',
    panel_daily_progress: 'Tiến độ hàng ngày',
    panel_weekly_progress: 'Tiến độ hàng tuần',
    panel_goals_stats: 'Thống kê mục tiêu',
    stat_label_goal: 'Mục tiêu tổng:',
    stat_label_completed: 'Hoàn thành:',
    stat_label_left: 'Còn lại:',
    panel_overall_stats: 'Tổng quan',
    panel_spreadsheet: 'Bảng Theo Dõi Thói Quen (Lịch Trình Chi Tiết)',
    panel_trend: 'Biểu Đồ Xu Hướng Trạng Thế Tinh Thần (Mood & Motivation)',
    panel_coach: '🤖 Trợ Lý Phân Tích Thói Quen (AI Habit Coach)',
    panel_memory_book: '📖 Cuốn Sách Kỷ Niệm (Monthly Reviews)',
    modal_review_title: '✍️ Nhìn Lại Tháng',
    review_step_1_title: 'Bước 1: Điểm số & Số liệu tháng qua',
    review_step_2_title: 'Bước 2: Phản tư & Nhìn nhận',
    review_label_q1: '1. Điều bạn tự hào nhất trong tháng qua?',
    review_label_q2: '2. Bài học lớn nhất bạn rút ra được?',
    review_label_q3: '3. Bạn sẽ cải thiện điều gì vào tháng sau?',
    btn_next: 'Tiếp theo ➡️',
    btn_back: '⬅️ Quay lại',
    btn_save_memory: 'Lưu kỷ niệm 💾',
    modal_note_title: '📝 Ghi chú thói quen',
    note_placeholder: 'Nhập ghi chú nhỏ cho ngày này (Ví dụ: Đọc chương 2, Chạy bộ 5km...)...',
    panel_journal: 'Nhật Ký Suy Nghĩ Hàng Ngày (Daily Reflections)',
    label_journal_day: 'Xem ngày:',
    panel_analysis: 'Phân tích chi tiết',
    th_habit: 'Thói quen',
    th_goal: 'Mục tiêu',
    th_actual: 'Đạt',
    th_left: 'Còn',
    th_streak: 'Chuỗi 🔥',
    th_progress: 'Tiến độ',
    panel_habit_garden: 'Khu Vườn Thói Quen',
    btn_water_plant: 'Tưới nước',
    panel_goals: 'Mục tiêu',
    panel_monthly_goals: 'Mục tiêu trong tháng',
    panel_weekly_goals: 'Mục tiêu trong tuần',
    panel_monthly_goals_subtitle: 'Mục tiêu trong tháng',
    panel_weekly_goals_subtitle: 'Mục tiêu trong tuần',
    panel_leaderboard: 'Top Thói Quen Hàng Đầu',
    btn_toggle_compact: '📱 Thu gọn',
    btn_toggle_full: '📅 Đầy đủ',
    modal_manage_title: 'Quản lý thói quen',
    add_habit_title: 'Thêm thói quen mới',
    modal_label_name: 'Tên thói quen mới',
    modal_label_emoji: 'Icon/Emoji',
    modal_btn_add: 'Thêm',
    modal_list_label: 'Danh sách hiện có (Có thể sắp xếp & chỉnh sửa):',
    modal_btn_save: 'Lưu cấu hình',
    modal_btn_update: 'Cập nhật',
    modal_btn_change_password: 'Cập nhật mật khẩu',

    // JSON Backup / Restore
    btn_backup: '💾 Sao lưu',
    btn_backup_title: 'Tải file sao lưu dữ liệu (.json)',
    btn_restore: '📂 Khôi phục',
    btn_restore_title: 'Nhập dữ liệu từ file sao lưu (.json)',
    btn_export_excel: '📊 Xuất Excel (CSV)',
    btn_export_excel_title: 'Tải báo cáo lịch trình tháng hiện tại dưới dạng file CSV',
    alert_backup_invalid: 'File sao lưu không đúng định dạng!',
    alert_restore_success: 'Khôi phục dữ liệu thành công!',
    confirm_restore: 'Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại của bạn. Bạn có chắc chắn muốn tiếp tục?',

    // Profile Page
    tab_tracker: '📅 Lịch Trình',
    tab_stats: '📊 Thống Kê',
    tab_profile: '👤 Cá Nhân',
    profile_title_banner: 'Trạng thái tài khoản',
    profile_title_settings: 'Settings & Actions',
    profile_custom_title: 'Tuỳ chỉnh hồ sơ',
    profile_btn_update_info: 'Cập nhật thông tin cơ bản',
    profile_btn_change_password: 'Đổi mật khẩu',
    profile_btn_logout: 'Đăng xuất khỏi hệ thống',
    profile_api_settings: 'Cấu hình API trợ lý AI',
    profile_gemini_label: 'Google Gemini API Key:',
    profile_gemini_placeholder: 'Nhập API Key từ AI Studio...',
    profile_gemini_help: 'để mở khóa nhận xét chuyên sâu từ AI thực tế.',
    profile_gemini_help_prefix: 'Nhận API Key miễn phí tại',
    profile_gemini_link_text: 'Google AI Studio',
    btn_ask_gemini: '⚡ Phân tích bằng Gemini AI',
    coach_analyzing: 'Đang phân tích dữ liệu tháng này...',
    alert_gemini_key_saved: 'Đã lưu Gemini API Key thành công!',
    alert_gemini_key_missing: 'Vui lòng cấu hình Gemini API Key tại trang Cá Nhân trước!',
    alert_gemini_api_error: 'Lỗi gọi API Gemini. Vui lòng kiểm tra lại API Key!',
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
    tab_admin: '🔑 Quản Trị Admin',
    admin_panel_title: 'Bảng Quản Trị Hệ Thống - Lịch Trình Tracker',
    admin_panel_desc: 'Danh sách toàn bộ thành viên hệ thống và tiến độ thực tế (MongoDB Atlas Real-time):',

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
    prompt_gratitude: 'Biết ơn',
    prompt_lesson: 'Bài học',
    prompt_success: 'Thành tựu',
    prompt_plan: 'Ngày mai',
    goals_input_placeholder: 'Đặt mục tiêu mới cho tháng...',
    weekly_goals_input_placeholder: 'Đặt mục tiêu mới cho tuần...',
    focus_ambient_title: '🎵 Âm thanh nền (Ambient Sound)',
    ambient_none: '🔇 Không âm thanh (None)',
    ambient_lofi: '🎵 Nhạc Lofi Thư Giãn (Lofi)',
    ambient_rain: '🌧️ Mưa Rơi Êm Đềm (Rain)',
    ambient_cafe: '☕ Không Khí Quán Cà Phê (Café)',
    ambient_forest: '🌲 Rừng Thông Rào Rạt (Forest)',
    ambient_volume: 'Âm lượng:',
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
    confirm_delete_weekly_goal: 'Bạn có chắc chắn muốn xóa mục tiêu tuần này?',
    alert_register_success: 'Tài khoản của bạn đã được đăng ký thành công.',
    alert_fields_required: 'Vui lòng điền đầy đủ các thông tin.',
    alert_username_spaces: 'Tên đăng nhập không được chứa dấu cách.',
    alert_password_mismatch: 'Xác nhận mật khẩu không khớp. Vui lòng nhập lại.',
    alert_username_taken: 'Tên tài khoản này đã được sử dụng. Vui lòng chọn tên khác.',
    alert_wrong_login: 'Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại.',
    alert_save_success: 'Lưu thành công!',
    autosave_status: '✓ Đã lưu tự động',
    no_goals_message: 'Chưa có mục tiêu cho tháng này. Hãy đặt mục tiêu mới ở trên!',
    no_weekly_goals_message: 'Chưa có mục tiêu cho tuần này. Hãy đặt mục tiêu mới ở trên!',
    menu_trigger: 'Menu',
    
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
    label_week: 'Week',
    panel_daily_progress: 'Daily Progress',
    panel_weekly_progress: 'Weekly Progress',
    panel_goals_stats: 'Goal Stats',
    stat_label_goal: 'Total Goal:',
    stat_label_completed: 'Completed:',
    stat_label_left: 'Remaining:',
    panel_overall_stats: 'Overall Stats',
    panel_spreadsheet: 'Habit Tracking Worksheet (Schedule Details)',
    panel_trend: 'Mental State Trend Analysis (Mood & Motivation)',
    panel_coach: '🤖 AI Habit Coach',
    panel_memory_book: '📖 Memory Book (Monthly Reviews)',
    modal_review_title: '✍️ Monthly Review',
    review_step_1_title: 'Step 1: Month Metrics & Scores',
    review_step_2_title: 'Step 2: Reflections & Learnings',
    review_label_q1: '1. What are you most proud of this month?',
    review_label_q2: '2. What is the biggest lesson you learned?',
    review_label_q3: '3. How will you improve next month?',
    btn_next: 'Next ➡️',
    btn_back: '⬅️ Back',
    btn_save_memory: 'Save Memory 💾',
    modal_note_title: '📝 Habit Note',
    note_placeholder: 'Enter a short note for this day (e.g. Read chapter 2, Ran 5km...)...',
    panel_journal: 'Daily Journal / Reflections',
    label_journal_day: 'Select Day:',
    panel_analysis: 'Habits Performance Analysis',
    th_habit: 'Habit',
    th_goal: 'Goal',
    th_actual: 'Actual',
    th_left: 'Left',
    th_streak: 'Streak 🔥',
    th_progress: 'Progress',
    panel_habit_garden: 'Habit Garden',
    btn_water_plant: 'Water Plant',
    panel_goals: 'Goals',
    panel_monthly_goals: 'Monthly Goals',
    panel_weekly_goals: 'Weekly Goals',
    panel_monthly_goals_subtitle: 'Monthly Goals',
    panel_weekly_goals_subtitle: 'Weekly Goals',
    panel_leaderboard: 'Top Daily Habits',
    btn_toggle_compact: '📱 Compact',
    btn_toggle_full: '📅 Full',
    modal_manage_title: 'Manage Habits',
    add_habit_title: 'Add New Habit',
    modal_label_name: 'New Habit Name',
    modal_label_emoji: 'Icon/Emoji',
    modal_btn_add: 'Add',
    modal_list_label: 'Existing Habits (Drag & Edit):',
    modal_btn_save: 'Save Configuration',
    modal_btn_update: 'Update',
    modal_btn_change_password: 'Change Password',

    // JSON Backup / Restore
    btn_backup: '💾 Backup',
    btn_backup_title: 'Download backup data file (.json)',
    btn_restore: '📂 Restore',
    btn_restore_title: 'Import data from backup file (.json)',
    btn_export_excel: '📊 Export Excel (CSV)',
    btn_export_excel_title: 'Download the current monthly tracker report as a CSV file',
    alert_backup_invalid: 'Invalid backup file format!',
    alert_restore_success: 'Data restored successfully!',
    confirm_restore: 'This action will overwrite all your current data. Are you sure you want to continue?',

    // Profile Page
    tab_tracker: '📅 Schedule',
    tab_stats: '📊 Statistics',
    tab_profile: '👤 Profile',
    profile_title_banner: 'Account Status',
    profile_title_settings: 'Settings & Actions',
    profile_custom_title: 'Customize Profile',
    profile_btn_update_info: 'Update Basic Info',
    profile_btn_change_password: 'Change Password',
    profile_btn_logout: 'Log Out of System',
    profile_api_settings: 'AI Assistant API Settings',
    profile_gemini_label: 'Google Gemini API Key:',
    profile_gemini_placeholder: 'Enter API Key from AI Studio...',
    profile_gemini_help: 'to unlock deep insights from real AI.',
    profile_gemini_help_prefix: 'Get a free API Key at',
    profile_gemini_link_text: 'Google AI Studio',
    btn_ask_gemini: '⚡ Analyze with Gemini AI',
    coach_analyzing: 'Analyzing this month\'s data...',
    alert_gemini_key_saved: 'Gemini API Key saved successfully!',
    alert_gemini_key_missing: 'Please configure your Gemini API Key in the Profile tab first!',
    alert_gemini_api_error: 'Gemini API Error. Please verify your API Key!',
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
    tab_admin: '🔑 Admin Dashboard',
    admin_panel_title: 'System Administration Dashboard - Lịch Trình Tracker',
    admin_panel_desc: 'List of all system members and their real-time statistics (MongoDB Atlas):',

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
    prompt_gratitude: 'Gratitude',
    prompt_lesson: 'Lesson',
    prompt_success: 'Success',
    prompt_plan: 'Tomorrow',
    goals_input_placeholder: 'Add new monthly goal...',
    weekly_goals_input_placeholder: 'Add new weekly goal...',
    focus_ambient_title: '🎵 Ambient Sound',
    ambient_none: '🔇 None',
    ambient_lofi: '🎵 Relaxing Lofi',
    ambient_rain: '🌧️ Gentle Rain',
    ambient_cafe: '☕ Café Ambience',
    ambient_forest: '🌲 Whispering Forest',
    ambient_volume: 'Volume:',
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
    confirm_delete_weekly_goal: 'Are you sure you want to delete this weekly goal?',
    alert_register_success: 'Your account has been registered successfully.',
    alert_fields_required: 'Please fill in all information fields.',
    alert_username_spaces: 'Username cannot contain spaces.',
    alert_password_mismatch: 'Confirm password does not match. Please retype.',
    alert_username_taken: 'Username is already taken. Please choose another.',
    alert_wrong_login: 'Invalid username or password. Please verify.',
    alert_save_success: 'Configuration saved successfully!',
    autosave_status: '✓ Auto-saved',
    no_goals_message: 'No goals set for this month. Create one above!',
    no_weekly_goals_message: 'No goals set for this week. Create one above!',
    menu_trigger: 'Menu',
    
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

export function translateUI(): void {
  // Update static HTML elements containing data-i18n tags
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n') || '';
    const translation = TRANSLATIONS[state.currentLang][key];
    if (translation) {
      el.textContent = translation;
    }
  });

  // Update input text placeholders containing data-i18n-placeholder tags
  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(el => {
    const input = el as HTMLInputElement | HTMLTextAreaElement;
    const key = input.getAttribute('data-i18n-placeholder') || '';
    const translation = TRANSLATIONS[state.currentLang][key];
    if (translation) {
      input.placeholder = translation;
    }
  });

  // Update titles/tooltips containing data-i18n-title tags
  const titles = document.querySelectorAll('[data-i18n-title]');
  titles.forEach(el => {
    const key = el.getAttribute('data-i18n-title') || '';
    const translation = TRANSLATIONS[state.currentLang][key];
    if (translation) {
      el.setAttribute('title', translation);
    }
  });

  // Update dynamic toggle links containing nested elements
  const loginToggle = document.getElementById('login-toggle-container');
  if (loginToggle) {
    if (state.currentLang === 'vi') {
      loginToggle.innerHTML = 'Chưa có tài khoản? <a href="#" id="btn-goto-register">Đăng ký ngay</a>';
    } else {
      loginToggle.innerHTML = 'Don\'t have an account? <a href="#" id="btn-goto-register">Register now</a>';
    }
  }

  const registerToggle = document.getElementById('register-toggle-container');
  if (registerToggle) {
    if (state.currentLang === 'vi') {
      registerToggle.innerHTML = 'Đã có tài khoản? <a href="#" id="btn-goto-login">Đăng nhập</a>';
    } else {
      registerToggle.innerHTML = 'Already have an account? <a href="#" id="btn-goto-login">Sign in</a>';
    }
  }

  // Update greeting prefix label
  const greetingLabel = document.getElementById('greeting-label-prefix');
  if (greetingLabel) {
    greetingLabel.textContent = TRANSLATIONS[state.currentLang].greeting_prefix;
  }

  // Update user display name greeting dynamically
  const userDisplayName = document.getElementById('user-display-name');
  if (userDisplayName) {
    if (state.currentUser) {
      userDisplayName.textContent = state.currentUser.fullName || state.currentUser.username;
    } else {
      userDisplayName.textContent = TRANSLATIONS[state.currentLang].member;
    }
  }

  // Update month select options translation
  const selectMonth = document.getElementById('select-month') as HTMLSelectElement;
  if (selectMonth) {
    const options = selectMonth.querySelectorAll('option');
    options.forEach((opt, idx) => {
      if (state.currentLang === 'vi') {
        opt.textContent = `Tháng ${idx + 1}`;
      } else {
        opt.textContent = MONTH_NAMES[idx];
      }
    });
  }

  // Translate theme selector select options
  const selectTheme = document.getElementById('select-theme') as HTMLSelectElement;
  if (selectTheme) {
    const isVi = state.currentLang === 'vi';
    const currentThemeValue = selectTheme.value;
    const options = selectTheme.options;
    if (options.length >= 6) {
      options[0].text = isVi ? '☀️ Cappuccino (Sáng)' : '☀️ Cappuccino (Light)';
      options[1].text = isVi ? '🌙 Espresso (Tối)' : '🌙 Espresso (Dark)';
      options[2].text = isVi ? '🍵 Matcha Latte' : '🍵 Matcha Latte';
      options[3].text = isVi ? '🍫 Dark Chocolate' : '🍫 Dark Chocolate';
      options[4].text = isVi ? '🌸 Sakura Blossom' : '🌸 Sakura Blossom';
      options[5].text = isVi ? '🫐 Blueberry Cream' : '🫐 Blueberry Cream';
    }
    if (currentThemeValue) {
      selectTheme.value = currentThemeValue;
    }
  }
}

import { state } from './modules/common/state';
import { translateUI } from './modules/common/translations';
import { initProfile, renderProfilePage } from './modules/profile/profile';
import { setupJournalPanel, initJournalPrompts } from './modules/journal/journal';
import { initGoals } from './modules/goals/goals';
import { initHabits } from './modules/tracker/habits';
import { initTracker, initializeState, renderAll, calculateStats } from './modules/tracker/tracker';
import { initConfirmOverlay } from './modules/common/confirm';
import { initGarden } from './modules/tracker/garden';
import { initMonthlyReview } from './modules/tracker/review';
import { initFocusMode } from './modules/tracker/focus';
import {
  getCurrentSession,
  updateUser,
  createSession,
  syncHabitsFromServer,
  syncRecordFromServer,
  migrateAllLocalRecordsToServer
} from './services/storage';
import { apiGetOwnerProfile, apiUpdateProfile } from './services/api';
import {
  drawDailyProgressChart,
  drawWeeklyProgressChart,
  drawOverallDonutChart,
  drawMoodMotivationTrendChart
} from './services/charts';

function setupPasswordToggles(): void {
  const toggleBtns = document.querySelectorAll('.password-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.password-input-container');
      if (!container) return;

      const input = container.querySelector('input') as HTMLInputElement;
      const eyeOpen = btn.querySelector('.eye-open') as HTMLElement;
      const eyeClosed = btn.querySelector('.eye-closed') as HTMLElement;

      if (input.type === 'password') {
        input.type = 'text';
        if (eyeOpen) eyeOpen.style.display = 'none';
        if (eyeClosed) eyeClosed.style.display = 'block';
      } else {
        input.type = 'password';
        if (eyeOpen) eyeOpen.style.display = 'block';
        if (eyeClosed) eyeClosed.style.display = 'none';
      }
    });
  });
}

async function syncAllFromMongoDB(): Promise<void> {
  try {
    const ownerProfile = await apiGetOwnerProfile();
    if (ownerProfile && ownerProfile.user) {
      const serverUser = ownerProfile.user;
      if (ownerProfile.token) {
        localStorage.setItem('LICHTRINH_AUTH_TOKEN', ownerProfile.token);
      }

      state.currentUser = serverUser;
      updateUser(serverUser);
      createSession(serverUser);

      // Sync language
      if (serverUser.lang === 'vi' || serverUser.lang === 'en') {
        state.currentLang = serverUser.lang;
        localStorage.setItem('LICHTRINH_LANG', serverUser.lang);
        const selectLang = document.getElementById('select-lang') as HTMLSelectElement;
        if (selectLang) selectLang.value = serverUser.lang;
      }

      // Sync theme
      if (serverUser.theme && serverUser.theme !== 'default') {
        applyUserTheme(serverUser.theme);
        const selectTheme = document.getElementById('select-theme') as HTMLSelectElement;
        if (selectTheme) selectTheme.value = serverUser.theme;
      }

      // Sync Pomodoro settings
      if (serverUser.pomoSettings) {
        localStorage.setItem('LICHTRINH_POMO_SETTINGS', JSON.stringify(serverUser.pomoSettings));
      }

      // Sync selected year & month if saved on MongoDB
      if (typeof serverUser.selectedYear === 'number' && typeof serverUser.selectedMonth === 'number') {
        localStorage.setItem(
          'LICHTRINH_SELECTED_DATE',
          JSON.stringify({ year: serverUser.selectedYear, month: serverUser.selectedMonth })
        );
      }
    }

    if (!state.currentUser) return;
    const username = state.currentUser.username;

    await syncHabitsFromServer(username);
    initializeState();
    await syncRecordFromServer(username, state.currentYear, state.currentMonth);
    await migrateAllLocalRecordsToServer(username);

    initializeState();
    translateUI();
    setupJournalPanel();
    renderAll();
  } catch (err) {
    console.warn('Could not sync from MongoDB on startup, using local cache:', err);
  }
}

function initApp(): void {
  // Load language preference
  state.currentLang = (localStorage.getItem('LICHTRINH_LANG') || 'vi') as 'vi' | 'en';

  const sessionUser = getCurrentSession();
  state.currentUser = sessionUser;

  const dashboardContainer = document.getElementById('dashboard-container');
  if (dashboardContainer) dashboardContainer.style.display = 'block';

  setupPasswordToggles();
  initProfile();
  initGoals();
  initHabits();
  initTracker();
  initConfirmOverlay();
  initGarden();
  initJournalPrompts();
  initMonthlyReview();
  initFocusMode();

  // Toggle Actions Menu Dropdown
  const btnMenuTrigger = document.getElementById('btn-menu-trigger');
  const menuDropdown = document.getElementById('menu-dropdown');

  if (btnMenuTrigger && menuDropdown) {
    btnMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle('active');
    });

    // Close when clicking item inside the menu
    menuDropdown.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        menuDropdown.classList.remove('active');
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!menuDropdown.contains(target)) {
        menuDropdown.classList.remove('active');
      }
    });
  }

  // Load theme preference on load
  let initialTheme = 'cappuccino';
  if (sessionUser && sessionUser.theme && sessionUser.theme !== 'default') {
    initialTheme = sessionUser.theme;
  } else {
    const savedTheme = localStorage.getItem('LICHTRINH_THEME');
    initialTheme = savedTheme === 'dark' ? 'espresso' : 'cappuccino';
  }
  applyUserTheme(initialTheme);

  const selectTheme = document.getElementById('select-theme') as HTMLSelectElement;
  if (selectTheme) {
    selectTheme.value = initialTheme;
  }

  initializeState();
  translateUI();
  setupJournalPanel();
  renderAll();

  // Sync everything with MongoDB in the background
  syncAllFromMongoDB();

  // Bind Language Selector dropdown
  const selectLang = document.getElementById('select-lang') as HTMLSelectElement;
  if (selectLang) {
    selectLang.value = state.currentLang;
    selectLang.addEventListener('change', () => {
      state.currentLang = selectLang.value as 'vi' | 'en';
      localStorage.setItem('LICHTRINH_LANG', state.currentLang);

      if (state.currentUser) {
        state.currentUser.lang = state.currentLang;
        updateUser(state.currentUser);
        createSession(state.currentUser);
        apiUpdateProfile({ lang: state.currentLang }).catch(err => console.error('Failed to sync lang:', err));
      }

      translateUI();
      setupJournalPanel();
      renderAll();
    });
  }

  // Theme Selector dropdown change handler
  const selectThemeElement = document.getElementById('select-theme') as HTMLSelectElement;
  if (selectThemeElement) {
    selectThemeElement.addEventListener('change', () => {
      const selectedTheme = selectThemeElement.value || 'cappuccino';

      // Apply theme variables globally
      applyUserTheme(selectedTheme);

      // Update local storage preference for light/dark state
      const isDark = selectedTheme === 'espresso' || selectedTheme === 'chocolate';
      localStorage.setItem('LICHTRINH_THEME', isDark ? 'dark' : 'light');

      if (state.currentUser) {
        state.currentUser.theme = selectedTheme;
        updateUser(state.currentUser);
        createSession(state.currentUser);
        apiUpdateProfile({ theme: selectedTheme }).catch(err => console.error('Failed to sync theme:', err));
      }

      translateUI();

      if (state.currentUser && state.currentRecord) {
        const stats = calculateStats();
        drawDailyProgressChart(stats.dailyCompletionRates);
        drawWeeklyProgressChart(stats.weeklyCompletionRates);
        drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
        drawMoodMotivationTrendChart(state.currentYear, state.currentMonth, state.currentRecord);
      }
    });
  }

  // Tabs Navigation switching (Dropdown Menu Items)
  const menuTabTracker = document.getElementById('menu-tab-tracker');
  const menuTabStats = document.getElementById('menu-tab-stats');
  const menuTabProfile = document.getElementById('menu-tab-profile');

  const viewTracker = document.getElementById('view-tracker');
  const viewStats = document.getElementById('view-stats');
  const viewProfile = document.getElementById('view-profile');

  if (menuTabTracker && menuTabStats && menuTabProfile && viewTracker && viewStats && viewProfile) {
    menuTabTracker.addEventListener('click', () => {
      menuTabTracker.classList.add('active');
      menuTabStats.classList.remove('active');
      menuTabProfile.classList.remove('active');
      viewTracker.style.display = 'flex';
      viewStats.style.display = 'none';
      viewProfile.style.display = 'none';
    });

    menuTabStats.addEventListener('click', () => {
      menuTabStats.classList.add('active');
      menuTabTracker.classList.remove('active');
      menuTabProfile.classList.remove('active');
      viewTracker.style.display = 'none';
      viewStats.style.display = 'flex';
      viewProfile.style.display = 'none';

      // Re-trigger graphs draw on tab show
      if (state.currentUser && state.currentRecord) {
        const stats = calculateStats();
        drawDailyProgressChart(stats.dailyCompletionRates);
        drawWeeklyProgressChart(stats.weeklyCompletionRates);
        drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
        drawMoodMotivationTrendChart(state.currentYear, state.currentMonth, state.currentRecord);
      }
    });

    menuTabProfile.addEventListener('click', () => {
      menuTabProfile.classList.add('active');
      menuTabTracker.classList.remove('active');
      menuTabStats.classList.remove('active');
      viewTracker.style.display = 'none';
      viewStats.style.display = 'none';
      viewProfile.style.display = 'block';
      renderProfilePage();
    });
  }
}

// Start execution when DOM is ready
window.addEventListener('DOMContentLoaded', initApp);

export function applyUserTheme(themeName: string | undefined): void {
  // Remove all custom theme classes
  document.body.classList.remove('theme-matcha', 'theme-chocolate', 'theme-sakura', 'theme-blueberry', 'dark-theme');

  if (themeName === 'matcha') {
    document.body.classList.add('theme-matcha');
  } else if (themeName === 'chocolate') {
    document.body.classList.add('theme-chocolate');
    document.body.classList.add('dark-theme');
  } else if (themeName === 'sakura') {
    document.body.classList.add('theme-sakura');
  } else if (themeName === 'blueberry') {
    document.body.classList.add('theme-blueberry');
  } else if (themeName === 'espresso') {
    document.body.classList.add('dark-theme');
  }
}

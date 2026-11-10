import { state } from './modules/common/state';
import { translateUI } from './modules/common/translations';
import { setupJournalPanel, initJournalPrompts } from './modules/journal/journal';
import { initGoals } from './modules/goals/goals';
import { initDailyPlan } from './modules/tracker/dailyPlan';
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
import { apiGetOwnerProfile, apiUpdateProfile, setToken } from './services/api';
import {
  drawDailyProgressChart,
  drawWeeklyProgressChart,
  drawOverallDonutChart } from './services/charts';

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
        setToken(ownerProfile.token);
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
        localStorage.setItem('LICHTRINH_SEL_YEAR', serverUser.selectedYear.toString());
        localStorage.setItem('LICHTRINH_SEL_MONTH', serverUser.selectedMonth.toString());
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
  initGoals();
  initHabits();
  initTracker();
  initDailyPlan();
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
  window.addEventListener('online', () => {
    syncAllFromMongoDB();
  });

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
      }
    });
  }

  // Main tabs navigation (Hôm nay / Mục tiêu / Nhật ký / Thói quen / Thống kê / Cá nhân)
  const tabButtons = document.querySelectorAll<HTMLButtonElement>('.main-tab-btn');
  const tabViews = document.querySelectorAll<HTMLElement>('.tab-view');

  const showTab = (viewId: string): void => {
    tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));
    tabViews.forEach(view => {
      view.style.display = view.id === viewId ? 'flex' : 'none';
    });
    localStorage.setItem('LICHTRINH_ACTIVE_TAB', viewId);

    if (viewId === 'view-stats' && state.currentUser && state.currentRecord) {
      const stats = calculateStats();
      drawDailyProgressChart(stats.dailyCompletionRates);
      drawWeeklyProgressChart(stats.weeklyCompletionRates);
      drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
    } else if (viewId === 'view-journal') {
      setupJournalPanel();
    }
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.view || 'view-tracker'));
  });

  const savedTab = localStorage.getItem('LICHTRINH_ACTIVE_TAB');
  if (savedTab && document.getElementById(savedTab)) {
    showTab(savedTab);
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

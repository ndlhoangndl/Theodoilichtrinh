import { state } from './modules/state';
import { translateUI } from './modules/translations';
import { initAuth, setupPasswordToggles } from './modules/auth';
import { initProfile, renderProfilePage } from './modules/profile';
import { setupJournalPanel } from './modules/journal';
import { initGoals } from './modules/goals';
import { initHabits } from './modules/habits';
import { initTracker, initializeState, renderAll, calculateStats } from './modules/tracker';
import { initConfirmOverlay } from './modules/confirm';
import { getCurrentSession } from './storage';
import {
  drawDailyProgressChart,
  drawWeeklyProgressChart,
  drawOverallDonutChart,
  drawMoodMotivationTrendChart
} from './charts';

function initApp(): void {
  // Load language preference
  state.currentLang = (localStorage.getItem('LICHTRINH_LANG') || 'vi') as 'vi' | 'en';

  const sessionUser = getCurrentSession();
  const authContainer = document.getElementById('auth-container');
  const dashboardContainer = document.getElementById('dashboard-container');

  initAuth();
  setupPasswordToggles();
  initProfile();
  initGoals();
  initHabits();
  initTracker();
  initConfirmOverlay();

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
  const savedTheme = localStorage.getItem('LICHTRINH_THEME');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  if (sessionUser) {
    state.currentUser = sessionUser;
    if (authContainer) authContainer.style.display = 'none';
    if (dashboardContainer) dashboardContainer.style.display = 'block';

    initializeState();
    translateUI();
    setupJournalPanel();
    renderAll();
  } else {
    state.currentUser = null;
    if (authContainer) authContainer.style.display = 'flex';
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    translateUI();
  }

  // Bind Language Selector dropdown
  const selectLang = document.getElementById('select-lang') as HTMLSelectElement;
  if (selectLang) {
    selectLang.value = state.currentLang;
    selectLang.addEventListener('change', () => {
      state.currentLang = selectLang.value as 'vi' | 'en';
      localStorage.setItem('LICHTRINH_LANG', state.currentLang);
      
      translateUI();
      setupJournalPanel();
      renderAll();
    });
  }

  // Dark/Light Theme toggle button
  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      localStorage.setItem('LICHTRINH_THEME', isDark ? 'dark' : 'light');
      
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

  // Tabs Navigation switching (Moved to Dropdown Menu Items)
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

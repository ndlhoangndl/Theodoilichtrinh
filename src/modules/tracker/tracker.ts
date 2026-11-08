import { state, WEEK_DAYS_VN, WEEK_DAYS_EN } from '../common/state';
import { HabitStats, MonthRecord, Habit } from '../../types/types';
import { MONTH_NAMES, getDaysInMonth, getDayOfWeek } from '../../utils/calendar';
import { loadHabits, loadRecord, loadSelectedDate, saveSelectedDate, saveRecord, syncRecordFromServer } from '../../services/storage';
import {
  drawDailyProgressChart,
  drawWeeklyProgressChart,
  drawOverallDonutChart,
  drawMoodMotivationTrendChart
} from '../../services/charts';
import { triggerConfetti } from '../../utils/confetti';
import { showConfirm } from '../common/confirm';
import { renderGoalsList, renderWeeklyGoalsWeekSelect, renderWeeklyGoalsList } from '../goals/goals';
import { renderGarden } from './garden';
import { renderMemoryBook } from './review';
import { setupJournalPanel } from '../journal/journal';
import { TRANSLATIONS, translateUI } from '../common/translations';

const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: 'Dậy lúc 06:00', emoji: '⏰' },
  { id: 'h2', name: 'Thiền định', emoji: '🧘' },
  { id: 'h3', name: 'Tập Gym/Thể thao', emoji: '💪' },
  { id: 'h4', name: 'Tắm nước lạnh', emoji: '🚿' },
  { id: 'h5', name: 'Làm việc tập trung', emoji: '💻' },
  { id: 'h6', name: 'Đọc sách 10 trang', emoji: '📖' },
  { id: 'h7', name: 'Học kỹ năng mới', emoji: '📝' },
  { id: 'h8', name: 'Không ăn đường', emoji: '🍫' },
  { id: 'h9', name: 'Không bia rượu', emoji: '🍺' },
  { id: 'h10', name: 'Lập kế hoạch ngày', emoji: '🗒️' },
  { id: 'h11', name: 'Ngủ trước 23:00', emoji: '💤' }
];

// Initialize State
export function initializeState(): void {
  if (!state.currentUser) return;

  const username = state.currentUser.username;
  const dateInfo = loadSelectedDate();

  state.habits = loadHabits(username, DEFAULT_HABITS);
  state.currentYear = dateInfo.year;
  state.currentMonth = dateInfo.month;
  state.currentRecord = loadRecord(username, state.currentYear, state.currentMonth, state.habits);

  const today = new Date();
  if (today.getFullYear() === state.currentYear && today.getMonth() === state.currentMonth) {
    state.selectedWeekIdx = Math.floor((today.getDate() - 1) / 7);
  } else {
    state.selectedWeekIdx = 0;
  }
}

// Helper: Calculate Streak metrics for a checklist, dynamically traversing month boundaries
export function calculateStreak(
  habitId: string,
  checks: boolean[],
  username: string,
  startYear: number,
  startMonth: number,
  habits: Habit[]
): { currentStreak: number; maxStreak: number } {
  const today = new Date();
  const daysCount = checks.length;
  
  // 1. Calculate Local Max Streak in active month checks
  let localMaxStreak = 0;
  let runningStreak = 0;
  for (let i = 0; i < daysCount; i++) {
    if (checks[i]) {
      runningStreak++;
      if (runningStreak > localMaxStreak) {
        localMaxStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  // 2. Calculate Current Streak across month boundaries
  let currentStreak = 0;
  const isCurrentMonth = today.getFullYear() === startYear && today.getMonth() === startMonth;
  let startDay = isCurrentMonth ? today.getDate() : getDaysInMonth(startYear, startMonth);

  // Cache loaded records to avoid loading them repeatedly
  const recordCache: Record<string, MonthRecord> = {};
  const getRecord = (y: number, m: number): MonthRecord | null => {
    const key = `${y}_${m}`;
    if (recordCache[key] !== undefined) return recordCache[key];
    const rec = loadRecord(username, y, m, habits);
    recordCache[key] = rec;
    return rec;
  };

  const isChecked = (y: number, m: number, d: number): boolean => {
    const rec = getRecord(y, m);
    if (!rec) return false;
    const checksArr = rec.checks[habitId];
    return !!(checksArr && checksArr[d - 1]);
  };

  let traceYear = startYear;
  let traceMonth = startMonth;
  let traceDay = startDay;

  let isTodayChecked = isChecked(traceYear, traceMonth, traceDay);
  let isYesterdayChecked = false;

  if (!isTodayChecked && isCurrentMonth) {
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);
    
    isYesterdayChecked = isChecked(yesterdayDate.getFullYear(), yesterdayDate.getMonth(), yesterdayDate.getDate());
    if (isYesterdayChecked) {
      traceYear = yesterdayDate.getFullYear();
      traceMonth = yesterdayDate.getMonth();
      traceDay = yesterdayDate.getDate();
    }
  }

  if (isTodayChecked || isYesterdayChecked) {
    while (true) {
      if (isChecked(traceYear, traceMonth, traceDay)) {
        currentStreak++;
        traceDay--;
        if (traceDay < 1) {
          traceMonth--;
          if (traceMonth < 0) {
            traceMonth = 11;
            traceYear--;
          }
          traceDay = getDaysInMonth(traceYear, traceMonth);
        }
      } else {
        break;
      }
    }
  }

  const maxStreak = Math.max(localMaxStreak, currentStreak);
  return { currentStreak, maxStreak };
}

// Calculate habits & progress stats
export function calculateStats(): {
  totalGoal: number;
  totalCompleted: number;
  totalLeft: number;
  completionRate: number;
  habitStats: HabitStats[];
  dailyCompletionRates: number[];
  weeklyCompletionRates: number[];
} {
  const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);
  const totalHabits = state.habits.length;
  
  const totalGoal = totalHabits * daysCount;
  let totalCompleted = 0;

  // Calculate statistics per habit (including streaks)
  const habitStats: HabitStats[] = state.habits.map(h => {
    const checks = (state.currentRecord && state.currentRecord.checks[h.id]) || new Array(daysCount).fill(false);
    const actual = checks.filter(c => c).length;
    const goal = daysCount;
    const left = goal - actual;
    const progress = goal > 0 ? Math.round((actual / goal) * 100) : 0;
    totalCompleted += actual;

    const { currentStreak, maxStreak } = calculateStreak(
      h.id,
      checks,
      state.currentUser!.username,
      state.currentYear,
      state.currentMonth,
      state.habits
    );

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

  // Calculate daily completion rates
  const dailyCompletionRates: number[] = [];
  for (let d = 0; d < daysCount; d++) {
    let completedOnDay = 0;
    state.habits.forEach(h => {
      const checks = state.currentRecord?.checks[h.id];
      if (checks && checks[d]) {
        completedOnDay++;
      }
    });
    const rate = totalHabits > 0 ? Math.round((completedOnDay / totalHabits) * 100) : 0;
    dailyCompletionRates.push(rate);
  }

  // Calculate weekly completion rates
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
      state.habits.forEach(h => {
        const checks = state.currentRecord?.checks[h.id];
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

// Render listeners system to allow other modules to hook into the master render process
const renderListeners: (() => void)[] = [];
export function registerRenderListener(listener: () => void) {
  renderListeners.push(listener);
}

// Master Render Method
export function renderAll(): void {
  if (!state.currentUser || !state.currentRecord) return;
  const stats = calculateStats();
  
  // Render header info
  const monthDisplay = document.getElementById('current-month-display');
  if (monthDisplay) {
    if (state.currentLang === 'vi') {
      monthDisplay.textContent = `- THÁNG ${state.currentMonth + 1} / ${state.currentYear} -`;
    } else {
      const enMonth = MONTH_NAMES[state.currentMonth].toUpperCase();
      monthDisplay.textContent = `- ${enMonth} ${state.currentYear} -`;
    }
  }

  // Sync calendar selectors with state
  const selectYear = document.getElementById('select-year') as HTMLSelectElement;
  const selectMonth = document.getElementById('select-month') as HTMLSelectElement;
  if (selectYear) selectYear.value = state.currentYear.toString();
  if (selectMonth) selectMonth.value = state.currentMonth.toString();

  // Render stats labels
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

  // Render Weekly Goals list
  renderWeeklyGoalsWeekSelect();
  renderWeeklyGoalsList();

  // Render Habit Garden
  renderGarden();

  // Draw Charts
  drawDailyProgressChart(stats.dailyCompletionRates);
  drawWeeklyProgressChart(stats.weeklyCompletionRates);
  drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
  drawMoodMotivationTrendChart(state.currentYear, state.currentMonth, state.currentRecord);

  // Render Monthly Memory Book
  renderMemoryBook();

  // Call registered listeners
  renderListeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.error('Render listener error:', e);
    }
  });
}

// Render dynamic spreadsheet check tables
export function renderSpreadsheetGrid(habitStats: HabitStats[]): void {
  if (!state.currentUser || !state.currentRecord) return;
  const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);
  const dayNames = state.currentLang === 'vi' ? WEEK_DAYS_VN : WEEK_DAYS_EN;
  const today = new Date();

  // Update toggle button text dynamically
  const btnToggleCompactGrid = document.getElementById('btn-toggle-compact-grid');
  if (btnToggleCompactGrid) {
    if (state.isCompactGrid) {
      btnToggleCompactGrid.textContent = TRANSLATIONS[state.currentLang].btn_toggle_full || '📅 Đầy đủ';
    } else {
      btnToggleCompactGrid.textContent = TRANSLATIONS[state.currentLang].btn_toggle_compact || '📱 Thu gọn';
    }
  }

  // Show/Hide and update options for the compact week selector dropdown
  const selectWeekContainer = document.getElementById('select-week-container');
  const selectWeek = document.getElementById('select-week') as HTMLSelectElement;
  const weeksCount = daysCount > 28 ? 5 : 4;

  if (selectWeekContainer && selectWeek) {
    if (state.isCompactGrid) {
      selectWeekContainer.style.display = 'flex';
      
      // Keep selectedWeekIdx within bounds
      if (state.selectedWeekIdx >= weeksCount || state.selectedWeekIdx < 0) {
        state.selectedWeekIdx = 0;
      }
      
      let optionsHtml = '';
      const weekLabel = state.currentLang === 'vi' ? 'Tuần' : 'Week';
      for (let i = 0; i < weeksCount; i++) {
        optionsHtml += `<option value="${i}" ${state.selectedWeekIdx === i ? 'selected' : ''} style="color:var(--text-main); background:var(--bg-panel);">${weekLabel} ${i + 1}</option>`;
      }
      selectWeek.innerHTML = optionsHtml;
    } else {
      selectWeekContainer.style.display = 'none';
    }
  }

  // Calculate day range to show (by week if compact mode is enabled)
  const startDay = state.isCompactGrid ? (state.selectedWeekIdx * 7 + 1) : 1;
  const endDay = state.isCompactGrid ? Math.min(daysCount, startDay + 6) : daysCount;
  
  // 1. Render Week group header (e.g. Week 1, Week 2...)
  const weekHeader = document.getElementById('habit-grid-week-header');
  if (weekHeader) {
    const weekWord = state.currentLang === 'vi' ? 'Tuần' : 'Week';
    let html = `<th class="col-habit-name" rowspan="2">${state.currentLang === 'vi' ? 'Thói quen' : 'My Habits'}</th>`;
    
    if (state.isCompactGrid) {
      html += `<th colspan="${endDay - startDay + 1}" class="week-group-header">${weekWord} ${state.selectedWeekIdx + 1}</th>`;
    } else {
      html += `<th colspan="7" class="week-group-header">${weekWord} 1</th>`;
      html += `<th colspan="7" class="week-group-header">${weekWord} 2</th>`;
      html += `<th colspan="7" class="week-group-header">${weekWord} 3</th>`;
      html += `<th colspan="7" class="week-group-header">${weekWord} 4</th>`;
      
      const remainingDays = daysCount - 28;
      if (remainingDays > 0) {
        html += `<th colspan="${remainingDays}" class="week-group-header">${weekWord} 5</th>`;
      }
    }
    
    weekHeader.innerHTML = html;
  }

  // 2. Render Days and Dates row (with Clickable Journal indicators)
  const daysHeader = document.getElementById('habit-grid-header');
  if (daysHeader) {
    let html = '';
    for (let d = startDay; d <= endDay; d++) {
      const dayIdx = getDayOfWeek(state.currentYear, state.currentMonth, d);
      const dayName = dayNames[dayIdx];
      const isWeekend = (dayIdx === 0 || dayIdx === 6);
      
      const isToday = (today.getFullYear() === state.currentYear && today.getMonth() === state.currentMonth && today.getDate() === d);
      const cellClass = isToday 
        ? 'col-day-header today' 
        : (isWeekend ? 'col-day-header weekend' : 'col-day-header');
      
      const hasJournal = state.currentRecord.diary && state.currentRecord.diary[d - 1] && state.currentRecord.diary[d - 1].trim() !== '';
      const tooltipJournal = state.currentLang === 'vi' ? 'Có nhật ký' : 'Diary notes exist';
      const journalIndicator = hasJournal 
        ? `<div style="font-size: 8px; color: ${isToday ? '#ffffff' : 'var(--accent-orange)'}; margin-top:-2px;" title="${tooltipJournal}">✏️</div>` 
        : '';
      const headerTitle = state.currentLang === 'vi' ? 'Click để viết nhật ký ngày này' : 'Click to write diary for this day';

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
      // Avoid attaching listener to the first habit name column
      if (h.classList.contains('col-habit-name')) return;
      
      h.addEventListener('click', () => {
        if (!state.currentRecord) return;
        const dayIdx = parseInt(h.getAttribute('data-day') || '0');
        const selectDay = document.getElementById('select-journal-day') as HTMLSelectElement;
        const textarea = document.getElementById('textarea-journal') as HTMLTextAreaElement;

        if (selectDay && textarea) {
          selectDay.value = dayIdx.toString();
          textarea.value = state.currentRecord.diary[dayIdx] || '';
          
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
      const checks = state.currentRecord!.checks[h.id] || new Array(daysCount).fill(false);
      
      html += `<tr>`;
      html += `<td class="col-habit-name" title="${h.name}">${h.name}</td>`;
      
      for (let d = startDay - 1; d < endDay; d++) {
        const isChecked = checks[d];
        const dayOfWeekIdx = getDayOfWeek(state.currentYear, state.currentMonth, d + 1);
        const isWeekend = (dayOfWeekIdx === 0 || dayOfWeekIdx === 6);
        const cellClass = isWeekend ? 'cell-checkbox weekend' : 'cell-checkbox';
        
        const noteText = (state.currentRecord!.notes && state.currentRecord!.notes[h.id] && state.currentRecord!.notes[h.id][d]) || '';
        const noteIndicator = noteText ? `<div class="note-indicator"></div>` : '';
        const titleText = noteText ? `title="${state.currentLang === 'vi' ? 'Ghi chú' : 'Note'}: ${noteText.replace(/"/g, '&quot;')}"` : '';

        html += `
          <td class="${cellClass}" data-habit="${h.id}" data-day="${d}" ${titleText}>
            <input type="checkbox" class="habit-checkbox" ${isChecked ? 'checked' : ''}>
            ${noteIndicator}
          </td>
        `;
      }
      
      html += `</tr>`;
    });

    // 4. Render Mood Selector Row
    const labelMood = state.currentLang === 'vi' ? 'Mood (Tâm trạng)' : 'Mood';
    html += `<tr class="row-mental-state">`;
    html += `<td class="col-mental-label">${labelMood}</td>`;
    for (let d = startDay - 1; d < endDay; d++) {
      const rating = state.currentRecord.mood[d] || 0;
      html += `
        <td class="cell-mental-state">
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
    const labelMot = state.currentLang === 'vi' ? 'Motivation (Động lực)' : 'Motivation';
    html += `<tr class="row-mental-state">`;
    html += `<td class="col-mental-label">${labelMot}</td>`;
    for (let d = startDay - 1; d < endDay; d++) {
      const rating = state.currentRecord.motivation[d] || 0;
      html += `
        <td class="cell-mental-state">
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
        if (!state.currentUser || !state.currentRecord) return;
        const target = e.target as HTMLElement;
        const habitId = cell.getAttribute('data-habit') || '';
        const day = parseInt(cell.getAttribute('data-day') || '0');
        const checkbox = cell.querySelector('.habit-checkbox') as HTMLInputElement;

        if (target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }

        state.currentRecord.checks[habitId][day] = checkbox.checked;
        saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
        
        if (checkbox.checked) {
          let dayCompletedCount = 0;
          state.habits.forEach(h => {
            if (state.currentRecord!.checks[h.id] && state.currentRecord!.checks[h.id][day]) {
              dayCompletedCount++;
            }
          });
          
          if (dayCompletedCount === state.habits.length) {
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
        renderGarden();
      });

      cell.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.currentUser || !state.currentRecord) return;
        const habitId = cell.getAttribute('data-habit') || '';
        const day = parseInt(cell.getAttribute('data-day') || '0');
        const habitObj = state.habits.find(h => h.id === habitId);
        if (!habitObj) return;
        openHabitNoteModal(habitId, day, habitObj);
      });
    });

    // Attach Mood select events
    const moodSelects = gridBody.querySelectorAll('.select-mood');
    moodSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        if (!state.currentUser || !state.currentRecord) return;
        const el = e.target as HTMLSelectElement;
        const day = parseInt(el.getAttribute('data-day') || '0');
        state.currentRecord.mood[day] = parseInt(el.value);
        saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
        drawMoodMotivationTrendChart(state.currentYear, state.currentMonth, state.currentRecord);
      });
    });

    // Attach Motivation select events
    const motSelects = gridBody.querySelectorAll('.select-motivation');
    motSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        if (!state.currentUser || !state.currentRecord) return;
        const el = e.target as HTMLSelectElement;
        const day = parseInt(el.getAttribute('data-day') || '0');
        state.currentRecord.motivation[day] = parseInt(el.value);
        saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
        drawMoodMotivationTrendChart(state.currentYear, state.currentMonth, state.currentRecord);
      });
    });
  }
}

// Render Analysis Panel Table (with Streaks)
export function renderAnalysisTable(habitStats: HabitStats[]): void {
  const tableBody = document.getElementById('analysis-table-body');
  if (tableBody) {
    let html = '';
    
    habitStats.forEach(h => {
      const tooltipStreak = state.currentLang === 'vi' 
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
export function renderLeaderboard(habitStats: HabitStats[]): void {
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

async function switchAndSyncMonth(): Promise<void> {
  if (!state.currentUser) return;
  saveSelectedDate(state.currentYear, state.currentMonth);
  state.currentRecord = loadRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.habits);
  translateUI();
  setupJournalPanel();
  renderAll();

  await syncRecordFromServer(state.currentUser.username, state.currentYear, state.currentMonth);
  state.currentRecord = loadRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.habits);
  setupJournalPanel();
  renderAll();
}

export function initTracker(): void {
  // Bind calendar selector select elements
  const selectYear = document.getElementById('select-year') as HTMLSelectElement;
  const selectMonth = document.getElementById('select-month') as HTMLSelectElement;

  if (selectYear && selectMonth) {
    selectYear.addEventListener('change', () => {
      if (!state.currentUser) return;
      state.currentYear = parseInt(selectYear.value);
      switchAndSyncMonth();
    });

    selectMonth.addEventListener('change', () => {
      if (!state.currentUser) return;
      state.currentMonth = parseInt(selectMonth.value);
      switchAndSyncMonth();
    });
  }

  // Left/Right quick month navigation buttons
  const btnPrev = document.getElementById('btn-prev-month');
  const btnNextMonth = document.getElementById('btn-next-month');

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (!state.currentUser) return;
      state.currentMonth--;
      if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
        if (selectYear) selectYear.value = state.currentYear.toString();
      }
      if (selectMonth) selectMonth.value = state.currentMonth.toString();
      switchAndSyncMonth();
    });
  }

  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      if (!state.currentUser) return;
      state.currentMonth++;
      if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
        if (selectYear) selectYear.value = state.currentYear.toString();
      }
      if (selectMonth) selectMonth.value = state.currentMonth.toString();
      switchAndSyncMonth();
    });
  }

  // Clear tracking data of the current month (Reset button)
  const btnReset = document.getElementById('btn-reset-data');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (!state.currentUser || !state.currentRecord) return;
      const confirmed = await showConfirm(TRANSLATIONS[state.currentLang].confirm_reset);
      if (confirmed) {
        const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);
        
        // Clear all check logs
        state.habits.forEach(h => {
          state.currentRecord!.checks[h.id] = new Array(daysCount).fill(false);
        });
        
        // Clear mood, motivation, reflections diary & goals list
        state.currentRecord.mood = new Array(daysCount).fill(0);
        state.currentRecord.motivation = new Array(daysCount).fill(0);
        state.currentRecord.diary = new Array(daysCount).fill('');
        state.currentRecord.goals = [];
        state.currentRecord.weeklyGoals = [];
        state.currentRecord.wateredDays = [];
        state.currentRecord.notes = {};
        state.currentRecord.monthlyReview = undefined;

        saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);

        setupJournalPanel();
        renderAll();
      }
    });
  }

  // Compact grid toggle button
  const btnToggleCompactGrid = document.getElementById('btn-toggle-compact-grid');
  if (btnToggleCompactGrid) {
    btnToggleCompactGrid.addEventListener('click', () => {
      state.isCompactGrid = !state.isCompactGrid;
      
      const stats = calculateStats();
      renderSpreadsheetGrid(stats.habitStats);
    });
  }

  // Compact grid week selector dropdown
  const selectWeek = document.getElementById('select-week') as HTMLSelectElement;
  if (selectWeek) {
    selectWeek.addEventListener('change', () => {
      state.selectedWeekIdx = parseInt(selectWeek.value);
      const stats = calculateStats();
      renderSpreadsheetGrid(stats.habitStats);
    });
  }

  // Redraw graph plots on window resizes
  window.addEventListener('resize', () => {
    if (state.currentUser && state.currentRecord) {
      const stats = calculateStats();
      drawDailyProgressChart(stats.dailyCompletionRates);
      drawWeeklyProgressChart(stats.weeklyCompletionRates);
      drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
      drawMoodMotivationTrendChart(state.currentYear, state.currentMonth, state.currentRecord);
    }
  });
}

export function openHabitNoteModal(habitId: string, day: number, habitObj: Habit): void {
  const modal = document.getElementById('modal-habit-note') as HTMLElement;
  const label = document.getElementById('habit-note-context-label');
  const textarea = document.getElementById('textarea-habit-note') as HTMLTextAreaElement;
  const btnClose = modal?.querySelector('.modal-close-trigger');
  const btnCancel = modal?.querySelector('.btn-close-note');
  const btnSave = modal?.querySelector('.btn-save-note');

  if (!modal || !label || !textarea || !btnSave) return;

  const dayNum = day + 1;
  const emoji = habitObj.emoji;
  const name = habitObj.name;
  label.textContent = state.currentLang === 'vi' 
    ? `${emoji} ${name} - Ngày ${dayNum}` 
    : `${emoji} ${name} - Day ${dayNum}`;

  if (!state.currentRecord!.notes) {
    state.currentRecord!.notes = {};
  }
  if (!state.currentRecord!.notes[habitId]) {
    state.currentRecord!.notes[habitId] = new Array(getDaysInMonth(state.currentYear, state.currentMonth)).fill('');
  }
  textarea.value = state.currentRecord!.notes[habitId][day] || '';

  modal.classList.add('active');

  const handleSave = () => {
    if (!state.currentUser || !state.currentRecord) return;
    const noteText = textarea.value.trim();
    state.currentRecord.notes![habitId][day] = noteText;
    saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
    modal.classList.remove('active');
    renderAll();
    cleanup();
  };

  const handleClose = () => {
    modal.classList.remove('active');
    cleanup();
  };

  const cleanup = () => {
    btnSave.removeEventListener('click', handleSave);
    if (btnClose) btnClose.removeEventListener('click', handleClose);
    if (btnCancel) btnCancel.removeEventListener('click', handleClose);
  };

  btnSave.addEventListener('click', handleSave);
  if (btnClose) btnClose.addEventListener('click', handleClose);
  if (btnCancel) btnCancel.addEventListener('click', handleClose);
}

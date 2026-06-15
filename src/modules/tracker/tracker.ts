import { state, WEEK_DAYS_VN, WEEK_DAYS_EN } from '../common/state';
import { HabitStats, MonthRecord, Habit } from '../../types/types';
import { MONTH_NAMES, getDaysInMonth, getDayOfWeek } from '../../utils/calendar';
import { loadHabits, loadRecord, loadSelectedDate, saveSelectedDate, saveRecord, saveHabits } from '../../services/storage';
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
import { renderCoachInsights } from './coach';
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

function seedSampleData(username: string, year: number, month: number): void {
  const daysCount = getDaysInMonth(year, month);
  
  // Save default habits
  saveHabits(username, DEFAULT_HABITS);

  const checks: Record<string, boolean[]> = {};
  const sampleCheckedDays: Record<string, number[]> = {
    'h1': [1, 2, 3, 6, 13, 16, 20],
    'h2': [1, 2, 3, 4, 5, 6, 8, 9, 10, 13, 14, 16, 17, 19, 20, 21, 22],
    'h3': [1, 3, 4, 6, 8, 10, 13, 15, 20, 22],
    'h4': [1, 2, 3, 4, 8, 9, 13, 14, 16, 19],
    'h5': [1, 2, 4, 8, 9, 11, 13, 14, 16, 21, 22, 23, 26, 27, 29],
    'h6': [1, 2, 3, 4, 7, 8, 9, 10, 13, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25, 26],
    'h7': [1, 2, 4, 8, 9, 11, 13, 14, 16, 21],
    'h8': [1, 4, 5, 6, 8, 9, 11, 13, 19, 20],
    'h9': [1, 4, 5, 6, 8, 9, 19, 20, 21],
    'h10': [2, 3, 8, 13, 14, 15, 20, 21],
    'h11': [1, 2, 3, 8, 9, 13, 16, 17, 21]
  };

  DEFAULT_HABITS.forEach(h => {
    const arr = new Array(daysCount).fill(false);
    const checkedIndices = sampleCheckedDays[h.id] || [];
    checkedIndices.forEach(idx => {
      if (idx < daysCount) {
        arr[idx] = true;
      }
    });
    checks[h.id] = arr;
  });

  const mood = new Array(daysCount).fill(0);
  const motivation = new Array(daysCount).fill(0);
  for (let i = 0; i < Math.min(24, daysCount); i++) {
    mood[i] = Math.floor(Math.random() * 3) + 7;
    motivation[i] = Math.floor(Math.random() * 4) + 6;
  }

  const diary = new Array(daysCount).fill('');
  diary[1] = 'Hôm nay dậy sớm chạy bộ rất sảng khoái. Làm việc tập trung hiệu quả cao.';
  diary[4] = 'Có chút mệt mỏi vào buổi chiều nhưng đã thiền 15 phút nên lấy lại được năng lượng.';
  diary[8] = 'Ngày mới tràn đầy năng lượng, hoàn thành hết mục tiêu ngày đề ra!';

  const notes: Record<string, string[]> = {};
  DEFAULT_HABITS.forEach(h => {
    notes[h.id] = new Array(daysCount).fill('');
  });
  notes['h3'][1] = 'Tập ngực + tay sau 45p';
  notes['h3'][4] = 'Chạy bộ nhẹ nhàng 3km';
  notes['h6'][2] = 'Đọc chương 3 sách Tâm lý học hành vi';
  notes['h6'][8] = 'Đọc chương 4 sách Nghệ thuật tập trung';
  notes['h7'][9] = 'Học Javascript nâng cao (Closures)';

  const goals = [
    { id: 'g1', text: 'Thiền định ít nhất 20 ngày', completed: false, pinned: true },
    { id: 'g2', text: 'Đọc xong 2 cuốn sách', completed: true, pinned: false },
    { id: 'g3', text: 'Tập thể thao 3 buổi/tuần', completed: false, pinned: true }
  ];

  const weeklyGoals = [
    { id: 'w1', weekIndex: 0, text: 'Chạy bộ 5km', completed: true, pinned: true },
    { id: 'w2', weekIndex: 0, text: 'Ngủ sớm trước 23h cả tuần', completed: false, pinned: false },
    { id: 'w3', weekIndex: 1, text: 'Học 3 bài học lập trình mới', completed: true, pinned: true },
    { id: 'w4', weekIndex: 1, text: 'Không uống trà sữa', completed: false, pinned: false }
  ];

  const wateredDays = [1, 2, 3, 4, 8, 9, 10, 13, 14, 16, 21];

  const record: MonthRecord = {
    year,
    month,
    checks,
    mood,
    motivation,
    diary,
    goals,
    weeklyGoals,
    wateredDays,
    notes
  };

  saveRecord(username, year, month, record);
}

// Initialize State
export function initializeState(): void {
  if (!state.currentUser) return;

  const username = state.currentUser.username;
  const habitsKey = `LICHTRINH_${username}_HABITS`;
  const dateInfo = loadSelectedDate();

  const habitsRaw = localStorage.getItem(habitsKey);
  if (habitsRaw === null || habitsRaw === '[]') {
    seedSampleData(username, dateInfo.year, dateInfo.month);
  }

  state.habits = loadHabits(username, DEFAULT_HABITS);
  state.currentYear = dateInfo.year;
  state.currentMonth = dateInfo.month;
  state.currentRecord = loadRecord(username, state.currentYear, state.currentMonth, state.habits);
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

  // Render AI Coach Insights
  renderCoachInsights();

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
  
  // 1. Render Week group header (e.g. Week 1, Week 2...)
  const weekHeader = document.getElementById('habit-grid-week-header');
  if (weekHeader) {
    const weekWord = state.currentLang === 'vi' ? 'Tuần' : 'Week';
    let html = `<th class="col-habit-name" rowspan="2">${state.currentLang === 'vi' ? 'Thói quen' : 'My Habits'}</th>`;
    
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
      const dayIdx = getDayOfWeek(state.currentYear, state.currentMonth, d);
      const dayName = dayNames[dayIdx];
      const isWeekend = (dayIdx === 0 || dayIdx === 6);
      const cellClass = isWeekend ? 'col-day-header weekend' : 'col-day-header';
      
      const hasJournal = state.currentRecord.diary && state.currentRecord.diary[d - 1] && state.currentRecord.diary[d - 1].trim() !== '';
      const tooltipJournal = state.currentLang === 'vi' ? 'Có nhật ký' : 'Diary notes exist';
      const journalIndicator = hasJournal ? `<div style="font-size: 8px; color: var(--accent-orange); margin-top:-2px;" title="${tooltipJournal}">✏️</div>` : '';
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
      
      for (let d = 0; d < daysCount; d++) {
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
    for (let d = 0; d < daysCount; d++) {
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
    for (let d = 0; d < daysCount; d++) {
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

// Export active user profile, habits list, goals, mood ratings and journal reflections to JSON file
export function exportBackup(): void {
  if (!state.currentUser) return;
  const username = state.currentUser.username;
  const habitsKey = `LICHTRINH_${username}_HABITS`;
  const habitsRaw = localStorage.getItem(habitsKey) || '[]';
  
  const backupData: {
    username: string;
    fullName: string;
    email: string;
    habits: any[];
    records: Record<string, MonthRecord>;
  } = {
    username: state.currentUser.username,
    fullName: state.currentUser.fullName,
    email: state.currentUser.email,
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
export function importBackup(file: File): void {
  if (!state.currentUser) return;
  const username = state.currentUser.username;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target?.result as string;
    if (!content) return;
    
    try {
      const backupData = JSON.parse(content);
      
      // Simple validation: check if habits is array and records is object
      if (!backupData || !Array.isArray(backupData.habits) || typeof backupData.records !== 'object') {
        alert(TRANSLATIONS[state.currentLang].alert_backup_invalid || 'File sao lưu không đúng định dạng!');
        return;
      }
      
      const confirmed = await showConfirm(TRANSLATIONS[state.currentLang].confirm_restore);
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
      
      alert(TRANSLATIONS[state.currentLang].alert_restore_success || 'Khôi phục dữ liệu thành công!');
      window.location.reload();
    } catch (err) {
      console.error('Error parsing JSON backup file', err);
      alert(TRANSLATIONS[state.currentLang].alert_backup_invalid || 'File sao lưu không đúng định dạng!');
    }
  };
  reader.readAsText(file);
}

export function exportToCSV(): void {
  if (!state.currentUser || !state.currentRecord) return;
  
  const username = state.currentUser.username;
  const fullName = state.currentUser.fullName || username;
  const year = state.currentYear;
  const month = state.currentMonth;
  const daysCount = getDaysInMonth(year, month);
  
  const monthName = state.currentLang === 'vi' 
    ? `Tháng ${month + 1}` 
    : MONTH_NAMES[month];

  let csv = '';

  // 1. Title Meta
  csv += `BÁO CÁO LỊCH TRÌNH - ${monthName.toUpperCase()} / ${year}\n`;
  csv += `Người dùng,${fullName} (${username})\n`;
  csv += `Ngày xuất báo cáo,${new Date().toLocaleDateString()}\n\n`;

  // 2. Main Matrix Header
  csv += `Thói quen / Ngày,`;
  for (let d = 1; d <= daysCount; d++) {
    csv += `${d},`;
  }
  csv += `Đạt %,Chuỗi hiện tại\n`;

  // 3. Habits rows
  state.habits.forEach(h => {
    csv += `"${h.name.replace(/"/g, '""')}",`;
    const checks = state.currentRecord!.checks[h.id] || new Array(daysCount).fill(false);
    
    for (let d = 0; d < daysCount; d++) {
      const note = (state.currentRecord!.notes && state.currentRecord!.notes[h.id] && state.currentRecord!.notes[h.id][d]) || '';
      const checkVal = checks[d] ? 'x' : '';
      const cellVal = note ? `"${checkVal} (${note.replace(/"/g, '""')})"` : checkVal;
      csv += `${cellVal},`;
    }
    
    const actual = checks.filter(c => c).length;
    const progress = Math.round((actual / daysCount) * 100);
    const { currentStreak } = calculateStreak(h.id, checks, username, year, month, state.habits);
    csv += `${progress}%,${currentStreak}\n`;
  });

  // 4. Mood row
  csv += `Tâm trạng (Mood),`;
  for (let d = 0; d < daysCount; d++) {
    const mVal = state.currentRecord!.mood[d] || 0;
    csv += mVal > 0 ? `${mVal},` : ',';
  }
  csv += `,\n`;

  // 5. Motivation row
  csv += `Động lực (Motivation),`;
  for (let d = 0; d < daysCount; d++) {
    const motVal = state.currentRecord!.motivation[d] || 0;
    csv += motVal > 0 ? `${motVal},` : ',';
  }
  csv += `,\n`;

  // 6. Diary Reflections row
  csv += `Nhật ký (Reflections),`;
  for (let d = 0; d < daysCount; d++) {
    const diaryText = state.currentRecord!.diary[d] || '';
    csv += `"${diaryText.replace(/"/g, '""')}",`;
  }
  csv += `,\n\n`;

  // 7. Monthly Goals Section
  csv += `MỤC TIÊU TRONG THÁNG\n`;
  const mGoals = state.currentRecord!.goals || [];
  if (mGoals.length === 0) {
    csv += `Chưa đặt mục tiêu tháng,\n`;
  } else {
    mGoals.forEach(g => {
      const status = g.completed 
        ? (state.currentLang === 'vi' ? 'Hoàn thành' : 'Completed')
        : (state.currentLang === 'vi' ? 'Chưa hoàn thành' : 'Pending');
      csv += `"${g.text.replace(/"/g, '""')}",[${status}]\n`;
    });
  }
  csv += `\n`;

  // 8. Weekly Goals Section
  csv += `MỤC TIÊU TRONG TUẦN\n`;
  const wGoals = state.currentRecord!.weeklyGoals || [];
  const weekLabel = state.currentLang === 'vi' ? 'Tuần' : 'Week';
  
  const daysInMonth = getDaysInMonth(year, month);
  const weeksCount = daysInMonth > 28 ? 5 : 4;

  for (let w = 0; w < weeksCount; w++) {
    csv += `${weekLabel} ${w + 1}:\n`;
    const filtered = wGoals.filter(g => g.weekIndex === w);
    if (filtered.length === 0) {
      csv += `,Chưa đặt mục tiêu tuần\n`;
    } else {
      filtered.forEach(g => {
        const status = g.completed 
          ? (state.currentLang === 'vi' ? 'Hoàn thành' : 'Completed')
          : (state.currentLang === 'vi' ? 'Chưa hoàn thành' : 'Pending');
        csv += `,"${g.text.replace(/"/g, '""')}",[${status}]\n`;
      });
    }
  }

  // Prepend UTF-8 BOM to prevent Vietnamese Mojibake in Windows Excel
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const safeMonthName = monthName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `bao_cao_lich_trinh_${safeMonthName}_${year}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function initTracker(): void {
  // Bind calendar selector select elements
  const selectYear = document.getElementById('select-year') as HTMLSelectElement;
  const selectMonth = document.getElementById('select-month') as HTMLSelectElement;

  if (selectYear && selectMonth) {
    selectYear.addEventListener('change', () => {
      if (!state.currentUser) return;
      state.currentYear = parseInt(selectYear.value);
      saveSelectedDate(state.currentYear, state.currentMonth);
      state.currentRecord = loadRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.habits);
      
      translateUI();
      setupJournalPanel();
      renderAll();
    });

    selectMonth.addEventListener('change', () => {
      if (!state.currentUser) return;
      state.currentMonth = parseInt(selectMonth.value);
      saveSelectedDate(state.currentYear, state.currentMonth);
      state.currentRecord = loadRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.habits);
      
      translateUI();
      setupJournalPanel();
      renderAll();
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
      
      saveSelectedDate(state.currentYear, state.currentMonth);
      state.currentRecord = loadRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.habits);
      
      translateUI();
      setupJournalPanel();
      renderAll();
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
      
      saveSelectedDate(state.currentYear, state.currentMonth);
      state.currentRecord = loadRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.habits);
      
      translateUI();
      setupJournalPanel();
      renderAll();
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

        saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);

        setupJournalPanel();
        renderAll();
      }
    });
  }

  // JSON Backup button click trigger
  const btnBackup = document.getElementById('btn-backup-json');
  if (btnBackup) {
    btnBackup.addEventListener('click', () => {
      exportBackup();
    });
  }

  // JSON Restore button file trigger click
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

  // Excel Export button click trigger
  const btnExportExcel = document.getElementById('btn-export-excel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
      exportToCSV();
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

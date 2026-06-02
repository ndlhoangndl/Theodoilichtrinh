import { state, WEEK_DAYS_VN, WEEK_DAYS_EN } from './state';
import { HabitStats, MonthRecord } from '../types';
import { MONTH_NAMES, getDaysInMonth, getDayOfWeek } from '../calendar';
import { loadHabits, loadRecord, loadSelectedDate, saveSelectedDate, saveRecord, saveHabits } from '../storage';
import {
  drawDailyProgressChart,
  drawWeeklyProgressChart,
  drawOverallDonutChart,
  drawMoodMotivationTrendChart
} from '../charts';
import { triggerConfetti } from '../confetti';
import { showConfirm } from './confirm';
import { renderGoalsList } from './goals';
import { setupJournalPanel } from './journal';
import { TRANSLATIONS, translateUI } from './translations';

// Initialize State
export function initializeState(): void {
  if (!state.currentUser) return;
  state.habits = loadHabits(state.currentUser.username, []);

  const dateInfo = loadSelectedDate();
  state.currentYear = dateInfo.year;
  state.currentMonth = dateInfo.month;

  state.currentRecord = loadRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.habits);
}

// Helper: Calculate Streak metrics for a checklist
export function calculateStreak(checks: boolean[]): { currentStreak: number; maxStreak: number } {
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
  const isCurrentMonth = today.getFullYear() === state.currentYear && today.getMonth() === state.currentMonth;
  
  if (isCurrentMonth) {
    startIndex = Math.min(daysCount - 1, today.getDate() - 1);
  }

  let currentStreak = 0;
  
  if (startIndex >= 0) {
    // If today is checked or yesterday is checked, we trace back. Otherwise streak is 0.
    const isTodayChecked = checks[startIndex];
    const isYesterdayChecked = startIndex > 0 ? checks[startIndex - 1] : false;
    
    if (isTodayChecked || isYesterdayChecked) {
      // Trace back from the latest checked day
      const startTrace = isTodayChecked ? startIndex : startIndex - 1;
      for (let i = startTrace; i >= 0; i--) {
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

  // Draw Charts
  drawDailyProgressChart(stats.dailyCompletionRates);
  drawWeeklyProgressChart(stats.weeklyCompletionRates);
  drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
  drawMoodMotivationTrendChart(state.currentYear, state.currentMonth, state.currentRecord);
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
        
        html += `
          <td class="${cellClass}" data-habit="${h.id}" data-day="${d}">
            <input type="checkbox" class="habit-checkbox" ${isChecked ? 'checked' : ''}>
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
    const labelMot = state.currentLang === 'vi' ? 'Motivation (Động lực)' : 'Motivation';
    html += `<tr class="row-mental-state">`;
    html += `<td class="col-mental-label">${labelMot}</td>`;
    for (let d = 0; d < daysCount; d++) {
      const rating = state.currentRecord.motivation[d] || 0;
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

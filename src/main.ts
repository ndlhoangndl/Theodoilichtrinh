import { Habit, MonthRecord, HabitStats } from './types';
import { WEEK_DAYS, MONTH_NAMES, getDaysInMonth, getDayOfWeek } from './calendar';
import {
  loadHabits,
  saveHabits,
  loadRecord,
  saveRecord,
  loadSelectedDate,
  saveSelectedDate
} from './storage';
import {
  drawDailyProgressChart,
  drawWeeklyProgressChart,
  drawOverallDonutChart,
  drawMoodMotivationTrendChart
} from './charts';

// Global State
let habits: Habit[] = [];
let currentYear: number = 2026;
let currentMonth: number = 0; // 0 = Jan
let currentRecord: MonthRecord;

// Default seed list of habits
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

// Initialize State
function initializeState(): void {
  // Load habits list
  habits = loadHabits(DEFAULT_HABITS);

  // Load selection settings
  const dateInfo = loadSelectedDate();
  currentYear = dateInfo.year;
  currentMonth = dateInfo.month;

  // Load record
  currentRecord = loadRecord(currentYear, currentMonth, habits);
}

// Calculate Statistics and aggregates
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
  
  // Total Check Slots Goal
  const totalGoal = totalHabits * daysCount;
  let totalCompleted = 0;

  // Calculate statistics per habit
  const habitStats: HabitStats[] = habits.map(h => {
    const checks = currentRecord.checks[h.id] || new Array(daysCount).fill(false);
    const actual = checks.filter(c => c).length;
    const goal = daysCount;
    const left = goal - actual;
    const progress = goal > 0 ? Math.round((actual / goal) * 100) : 0;
    totalCompleted += actual;

    return {
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      goal,
      actual,
      left,
      progress
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

// Master Render Method
function renderAll(): void {
  const stats = calculateStats();
  
  // Render header details
  const monthDisplay = document.getElementById('current-month-display');
  if (monthDisplay) {
    monthDisplay.textContent = `- ${MONTH_NAMES[currentMonth].toUpperCase()} ${currentYear} -`;
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

  // Trigger SVG charts rendering
  drawDailyProgressChart(stats.dailyCompletionRates);
  drawWeeklyProgressChart(stats.weeklyCompletionRates);
  drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
  drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
}

// Render dynamic spreadsheet check tables
function renderSpreadsheetGrid(habitStats: HabitStats[]): void {
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  
  // 1. Render Week group header (e.g. Week 1, Week 2...)
  const weekHeader = document.getElementById('habit-grid-week-header');
  if (weekHeader) {
    let html = `<th class="col-habit-name" rowspan="2">My Habits</th>`;
    
    html += `<th colspan="7" class="week-group-header">Week 1</th>`;
    html += `<th colspan="7" class="week-group-header">Week 2</th>`;
    html += `<th colspan="7" class="week-group-header">Week 3</th>`;
    html += `<th colspan="7" class="week-group-header">Week 4</th>`;
    
    const remainingDays = daysCount - 28;
    if (remainingDays > 0) {
      html += `<th colspan="${remainingDays}" class="week-group-header">week 5</th>`;
    }
    
    weekHeader.innerHTML = html;
  }

  // 2. Render Days and Dates row
  const daysHeader = document.getElementById('habit-grid-header');
  if (daysHeader) {
    let html = '';
    for (let d = 1; d <= daysCount; d++) {
      const dayIdx = getDayOfWeek(currentYear, currentMonth, d);
      const dayName = WEEK_DAYS[dayIdx];
      const isWeekend = (dayIdx === 0 || dayIdx === 6);
      const cellClass = isWeekend ? 'col-day-header weekend' : 'col-day-header';
      
      html += `
        <th class="${cellClass}">
          <div>${dayName}</div>
          <div style="font-size: 11px; margin-top:2px; font-weight:700;">${d}</div>
        </th>
      `;
    }
    daysHeader.innerHTML = html;
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
    html += `<tr class="row-mental-state">`;
    html += `<td class="col-mental-label">Mood (Tâm trạng)</td>`;
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
    html += `<tr class="row-mental-state">`;
    html += `<td class="col-mental-label">Motivation (Động lực)</td>`;
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
        saveRecord(currentYear, currentMonth, currentRecord);
        
        // Recalculate states and trigger instant UI updates
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

    // Attach Mood dropdown change events
    const moodSelects = gridBody.querySelectorAll('.select-mood');
    moodSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const el = e.target as HTMLSelectElement;
        const day = parseInt(el.getAttribute('data-day') || '0');
        currentRecord.mood[day] = parseInt(el.value);
        saveRecord(currentYear, currentMonth, currentRecord);
        drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
      });
    });

    // Attach Motivation dropdown change events
    const motSelects = gridBody.querySelectorAll('.select-motivation');
    motSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const el = e.target as HTMLSelectElement;
        const day = parseInt(el.getAttribute('data-day') || '0');
        currentRecord.motivation[day] = parseInt(el.value);
        saveRecord(currentYear, currentMonth, currentRecord);
        drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
      });
    });
  }
}

// Render Analysis Side panel table
function renderAnalysisTable(habitStats: HabitStats[]): void {
  const tableBody = document.getElementById('analysis-table-body');
  if (tableBody) {
    let html = '';
    
    habitStats.forEach(h => {
      html += `
        <tr>
          <td class="col-align-left" title="${h.name}">${h.name}</td>
          <td>${h.goal}</td>
          <td style="color:var(--accent-green); font-weight:700;">${h.actual}</td>
          <td style="color:var(--text-muted);">${h.left}</td>
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

// Render Leaderboard Side panel list
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

// Render list editor modal for habits
function renderManageHabitsList(): void {
  const container = document.getElementById('modal-habit-list-container');
  if (container) {
    let html = '';
    habits.forEach((h, index) => {
      html += `
        <div class="modal-habit-item" data-id="${h.id}">
          <span class="modal-habit-drag-btn">☰</span>
          <input type="text" class="form-control modal-habit-emoji-input" value="${h.emoji}" style="width: 44px; text-align:center; padding: 4px;" maxlength="4">
          <input type="text" class="form-control modal-habit-name-input" value="${h.name}" style="flex:1; padding: 4px 8px;">
          <div style="display:flex; gap: 4px;">
            <button type="button" class="btn btn-icon btn-move-up" ${index === 0 ? 'disabled' : ''} title="Di chuyển lên">▲</button>
            <button type="button" class="btn btn-icon btn-move-down" ${index === habits.length - 1 ? 'disabled' : ''} title="Di chuyển xuống">▼</button>
            <button type="button" class="btn btn-icon btn-delete" style="color:#a94442; border-color:#ebccd1; background:#f2dede;" title="Xóa thói quen này">✕</button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

    // Attach reordering and deletion triggers
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

      // Delete habit
      item.querySelector('.btn-delete')?.addEventListener('click', () => {
        if (confirm(`Bạn có chắc chắn muốn xóa thói quen "${habits[index].name}"? Dữ liệu lịch sử đã check sẽ biến mất.`)) {
          habits.splice(index, 1);
          renderManageHabitsList();
        }
      });

      // Bind name/emoji updates on values edit
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

// Generate complete mock logs to demonstrate the application visual capacity
function seedDemoData(): void {
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  
  // Seed checks
  habits.forEach(h => {
    let successProbability = 0.5;
    
    if (h.name.includes('⏰')) successProbability = 0.75;
    else if (h.name.includes('🧘')) successProbability = 0.60;
    else if (h.name.includes('💪')) successProbability = 0.45;
    else if (h.name.includes('🚿')) successProbability = 0.50;
    else if (h.name.includes('📖')) successProbability = 0.65;
    else if (h.name.includes('🍫')) successProbability = 0.80;
    else if (h.name.includes('🍺')) successProbability = 0.85;
    else if (h.name.includes('💤')) successProbability = 0.55;

    const checkArray = new Array(daysCount);
    for (let d = 0; d < daysCount; d++) {
      const dayOfWeekIdx = getDayOfWeek(currentYear, currentMonth, d + 1);
      const isWeekend = (dayOfWeekIdx === 0 || dayOfWeekIdx === 6);
      
      let p = successProbability;
      if (isWeekend) {
        if (h.name.includes('⏰') || h.name.includes('💤')) p -= 0.25;
        else if (h.name.includes('💪')) p -= 0.15;
        else if (h.name.includes('🍺')) p -= 0.35;
      } else {
        p += 0.05;
      }
      
      checkArray[d] = Math.random() < p;
    }
    
    currentRecord.checks[h.id] = checkArray;
  });

  // Seed Mood and Motivation trends
  let lastMood = 6;
  let lastMot = 6;

  for (let d = 0; d < daysCount; d++) {
    const dayOfWeekIdx = getDayOfWeek(currentYear, currentMonth, d + 1);
    const isWeekend = (dayOfWeekIdx === 0 || dayOfWeekIdx === 6);

    const moodOffset = isWeekend ? 1.5 : -0.5;
    let nextMood = Math.round(lastMood + (Math.random() - 0.5) * 3 + moodOffset);
    nextMood = Math.max(3, Math.min(10, nextMood));
    currentRecord.mood[d] = nextMood;
    lastMood = nextMood;

    let nextMot = Math.round(lastMot + (Math.random() - 0.5) * 3 + (nextMood - 6) * 0.5);
    nextMot = Math.max(3, Math.min(10, nextMot));
    currentRecord.motivation[d] = nextMot;
    lastMot = nextMot;
  }

  saveRecord(currentYear, currentMonth, currentRecord);
  renderAll();
  alert('Đã nạp dữ liệu mẫu hoàn chỉnh cho tháng này! Hãy quan sát các biểu đồ tiến độ cập nhật.');
}

// Bind all interactive actions
function initApp(): void {
  initializeState();

  // Year / Month selectors
  const selectYear = document.getElementById('select-year') as HTMLSelectElement;
  const selectMonth = document.getElementById('select-month') as HTMLSelectElement;

  if (selectYear && selectMonth) {
    selectYear.value = currentYear.toString();
    selectMonth.value = currentMonth.toString();

    selectYear.addEventListener('change', () => {
      currentYear = parseInt(selectYear.value);
      saveSelectedDate(currentYear, currentMonth);
      currentRecord = loadRecord(currentYear, currentMonth, habits);
      renderAll();
    });

    selectMonth.addEventListener('change', () => {
      currentMonth = parseInt(selectMonth.value);
      saveSelectedDate(currentYear, currentMonth);
      currentRecord = loadRecord(currentYear, currentMonth, habits);
      renderAll();
    });
  }

  // Prev / Next month buttons
  const btnPrev = document.getElementById('btn-prev-month');
  const btnNext = document.getElementById('btn-next-month');

  if (btnPrev && btnNext) {
    btnPrev.addEventListener('click', () => {
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
      currentRecord = loadRecord(currentYear, currentMonth, habits);
      renderAll();
    });

    btnNext.addEventListener('click', () => {
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
      currentRecord = loadRecord(currentYear, currentMonth, habits);
      renderAll();
    });
  }

  // Reset/Clear monthly log
  const btnReset = document.getElementById('btn-reset-data');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Cảnh báo: Hành động này sẽ xóa sạch toàn bộ lịch sử thói quen và tâm trạng trong tháng hiện tại. Bạn có chắc chắn muốn làm mới?')) {
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
          motivation: new Array(daysCount).fill(0)
        };
        saveRecord(currentYear, currentMonth, currentRecord);
        renderAll();
      }
    });
  }

  // Seed data trigger
  const btnSeed = document.getElementById('btn-seed-data');
  if (btnSeed) {
    btnSeed.addEventListener('click', () => {
      seedDemoData();
    });
  }

  // Habit manager dialog triggers
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
      saveHabits(habits);
      // Reload current record using updated habit list
      currentRecord = loadRecord(currentYear, currentMonth, habits);
      renderAll();
      modal.classList.remove('active');
    });
  }

  // Form submit for new habits additions
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
    const stats = calculateStats();
    drawDailyProgressChart(stats.dailyCompletionRates);
    drawWeeklyProgressChart(stats.weeklyCompletionRates);
    drawOverallDonutChart(stats.completionRate, stats.totalCompleted, stats.totalLeft);
    drawMoodMotivationTrendChart(currentYear, currentMonth, currentRecord);
  });

  // Render initial page load
  renderAll();
}

window.addEventListener('DOMContentLoaded', initApp);

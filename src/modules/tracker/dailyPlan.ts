import { state, WEEK_DAYS_VN, WEEK_DAYS_EN } from '../common/state';
import { DayPlan, DailyTimeBlock } from '../../types/types';
import { getDaysInMonth, getDayOfWeek } from '../../utils/calendar';
import { saveRecord } from '../../services/storage';
import { triggerConfetti } from '../../utils/confetti';
import { renderWeeklyGoalsWeekSelect, renderWeeklyGoalsList } from '../goals/goals';

function getOrCreateDayPlan(dayIdx: number): DayPlan {
  if (!state.currentRecord) {
    return { focus: '', timeBlocks: [], goals: [] };
  }
  if (!state.currentRecord.dailyPlans) {
    state.currentRecord.dailyPlans = {};
  }
  const key = dayIdx.toString();
  if (!state.currentRecord.dailyPlans[key]) {
    state.currentRecord.dailyPlans[key] = {
      focus: '',
      timeBlocks: [],
      goals: []
    };
  } else {
    if (!state.currentRecord.dailyPlans[key].timeBlocks) {
      state.currentRecord.dailyPlans[key].timeBlocks = [];
    }
    if (!state.currentRecord.dailyPlans[key].goals) {
      state.currentRecord.dailyPlans[key].goals = [];
    }
    if (typeof state.currentRecord.dailyPlans[key].focus !== 'string') {
      state.currentRecord.dailyPlans[key].focus = '';
    }
  }
  return state.currentRecord.dailyPlans[key];
}

export function hasDayPlanContent(dayIdx: number): boolean {
  if (!state.currentRecord || !state.currentRecord.dailyPlans) return false;
  const plan = state.currentRecord.dailyPlans[dayIdx.toString()];
  if (!plan) return false;
  return !!(
    (plan.focus && plan.focus.trim() !== '') ||
    (plan.timeBlocks && plan.timeBlocks.length > 0) ||
    (plan.goals && plan.goals.length > 0)
  );
}

export function selectActiveDay(dayIdx: number, scrollToPanel = false): void {
  if (!state.currentRecord) return;
  const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);
  const clampedIdx = Math.max(0, Math.min(daysCount - 1, dayIdx));
  state.selectedDayIdx = clampedIdx;

  // Sync Journal day selector to the same day
  const selectJournalDay = document.getElementById('select-journal-day') as HTMLSelectElement;
  const textareaJournal = document.getElementById('textarea-journal') as HTMLTextAreaElement;
  if (selectJournalDay && textareaJournal) {
    selectJournalDay.value = clampedIdx.toString();
    textareaJournal.value = state.currentRecord.diary[clampedIdx] || '';
  }

  // Sync Weekly Goals panel to the week containing this day
  const weekOfSelectedDay = Math.min(4, Math.floor(clampedIdx / 7));
  if (state.currentGoalWeek !== weekOfSelectedDay) {
    state.currentGoalWeek = weekOfSelectedDay;
    const selectGoalWeek = document.getElementById('select-goal-week') as HTMLSelectElement;
    if (selectGoalWeek) {
      selectGoalWeek.value = weekOfSelectedDay.toString();
    }
    renderWeeklyGoalsWeekSelect();
    renderWeeklyGoalsList();
  }

  renderDailyPlanPanel();
  updateGridHeaderDayIndicators();

  if (scrollToPanel) {
    const panel = document.getElementById('panel-daily-planner');
    panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

export function updateGridHeaderDayIndicators(): void {
  const daysHeader = document.getElementById('habit-grid-header');
  if (!daysHeader || !state.currentRecord) return;

  const headers = daysHeader.querySelectorAll('th[data-day]');
  headers.forEach(th => {
    const dIdx = parseInt(th.getAttribute('data-day') || '0', 10);
    if (dIdx === state.selectedDayIdx) {
      th.classList.add('selected-day-col');
    } else {
      th.classList.remove('selected-day-col');
    }
  });
}

const CATEGORY_META: Record<
  DailyTimeBlock['category'],
  { icon: string; vi: string; en: string; color: string; bg: string }
> = {
  work: {
    icon: '💼',
    vi: 'Công việc',
    en: 'Work',
    color: 'var(--accent-brown)',
    bg: 'rgba(140, 98, 75, 0.14)'
  },
  study: {
    icon: '📚',
    vi: 'Học tập',
    en: 'Study',
    color: 'var(--accent-blue, #3b82f6)',
    bg: 'rgba(59, 130, 246, 0.14)'
  },
  health: {
    icon: '💪',
    vi: 'Sức khỏe',
    en: 'Health',
    color: 'var(--accent-green)',
    bg: 'rgba(74, 107, 93, 0.15)'
  },
  personal: {
    icon: '👤',
    vi: 'Cá nhân',
    en: 'Personal',
    color: 'var(--accent-orange)',
    bg: 'rgba(200, 128, 97, 0.15)'
  }
};

export function renderDailyPlanPanel(): void {
  if (!state.currentUser || !state.currentRecord) return;

  const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);
  if (state.selectedDayIdx >= daysCount || state.selectedDayIdx < 0) {
    state.selectedDayIdx = 0;
  }

  const dayIdx = state.selectedDayIdx;
  const dayNum = dayIdx + 1;
  const dayOfWeekIdx = getDayOfWeek(state.currentYear, state.currentMonth, dayNum);
  const dayNames = state.currentLang === 'vi' ? WEEK_DAYS_VN : WEEK_DAYS_EN;
  const dayName = dayNames[dayOfWeekIdx];
  const weekNum = Math.floor(dayIdx / 7) + 1;

  // 1. Populate Day Selector Dropdown
  const selectDay = document.getElementById('select-daily-plan-day') as HTMLSelectElement;
  if (selectDay) {
    let optionsHtml = '';
    for (let d = 1; d <= daysCount; d++) {
      const dow = getDayOfWeek(state.currentYear, state.currentMonth, d);
      const dName = dayNames[dow];
      const hasPlan = hasDayPlanContent(d - 1);
      const dot = hasPlan ? ' • 📌' : '';
      const label =
        state.currentLang === 'vi'
          ? `Ngày ${d}/${state.currentMonth + 1} (${dName})${dot}`
          : `Day ${d}/${state.currentMonth + 1} (${dName})${dot}`;
      optionsHtml += `<option value="${d - 1}" ${d - 1 === dayIdx ? 'selected' : ''} style="color:var(--text-main); background:var(--bg-panel);">${label}</option>`;
    }
    selectDay.innerHTML = optionsHtml;
  }

  // Update subtitle badge showing which week & day is active
  const badgeContext = document.getElementById('daily-plan-context-badge');
  if (badgeContext) {
    badgeContext.textContent =
      state.currentLang === 'vi'
        ? `${dayName}, Ngày ${dayNum}/${state.currentMonth + 1}/${state.currentYear} • Tuần ${weekNum}`
        : `${dayName}, ${dayNum}/${state.currentMonth + 1}/${state.currentYear} • Week ${weekNum}`;
  }

  const dayPlan = getOrCreateDayPlan(dayIdx);

  // 2. Populate Daily Focus Input
  const inputFocus = document.getElementById('input-daily-focus') as HTMLInputElement;
  if (inputFocus && document.activeElement !== inputFocus) {
    inputFocus.value = dayPlan.focus || '';
  }

  // 3. Render Time-blocks Schedule List
  const tbContainer = document.getElementById('daily-timeblocks-list');
  const tbRatio = document.getElementById('daily-timeblocks-ratio');
  if (tbContainer) {
    const blocks = [...(dayPlan.timeBlocks || [])].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    const completedBlocks = blocks.filter(b => b.completed).length;

    if (tbRatio) {
      tbRatio.textContent = `${completedBlocks}/${blocks.length}`;
    }

    if (blocks.length === 0) {
      tbContainer.innerHTML = `
        <div style="text-align:center; font-size:12px; color:var(--text-muted); padding: 18px 10px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
          ${
            state.currentLang === 'vi'
              ? `Chưa có khung giờ nào cho Ngày ${dayNum}/${state.currentMonth + 1}. Hãy thêm lịch trình bên trên hoặc sao chép từ ngày trước!`
              : `No time-blocks scheduled for Day ${dayNum}/${state.currentMonth + 1}. Add one above!`
          }
        </div>
      `;
    } else {
      let html = '';
      blocks.forEach(tb => {
        const cat = CATEGORY_META[tb.category] || CATEGORY_META.work;
        const catLabel = state.currentLang === 'vi' ? cat.vi : cat.en;
        html += `
          <div class="daily-tb-item ${tb.completed ? 'completed' : ''}" data-id="${tb.id}" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:var(--radius-sm); background:var(--bg-widget); border:1px solid var(--border-color); border-left: 3px solid ${cat.color}; transition: var(--transition);">
            <div class="daily-tb-left" style="display:flex; align-items:center; gap:8px; flex:1; cursor:pointer; min-width:0;">
              <input type="checkbox" class="daily-tb-checkbox" ${tb.completed ? 'checked' : ''} style="cursor:pointer; width:15px; height:15px; accent-color:var(--accent-green); flex-shrink:0;">
              <span style="font-size:11px; font-weight:700; font-family:monospace; padding:2px 6px; border-radius:4px; background:var(--bg-selected); color:var(--text-main); flex-shrink:0;">
                ${tb.startTime} - ${tb.endTime}
              </span>
              <span style="font-size:10px; font-weight:600; padding:2px 6px; border-radius:10px; background:${cat.bg}; color:${cat.color}; flex-shrink:0;">
                ${cat.icon} ${catLabel}
              </span>
              <span style="font-size:12px; font-weight:600; color:var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; ${tb.completed ? 'text-decoration:line-through; opacity:0.6;' : ''}" title="${tb.title.replace(/"/g, '&quot;')}">
                ${tb.title}
              </span>
            </div>
            <button type="button" class="daily-tb-delete" title="Xóa khung giờ" style="border:none; background:transparent; color:var(--text-muted); cursor:pointer; font-size:13px; padding:2px 6px;">✕</button>
          </div>
        `;
      });
      tbContainer.innerHTML = html;

      tbContainer.querySelectorAll('.daily-tb-item').forEach(item => {
        const tbId = item.getAttribute('data-id') || '';

        item.querySelector('.daily-tb-left')?.addEventListener('click', (e) => {
          if (!state.currentUser || !state.currentRecord) return;
          const target = e.target as HTMLElement;
          const cb = item.querySelector('.daily-tb-checkbox') as HTMLInputElement;
          if (target !== cb) {
            cb.checked = !cb.checked;
          }
          const plan = getOrCreateDayPlan(state.selectedDayIdx);
          const found = plan.timeBlocks.find(b => b.id === tbId);
          if (found) {
            found.completed = cb.checked;
            saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
            if (found.completed && plan.timeBlocks.every(b => b.completed)) {
              triggerConfetti();
            }
            renderDailyPlanPanel();
          }
        });

        item.querySelector('.daily-tb-delete')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!state.currentUser || !state.currentRecord) return;
          const plan = getOrCreateDayPlan(state.selectedDayIdx);
          plan.timeBlocks = plan.timeBlocks.filter(b => b.id !== tbId);
          saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
          renderDailyPlanPanel();
        });
      });
    }
  }

  // 4. Render Daily Goals Checklist
  const goalsContainer = document.getElementById('daily-goals-list-container');
  const goalsRatio = document.getElementById('daily-goals-progress-ratio');
  if (goalsContainer) {
    const rawGoals = dayPlan.goals || [];
    const goals = [...rawGoals].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    const completedCount = goals.filter(g => g.completed).length;

    if (goalsRatio) {
      goalsRatio.textContent = `${completedCount}/${goals.length}`;
    }

    if (goals.length === 0) {
      goalsContainer.innerHTML = `
        <div style="text-align:center; font-size:12px; color:var(--text-muted); padding: 18px 10px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
          ${
            state.currentLang === 'vi'
              ? `Chưa có mục tiêu riêng cho Ngày ${dayNum}/${state.currentMonth + 1}. Hãy đặt 1-3 mục tiêu quan trọng nhất của ngày này!`
              : `No daily goals set for Day ${dayNum}/${state.currentMonth + 1}.`
          }
        </div>
      `;
    } else {
      let html = '';
      goals.forEach(goal => {
        html += `
          <div class="goal-item ${goal.completed ? 'completed' : ''} ${goal.pinned ? 'pinned' : ''}" data-id="${goal.id}">
            <div class="goal-left-side">
              <input type="checkbox" class="goal-checkbox-native" ${goal.completed ? 'checked' : ''}>
              <span class="goal-text">${goal.text}</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <button type="button" class="goal-pin-btn" title="${goal.pinned ? 'Bỏ ghim' : 'Ghim ưu tiên'}">📌</button>
              <button type="button" class="goal-delete-btn" title="Xóa mục tiêu ngày">✕</button>
            </div>
          </div>
        `;
      });
      goalsContainer.innerHTML = html;

      goalsContainer.querySelectorAll('.goal-item').forEach(item => {
        const goalId = item.getAttribute('data-id') || '';

        item.querySelector('.goal-left-side')?.addEventListener('click', (e) => {
          if (!state.currentUser || !state.currentRecord) return;
          const target = e.target as HTMLElement;
          const cb = item.querySelector('.goal-checkbox-native') as HTMLInputElement;
          if (target !== cb) {
            cb.checked = !cb.checked;
          }
          const plan = getOrCreateDayPlan(state.selectedDayIdx);
          const found = plan.goals.find(g => g.id === goalId);
          if (found) {
            found.completed = cb.checked;
            saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
            if (found.completed && plan.goals.every(g => g.completed)) {
              triggerConfetti();
            }
            renderDailyPlanPanel();
          }
        });

        item.querySelector('.goal-pin-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!state.currentUser || !state.currentRecord) return;
          const plan = getOrCreateDayPlan(state.selectedDayIdx);
          const found = plan.goals.find(g => g.id === goalId);
          if (found) {
            found.pinned = !found.pinned;
            saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
            renderDailyPlanPanel();
          }
        });

        item.querySelector('.goal-delete-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!state.currentUser || !state.currentRecord) return;
          const plan = getOrCreateDayPlan(state.selectedDayIdx);
          plan.goals = plan.goals.filter(g => g.id !== goalId);
          saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
          renderDailyPlanPanel();
        });
      });
    }
  }
}

export function initDailyPlan(): void {
  const selectDay = document.getElementById('select-daily-plan-day') as HTMLSelectElement;
  const btnPrev = document.getElementById('btn-daily-prev');
  const btnToday = document.getElementById('btn-daily-today');
  const btnNext = document.getElementById('btn-daily-next');
  const btnCopyPrev = document.getElementById('btn-copy-prev-day-schedule');
  const inputFocus = document.getElementById('input-daily-focus') as HTMLInputElement;
  const formAddTb = document.getElementById('form-add-timeblock') as HTMLFormElement;
  const formAddGoal = document.getElementById('form-add-daily-goal') as HTMLFormElement;

  if (selectDay) {
    selectDay.addEventListener('change', () => {
      selectActiveDay(parseInt(selectDay.value, 10));
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (state.selectedDayIdx > 0) {
        selectActiveDay(state.selectedDayIdx - 1);
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);
      if (state.selectedDayIdx < daysCount - 1) {
        selectActiveDay(state.selectedDayIdx + 1);
      }
    });
  }

  if (btnToday) {
    btnToday.addEventListener('click', () => {
      const today = new Date();
      const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);
      const targetIdx = Math.min(daysCount - 1, today.getDate() - 1);
      selectActiveDay(targetIdx);
    });
  }

  if (btnCopyPrev) {
    btnCopyPrev.addEventListener('click', () => {
      if (!state.currentUser || !state.currentRecord) return;
      if (state.selectedDayIdx <= 0) {
        alert(
          state.currentLang === 'vi'
            ? 'Đây là ngày đầu tiên của tháng nên không có ngày trước đó trong tháng để sao chép!'
            : 'This is the first day of the month!'
        );
        return;
      }
      const prevPlan = getOrCreateDayPlan(state.selectedDayIdx - 1);
      if (!prevPlan.timeBlocks || prevPlan.timeBlocks.length === 0) {
        alert(
          state.currentLang === 'vi'
            ? `Ngày ${state.selectedDayIdx} chưa có khung giờ nào để sao chép!`
            : `Previous day has no time-blocks to copy!`
        );
        return;
      }

      const currentPlan = getOrCreateDayPlan(state.selectedDayIdx);
      const copiedBlocks: DailyTimeBlock[] = prevPlan.timeBlocks.map((tb, idx) => ({
        ...tb,
        id: `tb_${Date.now()}_${idx}`,
        completed: false
      }));
      currentPlan.timeBlocks = [...currentPlan.timeBlocks, ...copiedBlocks];
      saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
      renderDailyPlanPanel();
    });
  }

  if (inputFocus) {
    inputFocus.addEventListener('input', () => {
      if (!state.currentUser || !state.currentRecord) return;
      const plan = getOrCreateDayPlan(state.selectedDayIdx);
      plan.focus = inputFocus.value;
      saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
    });
  }

  if (formAddTb) {
    formAddTb.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.currentUser || !state.currentRecord) return;

      const inputStart = document.getElementById('input-tb-start') as HTMLInputElement;
      const inputEnd = document.getElementById('input-tb-end') as HTMLInputElement;
      const selectCat = document.getElementById('select-tb-category') as HTMLSelectElement;
      const inputTitle = document.getElementById('input-tb-title') as HTMLInputElement;

      if (!inputStart || !inputEnd || !selectCat || !inputTitle) return;
      const title = inputTitle.value.trim();
      if (!title) return;

      const startTime = inputStart.value || '08:00';
      const endTime = inputEnd.value || '09:30';

      const plan = getOrCreateDayPlan(state.selectedDayIdx);
      plan.timeBlocks.push({
        id: 'tb_' + Date.now(),
        startTime,
        endTime,
        category: (selectCat.value as DailyTimeBlock['category']) || 'work',
        title,
        completed: false
      });

      saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
      inputTitle.value = '';
      // Advance default start/end time convenience for the next block
      inputStart.value = endTime;
      const [h, m] = endTime.split(':').map(Number);
      const nextHour = Math.min(23, h + 1);
      inputEnd.value = `${String(nextHour).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;

      renderDailyPlanPanel();
    });
  }

  if (formAddGoal) {
    formAddGoal.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.currentUser || !state.currentRecord) return;

      const inputGoal = document.getElementById('input-new-daily-goal') as HTMLInputElement;
      if (!inputGoal) return;
      const text = inputGoal.value.trim();
      if (!text) return;

      const plan = getOrCreateDayPlan(state.selectedDayIdx);
      plan.goals.push({
        id: 'dg_' + Date.now(),
        text,
        completed: false,
        pinned: false
      });

      saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
      inputGoal.value = '';
      renderDailyPlanPanel();
    });
  }
}

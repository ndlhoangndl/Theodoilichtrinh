import { state } from '../common/state';
import { TRANSLATIONS } from '../common/translations';
import { saveRecord } from '../../services/storage';
import { triggerConfetti } from '../../utils/confetti';
import { showConfirm } from '../common/confirm';
import { getDaysInMonth } from '../../utils/calendar';

export function renderGoalsList(): void {
  if (!state.currentUser || !state.currentRecord) return;
  const listContainer = document.getElementById('goals-list-container');
  const ratioLabel = document.getElementById('goals-progress-ratio');

  if (listContainer) {
    const rawGoals = state.currentRecord.goals || [];
    const goals = [...rawGoals].sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      return bPinned - aPinned;
    });
    const completedCount = goals.filter(g => g.completed).length;
    const totalCount = goals.length;

    if (ratioLabel) {
      ratioLabel.textContent = `${completedCount}/${totalCount}`;
    }

    if (totalCount === 0) {
      listContainer.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--text-muted); padding: 12px 0;">${TRANSLATIONS[state.currentLang].no_goals_message}</div>`;
      return;
    }

    let html = '';
    goals.forEach(goal => {
      html += `
        <div class="goal-item ${goal.completed ? 'completed' : ''} ${goal.pinned ? 'pinned' : ''}" data-id="${goal.id}">
          <div class="goal-left-side">
            <input type="checkbox" class="goal-checkbox-native" ${goal.completed ? 'checked' : ''}>
            <span class="goal-text">${goal.text}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="goal-pin-btn" title="${goal.pinned ? 'Bỏ ghim / Unpin' : 'Ghim lên đầu / Pin to top'}">📌</button>
            <button class="goal-delete-btn" title="${TRANSLATIONS[state.currentLang].confirm_delete_goal}">✕</button>
          </div>
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
        if (!state.currentUser || !state.currentRecord) return;
        const target = e.target as HTMLElement;
        const nativeCheckbox = item.querySelector('.goal-checkbox-native') as HTMLInputElement;
        
        if (target !== nativeCheckbox) {
          nativeCheckbox.checked = !nativeCheckbox.checked;
        }

        const goalObj = state.currentRecord.goals.find(g => g.id === goalId);
        if (goalObj) {
          goalObj.completed = nativeCheckbox.checked;
          saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
          
          if (goalObj.completed) {
            triggerConfetti();
          }

          renderGoalsList();
        }
      });

      // Delete Goal (with translated custom confirm dialog)
      item.querySelector('.goal-delete-btn')?.addEventListener('click', async (e) => {
        if (!state.currentUser || !state.currentRecord) return;
        e.stopPropagation();
        const confirmed = await showConfirm(TRANSLATIONS[state.currentLang].confirm_delete_goal);
        if (confirmed) {
          state.currentRecord.goals = state.currentRecord.goals.filter(g => g.id !== goalId);
          saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
          renderGoalsList();
        }
      });

      // Toggle pin state
      item.querySelector('.goal-pin-btn')?.addEventListener('click', (e) => {
        if (!state.currentUser || !state.currentRecord) return;
        e.stopPropagation();
        const goalObj = state.currentRecord.goals.find(g => g.id === goalId);
        if (goalObj) {
          goalObj.pinned = !goalObj.pinned;
          saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
          renderGoalsList();
        }
      });
    });
  }
}

export function initGoals(): void {
  // Add new monthly Goal form submit
  const formAddGoal = document.getElementById('form-add-goal') as HTMLFormElement;
  const inputGoalText = document.getElementById('input-new-goal') as HTMLInputElement;

  if (formAddGoal && inputGoalText) {
    formAddGoal.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.currentUser || !state.currentRecord) return;
      const text = inputGoalText.value.trim();
      
      if (text) {
        const id = 'g_' + Date.now();
        if (!state.currentRecord.goals) {
          state.currentRecord.goals = [];
        }
        state.currentRecord.goals.push({ id, text, completed: false });
        saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
        
        inputGoalText.value = '';
        renderGoalsList();
      }
    });
  }

  // Bind calendar weekly goal select changes
  const selectGoalWeek = document.getElementById('select-goal-week') as HTMLSelectElement;
  if (selectGoalWeek) {
    selectGoalWeek.addEventListener('change', () => {
      state.currentGoalWeek = parseInt(selectGoalWeek.value);
      renderWeeklyGoalsList();
    });
  }

  // Add new weekly Goal form submit
  const formAddWeeklyGoal = document.getElementById('form-add-weekly-goal') as HTMLFormElement;
  const inputWeeklyGoalText = document.getElementById('input-new-weekly-goal') as HTMLInputElement;

  if (formAddWeeklyGoal && inputWeeklyGoalText) {
    formAddWeeklyGoal.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.currentUser || !state.currentRecord) return;
      const text = inputWeeklyGoalText.value.trim();
      
      if (text) {
        const id = 'wg_' + Date.now();
        if (!state.currentRecord.weeklyGoals) {
          state.currentRecord.weeklyGoals = [];
        }
        state.currentRecord.weeklyGoals.push({
          id,
          weekIndex: state.currentGoalWeek,
          text,
          completed: false
        });
        saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
        
        inputWeeklyGoalText.value = '';
        renderWeeklyGoalsList();
      }
    });
  }

  // Tab switcher in merged goals panel
  const btnMonth = document.getElementById('goals-tab-btn-month');
  const btnWeek = document.getElementById('goals-tab-btn-week');
  const subviewMonth = document.getElementById('goals-subview-month');
  const subviewWeek = document.getElementById('goals-subview-week');

  if (btnMonth && btnWeek && subviewMonth && subviewWeek) {
    btnMonth.addEventListener('click', () => {
      btnMonth.classList.add('active');
      btnWeek.classList.remove('active');
      subviewMonth.style.display = 'flex';
      subviewWeek.style.display = 'none';
    });

    btnWeek.addEventListener('click', () => {
      btnWeek.classList.add('active');
      btnMonth.classList.remove('active');
      subviewMonth.style.display = 'none';
      subviewWeek.style.display = 'flex';
      
      renderWeeklyGoalsWeekSelect();
      renderWeeklyGoalsList();
    });
  }
}

let lastRenderedYear = -1;
let lastRenderedMonth = -1;

export function renderWeeklyGoalsWeekSelect(): void {
  if (!state.currentUser || !state.currentRecord) return;
  const selectGoalWeek = document.getElementById('select-goal-week') as HTMLSelectElement;
  if (!selectGoalWeek) return;

  const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);
  const weeksCount = daysCount > 28 ? 5 : 4;
  const weekLabel = state.currentLang === 'vi' ? 'Tuần' : 'Week';

  let selectedIdx = state.currentGoalWeek;

  // If the active month or year changed since last render, or if selectedIdx is invalid, reset to default week
  if (state.currentYear !== lastRenderedYear || state.currentMonth !== lastRenderedMonth || selectedIdx >= weeksCount || selectedIdx < 0) {
    const today = new Date();
    if (today.getFullYear() === state.currentYear && today.getMonth() === state.currentMonth) {
      const day = today.getDate();
      if (day <= 7) selectedIdx = 0;
      else if (day <= 14) selectedIdx = 1;
      else if (day <= 21) selectedIdx = 2;
      else if (day <= 28) selectedIdx = 3;
      else selectedIdx = 4;
    } else {
      selectedIdx = 0;
    }
    state.currentGoalWeek = selectedIdx;
    lastRenderedYear = state.currentYear;
    lastRenderedMonth = state.currentMonth;
  }

  let html = '';
  for (let i = 0; i < weeksCount; i++) {
    html += `<option value="${i}" ${selectedIdx === i ? 'selected' : ''} style="color:var(--text-main); background:var(--bg-panel);">${weekLabel} ${i + 1}</option>`;
  }
  selectGoalWeek.innerHTML = html;
}

export function renderWeeklyGoalsList(): void {
  if (!state.currentUser || !state.currentRecord) return;
  const listContainer = document.getElementById('weekly-goals-list-container');
  const ratioLabel = document.getElementById('weekly-goals-progress-ratio');

  if (listContainer) {
    const allWeeklyGoals = state.currentRecord.weeklyGoals || [];
    const rawGoals = allWeeklyGoals.filter(g => g.weekIndex === state.currentGoalWeek);
    const goals = [...rawGoals].sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      return bPinned - aPinned;
    });
    const completedCount = goals.filter(g => g.completed).length;
    const totalCount = goals.length;

    if (ratioLabel) {
      ratioLabel.textContent = `${completedCount}/${totalCount}`;
    }

    if (totalCount === 0) {
      listContainer.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--text-muted); padding: 12px 0;">${TRANSLATIONS[state.currentLang].no_weekly_goals_message || 'No goals set for this week.'}</div>`;
      return;
    }

    let html = '';
    goals.forEach(goal => {
      html += `
        <div class="goal-item ${goal.completed ? 'completed' : ''} ${goal.pinned ? 'pinned' : ''}" data-id="${goal.id}">
          <div class="goal-left-side">
            <input type="checkbox" class="goal-checkbox-native" ${goal.completed ? 'checked' : ''}>
            <span class="goal-text">${goal.text}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="goal-pin-btn" title="${goal.pinned ? 'Bỏ ghim / Unpin' : 'Ghim lên đầu / Pin to top'}">📌</button>
            <button class="goal-delete-btn" title="${TRANSLATIONS[state.currentLang].confirm_delete_weekly_goal || 'Delete'}">✕</button>
          </div>
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
        if (!state.currentUser || !state.currentRecord) return;
        const target = e.target as HTMLElement;
        const nativeCheckbox = item.querySelector('.goal-checkbox-native') as HTMLInputElement;
        
        if (target !== nativeCheckbox) {
          nativeCheckbox.checked = !nativeCheckbox.checked;
        }

        const goalObj = state.currentRecord.weeklyGoals?.find(g => g.id === goalId);
        if (goalObj) {
          goalObj.completed = nativeCheckbox.checked;
          saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
          
          if (goalObj.completed) {
            triggerConfetti();
          }

          renderWeeklyGoalsList();
        }
      });

      // Delete Goal
      item.querySelector('.goal-delete-btn')?.addEventListener('click', async (e) => {
        if (!state.currentUser || !state.currentRecord) return;
        e.stopPropagation();
        const confirmed = await showConfirm(TRANSLATIONS[state.currentLang].confirm_delete_weekly_goal || 'Delete?');
        if (confirmed && state.currentRecord.weeklyGoals) {
          state.currentRecord.weeklyGoals = state.currentRecord.weeklyGoals.filter(g => g.id !== goalId);
          saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
          renderWeeklyGoalsList();
        }
      });

      // Toggle pin state
      item.querySelector('.goal-pin-btn')?.addEventListener('click', (e) => {
        if (!state.currentUser || !state.currentRecord) return;
        e.stopPropagation();
        const goalObj = state.currentRecord.weeklyGoals?.find(g => g.id === goalId);
        if (goalObj) {
          goalObj.pinned = !goalObj.pinned;
          saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
          renderWeeklyGoalsList();
        }
      });
    });
  }
}

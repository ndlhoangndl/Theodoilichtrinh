import { state } from './state';
import { TRANSLATIONS } from './translations';
import { saveRecord } from '../storage';
import { triggerConfetti } from '../confetti';
import { showConfirm } from './confirm';

export function renderGoalsList(): void {
  if (!state.currentUser || !state.currentRecord) return;
  const listContainer = document.getElementById('goals-list-container');
  const ratioLabel = document.getElementById('goals-progress-ratio');

  if (listContainer) {
    const goals = state.currentRecord.goals || [];
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
        <div class="goal-item ${goal.completed ? 'completed' : ''}" data-id="${goal.id}">
          <div class="goal-left-side">
            <input type="checkbox" class="goal-checkbox-native" ${goal.completed ? 'checked' : ''}>
            <span class="goal-text">${goal.text}</span>
          </div>
          <button class="goal-delete-btn" title="${TRANSLATIONS[state.currentLang].confirm_delete_goal}">✕</button>
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
}

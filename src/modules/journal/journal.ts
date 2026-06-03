import { state, WEEK_DAYS_VN, WEEK_DAYS_EN } from '../common/state';
import { TRANSLATIONS } from '../common/translations';
import { getDaysInMonth, getDayOfWeek } from '../../utils/calendar';
import { saveRecord } from '../../services/storage';

export function setupJournalPanel(): void {
  if (!state.currentUser || !state.currentRecord) return;
  const selectDay = document.getElementById('select-journal-day') as HTMLSelectElement;
  const textarea = document.getElementById('textarea-journal') as HTMLTextAreaElement;
  const saveStatus = document.getElementById('journal-save-status') as HTMLElement;
  const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);

  if (selectDay && textarea) {
    let optionsHtml = '';
    const dayLabel = state.currentLang === 'vi' ? 'Ngày' : 'Day';
    for (let d = 1; d <= daysCount; d++) {
      optionsHtml += `<option value="${d - 1}">${dayLabel} ${d}</option>`;
    }
    selectDay.innerHTML = optionsHtml;

    const today = new Date();
    const isCurrent = today.getFullYear() === state.currentYear && today.getMonth() === state.currentMonth;
    const defaultDay = isCurrent ? Math.min(daysCount - 1, today.getDate() - 1) : 0;
    
    selectDay.value = defaultDay.toString();
    textarea.value = state.currentRecord.diary[defaultDay] || '';

    // Handle day select change -> load diary entry
    selectDay.addEventListener('change', () => {
      const idx = parseInt(selectDay.value);
      textarea.value = state.currentRecord!.diary[idx] || '';
      if (saveStatus) saveStatus.style.display = 'none';
    });

    // Handle auto-saving on textarea inputs
    let autoSaveTimeout: number;
    textarea.addEventListener('input', () => {
      if (!state.currentUser || !state.currentRecord) return;
      const idx = parseInt(selectDay.value);
      state.currentRecord.diary[idx] = textarea.value;
      saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);

      if (saveStatus) {
        saveStatus.textContent = TRANSLATIONS[state.currentLang].autosave_status;
        saveStatus.style.display = 'inline';
        
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = window.setTimeout(() => {
          saveStatus.style.display = 'none';
        }, 1500);
      }

      // Live update grid pencil icons
      const daysHeader = document.getElementById('habit-grid-header');
      if (daysHeader) {
        const headers = daysHeader.querySelectorAll('th');
        const dayNames = state.currentLang === 'vi' ? WEEK_DAYS_VN : WEEK_DAYS_EN;
        headers.forEach((h, index) => {
          const hasJournal = state.currentRecord!.diary && state.currentRecord!.diary[index] && state.currentRecord!.diary[index].trim() !== '';
          const indicator = h.querySelector('div[title="Có nhật ký"], div[title="Diary notes exist"]');
          
          if (hasJournal && !indicator) {
            const dayNum = index + 1;
            const dayOfWeekIdx = getDayOfWeek(state.currentYear, state.currentMonth, dayNum);
            const dayName = dayNames[dayOfWeekIdx];
            const tooltipJournal = state.currentLang === 'vi' ? 'Có nhật ký' : 'Diary notes exist';
            h.innerHTML = `
              <div>${dayName}</div>
              <div style="font-size: 11px; margin-top:2px; font-weight:700;">${dayNum}</div>
              <div style="font-size: 8px; color: var(--accent-orange); margin-top:-2px;" title="${tooltipJournal}">✏️</div>
            `;
          } else if (!hasJournal && indicator) {
            const dayNum = index + 1;
            const dayOfWeekIdx = getDayOfWeek(state.currentYear, state.currentMonth, dayNum);
            const dayName = dayNames[dayOfWeekIdx];
            h.innerHTML = `
              <div>${dayName}</div>
              <div style="font-size: 11px; margin-top:2px; font-weight:700;">${dayNum}</div>
            `;
          }
        });
      }
    });
  }
}

export function initJournalPrompts(): void {
  const container = document.getElementById('journal-prompts-container');
  if (!container) return;

  const prompts = {
    gratitude: {
      vi: `- Hôm nay tôi biết ơn vì:\n1. \n2. \n3. `,
      en: `- Today I am grateful for:\n1. \n2. \n3. `
    },
    lesson: {
      vi: `- Bài học lớn nhất hôm nay:\n- Cách tôi sẽ cải thiện:\n- Việc cần rút kinh nghiệm:\n`,
      en: `- Biggest lesson today:\n- How I will improve:\n- Things to learn from:\n`
    },
    success: {
      vi: `- Những thành tựu/niềm vui hôm nay:\n1. \n2. `,
      en: `- Accomplishments/wins today:\n1. \n2. `
    },
    plan: {
      vi: `- 3 việc quan trọng nhất ngày mai:\n1. \n2. \n3. `,
      en: `- 3 most important tasks for tomorrow:\n1. \n2. \n3. `
    }
  };

  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('.prompt-chip') as HTMLButtonElement | null;
    if (!button) return;

    const type = button.getAttribute('data-prompt') as keyof typeof prompts;
    const promptObj = prompts[type];
    if (!promptObj) return;

    const textarea = document.getElementById('textarea-journal') as HTMLTextAreaElement;
    if (!textarea) return;

    const text = state.currentLang === 'vi' ? promptObj.vi : promptObj.en;
    const currentVal = textarea.value;
    textarea.value = currentVal ? `${currentVal}\n\n${text}` : text;
    
    // Focus the textarea and set cursor at end
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

    // Trigger the input event to trigger auto-saving
    textarea.dispatchEvent(new Event('input'));
  });
}

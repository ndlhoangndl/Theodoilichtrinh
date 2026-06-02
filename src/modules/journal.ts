import { state, WEEK_DAYS_VN, WEEK_DAYS_EN } from './state';
import { TRANSLATIONS } from './translations';
import { getDaysInMonth, getDayOfWeek } from '../calendar';
import { saveRecord } from '../storage';

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

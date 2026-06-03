import { state } from '../common/state';
import { TRANSLATIONS } from '../common/translations';
import { showConfirm } from '../common/confirm';
import { saveHabits, loadRecord } from '../../services/storage';
import { renderAll } from './tracker';

let activeEmojiPicker: HTMLElement | null = null;

function closeActiveEmojiPicker() {
  if (activeEmojiPicker) {
    activeEmojiPicker.remove();
    activeEmojiPicker = null;
  }
}

export function showEmojiPicker(triggerElement: HTMLElement, onSelect: (emoji: string) => void): void {
  // Close any existing picker first
  closeActiveEmojiPicker();

  const EMOJI_LIST = [
    '🎯', '⏰', '🧘', '💪', '🚿', '📚', '🏃', '🚶',
    '🚴', '🏋️', '🏊', '🥗', '🥛', '💧', '🍎', '🍳',
    '💊', '🛌', '💤', '🧠', '✍️', '🎨', '🎵', '🗣️',
    '🤝', '🧼', '🦷', '🧹', '🚭', '💵', '📈', '📅',
    '☀️', '🌙', '☕', '🍵', '🍀', '🌟', '🔋', '🔌'
  ];

  // Create picker element
  const picker = document.createElement('div');
  picker.className = 'custom-emoji-picker';
  
  // Style picker
  Object.assign(picker.style, {
    position: 'absolute',
    zIndex: '2000',
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    padding: '8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 32px)',
    gap: '4px',
    maxHeight: '200px',
    overflowY: 'auto'
  });

  // Populate emojis
  EMOJI_LIST.forEach(emoji => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerText = emoji;
    btn.className = 'emoji-picker-item-btn';
    Object.assign(btn.style, {
      border: 'none',
      background: 'transparent',
      fontSize: '18px',
      cursor: 'pointer',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-sm)',
      transition: 'var(--transition)'
    });
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(emoji);
      closeActiveEmojiPicker();
    });
    
    picker.appendChild(btn);
  });

  // Position the picker
  document.body.appendChild(picker);
  const rect = triggerElement.getBoundingClientRect();
  
  // Align left and place it right below the element
  let top = rect.bottom + window.scrollY + 4;
  let left = rect.left + window.scrollX;
  
  // Adjust if it goes outside viewport
  const pickerWidth = 280; // 8 columns * 32px + spacing + padding
  if (left + pickerWidth > window.innerWidth) {
    left = window.innerWidth - pickerWidth - 10;
  }
  
  picker.style.top = `${top}px`;
  picker.style.left = `${left}px`;

  activeEmojiPicker = picker;

  // Click outside to close
  setTimeout(() => {
    const outsideClickListener = (e: MouseEvent) => {
      if (activeEmojiPicker && !activeEmojiPicker.contains(e.target as Node) && e.target !== triggerElement) {
        closeActiveEmojiPicker();
        document.removeEventListener('click', outsideClickListener);
      }
    };
    document.addEventListener('click', outsideClickListener);
  }, 0);
}

export function renderManageHabitsList(): void {
  const container = document.getElementById('modal-habit-list-container');
  if (container) {
    let html = '';
    state.habits.forEach((h, index) => {
      const titleUp = state.currentLang === 'vi' ? 'Di chuyển lên' : 'Move up';
      const titleDown = state.currentLang === 'vi' ? 'Di chuyển xuống' : 'Move down';
      const titleDel = state.currentLang === 'vi' ? 'Xóa thói quen này' : 'Delete this habit';

      html += `
        <div class="modal-habit-item" data-id="${h.id}">
          <span class="modal-habit-drag-btn">☰</span>
          <input type="text" class="form-control modal-habit-emoji-input" value="${h.emoji}" style="width: 44px; text-align:center; padding: 4px;" maxlength="4" readonly>
          <input type="text" class="form-control modal-habit-name-input" value="${h.name}" style="flex:1; padding: 4px 8px;">
          <div style="display:flex; gap: 4px;">
            <button type="button" class="btn btn-icon btn-move-up" ${index === 0 ? 'disabled' : ''} title="${titleUp}">▲</button>
            <button type="button" class="btn btn-icon btn-move-down" ${index === state.habits.length - 1 ? 'disabled' : ''} title="${titleDown}">▼</button>
            <button type="button" class="btn btn-icon btn-delete" style="color:#a94442; border-color:#ebccd1; background:#f2dede;" title="${titleDel}">✕</button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

    // Attach list triggers
    const items = container.querySelectorAll('.modal-habit-item');
    items.forEach((item, index) => {
      // 1. Drag and Drop events (handle only)
      const dragBtn = item.querySelector('.modal-habit-drag-btn') as HTMLElement;
      if (dragBtn) {
        dragBtn.addEventListener('mousedown', () => {
          (item as HTMLElement).setAttribute('draggable', 'true');
        });
        dragBtn.addEventListener('mouseup', () => {
          (item as HTMLElement).removeAttribute('draggable');
        });
        dragBtn.addEventListener('touchstart', () => {
          (item as HTMLElement).setAttribute('draggable', 'true');
        }, { passive: true });
        dragBtn.addEventListener('touchend', () => {
          (item as HTMLElement).removeAttribute('draggable');
        });
      }

      item.addEventListener('dragstart', (e: any) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        (item as HTMLElement).removeAttribute('draggable');
        items.forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
      });

      item.addEventListener('dragover', (e: any) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        const rect = item.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        if (relativeY < rect.height / 2) {
          item.classList.add('drag-over-top');
          item.classList.remove('drag-over-bottom');
        } else {
          item.classList.add('drag-over-bottom');
          item.classList.remove('drag-over-top');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      item.addEventListener('drop', (e: any) => {
        e.preventDefault();
        const draggedIdx = parseInt(e.dataTransfer!.getData('text/plain'), 10);
        if (isNaN(draggedIdx)) return;

        if (draggedIdx !== index) {
          const draggedItem = state.habits[draggedIdx];
          state.habits.splice(draggedIdx, 1);
          state.habits.splice(index, 0, draggedItem);
          renderManageHabitsList();
        }
      });

      // Move Up
      item.querySelector('.btn-move-up')?.addEventListener('click', () => {
        if (index > 0) {
          const temp = state.habits[index];
          state.habits[index] = state.habits[index - 1];
          state.habits[index - 1] = temp;
          renderManageHabitsList();
        }
      });

      // Move Down
      item.querySelector('.btn-move-down')?.addEventListener('click', () => {
        if (index < state.habits.length - 1) {
          const temp = state.habits[index];
          state.habits[index] = state.habits[index + 1];
          state.habits[index + 1] = temp;
          renderManageHabitsList();
        }
      });

      // Delete habit
      item.querySelector('.btn-delete')?.addEventListener('click', async () => {
        const confirmed = await showConfirm(TRANSLATIONS[state.currentLang].confirm_delete_habit);
        if (confirmed) {
          state.habits.splice(index, 1);
          renderManageHabitsList();
        }
      });

      // Bind name/emoji updates
      const emojiInput = item.querySelector('.modal-habit-emoji-input') as HTMLInputElement;
      emojiInput.style.cursor = 'pointer';
      emojiInput.addEventListener('click', () => {
        showEmojiPicker(emojiInput, (emoji) => {
          emojiInput.value = emoji;
          state.habits[index].emoji = emoji;
        });
      });

      const nameInput = item.querySelector('.modal-habit-name-input') as HTMLInputElement;
      nameInput.addEventListener('change', () => {
        state.habits[index].name = nameInput.value.trim() || 'Thói quen mới';
      });
    });
  }
}

export function initHabits(): void {
  // Modal toggle bindings: Quản lý thói quen
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
      if (!state.currentUser) return;
      saveHabits(state.currentUser.username, state.habits);
      state.currentRecord = loadRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.habits);
      renderAll();
      modal.classList.remove('active');
    });
  }

  // Add new habit form submit (inside modal)
  const formAddHabit = document.getElementById('form-add-habit') as HTMLFormElement;
  const inputEmoji = document.getElementById('input-new-habit-emoji') as HTMLInputElement;
  const inputName = document.getElementById('input-new-habit-name') as HTMLInputElement;

  if (formAddHabit && inputEmoji && inputName) {
    inputEmoji.readOnly = true;
    inputEmoji.style.cursor = 'pointer';
    inputEmoji.addEventListener('click', () => {
      showEmojiPicker(inputEmoji, (emoji) => {
        inputEmoji.value = emoji;
      });
    });

    formAddHabit.addEventListener('submit', (e) => {
      e.preventDefault();
      const emoji = inputEmoji.value.trim() || '🎯';
      const name = inputName.value.trim();
      
      if (name) {
        const id = 'h_' + Date.now();
        state.habits.push({ id, name, emoji });
        
        inputName.value = '';
        inputEmoji.value = '🎯';
        
        renderManageHabitsList();
      }
    });
  }
}

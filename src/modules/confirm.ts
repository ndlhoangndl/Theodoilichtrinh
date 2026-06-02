import { state } from './state';

let confirmResolve: ((value: boolean) => void) | null = null;

export function showConfirm(message: string): Promise<boolean> {
  const modal = document.getElementById('modal-confirm');
  const msgEl = document.getElementById('confirm-message');
  const titleEl = document.getElementById('confirm-title');
  
  if (modal && msgEl) {
    if (titleEl) {
      titleEl.textContent = state.currentLang === 'vi' ? 'Xác nhận' : 'Confirm';
    }
    msgEl.textContent = message;
    
    const btnYes = document.getElementById('confirm-btn-yes');
    const btnNo = document.getElementById('confirm-btn-no');
    if (btnYes) btnYes.textContent = state.currentLang === 'vi' ? 'Có' : 'Yes';
    if (btnNo) btnNo.textContent = state.currentLang === 'vi' ? 'Không' : 'No';
    
    modal.classList.add('active');
    
    return new Promise<boolean>((resolve) => {
      confirmResolve = resolve;
    });
  }
  return Promise.resolve(false);
}

// Binds closing event listeners for confirmation overlay modal dialog
export function initConfirmOverlay(): void {
  const btnConfirmYes = document.getElementById('confirm-btn-yes');
  const btnConfirmNo = document.getElementById('confirm-btn-no');
  const modalConfirm = document.getElementById('modal-confirm');
  
  if (btnConfirmYes && btnConfirmNo && modalConfirm) {
    btnConfirmYes.addEventListener('click', () => {
      modalConfirm.classList.remove('active');
      if (confirmResolve) {
        confirmResolve(true);
        confirmResolve = null;
      }
    });
    
    btnConfirmNo.addEventListener('click', () => {
      modalConfirm.classList.remove('active');
      if (confirmResolve) {
        confirmResolve(false);
        confirmResolve = null;
      }
    });

    modalConfirm.addEventListener('click', (e) => {
      if (e.target === modalConfirm) {
        modalConfirm.classList.remove('active');
        if (confirmResolve) {
          confirmResolve(false);
          confirmResolve = null;
        }
      }
    });
  }
}

import { User } from '../../types/types';
import { verifyUser, createSession, saveUser } from '../../services/storage';
import { state } from '../common/state';
import { TRANSLATIONS, translateUI } from '../common/translations';
import { logoutUser } from '../profile/profile';
import { initializeState, renderAll } from '../tracker/tracker';
import { setupJournalPanel } from '../journal/journal';

// Bind Authentication View Forms and State Switching
export function initAuth(): void {
  const authContainer = document.getElementById('auth-container');
  const dashboardContainer = document.getElementById('dashboard-container');

  if (!authContainer || !dashboardContainer) return;

  const loginView = document.getElementById('auth-login-view') as HTMLElement;
  const registerView = document.getElementById('auth-register-view') as HTMLElement;
  const loginToggle = document.getElementById('login-toggle-container');
  const registerToggle = document.getElementById('register-toggle-container');

  if (loginToggle && loginView && registerView) {
    loginToggle.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target && target.id === 'btn-goto-register') {
        e.preventDefault();
        loginView.style.display = 'none';
        registerView.style.display = 'block';
        
        const errorReg = document.getElementById('register-error') as HTMLElement;
        if (errorReg) errorReg.style.display = 'none';
      }
    });
  }

  if (registerToggle && loginView && registerView) {
    registerToggle.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target && target.id === 'btn-goto-login') {
        e.preventDefault();
        registerView.style.display = 'none';
        loginView.style.display = 'block';
        
        const errorLog = document.getElementById('login-error') as HTMLElement;
        if (errorLog) errorLog.style.display = 'none';
      }
    });
  }

  // Handle Login form submit
  const formLogin = document.getElementById('form-login') as HTMLFormElement;
  const loginError = document.getElementById('login-error') as HTMLElement;

  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const uInput = (document.getElementById('login-username') as HTMLInputElement).value.trim();
      const pInput = (document.getElementById('login-password') as HTMLInputElement).value;

      if (!uInput || !pInput) {
        if (loginError) {
          loginError.textContent = TRANSLATIONS[state.currentLang].alert_fields_required;
          loginError.style.display = 'block';
        }
        return;
      }

      const verified = verifyUser(uInput, pInput);

      if (verified) {
        createSession(verified);
        state.currentUser = verified;
        
        formLogin.reset();
        if (loginError) loginError.style.display = 'none';

        authContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        
        initializeState();
        translateUI();
        setupJournalPanel();
        renderAll();
      } else {
        if (loginError) {
          loginError.textContent = TRANSLATIONS[state.currentLang].alert_wrong_login;
          loginError.style.display = 'block';
        }
      }
    });
  }

  // Handle Registration form submit
  const formRegister = document.getElementById('form-register') as HTMLFormElement;
  const registerError = document.getElementById('register-error') as HTMLElement;

  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const usernameVal = (document.getElementById('register-username') as HTMLInputElement).value.trim();
      const fullnameVal = (document.getElementById('register-fullname') as HTMLInputElement).value.trim();
      const emailVal = (document.getElementById('register-email') as HTMLInputElement).value.trim();
      const passwordVal = (document.getElementById('register-password') as HTMLInputElement).value;
      const confirmPasswordVal = (document.getElementById('register-confirm-password') as HTMLInputElement).value;
      const genderVal = (document.getElementById('register-gender') as HTMLSelectElement).value;
      const dobVal = (document.getElementById('register-dob') as HTMLInputElement).value;

      if (!usernameVal || !fullnameVal || !emailVal || !passwordVal || !confirmPasswordVal || !genderVal || !dobVal) {
        if (registerError) {
          registerError.textContent = TRANSLATIONS[state.currentLang].alert_fields_required;
          registerError.style.display = 'block';
        }
        return;
      }

      if (passwordVal !== confirmPasswordVal) {
        if (registerError) {
          registerError.textContent = TRANSLATIONS[state.currentLang].alert_password_mismatch;
          registerError.style.display = 'block';
        }
        return;
      }

      if (usernameVal.includes(' ')) {
        if (registerError) {
          registerError.textContent = TRANSLATIONS[state.currentLang].alert_username_spaces;
          registerError.style.display = 'block';
        }
        return;
      }

      const newUser: User = {
        username: usernameVal,
        passwordHash: passwordVal,
        email: emailVal,
        fullName: fullnameVal,
        gender: genderVal,
        dob: dobVal,
        country: 'Vietnam',
        bio: 'Đây là không gian dành riêng cho bạn. Nơi lưu giữ những thông tin cá nhân cơ bản và định hình trải nghiệm lịch trình của bạn.',
        role: 'USER'
      };

      const success = saveUser(newUser);

      if (success) {
        formRegister.reset();
        if (registerError) registerError.style.display = 'none';

        // Redirect back to login view
        registerView.style.display = 'none';
        loginView.style.display = 'block';

        // Pre-fill username in login form
        const loginUsername = document.getElementById('login-username') as HTMLInputElement;
        if (loginUsername) {
          loginUsername.value = usernameVal;
          const loginPassword = document.getElementById('login-password') as HTMLInputElement;
          if (loginPassword) loginPassword.focus();
        }

        alert(state.currentLang === 'vi'
          ? 'Đăng ký thành công! Hãy đăng nhập để bắt đầu.'
          : 'Registration successful! Please log in to start.');
      } else {
        if (registerError) {
          registerError.textContent = TRANSLATIONS[state.currentLang].alert_username_taken;
          registerError.style.display = 'block';
        }
      }
    });
  }

  // Bind Logout Button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logoutUser();
    });
  }
}

// Set up show/hide logic for password input elements
export function setupPasswordToggles(): void {
  const containers = document.querySelectorAll('.password-input-container');
  containers.forEach(container => {
    const input = container.querySelector('input') as HTMLInputElement;
    const btn = container.querySelector('.password-toggle-btn') as HTMLButtonElement;
    if (!input || !btn) return;

    const eyeOpen = btn.querySelector('.eye-open') as SVGElement | HTMLElement | null;
    const eyeClosed = btn.querySelector('.eye-closed') as SVGElement | HTMLElement | null;

    btn.addEventListener('click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        if (eyeOpen) (eyeOpen as HTMLElement).style.display = 'none';
        if (eyeClosed) (eyeClosed as HTMLElement).style.display = 'block';
      } else {
        input.type = 'password';
        if (eyeOpen) (eyeOpen as HTMLElement).style.display = 'block';
        if (eyeClosed) (eyeClosed as HTMLElement).style.display = 'none';
      }
    });
  });
}

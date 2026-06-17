import { User } from '../../types/types';
import { createSession, syncHabitsFromServer, syncRecordFromServer } from '../../services/storage';
import { state } from '../common/state';
import { TRANSLATIONS, translateUI } from '../common/translations';
import { applyUserTheme } from '../../main';
import { logoutUser } from '../profile/profile';
import { initializeState, renderAll } from '../tracker/tracker';
import { setupJournalPanel } from '../journal/journal';
import { apiLogin, apiRegister, setToken, apiForgotPassword, apiResetPassword } from '../../services/api';
import { refreshUserChat } from '../chat/userChat';
import { refreshAdminChat } from '../chat/adminChat';

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
    formLogin.addEventListener('submit', async (e) => {
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

      const btnSubmit = formLogin.querySelector('button[type="submit"]') as HTMLButtonElement;
      let originalText = '';
      if (btnSubmit) {
        originalText = btnSubmit.innerHTML;
        btnSubmit.setAttribute('disabled', 'true');
        btnSubmit.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; border: 2px solid var(--text-light); border-top-color: transparent; border-radius: 50%; display: inline-block; animation: gemini-spin 1s linear infinite; margin-right: 6px; vertical-align: middle;"></span>${state.currentLang === 'vi' ? 'Đang xác thực...' : 'Authenticating...'}`;
      }

      try {
        const result = await apiLogin(uInput, pInput);
        setToken(result.token);
        
        createSession(result.user);
        state.currentUser = result.user;
        
        // Parallelize loading screen transition and server data syncing
        const loadingPromise = runLoadingTransition();
        const syncPromise = Promise.all([
          syncHabitsFromServer(result.user.username),
          syncRecordFromServer(result.user.username, state.currentYear, state.currentMonth)
        ]);

        await Promise.all([loadingPromise, syncPromise]);
        
        formLogin.reset();
        if (loginError) loginError.style.display = 'none';

        authContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        
        initializeState();
        if (state.currentUser && state.currentUser.theme) {
          applyUserTheme(state.currentUser.theme);
          const selectTheme = document.getElementById('select-theme') as HTMLSelectElement;
          if (selectTheme) {
            selectTheme.value = state.currentUser.theme;
          }
        }
        translateUI();
        setupJournalPanel();
        renderAll();
        refreshUserChat();
        refreshAdminChat();
      } catch (err: any) {
        if (loginError) {
          const isNetworkError = err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('fetch'));
          loginError.textContent = isNetworkError
            ? (state.currentLang === 'vi' ? 'Không thể kết nối đến máy chủ. Vui lòng chạy server backend ở cổng 5000!' : 'Cannot connect to backend server. Please make sure the server is running on port 5000!')
            : (err.message || (state.currentLang === 'vi' ? 'Tên đăng nhập hoặc mật khẩu không chính xác!' : 'Incorrect username or password!'));
          loginError.style.display = 'block';
        }
      } finally {
        if (btnSubmit) {
          btnSubmit.removeAttribute('disabled');
          btnSubmit.innerHTML = originalText;
        }
      }
    });
  }

  // Handle Registration form submit
  const formRegister = document.getElementById('form-register') as HTMLFormElement;
  const registerError = document.getElementById('register-error') as HTMLElement;

  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
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

      // Username validation: 4-20 characters, alphanumeric or underscore, no icons/emojis
      const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
      if (!usernameRegex.test(usernameVal)) {
        if (registerError) {
          registerError.textContent = state.currentLang === 'vi'
            ? 'Tên đăng nhập phải dài từ 4 đến 20 ký tự, chỉ gồm chữ cái, chữ số, dấu gạch dưới và không chứa khoảng trắng/icon!'
            : 'Username must be 4-20 characters, containing only letters, numbers, or underscores, with no spaces or icons!';
          registerError.style.display = 'block';
        }
        return;
      }

      // Password validation: 6-30 characters, standard keyboard characters only, no icons/emojis
      const passwordRegex = /^[\x21-\x7E]{6,30}$/;
      if (!passwordRegex.test(passwordVal)) {
        if (registerError) {
          registerError.textContent = state.currentLang === 'vi'
            ? 'Mật khẩu phải dài từ 6 đến 30 ký tự, chỉ chứa các ký tự bàn phím thông thường và không được dùng icon/hình ảnh!'
            : 'Password must be 6-30 characters, containing only standard keyboard characters, and no icons/emojis!';
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

      const btnSubmit = formRegister.querySelector('button[type="submit"]') as HTMLButtonElement;
      let originalText = '';
      if (btnSubmit) {
        originalText = btnSubmit.innerHTML;
        btnSubmit.setAttribute('disabled', 'true');
        btnSubmit.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; border: 2px solid var(--text-light); border-top-color: transparent; border-radius: 50%; display: inline-block; animation: gemini-spin 1s linear infinite; margin-right: 6px; vertical-align: middle;"></span>${state.currentLang === 'vi' ? 'Đang đăng ký...' : 'Registering...'}`;
      }

      try {
        await apiRegister(newUser);
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
      } catch (err: any) {
        if (registerError) {
          registerError.textContent = err.message || TRANSLATIONS[state.currentLang].alert_username_taken;
          registerError.style.display = 'block';
        }
      } finally {
        if (btnSubmit) {
          btnSubmit.removeAttribute('disabled');
          btnSubmit.innerHTML = originalText;
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

  // Toggle to Forgot Password view
  const btnGotoForgot = document.getElementById('btn-goto-forgot');
  const forgotView = document.getElementById('auth-forgot-password-view') as HTMLElement;
  const btnGotoLoginFromForgot = document.getElementById('btn-goto-login-from-forgot');

  if (btnGotoForgot && forgotView && loginView) {
    btnGotoForgot.addEventListener('click', (e) => {
      e.preventDefault();
      loginView.style.display = 'none';
      forgotView.style.display = 'block';
      
      // Reset forgot views to step 1
      const formRequest = document.getElementById('form-forgot-request') as HTMLFormElement;
      const formReset = document.getElementById('form-forgot-reset') as HTMLFormElement;
      if (formRequest) formRequest.style.display = 'block';
      if (formReset) formReset.style.display = 'none';
      
      const reqError = document.getElementById('forgot-request-error');
      if (reqError) reqError.style.display = 'none';
      const resetError = document.getElementById('forgot-reset-error');
      if (resetError) resetError.style.display = 'none';
    });
  }

  if (btnGotoLoginFromForgot && forgotView && loginView) {
    btnGotoLoginFromForgot.addEventListener('click', (e) => {
      e.preventDefault();
      forgotView.style.display = 'none';
      loginView.style.display = 'block';
    });
  }

  // Handle forgot password request form (Step 1)
  const formForgotRequest = document.getElementById('form-forgot-request') as HTMLFormElement;
  const forgotRequestError = document.getElementById('forgot-request-error');
  if (formForgotRequest) {
    formForgotRequest.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = (document.getElementById('forgot-email') as HTMLInputElement).value.trim();
      if (!emailInput) return;

      try {
        if (forgotRequestError) forgotRequestError.style.display = 'none';
        
        await apiForgotPassword(emailInput);
        
        // Show step 2 form
        const formReset = document.getElementById('form-forgot-reset') as HTMLFormElement;
        formForgotRequest.style.display = 'none';
        if (formReset) {
          formReset.style.display = 'block';
          formReset.reset();
        }
      } catch (err: any) {
        if (forgotRequestError) {
          forgotRequestError.textContent = err.message || (state.currentLang === 'vi' ? 'Lỗi khi gửi yêu cầu.' : 'Error sending request.');
          forgotRequestError.style.display = 'block';
        }
      }
    });
  }

  // Handle forgot password reset form (Step 2)
  const formForgotReset = document.getElementById('form-forgot-reset') as HTMLFormElement;
  const forgotResetError = document.getElementById('forgot-reset-error');
  if (formForgotReset) {
    formForgotReset.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = (document.getElementById('forgot-email') as HTMLInputElement).value.trim();
      const codeInput = (document.getElementById('forgot-code') as HTMLInputElement).value.trim();
      const newPasswordInput = (document.getElementById('forgot-new-password') as HTMLInputElement).value;

      if (!emailInput || !codeInput || !newPasswordInput) return;

      // Password validation: 6-30 characters, standard keyboard characters only, no icons/emojis
      const passwordRegex = /^[\x21-\x7E]{6,30}$/;
      if (!passwordRegex.test(newPasswordInput)) {
        if (forgotResetError) {
          forgotResetError.textContent = state.currentLang === 'vi'
            ? 'Mật khẩu phải dài từ 6 đến 30 ký tự, chỉ chứa các ký tự bàn phím thông thường và không được dùng icon/hình ảnh!'
            : 'Password must be 6-30 characters, containing only standard keyboard characters, and no icons/emojis!';
          forgotResetError.style.display = 'block';
        }
        return;
      }

      try {
        if (forgotResetError) forgotResetError.style.display = 'none';
        
        const result = await apiResetPassword(emailInput, codeInput, newPasswordInput);
        
        alert(result.message || (state.currentLang === 'vi' ? 'Đặt lại mật khẩu thành công!' : 'Password reset successful!'));
        
        // Show login view
        if (forgotView) forgotView.style.display = 'none';
        if (loginView) loginView.style.display = 'block';
      } catch (err: any) {
        if (forgotResetError) {
          forgotResetError.textContent = err.message || (state.currentLang === 'vi' ? 'Lỗi xác nhận.' : 'Verification error.');
          forgotResetError.style.display = 'block';
        }
      }
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

function runLoadingTransition(): Promise<void> {
  return new Promise((resolve) => {
    const loadingOverlay = document.getElementById('auth-loading-overlay');
    const loadingStatus = document.getElementById('loading-status-text');
    const loadingProgress = document.getElementById('loading-progress-bar');

    if (!loadingOverlay || !loadingStatus || !loadingProgress) {
      resolve();
      return;
    }

    // Initialize display and trigger transition
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '0';
    loadingProgress.style.width = '0%';
    loadingStatus.textContent = state.currentLang === 'vi' ? 'Đang kết nối...' : 'Connecting...';

    // Force reflow
    void loadingOverlay.offsetWidth;
    loadingOverlay.style.opacity = '1';

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 6; // increment by 6% - 15%
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        loadingProgress.style.width = '100%';
        loadingStatus.textContent = state.currentLang === 'vi' ? 'Sẵn sàng!' : 'Ready!';

        // Wait for progress bar transition to complete
        setTimeout(() => {
          loadingOverlay.style.opacity = '0';
          setTimeout(() => {
            loadingOverlay.style.display = 'none';
            resolve();
          }, 400); // matches CSS overlay fade-out transition
        }, 300);
      } else {
        loadingProgress.style.width = `${progress}%`;
        if (progress < 30) {
          loadingStatus.textContent = state.currentLang === 'vi' ? 'Đang xác thực tài khoản...' : 'Verifying credentials...';
        } else if (progress < 65) {
          loadingStatus.textContent = state.currentLang === 'vi' ? 'Đang đồng bộ dữ liệu...' : 'Synchronizing habits...';
        } else {
          loadingStatus.textContent = state.currentLang === 'vi' ? 'Đang chuẩn bị không gian làm việc...' : 'Preparing workspace...';
        }
      }
    }, 120); // updates every 120ms, overall duration ~1.2s - 1.5s
  });
}

import { updateUser, createSession, clearSession } from '../../services/storage';
import { state } from '../common/state';
import { TRANSLATIONS, translateUI } from '../common/translations';
import { showConfirm } from '../common/confirm';
import { renderAll } from '../tracker/tracker';
import { apiUpdateProfile, apiChangePassword } from '../../services/api';
import { refreshUserChat } from '../chat/userChat';
import { refreshAdminChat } from '../chat/adminChat';

// Render Profile Page details (SONICLE layout)
export function renderProfilePage(): void {
  if (!state.currentUser) return;
  
  const gender = state.currentUser.gender || 'unknown';
  const dob = state.currentUser.dob || '---';
  const country = state.currentUser.country || 'Vietnam';
  const bio = state.currentUser.bio || 'Đây là không gian dành riêng cho bạn. Nơi lưu giữ những thông tin cá nhân cơ bản và định hình trải nghiệm lịch trình của bạn.';
  const role = state.currentUser.role || 'USER';

  // Left banner panel values
  const fullnameDisplay = document.getElementById('profile-fullname-display');
  const usernameHandle = document.getElementById('profile-username-handle');
  const emailHandle = document.getElementById('profile-email-handle');
  const bioDisplay = document.getElementById('profile-bio-display');
  const avatarDisplay = document.getElementById('profile-avatar-display');

  if (fullnameDisplay) fullnameDisplay.textContent = state.currentUser.fullName;
  if (usernameHandle) usernameHandle.textContent = `@${state.currentUser.username}`;
  if (emailHandle) emailHandle.textContent = state.currentUser.email;
  if (bioDisplay) bioDisplay.textContent = bio;
  
  if (avatarDisplay) {
    if (gender === 'male') avatarDisplay.textContent = '👨‍💼';
    else if (gender === 'female') avatarDisplay.textContent = '👩‍💼';
    else avatarDisplay.textContent = '👤';
  }

  // Bottom overview details card values
  const valUsername = document.getElementById('profile-card-val-username');
  const valEmail = document.getElementById('profile-card-val-email');
  const valGender = document.getElementById('profile-card-val-gender');
  const valCountry = document.getElementById('profile-card-val-country');
  const valDob = document.getElementById('profile-card-val-dob');
  const valRole = document.getElementById('profile-card-val-role');

  if (valUsername) valUsername.textContent = state.currentUser.username;
  if (valEmail) valEmail.textContent = state.currentUser.email;
  if (valGender) {
    let genderText = 'Unknown';
    if (gender === 'male') genderText = state.currentLang === 'vi' ? 'Nam' : 'Male';
    else if (gender === 'female') genderText = state.currentLang === 'vi' ? 'Nữ' : 'Female';
    else if (gender === 'other') genderText = state.currentLang === 'vi' ? 'Khác' : 'Other';
    valGender.textContent = genderText;
  }
  if (valCountry) valCountry.textContent = country;
  if (valDob) valDob.textContent = dob;
  if (valRole) valRole.textContent = role;
}

// Log out user cleanly with confirm
export async function logoutUser(): Promise<void> {
  const confirmed = await showConfirm(TRANSLATIONS[state.currentLang].confirm_logout);
  if (confirmed) {
    clearSession();
    state.currentUser = null;
    
    const dashboardContainer = document.getElementById('dashboard-container') as HTMLElement;
    const authContainer = document.getElementById('auth-container') as HTMLElement;
    const registerView = document.getElementById('auth-register-view') as HTMLElement;
    const loginView = document.getElementById('auth-login-view') as HTMLElement;
    
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    if (authContainer) authContainer.style.display = 'flex';
    if (registerView) registerView.style.display = 'none';
    if (loginView) loginView.style.display = 'block';
    
    // Reset active tabs on logout
    const tabTracker = document.getElementById('menu-tab-tracker');
    const tabStats = document.getElementById('menu-tab-stats');
    const tabProfile = document.getElementById('menu-tab-profile');
    const viewTracker = document.getElementById('view-tracker');
    const viewStats = document.getElementById('view-stats');
    const viewProfile = document.getElementById('view-profile');
    
    if (tabTracker) tabTracker.classList.add('active');
    if (tabStats) tabStats.classList.remove('active');
    if (tabProfile) tabProfile.classList.remove('active');
    if (viewTracker) viewTracker.style.display = 'flex';
    if (viewStats) viewStats.style.display = 'none';
    if (viewProfile) viewProfile.style.display = 'none';

    refreshUserChat();
    refreshAdminChat();
  }
}

// Bind Profile Customization Modal actions
export function initProfile(): void {
  const modalEditProfile = document.getElementById('modal-edit-profile') as HTMLElement;
  const btnEditProfileTrigger = document.getElementById('btn-edit-profile-trigger');
  
  if (modalEditProfile && btnEditProfileTrigger) {
    btnEditProfileTrigger.addEventListener('click', () => {
      if (!state.currentUser) return;
      
      const inputFullname = document.getElementById('edit-profile-fullname') as HTMLInputElement;
      const inputEmail = document.getElementById('edit-profile-email') as HTMLInputElement;
      const inputGender = document.getElementById('edit-profile-gender') as HTMLSelectElement;
      const inputDob = document.getElementById('edit-profile-dob') as HTMLInputElement;
      const inputCountry = document.getElementById('edit-profile-country') as HTMLInputElement;
      const inputBio = document.getElementById('edit-profile-bio') as HTMLTextAreaElement;

      if (inputFullname) inputFullname.value = state.currentUser.fullName;
      if (inputEmail) inputEmail.value = state.currentUser.email;
      if (inputGender) inputGender.value = state.currentUser.gender || 'male';
      if (inputDob) inputDob.value = state.currentUser.dob || '';
      if (inputCountry) inputCountry.value = state.currentUser.country || 'Vietnam';
      if (inputBio) inputBio.value = state.currentUser.bio || '';

      modalEditProfile.classList.add('active');
    });

    // Close triggers
    modalEditProfile.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => modalEditProfile.classList.remove('active'));
    });
    window.addEventListener('click', (e) => {
      if (e.target === modalEditProfile) modalEditProfile.classList.remove('active');
    });

    // Submit handler
    const formEditProfile = document.getElementById('form-edit-profile') as HTMLFormElement;
    if (formEditProfile) {
      formEditProfile.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!state.currentUser) return;

        const inputFullname = document.getElementById('edit-profile-fullname') as HTMLInputElement;
        const inputEmail = document.getElementById('edit-profile-email') as HTMLInputElement;
        const inputGender = document.getElementById('edit-profile-gender') as HTMLSelectElement;
        const inputDob = document.getElementById('edit-profile-dob') as HTMLInputElement;
        const inputCountry = document.getElementById('edit-profile-country') as HTMLInputElement;
        const inputBio = document.getElementById('edit-profile-bio') as HTMLTextAreaElement;

        state.currentUser.fullName = inputFullname.value.trim();
        state.currentUser.email = inputEmail.value.trim();
        // Update database
        apiUpdateProfile({
          fullName: inputFullname.value.trim(),
          email: inputEmail.value.trim(),
          gender: inputGender.value,
          dob: inputDob.value,
          country: inputCountry.value.trim() || 'Vietnam',
          bio: inputBio.value.trim()
        }).then(res => {
          state.currentUser = res.user;
          updateUser(state.currentUser);
          createSession(state.currentUser); // update active session
          renderProfilePage();
          translateUI();
          renderAll();
          modalEditProfile.classList.remove('active');
          alert(TRANSLATIONS[state.currentLang].alert_profile_saved);
        }).catch(err => {
          alert(state.currentLang === 'vi' ? 'Không thể cập nhật hồ sơ: ' + err.message : 'Could not update profile: ' + err.message);
        });
      });
    }
  }

  // Profile actions modal: change password
  const modalEditPassword = document.getElementById('modal-edit-password') as HTMLElement;
  const btnEditPasswordTrigger = document.getElementById('btn-edit-password-trigger');
  
  if (modalEditPassword && btnEditPasswordTrigger) {
    btnEditPasswordTrigger.addEventListener('click', () => {
      const formEditPassword = document.getElementById('form-edit-password') as HTMLFormElement;
      if (formEditPassword) formEditPassword.reset();
      const errEl = document.getElementById('edit-password-error');
      if (errEl) errEl.style.display = 'none';

      modalEditPassword.classList.add('active');
    });

    modalEditPassword.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => modalEditPassword.classList.remove('active'));
    });
    window.addEventListener('click', (e) => {
      if (e.target === modalEditPassword) modalEditPassword.classList.remove('active');
    });

    const formEditPassword = document.getElementById('form-edit-password') as HTMLFormElement;
    if (formEditPassword) {
      formEditPassword.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!state.currentUser) return;

        const oldPass = (document.getElementById('edit-password-old') as HTMLInputElement).value;
        const newPass = (document.getElementById('edit-password-new') as HTMLInputElement).value;
        const confirmPass = (document.getElementById('edit-password-confirm') as HTMLInputElement).value;
        const errEl = document.getElementById('edit-password-error');

        if (newPass !== confirmPass) {
          if (errEl) {
            errEl.textContent = TRANSLATIONS[state.currentLang].alert_password_mismatch;
            errEl.style.display = 'block';
          }
          return;
        }

        apiChangePassword(oldPass, newPass).then(() => {
          state.currentUser!.passwordHash = newPass;
          updateUser(state.currentUser!);
          createSession(state.currentUser!);
 
          modalEditPassword.classList.remove('active');
          alert(TRANSLATIONS[state.currentLang].alert_password_changed);
        }).catch(() => {
          if (errEl) {
            errEl.textContent = state.currentLang === 'vi' ? 'Mật khẩu cũ không chính xác!' : 'Incorrect old password!';
            errEl.style.display = 'block';
          }
        });
      });
    }
  }

  // Logout from profile tab
  const btnProfileLogout = document.getElementById('btn-profile-logout');
  if (btnProfileLogout) {
    btnProfileLogout.addEventListener('click', () => {
      logoutUser();
    });
  }
}

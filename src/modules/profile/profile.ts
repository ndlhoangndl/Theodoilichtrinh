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
    const avatarVal = state.currentUser.avatar || '';
    avatarDisplay.innerHTML = '';
    if (avatarVal.startsWith('data:image/') || avatarVal.startsWith('http')) {
      const img = document.createElement('img');
      img.src = avatarVal;
      img.className = 'profile-avatar-image';
      img.alt = 'Avatar';
      avatarDisplay.appendChild(img);
    } else if (avatarVal.startsWith('emoji:')) {
      avatarDisplay.textContent = avatarVal.replace('emoji:', '');
      avatarDisplay.style.fontSize = '72px';
    } else {
      if (gender === 'male') avatarDisplay.textContent = '👨‍💼';
      else if (gender === 'female') avatarDisplay.textContent = '👩‍💼';
      else avatarDisplay.textContent = '👤';
      avatarDisplay.style.fontSize = '72px';
    }
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

  // Load saved Gemini API key
  const inputGeminiKey = document.getElementById('input-gemini-key') as HTMLInputElement;
  if (inputGeminiKey) {
    inputGeminiKey.value = localStorage.getItem('LICHTRINH_GEMINI_KEY') || '';
  }
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

        // Password validation: 6-30 characters, standard keyboard characters only, no icons/emojis
        const passwordRegex = /^[\x21-\x7E]{6,30}$/;
        if (!passwordRegex.test(newPass)) {
          if (errEl) {
            errEl.textContent = state.currentLang === 'vi'
              ? 'Mật khẩu mới phải dài từ 6 đến 30 ký tự, chỉ chứa các ký tự bàn phím thông thường và không được dùng icon/hình ảnh!'
              : 'New password must be 6-30 characters, containing only standard keyboard characters, and no icons/emojis!';
            errEl.style.display = 'block';
          }
          return;
        }

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

  // Save Gemini API Key
  const btnSaveGeminiKey = document.getElementById('btn-save-gemini-key');
  const inputGeminiKey = document.getElementById('input-gemini-key') as HTMLInputElement;
  if (btnSaveGeminiKey && inputGeminiKey) {
    btnSaveGeminiKey.addEventListener('click', () => {
      const key = inputGeminiKey.value.trim();
      if (key) {
        localStorage.setItem('LICHTRINH_GEMINI_KEY', key);
      } else {
        localStorage.removeItem('LICHTRINH_GEMINI_KEY');
      }
      alert(TRANSLATIONS[state.currentLang].alert_gemini_key_saved);
      
      // Update UI button immediately in case the coach panel needs to hide or show
      const btnAskGemini = document.getElementById('btn-ask-gemini');
      if (btnAskGemini) {
        if (key) {
          btnAskGemini.style.display = 'flex';
        } else {
          btnAskGemini.style.display = 'none';
        }
      }
    });
  }



  // Avatar Customizer temporary state
  let tempAvatar = '';

  const modalAvatar = document.getElementById('modal-avatar-customizer') as HTMLElement;
  const avatarContainer = document.getElementById('profile-avatar-container');
  const emojiOptions = document.querySelectorAll('.emoji-option');
  const inputAvatarFile = document.getElementById('input-avatar-file') as HTMLInputElement;
  const avatarFileName = document.getElementById('avatar-file-name');
  
  if (modalAvatar && avatarContainer) {
    avatarContainer.addEventListener('click', () => {
      if (!state.currentUser) return;
      tempAvatar = state.currentUser.avatar || '';
      
      // reset file input
      if (inputAvatarFile) inputAvatarFile.value = '';
      if (avatarFileName) avatarFileName.style.display = 'none';
      
      // set active emoji in grid
      emojiOptions.forEach(opt => {
        const emoji = opt.getAttribute('data-emoji') || '';
        if (tempAvatar === 'emoji:' + emoji) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
      
      updateCustomizerPreview(tempAvatar, state.currentUser.gender);
      modalAvatar.classList.add('active');
    });
    
    // Close modal triggers
    modalAvatar.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => modalAvatar.classList.remove('active'));
    });
    window.addEventListener('click', (e) => {
      if (e.target === modalAvatar) modalAvatar.classList.remove('active');
    });
  }

  // Predefined Emoji options selection
  emojiOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      emojiOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      
      const emoji = opt.getAttribute('data-emoji') || '';
      tempAvatar = 'emoji:' + emoji;
      updateCustomizerPreview(tempAvatar);
    });
  });

  // Initials Avatar Generation
  const btnGenerateInitials = document.getElementById('btn-generate-initials');
  if (btnGenerateInitials) {
    btnGenerateInitials.addEventListener('click', () => {
      if (!state.currentUser) return;
      emojiOptions.forEach(o => o.classList.remove('active'));
      
      const initialsSvgBase64 = generateInitialsSvg(state.currentUser.fullName);
      tempAvatar = initialsSvgBase64;
      updateCustomizerPreview(tempAvatar);
    });
  }

  // Trigger File input
  const btnTriggerFile = document.getElementById('btn-trigger-file-input');
  if (btnTriggerFile && inputAvatarFile) {
    btnTriggerFile.addEventListener('click', () => {
      inputAvatarFile.click();
    });
    
    inputAvatarFile.addEventListener('change', async () => {
      const files = inputAvatarFile.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      if (avatarFileName) {
        avatarFileName.textContent = file.name;
        avatarFileName.style.display = 'block';
      }
      
      try {
        const compressedBase64 = await compressImageFile(file);
        emojiOptions.forEach(o => o.classList.remove('active'));
        tempAvatar = compressedBase64;
        updateCustomizerPreview(tempAvatar);
      } catch (err: any) {
        alert(state.currentLang === 'vi' ? 'Không thể đọc tệp ảnh: ' + err.message : 'Cannot read image file: ' + err.message);
      }
    });
  }

  // Save Avatar Selection
  const btnSaveAvatar = document.getElementById('btn-save-avatar');
  if (btnSaveAvatar && modalAvatar) {
    btnSaveAvatar.addEventListener('click', () => {
      if (!state.currentUser) return;
      
      state.currentUser.avatar = tempAvatar;
      updateUser(state.currentUser);
      createSession(state.currentUser);
      
      apiUpdateProfile({ avatar: tempAvatar }).then(res => {
        state.currentUser = res.user;
        updateUser(state.currentUser);
        createSession(state.currentUser);
        renderProfilePage();
        modalAvatar.classList.remove('active');
      }).catch(err => {
        alert(state.currentLang === 'vi' ? 'Không thể lưu ảnh đại diện: ' + err.message : 'Failed to save avatar: ' + err.message);
      });
    });
  }
}

// --- AVATAR CUSTOMIZER HELPER FUNCTIONS ---

function updateCustomizerPreview(avatarVal: string, gender: string = 'male'): void {
  const preview = document.getElementById('customizer-avatar-preview');
  if (preview) {
    preview.innerHTML = '';
    if (avatarVal.startsWith('data:image/') || avatarVal.startsWith('http')) {
      const img = document.createElement('img');
      img.src = avatarVal;
      img.className = 'profile-avatar-image';
      img.alt = 'Avatar Preview';
      preview.appendChild(img);
    } else if (avatarVal.startsWith('emoji:')) {
      preview.textContent = avatarVal.replace('emoji:', '');
      preview.style.fontSize = '50px';
    } else {
      if (gender === 'male') preview.textContent = '👨‍💼';
      else if (gender === 'female') preview.textContent = '👩‍💼';
      else preview.textContent = '👤';
      preview.style.fontSize = '50px';
    }
  }
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  const firstInitial = parts[0].charAt(0);
  const lastInitial = parts[parts.length - 1].charAt(0);
  return (firstInitial + lastInitial).toUpperCase();
}

function generateInitialsSvg(fullName: string): string {
  const initials = getInitials(fullName);
  const gradients = [
    ['#ff9a9e', '#fecfef'], // Peach
    ['#a1c4fd', '#c2e9fb'], // Light blue
    ['#84fab0', '#8fd3f4'], // Spring/mint
    ['#fccb90', '#d5d2e8'], // Orange/lavender
    ['#cfd9df', '#e2ebf0'], // Silver
    ['#a6c0fe', '#f68084'], // Indigo pink
    ['#fad0c4', '#ffd1ff']  // Pink gradient
  ];
  
  const index = Math.abs(fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % gradients.length;
  const grad = gradients[index];
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${grad[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${grad[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad-${index})" />
      <text x="50%" y="54%" font-family="'Outfit', sans-serif" font-size="36" font-weight="700" fill="#2d3748" dominant-baseline="middle" text-anchor="middle">${initials}</text>
    </svg>
  `;
  
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

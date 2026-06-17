import { state } from '../common/state';
import { saveRecord } from '../../services/storage';
import { triggerConfetti } from '../../utils/confetti';
import { renderGarden } from './garden';

let timerInterval: any = null;
let isTimerRunning = false;
let currentMinutes = 25;
let currentSeconds = 0;
let currentPhase: 'work' | 'short' | 'long' = 'work';
let originalTitle = document.title;

// Helper: Get language preference
function getLang(): 'vi' | 'en' {
  return (localStorage.getItem('LICHTRINH_LANG') || 'vi') as 'vi' | 'en';
}

// Helper: Synthesize alert sound using Web Audio API
function playAlertSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play double beep
    const playBeep = (freq: number, startDelay: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + startDelay);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startDelay);
      gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + startDelay + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startDelay + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime + startDelay);
      oscillator.stop(audioCtx.currentTime + startDelay + duration);
    };

    playBeep(523.25, 0, 0.4);      // C5 note
    playBeep(659.25, 0.5, 0.6);    // E5 note
  } catch (e) {
    console.warn('Web Audio API not supported or blocked by user interaction policy', e);
  }
}

// Load custom timer configuration
function loadPomoDurations(): { work: number; short: number; long: number } {
  const work = parseInt(localStorage.getItem('LICHTRINH_POMO_TIME_FOCUS') || '25');
  const short = parseInt(localStorage.getItem('LICHTRINH_POMO_TIME_SHORT') || '5');
  const long = parseInt(localStorage.getItem('LICHTRINH_POMO_TIME_LONG') || '15');
  return { work, short, long };
}

// Sync tab durations to attributes and update state
function updatePomoTabsDurations() {
  const { work, short, long } = loadPomoDurations();
  const workTab = document.querySelector('.pomo-tab[data-phase="work"]');
  const shortTab = document.querySelector('.pomo-tab[data-phase="short"]');
  const longTab = document.querySelector('.pomo-tab[data-phase="long"]');

  if (workTab) {
    workTab.setAttribute('data-time', work.toString());
    if (workTab.classList.contains('active')) {
      currentMinutes = work;
    }
  }
  if (shortTab) {
    shortTab.setAttribute('data-time', short.toString());
    if (shortTab.classList.contains('active')) {
      currentMinutes = short;
    }
  }
  if (longTab) {
    longTab.setAttribute('data-time', long.toString());
    if (longTab.classList.contains('active')) {
      currentMinutes = long;
    }
  }
  
  if (!isTimerRunning) {
    currentSeconds = 0;
    updateDisplay();
  }
}

function updateDisplay() {
  const minsStr = String(currentMinutes).padStart(2, '0');
  const secsStr = String(currentSeconds).padStart(2, '0');
  const displayVal = `${minsStr}:${secsStr}`;
  
  const timerDisplay = document.getElementById('focus-timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = displayVal;
  }
  
  let phaseLabel = 'Focus';
  if (currentPhase === 'short') phaseLabel = 'Break';
  if (currentPhase === 'long') phaseLabel = 'Break';
  document.title = `(${displayVal}) ${phaseLabel} | Lịch Trình Tracker`;
}

export function initFocusMode(): void {
  const btnFocusMode = document.getElementById('btn-focus-mode');
  const focusOverlay = document.getElementById('focus-overlay');
  const btnExitFocus = document.getElementById('btn-exit-focus');
  const timerDisplay = document.getElementById('focus-timer-display');
  
  const pomoTabs = document.querySelectorAll('.pomo-tab');
  const btnTimerStart = document.getElementById('btn-timer-start') as HTMLButtonElement;
  const btnTimerReset = document.getElementById('btn-timer-reset') as HTMLButtonElement;
  
  const taskInput = document.getElementById('focus-task-input') as HTMLInputElement;
  const taskActive = document.getElementById('focus-task-active') as HTMLElement;

  // Custom configurations panel elements
  const btnSettingsToggle = document.getElementById('btn-pomo-settings-toggle') as HTMLButtonElement;
  const settingsPanel = document.getElementById('pomo-settings-panel') as HTMLDivElement;
  const btnSettingsSave = document.getElementById('btn-pomo-settings-save') as HTMLButtonElement;

  const inputFocus = document.getElementById('input-pomo-focus') as HTMLInputElement;
  const inputShort = document.getElementById('input-pomo-short') as HTMLInputElement;
  const inputLong = document.getElementById('input-pomo-long') as HTMLInputElement;

  if (!btnFocusMode || !focusOverlay || !btnExitFocus || !timerDisplay || !btnTimerStart || !btnTimerReset || !taskInput || !taskActive) {
    return;
  }

  // 1. Open Focus Mode Overlay
  btnFocusMode.addEventListener('click', () => {
    originalTitle = document.title;
    focusOverlay.style.display = 'flex';
    setTimeout(() => {
      focusOverlay.classList.add('active');
    }, 10);
    
    // Load custom times & populate settings inputs
    updatePomoTabsDurations();
    const { work, short, long } = loadPomoDurations();
    if (inputFocus) inputFocus.value = work.toString();
    if (inputShort) inputShort.value = short.toString();
    if (inputLong) inputLong.value = long.toString();

    // Hide settings panel on open
    if (settingsPanel) settingsPanel.style.display = 'none';

    translateFocusUI();
  });

  // 2. Exit Focus Mode
  btnExitFocus.addEventListener('click', () => {
    if (isTimerRunning) {
      pauseTimer();
    }
    
    focusOverlay.classList.remove('active');
    setTimeout(() => {
      focusOverlay.style.display = 'none';
    }, 300);
    
    document.title = originalTitle;
  });

  // 3. Tab switching (Tomato, break, long break)
  pomoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      pomoTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const timeVal = parseInt(tab.getAttribute('data-time') || '25');
      const phaseVal = tab.getAttribute('data-phase') as 'work' | 'short' | 'long';
      
      currentPhase = phaseVal;
      currentMinutes = timeVal;
      currentSeconds = 0;
      
      if (isTimerRunning) {
        pauseTimer();
      }
      
      updateDisplay();
    });
  });

  // 4. Timer Controls
  btnTimerStart.addEventListener('click', () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  btnTimerReset.addEventListener('click', () => {
    resetTimer();
  });

  // 5. Settings Wiring
  if (btnSettingsToggle && settingsPanel) {
    btnSettingsToggle.addEventListener('click', () => {
      const isHidden = settingsPanel.style.display === 'none';
      settingsPanel.style.display = isHidden ? 'flex' : 'none';
    });
  }

  if (btnSettingsSave && inputFocus && inputShort && inputLong) {
    btnSettingsSave.addEventListener('click', () => {
      let fVal = parseInt(inputFocus.value);
      let sVal = parseInt(inputShort.value);
      let lVal = parseInt(inputLong.value);

      if (isNaN(fVal) || fVal < 1) fVal = 25;
      if (isNaN(sVal) || sVal < 1) sVal = 5;
      if (isNaN(lVal) || lVal < 1) lVal = 15;

      localStorage.setItem('LICHTRINH_POMO_TIME_FOCUS', fVal.toString());
      localStorage.setItem('LICHTRINH_POMO_TIME_SHORT', sVal.toString());
      localStorage.setItem('LICHTRINH_POMO_TIME_LONG', lVal.toString());

      updatePomoTabsDurations();

      if (settingsPanel) {
        settingsPanel.style.display = 'none';
      }
    });
  }

  function startTimer() {
    isTimerRunning = true;
    
    const taskText = taskInput.value.trim();
    if (taskText) {
      taskActive.textContent = taskText;
      taskActive.style.display = 'block';
      taskInput.style.display = 'none';
    } else {
      const isVi = getLang() === 'vi';
      taskActive.textContent = isVi ? '🎯 Đang tập trung làm việc...' : '🎯 Focusing...';
      taskActive.style.display = 'block';
      taskInput.style.display = 'none';
    }
    
    btnTimerReset.style.display = 'inline-block';
    updateStartBtnLabel();

    timerInterval = setInterval(() => {
      if (currentSeconds === 0) {
        if (currentMinutes === 0) {
          handleTimerEnd();
          return;
        }
        currentMinutes--;
        currentSeconds = 59;
      } else {
        currentSeconds--;
      }
      updateDisplay();
    }, 1000);
  }

  function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    updateStartBtnLabel();
    
    taskActive.style.display = 'none';
    taskInput.style.display = 'block';
  }

  function resetTimer() {
    pauseTimer();
    
    const activeTab = document.querySelector('.pomo-tab.active');
    const timeVal = parseInt(activeTab ? activeTab.getAttribute('data-time') || '25' : '25');
    currentMinutes = timeVal;
    currentSeconds = 0;
    
    taskInput.value = '';
    btnTimerReset.style.display = 'none';
    
    updateDisplay();
  }

  function handleTimerEnd() {
    pauseTimer();
    playAlertSound();
    
    const isVi = getLang() === 'vi';
    let phaseName = 'tập trung';
    if (currentPhase === 'short') phaseName = 'nghỉ ngơi ngắn';
    if (currentPhase === 'long') phaseName = 'nghỉ ngơi dài';
    
    const message = isVi
      ? `Đã hết thời gian ${phaseName}! Hãy chuyển giai đoạn tiếp theo.`
      : `Phase completed! Time to switch.`;
      
    alert(message);

    // Gamification Reward: Grow Habit Garden if work phase completed
    if (currentPhase === 'work' && state.currentUser && state.currentRecord) {
      if (!state.currentRecord.wateredDays) {
        state.currentRecord.wateredDays = [];
      }
      const today = new Date();
      const actualDay = today.getDate();
      
      // Register watering session
      state.currentRecord.wateredDays.push(actualDay);
      saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
      
      // Animate growth & refresh garden view
      triggerConfetti();
      renderGarden();
      
      setTimeout(() => {
        const bonusMsg = isVi
          ? `🎉 Tuyệt vời! Bạn đã hoàn thành 1 phiên tập trung Pomodoro và được cộng 1 lượt tưới nước cho Khu Vườn Thói Quen! Hãy kiểm tra sự phát triển của cây ngay nhé!`
          : `🎉 Awesome! You completed a Pomodoro focus session and received 1 watering for the Habit Garden! Check on your plant's growth now!`;
        alert(bonusMsg);
      }, 500);
    }
    
    resetTimer();
  }

  function updateStartBtnLabel() {
    const isVi = getLang() === 'vi';
    if (isTimerRunning) {
      btnTimerStart.innerHTML = isVi ? '⏸ Tạm dừng' : '⏸ Pause';
      btnTimerStart.classList.add('secondary');
    } else {
      btnTimerStart.innerHTML = isVi ? '▶ Bắt đầu' : '▶ Start';
      btnTimerStart.classList.remove('secondary');
    }
  }

  function translateFocusUI() {
    const isVi = getLang() === 'vi';
    
    if (btnExitFocus) {
      btnExitFocus.innerHTML = isVi ? '✕ Thoát tập trung' : '✕ Exit Focus';
    }
    
    if (taskInput) {
      taskInput.placeholder = isVi 
        ? 'Mục tiêu tập trung của bạn hôm nay là gì?...' 
        : 'What is your focus target today?...';
    }
      
    updateStartBtnLabel();
    
    if (btnTimerReset) {
      btnTimerReset.innerHTML = isVi ? '🔄 Cài lại' : '🔄 Reset';
    }

    // Translate Settings Button & Labels
    if (btnSettingsToggle) {
      btnSettingsToggle.innerHTML = isVi ? '⚙️ Thiết lập thời gian' : '⚙️ Custom Durations';
    }
    if (btnSettingsSave) {
      btnSettingsSave.innerHTML = isVi ? 'Áp dụng' : 'Apply';
    }

    const focusSpan = document.querySelector('[data-i18n="pomo_focus_label"]') as HTMLElement;
    const shortSpan = document.querySelector('[data-i18n="pomo_short_label"]') as HTMLElement;
    const longSpan = document.querySelector('[data-i18n="pomo_long_label"]') as HTMLElement;

    if (focusSpan) focusSpan.textContent = isVi ? '🍅 Tập trung (Min):' : '🍅 Focus (Min):';
    if (shortSpan) shortSpan.textContent = isVi ? '☕ Nghỉ ngắn (Min):' : '☕ Short Break (Min):';
    if (longSpan) longSpan.textContent = isVi ? '🚶 Nghỉ dài (Min):' : '🚶 Long Break (Min):';
  }
}

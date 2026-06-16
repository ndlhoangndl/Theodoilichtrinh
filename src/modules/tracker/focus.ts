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

  if (!btnFocusMode || !focusOverlay || !btnExitFocus || !timerDisplay || !btnTimerStart || !btnTimerReset || !taskInput || !taskActive) {
    return;
  }

  // 1. Open Focus Mode Overlay
  btnFocusMode.addEventListener('click', () => {
    originalTitle = document.title;
    focusOverlay.style.display = 'flex';
    // Allow small delay for transition opacity
    setTimeout(() => {
      focusOverlay.classList.add('active');
    }, 10);
    
    // Auto translate text on entry
    translateFocusUI();
  });

  // 2. Exit Focus Mode
  btnExitFocus.addEventListener('click', () => {
    // Pause timer if running
    if (isTimerRunning) {
      pauseTimer();
    }
    
    focusOverlay.classList.remove('active');
    setTimeout(() => {
      focusOverlay.style.display = 'none';
    }, 300);
    
    // Restore title
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
      
      // If timer is running, pause it
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



  function startTimer() {
    isTimerRunning = true;
    
    // Hide input, show active task text
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
          // Timer finished
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
    
    // Re-show input
    taskActive.style.display = 'none';
    taskInput.style.display = 'block';
  }

  function resetTimer() {
    pauseTimer();
    
    // Find active tab duration
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
    
    // Prompt alert
    let phaseName = 'tập trung';
    if (currentPhase === 'short') phaseName = 'nghỉ ngơi ngắn';
    if (currentPhase === 'long') phaseName = 'nghỉ ngơi dài';
    
    const message = isVi
      ? `Đã hết thời gian ${phaseName}! Hãy chuyển giai đoạn tiếp theo.`
      : `Phase completed! Time to switch.`;
      
    alert(message);
    
    resetTimer();
  }

  function updateDisplay() {
    const minsStr = String(currentMinutes).padStart(2, '0');
    const secsStr = String(currentSeconds).padStart(2, '0');
    const displayVal = `${minsStr}:${secsStr}`;
    
    if (timerDisplay) {
      timerDisplay.textContent = displayVal;
    }
    
    // Update document title bar
    let phaseLabel = 'Focus';
    if (currentPhase === 'short') phaseLabel = 'Break';
    if (currentPhase === 'long') phaseLabel = 'Break';
    document.title = `(${displayVal}) ${phaseLabel} | Lịch Trình Tracker`;
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
    
    // Exit button
    if (btnExitFocus) {
      btnExitFocus.innerHTML = isVi ? '✕ Thoát tập trung' : '✕ Exit Focus';
    }
    
    // Input placeholder
    if (taskInput) {
      taskInput.placeholder = isVi 
        ? 'Mục tiêu tập trung của bạn hôm nay là gì?...' 
        : 'What is your focus target today?...';
    }
      
    // Update Start Button
    updateStartBtnLabel();
    
    // Update Reset Button
    if (btnTimerReset) {
      btnTimerReset.innerHTML = isVi ? '🔄 Cài lại' : '🔄 Reset';
    }
  }
}

import { state } from '../common/state';
import { getDaysInMonth, MONTH_NAMES } from '../../utils/calendar';
import { saveRecord } from '../../services/storage';
import { calculateStreak, calculateStats } from './tracker';

export function initMonthlyReview(): void {
  const modal = document.getElementById('modal-monthly-review') as HTMLElement;
  const btnOpen = document.getElementById('btn-open-monthly-review');
  const btnClose = modal?.querySelector('.modal-close-trigger');
  
  if (!modal || !btnOpen || !btnClose) return;

  // Open Modal -> Reset to Step 1 and populate stats
  btnOpen.addEventListener('click', () => {
    openReviewModal();
  });

  btnClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Step 1 -> Step 2
  const btnNext = modal.querySelector('.btn-next-step');
  btnNext?.addEventListener('click', () => {
    const step1 = document.getElementById('review-step-1');
    const step2 = document.getElementById('review-step-2');
    if (step1 && step2) {
      step1.style.display = 'none';
      step2.style.display = 'block';
    }
  });

  // Step 2 -> Step 1
  const btnPrev = modal.querySelector('.btn-prev-step');
  btnPrev?.addEventListener('click', () => {
    const step1 = document.getElementById('review-step-1');
    const step2 = document.getElementById('review-step-2');
    if (step1 && step2) {
      step1.style.display = 'block';
      step2.style.display = 'none';
    }
  });

  // Save Review
  const btnSave = modal.querySelector('.btn-save-review') as HTMLButtonElement;
  btnSave?.addEventListener('click', () => {
    if (!state.currentUser || !state.currentRecord) return;

    const q1Val = (document.getElementById('review-q1') as HTMLTextAreaElement).value.trim();
    const q2Val = (document.getElementById('review-q2') as HTMLTextAreaElement).value.trim();
    const q3Val = (document.getElementById('review-q3') as HTMLTextAreaElement).value.trim();

    state.currentRecord.monthlyReview = {
      q1: q1Val,
      q2: q2Val,
      q3: q3Val,
      completedAt: new Date().toLocaleDateString()
    };

    saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
    modal.classList.remove('active');
    
    // Refresh UI
    renderMemoryBook();
  });
}

export function openReviewModal(): void {
  const modal = document.getElementById('modal-monthly-review') as HTMLElement;
  if (!modal || !state.currentUser || !state.currentRecord) return;

  const step1 = document.getElementById('review-step-1');
  const step2 = document.getElementById('review-step-2');
  if (step1 && step2) {
    step1.style.display = 'block';
    step2.style.display = 'none';
  }

  // Pre-populate input values if already reviewed
  const q1 = document.getElementById('review-q1') as HTMLTextAreaElement;
  const q2 = document.getElementById('review-q2') as HTMLTextAreaElement;
  const q3 = document.getElementById('review-q3') as HTMLTextAreaElement;
  
  if (q1 && q2 && q3) {
    q1.value = state.currentRecord.monthlyReview?.q1 || '';
    q2.value = state.currentRecord.monthlyReview?.q2 || '';
    q3.value = state.currentRecord.monthlyReview?.q3 || '';
  }

  // Calculate statistics for Step 1
  const stats = calculateStats();
  const daysCount = getDaysInMonth(state.currentYear, state.currentMonth);
  const mood = state.currentRecord.mood || [];

  // Mood average calculation
  const validMoods = mood.filter(v => v > 0);
  const avgMood = validMoods.length > 0 ? (validMoods.reduce((a, b) => a + b, 0) / validMoods.length).toFixed(1) : '---';

  // Best habit spotlight
  let bestHabitName = '---';
  let bestHabitRate = -1;
  let bestStreak = 0;

  state.habits.forEach(h => {
    const hChecks = state.currentRecord!.checks[h.id] || [];
    const actual = hChecks.filter(c => c).length;
    const rate = daysCount > 0 ? (actual / daysCount) * 100 : 0;
    const { maxStreak } = calculateStreak(h.id, hChecks, state.currentUser!.username, state.currentYear, state.currentMonth, state.habits);

    if (rate > bestHabitRate) {
      bestHabitRate = rate;
      bestHabitName = `${h.emoji} ${h.name}`;
      bestStreak = maxStreak;
    }
  });

  const step1Stats = modal.querySelector('.review-stats-summary');
  if (step1Stats) {
    const labelRate = state.currentLang === 'vi' ? 'Tỉ lệ hoàn thành thói quen:' : 'Habit Completion Rate:';
    const labelMood = state.currentLang === 'vi' ? 'Tâm trạng trung bình:' : 'Average Mood Score:';
    const labelBest = state.currentLang === 'vi' ? 'Thói quen tốt nhất:' : 'Consistency Champ:';
    const labelStreak = state.currentLang === 'vi' ? 'Chuỗi hoàn thành dài nhất:' : 'Longest Streak:';

    step1Stats.innerHTML = `
      <div style="background:var(--bg-widget); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px; text-align:center;">
        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">${labelRate}</div>
        <div style="font-size:24px; font-weight:700; color:var(--accent-green); margin-top:4px;">${Math.round(stats.completionRate)}%</div>
      </div>
      <div style="background:var(--bg-widget); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px; text-align:center;">
        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">${labelMood}</div>
        <div style="font-size:24px; font-weight:700; color:var(--accent-orange); margin-top:4px;">🎭 ${avgMood}</div>
      </div>
      <div style="background:var(--bg-widget); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px; text-align:center; grid-column:1/-1;">
        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">${labelBest}</div>
        <div style="font-size:14px; font-weight:700; color:var(--text-main);">${bestHabitName} (${Math.round(bestHabitRate)}% - ${labelStreak} 🔥 ${bestStreak})</div>
      </div>
    `;
  }

  modal.classList.add('active');
}

export function renderMemoryBook(): void {
  const container = document.getElementById('memory-cards-list');
  if (!container || !state.currentUser || !state.currentRecord) return;

  const review = state.currentRecord.monthlyReview;
  const lang = state.currentLang;
  const monthLabel = lang === 'vi' ? `Tháng ${state.currentMonth + 1}` : MONTH_NAMES[state.currentMonth];

  if (!review) {
    // If not reviewed yet
    container.innerHTML = `
      <div style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 30px 20px; background:var(--bg-widget); border:1px dashed var(--border-color-dark); border-radius:var(--radius-md); gap:12px;">
        <span style="font-size: 32px;">📓</span>
        <div style="font-size: 14px; font-weight: 600; color: var(--text-main);">
          ${lang === 'vi' 
            ? `Nhìn lại tháng ${state.currentMonth + 1} / ${state.currentYear} đang chờ bạn` 
            : `Review for ${monthLabel} ${state.currentYear} is waiting`}
        </div>
        <p style="font-size: 12px; color: var(--text-muted); max-width: 320px; line-height: 1.5; margin: 0 0 4px 0;">
          ${lang === 'vi' 
            ? 'Dành ra 2 phút phản tư để đúc kết kinh nghiệm, bài học quý giá và lưu trữ thẻ kỷ niệm tháng này!' 
            : 'Spend 2 minutes reflecting on your achievements, lessons, and compile your memory card!'}
        </p>
        <button class="btn" id="btn-create-review-inside" style="font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:6px; padding:8px 16px;">✍️ ${lang === 'vi' ? 'Nhìn lại tháng này' : 'Write Review'}</button>
      </div>
    `;

    // Bind click inside
    document.getElementById('btn-create-review-inside')?.addEventListener('click', () => {
      openReviewModal();
    });
    
    // Update main button in header
    const btnOpenHeader = document.getElementById('btn-open-monthly-review');
    if (btnOpenHeader) {
      btnOpenHeader.textContent = lang === 'vi' ? '✍️ Viết Nhìn Lại' : '✍️ Write Review';
    }
    return;
  }

  // If monthly review completed, render polaroid card
  const stats = calculateStats();
  const mood = state.currentRecord.mood || [];
  const validMoods = mood.filter(v => v > 0);
  const avgMood = validMoods.length > 0 ? (validMoods.reduce((a, b) => a + b, 0) / validMoods.length).toFixed(1) : '---';

  const labelQ1 = lang === 'vi' ? '🌟 Tự hào nhất:' : '🌟 Most Proud Of:';
  const labelQ2 = lang === 'vi' ? '📖 Bài học lớn:' : '📖 Biggest Lesson:';
  const labelQ3 = lang === 'vi' ? '🚀 Cải tiến tháng tới:' : '🚀 Improve Next Month:';
  const labelCompleted = lang === 'vi' ? 'Hoàn thành ngày:' : 'Completed on:';
  const labelEdit = lang === 'vi' ? 'Chỉnh sửa' : 'Edit';

  // Polaroid markup
  container.innerHTML = `
    <div class="polaroid-card animate-polaroid" style="grid-column: 1 / -1; background:#fff; border:1px solid #e2e2e2; box-shadow: 0 10px 20px rgba(0,0,0,0.06); padding: 20px 20px 30px 20px; border-radius: 4px; display:flex; flex-direction:column; gap:16px; font-family:'Plus Jakarta Sans', sans-serif; position:relative; overflow:hidden;">
      <!-- Tape graphic at top -->
      <div style="position:absolute; top:-6px; left:50%; transform:translateX(-50%) rotate(-1deg); width:110px; height:24px; background:rgba(216, 205, 191, 0.4); border-left:1px dashed #bbaea1; border-right:1px dashed #bbaea1; z-index:2;"></div>
      
      <!-- Polaroid Content Row (Split into stats summary & reflections text) -->
      <div class="polaroid-row" style="display:grid; grid-template-columns:1fr; gap:16px;">
        <!-- Left Side: Custom Polaroid Stats Banner -->
        <div style="background:#fefbf7; border:1px solid #eae2d5; border-radius:6px; padding:12px; display:flex; flex-direction:column; gap:10px; color:#3d352f;">
          <div style="font-family:'Outfit', sans-serif; font-size:18px; font-weight:700; border-bottom:1px solid #eae2d5; padding-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
            <span>✨ MEMORY CARD</span>
            <span style="font-size:12px; font-weight:500; opacity:0.8;">${monthLabel} / ${state.currentYear}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
            <span>🎯 Thói quen đạt:</span>
            <strong style="color:var(--accent-green); font-size:14px;">${Math.round(stats.completionRate)}%</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
            <span>🎭 Tâm trạng tb:</span>
            <strong style="color:var(--accent-orange); font-size:14px;">${avgMood}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
            <span>💧 Số ngày tưới cây:</span>
            <strong style="color:var(--accent-blue); font-size:14px;">${state.currentRecord.wateredDays?.length || 0} ngày</strong>
          </div>
        </div>

        <!-- Right Side: Reflection Q&As -->
        <div style="display:flex; flex-direction:column; gap:12px; color:#4a423a;">
          <div style="font-size:12px; line-height:1.5;">
            <div style="font-weight:700; font-family:'Outfit', sans-serif; color:#231d1a; margin-bottom:2px;">${labelQ1}</div>
            <p style="margin:0; font-style:italic; border-left:2px solid var(--accent-green); padding-left:8px; font-size:13px;">"${review.q1 || '...'}"</p>
          </div>
          <div style="font-size:12px; line-height:1.5;">
            <div style="font-weight:700; font-family:'Outfit', sans-serif; color:#231d1a; margin-bottom:2px;">${labelQ2}</div>
            <p style="margin:0; font-style:italic; border-left:2px solid var(--accent-orange); padding-left:8px; font-size:13px;">"${review.q2 || '...'}"</p>
          </div>
          <div style="font-size:12px; line-height:1.5;">
            <div style="font-weight:700; font-family:'Outfit', sans-serif; color:#231d1a; margin-bottom:2px;">${labelQ3}</div>
            <p style="margin:0; font-style:italic; border-left:2px solid var(--accent-brown); padding-left:8px; font-size:13px;">"${review.q3 || '...'}"</p>
          </div>
        </div>
      </div>
      
      <!-- Polaroid bottom handwriting caption area -->
      <div style="border-top:1px dashed #eae2d5; padding-top:12px; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#7c6d60; font-style:italic;">
        <span>${labelCompleted} ${review.completedAt}</span>
        <button class="btn btn-sm btn-edit-review" style="font-size:11px; padding:3px 8px; font-style:normal; height:auto; display:inline-flex; align-items:center; gap:4px;">✍️ ${labelEdit}</button>
      </div>
    </div>
  `;

  // Apply responsive grid layout dynamically using grid media query
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @media (min-width: 768px) {
      .polaroid-row {
        grid-template-columns: 1fr 2fr !important;
      }
    }
  `;
  container.appendChild(styleEl);

  // Bind edit action
  container.querySelector('.btn-edit-review')?.addEventListener('click', () => {
    openReviewModal();
  });

  // Update header button to edit state
  const btnOpenHeader = document.getElementById('btn-open-monthly-review');
  if (btnOpenHeader) {
    btnOpenHeader.textContent = lang === 'vi' ? '✍️ Chỉnh Sửa' : '✍️ Edit Review';
  }
}

import { state } from '../common/state';
import { saveRecord } from '../../services/storage';
import { triggerConfetti } from '../../utils/confetti';

export function renderGarden(): void {
  if (!state.currentUser || !state.currentRecord) return;

  const plantContainer = document.getElementById('garden-plant-container');
  const growthLabel = document.getElementById('garden-growth-percent');
  const statusText = document.getElementById('garden-status-text');
  const waterBtn = document.getElementById('btn-water-plant') as HTMLButtonElement;

  if (!plantContainer || !growthLabel || !statusText || !waterBtn) return;

  const wateredDays = state.currentRecord.wateredDays || [];
  const wateredCount = wateredDays.length;

  // Determine stage and progress
  let stageName = '';
  let stagePercent = 0;
  let stageKey = ''; // for styling/labels

  if (wateredCount === 0) {
    stageKey = 'seed';
    stageName = state.currentLang === 'vi' ? 'Hạt mầm' : 'Seed';
    stagePercent = 0;
  } else if (wateredCount <= 4) {
    stageKey = 'sprout';
    stageName = state.currentLang === 'vi' ? 'Chồi non' : 'Sprout';
    stagePercent = Math.round((wateredCount / 4) * 100);
  } else if (wateredCount <= 11) {
    stageKey = 'small';
    stageName = state.currentLang === 'vi' ? 'Cây con' : 'Small Plant';
    stagePercent = Math.round(((wateredCount - 4) / 7) * 100);
  } else if (wateredCount <= 19) {
    stageKey = 'mature';
    stageName = state.currentLang === 'vi' ? 'Cây lớn' : 'Mature Plant';
    stagePercent = Math.round(((wateredCount - 11) / 8) * 100);
  } else {
    stageKey = 'flower';
    stageName = state.currentLang === 'vi' ? 'Nở hoa 🌸' : 'Flowering 🌸';
    stagePercent = 100;
  }

  // Update growth badge
  growthLabel.textContent = `${state.currentLang === 'vi' ? 'Cấp' : 'Lvl'}: ${stageName} (${stagePercent}%)`;

  // Withered check: only applies to current year and month
  let isWithered = false;
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === state.currentYear && today.getMonth() === state.currentMonth;
  const actualDay = today.getDate();

  if (isCurrentMonth) {
    const isWateredToday = wateredDays.includes(actualDay);
    if (!isWateredToday && actualDay > 3) {
      const hasRecentWatering = [actualDay - 1, actualDay - 2, actualDay - 3].some(d => wateredDays.includes(d));
      if (!hasRecentWatering) {
        isWithered = true;
      }
    }
  }

  // Build Plant SVG
  plantContainer.innerHTML = drawPlantSVG(stageKey, !isWithered);

  // Watering Eligibility check for today
  const totalHabits = state.habits.length;
  const isWateredToday = wateredDays.includes(actualDay);

  if (!isCurrentMonth) {
    // Cannot water past or future months
    waterBtn.disabled = true;
    statusText.textContent = state.currentLang === 'vi'
      ? 'Chỉ có thể tưới nước trong tháng hiện tại.'
      : 'Watering is only active for the current month.';
  } else if (totalHabits === 0) {
    waterBtn.disabled = true;
    statusText.textContent = state.currentLang === 'vi'
      ? 'Thêm ít nhất 1 thói quen để bắt đầu!'
      : 'Add at least 1 habit to start!';
  } else if (isWateredToday) {
    waterBtn.disabled = true;
    statusText.textContent = state.currentLang === 'vi'
      ? 'Hôm nay cây đã được tưới nước đầy đủ! 💧'
      : 'The plant is fully watered for today! 💧';
  } else {
    // Calculate today's completion rate
    // Note: actualDay is 1-based, we translate it to 0-based index for record checks array
    const dayIndex = actualDay - 1;
    let checkedCount = 0;
    
    state.habits.forEach(h => {
      if (state.currentRecord!.checks[h.id] && state.currentRecord!.checks[h.id][dayIndex]) {
        checkedCount++;
      }
    });

    const completionRate = checkedCount / totalHabits;
    const meetsThreshold = completionRate >= 0.7;

    if (meetsThreshold) {
      waterBtn.disabled = false;
      statusText.textContent = state.currentLang === 'vi'
        ? 'Đã đạt chỉ tiêu thói quen! Hãy tưới nước thôi! 🎉'
        : 'Habit target met! Click to water the plant! 🎉';
    } else {
      waterBtn.disabled = true;
      const needed = Math.ceil(totalHabits * 0.7) - checkedCount;
      statusText.textContent = state.currentLang === 'vi'
        ? `Hoàn thành thêm ${needed} thói quen hôm nay để tưới nước (>=70%).`
        : `Complete ${needed} more habit(s) today to water (>=70%).`;
    }
  }

  // If withered, override status text to indicate urgency
  if (isWithered) {
    statusText.innerHTML = state.currentLang === 'vi'
      ? '<span style="color:var(--accent-orange);">⚠️ Cây đang bị héo do thiếu nước! Hãy hoàn thành mục tiêu hôm nay để cứu cây!</span>'
      : '<span style="color:var(--accent-orange);">⚠️ The plant is withering! Complete today\'s habits to save it!</span>';
  }
}

function drawPlantSVG(stage: string, healthy: boolean): string {
  const strokeColor = healthy ? 'var(--accent-green)' : '#988775';
  const fillColor = healthy ? 'var(--accent-green)' : '#a5937f';
  const flowerFill = healthy ? '#ffffff' : '#bfaea1';
  const centerFill = healthy ? 'var(--accent-orange)' : '#847361';

  // Base pot and soil
  let html = `
    <svg class="garden-plant-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
      <!-- Soil Pot Rim -->
      <ellipse cx="50" cy="110" rx="20" ry="4" fill="var(--bg-selected)" stroke="var(--text-muted)" stroke-width="1" />
      <!-- Soil inside pot -->
      <ellipse cx="50" cy="110" rx="18" ry="3" fill="var(--bg-header-dark)" />
  `;

  // Start rotation group if plant is withered
  if (!healthy) {
    html += `<g transform="rotate(18 50 110)">`;
  }

  // Render plant parts based on stage
  if (stage === 'seed') {
    // Tiny seed lying on soil
    html += `
      <ellipse cx="50" cy="107" rx="3.5" ry="1.8" fill="var(--accent-brown)" stroke="var(--text-muted)" stroke-width="0.8" transform="rotate(-15 50 107)" />
    `;
  } else if (stage === 'sprout') {
    // Small sprout emerging
    html += `
      <!-- Stem -->
      <path class="garden-leaf" d="M 50 110 Q 48 95 53 85" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" />
      <!-- Leaf -->
      <path class="garden-leaf" d="M 53 85 Q 60 83 62 88 Q 57 91 53 85 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
    `;
  } else if (stage === 'small') {
    // Small plant with multiple leaves
    html += `
      <!-- Main stem -->
      <path class="garden-leaf" d="M 50 110 Q 52 85 48 65" fill="none" stroke="${strokeColor}" stroke-width="3.5" stroke-linecap="round" />
      <!-- Bottom Left Leaf -->
      <path class="garden-leaf" d="M 49 88 Q 38 83 36 88 Q 43 92 49 88 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
      <!-- Mid Right Leaf -->
      <path class="garden-leaf" d="M 49 76 Q 58 71 60 77 Q 53 81 49 76 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
      <!-- Top Bud -->
      <path class="garden-leaf" d="M 48 65 Q 43 55 48 48 Q 53 55 48 65 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
    `;
  } else if (stage === 'mature' || stage === 'flower') {
    // Large mature plant
    html += `
      <!-- Main stalk -->
      <path class="garden-leaf" d="M 50 110 Q 52 75 49 45" fill="none" stroke="${strokeColor}" stroke-width="4.5" stroke-linecap="round" />
      <!-- Lower Left Leaf -->
      <path class="garden-leaf" d="M 50 90 Q 36 85 34 93 Q 44 97 50 90 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
      <!-- Lower Right Leaf -->
      <path class="garden-leaf" d="M 51 82 Q 65 77 67 84 Q 59 89 51 82 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
      <!-- Left Branch -->
      <path class="garden-leaf" d="M 50 68 Q 38 61 32 50" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round" />
      <path class="garden-leaf" d="M 32 50 Q 24 44 26 52 Q 32 56 32 50 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
      <!-- Right Branch -->
      <path class="garden-leaf" d="M 50 58 Q 62 53 68 42" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round" />
      <path class="garden-leaf" d="M 68 42 Q 76 34 77 42 Q 71 47 68 42 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
      <!-- Top Sprout -->
      <path class="garden-leaf" d="M 49 45 Q 44 32 49 22 Q 54 32 49 45 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
    `;

    // Add flowers if fully blossomed
    if (stage === 'flower') {
      html += `
        <!-- Flower 1 (Top) -->
        <g class="garden-leaf">
          <circle cx="49" cy="35" r="4.5" fill="${flowerFill}" stroke="var(--text-muted)" stroke-width="0.5" />
          <circle cx="49" cy="35" r="1.8" fill="${centerFill}" />
        </g>
        <!-- Flower 2 (Right) -->
        <g class="garden-leaf">
          <circle cx="58" cy="53" r="4.5" fill="${flowerFill}" stroke="var(--text-muted)" stroke-width="0.5" />
          <circle cx="58" cy="53" r="1.8" fill="${centerFill}" />
        </g>
        <!-- Flower 3 (Left) -->
        <g class="garden-leaf">
          <circle cx="39" cy="60" r="4.5" fill="${flowerFill}" stroke="var(--text-muted)" stroke-width="0.5" />
          <circle cx="39" cy="60" r="1.8" fill="${centerFill}" />
        </g>
      `;
    }
  }

  // End rotation group if withered
  if (!healthy) {
    html += `</g>`;
  }

  // Pot Base
  html += `
      <!-- Soil Pot Body -->
      <path d="M 32 110 L 68 110 L 62 126 L 38 126 Z" fill="var(--accent-brown)" stroke="var(--text-muted)" stroke-width="1" />
    </svg>
  `;

  return html;
}

export function initGarden(): void {
  const waterBtn = document.getElementById('btn-water-plant');
  if (!waterBtn) return;

  waterBtn.addEventListener('click', () => {
    if (!state.currentUser || !state.currentRecord) return;

    const today = new Date();
    const actualDay = today.getDate();

    // Double check record parameters
    if (today.getFullYear() !== state.currentYear || today.getMonth() !== state.currentMonth) return;

    if (!state.currentRecord.wateredDays) {
      state.currentRecord.wateredDays = [];
    }

    if (state.currentRecord.wateredDays.includes(actualDay)) return;

    // Disable button to prevent double-clicks during animation
    const btn = waterBtn as HTMLButtonElement;
    btn.disabled = true;

    // Add today's day number to wateredDays
    state.currentRecord.wateredDays.push(actualDay);
    saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);

    // Trigger watering can overlay animation
    const container = document.getElementById('garden-plant-container');
    if (container) {
      const overlay = document.createElement('div');
      overlay.className = 'watering-overlay';
      overlay.innerHTML = `
        <svg class="watering-can active" viewBox="0 0 36 36" style="overflow: visible;">
          <!-- Spout pointing left -->
          <path d="M 12 24 L 2 18 L 4 16 L 12 20 Z" fill="var(--accent-blue)" />
          <!-- Sprinkler head -->
          <path d="M 2 15 L 0 17 L 3 20 L 5 18 Z" fill="var(--text-muted)" />
          <!-- Body -->
          <rect x="12" y="14" width="16" height="14" rx="3" fill="var(--accent-blue)" />
          <!-- Handle -->
          <path d="M 28 17 C 33 17 33 25 28 25" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-linecap="round" />
          <!-- Top Handle -->
          <path d="M 16 14 C 16 9 24 9 24 14" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-linecap="round" />
        </svg>
        <div class="water-drop"></div>
        <div class="water-drop"></div>
        <div class="water-drop"></div>
        <div class="water-drop"></div>
      `;
      container.appendChild(overlay);

      // Trigger Confetti and Re-render after animation is completed (1.6s)
      setTimeout(() => {
        triggerConfetti();
      }, 800);

      // Clean up overlay and re-render completely at 2s
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        renderGarden();
      }, 2000);
    } else {
      // Fallback if container is missing
      renderGarden();
    }
  });
}

import { state } from '../common/state';
import { saveRecord } from '../../services/storage';
import { triggerConfetti } from '../../utils/confetti';

export function renderGarden(): void {
  if (!state.currentUser || !state.currentRecord) return;

  const plantContainer = document.getElementById('garden-plant-container');
  const growthLabel = document.getElementById('garden-growth-percent');
  const statusText = document.getElementById('garden-status-text');
  const waterBtn = document.getElementById('btn-water-plant') as HTMLButtonElement;
  const seedSelect = document.getElementById('select-garden-seed') as HTMLSelectElement;

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

  // Set active seed dropdown value
  const activeSeed = state.currentRecord.selectedSeed || 'oak';
  if (seedSelect) {
    seedSelect.value = activeSeed;
  }

  // Build Plant SVG
  plantContainer.innerHTML = drawPlantSVG(stageKey, !isWithered, activeSeed);

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
      : '<span style="color:var(--accent-orange);">⚠️ The plant is withered due to lack of water! Complete today\'s habits to save it!</span>';
  }
}

function drawPlantSVG(stage: string, healthy: boolean, seed: string): string {
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

  // Render plant parts based on stage and seed selection
  if (stage === 'seed') {
    // Tiny seed lying on soil
    html += `
      <ellipse cx="50" cy="107" rx="3.5" ry="1.8" fill="var(--accent-brown)" stroke="var(--text-muted)" stroke-width="0.8" transform="rotate(-15 50 107)" />
    `;
  } else {
    if (seed === 'cactus') {
      // 🌵 CACTUS
      const cactusColor = healthy ? '#2e7d32' : '#8d6e63';
      const spikeColor = healthy ? '#81c784' : '#b0bec5';
      const blossomColor = healthy ? '#ff4081' : '#b0bec5';
      
      if (stage === 'sprout') {
        html += `
          <!-- Tiny stub -->
          <rect x="47" y="93" width="6" height="17" rx="3" fill="${cactusColor}" stroke="${strokeColor}" stroke-width="0.8" />
        `;
      } else if (stage === 'small') {
        html += `
          <!-- Main body -->
          <rect x="46" y="80" width="8" height="30" rx="4" fill="${cactusColor}" stroke="${strokeColor}" stroke-width="0.8" />
          <!-- Left arm -->
          <path d="M 46 92 C 40 92 40 85 41 83" fill="none" stroke="${cactusColor}" stroke-width="3" stroke-linecap="round" />
          <!-- Tiny spikes -->
          <line x1="50" y1="84" x2="50" y2="87" stroke="${spikeColor}" stroke-width="0.6" />
          <line x1="43" y1="90" x2="40" y2="90" stroke="${spikeColor}" stroke-width="0.6" />
        `;
      } else if (stage === 'mature' || stage === 'flower') {
        html += `
          <!-- Main body -->
          <rect x="44" y="65" width="12" height="45" rx="6" fill="${cactusColor}" stroke="${strokeColor}" stroke-width="1" />
          <!-- Left arm -->
          <path d="M 44 85 C 34 85 34 72 36 70" fill="none" stroke="${cactusColor}" stroke-width="4.5" stroke-linecap="round" />
          <path d="M 44 85 C 34 85 34 72 36 70" fill="none" stroke="${strokeColor}" stroke-width="1" stroke-linecap="round" style="opacity: 0.3" />
          <!-- Right arm -->
          <path d="M 56 78 C 64 78 65 67 63 65" fill="none" stroke="${cactusColor}" stroke-width="4.5" stroke-linecap="round" />
          
          <!-- Spikes -->
          <line x1="50" y1="72" x2="50" y2="76" stroke="${spikeColor}" stroke-width="0.8" />
          <line x1="40" y1="80" x2="37" y2="80" stroke="${spikeColor}" stroke-width="0.8" />
          <line x1="60" y1="72" x2="63" y2="72" stroke="${spikeColor}" stroke-width="0.8" />
        `;
        if (stage === 'flower') {
          // Flower blossom on top
          html += `
            <ellipse cx="50" cy="62" rx="4" ry="2.5" fill="${blossomColor}" />
            <circle cx="50" cy="62" r="1.5" fill="#ffd54f" />
            <circle cx="36" cy="67" r="2.5" fill="${blossomColor}" />
          `;
        }
      }
    } else if (seed === 'lavender') {
      // 🪻 LAVENDER
      const stemColor = healthy ? '#4caf50' : '#8d6e63';
      const lavenderPurple = healthy ? '#8a2be2' : '#b0bec5';
      const darkPurple = healthy ? '#4b0082' : '#90a4ae';

      if (stage === 'sprout') {
        html += `
          <path d="M 50 110 L 50 92" fill="none" stroke="${stemColor}" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="50" cy="92" r="3.5" fill="${lavenderPurple}" />
        `;
      } else if (stage === 'small') {
        html += `
          <!-- Three small stalks -->
          <path d="M 50 110 Q 48 90 45 75" fill="none" stroke="${stemColor}" stroke-width="1.5" />
          <path d="M 50 110 Q 52 92 55 78" fill="none" stroke="${stemColor}" stroke-width="1.5" />
          <!-- Small flowers -->
          <circle cx="45" cy="75" r="2.5" fill="${lavenderPurple}" />
          <circle cx="44" cy="79" r="2" fill="${darkPurple}" />
          <circle cx="55" cy="78" r="2.5" fill="${lavenderPurple}" />
        `;
      } else if (stage === 'mature' || stage === 'flower') {
        html += `
          <!-- Five tall stalks -->
          <path d="M 50 110 Q 46 80 40 50" fill="none" stroke="${stemColor}" stroke-width="2" />
          <path d="M 50 110 Q 54 84 60 55" fill="none" stroke="${stemColor}" stroke-width="2" />
          <path d="M 50 110 L 50 45" fill="none" stroke="${stemColor}" stroke-width="2.2" />
          
          <!-- Foliage leaves at bottom -->
          <path d="M 50 102 Q 38 100 40 94" fill="none" stroke="${stemColor}" stroke-width="1.5" stroke-linecap="round" />
          <path d="M 50 98 Q 62 96 60 90" fill="none" stroke="${stemColor}" stroke-width="1.5" stroke-linecap="round" />
        `;
        
        const renderBuds = (cx: number, cy: number, count: number) => {
          let buds = '';
          for (let i = 0; i < count; i++) {
            const yOffset = i * 6;
            buds += `
              <circle cx="${cx}" cy="${cy + yOffset}" r="3" fill="${lavenderPurple}" />
              <circle cx="${cx - 2.5}" cy="${cy + yOffset + 2}" r="2" fill="${darkPurple}" />
              <circle cx="${cx + 2.5}" cy="${cy + yOffset + 2}" r="2" fill="${darkPurple}" />
            `;
          }
          return buds;
        };

        // Render lavender flower clusters
        html += renderBuds(50, 45, stage === 'flower' ? 5 : 3);
        html += renderBuds(40, 50, stage === 'flower' ? 4 : 2);
        html += renderBuds(60, 55, stage === 'flower' ? 4 : 2);
      }
    } else if (seed === 'rose') {
      // 🌹 ROSE
      const stemColor = healthy ? '#2e7d32' : '#8d6e63';
      const leafColor = healthy ? '#4caf50' : '#a5937f';
      const roseRed = healthy ? '#e91e63' : '#b0bec5';
      const darkRed = healthy ? '#c2185b' : '#90a4ae';

      if (stage === 'sprout') {
        html += `
          <path d="M 50 110 Q 47 96 50 88" fill="none" stroke="${stemColor}" stroke-width="2" stroke-linecap="round" />
          <circle cx="50" cy="88" r="2.5" fill="${roseRed}" />
        `;
      } else if (stage === 'small') {
        html += `
          <!-- Thorny stem -->
          <path d="M 50 110 Q 52 88 47 70" fill="none" stroke="${stemColor}" stroke-width="2.2" stroke-linecap="round" />
          <!-- Thorns -->
          <line x1="51" y1="92" x2="54" y2="90" stroke="${stemColor}" stroke-width="1" />
          <!-- Side leaf -->
          <path d="M 51 84 Q 60 81 62 85 Q 55 88 51 84 Z" fill="${leafColor}" stroke="${stemColor}" stroke-width="0.5" />
          <!-- Red rose bud -->
          <ellipse cx="47" cy="68" rx="4" ry="5.5" fill="${roseRed}" />
          <path d="M 45 71 Q 47 66 49 71" fill="none" stroke="${darkRed}" stroke-width="1" />
        `;
      } else if (stage === 'mature' || stage === 'flower') {
        html += `
          <!-- Main stalk -->
          <path d="M 50 110 Q 53 78 48 48" fill="none" stroke="${stemColor}" stroke-width="3" stroke-linecap="round" />
          
          <!-- Thorns -->
          <line x1="52" y1="95" x2="56" y2="93" stroke="${stemColor}" stroke-width="1.2" />
          <line x1="48" y1="78" x2="44" y2="76" stroke="${stemColor}" stroke-width="1.2" />
          
          <!-- Branching leaves -->
          <path d="M 52 80 Q 64 78 68 83 Q 58 87 52 80 Z" fill="${leafColor}" stroke="${stemColor}" stroke-width="0.6" />
          <path d="M 48 66 Q 36 62 33 67 Q 44 71 48 66 Z" fill="${leafColor}" stroke="${stemColor}" stroke-width="0.6" />
        `;
        
        if (stage === 'mature') {
          // Closed rosebud
          html += `
            <!-- Sepals -->
            <path d="M 45 50 Q 48 56 51 50 Q 48 46 45 50" fill="${leafColor}" stroke="${stemColor}" stroke-width="0.5" />
            <!-- Rose bud petals -->
            <ellipse cx="48" cy="45" rx="6" ry="8" fill="${roseRed}" />
            <path d="M 44 48 C 44 41 52 41 52 48" fill="none" stroke="${darkRed}" stroke-width="1.5" />
          `;
        } else {
          // Blossomed Rose!
          html += `
            <!-- Sepals -->
            <path d="M 44 51 Q 48 57 52 51" fill="none" stroke="${stemColor}" stroke-width="1.5" />
            <!-- Outer large petals -->
            <circle cx="48" cy="43" r="10" fill="${roseRed}" />
            <circle cx="43" cy="41" r="7" fill="${darkRed}" style="opacity:0.8;" />
            <circle cx="53" cy="41" r="7" fill="${darkRed}" style="opacity:0.8;" />
            <!-- Inner swirl -->
            <ellipse cx="48" cy="43" rx="5" ry="4.5" fill="#f48fb1" />
            <circle cx="48" cy="43" r="2.5" fill="${darkRed}" />
          `;
        }
      }
    } else {
      // 🌳 DEFAULT OAK TREE
      if (stage === 'sprout') {
        html += `
          <!-- Stem -->
          <path class="garden-leaf" d="M 50 110 Q 48 95 53 85" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" />
          <!-- Leaf -->
          <path class="garden-leaf" d="M 53 85 Q 60 83 62 88 Q 57 91 53 85 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5" />
        `;
      } else if (stage === 'small') {
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
  const seedSelect = document.getElementById('select-garden-seed') as HTMLSelectElement;

  if (seedSelect) {
    seedSelect.addEventListener('change', () => {
      if (!state.currentUser || !state.currentRecord) return;
      state.currentRecord.selectedSeed = seedSelect.value;
      saveRecord(state.currentUser.username, state.currentYear, state.currentMonth, state.currentRecord);
      renderGarden();
    });
  }

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

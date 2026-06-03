import { state } from '../common/state';
import { getDaysInMonth, getDayOfWeek } from '../../utils/calendar';
import { calculateStreak } from './tracker';

export function renderCoachInsights(): void {
  if (!state.currentUser || !state.currentRecord || state.habits.length === 0) {
    const insightsContainer = document.getElementById('coach-insights-list');
    if (insightsContainer) {
      insightsContainer.innerHTML = `
        <div style="text-align:center; font-size:13px; color:var(--text-muted); padding: 20px 0; grid-column: 1 / -1;">
          ${state.currentLang === 'vi' 
            ? 'Hãy thêm ít nhất một thói quen và chấm công để trợ lý AI bắt đầu phân tích!' 
            : 'Add at least one habit and check it off for the AI coach to begin analysis!'}
        </div>
      `;
    }
    return;
  }

  const lang = state.currentLang;
  const username = state.currentUser.username;
  const year = state.currentYear;
  const month = state.currentMonth;
  const daysCount = getDaysInMonth(year, month);
  const habits = state.habits;
  const checks = state.currentRecord.checks;
  const mood = state.currentRecord.mood || new Array(daysCount).fill(0);
  const motivation = state.currentRecord.motivation || new Array(daysCount).fill(0);

  // ----------------------------------------------------
  // 1. Analyze Weekday Patterns
  // ----------------------------------------------------
  const weekdayTotals = new Array(7).fill(0); // Sum of checked habits
  const weekdayCounts = new Array(7).fill(0); // Total possible checks (habits * occurrences)

  for (let d = 0; d < daysCount; d++) {
    const dayOfWeek = getDayOfWeek(year, month, d + 1);
    habits.forEach(h => {
      const isChecked = !!(checks[h.id] && checks[h.id][d]);
      if (isChecked) {
        weekdayTotals[dayOfWeek]++;
      }
      weekdayCounts[dayOfWeek]++;
    });
  }

  const weekdayRates = weekdayTotals.map((tot, idx) => {
    const count = weekdayCounts[idx];
    return count > 0 ? (tot / count) * 100 : 0;
  });

  // Filter out weekdays that have 0 possible counts (though in a full month all weekdays occur at least 4 times)
  const activeWeekdays = [0, 1, 2, 3, 4, 5, 6].filter(idx => weekdayCounts[idx] > 0);
  
  let bestDayIdx = 1;
  let worstDayIdx = 6;
  let maxRate = -1;
  let minRate = 101;

  activeWeekdays.forEach(idx => {
    const rate = weekdayRates[idx];
    if (rate > maxRate) {
      maxRate = rate;
      bestDayIdx = idx;
    }
    if (rate < minRate) {
      minRate = rate;
      worstDayIdx = idx;
    }
  });

  const dayNamesVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const bestDayName = lang === 'vi' ? dayNamesVi[bestDayIdx] : dayNamesEn[bestDayIdx];
  const worstDayName = lang === 'vi' ? dayNamesVi[worstDayIdx] : dayNamesEn[worstDayIdx];

  // ----------------------------------------------------
  // 2. Analyze Mood Correlation
  // ----------------------------------------------------
  let highMoodChecks = 0;
  let highMoodPossible = 0;
  let lowMoodChecks = 0;
  let lowMoodPossible = 0;

  for (let d = 0; d < daysCount; d++) {
    const mVal = mood[d] || 0;
    if (mVal >= 7) {
      habits.forEach(h => {
        if (checks[h.id] && checks[h.id][d]) highMoodChecks++;
        highMoodPossible++;
      });
    } else if (mVal > 0 && mVal <= 4) {
      habits.forEach(h => {
        if (checks[h.id] && checks[h.id][d]) lowMoodChecks++;
        lowMoodPossible++;
      });
    }
  }

  const highMoodRate = highMoodPossible > 0 ? (highMoodChecks / highMoodPossible) * 100 : 0;
  const lowMoodRate = lowMoodPossible > 0 ? (lowMoodChecks / lowMoodPossible) * 100 : 0;

  // ----------------------------------------------------
  // 3. Analyze Motivation & Discipline
  // ----------------------------------------------------
  let lowMotChecks = 0;
  let lowMotPossible = 0;

  for (let d = 0; d < daysCount; d++) {
    const motVal = motivation[d] || 0;
    if (motVal > 0 && motVal <= 4) {
      habits.forEach(h => {
        if (checks[h.id] && checks[h.id][d]) lowMotChecks++;
        lowMotPossible++;
      });
    }
  }
  const lowMotRate = lowMotPossible > 0 ? (lowMotChecks / lowMotPossible) * 100 : 0;

  // ----------------------------------------------------
  // 4. Consistency Champion & Worst Habit Spotlight
  // ----------------------------------------------------
  let bestHabitName = '';
  let bestHabitEmoji = '🏆';
  let bestHabitRate = -1;
  let bestStreak = 0;

  let worstHabitName = '';
  let worstHabitEmoji = '💡';
  let worstHabitRate = 101;

  habits.forEach(h => {
    const hChecks = checks[h.id] || new Array(daysCount).fill(false);
    const actual = hChecks.filter(c => c).length;
    const rate = daysCount > 0 ? (actual / daysCount) * 100 : 0;

    const { maxStreak } = calculateStreak(h.id, hChecks, username, year, month, habits);

    if (rate > bestHabitRate || (rate === bestHabitRate && maxStreak > bestStreak)) {
      bestHabitRate = rate;
      bestHabitName = h.name;
      bestHabitEmoji = h.emoji;
      bestStreak = maxStreak;
    }

    if (rate < worstHabitRate) {
      worstHabitRate = rate;
      worstHabitName = h.name;
      worstHabitEmoji = h.emoji;
    }
  });

  // ----------------------------------------------------
  // Generate UI Card Blocks
  // ----------------------------------------------------
  const listContainer = document.getElementById('coach-insights-list');
  if (!listContainer) return;

  let html = '';

  // Card 1: Weekday Patterns
  const weekdayTitle = lang === 'vi' ? '📅 Quy luật sinh hoạt' : '📅 Weekday Pattern';
  let weekdayDesc = '';
  if (maxRate === minRate || maxRate <= 0) {
    weekdayDesc = lang === 'vi'
      ? 'Chưa ghi nhận đủ chênh lệch tần suất hoàn thành thói quen giữa các ngày trong tuần.'
      : 'Not enough data to detect performance variance between weekdays.';
  } else {
    weekdayDesc = lang === 'vi'
      ? `Bạn hoàn thành thói quen tốt nhất vào <strong>${bestDayName}</strong> (đạt <strong>${Math.round(maxRate)}%</strong>), và thấp nhất vào <strong>${worstDayName}</strong> (chỉ <strong>${Math.round(minRate)}%</strong>). Hãy chú ý giữ kỷ luật hơn trong ngày ${worstDayName} nhé!`
      : `Your habit completion peaked on <strong>${bestDayName}</strong> (<strong>${Math.round(maxRate)}%</strong>) and dipped on <strong>${worstDayName}</strong> (<strong>${Math.round(minRate)}%</strong>). Consider reinforcing your weekend focus.`;
  }

  html += `
    <div class="insight-card highlight-border-blue" style="background: var(--bg-widget); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; align-items: flex-start; gap: 12px;">
      <div class="insight-icon bg-soft-blue">📅</div>
      <div class="insight-details" style="display: flex; flex-direction: column; gap: 4px;">
        <div class="insight-label" style="font-size: 13px; font-weight: 700; color: var(--text-main);">${weekdayTitle}</div>
        <p class="insight-desc" style="color: var(--text-main); font-size: 12px; line-height: 1.5; opacity: 0.85; margin: 4px 0 0 0;">${weekdayDesc}</p>
      </div>
    </div>
  `;

  // Card 2: Mood Correlation
  const moodTitle = lang === 'vi' ? '🎭 Ảnh hưởng của tâm trạng' : '🎭 Mood & Productivity';
  let moodDesc = '';

  if (highMoodPossible === 0 && lowMoodPossible === 0) {
    moodDesc = lang === 'vi'
      ? 'Hãy chấm điểm Tâm trạng (Mood) ở bảng Lịch Trình để mở khóa phân tích chỉ số tinh thần.'
      : 'Grade your daily Mood in the spreadsheet to unlock mental correlation analytics.';
  } else if (highMoodPossible > 0 && lowMoodPossible === 0) {
    moodDesc = lang === 'vi'
      ? `Những ngày vui vẻ (Mood ≥ 7), bạn đạt hiệu suất <strong>${Math.round(highMoodRate)}%</strong>. Chưa có đủ ngày tâm trạng thấp để so sánh.`
      : `On high mood days (Mood ≥ 7), you achieve <strong>${Math.round(highMoodRate)}%</strong> completion. Log low mood days to enable comparison.`;
  } else if (highMoodPossible === 0 && lowMoodPossible > 0) {
    moodDesc = lang === 'vi'
      ? `Những ngày đi xuống (Mood ≤ 4), hiệu suất của bạn ở mức <strong>${Math.round(lowMoodRate)}%</strong>. Hãy ghi nhận thêm những ngày tâm trạng tốt để tìm quy luật.`
      : `On low mood days (Mood ≤ 4), your rate is <strong>${Math.round(lowMoodRate)}%</strong>. Log high mood days to trace behavioral changes.`;
  } else {
    const diff = highMoodRate - lowMoodRate;
    if (diff > 15) {
      moodDesc = lang === 'vi'
        ? `Năng lượng của bạn dao động mạnh theo cảm xúc: đạt <strong>${Math.round(highMoodRate)}%</strong> khi vui tươi, nhưng giảm sâu còn <strong>${Math.round(lowMoodRate)}%</strong> khi mệt mỏi. Đề xuất: Hãy thiết lập thói quen siêu nhỏ (tiny habits) cho ngày buồn.`
        : `Emotions heavily drive your output: <strong>${Math.round(highMoodRate)}%</strong> when happy, dropping to <strong>${Math.round(lowMoodRate)}%</strong> when down. Tip: design minimal alternatives for off days.`;
    } else {
      moodDesc = lang === 'vi'
        ? `Tuyệt vời! Hiệu suất của bạn đạt <strong>${Math.round(highMoodRate)}%</strong> ngày vui và vẫn giữ tốt ở mức <strong>${Math.round(lowMoodRate)}%</strong> ngày buồn. Tâm lý của bạn cực kỳ vững vàng và không bị cảm xúc chi phối.`
        : `Fantastic! Your completion is <strong>${Math.round(highMoodRate)}%</strong> on high mood days, and stays steady at <strong>${Math.round(lowMoodRate)}%</strong> on low mood days. You act on system, not mood.`;
    }
  }

  html += `
    <div class="insight-card highlight-border-orange" style="background: var(--bg-widget); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; align-items: flex-start; gap: 12px;">
      <div class="insight-icon bg-soft-orange">🎭</div>
      <div class="insight-details" style="display: flex; flex-direction: column; gap: 4px;">
        <div class="insight-label" style="font-size: 13px; font-weight: 700; color: var(--text-main);">${moodTitle}</div>
        <p class="insight-desc" style="color: var(--text-main); font-size: 12px; line-height: 1.5; opacity: 0.85; margin: 4px 0 0 0;">${moodDesc}</p>
      </div>
    </div>
  `;

  // Card 3: Motivation vs Action
  const motTitle = lang === 'vi' ? '⚡ Kỷ luật & Động lực' : '⚡ Motivation & Discipline';
  let motDesc = '';

  if (lowMotPossible === 0) {
    motDesc = lang === 'vi'
      ? 'Hãy chấm điểm Động lực (Motivation) hàng ngày để phân tích khả năng giữ kỷ luật khi cạn kiệt ý chí.'
      : 'Grade your daily Motivation level to evaluate your discipline under willpower fatigue.';
  } else {
    if (lowMotRate >= 60) {
      motDesc = lang === 'vi'
        ? `<strong>Kỷ luật thép!</strong> Ngay cả khi động lực xuống cực thấp (≤ 4), bạn vẫn kiên trì hoàn thành <strong>${Math.round(lowMotRate)}%</strong> thói quen. Bạn đang vận hành bằng tính tự giác thực sự!`
        : `<strong>Iron discipline!</strong> Even with motivation below 4, you pushed through <strong>${Math.round(lowMotRate)}%</strong> of your tasks. You rely on habits, not excitement!`;
    } else {
      motDesc = lang === 'vi'
        ? `Ý chí của bạn sụt giảm rõ rệt khi động lực đi xuống (hiệu suất chỉ đạt <strong>${Math.round(lowMotRate)}%</strong>). Đề xuất: Hãy ghép cặp thói quen (habit stacking) và loại bỏ các cản trở môi trường xung quanh.`
        : `Willpower drops with low motivation (dips to <strong>${Math.round(lowMotRate)}%</strong>). Recommendation: stack habits or reduce initial friction.`;
    }
  }

  html += `
    <div class="insight-card highlight-border-green" style="background: var(--bg-widget); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; align-items: flex-start; gap: 12px;">
      <div class="insight-icon bg-soft-green">⚡</div>
      <div class="insight-details" style="display: flex; flex-direction: column; gap: 4px;">
        <div class="insight-label" style="font-size: 13px; font-weight: 700; color: var(--text-main);">${motTitle}</div>
        <p class="insight-desc" style="color: var(--text-main); font-size: 12px; line-height: 1.5; opacity: 0.85; margin: 4px 0 0 0;">${motDesc}</p>
      </div>
    </div>
  `;

  // Card 4: Champion Spotlight
  const champTitle = lang === 'vi' ? '🏆 Điểm sáng bền bỉ' : '🏆 Consistency Champ';
  let champDesc = '';

  if (bestHabitRate <= 0) {
    champDesc = lang === 'vi'
      ? 'Chưa tìm được nhà vô địch. Hãy bắt đầu tích lũy chuỗi hoàn thành của bạn!'
      : 'No champion habit found yet. Start ticking checkboxes to build consistency!';
  } else {
    champDesc = lang === 'vi'
      ? `Thói quen <strong>${bestHabitEmoji} ${bestHabitName}</strong> dẫn đầu tháng này với tỷ lệ <strong>${Math.round(bestHabitRate)}%</strong> và chuỗi kỷ lục <strong>🔥 ${bestStreak} ngày</strong> liên tiếp. Thật đáng nể phục!`
      : `<strong>${bestHabitEmoji} ${bestHabitName}</strong> is your best habit this month: completed at <strong>${Math.round(bestHabitRate)}%</strong> with a peak streak of <strong>🔥 ${bestStreak} days</strong>. Incredible work!`;
  }

  html += `
    <div class="insight-card highlight-border-gold" style="background: var(--bg-widget); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; align-items: flex-start; gap: 12px;">
      <div class="insight-icon bg-soft-gold">🏆</div>
      <div class="insight-details" style="display: flex; flex-direction: column; gap: 4px;">
        <div class="insight-label" style="font-size: 13px; font-weight: 700; color: var(--text-main);">${champTitle}</div>
        <p class="insight-desc" style="color: var(--text-main); font-size: 12px; line-height: 1.5; opacity: 0.85; margin: 4px 0 0 0;">${champDesc}</p>
      </div>
    </div>
  `;

  // Card 5: Coach Recommendation
  const recTitle = lang === 'vi' ? '💡 Đề xuất từ Huấn luyện viên' : '💡 Coach Recommendation';
  let recDesc = '';

  if (worstHabitRate === 101 || worstHabitRate >= 90) {
    recDesc = lang === 'vi'
      ? 'Tuyệt vời! Mọi thói quen của bạn đều đang được thực hiện cực kỳ đồng đều và xuất sắc. Hãy tiếp tục giữ vững nhịp độ này!'
      : 'Exceptional! All your habits are executed beautifully and consistently. Keep up this phenomenal streak!';
  } else {
    recDesc = lang === 'vi'
      ? `Thói quen <strong>${worstHabitEmoji} ${worstHabitName}</strong> đang có tỷ số thấp nhất (chỉ <strong>${Math.round(worstHabitRate)}%</strong>). Trợ lý khuyên bạn nên: <strong>Rút ngắn độ dài hoặc giảm chỉ tiêu của nó xuống 1/2</strong>, đồng thời thực hiện nó ngay sau thói quen tốt nhất là <strong>${bestHabitName}</strong>.`
      : `<strong>${worstHabitEmoji} ${worstHabitName}</strong> needs attention (completed at <strong>${Math.round(worstHabitRate)}%</strong>). Recommendation: <strong>Halve its scope</strong> and execute it immediately after your anchor habit (<strong>${bestHabitName}</strong>).`;
  }

  html += `
    <div class="insight-card highlight-border-purple" style="grid-column: 1 / -1; background: var(--bg-widget); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; align-items: flex-start; gap: 12px;">
      <div class="insight-icon bg-soft-purple">💡</div>
      <div class="insight-details" style="display: flex; flex-direction: column; gap: 4px;">
        <div class="insight-label" style="font-size: 13px; font-weight: 700; color: var(--text-main);">${recTitle}</div>
        <p class="insight-desc" style="color: var(--text-main); font-size: 12px; line-height: 1.5; opacity: 0.85; margin: 4px 0 0 0;">${recDesc}</p>
      </div>
    </div>
  `;

  listContainer.innerHTML = html;

  // Set greeting & intro text dynamically
  const coachGreeting = document.getElementById('coach-greeting');
  const coachIntro = document.getElementById('coach-intro');
  if (coachGreeting) {
    const coachGreetingsVi = 'Chào bạn, tôi là huấn luyện viên thói quen của bạn.';
    const coachGreetingsEn = 'Hello, I am your habit coach.';
    coachGreeting.textContent = lang === 'vi' ? coachGreetingsVi : coachGreetingsEn;
  }
  if (coachIntro) {
    const coachIntroVi = 'Dưới đây là một số phân tích và đề xuất giúp bạn tối ưu hóa lịch trình của mình:';
    const coachIntroEn = 'Here are behavioral patterns and insights computed from your logs to help you optimize:';
    coachIntro.textContent = lang === 'vi' ? coachIntroVi : coachIntroEn;
  }
}

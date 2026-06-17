import { state } from '../common/state';
import { getDaysInMonth, getDayOfWeek } from '../../utils/calendar';
import { calculateStreak } from './tracker';
import { TRANSLATIONS } from '../common/translations';

export function renderCoachInsights(): void {
  // Toggle Gemini AI button visibility based on api key presence
  const geminiKey = localStorage.getItem('LICHTRINH_GEMINI_KEY') || '';
  const btnAskGemini = document.getElementById('btn-ask-gemini') as HTMLButtonElement;
  if (btnAskGemini) {
    if (geminiKey) {
      btnAskGemini.style.display = 'flex';
      if (!btnAskGemini.dataset.listenerBound) {
        btnAskGemini.dataset.listenerBound = 'true';
        btnAskGemini.addEventListener('click', handleGeminiAnalysis);
      }
    } else {
      btnAskGemini.style.display = 'none';
    }
  }

  // Wire coach mode toggler
  const btnToggleMode = document.getElementById('btn-toggle-coach-mode');
  const staticView = document.getElementById('coach-static-view');
  const chatView = document.getElementById('coach-chat-view');

  if (btnToggleMode && staticView && chatView) {
    if (!btnToggleMode.dataset.listenerBound) {
      btnToggleMode.dataset.listenerBound = 'true';
      btnToggleMode.addEventListener('click', () => {
        const isShowingChat = chatView.style.display === 'flex';
        const isVi = state.currentLang === 'vi';
        if (isShowingChat) {
          // Switch to static
          chatView.style.display = 'none';
          staticView.style.display = 'flex';
          btnToggleMode.innerHTML = '💬 Chat';
        } else {
          // Switch to chat
          staticView.style.display = 'none';
          chatView.style.display = 'flex';
          btnToggleMode.innerHTML = isVi ? '📊 Phân tích' : '📊 Insights';
          
          loadChatHistory();
          renderChatMessages();
        }
      });
    }
  }

  // Wire coach chat form submit
  const chatForm = document.getElementById('coach-chat-input-form');
  if (chatForm && !chatForm.dataset.listenerBound) {
    chatForm.dataset.listenerBound = 'true';
    chatForm.addEventListener('submit', handleChatSubmit);
  }

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

async function handleGeminiAnalysis(): Promise<void> {
  const btnAskGemini = document.getElementById('btn-ask-gemini') as HTMLButtonElement;
  const geminiResponseBox = document.getElementById('gemini-response-box');
  if (!btnAskGemini || !geminiResponseBox) return;

  const geminiKey = localStorage.getItem('LICHTRINH_GEMINI_KEY') || '';
  if (!geminiKey) {
    alert(TRANSLATIONS[state.currentLang].alert_gemini_key_missing);
    return;
  }

  const lang = state.currentLang;
  const username = state.currentUser!.username;
  const year = state.currentYear;
  const month = state.currentMonth;
  const daysCount = getDaysInMonth(year, month);
  const habits = state.habits;
  const checks = state.currentRecord!.checks;
  const mood = state.currentRecord!.mood || new Array(daysCount).fill(0);
  const motivation = state.currentRecord!.motivation || new Array(daysCount).fill(0);

  // 1. Gather Habits completion rate & streak
  const habitsData = habits.map(h => {
    const hChecks = checks[h.id] || new Array(daysCount).fill(false);
    const actual = hChecks.filter(c => c).length;
    const rate = daysCount > 0 ? (actual / daysCount) * 100 : 0;
    const { maxStreak } = calculateStreak(h.id, hChecks, username, year, month, habits);
    return {
      name: h.name,
      emoji: h.emoji,
      targetDays: daysCount,
      actualDays: actual,
      rate: Math.round(rate),
      streak: maxStreak
    };
  });

  // 2. Compute mood / motivation averages
  const moodValues = mood.filter((v: number) => v > 0);
  const avgMood = moodValues.length > 0 ? (moodValues.reduce((a: number, b: number) => a + b, 0) / moodValues.length).toFixed(1) : 'N/A';

  const motivationValues = motivation.filter((v: number) => v > 0);
  const avgMotivation = motivationValues.length > 0 ? (motivationValues.reduce((a: number, b: number) => a + b, 0) / motivationValues.length).toFixed(1) : 'N/A';

  // 3. Gather journal reflections
  const diary = state.currentRecord!.diary || {};
  const journalEntries: string[] = [];
  for (let d = 0; d < daysCount; d++) {
    const entry = diary[d];
    if (entry && entry.trim()) {
      journalEntries.push(`Day ${d + 1}: "${entry.trim()}"`);
    }
  }

  // 4. Build prompt
  const prompt = lang === 'vi' 
    ? `Bạn là một nhà tâm lý học hành vi và huấn luyện viên thói quen chuyên nghiệp.
Hãy phân tích dữ liệu lịch trình thói quen của người dùng dưới đây cho Tháng ${month + 1}/${year}:

1. Danh sách thói quen:
${habitsData.map(h => `- ${h.emoji} ${h.name}: Đã làm ${h.actualDays}/${h.targetDays} ngày (${h.rate}%), Chuỗi dài nhất: ${h.streak} ngày`).join('\n')}

2. Trạng thái tinh thần trung bình:
- Điểm Tâm trạng (Mood): ${avgMood}/10
- Điểm Động lực (Motivation): ${avgMotivation}/10

3. Nhật ký ghi chú phản tư của các ngày:
${journalEntries.length > 0 ? journalEntries.join('\n') : '(Không có ghi chép nhật ký nào trong tháng này)'}

Hãy cung cấp một bài đánh giá sâu sắc, ngắn gọn, và có cấu trúc rõ ràng:
- **Nhận xét tổng quan**: Đánh giá hiệu suất chung và mối liên hệ giữa tâm trạng/động lực với việc hoàn thành thói quen. Đưa ra lời khen ngợi cho điểm sáng lớn nhất.
- **Phát hiện & Liên hệ**: Có sự liên quan gì giữa những gì ghi chép trong nhật ký với tiến độ thói quen không?
- **3 Lời khuyên hành động cụ thể**: Đề xuất thiết thực nhất để cải thiện (ghép cặp thói quen, giảm tải thói quen yếu nhất, tạo động lực...).

Lưu ý: 
- Hãy phản hồi hoàn toàn bằng tiếng Việt.
- Dùng các định dạng Markdown cơ bản (chữ đậm **chữ**, gạch đầu dòng \`* \` hoặc \`- \`, xuống dòng rõ ràng). Không sử dụng tiêu đề lớn như # hoặc ##, hãy dùng chữ đậm để phân chia đề mục.`
    : `You are a professional behavioral psychologist and habit coach.
Analyze the user's habit tracker data for the month ${month + 1}/${year}:

1. Habits list:
${habitsData.map(h => `- ${h.emoji} ${h.name}: Done ${h.actualDays}/${h.targetDays} days (${h.rate}%), Max streak: ${h.streak} days`).join('\n')}

2. Mental states average:
- Mood: ${avgMood}/10
- Motivation: ${avgMotivation}/10

3. Reflections / Journal logs:
${journalEntries.length > 0 ? journalEntries.join('\n') : '(No journal entries written this month)'}

Provide a deep, concise, and structured review:
- **Overall Assessment**: Evaluate general performance and correlation between mood/motivation and habit completion. Appreciate the highlights.
- **Insights & Correlations**: Any patterns between the journal notes and habit completion?
- **3 Actionable Tips**: Practical suggestions (habit stacking, reducing scope of worst habits, creating cues...).

Notes:
- Respond entirely in English.
- Use basic Markdown formatting (bold **text**, bullet points \`* \` or \`- \`, clean newlines). Do not use large headers like # or ##, use bold text for headings.`;

  // 5. Show loading UI
  const originalBtnHTML = btnAskGemini.innerHTML;
  btnAskGemini.setAttribute('disabled', 'true');
  btnAskGemini.innerHTML = `⚡ ${TRANSLATIONS[lang].coach_analyzing || 'Đang phân tích...'}`;

  geminiResponseBox.style.display = 'block';
  geminiResponseBox.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--text-muted); font-style: italic; padding: 10px 0;">
      <span class="spinner" style="width: 16px; height: 16px; border: 2px solid var(--text-muted); border-top-color: var(--accent-orange); border-radius: 50%; display: inline-block;"></span>
      <span>${TRANSLATIONS[lang].coach_analyzing || 'Đang phân tích...'}</span>
    </div>
  `;

  // Add spin animation style inline if not exists
  if (!document.getElementById('gemini-spin-keyframes')) {
    const style = document.createElement('style');
    style.id = 'gemini-spin-keyframes';
    style.textContent = `
      @keyframes gemini-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  const spinner = geminiResponseBox.querySelector('.spinner') as HTMLElement;
  if (spinner) {
    spinner.style.animation = 'gemini-spin 1s linear infinite';
  }

  try {
    // Dynamic model discovery
    let modelName = 'models/gemini-1.5-flash';
    try {
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey
        }
      });
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        const availableModels: any[] = modelsData.models || [];
        const generateModels = availableModels.filter(m => 
          m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
        );

        if (generateModels.length > 0) {
          const has15Flash = generateModels.find(m => m.name === 'models/gemini-1.5-flash');
          if (has15Flash) {
            modelName = 'models/gemini-1.5-flash';
          } else {
            const anyFlash = generateModels.find(m => m.name.toLowerCase().includes('flash'));
            if (anyFlash) {
              modelName = anyFlash.name;
            } else {
              modelName = generateModels[0].name;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to list models, using default models/gemini-1.5-flash:', e);
    }

    const cleanModelId = modelName.startsWith('models/') ? modelName.substring(7) : modelName;
    console.log(`Using Gemini model: ${cleanModelId}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${cleanModelId}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `HTTP error! status: ${response.status}`;
      throw new Error(errMsg);
    }

    const resData = await response.json();
    const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('Empty response from Gemini API');
    }

    const headerText = lang === 'vi' ? '✨ Nhận xét chuyên sâu từ Gemini AI' : '✨ Gemini AI Habits Insights';
    const parsedHtml = parseMarkdownToHtml(textResponse);

    geminiResponseBox.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <span style="font-weight: 700; font-size: 14px; color: var(--accent-orange); display: flex; align-items: center; gap: 6px;">
          ${headerText}
        </span>
        <button type="button" class="btn-close-gemini" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-muted); padding: 0 4px; line-height: 1;" title="Close">×</button>
      </div>
      <div class="gemini-content-body" style="font-size: 13px; line-height: 1.6;">
        ${parsedHtml}
      </div>
    `;

    const closeBtn = geminiResponseBox.querySelector('.btn-close-gemini');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        geminiResponseBox.style.display = 'none';
      });
    }

  } catch (err: any) {
    console.error('Gemini API call failed:', err);
    const baseErr = TRANSLATIONS[lang].alert_gemini_api_error || 'Lỗi gọi API Gemini. Vui lòng kiểm tra lại API Key!';
    alert(`${baseErr}\n\nDetails: ${err.message || err}`);
    geminiResponseBox.style.display = 'none';
  } finally {
    btnAskGemini.removeAttribute('disabled');
    btnAskGemini.innerHTML = originalBtnHTML;
  }
}

function parseMarkdownToHtml(md: string): string {
  // Escape HTML tags to prevent XSS
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Simple header replacement
  html = html.replace(/^### (.*?)$/gm, '<h5 style="margin: 12px 0 6px 0; font-weight: 700; color: var(--accent-orange); font-size: 13px;">$1</h5>');
  html = html.replace(/^## (.*?)$/gm, '<h4 style="margin: 14px 0 8px 0; font-weight: 700; color: var(--accent-orange); font-size: 14px;">$1</h4>');
  html = html.replace(/^# (.*?)$/gm, '<h3 style="margin: 16px 0 10px 0; font-weight: 700; color: var(--accent-orange); font-size: 15px;">$1</h3>');

  // Bullet points: line-by-line parsing
  const lines = html.split('\n');
  let inList = false;
  const processedLines: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList) {
        processedLines.push('<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc;">');
        inList = true;
      }
      const itemContent = trimmed.substring(2);
      processedLines.push(`<li style="margin-bottom: 4px;">${itemContent}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  if (inList) {
    processedLines.push('</ul>');
  }

  // Handle paragraphs and line breaks
  let finalHtml = '';
  let tempParagraph: string[] = [];

  for (let line of processedLines) {
    if (line.startsWith('<ul') || line.startsWith('<li') || line.startsWith('</ul') || line.startsWith('</li') || line.startsWith('<h3') || line.startsWith('<h4') || line.startsWith('<h5')) {
      if (tempParagraph.length > 0) {
        finalHtml += `<p style="margin-bottom: 12px; line-height: 1.6;">${tempParagraph.join('<br>')}</p>`;
        tempParagraph = [];
      }
      finalHtml += line;
    } else if (line.trim() === '') {
      if (tempParagraph.length > 0) {
        finalHtml += `<p style="margin-bottom: 12px; line-height: 1.6;">${tempParagraph.join('<br>')}</p>`;
        tempParagraph = [];
      }
    } else {
      tempParagraph.push(line);
    }
  }
  if (tempParagraph.length > 0) {
    finalHtml += `<p style="margin-bottom: 12px; line-height: 1.6;">${tempParagraph.join('<br>')}</p>`;
  }

  return finalHtml;
}

// ----------------------------------------------------
// AI Coach Live Chat Companion Implementation
// ----------------------------------------------------
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

let chatHistory: ChatMessage[] = [];

async function fetchActiveModel(geminiKey: string): Promise<string> {
  let modelName = 'models/gemini-1.5-flash';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey
      }
    });
    if (response.ok) {
      const data = await response.json();
      const availableModels: any[] = data.models || [];
      const generateModels = availableModels.filter(m => 
        m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
      );

      if (generateModels.length > 0) {
        const has15Flash = generateModels.find(m => m.name === 'models/gemini-1.5-flash');
        if (has15Flash) {
          modelName = 'models/gemini-1.5-flash';
        } else {
          const anyFlash = generateModels.find(m => m.name.toLowerCase().includes('flash'));
          if (anyFlash) {
            modelName = anyFlash.name;
          } else {
            modelName = generateModels[0].name;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Failed to discover models, using default models/gemini-1.5-flash:', e);
  }
  return modelName.startsWith('models/') ? modelName.substring(7) : modelName;
}

function buildSystemContext(): string {
  const lang = state.currentLang;
  const username = state.currentUser!.username;
  const year = state.currentYear;
  const month = state.currentMonth;
  const daysCount = getDaysInMonth(year, month);
  const habits = state.habits;
  const checks = state.currentRecord!.checks;
  const mood = state.currentRecord!.mood || new Array(daysCount).fill(0);
  const motivation = state.currentRecord!.motivation || new Array(daysCount).fill(0);

  // Gather Habits completion rate & streak
  const habitsData = habits.map(h => {
    const hChecks = checks[h.id] || new Array(daysCount).fill(false);
    const actual = hChecks.filter(c => c).length;
    const rate = daysCount > 0 ? (actual / daysCount) * 100 : 0;
    const { maxStreak } = calculateStreak(h.id, hChecks, username, year, month, habits);
    return `${h.emoji} ${h.name}: ${actual}/${daysCount} days (${Math.round(rate)}%, max streak ${maxStreak} days)`;
  }).join('\n');

  const moodValues = mood.filter((v: number) => v > 0);
  const avgMood = moodValues.length > 0 ? (moodValues.reduce((a: number, b: number) => a + b, 0) / moodValues.length).toFixed(1) : 'N/A';

  const motivationValues = motivation.filter((v: number) => v > 0);
  const avgMotivation = motivationValues.length > 0 ? (motivationValues.reduce((a: number, b: number) => a + b, 0) / motivationValues.length).toFixed(1) : 'N/A';

  const diary = state.currentRecord!.diary || {};
  const journalEntries: string[] = [];
  for (let d = 0; d < daysCount; d++) {
    const entry = diary[d];
    if (entry && entry.trim()) {
      journalEntries.push(`Day ${d + 1}: "${entry.trim()}"`);
    }
  }

  return `SYSTEM CONTEXT (User's Habit Tracker data for Month ${month + 1}/${year}):
1. Habits Completion:
${habitsData}

2. Mental States Averages:
- Mood: ${avgMood}/10
- Motivation: ${avgMotivation}/10

3. Daily Journal Reflections:
${journalEntries.length > 0 ? journalEntries.join('\n') : '(No journal entries this month)'}

INSTRUCTIONS:
You are the professional Habit Coach for this user. Your name is Lịch Trình Coach.
Analyze this context. When the user chats with you, refer to this data to give custom recommendations. Be warm, empathetic, and action-oriented. Keep responses concise (under 3-4 paragraphs) and formatted in clean Markdown. Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;
}

function loadChatHistory(): void {
  if (!state.currentUser) return;
  const username = state.currentUser.username;
  const year = state.currentYear;
  const month = state.currentMonth;
  const key = `LICHTRINH_COACH_CHAT_HISTORY_${username}_${year}_${month}`;
  
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      chatHistory = JSON.parse(saved);
    } catch (e) {
      chatHistory = [];
    }
  } else {
    chatHistory = [];
  }
}

function saveChatHistory(): void {
  if (!state.currentUser) return;
  const username = state.currentUser.username;
  const year = state.currentYear;
  const month = state.currentMonth;
  const key = `LICHTRINH_COACH_CHAT_HISTORY_${username}_${year}_${month}`;
  
  localStorage.setItem(key, JSON.stringify(chatHistory));
}

function renderChatMessages(): void {
  const messagesContainer = document.getElementById('coach-chat-messages');
  if (!messagesContainer) return;
  
  const lang = state.currentLang;
  
  if (chatHistory.length === 0) {
    const welcome = lang === 'vi'
      ? 'Chào bạn! Tôi đã phân tích thói quen và trạng thái tinh thần của bạn trong tháng này. Bạn cần tư vấn hay có câu hỏi gì không?'
      : 'Hello! I have analyzed your habits and mental states for this month. Do you need any advice or have any questions?';
      
    messagesContainer.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: flex-start; max-width: 85%;">
        <div style="background: var(--accent-orange); color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;">🤖</div>
        <div style="background: var(--bg-selected); color: var(--text-main); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 4px 12px 12px 12px; font-size: 12px; line-height: 1.5;">
          ${welcome}
        </div>
      </div>
    `;
    return;
  }
  
  let html = '';
  chatHistory.forEach(msg => {
    const isModel = msg.role === 'model';
    const textHtml = parseMarkdownToHtml(msg.parts[0].text);
    
    if (isModel) {
      html += `
        <div style="display: flex; gap: 8px; align-items: flex-start; max-width: 85%; align-self: flex-start; margin-bottom: 4px;">
          <div style="background: var(--accent-orange); color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;">🤖</div>
          <div style="background: var(--bg-selected); color: var(--text-main); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 4px 12px 12px 12px; font-size: 12px; line-height: 1.5; overflow-x: auto;">
            ${textHtml}
          </div>
        </div>
      `;
    } else {
      html += `
        <div style="display: flex; gap: 8px; align-items: flex-start; max-width: 85%; align-self: flex-end; justify-content: flex-end; margin-bottom: 4px;">
          <div style="background: var(--bg-selected); color: var(--text-main); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 12px 12px 4px 12px; font-size: 12px; line-height: 1.5; overflow-x: auto;">
            ${textHtml}
          </div>
          <div style="background: var(--accent-blue, #3b82f6); color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;">👤</div>
        </div>
      `;
    }
  });
  
  messagesContainer.innerHTML = html;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function handleChatSubmit(e: Event): Promise<void> {
  e.preventDefault();
  const inputEl = document.getElementById('coach-chat-input') as HTMLInputElement;
  const messagesContainer = document.getElementById('coach-chat-messages');
  if (!inputEl || !messagesContainer) return;
  
  const text = inputEl.value.trim();
  if (!text) return;
  
  inputEl.value = '';
  
  chatHistory.push({
    role: 'user',
    parts: [{ text }]
  });
  saveChatHistory();
  renderChatMessages();
  
  const typingIndicator = document.createElement('div');
  typingIndicator.id = 'coach-typing-indicator';
  typingIndicator.style.display = 'flex';
  typingIndicator.style.gap = '8px';
  typingIndicator.style.alignItems = 'flex-start';
  typingIndicator.style.maxWidth = '85%';
  typingIndicator.style.alignSelf = 'flex-start';
  typingIndicator.style.marginBottom = '4px';
  typingIndicator.innerHTML = `
    <div style="background: var(--accent-orange); color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;">🤖</div>
    <div style="background: var(--bg-selected); color: var(--text-muted); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 4px 12px 12px 12px; font-size: 12px; font-style: italic;">
      Đang suy nghĩ... (Thinking...)
    </div>
  `;
  messagesContainer.appendChild(typingIndicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  const geminiKey = localStorage.getItem('LICHTRINH_GEMINI_KEY') || '';
  if (!geminiKey) {
    const indicator = document.getElementById('coach-typing-indicator');
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    alert(TRANSLATIONS[state.currentLang].alert_gemini_key_missing);
    return;
  }
  
  try {
    const cleanModelId = await fetchActiveModel(geminiKey);
    const systemContext = buildSystemContext();
    
    const requestContents = chatHistory.map((msg, idx) => {
      if (idx === 0 && msg.role === 'user') {
        return {
          role: msg.role,
          parts: [{ text: `${systemContext}\n\nUser request: ${msg.parts[0].text}` }]
        };
      }
      return msg;
    });
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${cleanModelId}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey
      },
      body: JSON.stringify({
        contents: requestContents
      })
    });
    
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `HTTP error! status: ${response.status}`;
      throw new Error(errMsg);
    }
    
    const resData = await response.json();
    const modelText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!modelText) {
      throw new Error('Empty response from Gemini API');
    }
    
    const indicator = document.getElementById('coach-typing-indicator');
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    
    chatHistory.push({
      role: 'model',
      parts: [{ text: modelText }]
    });
    saveChatHistory();
    renderChatMessages();
    
  } catch (err: any) {
    console.error('Chat Gemini API call failed:', err);
    
    const indicator = document.getElementById('coach-typing-indicator');
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    
    const errText = state.currentLang === 'vi'
      ? `⚠️ Đã xảy ra lỗi khi kết nối với AI Coach. Chi tiết: ${err.message || err}`
      : `⚠️ An error occurred while communicating with the AI Coach. Details: ${err.message || err}`;
      
    chatHistory.push({
      role: 'model',
      parts: [{ text: errText }]
    });
    saveChatHistory();
    renderChatMessages();
  }
}

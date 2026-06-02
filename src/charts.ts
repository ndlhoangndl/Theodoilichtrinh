import { MonthRecord } from './types';
import { getDaysInMonth } from './calendar';

// Draw Daily Progress SVG Bar Chart
export function drawDailyProgressChart(rates: number[]): void {
  const svg = document.getElementById('daily-progress-svg') as unknown as SVGSVGElement;
  if (!svg) return;

  const N = rates.length;
  const w = 500;
  const h = 110;
  const padL = 30;
  const padR = 10;
  const padT = 15;
  const padB = 20;

  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  let elements = '';

  // Draw grid lines (0%, 50%, 100%)
  elements += `<line x1="${padL}" y1="${padT}" x2="${w - padR}" y2="${padT}" stroke="var(--border-color)" stroke-dasharray="2,2" />`;
  elements += `<line x1="${padL}" y1="${padT + plotH / 2}" x2="${w - padR}" y2="${padT + plotH / 2}" stroke="var(--border-color)" stroke-dasharray="2,2" />`;
  elements += `<line x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" stroke="var(--border-color)" />`;

  // Draw y labels
  elements += `<text x="${padL - 5}" y="${padT + 4}" font-size="8px" fill="var(--text-muted)" text-anchor="end">100%</text>`;
  elements += `<text x="${padL - 5}" y="${padT + plotH / 2 + 3}" font-size="8px" fill="var(--text-muted)" text-anchor="end">50%</text>`;
  elements += `<text x="${padL - 5}" y="${padT + plotH + 2}" font-size="8px" fill="var(--text-muted)" text-anchor="end">0%</text>`;

  // Draw bars
  const colW = plotW / N;
  const barW = Math.max(2, colW - 3);

  for (let i = 0; i < N; i++) {
    const rate = rates[i];
    const barH = (rate / 100) * plotH;
    const x = padL + i * colW + (colW - barW) / 2;
    const y = padT + plotH - barH;

    // Background grey bar
    elements += `
      <rect x="${x}" y="${padT}" width="${barW}" height="${plotH}" rx="1" ry="1" fill="var(--bg-widget)" opacity="0.4" />
    `;

    // Active fill bar
    const barColor = rate === 100 ? 'var(--accent-green)' : 'var(--bg-header)';
    elements += `
      <rect x="${x}" y="${y}" width="${barW}" height="${Math.max(1, barH)}" rx="1" ry="1" fill="${barColor}" class="chart-bar" title="Ngày ${i+1}: ${rate}%">
        <title>Ngày ${i+1}: ${rate}%</title>
      </rect>
    `;

    // Labels at bottom (Draw every 5 days + last day)
    const dayNum = i + 1;
    if (dayNum === 1 || dayNum % 5 === 0 || dayNum === N) {
      elements += `
        <text x="${x + barW / 2}" y="${h - 6}" font-size="8px" fill="var(--text-muted)" text-anchor="middle">${dayNum}</text>
      `;
    }
  }

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = elements;
}

// Draw Weekly Progress SVG Bar Chart
export function drawWeeklyProgressChart(rates: number[]): void {
  const svg = document.getElementById('weekly-progress-svg') as unknown as SVGSVGElement;
  if (!svg) return;

  const N = rates.length;
  const w = 250;
  const h = 110;
  const padL = 30;
  const padR = 10;
  const padT = 15;
  const padB = 20;

  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  let elements = '';

  // Draw grid lines
  elements += `<line x1="${padL}" y1="${padT}" x2="${w - padR}" y2="${padT}" stroke="var(--border-color)" stroke-dasharray="2,2" />`;
  elements += `<line x1="${padL}" y1="${padT + plotH / 2}" x2="${w - padR}" y2="${padT + plotH / 2}" stroke="var(--border-color)" stroke-dasharray="2,2" />`;
  elements += `<line x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" stroke="var(--border-color)" />`;

  // Draw y labels
  elements += `<text x="${padL - 5}" y="${padT + 4}" font-size="8px" fill="var(--text-muted)" text-anchor="end">100%</text>`;
  elements += `<text x="${padL - 5}" y="${padT + plotH / 2 + 3}" font-size="8px" fill="var(--text-muted)" text-anchor="end">50%</text>`;
  elements += `<text x="${padL - 5}" y="${padT + plotH + 2}" font-size="8px" fill="var(--text-muted)" text-anchor="end">0%</text>`;

  // Draw bars
  const colW = plotW / 5;
  const barW = Math.max(12, colW - 10);

  for (let i = 0; i < 5; i++) {
    const rate = i < N ? rates[i] : 0;
    const barH = (rate / 100) * plotH;
    const x = padL + i * colW + (colW - barW) / 2;
    const y = padT + plotH - barH;

    // Background bar
    elements += `
      <rect x="${x}" y="${padT}" width="${barW}" height="${plotH}" rx="2" ry="2" fill="var(--bg-widget)" opacity="0.4" />
    `;

    // Active bar
    elements += `
      <rect x="${x}" y="${y}" width="${barW}" height="${Math.max(1, barH)}" rx="2" ry="2" fill="var(--accent-brown)">
        <title>Tuần ${i+1}: ${rate}%</title>
      </rect>
    `;

    // X axis label
    elements += `
      <text x="${x + barW / 2}" y="${h - 6}" font-size="8px" fill="var(--text-muted)" text-anchor="middle">W${i+1}</text>
    `;
  }

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = elements;
}

// Draw Overall Stats Donut Chart SVG
export function drawOverallDonutChart(rate: number, completed: number, left: number): void {
  const svg = document.getElementById('overall-stats-svg') as unknown as SVGSVGElement;
  if (!svg) return;

  const w = 200;
  const h = 110;
  const cx = 55;
  const cy = 55;
  const r = 35;
  const circ = 2 * Math.PI * r;
  const strokeW = 9;

  const completedPct = Math.round(rate);
  const strokeOffset = circ - (completedPct / 100) * circ;

  let elements = '';

  // Draw grey background circle (remaining/left)
  elements += `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-selected)" stroke-width="${strokeW}" />
  `;

  // Draw dynamic completion circle arc (only if > 0)
  if (completedPct > 0) {
    // Rotated by -90 deg to start from top
    elements += `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--accent-green)" stroke-width="${strokeW}"
              stroke-dasharray="${circ}" stroke-dashoffset="${strokeOffset}"
              transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round" />
    `;
  }

  // Draw percentage text in center
  elements += `
    <text x="${cx}" y="${cy + 5}" font-family="var(--font-title)" font-weight="700" font-size="13px" fill="var(--text-main)" text-anchor="middle">${completedPct}%</text>
  `;

  // Draw legends on the right side of the donut
  const legX = 115;
  elements += `
    <g transform="translate(${legX}, 38)">
      <circle cx="0" cy="0" r="4" fill="var(--accent-green)" />
      <text x="10" y="3" font-size="9px" font-weight="600" fill="var(--text-main)">Hoàn thành</text>
      <text x="10" y="14" font-size="9px" fill="var(--text-muted)">${completed} checks</text>
    </g>
    <g transform="translate(${legX}, 75)">
      <circle cx="0" cy="0" r="4" fill="var(--bg-selected)" />
      <text x="10" y="3" font-size="9px" font-weight="600" fill="var(--text-main)">Còn lại</text>
      <text x="10" y="14" font-size="9px" fill="var(--text-muted)">${left} checks</text>
    </g>
  `;

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = elements;
}

// Draw Mood & Motivation Correlation Line Chart SVG
export function drawMoodMotivationTrendChart(year: number, month: number, record: MonthRecord): void {
  const svg = document.getElementById('trend-chart-svg') as unknown as SVGSVGElement;
  if (!svg) return;

  const daysCount = getDaysInMonth(year, month);
  const w = 800;
  const h = 180;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 25;

  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  let elements = '';

  // 1. Draw horizontal grid lines (for ratings 1 to 10)
  const lineCount = 10;
  for (let i = 1; i <= lineCount; i++) {
    const y = padT + plotH - ((i - 1) / (lineCount - 1)) * plotH;
    const isMajor = (i === 1 || i === 5 || i === 10);
    const strokeStyle = isMajor ? 'var(--border-color)' : 'var(--border-color-dark)';
    const strokeDash = isMajor ? 'none' : '2,4';
    const opacity = isMajor ? '0.6' : '0.3';
    
    elements += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="${strokeStyle}" stroke-dasharray="${strokeDash}" opacity="${opacity}" />`;
    
    // Y-axis labels (draw at 1, 5, 10)
    if (isMajor) {
      elements += `<text x="${padL - 8}" y="${y + 3}" font-size="9px" font-weight="600" fill="var(--text-muted)" text-anchor="end">${i}</text>`;
    }
  }

  // Calculate coordinates for points
  const colW = plotW / (daysCount - 1);
  const moodPoints: { x: number; y: number; val: number }[] = [];
  const motPoints: { x: number; y: number; val: number }[] = [];

  for (let d = 0; d < daysCount; d++) {
    const x = padL + d * colW;
    
    const moodVal = record.mood[d] || 0;
    if (moodVal > 0) {
      const y = padT + plotH - ((moodVal - 1) / 9) * plotH;
      moodPoints.push({ x, y, val: moodVal });
    }

    const motVal = record.motivation[d] || 0;
    if (motVal > 0) {
      const y = padT + plotH - ((motVal - 1) / 9) * plotH;
      motPoints.push({ x, y, val: motVal });
    }

    // X-axis labels at bottom
    const dayNum = d + 1;
    if (dayNum === 1 || dayNum % 5 === 0 || dayNum === daysCount) {
      elements += `<text x="${x}" y="${h - 6}" font-size="8px" fill="var(--text-muted)" text-anchor="middle">Ngày ${dayNum}</text>`;
    }
  }

  // 2. Draw Mood Trend Line (Orange/Brown)
  if (moodPoints.length > 1) {
    let dAttr = `M ${moodPoints[0].x} ${moodPoints[0].y}`;
    for (let i = 1; i < moodPoints.length; i++) {
      dAttr += ` L ${moodPoints[i].x} ${moodPoints[i].y}`;
    }
    elements += `
      <path d="${dAttr}" fill="none" stroke="var(--accent-orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    `;
  }
  
  // Draw Mood point markers
  moodPoints.forEach(pt => {
    elements += `
      <circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="var(--bg-panel)" stroke="var(--accent-orange)" stroke-width="2">
        <title>Mood ngày: ${pt.val}</title>
      </circle>
    `;
  });

  // 3. Draw Motivation Trend Line (Blue)
  if (motPoints.length > 1) {
    let dAttr = `M ${motPoints[0].x} ${motPoints[0].y}`;
    for (let i = 1; i < motPoints.length; i++) {
      dAttr += ` L ${motPoints[i].x} ${motPoints[i].y}`;
    }
    elements += `
      <path d="${dAttr}" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    `;
  }

  // Draw Motivation point markers
  motPoints.forEach(pt => {
    elements += `
      <circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="var(--bg-panel)" stroke="var(--accent-blue)" stroke-width="2">
        <title>Motivation ngày: ${pt.val}</title>
      </circle>
    `;
  });

  // 4. Draw Legend Overlay
  elements += `
    <g transform="translate(${padL + 20}, 12)">
      <line x1="0" y1="0" x2="16" y2="0" stroke="var(--accent-orange)" stroke-width="2" />
      <circle cx="8" cy="0" r="2.5" fill="var(--bg-panel)" stroke="var(--accent-orange)" stroke-width="1.5" />
      <text x="22" y="3" font-size="9px" font-weight="600" fill="var(--text-main)">Tâm trạng (Mood)</text>
      
      <line x1="140" y1="0" x2="156" y2="0" stroke="var(--accent-blue)" stroke-width="2" />
      <circle cx="148" cy="0" r="2.5" fill="var(--bg-panel)" stroke="var(--accent-blue)" stroke-width="1.5" />
      <text x="162" y="3" font-size="9px" font-weight="600" fill="var(--text-main)">Động lực (Motivation)</text>
    </g>
  `;

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = elements;
}

import { $ } from '../lib/dom';
import { clamp, fmtPct, iqPercentile } from '../lib/math';

/* Interactive normal-distribution chart for the results screen. */

const CV = { W: 640, H: 250, pl: 20, pr: 20, base: 200, top: 34, x0: 40, x1: 160 };
const cvx = (v: number): number => CV.pl + ((v - CV.x0) / (CV.x1 - CV.x0)) * (CV.W - CV.pl - CV.pr);
const cvy = (v: number): number => CV.base - Math.exp(-0.5 * ((v - 100) / 15) ** 2) * (CV.base - CV.top);

function curvePath(a: number, b: number): string {
  let d = `M${cvx(a).toFixed(1)},${CV.base}`;
  for (let v = a; v <= b; v += 0.5) d += ` L${cvx(v).toFixed(1)},${cvy(v).toFixed(1)}`;
  return d + ` L${cvx(b).toFixed(1)},${CV.base} Z`;
}

export function bellCurveSVG(iq: number): string {
  const ticks = [55, 70, 85, 100, 115, 130, 145];
  const bands = [
    [CV.x0, 70],
    [70, 85],
    [85, 115],
    [115, 130],
    [130, 145],
    [145, CV.x1],
  ] as const;
  const bandPct = ['2.3%', '13.6%', '68.2%', '13.6%', '2.1%', '0.1%'];
  const mx = cvx(iq);
  const my = cvy(iq);
  const labelX = clamp(mx, 60, CV.W - 60);
  const labelY = Math.max(2, my - 38);
  return `<svg class="curve" id="curve-svg" viewBox="0 0 ${CV.W} ${CV.H}" role="img" tabindex="0"
      aria-label="Normal distribution of IQ scores with your score of ${iq} at the ${fmtPct(iqPercentile(iq))}th percentile. Use left and right arrow keys to read other scores.">
    <defs>
      <linearGradient id="gFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#818cf8" stop-opacity=".75"/><stop offset="1" stop-color="#6366f1" stop-opacity=".12"/></linearGradient>
      <linearGradient id="gBase" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#94a3b8" stop-opacity=".18"/><stop offset="1" stop-color="#94a3b8" stop-opacity=".03"/></linearGradient>
    </defs>
    ${ticks.map((t) => `<line x1="${cvx(t)}" x2="${cvx(t)}" y1="${CV.top - 6}" y2="${CV.base}" stroke="rgba(148,163,184,.12)"/>`).join('')}
    <path d="${curvePath(CV.x0, CV.x1)}" fill="url(#gBase)" stroke="rgba(148,163,184,.45)" stroke-width="1.5"/>
    <path d="${curvePath(CV.x0, iq)}" fill="url(#gFill)"/>
    ${bands.map(([a, b], i) => `<text x="${(cvx(a) + cvx(b)) / 2}" y="${CV.base - 8}" text-anchor="middle" font-size="11" fill="#94a3b8">${bandPct[i]}</text>`).join('')}
    <line x1="${CV.pl}" x2="${CV.W - CV.pr}" y1="${CV.base}" y2="${CV.base}" stroke="rgba(148,163,184,.5)"/>
    ${ticks.map((t) => `<text x="${cvx(t)}" y="${CV.base + 20}" text-anchor="middle" font-size="12" fill="#cbd5e1">${t}</text>`).join('')}
    <text x="${cvx(100)}" y="${CV.base + 40}" text-anchor="middle" font-size="11" fill="#94a3b8">IQ score (mean 100, SD 15)</text>
    <line x1="${mx}" x2="${mx}" y1="${CV.base}" y2="${my - 4}" stroke="#e0e7ff" stroke-width="2"/>
    <circle cx="${mx}" cy="${my}" r="6" fill="#e0e7ff" stroke="#6366f1" stroke-width="3"/>
    <rect x="${labelX - 42}" y="${labelY}" width="84" height="24" rx="12" fill="#4f46e5"/>
    <text x="${labelX}" y="${labelY + 16.5}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">You: ${iq}</text>
    <g id="cv-guide" visibility="hidden" pointer-events="none">
      <line id="cv-gl" y1="${CV.top - 6}" y2="${CV.base}" stroke="#fbbf24" stroke-dasharray="3 3"/>
      <rect id="cv-gr" y="4" width="150" height="24" rx="8" fill="#1e293b" stroke="rgba(251,191,36,.6)"/>
      <text id="cv-gt" data-testid="curve-readout" y="20.5" text-anchor="middle" font-size="12" fill="#fde68a"></text>
    </g>
    <rect x="${CV.pl}" y="0" width="${CV.W - CV.pl - CV.pr}" height="${CV.base}" fill="transparent" id="cv-hit"/>
  </svg>`;
}

/** Wires pointer and keyboard exploration. Call after inserting bellCurveSVG() output. */
export function bindCurve(iq: number): void {
  const svg = $<SVGSVGElement>('#curve-svg');
  const g = $('#cv-guide', svg);
  const live = $('#sr-live');
  let value = iq;

  const showAt = (v: number, announce: boolean): void => {
    value = clamp(Math.round(v), CV.x0, CV.x1);
    const x = cvx(value);
    const gl = $('#cv-gl', svg);
    gl.setAttribute('x1', String(x));
    gl.setAttribute('x2', String(x));
    const tx = clamp(x, 80, CV.W - 80);
    $('#cv-gr', svg).setAttribute('x', String(tx - 75));
    const t = $('#cv-gt', svg);
    t.setAttribute('x', String(tx));
    t.textContent = `IQ ${value}: higher than ${fmtPct(iqPercentile(value))}%`;
    g.setAttribute('visibility', 'visible');
    if (announce) live.textContent = t.textContent;
  };
  const hide = (): void => g.setAttribute('visibility', 'hidden');

  const fromPointer = (e: PointerEvent): void => {
    const rect = svg.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * CV.W;
    showAt(CV.x0 + ((vx - CV.pl) / (CV.W - CV.pl - CV.pr)) * (CV.x1 - CV.x0), false);
  };
  const hit = $('#cv-hit', svg);
  hit.addEventListener('pointermove', fromPointer);
  hit.addEventListener('pointerdown', fromPointer);
  hit.addEventListener('pointerleave', hide);

  svg.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') showAt(value + step, true);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') showAt(value - step, true);
    else if (e.key === 'Home') showAt(CV.x0, true);
    else if (e.key === 'End') showAt(CV.x1, true);
    else return;
    e.preventDefault();
  });
  svg.addEventListener('focus', () => showAt(value, false));
  svg.addEventListener('blur', hide);
}

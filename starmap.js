/* ==========================================================================
   那一刻的星空 · 2026-03-20 23:22 EDT · 哥伦布上空
   数据来自 starmap-data.js（耶鲁亮星表 BSC5 烘焙，见仓库外 bake_starmap.py）。
   投影：方位等距，天顶居中，北上东左（躺着看天的方向），地平线 r=1。
   ========================================================================== */
(function () {
  'use strict';

  const D = window.SKY_DATA;
  const canvas = document.getElementById('skyDome');
  if (!D || !canvas) return;

  const ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  const section = document.getElementById('sky');
  const tagVega = document.getElementById('skyTagVega');
  const tagAltair = document.getElementById('skyTagAltair');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 色温桶 → 颜色（蓝白 → 橙红） */
  const COLORS = ['#c3d4ff', '#dbe4ff', '#f4f5ff', '#fff3dd', '#ffe2b8', '#ffce9e'];
  const TWINKLE_N = 110; /* stars 已按星等升序排好，取最亮的一批做闪烁层 */

  let size = 0, dpr = 1, cx = 0, cy = 0, R = 0;
  let staticLayer = null;
  let active = false, rafId = 0;

  const px = nx => cx + (nx / 1000) * R;
  const py = ny => cy + (ny / 1000) * R;
  const starR = m => Math.max(0.55, 2.9 - 0.042 * m) * (R / 300); /* m = Vmag*10 */
  const starA = m => Math.min(1, Math.max(0.16, 1.08 - 0.016 * m));

  function buildStatic() {
    staticLayer = document.createElement('canvas');
    staticLayer.width = staticLayer.height = size * dpr;
    const c = staticLayer.getContext('2d');
    c.scale(dpr, dpr);

    /* 天穹底色：中心微亮，边缘沉入地平线的辉光 */
    let g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, 'rgba(8, 11, 26, .58)');
    g.addColorStop(0.72, 'rgba(5, 7, 18, .72)');
    g.addColorStop(0.94, 'rgba(24, 32, 66, .55)');
    g.addColorStop(1, 'rgba(40, 52, 96, .35)');
    c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fillStyle = g; c.fill();

    /* 高度圈 30° / 60° */
    c.strokeStyle = 'rgba(255,255,255,.05)';
    c.lineWidth = 1;
    c.setLineDash([3, 6]);
    [1 / 3, 2 / 3].forEach(f => { c.beginPath(); c.arc(cx, cy, R * f, 0, 7); c.stroke(); });
    c.setLineDash([]);

    /* 地平线 */
    c.beginPath(); c.arc(cx, cy, R, 0, 7);
    c.strokeStyle = 'rgba(255,255,255,.26)'; c.lineWidth = 1.2; c.stroke();

    /* 方位刻度与朝向（北上东左） */
    c.font = `${Math.max(10, R * 0.052)}px system-ui, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const CARD = [['北', 0], ['东', 90], ['南', 180], ['西', 270]];
    CARD.forEach(([t, az]) => {
      const a = az * Math.PI / 180;
      const ux = -Math.sin(a), uy = -Math.cos(a);
      c.fillStyle = az === 0 ? 'rgba(255,158,199,.55)' : 'rgba(255,255,255,.38)';
      c.fillText(t, cx + ux * (R + Math.max(13, R * 0.062)), cy + uy * (R + Math.max(13, R * 0.062)));
    });
    for (let az = 0; az < 360; az += 45) {
      const a = az * Math.PI / 180, ux = -Math.sin(a), uy = -Math.cos(a);
      c.beginPath();
      c.moveTo(cx + ux * R, cy + uy * R);
      c.lineTo(cx + ux * (R + 5), cy + uy * (R + 5));
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.stroke();
    }

    /* 星座连线与名字 */
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
    c.strokeStyle = 'rgba(150,172,255,.15)'; c.lineWidth = 1;
    D.lines.forEach(l => {
      c.beginPath(); c.moveTo(px(l[0]), py(l[1])); c.lineTo(px(l[2]), py(l[3])); c.stroke();
    });
    c.font = `${Math.max(9, R * 0.042)}px system-ui, sans-serif`;
    c.fillStyle = 'rgba(190,200,255,.28)';
    (D.labels || []).forEach(L => c.fillText(L.t, px(L.x), py(L.y) + R * 0.09));

    /* 静态星（闪烁层之外的暗星） */
    for (let i = TWINKLE_N; i < D.stars.length; i++) {
      const s = D.stars[i];
      c.beginPath(); c.arc(px(s[0]), py(s[1]), starR(s[2]), 0, 7);
      c.globalAlpha = starA(s[2]); c.fillStyle = COLORS[s[3]]; c.fill();
    }
    c.globalAlpha = 1;
    c.restore();
  }

  function drawBright(t) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    for (let i = 0; i < TWINKLE_N && i < D.stars.length; i++) {
      const s = D.stars[i];
      const ph = (i * 2654435761 % 1000) / 1000 * 6.283;
      const tw = reduced ? 1 : 0.82 + 0.18 * Math.sin(t / 620 + ph);
      const r = starR(s[2]);
      ctx.beginPath(); ctx.arc(px(s[0]), py(s[1]), r, 0, 7);
      ctx.globalAlpha = starA(s[2]) * tw;
      ctx.fillStyle = COLORS[s[3]];
      ctx.shadowColor = COLORS[s[3]];
      ctx.shadowBlur = r * 2.4;
      ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* 织女星：正骑在地平线上，脉动的光 */
  function drawVega(t) {
    const x = px(D.vega.x), y = py(D.vega.y);
    const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t / 1100);
    const halo = R * (0.055 + 0.014 * pulse);
    let g = ctx.createRadialGradient(x, y, 0, x, y, halo);
    g.addColorStop(0, 'rgba(255,231,244,.95)');
    g.addColorStop(0.25, 'rgba(255,196,225,.5)');
    g.addColorStop(1, 'rgba(255,158,199,0)');
    ctx.beginPath(); ctx.arc(x, y, halo, 0, 7); ctx.fillStyle = g; ctx.fill();
    /* 四芒微光 */
    ctx.strokeStyle = `rgba(255,220,238,${0.28 + 0.22 * pulse})`;
    ctx.lineWidth = 1;
    const ray = halo * 1.35;
    ctx.beginPath();
    ctx.moveTo(x - ray, y); ctx.lineTo(x + ray, y);
    ctx.moveTo(x, y - ray); ctx.lineTo(x, y + ray);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, Math.max(1.6, R * 0.009), 0, 7);
    ctx.fillStyle = '#fff'; ctx.fill();
  }

  /* 牛郎星：还在地平线下（同一方位角的正下方），幽灵标记 */
  function drawAltair(t) {
    const a = D.altair.az * Math.PI / 180;
    const ux = -Math.sin(a), uy = -Math.cos(a);
    const gx = cx + ux * R * 1.14, gy = cy + uy * R * 1.14;
    /* 从地平线沿同一方位向外的虚线 —— 他在她正下方 */
    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = 'rgba(143,216,255,.35)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + ux * (R + 3), cy + uy * (R + 3));
    ctx.lineTo(gx - ux * 6, gy - uy * 6);
    ctx.stroke();
    ctx.setLineDash([]);
    const breathe = reduced ? 0.6 : 0.45 + 0.35 * Math.sin(t / 1600);
    ctx.beginPath(); ctx.arc(gx, gy, Math.max(1.6, R * 0.0085), 0, 7);
    ctx.fillStyle = `rgba(143,216,255,${0.35 + 0.45 * breathe})`;
    ctx.shadowColor = 'rgba(143,216,255,.8)'; ctx.shadowBlur = 7 * breathe;
    ctx.fill(); ctx.shadowBlur = 0;
    return [gx, gy];
  }

  function placeTags() {
    if (!tagVega || !tagAltair) return;
    /* 织女星标签：从星点沿半径向内收，落进穹顶里 */
    const vx = px(D.vega.x), vy = py(D.vega.y);
    const vlen = Math.hypot(vx - cx, vy - cy) || 1;
    const ivx = (cx - vx) / vlen, ivy = (cy - vy) / vlen;
    tagVega.style.left = (vx + ivx * R * 0.11) + 'px';
    tagVega.style.top = (vy + ivy * R * 0.11) + 'px';
    /* 牛郎星标签：放在幽灵点的外上方（穹顶外的角落），不与织女星打架 */
    const a = D.altair.az * Math.PI / 180;
    const ux = -Math.sin(a), uy = -Math.cos(a);
    const gx = cx + ux * R * 1.14, gy = cy + uy * R * 1.14;
    const w = tagAltair.offsetWidth || 120, h = tagAltair.offsetHeight || 28;
    tagAltair.style.left = Math.max(2, gx - w - 6) + 'px';
    tagAltair.style.top = Math.max(0, gy - h - 4) + 'px';
  }

  function draw(t) {
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(staticLayer, 0, 0, size, size);
    drawBright(t);
    drawAltair(t);
    drawVega(t);
  }

  function frame(t) {
    rafId = 0;
    if (!active || !document.body.classList.contains('night')) return;
    draw(t);
    if (!reduced) rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId) return;
    rafId = requestAnimationFrame(frame);
  }

  function resize() {
    const w = wrap.clientWidth;
    if (!w || w === size && dpr === (devicePixelRatio || 1)) return;
    size = w;
    dpr = devicePixelRatio || 1;
    canvas.width = canvas.height = Math.round(size * dpr);
    canvas.style.width = canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = cy = size / 2;
    R = size / 2 - Math.max(44, size * 0.13);
    buildStatic();
    placeTags();
    draw(performance.now()); /* 首帧不等待 IO，保证任何情况下都有星空 */
    if (active) { if (rafId) cancelAnimationFrame(rafId); rafId = 0; start(); }
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(ent => {
      active = ent.isIntersecting;
      if (active) { resize(); start(); }
      else if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    });
  }, { threshold: 0.12 });
  if (section) io.observe(section);

  addEventListener('resize', () => { size = 0; dpr = 0; resize(); });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => resize()).observe(wrap);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    else if (!document.hidden && active) start();
  });
  /* 主题切回夜晚时，若正停在本节则重新点亮 */
  document.getElementById('themeBtn')?.addEventListener('click', () => {
    setTimeout(() => { if (active && document.body.classList.contains('night')) { resize(); start(); } }, 60);
  });

  resize();
})();

/* ==========================================================================
   VEGALTAiR · 11.04「二十一岁」生日章
   时间一律按真实时刻判定（北京 / 哥伦布两个时区都用 Intl 换算），与看网页的设备时区无关：
     · teaser（她那边 11.4 零点之前）：首页第一章前是一封封着的信 + 倒计时；
       页面开着的话，零点一到现场拆封，直接切进生日。
     · party（她那边 11.4 零点 → 我这边 11.4 午夜，共 37 小时）：
       开屏改词、首页改成生日封面、自动撒一次彩纸、吹蜡烛仪式、生日信、二十一个愿望。
     · after（37 小时之后）：这一章挪到「宇宙边缘」前，永久保留；蜡烛随时可以重新点。
   文案、日期、愿望清单都在 content.js 的 birthday 里改；生日信就是 letters 里那一封。
   预览：index.html?bday=teaser | t-10（零点前 10 秒，看现场拆封）| party | after
   必须在 script.js 之前加载：开屏计数和首页打字机会在 script.js 里读取这里改过的文字。
   ========================================================================== */
(() => {
  const C = window.SITE_CONTENT || {};
  const CFG = C.birthday;
  const section = document.getElementById('birthday');
  if (!CFG || !section) return;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 820;
  const store = {
    get(k) { try { return localStorage.getItem('bday26.' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('bday26.' + k, v); } catch (e) { /* 隐私模式：不记也没关系 */ } }
  };

  const T0 = Date.parse(CFG.at);        /* 她那边 11.4 零点 */
  const TM = Date.parse(CFG.mineAt);    /* 我这边 11.4 零点 */
  const T1 = Date.parse(CFG.until);     /* 我这边 11.4 过完 */
  if (!(T0 < TM && TM < T1)) return;
  const HOURS = Math.round((T1 - T0) / 3600e3);

  /* ---------- 时钟（预览参数只拨这一章的表，不改真实内容的解锁） ---------- */
  const pv = new URLSearchParams(location.search).get('bday');
  let virt = null;
  if (pv === 'teaser') virt = T0 - (17 * 3600 + 42 * 60 + 9) * 1000;
  else if (pv && /^t-\d+$/.test(pv)) virt = T0 - Number(pv.slice(2)) * 1000;
  else if (pv === 'party') virt = T0 + (2 * 3600 + 26 * 60) * 1000;
  else if (pv === 'after') virt = T1 + 3600e3;
  const offset = virt === null ? 0 : virt - Date.now();
  const now = () => Date.now() + offset;
  const stateAt = t => (t < T0 ? 'teaser' : t < T1 ? 'party' : 'after');
  const teaserFrom = CFG.teaserFrom ? Date.parse(CFG.teaserFrom) : -Infinity;

  let state = stateAt(now());
  if (state === 'teaser' && now() < teaserFrom) return;

  /* 生日信：零点前被 content.js 收在 SITE_CONTENT_LOCKED 里，零点后在 letters 里 */
  const findLetter = () => [...(C.letters || []), ...((window.SITE_CONTENT_LOCKED || {}).letters || [])]
    .find(l => l && l.date === CFG.letter);

  /* ==========================================================================
     一、页面加载时（script.js 之前）同步改好的部分：章节位置、开屏、首页封面
     ========================================================================== */
  const body = document.body;
  function setStateClass() {
    body.classList.add('bday');
    ['teaser', 'party', 'after'].forEach(s => body.classList.toggle('bday-' + s, s === state));
  }
  setStateClass();

  const about = $('#about');
  if (state === 'after' && about && about.parentNode) about.parentNode.insertBefore(section, about);

  const rail = $('.chapter-rail');
  if (rail) {
    const a = document.createElement('a');
    a.dataset.rail = 'birthday';
    a.href = '#birthday';
    a.innerHTML = '<span></span><em>生日</em>';
    const heroDot = rail.querySelector('[data-rail="hero"]');
    if (state !== 'after' && heroDot) heroDot.after(a); else rail.appendChild(a);
  }

  const loader = $('#openingLoader');
  if (loader && state === 'party') {
    const words = CFG.loader && CFG.loader.length ? CFG.loader : ['十一月四日', '二十一岁', '生日快乐'];
    loader.dataset.words = words.join('|');
    loader.dataset.countTo = String(CFG.age || 21);
    const w = $('#loaderWord'); if (w) w.textContent = words[0];
    const n = $('#loaderCount'); if (n) n.textContent = '00';
    const top = $('.loader-top', loader); if (top) top.innerHTML = 'VEGALTAiR <i>∞</i> HAPPY BIRTHDAY';
    const sub = $('.loader-sub', loader); if (sub) sub.innerHTML = esc(CFG.loaderSub || 'To：杜叶 · 11.04\n生日快乐').replace(/\n/g, '<br/>');
  }

  function heroBirthday() {
    const H = CFG.hero || {};
    const eb = $('.hero-copy .eyebrow');
    const spans = $$('.hero-copy .mega-title span');
    const sub = $('#heroSubtitle');
    const primary = $('.hero-actions .action.primary');
    if (eb && H.eyebrow) eb.textContent = H.eyebrow;
    if (spans[0] && H.small) spans[0].textContent = H.small;
    if (spans[1] && H.big) spans[1].textContent = H.big;
    if (sub && H.lines) sub.innerHTML = H.lines.map(esc).join('<br/>');
    if (primary) { primary.textContent = H.cta || '去吹蜡烛'; primary.setAttribute('href', '#birthday'); }
    document.title = (H.docTitle || '生日快乐') + ' · VEGALTAiR';
  }
  if (state === 'party') heroBirthday();

  /* ==========================================================================
     二、彩纸 / 烟花（一块全屏透明画布，没有粒子时自动停帧）
     ========================================================================== */
  const fx = (() => {
    if (reduced) return { burst() {}, shower() {}, fireworks() {}, pop() {} };
    let cv = null, ctx = null, W = 0, H = 0, dpr = 1, parts = [], running = false, last = 0;
    const CAP = coarse ? 260 : 520;
    const DAY = ['#ffe3b0', '#ffc9d8', '#ff9ec7', '#c9b8ff', '#cfe6ff', '#ffffff', '#f2c46d'];
    const NIGHT = ['#8fd8ff', '#b9a6ff', '#ff9ec7', '#ffffff', '#f7dd9d', '#ffd1e3'];
    const palette = () => (body.classList.contains('night') ? NIGHT : DAY);
    const pick = a => a[(Math.random() * a.length) | 0];
    function ensure() {
      if (cv) return;
      cv = document.createElement('canvas');
      cv.className = 'bday-fx';
      cv.setAttribute('aria-hidden', 'true');
      body.appendChild(cv);
      ctx = cv.getContext('2d');
      size();
      addEventListener('resize', size, { passive: true });
    }
    function size() {
      if (!cv) return;
      dpr = Math.min(2, devicePixelRatio || 1);
      W = cv.width = Math.round(innerWidth * dpr);
      H = cv.height = Math.round(innerHeight * dpr);
    }
    function paper(x, y, vx, vy) {
      const s = (coarse ? 0.85 : 1) * dpr;
      const shape = Math.random();
      return {
        k: shape < 0.62 ? 'rect' : shape < 0.86 ? 'dot' : 'star',
        x, y, vx, vy,
        w: (5 + Math.random() * 6) * s, h: (8 + Math.random() * 9) * s,
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.24,
        flip: Math.random() * Math.PI * 2, vf: 0.08 + Math.random() * 0.14,
        sway: Math.random() * Math.PI * 2, vs: 0.03 + Math.random() * 0.05,
        g: (0.06 + Math.random() * 0.05) * dpr, drag: 0.986 - Math.random() * 0.012,
        c: pick(palette()), life: 1, fade: 0
      };
    }
    function add(p) { if (parts.length < CAP) parts.push(p); }
    function start() {
      if (running) return;
      running = true; last = performance.now();
      requestAnimationFrame(loop);
    }
    /* 从一点炸开（扇形向上） */
    function burst(x, y, n = coarse ? 70 : 130, spread = Math.PI * 0.9, power = 1) {
      ensure();
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * spread;
        const v = (4 + Math.random() * 9) * power * dpr;
        add(paper(x * dpr, y * dpr, Math.cos(a) * v, Math.sin(a) * v));
      }
      start();
    }
    /* 从屏幕顶端飘落一阵 */
    function shower(ms = 2600) {
      ensure();
      const t0 = performance.now(), rate = coarse ? 0.045 : 0.09;
      (function drip(t) {
        const k = Math.min(1, (t - t0) / ms);
        const n = Math.round(rate * 16 * (1.2 - k));
        for (let i = 0; i < n; i++) add(paper(Math.random() * W, -20 * dpr, (Math.random() - 0.5) * 2 * dpr, (1 + Math.random() * 2) * dpr));
        start();
        if (k < 1) requestAnimationFrame(drip);
      })(t0);
    }
    /* 点哪里，哪里冒一小把 */
    function pop(x, y) { burst(x, y, coarse ? 12 : 18, Math.PI * 1.6, 0.55); }
    /* 夜晚：烟花（先升空，再炸开） */
    function fireworks(count = 5, gap = 380) {
      ensure();
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const tx = W * (0.18 + Math.random() * 0.64), ty = H * (0.14 + Math.random() * 0.26);
          add({ k: 'rocket', x: tx + (Math.random() - 0.5) * 60 * dpr, y: H + 10 * dpr, tx, ty, c: pick(palette()), life: 1, fade: 0, t: 0 });
          start();
        }, i * gap);
      }
    }
    function explode(x, y, c) {
      const n = coarse ? 54 : 90, c2 = pick(palette());
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.1;
        const v = (1.4 + Math.random() * 3.4) * dpr;
        add({ k: 'spark', x, y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: i % 3 ? c : c2, life: 1, fade: 0.009 + Math.random() * 0.012, g: 0.035 * dpr, drag: 0.982 });
      }
    }
    function star(x, y, r) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rr = i % 2 ? r * 0.38 : r, a = (i / 8) * Math.PI * 2;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    }
    function loop(t) {
      const k = Math.min(2.2, (t - last) / 16.67); last = t;
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.k === 'rocket') {
          p.t += 0.022 * k;
          const e = 1 - Math.pow(1 - Math.min(1, p.t), 3);
          const ny = H + 10 * dpr + (p.ty - H - 10 * dpr) * e, nx = p.x + (p.tx - p.x) * 0.04;
          ctx.strokeStyle = p.c; ctx.globalAlpha = 0.85; ctx.lineWidth = 2 * dpr;
          ctx.beginPath(); ctx.moveTo(nx, ny + 14 * dpr); ctx.lineTo(nx, ny); ctx.stroke();
          p.x = nx; p.y = ny;
          if (p.t >= 1) { explode(p.x, p.y, p.c); parts.splice(i, 1); }
          continue;
        }
        if (p.k === 'spark') {
          p.px = p.x; p.py = p.y;
          p.vx *= Math.pow(p.drag, k); p.vy = p.vy * Math.pow(p.drag, k) + p.g * k;
          p.x += p.vx * k; p.y += p.vy * k; p.life -= p.fade * k;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.strokeStyle = p.c; ctx.lineWidth = 1.6 * dpr; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.px - p.vx * 2.2, p.py - p.vy * 2.2); ctx.lineTo(p.x, p.y); ctx.stroke();
          continue;
        }
        p.vx *= Math.pow(p.drag, k);
        p.vy = Math.min(p.vy * Math.pow(p.drag, k) + p.g * k, 3.2 * dpr);
        p.sway += p.vs * k; p.flip += p.vf * k; p.rot += p.vr * k;
        p.x += (p.vx + Math.sin(p.sway) * 0.7 * dpr) * k; p.y += p.vy * k;
        if (p.y > H + 30 * dpr || p.x < -60 * dpr || p.x > W + 60 * dpr) { parts.splice(i, 1); continue; }
        if (p.y > H * 0.72) p.fade += 0.012 * k;
        ctx.globalAlpha = Math.max(0, 1 - p.fade);
        ctx.fillStyle = p.c;
        if (p.k === 'dot') { ctx.beginPath(); ctx.arc(p.x, p.y, p.w * 0.42, 0, Math.PI * 2); ctx.fill(); continue; }
        if (p.k === 'star') { star(p.x, p.y, p.w * 0.9 * (0.75 + Math.abs(Math.cos(p.flip)) * 0.4)); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.flip));
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(loop);
      else { running = false; ctx.clearRect(0, 0, W, H); }
    }
    return { burst, shower, fireworks, pop };
  })();

  /* 庆祝：白天彩纸，夜晚彩纸 + 烟花 */
  function celebrate(x, y) {
    const cx = x ?? innerWidth / 2, cy = y ?? innerHeight * 0.55;
    fx.burst(cx, cy);
    setTimeout(() => { fx.burst(innerWidth * 0.08, innerHeight * 0.9, coarse ? 40 : 80, Math.PI * 0.5, 1.15); fx.burst(innerWidth * 0.92, innerHeight * 0.9, coarse ? 40 : 80, Math.PI * 0.5, 1.15); }, 260);
    setTimeout(() => fx.shower(2200), 520);
    if (body.classList.contains('night')) fx.fireworks(coarse ? 4 : 6);
  }

  /* ==========================================================================
     三、两地时钟
     ========================================================================== */
  function clockFmt(tz) {
    try {
      const f = new Intl.DateTimeFormat('zh-CN', { timeZone: tz, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
      return t => {
        const o = {};
        f.formatToParts(new Date(t)).forEach(p => { o[p.type] = p.value; });
        return `${o.month}月${o.day}日 ${o.hour}:${o.minute}:${o.second}`;
      };
    } catch (e) { return () => ''; }
  }
  const fmtHer = clockFmt('Asia/Shanghai'), fmtMine = clockFmt('America/New_York');
  const pad = n => String(n).padStart(2, '0');
  function span(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
  }
  const hm = ms => { const x = span(ms); const h = x.d * 24 + x.h; return h ? `${h} 小时 ${x.m} 分` : x.m ? `${x.m} 分钟` : `${x.s} 秒`; };

  const clockHTML = () => `
    <div class="bday-clock" aria-live="off">
      <div class="bc-side"><span class="bc-label">你那边 · 北京时间</span><b class="bc-time" data-bc="her"></b><i class="bc-note" data-bc="herNote"></i></div>
      <div class="bc-mid" aria-hidden="true">∞</div>
      <div class="bc-side"><span class="bc-label">我这边 · 哥伦布</span><b class="bc-time" data-bc="mine"></b><i class="bc-note" data-bc="mineNote"></i></div>
      <div class="bc-bar" aria-hidden="true"><span data-bc="bar"></span></div>
      <p class="bc-cap" data-bc="cap"></p>
      <p class="bc-next" data-bc="next"></p>
    </div>`;
  /* 下一个倒计时：见面（content.js 的 meet），生日开始后才在这里出现 */
  const MEET = C.meet && Date.parse(C.meet.at);
  const meetLine = t => {
    if (!MEET || state === 'teaser') return '';
    if (t >= MEET) return C.meet.after || '';
    const x = span(MEET - t);
    return `下一个倒计时：${String(C.meet.label || '').replace(/^距离\s*/, '')} · 还有 ${x.d} 天 ${x.h} 小时`;
  };

  function tickClock(t) {
    const set = (k, v) => { const el = section.querySelector(`[data-bc="${k}"]`); if (el && el.textContent !== v) el.textContent = v; };
    set('her', fmtHer(t)); set('mine', fmtMine(t));
    const herEnd = T0 + 24 * 3600e3;
    set('herNote', t < T0 ? `还有 ${hm(T0 - t)}` : t < herEnd ? `生日进行中 · 还剩 ${hm(herEnd - t)}` : '你那边的 11.4 过完啦');
    set('mineNote', t < TM ? `还有 ${hm(TM - t)} 轮到我这边` : t < T1 ? `生日进行中 · 还剩 ${hm(T1 - t)}` : '我这边的 11.4 也过完啦');
    const prog = Math.min(1, Math.max(0, (t - T0) / (T1 - T0)));
    const bar = section.querySelector('[data-bc="bar"]');
    if (bar) bar.style.transform = `scaleX(${prog})`;
    const hour = Math.min(HOURS, Math.floor((t - T0) / 3600e3) + 1);
    set('cap', t < T0 ? `今年你的生日一共有 ${HOURS} 个小时——从你那边的零点，到我这边的午夜。`
      : t < T1 ? `今年你的生日一共有 ${HOURS} 个小时 · 现在是第 ${hour} 个小时`
        : `2026 年你的生日一共有 ${HOURS} 个小时，每一个小时我都在想你。`);
    set('next', meetLine(t));
  }

  /* ==========================================================================
     四、信封 / 生日信 / 二十一个愿望
     ========================================================================== */
  const envHTML = (sealed) => `
    <div class="bday-env-wrap">
      <button class="bday-env${sealed ? ' is-locked' : ''}" type="button" aria-label="${sealed ? '这封信零点才能拆开' : '拆开生日信'}">
        <span class="env-back"></span>
        <span class="env-paper"><em>To：${esc(CFG.name || '杜叶')}</em><small>2026 · 11 · 04</small></span>
        <span class="env-pocket"></span>
        <span class="env-flap"></span>
        <span class="env-seal"><b>UE</b></span>
      </button>
      <p class="bday-env-hint">${sealed ? '这封信封着口，零点才能拆。' : '轻轻点一下，拆开它。'}</p>
    </div>`;

  /* 信纸：正文 + 信末附上「二十一个愿望」（信里说了“写在这封信的最后”） */
  function paperHTML(letter) {
    if (!letter) return '<article class="bday-paper"><div class="bday-paper-body"><p>信还在路上。</p></div></article>';
    return `
      <article class="bday-paper" aria-label="${esc(letter.title)}">
        <header class="bp-head">
          <span>Birthday Letter · ${esc(letter.date || '')}</span>
          <h3>${esc(letter.title)}</h3>
          ${letter.meta ? `<p>${esc(letter.meta)}</p>` : ''}
        </header>
        <div class="bday-paper-body">${letter.body || ''}</div>
        ${wishesHTML()}
        <footer class="bp-foot" aria-hidden="true">VEGA <i>∞</i> ALTAiR</footer>
      </article>`;
  }

  function wishesHTML() {
    const list = CFG.wishes || [];
    if (!list.length) return '';
    return `
      <section class="bp-wishes" aria-label="${esc(CFG.wishesTitle || '愿望')}">
        <div class="bw-head">
          <span>P.S. · ${list.length} Wishes</span>
          <h4>${esc(CFG.wishesTitle || '我替你许的愿望')}</h4>
          ${CFG.wishesLead ? `<p>${esc(CFG.wishesLead)}</p>` : ''}
        </div>
        <ol class="bw-list">
          ${list.map((w, i) => `
            <li class="bw-item${w.done ? ' is-done' : ''}" style="--i:${i % 4}">
              <b>${pad(i + 1)}</b>
              <p>${esc(w.t)}${w.done ? `<em>已兑现 · ${esc(w.done)}</em>` : ''}</p>
            </li>`).join('')}
        </ol>
      </section>`;
  }

  /* ==========================================================================
     五、蛋糕（SVG）+ 两根数字蜡烛「2」「1」
     ========================================================================== */
  function cakeSVG() {
    const L = 52, R = 268, TOP = 158, BOT = 270, RX = 108, RY = 19, CX = 160;
    const arcY = (x, cy) => cy + RY * Math.sqrt(Math.max(0, 1 - Math.pow((x - CX) / RX, 2)));
    /* 前沿奶油：沿上沿弧线挂下几道长短不一的滴落 */
    const drips = [[58, 16], [74, 30], [92, 20], [112, 40], [134, 24], [156, 34], [178, 22], [198, 44], [220, 26], [240, 36], [258, 18]];
    let d = `M${L},${TOP} `;
    let prevX = L;
    drips.forEach(([x, len]) => {
      const w = 8;
      const y0 = arcY(x - w, TOP), y1 = arcY(x + w, TOP);
      d += `Q${(prevX + x - w) / 2},${arcY((prevX + x - w) / 2, TOP) + 6} ${x - w},${y0 + 5} `;
      d += `L${x - w},${y0 + len} Q${x - w},${y0 + len + w * 1.15} ${x},${y0 + len + w * 1.15} Q${x + w},${y0 + len + w * 1.15} ${x + w},${y1 + len} L${x + w},${y1 + 5} `;
      prevX = x + w;
    });
    d += `Q${(prevX + R) / 2},${arcY((prevX + R) / 2, TOP) + 6} ${R},${TOP} A${RX},${RY} 0 0 0 ${L},${TOP} Z`;
    let pearls = '';
    for (let x = L + 8; x <= R - 8; x += 11) pearls += `<circle cx="${x}" cy="${arcY(x, BOT) - 3}" r="3.6"/>`;
    return `
      <svg class="bday-cake-svg" viewBox="0 0 320 320" aria-hidden="true">
        <defs>
          <linearGradient id="bcSide" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stop-color="#f4d9d6"/><stop offset=".35" stop-color="#fff4f0"/>
            <stop offset=".7" stop-color="#fbe6e2"/><stop offset="1" stop-color="#e9c8c6"/>
          </linearGradient>
          <linearGradient id="bcCream" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffe4ec"/>
          </linearGradient>
          <linearGradient id="bcTop" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffeef3"/>
          </linearGradient>
          <linearGradient id="bcGold" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#fff4cf"/><stop offset=".45" stop-color="#f3cf86"/><stop offset="1" stop-color="#d49a45"/>
          </linearGradient>
          <linearGradient id="bcPlate" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6e0ee"/>
          </linearGradient>
          <radialGradient id="bcShadow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="160" cy="300" rx="150" ry="14" fill="url(#bcShadow)"/>
        <ellipse cx="160" cy="284" rx="140" ry="22" fill="url(#bcPlate)"/>
        <ellipse cx="160" cy="280" rx="128" ry="16" fill="#f7f3fb"/>
        <path d="M${L},${TOP} L${L},${BOT} A${RX},${RY} 0 0 0 ${R},${BOT} L${R},${TOP} Z" fill="url(#bcSide)"/>
        <path d="M${L},${BOT - 26} A${RX},${RY} 0 0 0 ${R},${BOT - 26}" fill="none" stroke="#f0c98a" stroke-width="2" opacity=".7"/>
        <g fill="#fffaf2" opacity=".95">${pearls}</g>
        <path d="${d}" fill="url(#bcCream)"/>
        <ellipse cx="${CX}" cy="${TOP}" rx="${RX}" ry="${RY}" fill="url(#bcTop)"/>
        <g class="bday-candles" font-family="Didot, 'Bodoni 72', 'Times New Roman', 'Noto Serif', serif" font-weight="700" font-size="92" text-anchor="middle">
          <line x1="128" y1="92" x2="128" y2="80" stroke="#5b4636" stroke-width="2.4" stroke-linecap="round"/>
          <line x1="192" y1="92" x2="192" y2="80" stroke="#5b4636" stroke-width="2.4" stroke-linecap="round"/>
          <text x="128" y="162" fill="url(#bcGold)" stroke="#fff6dc" stroke-width="1">2</text>
          <text x="192" y="162" fill="url(#bcGold)" stroke="#fff6dc" stroke-width="1">1</text>
        </g>
        <g class="bday-sparkles" fill="#fff6d8">
          <path d="M44 96 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/>
          <path d="M270 70 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4z"/>
          <path d="M282 168 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2z"/>
          <path d="M34 196 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2z"/>
        </g>
      </svg>`;
  }
  /* 火苗位置 = 两根灯芯顶端（viewBox 坐标 → 百分比） */
  const WICKS = [[128, 80], [192, 80]];
  const flamesHTML = () => WICKS.map(([x, y], i) => `
    <span class="bday-flame" style="left:${(x / 320) * 100}%;top:${(y / 320) * 100}%;--d:${i * 0.17}s"><i></i></span>
    <span class="bday-smoke" style="left:${(x / 320) * 100}%;top:${(y / 320) * 100}%"><i></i><i></i><i></i></span>`).join('');

  const cakeHTML = () => `
    <div class="bday-cake-card">
      <div class="bday-cake" role="button" tabindex="0" aria-label="蛋糕上的蜡烛，点一下可以吹灭">
        <span class="bday-glow" aria-hidden="true"></span>
        ${cakeSVG()}
        ${flamesHTML()}
        <div class="bday-hb" aria-hidden="true"><b>生日快乐</b><span>Happy 21st Birthday</span></div>
      </div>
      <p class="bday-cap" data-cake="cap">先闭上眼睛，许一个愿望。</p>
      <div class="bday-cake-actions" data-cake="actions">
        <button class="action primary" type="button" data-cake="wish">我许好了</button>
      </div>
      <p class="bday-cake-sub" data-cake="sub"></p>
      <div class="bday-meter" aria-hidden="true"><span data-cake="meter"></span></div>
    </div>`;

  /* ==========================================================================
     六、渲染这一章
     ========================================================================== */
  /* 首次渲染交给 script.js 的入场动画；零点现场重绘时 script.js 已经观察不到新元素，直接显示 */
  function render(live) {
    const rv = live ? 'reveal is-visible' : 'reveal';
    const copy = (CFG.chapter && CFG.chapter[state]) || {};
    const head = `
      <div class="section-heading ${rv}">
        <span>${esc(copy.kicker || 'Chapter 00 / 11.04')}</span>
        <h2>${esc(copy.title || '生日快乐')}</h2>
        ${copy.lead ? `<p>${esc(copy.lead)}</p>` : ''}
      </div>`;
    if (state === 'teaser') {
      section.innerHTML = `${head}
        <div class="bday-teaser ${rv}">
          <div class="bday-count" aria-live="off">
            <span class="bdc-label">距离你的二十一岁</span>
            <div class="bdc-digits"><span data-cd="d" class="bdc-days"></span><b data-cd="h">00</b><i>:</i><b data-cd="m">00</b><i>:</i><b data-cd="s">00</b></div>
            <div class="bdc-units"><span>小时</span><span>分钟</span><span>秒</span></div>
          </div>
          ${envHTML(true)}
        </div>
        <div class="${rv}">${clockHTML()}</div>`;
    } else {
      section.innerHTML = `${head}
        <div class="${rv}">${clockHTML()}</div>
        <div class="${rv}">${cakeHTML()}</div>
        <div class="bday-letter" data-letter></div>`;
      setupCake();
      const letterReady = state === 'after' || store.get('blown') === '1';
      if (letterReady) showEnvelope(false);
    }
    bindEnvelope();
    tick();
  }

  /* ---------- 倒计时 ---------- */
  function tickCountdown(t) {
    const x = span(T0 - t);
    const set = (k, v) => { const el = section.querySelector(`[data-cd="${k}"]`); if (el && el.textContent !== v) el.textContent = v; };
    set('d', x.d ? `${x.d} 天` : '');
    set('h', pad(x.h)); set('m', pad(x.m)); set('s', pad(x.s));
    section.classList.toggle('is-final', T0 - t <= 10000);
  }

  let rolling = false;
  function tick() {
    const t = now();
    const s = stateAt(t);
    if (s !== state && !rolling) {
      if (state === 'teaser' && s === 'party') { midnight(); return; }
      /* 页面被冻结（锁屏、微信小窗、电脑休眠）一口气跨过了整个生日：直接重新加载成 after，
         章节挪位、信回到列表，都按正常打开处理 */
      if (state === 'teaser' && s === 'after') { location.reload(); return; }
      /* party → after 不在她读信的时候搬家：等她切回这个页面时再刷新（见下面 visibilitychange） */
    }
    if (state === 'teaser' && !rolling) tickCountdown(t);
    tickClock(t);
  }
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !rolling && state === 'party' && stateAt(now()) === 'after') location.reload();
  });

  /* ---------- 零点：现场拆封 ---------- */
  function midnight() {
    rolling = true;
    tickCountdown(T0);
    section.classList.add('is-midnight');
    const env = $('.bday-env', section);
    if (env) env.classList.add('is-glow');
    const r = env ? env.getBoundingClientRect() : null;
    setTimeout(() => {
      state = 'party';
      setStateClass();
      heroBirthday();
      celebrate(r ? r.left + r.width / 2 : undefined, r ? r.top + r.height / 2 : undefined);
      section.classList.add('is-swapping');
      setTimeout(() => {
        render(true);
        section.classList.remove('is-swapping', 'is-midnight', 'is-final');
        rolling = false;
      }, 420);
    }, 1400);
  }

  /* ---------- 信封 ---------- */
  function bindEnvelope() {
    const env = $('.bday-env', section);
    if (!env || env.dataset.bound) return;
    env.dataset.bound = '1';
    env.addEventListener('click', () => {
      if (env.classList.contains('is-locked')) {
        env.classList.remove('is-nudge'); void env.offsetWidth; env.classList.add('is-nudge');
        const hint = $('.bday-env-hint', section);
        if (hint) hint.textContent = '还没到零点哦——到时候，记得叫上我。';
        return;
      }
      openLetter(env);
    });
  }
  function showEnvelope(scroll) {
    const slot = $('[data-letter]', section);
    if (!slot || slot.dataset.shown) return;
    slot.dataset.shown = '1';
    slot.innerHTML = envHTML(false);
    bindEnvelope();
    requestAnimationFrame(() => slot.classList.add('is-in'));
    if (scroll) setTimeout(() => slot.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }), 450);
  }
  function openLetter(env) {
    if (env.classList.contains('is-open')) return;
    env.classList.add('is-open');
    store.set('opened', '1');
    const slot = env.closest('[data-letter]') || $('[data-letter]', section);
    setTimeout(() => {
      slot.innerHTML = paperHTML(findLetter());
      slot.classList.add('is-letter');
      const paper = $('.bday-paper', slot);
      requestAnimationFrame(() => paper && paper.classList.add('is-in'));
      const r = paper ? paper.getBoundingClientRect() : null;
      if (r) fx.burst(innerWidth / 2, Math.max(80, r.top + 40), coarse ? 26 : 46, Math.PI * 1.2, 0.7);
      showWishes();
      if (paper) paper.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }, reduced ? 0 : 1250);
  }
  /* 信末的愿望逐条浮现 */
  function showWishes() {
    const items = $$('.bw-item', section);
    if (reduced || !('IntersectionObserver' in window)) { items.forEach(li => li.classList.add('is-in')); return; }
    const io = new IntersectionObserver(ents => ents.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { threshold: 0.3 });
    items.forEach(li => io.observe(li));
  }

  /* ==========================================================================
     七、吹蜡烛：许愿 → 对着麦克风吹（或者点一下）→ 火灭、冒烟 → 生日快乐
     ========================================================================== */
  let mic = null;
  function setupCake() {
    const card = $('.bday-cake-card', section);
    const cake = $('.bday-cake', section);
    if (!card || !cake) return;
    const cap = $('[data-cake="cap"]', card), sub = $('[data-cake="sub"]', card), actions = $('[data-cake="actions"]', card), meter = $('[data-cake="meter"]', card);
    let phase = 'lit';
    let round = 0;   /* 每一轮许愿一个编号：上一轮迟到的麦克风结果不能改这一轮的提示 */
    const COPY = CFG.cake || {};

    function setActions(html) { actions.innerHTML = html; }
    function toWish() {
      phase = 'lit';
      round += 1;
      stopMic();
      card.classList.remove('is-out', 'is-done', 'is-listening');
      cap.textContent = COPY.wish || '先闭上眼睛，许一个愿望。';
      sub.textContent = '';
      setActions('<button class="action primary" type="button" data-cake="wish">我许好了</button>');
    }
    async function toBlow() {
      phase = 'blow';
      const my = ++round;
      card.classList.add('is-ready');
      cap.textContent = COPY.blow || '现在，对着屏幕吹一口气。';
      sub.textContent = '要用一下麦克风，听你吹气；不想开也没关系，点一下蜡烛就好。';
      setActions('');
      const ok = await listen(level => {
        if (phase !== 'blow') return;
        cake.style.setProperty('--lean', (level * 34).toFixed(1) + 'deg');
        cake.style.setProperty('--gust', (1 - Math.min(0.55, level * 0.7)).toFixed(3));
        if (meter) meter.style.transform = `scaleX(${Math.min(1, level).toFixed(3)})`;
      }, blowOut);
      if (my !== round) return;
      if (phase !== 'blow') { stopMic(); return; }
      if (ok) { card.classList.add('is-listening'); sub.textContent = '我在听。用力一点，一口气吹灭它们。（点一下蜡烛也可以）'; }
      else sub.textContent = '点一下蜡烛，把它们吹灭吧。';
    }
    function blowOut() {
      if (phase === 'out' || phase === 'done') return;
      phase = 'out';
      stopMic();
      cake.style.setProperty('--lean', '28deg');
      card.classList.remove('is-listening');
      card.classList.add('is-out');
      cap.textContent = COPY.out || '……';
      sub.textContent = '';
      setActions('');
      setTimeout(() => {
        phase = 'done';
        card.classList.add('is-done');
        cake.style.removeProperty('--lean'); cake.style.removeProperty('--gust');
        cap.textContent = COPY.done || '愿望收到了。剩下的，交给我。';
        const firstTime = store.get('blown') !== '1';
        store.set('blown', '1');
        setActions(`<button class="action primary" type="button" data-cake="letter">${firstTime && state === 'party' ? '拆开你的生日信' : '去看信'}</button><button class="action ghost" type="button" data-cake="relight">再点一次蜡烛</button>`);
        const r = cake.getBoundingClientRect();
        celebrate(r.left + r.width / 2, r.top + r.height * 0.35);
        showEnvelope(false);
      }, reduced ? 200 : 1100);
    }
    card.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cake]');
      if (b && b.dataset.cake === 'wish') { card.classList.add('is-wishing'); setTimeout(() => card.classList.remove('is-wishing'), 900); toBlow(); return; }
      if (b && b.dataset.cake === 'relight') { toWish(); return; }
      if (b && b.dataset.cake === 'letter') {
        showEnvelope(false);
        /* 信已经拆开的话跳到信的开头；还是信封就把信封放到屏幕中间 */
        const paper = $('.bday-paper', section);
        const target = paper || $('[data-letter]', section);
        if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: paper ? 'start' : 'center' });
        return;
      }
      if (e.target.closest('.bday-cake') && (phase === 'blow' || phase === 'lit')) {
        if (phase === 'lit') { card.classList.add('is-wishing'); setTimeout(() => card.classList.remove('is-wishing'), 900); }
        blowOut();
      }
    });
    cake.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && (phase === 'blow' || phase === 'lit')) { e.preventDefault(); blowOut(); }
    });
    toWish();
  }

  /* 老内核里 resume()/close() 可能不返回 Promise，也可能直接抛错：统一静默 */
  const quiet = fn => { try { const p = fn(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* 忽略 */ } };

  /* 麦克风：只在点了「我许好了」之后才申请；拿不到就退回点击。
     micGen：每次 stopMic() 都让还在等授权的那次申请作废——授权弹窗还开着时她已经点灭了蜡烛，
     等她点了允许，拿到的流要立刻关掉，不能让录音指示灯一直亮着。 */
  let micGen = 0;
  async function listen(onLevel, onBlow) {
    const md = navigator.mediaDevices;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!md || !md.getUserMedia || !AC) return false;
    const gen = micGen;
    let ac = null, stream = null;
    const drop = () => { if (stream) stream.getTracks().forEach(tr => tr.stop()); if (ac) quiet(() => ac.close()); };
    try {
      /* 在点击手势里（第一个 await 之前）就建好并唤醒，iOS / 微信内置浏览器才不会一直挂起 */
      ac = new AC();
      quiet(() => ac.resume());
      stream = await md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      if (gen !== micGen) { drop(); return false; }
      if (ac.state === 'suspended') await Promise.resolve(ac.resume()).catch(() => {});
      if (gen !== micGen) { drop(); return false; }
      if (mic) { mic.stop(); mic = null; }   /* 新的一路替换旧的一路，旧的不能被遗落 */
      const src = ac.createMediaStreamSource(stream);
      const an = ac.createAnalyser();
      an.fftSize = 1024; an.smoothingTimeConstant = 0.15;
      src.connect(an);
      const td = new Float32Array(an.fftSize), fd = new Uint8Array(an.frequencyBinCount);
      const binHz = ac.sampleRate / an.fftSize;
      const lowTo = Math.max(2, Math.round(500 / binHz)), midTo = Math.round(4000 / binHz);
      let base = 0, frames = 0, hot = 0, lastT = performance.now(), alive = true;
      mic = { stop() { alive = false; stream.getTracks().forEach(tr => tr.stop()); quiet(() => ac.close()); } };
      (function poll(t) {
        if (!alive) return;
        const dt = Math.min(64, t - lastT); lastT = t;
        an.getFloatTimeDomainData(td);
        let sum = 0; for (let i = 0; i < td.length; i++) sum += td[i] * td[i];
        const rms = Math.sqrt(sum / td.length);
        an.getByteFrequencyData(fd);
        let lo = 0, mid = 0;
        for (let i = 1; i < lowTo; i++) lo += fd[i];
        for (let i = lowTo; i < midTo; i++) mid += fd[i];
        const lowShare = lo / Math.max(1, lo + mid * (lowTo / Math.max(1, midTo - lowTo)));
        frames += 1;
        if (frames < 18) base = Math.max(base, rms);              /* 前 0.3 秒：环境底噪 */
        const thr = Math.min(0.22, Math.max(0.07, base * 3.2));
        const level = Math.min(1, Math.max(0, (rms - base) / (thr * 1.6)));
        onLevel(level);
        /* 吹气 = 又响又「低沉」（风噪集中在低频），持续约 0.25 秒；说话声多在中频，不容易误触 */
        if (frames >= 18 && rms > thr && lowShare > 0.42) hot += dt; else hot = Math.max(0, hot - dt * 0.6);
        if (hot > 240) { onBlow(); return; }
        requestAnimationFrame(poll);
      })(lastT);
      return true;
    } catch (e) {
      drop();
      return false;
    }
  }
  function stopMic() { micGen += 1; if (mic) { mic.stop(); mic = null; } }
  addEventListener('pagehide', stopMic);

  /* ==========================================================================
     八、生日当天的小彩蛋：开屏结束撒一阵彩纸；点空白处冒一小把彩纸
     ========================================================================== */
  if (state === 'party' && loader) {
    let fired = false;
    const fire = () => { if (fired) return; fired = true; setTimeout(() => fx.shower(2800), 250); };
    new MutationObserver(() => { if (loader.classList.contains('is-hidden')) fire(); })
      .observe(loader, { attributes: true, attributeFilter: ['class'] });
  }
  addEventListener('click', (e) => {
    if (state !== 'party' || e.target.closest('button,a,input,.bday-cake,.reader-modal,.music-dock')) return;
    fx.pop(e.clientX, e.clientY);
  });

  render(false);
  window.__bday = { state: () => state, now, celebrate };
})();

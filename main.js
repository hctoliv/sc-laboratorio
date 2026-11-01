(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const WA = '5511942359832';
  const EMAIL = 'contato@sclaboratorio.com.br';
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- intro ---------- */
  function ready() { document.body.classList.add('ready'); }
  if (root.classList.contains('intro-on')) {
    const intro = $('#intro'), ring = $('.intro-ring circle'), pct = $('#introPct');
    const T = 1500, t0 = performance.now();
    let skip = false;
    const end = () => {
      if (intro.classList.contains('done')) return;
      intro.classList.add('done'); ready();
      try { sessionStorage.setItem('scl-intro', '1'); } catch (e) {}
      setTimeout(() => root.classList.remove('intro-on'), 950);
    };
    const step = now => {
      const p = skip ? 1 : clamp((now - t0) / T, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      ring.style.strokeDashoffset = 591 * (1 - e);
      pct.textContent = String(Math.round(e * 100)).padStart(3, '0');
      if (p < 1) requestAnimationFrame(step); else setTimeout(end, 250);
    };
    requestAnimationFrame(step);
    intro.addEventListener('click', () => { skip = true; });
    addEventListener('keydown', () => { skip = true; }, { once: true });
  } else {
    requestAnimationFrame(ready);
  }

  /* ---------- header ---------- */
  const hd = $('#hd'), zones = $$('[data-hd]');
  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', false);
  }));

  let lastY = scrollY;
  function header() {
    const y = scrollY;
    hd.classList.toggle('scrolled', y > 20);
    if (!document.body.classList.contains('menu-open')) {
      if (y > 500 && y > lastY + 4) hd.classList.add('hide');
      else if (y < lastY - 4 || y < 500) hd.classList.remove('hide');
    }
    lastY = y;
    const probe = hd.offsetHeight / 2;
    const z = zones.find(s => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    hd.classList.toggle('light', !!z && z.dataset.hd === 'light');
  }

  /* ---------- reticle ticks ---------- */
  const ticks = $('.reticle .ticks');
  let tk = '';
  for (let i = 0; i < 72; i++) {
    const a = i / 72 * Math.PI * 2, r1 = 196, r2 = i % 6 ? 189 : 180;
    tk += `<line x1="${200 + Math.cos(a) * r1}" y1="${200 + Math.sin(a) * r1}" x2="${200 + Math.cos(a) * r2}" y2="${200 + Math.sin(a) * r2}"/>`;
  }
  ticks.innerHTML = tk;

  /* ---------- microscope cells ---------- */
  const cv = $('#cells'), cx = cv.getContext('2d'), lens = $('#lens');
  const sprite = (draw, blur) => {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const g = c.getContext('2d'); if (blur) g.filter = `blur(${blur}px)`; draw(g); return c;
  };
  const rbc = g => {
    const gr = g.createRadialGradient(80, 80, 6, 80, 80, 62);
    gr.addColorStop(0, 'rgba(236,150,158,.55)'); gr.addColorStop(.55, 'rgba(226,112,124,.85)');
    gr.addColorStop(.86, 'rgba(196,72,90,.95)'); gr.addColorStop(1, 'rgba(196,72,90,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(80, 80, 62, 0, 7); g.fill();
  };
  const wbc = g => {
    const gr = g.createRadialGradient(80, 80, 10, 80, 80, 66);
    gr.addColorStop(0, 'rgba(214,206,238,.95)'); gr.addColorStop(.85, 'rgba(184,172,226,.9)'); gr.addColorStop(1, 'rgba(184,172,226,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(80, 80, 66, 0, 7); g.fill();
    g.fillStyle = 'rgba(92,72,168,.9)';
    [[62, 70, 18], [88, 62, 17], [96, 92, 16], [68, 96, 15]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  };
  const plt = g => { g.fillStyle = 'rgba(130,100,190,.8)'; g.beginPath(); g.arc(80, 80, 40, 0, 7); g.fill(); };
  const SP = { rbc: [sprite(rbc), sprite(rbc, 6)], wbc: [sprite(wbc), sprite(wbc, 6)], plt: [sprite(plt), sprite(plt, 6)] };

  let W = 0, H = 0, cells = [], dpr = 1;
  const ptr = { x: -999, y: -999, px: 0, py: 0 };
  function sizeCells() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = lens.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(clamp(W / 14, 22, 40));
    cells = Array.from({ length: n }, (_, i) => {
      const type = i % 13 === 0 ? 'wbc' : i % 7 === 0 ? 'plt' : 'rbc';
      const z = Math.random();
      const base = type === 'plt' ? .018 : type === 'wbc' ? .11 : .085;
      return {
        type, z, x: Math.random() * W, y: Math.random() * H,
        s: W * base * (.7 + z * .6), rot: Math.random() * 6.28, tilt: .55 + Math.random() * .45,
        vx: (.12 + z * .25), vy: (Math.random() - .5) * .08, w: Math.random() * 6.28, ox: 0, oy: 0
      };
    }).sort((a, b) => a.z - b.z);
  }
  lens.addEventListener('pointermove', e => {
    const r = lens.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
  });
  lens.addEventListener('pointerleave', () => { ptr.x = ptr.y = -999; });
  addEventListener('pointermove', e => {
    ptr.px = (e.clientX / innerWidth - .5); ptr.py = (e.clientY / innerHeight - .5);
  }, { passive: true });

  function drawCells(t, dt) {
    cx.clearRect(0, 0, W, H);
    const k = dt / 16.7;
    for (const c of cells) {
      c.w += .01 * k;
      c.x += c.vx * k; c.y += (c.vy + Math.sin(c.w) * .05) * k; c.rot += .002 * k * (c.z - .5);
      const dx = c.x - ptr.x, dy = c.y - ptr.y, d = Math.hypot(dx, dy), R = W * .2;
      if (d < R) { const f = (1 - d / R) * 2.2; c.ox += dx / d * f * k; c.oy += dy / d * f * k; }
      c.ox *= .94; c.oy *= .94;
      const m = c.s;
      if (c.x - m > W) c.x = -m; if (c.y - m > H) c.y = -m; if (c.y + m < 0) c.y = H + m;
      const par = (c.z - .5) * 18;
      const x = c.x + c.ox - ptr.px * par, y = c.y + c.oy - ptr.py * par;
      const sharp = c.z > .35 && c.z < .85;
      cx.save(); cx.globalAlpha = .55 + c.z * .45;
      cx.translate(x, y); cx.rotate(c.rot); cx.scale(1, c.type === 'rbc' ? c.tilt : 1);
      cx.drawImage(SP[c.type][sharp ? 0 : 1], -m, -m, m * 2, m * 2);
      cx.restore();
    }
  }

  /* ---------- ECG monitor ---------- */
  const ecg = $('#ecg'), eg = ecg.getContext('2d'), pulse = $('.pulse'), bpmEl = $('#bpm');
  let EW = 0, EH = 0, ex = 0, ey = null, phase = 0, bpm = 72, beatDone = false;
  function sizeEcg() {
    const r = ecg.getBoundingClientRect();
    EW = r.width; EH = r.height;
    ecg.width = EW * dpr; ecg.height = EH * dpr;
    eg.setTransform(dpr, 0, 0, dpr, 0, 0);
    ex = 0; ey = null;
  }
  const gauss = (p, c, w) => Math.exp(-((p - c) ** 2) / (2 * w * w));
  const wave = p => .12 * gauss(p, .1, .022) - .12 * gauss(p, .2, .007) + 1 * gauss(p, .222, .009) - .28 * gauss(p, .245, .009) + .3 * gauss(p, .44, .045);
  function drawEcg(dt) {
    const speed = 130 * dt / 1000;
    const steps = Math.max(1, Math.round(speed));
    eg.lineWidth = 2; eg.lineJoin = 'round'; eg.strokeStyle = '#6CC0FF';
    eg.shadowColor = 'rgba(108,192,255,.8)'; eg.shadowBlur = 8;
    for (let i = 0; i < steps; i++) {
      phase += (bpm / 60) / 130;
      if (phase >= 1) { phase -= 1; beatDone = false; bpm = 70 + Math.round(Math.random() * 6); }
      if (!beatDone && phase > .222) { beatDone = true; pulse.classList.remove('beat'); void pulse.offsetWidth; pulse.classList.add('beat'); bpmEl.textContent = bpm; }
      const y = EH * .62 - wave(phase) * EH * .52;
      eg.clearRect(ex, 0, 18, EH);
      if (ey !== null && ex > 0) { eg.beginPath(); eg.moveTo(ex - 1, ey); eg.lineTo(ex, y); eg.stroke(); }
      ey = y; ex += 1;
      if (ex > EW) { ex = 0; ey = null; }
    }
  }

  /* hero loop, only while hero is visible */
  let heroOn = true, last = performance.now();
  new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe($('.hero'));
  function loop(now) {
    const dt = Math.min(50, now - last); last = now;
    if (heroOn && !document.hidden) { drawCells(now, dt); drawEcg(dt); }
    requestAnimationFrame(loop);
  }
  function sizeAll() { sizeCells(); sizeEcg(); }
  sizeAll();
  let rs; addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(sizeAll, 150); });
  if (!reduce) requestAnimationFrame(loop); else { drawCells(0, 0); }

  const focusEl = $('#focus'), countEl = $('#count');
  setInterval(() => {
    if (!heroOn) return;
    focusEl.textContent = (.78 + Math.random() * .1).toFixed(2);
    countEl.textContent = (4.7 + Math.random() * .25).toFixed(2);
  }, 1400);

  /* ---------- scroll-lit text ---------- */
  const lit = $('#lit');
  lit.innerHTML = lit.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const words = $$('.w', lit);
  function litScroll() {
    const r = lit.getBoundingClientRect(), vh = innerHeight;
    const p = clamp((vh * .85 - r.top) / (r.height + vh * .3), 0, 1);
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  }

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    const to = +e.target.dataset.count, t0 = performance.now();
    const f = now => { const p = clamp((now - t0) / 1200, 0, 1); e.target.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- fluxo / tube ---------- */
  const steps = $$('#steps .step'), liquid = $('#liquid'), stepN = $('#stepN'), tubeLabel = $('.tube-label');
  let activeStep = -1;
  function stepScroll() {
    const vh = innerHeight, mid = vh * .55;
    let best = 0, bd = Infinity;
    steps.forEach((s, i) => {
      const r = s.getBoundingClientRect(), c = r.top + r.height / 2, d = Math.abs(c - mid);
      if (d < bd) { bd = d; best = i; }
    });
    const first = steps[0].getBoundingClientRect();
    if (first.top > vh) best = -1;
    if (best === activeStep) return;
    activeStep = best;
    steps.forEach((s, i) => { s.classList.toggle('on', i === best); s.classList.toggle('done', i < best); });
    const p = (best + 1) / steps.length;
    liquid.style.transform = `translateY(${400 - p * 360}px)`;
    stepN.textContent = String(Math.max(1, best + 1)).padStart(2, '0');
    tubeLabel.style.setProperty('--p', (p * 100) + '%');
  }

  /* ---------- reveal ---------- */
  const revIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); }
  }), { threshold: .2 });
  $$('.bene').forEach(el => revIO.observe(el));

  /* ---------- exames ---------- */
  const wells = $('.v-soro .wells');
  let wh = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++)
    wh += `<circle cx="${30 + c * 20}" cy="${22 + r * 22}" r="7" style="animation-delay:-${(Math.random() * 4.8).toFixed(2)}s"/>`;
  wells.innerHTML = wh;

  const tilesEl = $('#tiles');
  new IntersectionObserver(([e]) => tilesEl.classList.toggle('run', e.isIntersecting), { rootMargin: '100px' }).observe(tilesEl);

  $$('.tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    $$('.tile').forEach((t, i) => { t.hidden = t.dataset.g !== b.dataset.tab; });
  }));

  const tiles = $$('.tile'), EXS = tiles.map(t => t.dataset.ex), sel = new Set();
  const chips = $('#chips');
  chips.innerHTML = EXS.map(x => `<button type="button" class="chip" aria-pressed="false" data-ex="${x}">${x}</button>`).join('');
  const chipEls = $$('.chip', chips), basket = $('#basket'), basketN = $('#basketN'), chipCount = $('#chipCount');
  let orcVisible = false;
  function sync() {
    tiles.forEach(t => { const on = sel.has(t.dataset.ex); t.classList.toggle('sel', on); $('.t-add', t).textContent = on ? '✓ No orçamento' : '+ Orçamento'; t.setAttribute('aria-pressed', on); });
    chipEls.forEach(c => c.setAttribute('aria-pressed', sel.has(c.dataset.ex)));
    chipCount.textContent = sel.size ? `${sel.size} selecionado${sel.size > 1 ? 's' : ''}` : 'nenhum selecionado';
    basketN.textContent = sel.size;
    $('span', basket).textContent = sel.size > 1 ? 'exames no orçamento' : 'exame no orçamento';
    basket.hidden = !sel.size || orcVisible;
  }
  const toggle = ex => { sel.has(ex) ? sel.delete(ex) : sel.add(ex); sync(); };
  tiles.forEach(t => t.addEventListener('click', () => toggle(t.dataset.ex)));
  chipEls.forEach(c => c.addEventListener('click', () => toggle(c.dataset.ex)));
  new IntersectionObserver(([e]) => { orcVisible = e.isIntersecting; sync(); }).observe($('#orcamento'));
  const footIO = $('.ft');
  new IntersectionObserver(([e]) => { if (e.isIntersecting) basket.hidden = true; else sync(); }).observe(footIO);

  /* ---------- orçamento ---------- */
  const form = $('#orcForm'), colab = $('#colab'), colabOut = $('#colabOut'), err = $('#fErr');
  const fmtColab = v => (+v >= 1000 ? '1000+' : v);
  colab.addEventListener('input', () => { colabOut.textContent = fmtColab(colab.value); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const via = (e.submitter && e.submitter.dataset.via) || 'wa';
    const d = Object.fromEntries(new FormData(form));
    if (!d.nome.trim() || !d.empresa.trim()) { err.hidden = false; form.querySelector(!d.nome.trim() ? '[name=nome]' : '[name=empresa]').focus(); return; }
    err.hidden = true;
    const lines = [
      'Olá, SCL Laboratório! Gostaria de um orçamento.',
      '',
      `Nome: ${d.nome.trim()}`,
      `Empresa: ${d.empresa.trim()}`,
      d.cidade.trim() ? `Cidade: ${d.cidade.trim()}` : null,
      `Colaboradores: ${fmtColab(d.colab)}`,
      `Exames: ${sel.size ? [...sel].join(', ') : 'a definir pelo PCMSO'}`,
      d.msg.trim() ? `Mensagem: ${d.msg.trim()}` : null
    ];
    const text = lines.filter(l => l !== null).join('\n');
    if (via === 'mail') location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Orçamento · ' + d.empresa.trim())}&body=${encodeURIComponent(text)}`;
    else window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });

  /* ---------- nav active + scroll loop ---------- */
  const navLinks = $$('#nav a');
  const secs = navLinks.map(a => $(a.getAttribute('href')));
  function navScroll() {
    const y = innerHeight * .4;
    let idx = -1;
    secs.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top < y && r.bottom > y) idx = i; });
    navLinks.forEach((a, i) => a.classList.toggle('on', i === idx));
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { header(); litScroll(); stepScroll(); navScroll(); ticking = false; });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();

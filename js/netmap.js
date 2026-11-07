// Live network map (2D canvas): glowing lines, moving trains, click to select.
import { STATIONS, TRACKS, trainsAt, moroccoNow } from './live.js';
import { station, t, isRTL } from './i18n.js';

export const TYPE_COLOR = { boraq: '#ff7a1a', atlas: '#f3f3f1', tnr: '#7aa7ff', night: '#b59cff' };
// label placement tweaks (dx, dy, align) so close stations don't overlap
const LABEL = {
  TNG: [10, -8, 'left'], KEN: [10, -6, 'left'], RBV: [10, -10, 'left'], RBA: [-10, 14, 'right'], MOH: [8, -10, 'left'],
  CAV: [-10, 16, 'right'], ELJ: [-10, 4, 'right'], SET: [10, 4, 'left'], BEN: [10, 4, 'left'], MAR: [10, 6, 'left'],
  SKA: [8, -10, 'left'], MEK: [-8, 16, 'right'], FES: [8, 16, 'left'], TAZ: [0, -12, 'center'], OUJ: [-10, -10, 'right'],
};
const MAJOR = new Set(['TNG', 'KEN', 'RBA', 'CAV', 'MAR', 'FES', 'OUJ', 'MEK', 'ELJ']);

export function createNetMap(canvas, { speed = 1, onSelect, onTick, labels = 'all' } = {}) {
  const ctx = canvas.getContext('2d');
  const state = { speed, filter: 'all', selected: null, hover: null, trains: [], simNow: moroccoNow() };
  let W = 0, H = 0, dpr = 1, proj;
  const lons = Object.values(STATIONS).map((s) => s.lon), lats = Object.values(STATIONS).map((s) => s.lat);
  const b = { minLon: Math.min(...lons), maxLon: Math.max(...lons), minLat: Math.min(...lats), maxLat: Math.max(...lats) };
  const k = Math.cos(33 * Math.PI / 180);

  function resize() {
    dpr = Math.min(devicePixelRatio, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const pad = Math.min(W, H) * 0.12 + 20;
    const gw = (b.maxLon - b.minLon) * k, gh = b.maxLat - b.minLat;
    const s = Math.min((W - pad * 2) / gw, (H - pad * 2) / gh);
    const ox = (W - gw * s) / 2, oy = (H - gh * s) / 2;
    proj = (lat, lon) => [ox + (lon - b.minLon) * k * s, oy + (b.maxLat - lat) * s];
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let last = performance.now(), t0 = performance.now(), visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);
  const realStart = moroccoNow();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    // simulated clock: real Morocco time, accelerated by `speed`
    state.simNow += (dt / 60) * state.speed;
    if (state.speed === 1) state.simNow = Math.max(state.simNow, moroccoNow()) ;
    state.trains = trainsAt(state.simNow).filter((x) => x.rel >= -12 && x.rel <= x.total + 2);
    draw((now - t0) / 1000);
    onTick?.(state);
  }

  function draw(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // dotted grid
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 12; x < W; x += 24) for (let y = 12; y < H; y += 24) ctx.fillRect(x, y, 1.2, 1.2);

    // tracks
    TRACKS.forEach(([a, c, kind]) => {
      const A = proj(STATIONS[a].lat, STATIONS[a].lon), C = proj(STATIONS[c].lat, STATIONS[c].lon);
      ctx.lineCap = 'round';
      if (kind === 'hs') {
        ctx.strokeStyle = 'rgba(255,122,26,0.18)'; ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...C); ctx.stroke();
        ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 3.5;
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
      }
      ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...C); ctx.stroke();
      // flowing dashes on the high-speed line
      if (kind === 'hs') {
        ctx.setLineDash([2, 14]); ctx.lineDashOffset = -time * 40;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...C); ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // stations
    const font = isRTL() ? '"IBM Plex Sans Arabic", sans-serif' : 'Inter, sans-serif';
    Object.entries(STATIONS).forEach(([code, s]) => {
      const [x, y] = proj(s.lat, s.lon);
      const major = MAJOR.has(code);
      ctx.fillStyle = '#07080b'; ctx.strokeStyle = major ? '#fff' : 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, major ? 5 : 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (labels === 'all' || major) {
        const [dx, dy, al] = LABEL[code] || [8, 4, 'left'];
        ctx.font = `${major ? 600 : 500} ${major ? 12.5 : 11}px ${font}`;
        ctx.textAlign = al; ctx.fillStyle = major ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)';
        ctx.fillText(station(code), x + dx, y + dy);
      }
    });

    // trains
    const list = state.trains.filter((tr) => state.filter === 'all' || tr.type === state.filter);
    list.forEach((tr) => {
      const [x, y] = proj(tr.lat, tr.lon);
      tr._x = x; tr._y = y;
      const col = TYPE_COLOR[tr.type];
      const moving = tr.rel >= 0 && tr.rel < tr.total;
      if (moving) {
        // trail toward the previous station
        const A = STATIONS[tr.a];
        const [ax, ay] = proj(A.lat, A.lon);
        const dx = x - ax, dy = y - ay, len = Math.hypot(dx, dy) || 1;
        const tl = Math.min(26, len);
        const g = ctx.createLinearGradient(x, y, x - (dx / len) * tl, y - (dy / len) * tl);
        g.addColorStop(0, col); g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - (dx / len) * tl, y - (dy / len) * tl); ctx.stroke();
      }
      const sel = state.selected === tr.id, hov = state.hover === tr.id;
      const r = (sel ? 7 : hov ? 6 : 4.5) * (moving ? 1 : 0.8);
      ctx.shadowColor = col; ctx.shadowBlur = sel ? 24 : 14;
      ctx.fillStyle = moving ? col : 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (tr.delay > 0 && moving) { ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke(); }
      if (sel) {
        const p = (time * 1.2) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${1 - p})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r + 4 + p * 16, 0, Math.PI * 2); ctx.stroke();
      }
    });

    // hover tooltip
    const h = list.find((tr) => tr.id === state.hover);
    if (h) {
      const txt = `${t('type.' + h.type)} ${h.no} · ${station(h.from)} → ${station(h.to)}`;
      ctx.font = `600 12px ${font}`;
      const w = ctx.measureText(txt).width + 20;
      const bx = Math.min(Math.max(h._x - w / 2, 6), W - w - 6), by = h._y - 40;
      ctx.fillStyle = 'rgba(18,21,28,0.95)'; ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.roundRect(bx, by, w, 26, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText(txt, bx + w / 2, by + 17);
    }
  }

  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bd = 16;
    state.trains.forEach((tr) => {
      if (tr._x == null || (state.filter !== 'all' && tr.type !== state.filter)) return;
      const d = Math.hypot(tr._x - x, tr._y - y);
      if (d < bd) { bd = d; best = tr; }
    });
    return best;
  };
  canvas.addEventListener('pointermove', (e) => { const p = pick(e); state.hover = p?.id ?? null; canvas.style.cursor = p ? 'pointer' : 'default'; });
  canvas.addEventListener('pointerleave', () => (state.hover = null));
  canvas.addEventListener('click', (e) => { const p = pick(e); if (p) { state.selected = p.id; onSelect?.(p); } });

  requestAnimationFrame(frame);
  void realStart;
  return {
    state,
    setSpeed(v) { state.speed = v; if (v === 1) state.simNow = moroccoNow(); },
    setFilter(f) { state.filter = f; },
    select(id) { state.selected = id; },
  };
}

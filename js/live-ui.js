// Live widgets shared by all pages: status ticker, KPI counters, per-type counts.
import { trainsAt, networkStats, moroccoNow, fmt } from './live.js';
import { t, station, num } from './i18n.js';

export function statusText(tr) {
  if (tr.delay > 0 && !['arrived', 'scheduled'].includes(tr.status)) return `${t('st.' + tr.status)} · +${tr.delay} min`;
  return t('st.' + tr.status);
}

// ---------- ticker ----------
const bar = document.createElement('div');
bar.className = 'ticker';
bar.innerHTML = '<span class="ticker-tag"><i></i><b></b></span><div class="ticker-view"><div class="ticker-track"></div></div>';
document.body.append(bar);
const track = bar.querySelector('.ticker-track');
function renderTicker() {
  bar.querySelector('b').textContent = t('live.badge');
  const now = moroccoNow();
  const list = trainsAt(now).filter((x) => x.rel >= -8 && x.rel < x.total).sort((a, b) => (a.type === 'boraq' ? -1 : 1) - (b.type === 'boraq' ? -1 : 1)).slice(0, 14);
  const items = list.map((tr) => {
    const cls = tr.delay ? 'late' : 'ok';
    const sp = tr.speed ? ` · ${tr.speed} km/h` : '';
    return `<span class="ti"><em class="dot ${tr.type}"></em><b>${t('type.' + tr.type)} ${tr.no}</b> ${station(tr.from)} → ${station(tr.to)} · <span class="${cls}">${statusText(tr)}</span>${sp} · ${t('ticker.next')} ${station(tr.nextStop)} ${fmt(tr.eta)}</span>`;
  });
  if (!items.length) items.push(`<span class="ti">${t('ticker.quiet')}</span>`);
  track.innerHTML = items.join('') + items.join(''); // doubled for a seamless loop
  track.style.animationDuration = `${Math.max(40, items.length * 7)}s`;
}
renderTicker();
setInterval(renderTicker, 30000);
window.addEventListener('langchange', renderTicker);

// ---------- KPIs ----------
const shown = new WeakMap();
function animateTo(el, value, suffix = '') {
  const from = shown.get(el) ?? 0;
  shown.set(el, value);
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min((now - t0) / 900, 1);
    el.textContent = num(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)))) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function renderKPIs() {
  const now = moroccoNow();
  const s = networkStats(now);
  document.querySelectorAll('[data-kpi]').forEach((el) => {
    const k = el.dataset.kpi;
    if (k === 'running') animateTo(el, s.running);
    if (k === 'late') animateTo(el, s.late);
    if (k === 'pct') animateTo(el, s.pct, '%');
    if (k === 'pax') animateTo(el, s.pax);
  });
  const tr = trainsAt(now).filter((x) => x.rel >= 0 && x.rel < x.total);
  document.querySelectorAll('[data-live-type]').forEach((el) => {
    const n = tr.filter((x) => x.type === el.dataset.liveType).length;
    el.innerHTML = `<i></i>${t('live.runningType', { n: num(n) })}`;
  });
  document.querySelectorAll('[data-now]').forEach((el) => (el.textContent = fmt(now)));
}
renderKPIs();
setInterval(renderKPIs, 5000);
window.addEventListener('langchange', renderKPIs);

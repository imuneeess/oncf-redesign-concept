import { createNetMap, TYPE_COLOR } from '../netmap.js';
import { fmt, STATIONS } from '../live.js';
import { t, station, num } from '../i18n.js';
import { statusText } from '../live-ui.js';

const $ = (s) => document.querySelector(s);
const listEl = $('#train-list'), detail = $('#train-detail'), clockEl = $('#sim-clock');
let selectedId = null, lastList = 0;

const map = createNetMap($('#net-canvas'), {
  speed: 30,
  onSelect: (tr) => { selectedId = tr.id; renderDetail(); renderList(true); },
  onTick: (state) => {
    clockEl.textContent = fmt(state.simNow);
    const now = performance.now();
    if (now - lastList > 700) { lastList = now; renderList(); renderDetail(); }
  },
});

document.querySelectorAll('[data-speed]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-speed]').forEach((x) => x.classList.toggle('active', x === b));
  map.setSpeed(+b.dataset.speed);
  $('#mode-label').dataset.i18n = +b.dataset.speed === 1 ? 'livep.realtime' : 'livep.timelapse';
  $('#mode-label').innerHTML = t($('#mode-label').dataset.i18n);
}));
document.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach((x) => x.classList.toggle('active', x === b));
  map.setFilter(b.dataset.filter);
  renderList(true);
}));

const current = () => map.state.trains.filter((x) => x.rel >= 0 && x.rel < x.total && (map.state.filter === 'all' || x.type === map.state.filter));

function renderList(force) {
  const list = current().sort((a, b) => b.progress - a.progress);
  $('#list-count').textContent = num(list.length);
  const html = list.map((tr) => `
    <button class="tr-item ${tr.id === selectedId ? 'active' : ''}" data-id="${tr.id}">
      <span class="tr-dot" style="background:${TYPE_COLOR[tr.type]}"></span>
      <span class="tr-main"><b>${t('type.' + tr.type)} ${tr.no}</b><small>${station(tr.from)} → ${station(tr.to)}</small></span>
      <span class="tr-side"><span class="badge ${tr.delay ? 'late' : 'ok'}">${tr.delay ? '+' + tr.delay + ' min' : t('st.ontime')}</span><small>${tr.speed} km/h</small></span>
      <span class="tr-bar"><i style="width:${(tr.progress * 100).toFixed(1)}%;background:${TYPE_COLOR[tr.type]}"></i></span>
    </button>`).join('');
  if (force || listEl.dataset.sig !== list.map((x) => x.id + Math.round(x.progress * 100)).join()) {
    listEl.innerHTML = html || `<p class="empty">${t('livep.none')}</p>`;
    listEl.dataset.sig = list.map((x) => x.id + Math.round(x.progress * 100)).join();
  }
}
listEl.addEventListener('click', (e) => {
  const b = e.target.closest('.tr-item');
  if (!b) return;
  selectedId = b.dataset.id;
  map.select(selectedId);
  renderList(true); renderDetail();
});

function renderDetail() {
  const tr = map.state.trains.find((x) => x.id === selectedId);
  if (!tr) { detail.innerHTML = `<p class="empty">${t('livep.pick')}</p>`; return; }
  const stops = tr.stops.map(([c, m], i) => {
    const at = tr.dep + tr.delay + m;
    const state = tr.rel >= m ? 'done' : i === tr.seg + 1 ? 'next' : '';
    return `<li class="${state}"><i></i><span>${station(c)}</span><b>${fmt(at)}</b></li>`;
  }).join('');
  detail.innerHTML = `
    <div class="det-head"><span class="tr-dot" style="background:${TYPE_COLOR[tr.type]}"></span><div><b>${t('type.' + tr.type)} ${tr.no}</b><small>${station(tr.from)} → ${station(tr.to)}</small></div></div>
    <div class="det-grid">
      <div><small>${t('livep.status')}</small><b>${statusText(tr)}</b></div>
      <div><small>${t('livep.speed')}</small><b>${tr.speed} km/h</b></div>
      <div><small>${t('livep.next')}</small><b>${station(tr.nextStop)}</b></div>
      <div><small>${t('livep.arrival')}</small><b>${fmt(tr.arr)}</b></div>
      <div><small>${t('livep.delay')}</small><b class="${tr.delay ? 'late' : 'ok'}">${tr.delay ? '+' + tr.delay + ' min' : t('st.ontime')}</b></div>
      <div><small>${t('livep.platform')}</small><b>${tr.platform}</b></div>
    </div>
    <div class="det-progress"><i style="width:${(tr.progress * 100).toFixed(1)}%"></i></div>
    <ol class="det-stops">${stops}</ol>`;
}
renderDetail();
window.addEventListener('langchange', () => { renderList(true); renderDetail(); });
void STATIONS;

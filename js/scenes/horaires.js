import { THREE, createStage, addLights, createTrain, createTunnel } from './common.js';
import { Flap } from '../flap.js';
import { boardFor, moroccoNow, fmt, STATIONS } from '../live.js';
import { t, station, num, isRTL } from '../i18n.js';

// ---------- Calm tunnel behind the page hero ----------
{
  const canvas = document.querySelector('#hero-canvas');
  const { scene, camera, loop } = createStage(canvas, { camPos: [2.5, 1.0, 9], fov: 45 });
  scene.fog = new THREE.Fog(0x07080b, 8, 40);
  addLights(scene);
  const train = createTrain({ cars: 3 });
  train.rotation.y = -Math.PI / 2;
  train.position.z = -18;
  scene.add(train);
  const tunnel = createTunnel(scene, { streaks: 160 });
  tunnel.group.rotation.y = Math.PI / 2;
  loop((time, dt, mouse) => {
    tunnel.update(dt, 0.3);
    train.position.z = -16 + Math.sin(time * 0.3) * 2;
    camera.position.x = 2.5 + mouse.x * 0.8;
    camera.position.y = 1.0 + mouse.y * 0.4;
    camera.lookAt(-1.2, 0, -14);
  });
}

// ---------- Live board ----------
const stationSel = document.querySelector('#station');
Object.keys(STATIONS).forEach((c) => stationSel.append(new Option(station(c), c)));
stationSel.value = 'CAV';
let mode = 'dep';

const COLS = [['time', 5], ['type', 8], ['other', 15], ['via', 26], ['no', 4], ['platform', 2], ['status', 11]];
const tbody = document.querySelector('#board tbody');
const rows = Array.from({ length: 10 }, () => {
  const tr = document.createElement('tr');
  const flaps = COLS.map(([, len]) => {
    const td = document.createElement('td');
    const span = document.createElement('span');
    td.append(span);
    tr.append(td);
    return new Flap(span, { length: len });
  });
  tbody.append(tr);
  return { tr, flaps };
});

function label(r) {
  if (r.status === 'in') return t('st.in', { m: num(Math.max(1, Math.round(r.until))) });
  if (r.status === 'late') return `+${r.delay} MIN`;
  return t('st.' + r.status);
}
function render() {
  const now = moroccoNow();
  const list = boardFor(stationSel.value, now, { mode, limit: rows.length, hours: 8 });
  rows.forEach((row, i) => {
    const r = list[i];
    const vals = r ? {
      time: fmt(r.actual), type: t('type.' + r.type), other: station(r.other),
      via: r.via.slice(0, 3).map(station).join(isRTL() ? ' · ' : ' · '), no: r.no, platform: String(r.platform), status: label(r),
    } : {};
    COLS.forEach(([k], j) => row.flaps[j].set(vals[k] ?? ''));
    row.tr.dataset.status = r ? r.status : '';
    row.flaps[1].el.classList.toggle('accent-text', !!r && r.type === 'boraq');
  });
  document.querySelector('#count').textContent = t('board.count', { n: num(list.length) });
  document.querySelector('#board-title').dataset.flapKey = mode === 'dep' ? 'board.dep' : 'board.arr';
  titleFlap.set(t(mode === 'dep' ? 'board.dep' : 'board.arr'));
  document.querySelector('#col-other').textContent = t(mode === 'dep' ? 'b.dest' : 'b.origin');
}
const titleFlap = new Flap(document.querySelector('#board-title'), { length: 9 });

document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('active', x === b));
  mode = b.dataset.mode;
  render();
}));
stationSel.addEventListener('change', render);
window.addEventListener('langchange', () => {
  [...stationSel.options].forEach((o) => (o.textContent = station(o.value)));
  render();
});
const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { render(); io.disconnect(); setInterval(render, 15000); } }, { threshold: 0.15 });
io.observe(document.querySelector('#board'));

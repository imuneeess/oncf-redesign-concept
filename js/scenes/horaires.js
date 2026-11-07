import { THREE, createStage, addLights, createTrain, createTunnel } from './common.js';
import { Flap } from '../flap.js';

// ---------- Calm tunnel behind the page hero ----------
{
  const canvas = document.querySelector('#hero-canvas');
  const { scene, camera, loop } = createStage(canvas, { camPos: [0, 1.2, 9], fov: 45 });
  scene.fog = new THREE.Fog(0x07080b, 8, 40);
  addLights(scene);
  const train = createTrain({ cars: 3 });
  train.rotation.y = -Math.PI / 2; // nose toward the camera
  train.position.z = -18;
  scene.add(train);
  const tunnel = createTunnel(scene, { streaks: 160 });
  tunnel.group.rotation.y = Math.PI / 2;
  loop((t, dt, mouse) => {
    tunnel.update(dt, 0.25);
    train.position.z = -18 + Math.sin(t * 0.15) * 1.5;
    camera.position.x = 2.5 + mouse.x * 0.8;
    camera.position.y = 1.0 + mouse.y * 0.4;
    camera.lookAt(-1.2, 0, -14);
  });
}

// ---------- Departures board (sample data) ----------
// Sample timetable for the concept only. Replace with official ONCF data.
const TRAINS = [
  { time: '06:00', type: 'AL BORAQ', no: '0603', from: 'TANGER VILLE', to: 'CASA VOYAGEURS', via: 'KENITRA · RABAT AGDAL', platform: '1', status: 'A L HEURE' },
  { time: '06:15', type: 'TNR', no: '1012', from: 'KENITRA', to: 'CASA PORT', via: 'RABAT VILLE · MOHAMMEDIA', platform: '3', status: 'A L HEURE' },
  { time: '06:45', type: 'AL ATLAS', no: '2105', from: 'CASA VOYAGEURS', to: 'MARRAKECH', via: 'SETTAT · BENGUERIR', platform: '4', status: 'A L HEURE' },
  { time: '07:00', type: 'AL BORAQ', no: '0607', from: 'CASA VOYAGEURS', to: 'TANGER VILLE', via: 'RABAT AGDAL · KENITRA', platform: '2', status: 'A L HEURE' },
  { time: '07:20', type: 'AL ATLAS', no: '2211', from: 'RABAT VILLE', to: 'FES', via: 'KENITRA · MEKNES', platform: '1', status: '+5 MIN' },
  { time: '07:40', type: 'TNR', no: '1024', from: 'CASA PORT', to: 'EL JADIDA', via: 'AZEMMOUR', platform: '5', status: 'A L HEURE' },
  { time: '08:00', type: 'AL BORAQ', no: '0611', from: 'TANGER VILLE', to: 'CASA VOYAGEURS', via: 'KENITRA · RABAT AGDAL', platform: '1', status: 'A L HEURE' },
  { time: '08:30', type: 'AL ATLAS', no: '2319', from: 'FES', to: 'OUJDA', via: 'TAZA · TAOURIRT', platform: '2', status: 'A L HEURE' },
  { time: '09:00', type: 'AL BORAQ', no: '0615', from: 'CASA VOYAGEURS', to: 'TANGER VILLE', via: 'RABAT AGDAL · KENITRA', platform: '2', status: '+10 MIN' },
  { time: '09:15', type: 'AL ATLAS', no: '2121', from: 'MARRAKECH', to: 'CASA VOYAGEURS', via: 'BENGUERIR · SETTAT', platform: '3', status: 'A L HEURE' },
  { time: '21:00', type: 'NUIT', no: '3001', from: 'MARRAKECH', to: 'TANGER VILLE', via: 'CASA · RABAT · KENITRA', platform: '4', status: 'A L HEURE' },
];

const COLS = [['time', 5], ['type', 8], ['to', 14], ['via', 24], ['no', 4], ['platform', 2], ['status', 9]];
const tbody = document.querySelector('#board tbody');
const rows = Array.from({ length: 8 }, () => {
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

let filter = 'ALL';
function render() {
  const list = TRAINS.filter((t) => filter === 'ALL' || t.from === filter || t.to === filter || t.via.includes(filter.split(' ')[0]));
  rows.forEach((r, i) => {
    const t = list[i];
    COLS.forEach(([key], k) => r.flaps[k].set(t ? t[key] : ''));
    r.flaps[6].el.classList.toggle('status-late', !!t && t.status.startsWith('+'));
    r.flaps[6].el.classList.toggle('status-ok', !!t && !t.status.startsWith('+'));
    r.flaps[1].el.classList.toggle('accent-text', !!t && t.type === 'AL BORAQ');
  });
  document.querySelector('#count').textContent = `${list.length} train${list.length === 1 ? '' : 's'}`;
}
document.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.filters button').forEach((x) => x.classList.toggle('active', x === b));
  filter = b.dataset.station;
  render();
}));
const boardIO = new IntersectionObserver(([en]) => { if (en.isIntersecting) { render(); boardIO.disconnect(); } }, { threshold: 0.2 });
boardIO.observe(document.querySelector('#board'));

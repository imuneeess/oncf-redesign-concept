import { THREE, RoundedBoxGeometry, createStage, addLights, ticketTexture, ACCENT } from './common.js';
import { journeys, moroccoNow, fmt, STATIONS } from '../live.js';
import { t, station, num } from '../i18n.js';

// Sample fares for the concept only.
const $ = (s) => document.querySelector(s);
const from = $('#b-from'), to = $('#b-to'), date = $('#b-date'), pax = $('#b-pax'), card = $('#b-card');
const codes = Object.keys(STATIONS);
codes.forEach((c) => { from.append(new Option(station(c), c)); to.append(new Option(station(c), c)); });
const qs = new URLSearchParams(location.search);
from.value = codes.includes(qs.get('from')) ? qs.get('from') : 'TNG';
to.value = codes.includes(qs.get('to')) ? qs.get('to') : 'CAV';
date.valueAsDate = new Date();
let cls = '2', picked = null, results = [];

document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('active', x === b));
  cls = b.dataset.cls;
  search();
}));
$('#swap').addEventListener('click', () => { [from.value, to.value] = [to.value, from.value]; search(); });

const fare = (j) => {
  const base = j.dist * (j.type === 'boraq' ? 0.55 : j.type === 'night' ? 0.4 : 0.3) * (cls === '1' ? 1.55 : 1);
  const disc = { none: 0, jeune: 0.3, senior: 0.4, fidelite: 0.2 }[card.value];
  return Math.max(15, Math.round(base * (1 - disc))) * +pax.value;
};
const dur = (m) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;

function search() {
  const today = new Date().toDateString() === (date.valueAsDate || new Date()).toDateString();
  const start = today ? moroccoNow() : 300;
  results = from.value === to.value ? [] : journeys(from.value, to.value, start, 6);
  const list = $('#results');
  if (!results.length) {
    list.innerHTML = `<p class="empty">${t(from.value === to.value ? 'bk.same' : 'bk.none')}</p>`;
    picked = null;
  } else {
    if (!picked || !results.find((r) => r.id === picked.id)) picked = results[0];
    list.innerHTML = results.map((j) => {
      const until = j.depAt - moroccoNow();
      const live = today && until < 60 ? `<span class="badge ${j.delay ? 'late' : 'ok'}">${j.delay ? '+' + j.delay + ' min' : t('st.in', { m: num(Math.max(1, Math.round(until))) })}</span>` : j.delay && today ? `<span class="badge late">+${j.delay} min</span>` : '';
      return `<button type="button" class="jr ${j.id === picked.id ? 'active' : ''}" data-id="${j.id}">
        <span class="jr-time"><b>${fmt(j.depAt)}</b><i></i><b>${fmt(j.arrAt)}</b></span>
        <span class="jr-meta"><span class="jr-type ${j.type}">${t('type.' + j.type)} ${j.no}</span><small>${dur(j.dur)} · ${num(Math.round(j.dist))} km</small></span>
        <span class="jr-price"><b>${num(fare(j))} MAD</b>${live}</span>
      </button>`;
    }).join('');
  }
  $('#q-price').textContent = picked ? `${num(fare(picked))} MAD` : '—';
  $('#q-meta').textContent = picked ? `${t('type.' + picked.type)} · ${fmt(picked.depAt)} → ${fmt(picked.arrAt)} · ${dur(picked.dur)}` : '';
}
$('#results').addEventListener('click', (e) => {
  const b = e.target.closest('.jr');
  if (!b) return;
  picked = results.find((r) => r.id === b.dataset.id);
  search();
});
[from, to, date, pax, card].forEach((el) => el.addEventListener('input', search));
window.addEventListener('langchange', () => {
  [from, to].forEach((s) => [...s.options].forEach((o) => (o.textContent = station(o.value))));
  search();
});
search();
setInterval(search, 30000);

// ---------- 3D: ticket printing out of a machine ----------
const canvas = $('#ticket-canvas');
const { scene, camera, size, loop } = createStage(canvas, { camPos: [0, 1.0, 5.8], fov: 38 });
addLights(scene);
const machine = new THREE.Group();
const box = new THREE.Mesh(new RoundedBoxGeometry(4.2, 1.2, 1.6, 4, 0.2), new THREE.MeshPhysicalMaterial({ color: 0x1a1d24, metalness: 0.6, roughness: 0.3, clearcoat: 1 }));
box.position.y = -1.6;
const slot = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 0.4), new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 1.4 }));
slot.position.set(0, -0.99, 0.1);
const screen = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.35, 0.05, 2, 0.04), new THREE.MeshStandardMaterial({ color: 0x0b0c10, emissive: 0x1a1d24 }));
screen.position.set(1.3, -1.45, 0.81);
machine.add(box, slot, screen);
scene.add(machine);
const ticketGeo = new THREE.PlaneGeometry(3.2, 1.75, 20, 1);
const ticketMat = new THREE.MeshStandardMaterial({ map: ticketTexture(), roughness: 0.55, side: THREE.DoubleSide, transparent: true });
const ticket = new THREE.Mesh(ticketGeo, ticketMat);
scene.add(ticket);
const base = ticketGeo.attributes.position.array.slice();
const latin = (c) => STATIONS[c].fr.toUpperCase().replace('VOYAGEURS', 'VOY.').normalize('NFD').replace(/[̀-ͯ]/g, '');

let print = 0, printing = false, floatT = 0;
$('#booking').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!picked) return;
  ticketMat.map.dispose();
  const d = date.valueAsDate || new Date();
  ticketMat.map = ticketTexture({
    from: latin(from.value), to: latin(to.value),
    date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    time: fmt(picked.depAt), cls: cls === '1' ? '1re' : '2e', pax: pax.value,
    train: { boraq: 'BORAQ', atlas: 'ATLAS', tnr: 'TNR', night: 'NUIT' }[picked.type] + ' ' + picked.no,
    price: fare(picked) + ' MAD', ref: Math.random().toString(36).slice(2, 8).toUpperCase(),
  });
  ticketMat.needsUpdate = true;
  print = 0; printing = true; floatT = 0;
  $('#print-status').innerHTML = t('bk.printing');
});

loop((time, dt, mouse) => {
  if (printing) {
    print = Math.min(print + dt * 0.55, 1);
    if (print >= 1) { printing = false; $('#print-status').innerHTML = t('bk.ready'); }
  }
  floatT = print >= 1 ? floatT + dt : 0;
  const e = 1 - Math.pow(1 - print, 3);
  const lift = Math.min(floatT * 0.8, 1), le = lift * lift * (3 - 2 * lift);
  ticket.position.set(0, -1.9 + e * 2.0 + le * 0.5 + Math.sin(time * 1.5) * 0.04 * le, 0.1 + le * 1.2);
  ticket.rotation.set(-0.05 - le * 0.15 + mouse.y * 0.1 * le, mouse.x * 0.25 * le, 0);
  ticket.visible = print > 0;
  const p = ticketGeo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, (1 - le) * Math.pow((base[i * 3 + 1] + 0.875) / 1.75, 2) * -0.25 + Math.sin(base[i * 3] * 1.2 + time * 2) * 0.01);
  p.needsUpdate = true;
  slot.material.emissiveIntensity = printing ? 2 + Math.sin(time * 20) * 0.8 : 1.2;
  machine.position.y = printing ? Math.sin(time * 50) * 0.004 : 0;
  const far = size.w < 600 ? 1.5 : 1;
  camera.position.set(mouse.x * 0.6, 1.0 + mouse.y * 0.3, 5.8 * far);
  camera.lookAt(0, -0.35, 0);
});

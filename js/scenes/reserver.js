import { THREE, RoundedBoxGeometry, createStage, addLights, ticketTexture, ACCENT } from './common.js';

// Sample fares and durations for the concept only.
const STATIONS = ['TANGER VILLE', 'KENITRA', 'RABAT AGDAL', 'RABAT VILLE', 'CASA VOYAGEURS', 'CASA PORT', 'EL JADIDA', 'MARRAKECH', 'FES', 'MEKNES', 'OUJDA'];
const BORAQ = ['TANGER VILLE', 'KENITRA', 'RABAT AGDAL', 'CASA VOYAGEURS'];
const KM = { 'TANGER VILLE': 0, KENITRA: 200, 'RABAT AGDAL': 245, 'RABAT VILLE': 248, 'CASA VOYAGEURS': 330, 'CASA PORT': 333, 'EL JADIDA': 430, MARRAKECH: 570, MEKNES: 330, FES: 390, OUJDA: 700 };

const $ = (s) => document.querySelector(s);
const from = $('#b-from'), to = $('#b-to'), date = $('#b-date'), time = $('#b-time'), pax = $('#b-pax'), card = $('#b-card');
STATIONS.forEach((s) => { from.append(new Option(s, s)); to.append(new Option(s, s)); });
const qs = new URLSearchParams(location.search);
from.value = STATIONS.includes(qs.get('from')) ? qs.get('from') : 'TANGER VILLE';
to.value = STATIONS.includes(qs.get('to')) ? qs.get('to') : 'CASA VOYAGEURS';
date.valueAsDate = new Date(Date.now() + 86400000);
let cls = '2';
document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('active', x === b));
  cls = b.dataset.cls;
  quote();
}));
$('#swap').addEventListener('click', () => { [from.value, to.value] = [to.value, from.value]; quote(); });

function quote() {
  const a = from.value, b = to.value;
  const km = Math.max(30, Math.abs((KM[a] ?? 0) - (KM[b] ?? 0)) || 60);
  const boraq = BORAQ.includes(a) && BORAQ.includes(b) && a !== b;
  let price = km * (boraq ? 0.62 : 0.32) * (cls === '1' ? 1.5 : 1);
  const disc = { none: 0, jeune: 0.3, senior: 0.4, fidelite: 0.2 }[card.value];
  price = Math.round(price * (1 - disc)) * +pax.value;
  const mins = Math.round(km / (boraq ? 2.4 : 1.25));
  $('#q-price').textContent = a === b ? '—' : price + ' MAD';
  $('#q-meta').textContent = a === b ? 'Choose two different stations' : `${boraq ? 'Al Boraq' : 'Al Atlas'} · ~${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')} · sample fare`;
  return { a, b, price, boraq };
}
[from, to, date, time, pax, card].forEach((el) => el.addEventListener('input', quote));
quote();

// ---------- 3D: ticket printing out of a machine ----------
const canvas = $('#ticket-canvas');
const { scene, camera, size, loop } = createStage(canvas, { camPos: [0, 1.2, 7.5], fov: 38 });
addLights(scene);
const machine = new THREE.Group();
const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1d24, metalness: 0.6, roughness: 0.3, clearcoat: 1 });
const box = new THREE.Mesh(new RoundedBoxGeometry(4.2, 1.2, 1.6, 4, 0.2), bodyMat);
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

let print = 0, printing = false, floatT = 0;
$('#booking').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = quote();
  if (q.a === q.b) return;
  ticketMat.map.dispose();
  const d = date.valueAsDate || new Date();
  ticketMat.map = ticketTexture({
    from: q.a.replace('VOYAGEURS', 'VOY.'), to: q.b.replace('VOYAGEURS', 'VOY.'),
    date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    time: time.value, cls: cls === '1' ? '1re' : '2e', pax: pax.value, train: q.boraq ? 'BORAQ' : 'ATLAS',
    price: q.price + ' MAD', ref: Math.random().toString(36).slice(2, 8).toUpperCase(),
  });
  ticketMat.needsUpdate = true;
  print = 0; printing = true; floatT = 0;
  $('#print-status').textContent = 'Printing…';
});

loop((t, dt, mouse) => {
  if (printing) {
    print = Math.min(print + dt * 0.55, 1);
    if (print >= 1) { printing = false; $('#print-status').textContent = 'Ready ✓ (concept ticket)'; }
  }
  floatT = print >= 1 ? floatT + dt : 0;
  const e = 1 - Math.pow(1 - print, 3);
  // rises out of the slot, then lifts and turns toward the viewer
  const lift = Math.min(floatT * 0.8, 1);
  const le = lift * lift * (3 - 2 * lift);
  ticket.position.set(0, -1.9 + e * 2.0 + le * 0.5 + Math.sin(t * 1.5) * 0.04 * le, 0.1 + le * 1.2);
  ticket.rotation.set(-0.05 - le * 0.15 + mouse.y * 0.1 * le, mouse.x * 0.25 * le, 0);
  ticket.visible = print > 0;
  // gentle curl while printing
  const p = ticketGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1];
    p.setZ(i, (1 - le) * Math.pow((y + 0.875) / 1.75, 2) * -0.25 + Math.sin(x * 1.2 + t * 2) * 0.01);
  }
  p.needsUpdate = true;
  slot.material.emissiveIntensity = printing ? 2 + Math.sin(t * 20) * 0.8 : 1.2;
  machine.position.y = printing ? Math.sin(t * 50) * 0.004 : 0;
  const far = size.w < 600 ? 1.5 : 1;
  camera.position.set(mouse.x * 0.6, 1.0 + mouse.y * 0.3, 5.8 * far);
  camera.lookAt(0, -0.35, 0);
});

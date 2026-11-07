import { THREE, createStage, addLights, createTrain, ACCENT } from './common.js';

// ---------- Showroom: train on a turntable, drag to rotate ----------
const canvas = document.querySelector('#show-canvas');
const { scene, camera, size, loop } = createStage(canvas, { camPos: [0, 3.2, 12], fov: 36 });
addLights(scene);
const train = createTrain({ cars: 2 });
const rig = new THREE.Group();
rig.add(train);
scene.add(rig);

// turntable + light rings
const table = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.4, 0.25, 96), new THREE.MeshStandardMaterial({ color: 0x0f1116, metalness: 0.6, roughness: 0.35 }));
table.position.y = -1.15;
scene.add(table);
const rings = [6.25, 5.2, 4.1].map((r, i) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 200), new THREE.MeshBasicMaterial({ color: i ? 0xffffff : ACCENT, transparent: true, opacity: i ? 0.15 : 0.9 }));
  m.rotation.x = Math.PI / 2;
  m.position.y = -1.0;
  scene.add(m);
  return m;
});
const rails = new THREE.Group();
[-0.36, 0.36].forEach((z) => {
  const r = new THREE.Mesh(new THREE.BoxGeometry(12, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x9aa0aa, metalness: 1, roughness: 0.25 }));
  r.position.set(0, -0.97, z);
  rails.add(r);
});
rig.add(rails);

let rot = -0.5, vel = 0, drag = false, lx = 0;
canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (drag) { vel = (e.clientX - lx) * 0.006; lx = e.clientX; } });
const stop = () => (drag = false);
canvas.addEventListener('pointerup', stop);
canvas.addEventListener('pointercancel', stop);

loop((t, dt, mouse) => {
  if (!drag) { vel *= 0.94; rot += dt * 0.12; }
  rot += vel;
  rig.rotation.y = rot;
  rings[0].material.opacity = 0.6 + Math.sin(t * 2) * 0.3;
  const far = size.w < 700 ? 1.6 : 1;
  camera.position.set(mouse.x * 1.5, 2.6 + mouse.y * 0.8, 10 * far);
  camera.lookAt(0, -0.9, 0);
});

// ---------- spec counters ----------
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  const el = en.target, end = +el.dataset.to, t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / 1600, 1);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + (el.dataset.unit || '');
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  io.unobserve(el);
}), { threshold: 0.5 });
document.querySelectorAll('[data-to]').forEach((el) => io.observe(el));

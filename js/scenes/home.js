import { THREE, createStage, addLights, createTrain, createTunnel } from './common.js';

// ---------- Hero: high-speed train in a tunnel of light ----------
const canvas = document.querySelector('#hero-canvas');
const { scene, camera, size, loop } = createStage(canvas, { camPos: [6, 1.4, 7.5], fov: 42 });
scene.fog = new THREE.Fog(0x07080b, 14, 48);
addLights(scene);
const train = createTrain({ cars: 4 });
scene.add(train);
const tunnel = createTunnel(scene);

const speedEl = document.querySelector('#speed');
const hero = document.querySelector('.hero');
let speed = 0, intro = 0;

loop((t, dt, mouse) => {
  intro = Math.min(intro + dt * 0.22, 1);
  // speed ramps up on load, then follows scroll through the hero
  const s = Math.min(scrollY / (hero.offsetHeight * 0.8), 1);
  const target = 0.35 + intro * 0.35 + s * 0.3;
  speed += (target - speed) * 0.03;
  tunnel.update(dt, speed);
  if (speedEl) speedEl.textContent = Math.round(speed * 320);

  train.position.y = Math.sin(t * 40) * 0.004 * speed;
  train.rotation.x = Math.sin(t * 13) * 0.002 * speed;

  const wide = camera.aspect > 1.2;
  const cx = wide ? 2.5 : 4.5, cz = wide ? 7.2 : 12;
  camera.position.x += (cx + mouse.x * 1.2 - s * 3 - camera.position.x) * 0.05;
  camera.position.y += (1.3 + mouse.y * 0.5 + s * 0.6 - camera.position.y) * 0.05;
  camera.position.z += (cz - camera.position.z) * 0.05;
  camera.fov += (42 + speed * 14 - camera.fov) * 0.05; // widen FOV at speed
  camera.updateProjectionMatrix();
  camera.lookAt(wide ? 5.8 : 4.5, -0.1, 0);
  void size;
});

// ---------- Quick search -> booking page ----------
document.querySelector('#quick')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  location.href = `reserver.html?from=${encodeURIComponent(f.get('from'))}&to=${encodeURIComponent(f.get('to'))}`;
});

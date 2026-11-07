import { THREE, createStage, addLights, createTrain, createTunnel } from './common.js';

// Background: a train streaming by, slowly, behind the contact form
const canvas = document.querySelector('#bg-canvas');
const { scene, camera, loop } = createStage(canvas, { camPos: [0, 1.2, 10], fov: 40 });
scene.fog = new THREE.Fog(0x07080b, 10, 40);
addLights(scene);
const train = createTrain({ cars: 3 });
scene.add(train);
const tunnel = createTunnel(scene, { streaks: 180 });

let speed = 0.15, boost = 0;
document.querySelectorAll('.form input, .form textarea, .form select').forEach((el) => {
  el.addEventListener('input', () => (boost = Math.min(boost + 0.06, 0.6)));
});

loop((t, dt, mouse) => {
  boost *= 0.985;
  speed += (0.18 + boost - speed) * 0.05;
  tunnel.update(dt, speed);
  train.position.x = Math.sin(t * 0.1) * 2;
  camera.position.x = -3 + mouse.x * 1;
  camera.position.y = 0.8 + mouse.y * 0.4;
  camera.lookAt(-1, -0.2, 0);
});

const form = document.querySelector('#contact-form');
const toast = document.querySelector('.toast');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.reset();
  boost = 1.2;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
});

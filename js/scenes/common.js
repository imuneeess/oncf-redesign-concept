// Shared Three.js helpers for the ONCF concept
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export { THREE, RoundedBoxGeometry };
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// PLACEHOLDER accent: keep in sync with --accent in css/style.css
export const ACCENT = 0xff7a1a;
export const ACCENT_CSS = '#ff7a1a';

export function createStage(canvas, { camPos = [0, 2, 10], fov = 40, env = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  if (env) scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 400);
  camera.position.set(...camPos);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
  });
  const size = { w: 1, h: 1 };
  const resize = () => {
    size.w = canvas.clientWidth || 1;
    size.h = canvas.clientHeight || 1;
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);
  const clock = new THREE.Clock();
  const loop = (update) => renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden) return;
    const t = clock.elapsedTime * (reduceMotion ? 0.2 : 1);
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    update(t, dt, mouse);
    renderer.render(scene, camera);
  });
  return { renderer, scene, camera, mouse, size, loop };
}

export function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 8, 6);
  const rim = new THREE.PointLight(ACCENT, 60, 40);
  rim.position.set(-6, 3, -4);
  const cool = new THREE.PointLight(0x7aa7ff, 25, 40);
  cool.position.set(6, 2, 6);
  scene.add(key, rim, cool);
  return { key, rim, cool };
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// ---------- High-speed train (stylized, original design) ----------
const M = () => ({
  body: new THREE.MeshPhysicalMaterial({ color: 0xe9ebef, metalness: 0.55, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x0b0d12, metalness: 0.9, roughness: 0.08, clearcoat: 1 }),
  stripe: new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.6, roughness: 0.4 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1b1e25, metalness: 0.6, roughness: 0.5 }),
  light: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 }),
});

function carriage(m, L, { nose = 0 } = {}) {
  // nose: 0 = middle car, 1 = nose pointing +x, -1 = nose pointing -x
  const g = new THREE.Group();
  const H = 1.15, W = 1.05;
  const bodyLen = nose ? L - 1.2 : L;
  const body = new THREE.Mesh(new RoundedBoxGeometry(bodyLen, H, W, 5, 0.32), m.body);
  body.position.x = nose ? -nose * 0.6 : 0;
  g.add(body);
  const band = new THREE.Mesh(new RoundedBoxGeometry(bodyLen - 0.5, 0.26, W + 0.012, 2, 0.08), m.glass);
  band.position.set(body.position.x, 0.18, 0);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(bodyLen - 0.2, 0.05, W + 0.016), m.stripe);
  stripe.position.set(body.position.x, -0.12, 0);
  const skirt = new THREE.Mesh(new RoundedBoxGeometry(bodyLen - 0.3, 0.22, W - 0.08, 2, 0.06), m.dark);
  skirt.position.set(body.position.x, -0.62, 0);
  g.add(band, stripe, skirt);
  if (nose) {
    const noseGeo = new THREE.SphereGeometry(0.56, 40, 24, 0, Math.PI * 2, 0, Math.PI);
    const n = new THREE.Mesh(noseGeo, m.body);
    n.scale.set(2.6, 1.02, 0.94);
    n.position.set(nose * (L / 2 - 1.45), 0, 0);
    const shield = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), m.glass);
    shield.scale.set(1.25, 0.42, 0.86);
    shield.position.set(nose * (L / 2 - 1.0), 0.24, 0);
    const nStripe = new THREE.Mesh(new THREE.SphereGeometry(0.565, 40, 8, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.05), m.stripe);
    nStripe.scale.copy(n.scale);
    nStripe.position.copy(n.position);
    const lampL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), m.light);
    lampL.position.set(nose * (L / 2 - 0.2), -0.22, 0.25);
    const lampR = lampL.clone(); lampR.position.z = -0.25;
    g.add(n, shield, nStripe, lampL, lampR);
  }
  // bogies
  [-1, 1].forEach((s) => {
    const bx = s * (L / 2 - 0.9) - (nose ? nose * 0.3 : 0);
    const bogie = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.9), m.dark);
    bogie.position.set(bx, -0.74, 0);
    g.add(bogie);
  });
  return g;
}

/** Returns a train group pointing +x. cars >= 2 (nose + middles + tail). */
export function createTrain({ cars = 4, L = 4.2 } = {}) {
  const m = M();
  const train = new THREE.Group();
  const gap = 0.12;
  for (let i = 0; i < cars; i++) {
    const nose = i === 0 ? 1 : i === cars - 1 ? -1 : 0;
    const c = carriage(m, L, { nose });
    c.position.x = -i * (L + gap);
    train.add(c);
    if (i > 0) {
      const link = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.85), m.dark);
      link.position.x = -i * (L + gap) + L / 2 + gap / 2;
      train.add(link);
    }
  }
  // pantograph on the 2nd car
  const pMat = new THREE.MeshStandardMaterial({ color: 0x9aa0aa, metalness: 0.9, roughness: 0.3 });
  const px = -(L + gap);
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9), pMat);
  arm1.position.set(px + 0.2, 0.85, 0); arm1.rotation.z = 0.9;
  const arm2 = arm1.clone(); arm2.position.set(px - 0.15, 1.05, 0); arm2.rotation.z = -0.7;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.8), pMat);
  head.position.set(px - 0.4, 1.27, 0);
  train.add(arm1, arm2, head);
  // center the train on its middle
  const total = (cars - 1) * (L + gap);
  train.children.forEach((c) => (c.position.x += total / 2));
  train.userData.length = total + L;
  return train;
}

// ---------- Speed tunnel: train stays still, the world streams past ----------
export function createTunnel(scene, { streaks = 260, radius = 7, length = 120 } = {}) {
  const group = new THREE.Group();
  scene.add(group);
  // rails + bed
  const railMat = new THREE.MeshStandardMaterial({ color: 0x9aa0aa, metalness: 1, roughness: 0.25 });
  [-0.36, 0.36].forEach((z) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(length, 0.05, 0.05), railMat);
    r.position.set(0, -0.97, z);
    group.add(r);
  });
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(length, 3), new THREE.MeshStandardMaterial({ color: 0x0c0d11, roughness: 1 }));
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = -1.0;
  group.add(bed);
  // sleepers (instanced, scrolling)
  const SLEEPERS = 90, sp = length / SLEEPERS;
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.04, 1.3), new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.9 }), SLEEPERS);
  group.add(sleepers);
  // light streaks
  const streakGeo = new THREE.BoxGeometry(1, 0.02, 0.02);
  const streakMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const accentMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = [streakMat, accentMat].map((mat, k) => {
    const n = k ? Math.round(streaks * 0.25) : streaks;
    const im = new THREE.InstancedMesh(streakGeo, mat, n);
    const data = Array.from({ length: n }, () => {
      const a = Math.random() * Math.PI * 2;
      const r = 2.2 + Math.random() * radius;
      return { x: (Math.random() - 0.5) * length, y: Math.max(Math.sin(a) * r, -0.6 + Math.random() * 0.3), z: Math.cos(a) * r, len: 1 + Math.random() * 4, sp: 0.6 + Math.random() * 0.8 };
    });
    group.add(im);
    return { im, data };
  });
  // catenary poles
  const POLES = 14, poleSp = length / POLES;
  const poles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 3.2, 0.08), new THREE.MeshStandardMaterial({ color: 0x30343c, metalness: 0.7, roughness: 0.4 }), POLES);
  group.add(poles);
  const wire = new THREE.Mesh(new THREE.BoxGeometry(length, 0.01, 0.01), railMat);
  wire.position.set(0, 1.32, 0);
  group.add(wire);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  let travel = 0;
  const wrap = (x) => ((((x + length / 2) % length) + length) % length) - length / 2;
  return {
    group,
    update(dt, speed) {
      travel += dt * speed * 60;
      for (let i = 0; i < SLEEPERS; i++) {
        m4.compose(v.set(wrap(i * sp - travel), -0.99, 0), q, s.set(1, 1, 1));
        sleepers.setMatrixAt(i, m4);
      }
      sleepers.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < POLES; i++) {
        m4.compose(v.set(wrap(i * poleSp - travel), 0.3, -1.6), q, s.set(1, 1, 1));
        poles.setMatrixAt(i, m4);
      }
      poles.instanceMatrix.needsUpdate = true;
      lines.forEach(({ im, data }) => {
        data.forEach((d, i) => {
          const x = wrap(d.x - travel * d.sp * 1.6);
          m4.compose(v.set(x, d.y, d.z), q, s.set(d.len * (0.2 + speed * 3), 1, 1));
          im.setMatrixAt(i, m4);
        });
        im.instanceMatrix.needsUpdate = true;
        im.material.opacity = Math.min(1, 0.15 + speed * 1.2);
      });
    },
  };
}

// ---------- Ticket texture ----------
export function ticketTexture({ from = 'TANGER VILLE', to = 'CASA VOYAGEURS', date = '—', time = '—', cls = '2', pax = '1', train = 'AL BORAQ', price = '—', ref = 'XXXX' } = {}) {
  return canvasTex(1024, 560, (ctx, w, h) => {
    ctx.fillStyle = '#f4f2ec';
    ctx.beginPath(); ctx.roundRect(0, 0, w, h, 28); ctx.fill();
    // header band
    ctx.fillStyle = '#0d0f14';
    ctx.beginPath(); ctx.roundRect(0, 0, w, 110, [28, 28, 0, 0]); ctx.fill();
    ctx.fillStyle = ACCENT_CSS;
    ctx.fillRect(0, 106, w, 8);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 50px "Inter Tight", sans-serif';
    ctx.fillText('ONCF', 50, 72);
    ctx.font = '500 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#9aa0aa';
    ctx.fillText('CONCEPT E-TICKET · NOT VALID FOR TRAVEL', 230, 68);
    // route
    ctx.fillStyle = '#7a7f88';
    ctx.font = '500 20px "JetBrains Mono", monospace';
    ctx.fillText('DÉPART', 50, 175);
    ctx.fillText('ARRIVÉE', 520, 175);
    ctx.fillStyle = '#0d0f14';
    ctx.font = '800 50px "Inter Tight", sans-serif';
    ctx.fillText(from, 50, 235);
    ctx.fillText(to, 520, 235);
    ctx.fillStyle = ACCENT_CSS;
    ctx.font = '700 46px "Inter Tight", sans-serif';
    ctx.fillText('→', 455, 232);
    // details
    const cols = [['DATE', date], ['HEURE', time], ['CLASSE', cls], ['VOY.', pax], ['TRAIN', train]];
    cols.forEach(([k, val], i) => {
      const x = 50 + i * 150;
      ctx.fillStyle = '#7a7f88';
      ctx.font = '500 18px "JetBrains Mono", monospace';
      ctx.fillText(k, x, 310);
      ctx.fillStyle = '#0d0f14';
      ctx.font = '700 28px "JetBrains Mono", monospace';
      ctx.fillText(val, x, 350);
    });
    // perforation
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#c9c6bd';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(800, 130); ctx.lineTo(800, h - 20); ctx.stroke();
    ctx.setLineDash([]);
    // QR-like block (decorative)
    const qx = 830, qy = 300, cell = 12;
    for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) {
      const corner = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
      if (corner ? (x % 3 === 0 || y % 3 === 0 || (x % 3 === 1 && y % 3 === 1)) : Math.random() > 0.5) {
        ctx.fillStyle = '#0d0f14';
        ctx.fillRect(qx + x * cell, qy + y * cell, cell - 1, cell - 1);
      }
    }
    ctx.fillStyle = '#7a7f88';
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillText('RÉF ' + ref, 830, 490);
    // price
    ctx.fillStyle = '#0d0f14';
    ctx.font = '800 44px "Inter Tight", sans-serif';
    ctx.fillText(price, 830, 230);
    ctx.fillStyle = '#7a7f88';
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillText('SAMPLE FARE', 830, 260);
    ctx.fillText('Unofficial concept by Imuneeess', 50, h - 40);
  });
}

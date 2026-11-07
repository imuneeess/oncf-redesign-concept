import { THREE, createStage, addLights, createTrain, createTunnel } from './common.js';
import { createNetMap } from '../netmap.js';
import { boardFor, moroccoNow, fmt } from '../live.js';
import { Flap } from '../flap.js';
import { t, station } from '../i18n.js';

const ease = (x) => 1 - Math.pow(1 - x, 3);

// ---------- Hero: train rushes in, then cruises through a tunnel of light ----------
{
  const canvas = document.querySelector('#hero-canvas');
  const { scene, camera, loop } = createStage(canvas, { camPos: [2.5, 1.4, 7.5], fov: 42 });
  scene.fog = new THREE.Fog(0x07080b, 14, 48);
  addLights(scene);
  const train = createTrain({ cars: 4 });
  scene.add(train);
  const tunnel = createTunnel(scene);
  const speedEl = document.querySelector('#speed');
  const hero = document.querySelector('.hero');
  let speed = 0, intro = 0, shake = 0;

  loop((time, dt, mouse) => {
    intro = Math.min(intro + dt * 0.45, 1);
    const s = Math.min(scrollY / (hero.offsetHeight * 0.8), 1);
    const target = 0.3 + ease(intro) * 0.45 + s * 0.25;
    speed += (target - speed) * 0.04;
    tunnel.update(dt, speed);
    if (speedEl) speedEl.textContent = Math.round(speed * 320);

    // entrance: the train arrives from behind the camera and settles
    train.position.x = -38 * (1 - ease(intro));
    shake = intro < 1 ? (1 - intro) * 0.06 : speed * 0.006;
    train.position.y = Math.sin(time * 40) * 0.004 * speed;

    const wide = camera.aspect > 1.2;
    camera.position.x += ((wide ? 2.5 : 4.5) + mouse.x * 1.2 - s * 3 - camera.position.x) * 0.05 + (Math.random() - 0.5) * shake;
    camera.position.y += (1.3 + mouse.y * 0.5 + s * 0.6 - camera.position.y) * 0.05 + (Math.random() - 0.5) * shake;
    camera.position.z += ((wide ? 7.2 : 12) - camera.position.z) * 0.05;
    camera.fov += (40 + speed * 18 - camera.fov) * 0.05;
    camera.updateProjectionMatrix();
    camera.lookAt(wide ? 5.8 : 4.5, -0.1, 0);
  });
}

// ---------- Live network map + mini departures board ----------
{
  const map = createNetMap(document.querySelector('#net-canvas'), { speed: 60, labels: 'major' });
  const clockEl = document.querySelector('#sim-clock');
  let lastMin = -1;
  map.state && setInterval(() => {
    const m = Math.floor(map.state.simNow);
    if (m !== lastMin) { lastMin = m; clockEl.textContent = fmt(map.state.simNow); }
  }, 250);
  document.querySelectorAll('[data-speed]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-speed]').forEach((x) => x.classList.toggle('active', x === b));
    map.setSpeed(+b.dataset.speed);
  }));

  const rows = [...document.querySelectorAll('#mini-board .mrow')].map((row) => ({
    time: new Flap(row.children[0], { length: 5 }), dest: new Flap(row.children[1], { length: 14 }), st: new Flap(row.children[2], { length: 9 }), el: row,
  }));
  const render = () => {
    const list = boardFor('CAV', moroccoNow(), { limit: rows.length });
    rows.forEach((r, i) => {
      const d = list[i];
      if (!d) { r.time.set(''); r.dest.set(''); r.st.set(''); return; }
      r.time.set(fmt(d.actual));
      r.dest.set(station(d.other));
      const label = d.status === 'in' ? t('st.in', { m: Math.max(1, Math.round(d.until)) }) : d.status === 'late' ? `+${d.delay} MIN` : t('st.' + d.status);
      r.st.set(label);
      r.el.dataset.status = d.status;
    });
  };
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { render(); io.disconnect(); setInterval(render, 20000); } });
  io.observe(document.querySelector('#mini-board'));
  window.addEventListener('langchange', render);
}

// ---------- Scroll ride: Tanger -> Casa on the high-speed line ----------
{
  const ride = document.querySelector('.ride');
  const trainEl = ride.querySelector('.ride-train');
  const stops = [...ride.querySelectorAll('.ride-stop')];
  const timeEl = ride.querySelector('#ride-time'), spEl = ride.querySelector('#ride-speed'), nextEl = ride.querySelector('#ride-next');
  const graph = ride.querySelector('#ride-graph');
  const gctx = graph.getContext('2d');
  // sample profile: [progress 0..1 along the line, minutes, km/h]
  const STOPS = [['TNG', 0, 0], ['KEN', 0.56, 47], ['RBA', 0.69, 80], ['CAV', 1, 130]];
  const speedAt = (p) => {
    if (p < 0.03) return (p / 0.03) * 200;
    if (p < 0.08) return 200 + ((p - 0.03) / 0.05) * 120;
    if (p < 0.5) return 320 - Math.sin(p * 40) * 6;
    if (p < 0.56) return 320 * (1 - (p - 0.5) / 0.06);
    if (p < 0.58) return ((p - 0.56) / 0.02) * 140;
    if (p < 0.67) return 160 - Math.abs(Math.sin(p * 30)) * 10;
    if (p < 0.69) return 160 * (1 - (p - 0.67) / 0.02);
    if (p < 0.71) return ((p - 0.69) / 0.02) * 150;
    if (p < 0.97) return 160 - Math.abs(Math.sin(p * 25)) * 15;
    return 160 * (1 - (p - 0.97) / 0.03);
  };
  const minutesAt = (p) => {
    for (let i = 0; i < STOPS.length - 1; i++) {
      const [, p0, m0] = STOPS[i], [, p1, m1] = STOPS[i + 1];
      if (p <= p1) return m0 + ((p - p0) / (p1 - p0)) * (m1 - m0);
    }
    return 130;
  };
  let sp = 0;
  const frame = () => {
    requestAnimationFrame(frame);
    const r = ride.getBoundingClientRect();
    const target = Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 1);
    sp += (target - sp) * 0.12;
    if (Math.abs(target - sp) < 0.0005 && frame.drawn === target) return;
    frame.drawn = target;
    const rtl = document.documentElement.dir === 'rtl';
    trainEl.style.setProperty('--p', sp);
    trainEl.style.left = rtl ? 'auto' : `${sp * 100}%`;
    trainEl.style.right = rtl ? `${sp * 100}%` : 'auto';
    const mins = minutesAt(sp);
    timeEl.textContent = `${Math.floor(mins / 60)}:${String(Math.floor(mins % 60)).padStart(2, '0')}`;
    spEl.textContent = Math.round(speedAt(sp));
    const next = STOPS.find(([, p]) => p > sp + 0.001) || STOPS[3];
    nextEl.textContent = station(next[0]);
    stops.forEach((s, i) => s.classList.toggle('passed', sp >= STOPS[i][1] - 0.002));
    ride.style.setProperty('--blur', `${Math.min(speedAt(sp) / 320, 1)}`);
    // speed graph up to current progress
    const W = graph.width = graph.clientWidth * 2, H = graph.height = graph.clientHeight * 2;
    gctx.clearRect(0, 0, W, H);
    gctx.strokeStyle = 'rgba(255,255,255,0.08)'; gctx.lineWidth = 2;
    [0.25, 0.5, 0.75].forEach((y) => { gctx.beginPath(); gctx.moveTo(0, H * y); gctx.lineTo(W, H * y); gctx.stroke(); });
    const path = new Path2D();
    for (let i = 0; i <= 200; i++) {
      const p = (i / 200) * sp;
      const x = rtl ? W - p * W : p * W, y = H - (speedAt(p) / 340) * H;
      i ? path.lineTo(x, y) : path.moveTo(x, y);
    }
    gctx.strokeStyle = '#ff7a1a'; gctx.lineWidth = 4; gctx.stroke(path);
    const fill = new Path2D(path);
    fill.lineTo(rtl ? W - sp * W : sp * W, H); fill.lineTo(rtl ? W : 0, H);
    const g = gctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,122,26,0.35)'); g.addColorStop(1, 'rgba(255,122,26,0)');
    gctx.fillStyle = g; gctx.fill(fill);
  };
  requestAnimationFrame(frame);
  window.addEventListener('langchange', () => (frame.drawn = -1));
}

// ---------- Quick search -> booking page ----------
document.querySelector('#quick')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  location.href = `reserver.html?from=${f.get('from')}&to=${f.get('to')}`;
});

// Split-flap display (station departure board style), EN/FR letters + Arabic words.
// <span class="flap" data-flap="320"></span>               static text
// <span class="flap" data-flap-key="board.title"></span>    translated text
// <span class="flap" data-flap-cycle-key="home.cities"></span>  cycles "A|B|C" from the dictionary
import { t } from './i18n.js';

const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZÉÈÀÇ0123456789:-.→←'/+%";
const ARABIC = /[؀-ۿ]/;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nb = (c) => (c === ' ' ? ' ' : c);

export class Flap {
  constructor(el, { length } = {}) {
    this.el = el;
    this.length = length || 1;
    this.mode = null;
    el.classList.add('flap');
    el.setAttribute('aria-live', 'polite');
  }

  #build(mode, n) {
    this.el.textContent = '';
    this.mode = mode;
    this.el.classList.toggle('flap-word', mode === 'word');
    this.cells = Array.from({ length: n }, () => {
      const cell = document.createElement('span');
      cell.className = 'cell';
      cell.setAttribute('aria-hidden', 'true');
      cell.innerHTML = '<span class="half top"><span> </span></span><span class="half bottom"><span> </span></span>';
      this.el.append(cell);
      return { el: cell, top: cell.firstChild.firstChild, bottom: cell.lastChild.firstChild, ch: ' ', busy: null };
    });
  }

  #flipTo(c, next, after) {
    const flip = document.createElement('span');
    flip.className = 'flip';
    flip.innerHTML = '<span></span>';
    flip.firstChild.textContent = nb(c.ch);
    c.el.append(flip);
    c.top.textContent = nb(next);
    requestAnimationFrame(() => flip.classList.add('go'));
    c.busy = setTimeout(() => {
      flip.remove();
      c.bottom.textContent = nb(next);
      c.ch = next;
      after?.();
    }, 75);
  }

  #cell(c, target, delay) {
    clearTimeout(c.busy);
    c.el.querySelectorAll('.flip').forEach((f) => f.remove());
    if (reduce || target === c.ch) { c.top.textContent = c.bottom.textContent = nb(target); c.ch = target; return; }
    const steps = 4 + Math.floor(Math.random() * 6);
    const seq = Array.from({ length: steps }, (_, k) => (k === steps - 1 ? target : CHARS[(Math.random() * CHARS.length) | 0]));
    let i = 0;
    const step = () => { if (i < seq.length) this.#flipTo(c, seq[i++], step); };
    c.busy = setTimeout(step, delay);
  }

  set(text = '') {
    text = String(text);
    this.el.setAttribute('aria-label', text.trim());
    if (ARABIC.test(text)) {
      // Arabic letters join, so flip whole words (like real bilingual boards)
      if (this.mode !== 'word') this.#build('word', 1);
      const c = this.cells[0];
      if (c.ch === text) return this;
      clearTimeout(c.busy);
      if (reduce) { c.top.textContent = c.bottom.textContent = c.ch = text; return this; }
      this.#flipTo(c, ' ', () => this.#flipTo(c, text));
      return this;
    }
    if (this.mode !== 'chars') this.#build('chars', this.length);
    const s = text.toUpperCase().padEnd(this.length, ' ').slice(0, this.length);
    this.cells.forEach((c, i) => this.#cell(c, s[i], i * 26));
    return this;
  }
}

// ---- auto-init ----
const live = [];
function boot(el) {
  if (el.dataset.flapCycleKey) {
    const words = () => t(el.dataset.flapCycleKey).split('|');
    const f = new Flap(el, { length: Math.max(...words().map((w) => w.length)) });
    let k = 0;
    f.set(words()[0]);
    setInterval(() => { const w = words(); f.set(w[(k = (k + 1) % w.length)]); }, +(el.dataset.flapEvery || 3200));
    live.push(() => { const w = words(); f.length = Math.max(...w.map((x) => x.length)); f.set(w[k % w.length]); });
  } else if (el.dataset.flapKey) {
    const f = new Flap(el, { length: Math.max(...['en', 'fr'].map(() => t(el.dataset.flapKey).length), 4) });
    const render = () => { f.length = Math.max(f.length, t(el.dataset.flapKey).length); f.set(t(el.dataset.flapKey)); };
    render();
    live.push(render);
  } else {
    const txt = el.dataset.flap;
    new Flap(el, { length: txt.length }).set(txt);
  }
}
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  io.unobserve(en.target);
  boot(en.target);
}), { threshold: 0.2 });
document.querySelectorAll('[data-flap], [data-flap-key], [data-flap-cycle-key]').forEach((el) => io.observe(el));
window.addEventListener('langchange', () => live.forEach((fn) => fn()));

// live clocks (Morocco time)
document.querySelectorAll('[data-clock]').forEach((el) => {
  const f = new Flap(el, { length: 5 });
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => f.set(fmt.format(new Date()));
  tick();
  setInterval(tick, 10000);
});

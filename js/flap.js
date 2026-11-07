// Split-flap display (station departure board style).
// Usage: <span class="flap" data-flap="CASABLANCA"></span>
//        <span class="flap" data-flap-cycle="TANGER|RABAT|CASA"></span>  (cycles words)
const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZÉÈ0123456789:-.→'/+";
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Flap {
  constructor(el, { length, text = '' } = {}) {
    this.el = el;
    el.classList.add('flap');
    el.setAttribute('aria-live', 'polite');
    this.length = length || text.length;
    this.cells = [];
    el.textContent = '';
    for (let i = 0; i < this.length; i++) this.cells.push(this.#cell());
    this.cells.forEach((c) => this.#paint(c, ' '));
  }

  #cell() {
    const cell = document.createElement('span');
    cell.className = 'cell';
    cell.innerHTML = '<span class="half top"><span></span></span><span class="half bottom"><span></span></span>';
    cell.setAttribute('aria-hidden', 'true');
    this.el.append(cell);
    return { el: cell, top: cell.querySelector('.top span'), bottom: cell.querySelector('.bottom span'), ch: ' ', busy: null };
  }

  #paint(c, ch) {
    c.top.textContent = ch === ' ' ? ' ' : ch;
    c.bottom.textContent = ch === ' ' ? ' ' : ch;
    c.ch = ch;
  }

  /** Flip one cell through a few random letters, landing on the target. */
  #flipCell(c, target, delay) {
    clearTimeout(c.busy);
    c.el.querySelectorAll('.flip').forEach((f) => f.remove());
    if (reduce) return this.#paint(c, target);
    const steps = target === c.ch ? 0 : 5 + Math.floor(Math.random() * 6);
    const seq = Array.from({ length: steps }, (_, k) => (k === steps - 1 ? target : CHARS[(Math.random() * CHARS.length) | 0]));
    let i = 0;
    const step = () => {
      if (i >= seq.length) return;
      const next = seq[i++];
      const cur = c.ch;
      // overlay shows the current top half falling away
      const flip = document.createElement('span');
      flip.className = 'flip';
      flip.innerHTML = `<span>${cur === ' ' ? '&nbsp;' : cur}</span>`;
      c.el.append(flip);
      c.top.textContent = next === ' ' ? ' ' : next;
      requestAnimationFrame(() => flip.classList.add('go'));
      c.busy = setTimeout(() => {
        flip.remove();
        c.bottom.textContent = next === ' ' ? ' ' : next;
        c.ch = next;
        step();
      }, 75);
    };
    c.busy = setTimeout(step, delay);
  }

  set(text) {
    const t = text.toUpperCase().padEnd(this.length, ' ').slice(0, this.length);
    this.el.setAttribute('aria-label', text.trim());
    this.cells.forEach((c, i) => this.#flipCell(c, CHARS.includes(t[i]) ? t[i] : t[i] || ' ', i * 28));
    return this;
  }
}

// ---- auto-init ----
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  const el = en.target;
  io.unobserve(el);
  if (el.dataset.flapCycle) {
    const words = el.dataset.flapCycle.split('|');
    const f = new Flap(el, { length: Math.max(...words.map((w) => w.length)) });
    let k = 0;
    f.set(words[0]);
    setInterval(() => f.set(words[(k = (k + 1) % words.length)]), +(el.dataset.flapEvery || 3200));
  } else {
    new Flap(el, { text: el.dataset.flap }).set(el.dataset.flap);
  }
}), { threshold: 0.3 });
document.querySelectorAll('[data-flap], [data-flap-cycle]').forEach((el) => io.observe(el));

// live clock boards
document.querySelectorAll('[data-clock]').forEach((el) => {
  const f = new Flap(el, { length: 5 });
  const tick = () => {
    const d = new Date();
    f.set(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };
  tick();
  setInterval(tick, 15000);
});

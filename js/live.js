// Simulated live rail network for the concept.
// Everything here is SAMPLE data: stations are real places, but services, times,
// delays and platforms are generated, not official ONCF information.

export const STATIONS = {
  TNG: { lat: 35.77, lon: -5.8, en: 'Tanger Ville', fr: 'Tanger Ville', ar: 'طنجة المدينة' },
  KEN: { lat: 34.26, lon: -6.58, en: 'Kenitra', fr: 'Kénitra', ar: 'القنيطرة' },
  RBV: { lat: 34.02, lon: -6.83, en: 'Rabat Ville', fr: 'Rabat Ville', ar: 'الرباط المدينة' },
  RBA: { lat: 33.99, lon: -6.86, en: 'Rabat Agdal', fr: 'Rabat Agdal', ar: 'الرباط أكدال' },
  MOH: { lat: 33.69, lon: -7.38, en: 'Mohammedia', fr: 'Mohammedia', ar: 'المحمدية' },
  CAV: { lat: 33.59, lon: -7.59, en: 'Casa Voyageurs', fr: 'Casa Voyageurs', ar: 'الدار البيضاء المسافرين' },
  ELJ: { lat: 33.23, lon: -8.5, en: 'El Jadida', fr: 'El Jadida', ar: 'الجديدة' },
  SET: { lat: 33.0, lon: -7.62, en: 'Settat', fr: 'Settat', ar: 'سطات' },
  BEN: { lat: 32.24, lon: -7.95, en: 'Benguerir', fr: 'Benguerir', ar: 'ابن جرير' },
  MAR: { lat: 31.63, lon: -8.01, en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' },
  SKA: { lat: 34.22, lon: -5.71, en: 'Sidi Kacem', fr: 'Sidi Kacem', ar: 'سيدي قاسم' },
  MEK: { lat: 33.89, lon: -5.55, en: 'Meknes', fr: 'Meknès', ar: 'مكناس' },
  FES: { lat: 34.05, lon: -5.0, en: 'Fes', fr: 'Fès', ar: 'فاس' },
  TAZ: { lat: 34.21, lon: -4.01, en: 'Taza', fr: 'Taza', ar: 'تازة' },
  OUJ: { lat: 34.68, lon: -1.91, en: 'Oujda', fr: 'Oujda', ar: 'وجدة' },
};

// Track segments to draw. `hs` = high-speed line.
export const TRACKS = [
  ['TNG', 'KEN', 'hs'],
  ['KEN', 'RBV'], ['RBV', 'RBA'], ['RBA', 'MOH'], ['MOH', 'CAV'],
  ['CAV', 'ELJ'], ['CAV', 'SET'], ['SET', 'BEN'], ['BEN', 'MAR'],
  ['KEN', 'SKA'], ['SKA', 'MEK'], ['MEK', 'FES'], ['FES', 'TAZ'], ['TAZ', 'OUJ'],
];

// Service patterns: stops with minute offsets from origin, first/last departure, headway.
const SERVICES = [
  { type: 'boraq', prefix: 6, stops: [['TNG', 0], ['KEN', 47], ['RBA', 80], ['CAV', 130]], first: 360, last: 1260, every: 60 },
  { type: 'tnr', prefix: 1, stops: [['KEN', 0], ['RBV', 28], ['RBA', 34], ['MOH', 72], ['CAV', 96]], first: 330, last: 1320, every: 30 },
  { type: 'tnr', prefix: 1, stops: [['CAV', 0], ['ELJ', 82]], first: 360, last: 1260, every: 60, offset: 20 },
  { type: 'atlas', prefix: 2, stops: [['CAV', 0], ['SET', 45], ['BEN', 95], ['MAR', 160]], first: 360, last: 1200, every: 120 },
  { type: 'atlas', prefix: 2, stops: [['CAV', 0], ['MOH', 22], ['RBA', 58], ['RBV', 64], ['KEN', 95], ['SKA', 130], ['MEK', 170], ['FES', 210]], first: 375, last: 1215, every: 120 },
  { type: 'atlas', prefix: 3, stops: [['FES', 0], ['TAZ', 110], ['OUJ', 330]], first: 390, last: 1050, every: 330 },
  { type: 'night', prefix: 8, stops: [['MAR', 0], ['BEN', 70], ['SET', 125], ['CAV', 175], ['RBA', 235], ['KEN', 275], ['TNG', 560]], first: 1260, last: 1260, every: 999 },
];

const hash = (n) => { let h = 2166136261; for (const c of String(n)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const toRad = Math.PI / 180;
export const km = (a, b) => {
  const A = STATIONS[a], B = STATIONS[b];
  const dLat = (B.lat - A.lat) * toRad, dLon = (B.lon - A.lon) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(A.lat * toRad) * Math.cos(B.lat * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h)) * 1.18; // rail is longer than straight line
};

/** All runs for a given day offset (0 = today). Times are minutes from today's midnight. */
function runsFor(day) {
  const out = [];
  SERVICES.forEach((s, si) => {
    [false, true].forEach((rev) => {
      const total = s.stops[s.stops.length - 1][1];
      const stops = rev ? s.stops.slice().reverse().map(([c, m]) => [c, total - m]) : s.stops;
      let k = 0;
      const shift = rev && s.every < 999 ? Math.round(s.every / 2) : 0;
      for (let dep = s.first + (s.offset || 0) + shift; dep <= s.last + (s.offset || 0) + shift; dep += s.every, k++) {
        const no = `${s.prefix}${String((si * 7 + k * 2 + (rev ? 1 : 0)) % 100).padStart(2, '0')}${rev ? 1 : 0}`.slice(0, 4);
        const hsh = hash(no + day);
        const delay = [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 10][hsh % 12];
        out.push({ id: `${no}-${day}-${dep}`, no, type: s.type, stops, dep: dep + day * 1440, delay, platform: 1 + (hsh >> 5) % 6 });
      }
    });
  });
  return out;
}
let cache = { key: null, runs: [] };
function allRuns(now) {
  const key = Math.floor(now / 1440);
  if (cache.key !== key) cache = { key, runs: [...runsFor(key - 1), ...runsFor(key), ...runsFor(key + 1)] };
  return cache.runs;
}

/** Minutes since midnight in Morocco (Africa/Casablanca), with seconds as fraction. */
export function moroccoNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Casablanca', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date);
  const g = (t) => +parts.find((p) => p.type === t).value;
  return (g('hour') % 24) * 60 + g('minute') + g('second') / 60;
}
export const fmt = (m) => {
  const mm = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
};

/** Live state of every train on the network at time `now` (minutes, may include day offsets). */
export function trainsAt(now) {
  const res = [];
  for (const r of allRuns(now)) {
    const rel = now - (r.dep + r.delay);
    const total = r.stops[r.stops.length - 1][1];
    if (rel < -12 || rel > total + 3) continue;
    let seg = 0;
    while (seg < r.stops.length - 2 && rel > r.stops[seg + 1][1]) seg++;
    const [a, ta] = r.stops[seg], [b, tb] = r.stops[seg + 1];
    const f = Math.min(Math.max((rel - ta) / (tb - ta), 0), 1);
    const A = STATIONS[a], B = STATIONS[b];
    const segKm = km(a, b), segMin = tb - ta;
    let status, speed = 0;
    if (rel < 0) status = rel > -8 ? 'boarding' : 'scheduled';
    else if (rel >= total) status = 'arrived';
    else {
      const ease = Math.sin(f * Math.PI); // accelerate/brake around stations
      speed = Math.round((segKm / segMin) * 60 * (0.55 + ease * 0.7));
      if (r.type === 'boraq' && (a === 'TNG' || b === 'TNG')) speed = Math.min(320, Math.round(speed * 1.15));
      status = f > 0.85 ? 'arriving' : rel < 2 ? 'departed' : 'enroute';
    }
    const nextStop = rel < 0 ? r.stops[0][0] : b;
    res.push({
      ...r, rel, total, seg, f, from: r.stops[0][0], to: r.stops[r.stops.length - 1][0], a, b, status, speed,
      nextStop, eta: r.dep + r.delay + r.stops.find(([c]) => c === nextStop)[1],
      arr: r.dep + r.delay + total, progress: Math.min(Math.max(rel / total, 0), 1),
      lat: A.lat + (B.lat - A.lat) * (rel < 0 ? 0 : f), lon: A.lon + (B.lon - A.lon) * (rel < 0 ? 0 : f),
    });
  }
  return res;
}

/** Departures (or arrivals) at a station within the next `hours`. */
export function boardFor(code, now, { mode = 'dep', hours = 6, limit = 10 } = {}) {
  const rows = [];
  for (const r of allRuns(now)) {
    const idx = r.stops.findIndex(([c]) => c === code);
    if (idx < 0) continue;
    if (mode === 'dep' && idx === r.stops.length - 1) continue;
    if (mode === 'arr' && idx === 0) continue;
    const sched = r.dep + r.stops[idx][1];
    const actual = sched + r.delay;
    const until = actual - now;
    if (until < -2 || until > hours * 60) continue;
    const other = mode === 'dep' ? r.stops[r.stops.length - 1][0] : r.stops[0][0];
    const via = r.stops.slice(mode === 'dep' ? idx + 1 : 1, mode === 'dep' ? -1 : idx).map(([c]) => c);
    let status;
    if (mode === 'dep') status = until < 0 ? 'departed' : until <= 5 ? 'boarding' : r.delay ? 'late' : until <= 15 ? 'in' : 'ontime';
    else status = until < 0 ? 'arrived' : until <= 5 ? 'arriving' : r.delay ? 'late' : 'ontime';
    rows.push({ ...r, sched, actual, until, other, via, status });
  }
  return rows.sort((x, y) => x.actual - y.actual).slice(0, limit);
}

/** Next trains between two stations (for booking). */
export function journeys(from, to, now, limit = 6) {
  const out = [];
  for (const r of allRuns(now)) {
    const i = r.stops.findIndex(([c]) => c === from), j = r.stops.findIndex(([c]) => c === to);
    if (i < 0 || j < 0 || j <= i) continue;
    const dep = r.dep + r.stops[i][1] + r.delay;
    if (dep < now - 1) continue;
    const dur = r.stops[j][1] - r.stops[i][1];
    let dist = 0;
    for (let k = i; k < j; k++) dist += km(r.stops[k][0], r.stops[k + 1][0]);
    out.push({ ...r, depAt: dep, arrAt: dep + dur, dur, dist });
  }
  return out.sort((a, b) => a.depAt - b.depAt).slice(0, limit);
}

export function networkStats(now) {
  const t = trainsAt(now).filter((x) => x.rel >= 0 && x.rel < x.total);
  const late = t.filter((x) => x.delay > 0).length;
  // sample passengers count that grows through the day
  const m = ((now % 1440) + 1440) % 1440;
  const pax = Math.round(118000 * Math.min(1, Math.max(0, (m - 300) / 1080)) ** 0.9);
  return { running: t.length, late, ontime: t.length - late, pct: t.length ? Math.round(((t.length - late) / t.length) * 100) : 100, pax };
}

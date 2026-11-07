# ONCF — 3D website redesign concept

An **unofficial** redesign concept for ONCF, Morocco's national railway, by Imuneeess.
Not affiliated with or endorsed by ONCF. Schedules, fares, durations and figures are **sample data**, and the train is a stylized original 3D model, not the real trainset.

**Live:** https://oncf-redesign-concept.vercel.app

Theme: **"Grande Vitesse"** (dark, cinematic speed) + **"Gare"** (split-flap station boards).
Plain HTML, CSS and JavaScript with [Three.js](https://threejs.org) from a CDN. No build step.

## Pages

| Page | What's animated |
| --- | --- |
| `index.html` | High-speed train in a tunnel of light streaks, speed counter that climbs with scroll, flip-board "next departure" and stats |
| `al-boraq.html` | Showroom: drag to spin the train on a glowing turntable, spec counters, travel classes |
| `horaires.html` | Full split-flap departures board with station filters, delays and a live clock |
| `reserver.html` | Booking form with sample fares and discount cards; a 3D machine prints your concept e-ticket |
| `contact.html` | Flip-board greeting (Bonjour / Marhba / Azul / Hello), form that speeds up the background train |

## Run locally

```bash
python3 -m http.server 5175
```

Then open http://localhost:5175.

## Customize

- `--accent` in `css/style.css` and `ACCENT` in `js/scenes/common.js` are **placeholders**: set them to the official ONCF color.
- Timetable data: `TRAINS` in `js/scenes/horaires.js`. Fares: `js/scenes/reserver.js`.
- Split-flap text anywhere: `<span class="flap" data-flap="TEXT"></span>` or `data-flap-cycle="A|B|C"`.

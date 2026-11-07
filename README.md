# ONCF — 3D website redesign concept

An **unofficial** redesign concept for ONCF, Morocco's national railway, by Imuneeess.
Not affiliated with or endorsed by ONCF. Schedules, fares, durations and figures are **sample data**, and the train is a stylized original 3D model, not the real trainset.

**Live:** https://oncf-redesign-concept.vercel.app

Theme: **"Grande Vitesse"** (dark, cinematic speed) + **"Gare"** (split-flap station boards).
Plain HTML, CSS and JavaScript with [Three.js](https://threejs.org) from a CDN. No build step.

## Languages

English, French and Arabic, with a switcher in the nav (EN / FR / ع). Arabic switches the layout to right-to-left with an Arabic font, and split-flap boards flip whole words. The choice is remembered in the browser. All text lives in `js/i18n-data.js`, which is generated from one source so every string has all three languages.

## Live system (simulated)

`js/live.js` generates a full day of sample services (Al Boraq, Al Atlas, TNR, night trains) on Casablanca time, then computes where every train is right now: position, speed, next stop, delay, platform and status (scheduled, boarding, departed, en route, arriving, arrived). Everything live on the site comes from it:

- a **ticker** of running trains at the bottom of every page
- **KPIs**: trains running, % on time, delayed, passengers today
- the **live map** (`js/netmap.js`): glowing lines, moving trains, click for details, time-lapse ×1 to ×180
- **departures/arrivals boards** for any station with countdowns, boarding and delays
- **journey search** on the booking page

## Pages

| Page | What's on it |
| --- | --- |
| `index.html` | Train rushes in through a tunnel of light, speed counter, live network map + KPIs + Casa board, scroll ride Tanger → Casa (clock, speed graph, stations lighting up), train types with live counts |
| `live.html` | Full live tracker: map, filters by train type, train list with progress, detail panel with every stop |
| `al-boraq.html` | 3D showroom on a turntable, specs, every Al Boraq on the line right now, travel classes |
| `horaires.html` | Split-flap board: departures/arrivals for any station, live countdowns, service alerts |
| `reserver.html` | Next trains between two stations with sample fares; pick one and a 3D machine prints the ticket |
| `contact.html` | Flip-board greeting, FAQ and form; typing speeds up the background train |

## Run locally

```bash
python3 -m http.server 5175
```

Then open http://localhost:5175.

## Customize

- `--accent` in `css/style.css` and `ACCENT` in `js/scenes/common.js` are **placeholders**: set them to the official ONCF color.
- Timetable data: `TRAINS` in `js/scenes/horaires.js`. Fares: `js/scenes/reserver.js`.
- Split-flap text anywhere: `<span class="flap" data-flap="TEXT"></span>` or `data-flap-cycle="A|B|C"`.

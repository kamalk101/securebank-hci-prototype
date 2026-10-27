# SecureBank prototype — study builds

Two standalone builds of the nine-screen banking prototype described in
`HCI_Project_Report.html`: a **good** design that applies the principles and a
**bad** design that deliberately violates them. Both share one dataset and one
study console, so the same tasks can be run on each and compared.

No framework, no build step, no CDN. Open the HTML file directly or serve the
folder.

```
prototype/
├── index.html              landing page linking both builds
├── build_prototype.py      regenerates good/ and bad/ from ../index.html
├── package_replit.py       builds dist/securebank-prototype-replit.zip
├── dist/                   generated upload archive (not committed normally)
├── assets/
│   ├── study.js            presenter console, annotations, tasks, SUS, logging
│   └── study.css           console, pins, drawer, print styles
├── good/                   open good/index.html
│   ├── index.html  app.css  app.js  study.css  study.js
├── bad/                    open bad/index.html
│   ├── index.html  app.css  app.js  study.css  study.js
└── docs/
    └── screen-map.md       screen → pattern → violation → report section
```

## Run

Directly:

```bash
xdg-open good/index.html      # or bad/index.html
```

Or over HTTP (recommended if a browser restricts local files):

```bash
python3 -m http.server 8765
# http://localhost:8765/good/index.html
# http://localhost:8765/bad/index.html
```

Both modes are tested; `localStorage` and downloads work from `file://` in
Chromium-based browsers.

## Rebuild the standalone copies

The single-variant builds are generated from the unified `../index.html` so
there is one source of truth for the interface:

```bash
cd hci-banking
.venv/bin/python prototype/build_prototype.py
```

The script removes the other variant, removes the version switch, injects
`window.SINGLE_VARIANT`, and copies `app.css`, `app.js`, `study.css`, and
`study.js` into each folder. Edit `app.js`, `index.html`, or `assets/study.*`,
then rebuild.

## Put it on Replit

Build a single upload-ready archive:

```bash
.venv/bin/python prototype/package_replit.py
# prototype/dist/securebank-prototype-replit.zip (about 3.5 MB)
```

The archive has `index.html` at its root, both builds, the docs, and a copy of
the report under `report/` (HTML, PDF, and screenshots) with the links
rewritten so they resolve inside the Repl. It also contains `REPLIT.md`.

On replit.com: **Create Repl → HTML, CSS, JS**, then drag *the contents* of the
unzipped folder into the Files pane so `index.html` sits at the root, and press
**Run**. Use **Deploy → Static** for a link that does not sleep. If you keep the
project in git, **Import from GitHub** is the cleaner route.

## Study console

Fixed bar at the bottom of each build.

| Control | What it does |
| --- | --- |
| Screen map 1–9 | jump to a screen; green dot = annotations available |
| Annotations | pins on the phone + numbered panel explaining each choice |
| Tasks | participant code, five tasks, start/done/skip, timings |
| SUS | ten standard statements, 1–5, score = ((odd−1)+(5−even))×2.5 |
| Data | live counts, JSON/CSV export, copy, clear |
| States | offline, timeout, biometric rejected, amount over balance, long names, skeleton, extra-large text |
| Clean | hides everything except the phone, for projection or screenshots |
| ? | shortcuts and the session protocol |

Keyboard: `1`–`9` screens, `←`/`→` step, `A` annotations, `C` clean,
`T` `S` `D` `E` panels, `R` restart, `?` help, `Esc` close.

`window.__demo` exposes the app (`go`, `back`, `state`, `toast`, `dialog`,
`recordTx`). `window.__study` exposes the console (`openPanel`, `toggleAnno`,
`toggleClean`, `edge`, `startTask`, `exportJson`, `exportCsv`, `state`).

## Shared dataset

Login is Ayesha Khan, current account •• 0023, opening balance
**PKR 245,780.50**. A completed transfer or bill payment:

1. debits the balance,
2. prepends a row to Home → Recent activity and History,
3. writes a reference in the form `SB-2026-######`,
4. dispatches `sb:tx`, which the task sheet and logger listen for.

History filters re-apply to newly recorded rows, so a search for "foodpanda"
does not leave an unrelated new payment visible.

## Instrumentation

Every event is stored in `localStorage` under `sb.study.v1` and exported with
the participant code in the filename.

```json
{ "t": "2026-10-27T16:20:11.912Z", "p": "P01", "mode": "good",
  "e": "screen", "step": 3, "name": "Send money" }
```

Event types:

| `e` | Extra fields |
| --- | --- |
| `session`, `screen` | `step`, `name` |
| `tap` | `step`, `tag`, `name`, `cls` |
| `error` | `step`, `message` |
| `tx` | `ref`, `kind`, `amount`, `balance` |
| `card` | `setting`, `value` |
| `task-start`, `task-done`, `task-skip` | `id`, `ms` |
| `sus` | `score`, `answers` |
| `annotation`, `panel`, `clean`, `edge`, `export`, `participant` | varies |

CSV columns: `timestamp, participant, variant, event, step, name, value`.

## Session protocol

1. Open one build; enter the participant code in Tasks.
2. Read each task aloud, then press **Start** before the participant begins.
3. Let them think aloud; do not point at the screen.
4. Mark done/skipped; note errors and hesitations.
5. Score the SUS.
6. Download JSON + CSV, then **Clear session log** before the next participant.

Run both builds with the same five tasks. Alternate which build is seen first
across participants to reduce order effects, and report task time, errors,
completion, and SUS side by side.

## Scope and limitations

- The phone frame is fixed at 390 × 844. A real app scrolls and reflows; text
  scaling uses the app's own Settings control (Standard / Large / Extra large).
- Network loss, session timeout, and skeletons are simulated locally; no
  request leaves the browser.
- The bad build does not implement recovery states on purpose. Only T1
  auto-completes there; mark the other tasks manually.
- Data is per browser profile. Clearing site data deletes the log, so export
  first.
- `app.js` and `app.css` are copied into both folders; keep the shared source
  in the parent directory and rebuild rather than editing the copies.

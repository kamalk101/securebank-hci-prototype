# Run this on Replit

This archive is the standalone copy. `index.html` at the root is the landing
page; `good/` and `bad/` are the two builds.

## Upload

1. Unzip the archive on your computer.
2. On replit.com choose **Create Repl** → **HTML, CSS, JS** (any static
   template works).
3. Open the **Files** pane and drag in *the contents* of the unzipped folder,
   not the folder itself, so that `index.html` sits at the Repl root.
   If your browser offers **Upload folder**, upload `good/`, `bad/`, `docs/`,
   `report/`, and the two loose files separately.
4. Press **Run**. The webview opens `index.html`; open it in a new tab if the
   preview is cramped.

GitHub is the alternative: commit the unzipped folder, then use
**Import from GitHub** when creating the Repl.

## Deploy a stable link

Use **Deploy → Static** in Replit to get a URL that does not sleep. The free
workspace preview sleeps after a period of inactivity and wakes on the next
visit, which is fine for a demo but awkward during a timed session.

## Session data

The console stores events in the browser under `sb.study.v1` and exports
JSON/CSV from the participant's device. When participants use their own
machines, the files stay with them: ask them to send the download back, or run
the sessions on one lab machine instead. In an embedded preview, downloads and
the clipboard may be blocked — open the build in its own tab first.

## What still works

Everything is client-side: no backend, no build step, no CDN. Annotations,
tasks, SUS, edge states, and exports all run in the browser.

# Claude Usage Cycle Tracker

A Progressive Web App (PWA) that tracks your Claude weekly usage cycle.

**Resets every Wednesday at 13:00 AWST (UTC+8)**

## Features

- Live second-by-second countdown
- Colour-coded progress (green → amber → red)
- Day-by-day breakdown with Wednesday 13:00 marker
- Works offline once installed
- Installable on iOS and Android home screen

## Files

```
index.html      ← entire app (no dependencies, no build step)
manifest.json   ← PWA metadata
sw.js           ← service worker (offline support)
icons/
  icon-192.png
  icon-512.png
```

## GitHub Pages Setup

1. Push all files to your repo (root or `docs/` folder)
2. Go to **Settings → Pages**
3. Set source to your branch (`main`) and folder (`/ (root)`)
4. Save — your app will be live at `https://<username>.github.io/<repo>/`

## Installing as a PWA

**iPhone/iPad:**
1. Open the GitHub Pages URL in Safari
2. Tap the Share button → **Add to Home Screen**
3. Tap Add

**Android:**
1. Open the URL in Chrome
2. Tap the three-dot menu → **Add to Home screen** (or install banner appears automatically)

## Updating

To update the app after making changes, bump the cache version in `sw.js`:
```js
const CACHE_NAME = "claude-cycle-v2"; // increment this
```

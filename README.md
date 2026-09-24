# Claude Usage Cycle Tracker

A Progressive Web App (PWA) that tracks your Claude weekly usage cycle.

**Default reset: Wednesday 13:00 AWST (UTC+8).** Change it in Settings (⚙).

## Features

- Live countdown; all times shown in your device's time zone
- Colour-coded pace, tuned for using the whole allowance (blue = ahead, green = on track, amber/orange/red = under-using)
- Day-by-day breakdown with a reset marker
- 5-hour session timer, with notifications and calendar reminders
- Delete any logged session (with Undo)
- Past cycles: how much of each week's allowance you used
- Sync between devices (free Supabase backend, no account: a private sync code)
- JSON export / import backup
- Works offline once installed; installable on iOS and Android

## Sync

Settings → *Turn on sync* creates a private code. On each other device, open
Settings and paste the code. Anyone holding the code can read and change that
data, so keep it to yourself. On iPhone the home-screen app has its own
storage apart from Safari, so paste the code inside the installed app.

Backend: table `usage_tracker_sync` in Supabase project `xlhqigvzwavidsiwojiy`,
reached only through the `tracker_pull` / `tracker_push` RPC functions.

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

The service worker serves the cached app instantly and fetches the new version
in the background, so a deploy shows up on the next launch. Bump `CACHE_NAME`
in `sw.js` only when you want old caches cleared.

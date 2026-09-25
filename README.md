# Claude Usage Cycle Tracker

Version 2.0 · last updated 2026-09-25

A Progressive Web App (PWA) that tracks your Claude weekly usage and helps you
use the whole allowance before it resets.

Live at `https://zstoimenov.github.io/claude-usage-tracker/`

**Default reset: Wednesday 13:00 AWST (UTC+8).** Change it in Settings (⚙).

## Features

- Live countdown; all times shown in your device's time zone
- Colour-coded pace, tuned for using the whole allowance:
  blue = ahead, green = on track, amber / orange / red = under-using
- Day-by-day breakdown with a reset marker
- Weekly Pace card: %/day required, recovery time, 5-hour slots left
- Check-ins at 07:30 and 19:30 with how much usage is still to go
- 5-hour session timer, with notifications and calendar reminders
  (Google Calendar or .ics)
- Session history: delete any entry, Undo after logging or deleting
- Past cycles: how much of each week's allowance you used
- End-to-end encrypted sync between devices (free, no account)
- JSON export / import backup
- Works offline once installed; installable on iOS and Android

## How the numbers work

| Number | Calculation |
|---|---|
| Weekly % | Your latest reading; resets to 0% at each weekly reset |
| Drift | Weekly % minus % of the week elapsed |
| Required %/day | (100 - weekly %) ÷ days left |
| Avg session value | Weekly % gained ÷ session % used, last 28 days, recent sessions weighted more (14-day half-life) |
| Slots left | 5-hour windows left before reset, within 07:30-21:30, after any running session |
| Sessions needed | (100 - weekly %) ÷ avg session value |
| Check-in "to go" | % of week elapsed at that time minus your current weekly % |

## Sync

### Setting up
1. On your **first device only**: Settings → *Start new sync*.
2. Settings → *Copy code*.
3. On each other device: Settings → paste the code → *Link*.
   Local data is merged in, never overwritten.

On iPhone the home-screen app has its own storage apart from Safari, so paste
the code inside the installed app. Opening a link or QR code only links Safari.

### Security
- **End-to-end encrypted.** From the sync code the app derives (HKDF-SHA256)
  a row id and an AES-256-GCM key. The code and key never leave your devices.
  The server stores only the row id and encrypted data, and rejects anything
  that isn't encrypted.
- **The code is the only key.** Anyone holding it can read and change your
  data, so keep it to your own devices.
- **Replace code:** Settings → *Replace code (if it leaked)* moves your data to
  a new code and revokes the old one. Devices on the old code unlink themselves
  (keeping their local data) and never learn the new code.
- **Abuse limits:** the server caps the table at 20 rows and 256 KB per row.

### What is public
| Item | Exposure |
|---|---|
| App code, Supabase URL, publishable key | Public (public repo). The key only reaches the 3 functions below |
| Your synced data | Encrypted; unreadable without the code, even to the database owner |
| Listing or guessing sync rows | Not possible: no direct table access, and codes are random 256-bit |

### Backend
Supabase project `xlhqigvzwavidsiwojiy` (free tier), table
`usage_tracker_sync` (row-level security on, no direct access). Reached only
through these RPC functions:

| Function | Does |
|---|---|
| `tracker_pull(code)` | Returns one row's encrypted data and revision |
| `tracker_push(code, data, rev)` | Saves encrypted data if the revision matches (conflict-safe) |
| `tracker_revoke(code)` | Wipes a row and marks it revoked |

Merging happens on the device: each field has a timestamp, sessions are
combined by id, and deletions are kept for 60 days so they don't come back.

## Files

```
index.html      ← entire app (no dependencies, no build step)
manifest.json   ← PWA metadata
sw.js           ← service worker (offline support, updates)
icons/
  icon-192.png
  icon-512.png
```

## GitHub Pages Setup

1. Push all files to your repo (root or `docs/` folder)
2. Go to **Settings → Pages**
3. Set source to your branch (`main`) and folder (`/ (root)`)
4. Save. The app will be live at `https://<username>.github.io/<repo>/`

## Installing as a PWA

**iPhone/iPad:**
1. Open the GitHub Pages URL in Safari
2. Tap the Share button → **Add to Home Screen**
3. Tap Add

**Android:**
1. Open the URL in Chrome
2. Tap the three-dot menu → **Add to Home screen** (or install banner appears automatically)

## Updating

The service worker shows the cached app instantly and downloads the new
version in the background. A deploy therefore appears on the **second** open
after it goes live: the first open fetches it, the next one runs it.

To force it on a phone: fully close the app (swipe it away in the app
switcher) and open it again, twice.

Bump `CACHE_NAME` in `sw.js` only when you want old caches cleared.

## Changelog

- **2.0** (2026-09-25): device sync (end-to-end encrypted), per-entry delete
  with Undo, local time zone and configurable reset, weekly % resets with the
  cycle, past cycles, pacing fixes, check-in "to go", calendar reminders,
  JSON backup, automatic background updates.
- **1.x**: weekly cycle tracker, pace card, session timer, notifications.

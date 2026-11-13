# Claude Usage Cycle Tracker

Version 3.0 · last updated 2026-11-13

A Progressive Web App (PWA) that tracks your Claude weekly usage and helps you
use the whole allowance before it resets.

Live at `https://zstoimenov.github.io/claude-usage-tracker/`

**Default reset: Wednesday 13:00 AWST (UTC+8).** Change it in Settings (⚙).

## Features

- Built on Zak's App Design System: Geologica and Onest type, lime accent on
  the one main action, dark and light themes (Settings → Appearance; follows
  the device by default)

- Free pass planner: add a pass with its expiry (Settings → Free pass); the
  app suggests the week and time to use it for the most extra usage, with
  calendar reminders and an "I used it now" button
- Live countdown; all times shown in your device's time zone
- Main number: % of the week elapsed, coloured by pace
  (blue = ahead, green = on track, amber / orange / red = under-using)
- Burn-up chart: every weekly reading (spot checks, session starts, logged
  sessions) against the target line, nights shaded,
  with a projection to the reset
- Next session target: how much of your next 5-hour session to use to be back
  on the target line when it ends
- Pace gap in %, clock time and sessions
- Sessions to 100%: slots left before reset, by day, with the ones you need filled
- Check-ins (default 07:30 and 19:30): target %, countdown and how much usage
  is still to go. The next one is tinted by status (amber to go, blue ahead,
  teal on pace) and shows "Due soon" with a pulsing dot in its last hour
- Tap "% used" to update your weekly % in place (the + button still works)
- "Today" line: sessions needed to be on track by the end of your day
- Status and gap show ▲ / ● / ▼ as well as colour
- Tap the chart to read a reading or the target at any time
- "Remind me then" adds a calendar reminder for when a rest ends
- Past cycles trend: one bar per week
- Settings → Your day: day start and end (usual session times) and check-in times
- App icon shortcuts (long-press): Update usage, Start session
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
| Target line | % of the week elapsed (straight line from 0% at reset to 100% at the next) |
| Pace gap | Weekly % minus % of the week elapsed |
| Gap as time | Gap % × 1.68 h (1% of a week) |
| Gap as sessions | Gap % ÷ avg session value |
| Avg session value | Weekly % gained ÷ session % used, last 28 days, recent sessions weighted more (14-day half-life) |
| Slots left | A guide: 5-hour windows that still fit before reset within 06:00-21:00, counted from now (or after a running session). Later days show the usual 06:00, 11:00, 16:00; sessions can start any time |
| Sessions to 100% | (100 - weekly %) ÷ avg session value |
| Next session target | (target at the session's end - weekly %) ÷ avg session value. Assumes you start now; when ahead, when the target line catches up (the rest time). Not tied to any slot. A running session is measured from its starting reading. Over 100% it shows how many sessions to max out |
| Projection | Average rate so far, extended from the latest reading to the reset |
| Check-in "to go" | % of week elapsed at that time minus your current weekly % |
| Free pass: best time | In a week, the latest session slot (before expiry) that still leaves enough slots before the reset to use another 100% (100 ÷ avg session value). In the current week, sooner if your pace hits 100% first, or now if you are at 100% |
| Free pass: extra | (usage before the pass, up to 100%) + (usage after, up to 100%) - (usage without a pass, up to 100%), from slots left × avg session value |
| Free pass: week | The week you tap. Until then: this week if you are at 100%, else the latest week before expiry that still gets the full extra |
| Target with a pass | Planned week: 0% at the reset to 100% at the pass, then 0% to 100% at the reset. After using it: 0% at the pass to 100% at the reset. Pace, gap, check-ins and next session follow this line |
| Week total with a pass | Usage before the pass + usage after, capped at 100% |

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
| App code, sync server URL | Public (public repo). The URL only reaches the 3 functions below |
| Your synced data | Encrypted; unreadable without the code, even to the database owner |
| Listing or guessing sync rows | Not possible: no direct table access, and codes are random 256-bit |

### Backend
Su### Backend
A Neon project (free tier, Singapore) holds table `usage_tracker_sync`. The
browser never talks to the database: a small Neon Function (`neon/index.mjs`,
no dependencies) answers `POST /rpc/<name>` and runs one of three SQL
functions (`neon/schema.sql`). It only answers browser calls from the GitHub
Pages site and refuses bodies over 300 KB.

| Function | Does |
|---|---|
| `tracker_pull(code)` | Returns one row's encrypted data and revision |
| `tracker_push(code, data, rev)` | Saves encrypted data if the revision matches (conflict-safe) |
| `tracker_revoke(code)` | Wipes a row and marks it revoked |

Neon's free tier suspends the database when idle and wakes it on the next
request, so it never pauses for good and needs no keep-alive. Moved from
Supabase on 2026-10-11; each device re-uploads its own data on its first sync
after the update.

To redeploy the function: zip `neon/index.mjs` on its own and deploy it as
slug `sync` (Neon CLI: `neon functions deploy sync --src neon/index.mjs
--no-bundle`). Tests: `cd neon && npm i && node test.mjs` (needs a local
Postgres with `schema.sql` loaded; see the top of `test.mjs`).

s on the device: each field has a timestamp, sessions are
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

- **3.1.3** (2026-11-13): "Session ended" bar redone: one row with status,
  details and a "Log now" button, amber border and pulsing dot, no full
  progress bar. "Active session" in sentence case.
- **3.1.2** (2026-11-13): end-of-session form: title in sentence case
  ("Log session"), tapping a label focuses its input, even spacing above the button.
- **3.1.1** (2026-11-13): Log session form tidied on phones. The three inputs
  stay level when a label wraps, values are centred, labels in sentence case,
  and the Log session button is full width below the preview like the other tabs.
- **3.1** (2026-11-13): check-ins easier to spot. Bigger target %, countdown
  ("in 3h 12m"), the next check-in tinted by status with a coloured edge,
  "Due soon" state with a pulsing dot within 60 minutes (no animation with
  reduced motion).
- **3.0** (2026-11-13): redesign on Zak's App Design System. New type
  (Geologica, Onest), lit cards, lime "Update usage" button, dark and light
  themes with a setting, status shown as a badge (ahead blue, on track teal,
  behind amber, under-using and critical red), neutral chart, Free pass week
  picker as a segmented control, History and Settings as full screens.
- **2.9** (2026-11-13): free pass planner. Add a pass with its expiry; the
  app shows the best week and time to use it and the extra you would get,
  lets you pick the week, adds calendar reminders (best time, a day before
  expiry), notifies you in the app at the best time, and resets weekly % to
  0 when you use it. The target line, pace and session counts follow the
  plan; past cycles cap a pass week at 100% and mark it.
- **2.8** (2026-11-11): plainer wording on Next session, Pace gap and Sessions
  to 100%; session counts are capped at what still fits ("out of reach"
  instead of impossible numbers); slots shown as one compact strip, a column
  per day with the start times.
- **2.7** (2026-10-27): number fields no longer show the browser's up/down
  arrows on desktop.
- **2.6** (2026-10-11): sync moved from Supabase to a Neon Function. Same
  encryption and codes; nothing to re-link.
- **2.5** (2026-09-28): tap-to-update usage, Today line, arrows on status,
  chart tap values, rest reminder, past-weeks trend, Your day settings,
  app icon shortcuts.
- **2.4** (2026-09-28): usual session times 06:00, 11:00 and 16:00 shown as a guide; next session and rest time are not tied to slots.
- **2.3** (2026-09-27): main screen fills the whole screen on any device and
  scales with it; on wide screens (iPad landscape, desktop) the chart gets
  its own column.
- **2.2** (2026-09-27): compact main screen that fits a phone without
  scrolling; check-ins pinned under the main number; explanations moved
  behind "i" buttons.
- **2.1** (2026-09-27): redesigned main screen: burn-up chart, next session
  target, pace gap in %, time and sessions, slot grid by day, check-in tiles.
  Removed the day grid, drift card and %/day figures. Spot checks and
  session-start readings are now stored (15 days, synced) for the chart.
- **2.0** (2026-09-25): device sync (end-to-end encrypted), per-entry delete
  with Undo, local time zone and configurable reset, weekly % resets with the
  cycle, past cycles, pacing fixes, check-in "to go", calendar reminders,
  JSON backup, automatic background updates.
- **1.x**: weekly cycle tracker, pace card, session timer, notifications.

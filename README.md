# ✈️ Flight Mode Prep

**Never board a plane with a Steam Deck full of games that won't launch.**

One tap before you leave, and Flight Mode Prep tells you:

- 🔋 **Battery** — current charge, and a nudge to top up if you're under 80%
- 💾 **Free storage** — room for that one last download
- ⚠️ **Updates pending** — games that will demand an update screen right when you have no internet
- 🌐 **Needs internet** — installed games that simply won't work offline (Destiny 2, CS2, Apex...)
- ✅ **Ready to fly** — how many games are actually good to go

## How to use

1. Open the Quick Access menu (··· button) → Decky → **Flight Mode Prep**
2. Tap **Run Preflight Check**
3. Update or ditch anything flagged, charge up, and enjoy your flight 🛫

## Installation

Not on the Decky store yet. To sideload:

1. Enable Developer Mode in Decky settings
2. Build the plugin (see below) and copy the folder to `homebrew/plugins/` on your Deck

## Roadmap

- Detect single-player games with online DRM via ProtonDB/community data
- "Force offline-mode readiness" step (make Steam confirm offline login works)
- One-tap "disable background downloads" toggle

<details>
<summary>🛠 For developers</summary>

Standard Decky plugin layout: Python backend (`main.py`) + React frontend (`src/index.tsx`).

```bash
npm install   # or pnpm i
npm run build # outputs dist/index.js
```

The backend reads `appmanifest_*.acf` files from all Steam library folders
(internal + SD card via `libraryfolders.vdf`), battery state from
`/sys/class/power_supply/BAT*`, and probes connectivity with a 2s TCP dial.

Online-only titles are currently a curated appid list in `main.py`
(`ONLINE_ONLY_APPIDS`) — PRs welcome.

</details>

## License

MIT

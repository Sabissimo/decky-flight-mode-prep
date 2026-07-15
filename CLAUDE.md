# Flight Mode Prep

Decky Loader (Steam Deck) plugin: one-tap preflight check before going offline — battery level, free storage, games with pending updates, and installed games that won't work without internet.

## Commands

```bash
npm ci                        # install (npm, not pnpm; lockfile is package-lock.json)
npm run build                 # rollup: src/index.tsx -> dist/index.js
python3 -m py_compile main.py # backend syntax check (no test suite yet)
```

CI (`.github/workflows/build.yml`) runs the build + syntax check on push/PR, assembles the plugin zip, uploads it as an artifact, and attaches it to a Release on `v*` tags.

## Architecture

- `main.py` — backend, pure stdlib. Enumerates Steam libraries via `libraryfolders.vdf` (internal + SD card), parses `appmanifest_*.acf` for installed games and update state, reads battery from `/sys/class/power_supply/BAT*`, probes connectivity with a 2s TCP dial. Online-only titles are a curated appid list (`ONLINE_ONLY_APPIDS`).
- `src/index.tsx` — the whole frontend (QAM panel).

## Status and known risks

Never run on real hardware yet. Riskiest assumptions to verify on-Deck first:

- Update detection is a heuristic on ACF `StateFlags`/`BytesToDownload` — unverified against a real pending update.
- Battery sysfs path naming on the Deck (`BAT0` vs `BAT1`).

## Releasing

Bump the version in `package.json`, push, then tag `v*` and push the tag separately (a tag pushed together with the branch may not trigger CI).

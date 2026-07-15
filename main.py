import glob
import os
import re
import shutil
import socket

import decky

# The backend runs as root under Decky, so expanduser("~") is /root and
# every library scan silently finds nothing. Decky provides the real home.
USER_HOME = (
    getattr(decky, "DECKY_USER_HOME", None)
    or getattr(decky, "HOME", None)
    or "/home/deck"
)
STEAM_ROOT = os.path.join(USER_HOME, ".local", "share", "Steam")

# StateFlags is a BITMASK, not an enum: bit 4 = fully installed,
# bit 2 = update required. Transient extra bits are normal on a healthy
# install, so equality checks against 4 misflag ready games.
STATE_FULLY_INSTALLED = 4
STATE_UPDATE_REQUIRED = 2

# Titles that require a connection even for solo play — flagged so they don't
# end up as someone's only plan for a long flight.
ONLINE_ONLY_APPIDS = {
    570,      # Dota 2
    730,      # Counter-Strike 2
    440,      # Team Fortress 2
    578080,   # PUBG: Battlegrounds
    1085660,  # Destiny 2
    1172470,  # Apex Legends
    1097150,  # Fall Guys
    2357570,  # Overwatch 2
    2767030,  # Marvel Rivals
    1938090,  # Call of Duty
}

# Runtime/tool appmanifests that aren't games
SKIP_NAME_PREFIXES = ("Proton", "Steam Linux Runtime", "Steamworks Common")


def _acf_value(text: str, key: str):
    m = re.search(r'"%s"\s+"([^"]*)"' % re.escape(key), text)
    return m.group(1) if m else None


def _library_paths():
    paths = [os.path.join(STEAM_ROOT, "steamapps")]
    vdf = os.path.join(STEAM_ROOT, "steamapps", "libraryfolders.vdf")
    try:
        with open(vdf, "r", encoding="utf-8", errors="replace") as f:
            for p in re.findall(r'"path"\s+"([^"]+)"', f.read()):
                sp = os.path.join(p, "steamapps")
                if os.path.isdir(sp) and sp not in paths:
                    paths.append(sp)
    except OSError:
        pass
    return paths


def _battery():
    for bat in sorted(glob.glob("/sys/class/power_supply/BAT*")):
        try:
            with open(os.path.join(bat, "capacity")) as f:
                percent = int(f.read().strip())
            with open(os.path.join(bat, "status")) as f:
                status = f.read().strip()
            return {"percent": percent, "charging": status in ("Charging", "Full")}
        except (OSError, ValueError):
            continue
    return {"percent": None, "charging": False}


class Plugin:
    async def get_status(self):
        disk = shutil.disk_usage(USER_HOME)
        online = True
        try:
            socket.create_connection(("1.1.1.1", 53), timeout=2).close()
        except OSError:
            online = False
        return {
            "battery": _battery(),
            "free_gb": round(disk.free / 1024 ** 3, 1),
            "online": online,
        }

    async def get_games(self):
        games = []
        for lib in _library_paths():
            for acf in glob.glob(os.path.join(lib, "appmanifest_*.acf")):
                try:
                    with open(acf, "r", encoding="utf-8", errors="replace") as f:
                        text = f.read()
                except OSError:
                    continue
                name = _acf_value(text, "name") or ""
                if not name or name.startswith(SKIP_NAME_PREFIXES):
                    continue
                appid = int(_acf_value(text, "appid") or 0)
                state = int(_acf_value(text, "StateFlags") or 0)
                to_download = int(_acf_value(text, "BytesToDownload") or 0)
                downloaded = int(_acf_value(text, "BytesDownloaded") or 0)
                games.append({
                    "appid": appid,
                    "name": name,
                    "update_pending": not (state & STATE_FULLY_INSTALLED)
                    or bool(state & STATE_UPDATE_REQUIRED)
                    or (to_download > 0 and downloaded < to_download),
                    "online_only": appid in ONLINE_ONLY_APPIDS,
                })
        games.sort(key=lambda g: g["name"].lower())
        return games

    async def _main(self):
        decky.logger.info("Flight Mode Prep loaded")

    async def _unload(self):
        decky.logger.info("Flight Mode Prep unloaded")

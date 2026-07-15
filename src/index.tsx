import {
  ButtonItem,
  Field,
  PanelSection,
  PanelSectionRow,
  staticClasses,
} from "@decky/ui";
import { callable, definePlugin } from "@decky/api";
import { useState } from "react";
import { FaPlaneDeparture } from "react-icons/fa";

interface Status {
  battery: { percent: number | null; charging: boolean };
  free_gb: number;
  online: boolean;
}

interface Game {
  appid: number;
  name: string;
  update_pending: boolean;
  online_only: boolean;
}

const getStatus = callable<[], Status>("get_status");
const getGames = callable<[], Game[]>("get_games");

function Content() {
  const [status, setStatus] = useState<Status | null>(null);
  const [games, setGames] = useState<Game[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await getStatus());
      setGames(await getGames());
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const needsUpdate = games?.filter((g) => g.update_pending) ?? [];
  const onlineOnly =
    games?.filter((g) => g.online_only && !g.update_pending) ?? [];
  const ready =
    games?.filter((g) => !g.update_pending && !g.online_only) ?? [];

  const batteryWarn =
    status?.battery.percent != null &&
    status.battery.percent < 80 &&
    !status.battery.charging;

  return (
    <>
      <PanelSection title="Preflight Check">
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={runCheck} disabled={busy}>
            {busy ? "Checking..." : "Run Preflight Check"}
          </ButtonItem>
        </PanelSectionRow>
        {error && (
          <PanelSectionRow>
            <Field label="Error">{error}</Field>
          </PanelSectionRow>
        )}
        {status && (
          <>
            <PanelSectionRow>
              <Field label="Battery">
                {status.battery.percent != null
                  ? `${status.battery.percent}%` +
                    (status.battery.charging ? " ⚡ charging" : "") +
                    (batteryWarn ? " — consider topping up" : "")
                  : "unknown"}
              </Field>
            </PanelSectionRow>
            <PanelSectionRow>
              <Field label="Free storage">{status.free_gb} GB</Field>
            </PanelSectionRow>
            <PanelSectionRow>
              <Field label="Network">
                {status.online
                  ? "Online — updates can still be fetched"
                  : "Offline"}
              </Field>
            </PanelSectionRow>
          </>
        )}
      </PanelSection>

      {games && needsUpdate.length > 0 && (
        <PanelSection title={`⚠ Updates pending (${needsUpdate.length})`}>
          {needsUpdate.map((g) => (
            <PanelSectionRow key={g.appid}>
              <Field label={g.name}>not flight-ready</Field>
            </PanelSectionRow>
          ))}
        </PanelSection>
      )}

      {games && onlineOnly.length > 0 && (
        <PanelSection title={`🌐 Needs internet (${onlineOnly.length})`}>
          {onlineOnly.map((g) => (
            <PanelSectionRow key={g.appid}>
              <Field label={g.name}>won't work offline</Field>
            </PanelSectionRow>
          ))}
        </PanelSection>
      )}

      {games && games.length === 0 && (
        <PanelSection title="⚠ No games found">
          <PanelSectionRow>
            <div style={{ fontSize: "0.9em" }}>
              The Steam library scan came back empty — that usually means the
              scan failed, not that you own no games. Check
              homebrew/logs/Flight Mode Prep on the Deck.
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}
      {games && games.length > 0 && (
        <PanelSection title="Ready to fly">
          <PanelSectionRow>
            <Field label="Games good to go">{ready.length}</Field>
          </PanelSectionRow>
        </PanelSection>
      )}
    </>
  );
}

export default definePlugin(() => ({
  name: "Flight Mode Prep",
  titleView: <div className={staticClasses.Title}>Flight Mode Prep</div>,
  content: <Content />,
  icon: <FaPlaneDeparture />,
}));

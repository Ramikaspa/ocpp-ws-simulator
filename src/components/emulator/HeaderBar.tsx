"use client";

import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Blocks,
  ExternalLink,
  Loader2,
  LogOut,
  Power,
  PowerOff,
  RefreshCw,
  Settings,
  WifiOff,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/emulator/AuthGate";
import { LocalhostGuideDialog } from "@/components/emulator/LocalhostGuideDialog";
import { ShortcutsDialog } from "@/components/emulator/ShortcutsDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useActiveCharger } from "@/hooks/useActiveCharger";
import { cn } from "@/lib/utils";
import type { ConnectionStatus, EmulatorConfig } from "@/store/emulatorStore";
import { IconButton, OptionSelect } from "./kit";

const GITHUB_URL = "https://github.com/rohittiwari-dev/ocpp-ws-simulator";
const ECOSYSTEM_URL = "https://ocpp-ws-io.rohittiwari.me/";

/* ── Status config ── */
type StCfg = { dot: string; text: string; label: string };
const ST: Record<ConnectionStatus, StCfg> = {
  connected: { dot: "bg-success", text: "text-success", label: "Connected" },
  connecting: { dot: "bg-warning", text: "text-warning", label: "Connecting" },
  faulted: { dot: "bg-danger", text: "text-danger", label: "Faulted" },
  disconnected: {
    dot: "bg-t-muted",
    text: "text-t-secondary",
    label: "Disconnected",
  },
};

const VERSIONS: { label: string; value: EmulatorConfig["ocppVersion"] }[] = [
  { label: "OCPP 1.6J", value: "ocpp1.6" },
  { label: "OCPP 2.0.1", value: "ocpp2.0.1" },
  { label: "OCPP 2.1", value: "ocpp2.1" },
];

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

/* ── Header ── */
export function HeaderBar({ onSettingsOpen }: { onSettingsOpen: () => void }) {
  const { status, config, connectedAt, updateConfig, offlineMode } =
    useActiveCharger();
  const auth = useAuth();
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const st = ST[status];
  const vLocked = isConnected || isConnecting;

  const [uptime, setUptime] = useState("");
  useEffect(() => {
    if (!connectedAt) {
      setUptime("");
      return;
    }
    const tick = () => setUptime(formatUptime(Date.now() - connectedAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [connectedAt]);

  const runService = (fn: (svc: any) => void) =>
    import("@/lib/ocppClient").then(({ ocppService }) => fn(ocppService)); // proxy auto-routes to active charger

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center px-4 gap-3 bg-surface-card border-b border-b-subtle">
      {/* ── Brand ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="size-8 rounded-lg flex items-center justify-center overflow-hidden bg-brand-subtle border border-brand/30 shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            className="size-5"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hdr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
            </defs>
            <path
              d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"
              fill="url(#hdr-grad)"
              opacity="0.15"
            />
            <path
              d="M50 10 A 40 40 0 1 0 90 50"
              fill="none"
              stroke="url(#hdr-grad)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="90" cy="50" r="8" fill="#7C3AED" />
            <circle cx="50" cy="10" r="8" fill="#C084FC" />
            <path
              d="M55 22 L32 55 L48 55 L42 82 L72 45 L52 45 Z"
              fill="url(#hdr-grad)"
            />
          </svg>
        </div>
        <h1 className="text-sm font-semibold text-t-primary tracking-tight sr-only sm:not-sr-only">
          OCPP WS Simulator
        </h1>
      </div>

      <div
        className="h-6 w-px bg-b-strong shrink-0 hidden sm:block"
        aria-hidden="true"
      />

      {/* ── Endpoint (opens connection settings) ── */}
      <Button
        variant="neutral"
        size="sm"
        onClick={onSettingsOpen}
        title="Edit connection settings"
        className="hidden md:flex min-w-0 max-w-sm bg-surface-inset font-normal"
      >
        <span className="sr-only">Connection settings: </span>
        <span className="text-xs font-mono text-t-secondary truncate">
          {config.endpoint}/
          <span className="text-brand-strong">{config.chargePointId}</span>
        </span>
      </Button>

      {/* ── OCPP Version ── */}
      <div
        className="w-32 shrink-0"
        title={
          vLocked ? "Disconnect first to change the OCPP version" : undefined
        }
      >
        <OptionSelect
          size="sm"
          aria-label="OCPP version"
          value={config.ocppVersion}
          options={VERSIONS}
          disabled={vLocked}
          onChange={(v) => updateConfig({ ocppVersion: v })}
          className="font-mono"
        />
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Connection status (announced to screen readers) ── */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <span
          className={cn("size-2 rounded-full shrink-0", st.dot)}
          aria-hidden="true"
        />
        <span role="status" className={cn("text-xs font-semibold", st.text)}>
          {st.label}
          {offlineMode && isConnected ? " (simulated offline)" : ""}
        </span>
        {uptime && (
          <span
            className="text-2xs font-mono text-t-secondary bg-surface-inset border border-b-strong rounded px-1.5 py-0.5"
            title="Time since connecting"
          >
            <span className="sr-only">Connected for </span>
            {uptime}
          </span>
        )}
      </div>

      {/* Quick actions — only when connected */}
      {isConnected && (
        <>
          <div
            className="h-6 w-px bg-b-strong shrink-0 hidden sm:block"
            aria-hidden="true"
          />
          <div className="hidden sm:flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => runService((s) => s.sendBootNotification())}
            >
              <RefreshCw aria-hidden="true" /> Boot
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => runService((s) => s.sendHeartbeat())}
            >
              <Zap aria-hidden="true" /> Heartbeat
            </Button>
            <Button
              size="sm"
              variant={offlineMode ? "soft-danger" : "ghost"}
              aria-pressed={offlineMode}
              onClick={() =>
                // Goes through the service so going back online actually
                // replays what was queued while the station was dark.
                runService((s) => s.setOfflineMode(!offlineMode))
              }
              title={
                offlineMode
                  ? "Go back online and flush queued messages"
                  : "Simulate a network drop"
              }
            >
              <WifiOff aria-hidden="true" />
              Simulate offline
            </Button>
          </div>
        </>
      )}

      {/* ── Connect / Disconnect ── */}
      <Button
        variant={
          isConnected ? "soft-danger" : isConnecting ? "neutral" : "default"
        }
        disabled={isConnecting}
        onClick={() =>
          runService((s) => (isConnected ? s.disconnect() : s.connect()))
        }
        className="px-4"
      >
        {isConnecting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Connecting…
          </>
        ) : isConnected ? (
          <>
            <PowerOff aria-hidden="true" />
            Disconnect
          </>
        ) : (
          <>
            <Power aria-hidden="true" />
            Connect
          </>
        )}
      </Button>

      <div
        className="h-6 w-px bg-b-strong shrink-0 hidden sm:block"
        aria-hidden="true"
      />

      {/* ── Project links (open in a new tab) ── */}
      <nav
        aria-label="Project links"
        className="flex items-center gap-1 shrink-0"
      >
        <a
          href={ECOSYSTEM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="ocpp-ws-io ecosystem (opens in a new tab)"
          title="ocpp-ws-io ecosystem"
          className={cn(
            buttonVariants({ variant: "neutral", size: "sm" }),
            "max-xl:size-8 max-xl:px-0",
          )}
        >
          <Blocks aria-hidden="true" />
          <span className="hidden xl:inline">ocpp-ws-io</span>
          <ExternalLink
            aria-hidden="true"
            className="hidden xl:block size-3! text-t-muted"
          />
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository (opens in a new tab)"
          title="View source on GitHub"
          className={buttonVariants({ variant: "neutral", size: "icon" })}
        >
          <HugeiconsIcon icon={GithubIcon} strokeWidth={2} aria-hidden="true" />
        </a>
      </nav>

      {/* ── Shortcuts ── */}
      <ShortcutsDialog />

      {/* ── Logout ── */}
      {process.env.NEXT_PUBLIC_ALLOW_AUTH === "true" && (
        <IconButton
          label="Sign out"
          variant="neutral"
          className="hover:text-danger"
          onClick={() => auth?.logout()}
        >
          <LogOut aria-hidden="true" />
        </IconButton>
      )}

      {/* ── Localhost Guide ── */}
      <LocalhostGuideDialog />

      {/* ── Settings ── */}
      <IconButton
        label="Open configuration panel"
        variant="neutral"
        onClick={onSettingsOpen}
      >
        <Settings aria-hidden="true" />
      </IconButton>
    </header>
  );
}

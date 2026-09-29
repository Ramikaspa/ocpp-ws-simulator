"use client";

/**
 * App header. Collapses in stages so it never overflows (WCAG 1.4.10
 * reflow): phone → brand, status, Connect, Settings and a "More" menu;
 * tablet (sm) adds the title, OCPP version and status text; desktop (lg)
 * adds the endpoint and inline icon actions; wide (2xl) labels everything.
 */

import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Blocks,
  EllipsisVertical,
  ExternalLink,
  Globe,
  Keyboard,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BREAKPOINT, useMediaQuery } from "@/hooks/use-media-query";
import { useActiveCharger } from "@/hooks/useActiveCharger";
import { cn } from "@/lib/utils";
import type { ConnectionStatus, EmulatorConfig } from "@/store/emulatorStore";
import { IconButton, OptionSelect } from "./kit";

const GITHUB_URL = "https://github.com/rohittiwari-dev/ocpp-ws-simulator";
const ECOSYSTEM_URL = "https://ocpp-ws-io.rohittiwari.me/";
const AUTH_ENABLED = process.env.NEXT_PUBLIC_ALLOW_AUTH === "true";

/* ── Status config ── */
type StCfg = { dot: string; text: string; label: string };
const ST: Record<ConnectionStatus, StCfg> = {
  connected: { dot: "bg-success", text: "text-success", label: "Connected" },
  connecting: {
    dot: "bg-warning",
    text: "text-warning",
    label: "Connecting",
  },
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

/** Icon button with a tooltip — the label doubles as the accessible name. */
function ToolButton({
  label,
  hint,
  children,
  ...props
}: React.ComponentProps<typeof IconButton> & { hint?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <IconButton label={label} {...props}>
            {children}
          </IconButton>
        }
      />
      <TooltipContent side="bottom">
        {label}
        {hint && (
          <kbd className="ml-1.5 font-mono text-2xs text-t-muted">{hint}</kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
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

  const isSm = useMediaQuery(BREAKPOINT.sm);
  const isLg = useMediaQuery(BREAKPOINT.lg);
  const isWide = useMediaQuery(BREAKPOINT["2xl"]);

  const [guideOpen, setGuideOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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

  const runService = (
    fn: (svc: typeof import("@/lib/ocppClient").ocppService) => void,
  ) => import("@/lib/ocppClient").then(({ ocppService }) => fn(ocppService)); // proxy auto-routes to active charger

  const sendBoot = () => runService((s) => s.sendBootNotification());
  const sendHeartbeat = () => runService((s) => s.sendHeartbeat());
  // Goes through the service so going back online actually replays what
  // was queued while the station was dark.
  const toggleOffline = () => runService((s) => s.setOfflineMode(!offlineMode));

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-b-subtle bg-surface-card px-3 sm:gap-3 sm:px-4">
      {/* ── Brand ── */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand/30 bg-brand-subtle">
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
        <h1 className="sr-only text-sm font-semibold tracking-tight text-t-primary md:not-sr-only md:whitespace-nowrap">
          OCPP WS Simulator
        </h1>
      </div>

      <div
        className="hidden h-6 w-px shrink-0 bg-b-strong md:block"
        aria-hidden="true"
      />

      {/* ── Endpoint (opens connection settings) — desktop ── */}
      {isLg && (
        <Button
          variant="neutral"
          size="sm"
          onClick={onSettingsOpen}
          title="Edit connection settings"
          className={cn(
            "min-w-0 bg-surface-inset font-normal",
            isConnected && !isWide ? "max-w-56" : "max-w-xs 2xl:max-w-sm",
          )}
        >
          <span className="sr-only">Connection settings: </span>
          <span className="truncate font-mono text-xs text-t-secondary">
            {config.endpoint}/
            <span className="text-brand-strong">{config.chargePointId}</span>
          </span>
        </Button>
      )}

      {/* ── OCPP Version — tablet and up (in the More menu on phones) ── */}
      {isSm && (
        <div
          className="w-28 shrink-0 md:w-32"
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
      )}

      <div className="min-w-0 flex-1" />

      {/* ── Connection status (announced to screen readers) ── */}
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <span
          className={cn("size-2 shrink-0 rounded-full", st.dot)}
          aria-hidden="true"
        />
        <span
          role="status"
          className={cn("text-xs font-semibold", st.text, !isSm && "sr-only")}
        >
          {st.label}
          {offlineMode && isConnected ? " (simulated offline)" : ""}
        </span>
        {uptime && (
          <span
            className="hidden rounded border border-b-strong bg-surface-inset px-1.5 py-0.5 font-mono text-2xs text-t-secondary md:inline"
            title="Time since connecting"
          >
            <span className="sr-only">Connected for </span>
            {uptime}
          </span>
        )}
      </div>

      {/* ── Quick actions — desktop (labelled when wide) ── */}
      {isConnected && isLg && (
        <>
          <div className="h-6 w-px shrink-0 bg-b-strong" aria-hidden="true" />
          <div className="flex items-center gap-1">
            {isWide ? (
              <>
                <Button size="sm" variant="ghost" onClick={sendBoot}>
                  <RefreshCw aria-hidden="true" /> Boot
                </Button>
                <Button size="sm" variant="ghost" onClick={sendHeartbeat}>
                  <Zap aria-hidden="true" /> Heartbeat
                </Button>
                <Button
                  size="sm"
                  variant={offlineMode ? "soft-danger" : "ghost"}
                  aria-pressed={offlineMode}
                  onClick={toggleOffline}
                  title={
                    offlineMode
                      ? "Go back online and flush queued messages"
                      : "Simulate a network drop"
                  }
                >
                  <WifiOff aria-hidden="true" /> Simulate offline
                </Button>
              </>
            ) : (
              <>
                <ToolButton
                  label="Send BootNotification"
                  size="icon-sm"
                  onClick={sendBoot}
                >
                  <RefreshCw aria-hidden="true" />
                </ToolButton>
                <ToolButton
                  label="Send Heartbeat"
                  size="icon-sm"
                  onClick={sendHeartbeat}
                >
                  <Zap aria-hidden="true" />
                </ToolButton>
                <ToolButton
                  label={offlineMode ? "Go back online" : "Simulate offline"}
                  size="icon-sm"
                  variant={offlineMode ? "soft-danger" : "ghost"}
                  aria-pressed={offlineMode}
                  onClick={toggleOffline}
                >
                  <WifiOff aria-hidden="true" />
                </ToolButton>
              </>
            )}
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
        className="shrink-0 px-3 sm:px-4"
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
        className="hidden h-6 w-px shrink-0 bg-b-strong sm:block"
        aria-hidden="true"
      />

      {/* ── Links & tools ── */}
      <nav
        aria-label="Project links and tools"
        className="flex shrink-0 items-center gap-1.5"
      >
        {isLg && (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <a
                    href={ECOSYSTEM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="ocpp-ws-io ecosystem (opens in a new tab)"
                    className={buttonVariants({
                      variant: "neutral",
                      size: isWide && !isConnected ? "sm" : "icon",
                    })}
                  >
                    <Blocks aria-hidden="true" />
                    {isWide && !isConnected && (
                      <>
                        <span>ocpp-ws-io</span>
                        <ExternalLink
                          aria-hidden="true"
                          className="size-3! text-t-muted"
                        />
                      </>
                    )}
                  </a>
                }
              />
              <TooltipContent side="bottom">
                ocpp-ws-io ecosystem
                <p className="mt-0.5 text-2xs text-t-muted">
                  Tools, schemas and documentation
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub repository (opens in a new tab)"
                    className={buttonVariants({
                      variant: "neutral",
                      size: "icon",
                    })}
                  >
                    <HugeiconsIcon
                      icon={GithubIcon}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </a>
                }
              />
              <TooltipContent side="bottom">
                View source on GitHub
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* One instance each; the trigger is inline on desktop and a menu
            item below it. */}
        <ShortcutsDialog
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
          hideTrigger={!isLg}
        />
        <LocalhostGuideDialog
          open={guideOpen}
          onOpenChange={setGuideOpen}
          hideTrigger={!isLg}
          iconOnly={isConnected || !isWide}
        />

        {AUTH_ENABLED && isLg && (
          <ToolButton
            label="Sign out"
            variant="neutral"
            className="hover:text-danger"
            onClick={() => auth?.logout()}
          >
            <LogOut aria-hidden="true" />
          </ToolButton>
        )}

        {/* ── More (below desktop) ── */}
        {!isLg && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <IconButton label="More actions" variant="neutral">
                  <EllipsisVertical aria-hidden="true" />
                </IconButton>
              }
            />
            <DropdownMenuContent align="end" className="w-64">
              {!isSm && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>OCPP version</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={config.ocppVersion}
                      onValueChange={(v) =>
                        updateConfig({
                          ocppVersion: v as EmulatorConfig["ocppVersion"],
                        })
                      }
                    >
                      {VERSIONS.map((v) => (
                        <DropdownMenuRadioItem
                          key={v.value}
                          value={v.value}
                          disabled={vLocked}
                        >
                          {v.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}

              {isConnected && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      Charger{uptime ? ` · connected ${uptime}` : ""}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={sendBoot}>
                      <RefreshCw aria-hidden="true" /> Send BootNotification
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={sendHeartbeat}>
                      <Zap aria-hidden="true" /> Send Heartbeat
                    </DropdownMenuItem>
                    <DropdownMenuCheckboxItem
                      checked={offlineMode}
                      onCheckedChange={toggleOffline}
                    >
                      Simulate offline
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onClick={() => setGuideOpen(true)}>
                <Globe aria-hidden="true" /> Localhost guide
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
                <Keyboard aria-hidden="true" /> Keyboard shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={
                  <a
                    href={ECOSYSTEM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Blocks aria-hidden="true" /> ocpp-ws-io ecosystem
                <ExternalLink
                  aria-hidden="true"
                  className="ml-auto size-3! text-t-muted"
                />
                <span className="sr-only"> (opens in a new tab)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <HugeiconsIcon
                  icon={GithubIcon}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                GitHub repository
                <ExternalLink
                  aria-hidden="true"
                  className="ml-auto size-3! text-t-muted"
                />
                <span className="sr-only"> (opens in a new tab)</span>
              </DropdownMenuItem>
              {AUTH_ENABLED && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => auth?.logout()}
                  >
                    <LogOut aria-hidden="true" /> Sign out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* ── Settings — always visible ── */}
        <ToolButton
          label="Open configuration panel"
          hint="Ctrl+1"
          variant="neutral"
          onClick={onSettingsOpen}
        >
          <Settings aria-hidden="true" />
        </ToolButton>
      </nav>
    </header>
  );
}

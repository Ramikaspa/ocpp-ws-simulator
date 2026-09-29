"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Info,
  Laptop,
  Play,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveCharger } from "@/hooks/useActiveCharger";
import { cn } from "@/lib/utils";
import { IconButton } from "./kit";

/* ── Copy Button ── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      label={copied ? "Copied" : "Copy to clipboard"}
      size="icon-xs"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <Check className="text-success" aria-hidden="true" />
      ) : (
        <Copy aria-hidden="true" />
      )}
    </IconButton>
  );
}

/* ── Props ── */
export interface LocalhostGuideDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  iconOnly?: boolean;
  /** Render only the dialog — opened from a menu item via `open`. */
  hideTrigger?: boolean;
}

export function LocalhostGuideDialog({
  open,
  onOpenChange,
  trigger,
  iconOnly = false,
  hideTrigger = false,
}: LocalhostGuideDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen =
    (isControlled ? onOpenChange : setInternalOpen) || (() => {});
  const { config, updateConfig } = useActiveCharger();
  const [activeTab, setActiveTab] = useState<
    "permission" | "tester" | "tunnel"
  >("permission");
  const [browser, setBrowser] = useState<"chromium" | "firefox" | "safari">(
    "chromium",
  );

  /* Detect origin & environment */
  const [isHttps, setIsHttps] = useState(false);
  const [isLocalOrigin, setIsLocalOrigin] = useState(false);
  const [originUrl, setOriginUrl] = useState("");
  const [permissionState, setPermissionState] = useState<
    "unknown" | "granted" | "prompt" | "denied" | "unsupported"
  >("unknown");

  /* Port tester state */
  const initialPort = (() => {
    try {
      const match = config.endpoint.match(/:(\d+)/);
      return match ? match[1] : "9000";
    } catch {
      return "9000";
    }
  })();

  const [testPort, setTestPort] = useState(initialPort);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "blocked" | "error"
  >("idle");
  const [testMessage, setTestMessage] = useState("");
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsHttps(window.location.protocol === "https:");
    setIsLocalOrigin(
      window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1",
    );
    setOriginUrl(window.location.origin);

    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("firefox")) {
      setBrowser("firefox");
    } else if (
      ua.includes("safari") &&
      !ua.includes("chrome") &&
      !ua.includes("chromium")
    ) {
      setBrowser("safari");
    } else {
      setBrowser("chromium");
    }

    if (navigator.permissions?.query) {
      let cancelled = false;
      const queryPerm = async () => {
        try {
          const p = await navigator.permissions.query({
            name: "loopback-network" as unknown as PermissionName,
          });
          if (!cancelled && p) {
            setPermissionState(p.state);
            p.onchange = () => {
              if (!cancelled) setPermissionState(p.state);
            };
            return;
          }
        } catch {
          try {
            const p2 = await navigator.permissions.query({
              name: "local-network" as unknown as PermissionName,
            });
            if (!cancelled && p2) {
              setPermissionState(p2.state);
              p2.onchange = () => {
                if (!cancelled) setPermissionState(p2.state);
              };
              return;
            }
          } catch {
            if (!cancelled) setPermissionState("unsupported");
          }
        }
      };
      queryPerm();
      return () => {
        cancelled = true;
      };
    }
  }, []);

  /* Test connection tester */
  const runTestConnection = useCallback((portToTest: string) => {
    setTestStatus("testing");
    setTestMessage("");
    setTestLatency(null);
    setApplied(false);

    const cleanPort = portToTest.trim() || "9000";
    const targetWsUrl = `ws://localhost:${cleanPort}`;
    const startTime = performance.now();
    let finished = false;

    try {
      const ws = new WebSocket(targetWsUrl);

      const timeoutId = setTimeout(() => {
        if (!finished) {
          finished = true;
          try {
            ws.close();
          } catch {}
          setTestStatus("error");
          setTestMessage(
            `Connection timed out. Ensure your CSMS is running and listening on port ${cleanPort}.`,
          );
        }
      }, 3000);

      ws.onopen = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        const elapsed = Math.round(performance.now() - startTime);
        setTestLatency(elapsed);
        setTestStatus("success");
        setTestMessage(
          `Successfully connected to local WebSocket server on port ${cleanPort} (${elapsed}ms).`,
        );
        try {
          ws.close();
        } catch {}
      };

      ws.onerror = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        const elapsed = Math.round(performance.now() - startTime);
        const isCurrentHttps =
          typeof window !== "undefined" &&
          window.location.protocol === "https:";

        if (isCurrentHttps && elapsed < 80) {
          setTestStatus("blocked");
          setTestMessage(
            `Blocked by browser security. Insecure WebSocket (ws://) from HTTPS was blocked. Allow "Insecure content" in site settings.`,
          );
        } else {
          setTestStatus("error");
          setTestMessage(
            `Failed to reach port ${cleanPort}. Verify your CSMS is running and listening.`,
          );
        }
      };

      ws.onclose = (ev) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        const elapsed = Math.round(performance.now() - startTime);
        const isCurrentHttps =
          typeof window !== "undefined" &&
          window.location.protocol === "https:";

        if (isCurrentHttps && elapsed < 80 && ev.code === 1006) {
          setTestStatus("blocked");
          setTestMessage(
            `Browser blocked the connection (code 1006). Allow "Insecure content" in site settings.`,
          );
        } else {
          setTestStatus("error");
          setTestMessage(
            `WebSocket closed immediately (code ${ev.code}). Ensure your CSMS is running on port ${cleanPort}.`,
          );
        }
      };
    } catch (err: unknown) {
      setTestStatus("blocked");
      setTestMessage(
        err instanceof Error
          ? err.message
          : "Browser security blocked creating WebSocket to localhost.",
      );
    }
  }, []);

  const isLocalhostActive =
    config.endpoint.includes("localhost") ||
    config.endpoint.includes("127.0.0.1");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {hideTrigger ? null : trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={isLocalhostActive ? "soft-brand" : "neutral"}
                size={iconOnly ? "icon" : "sm"}
                onClick={() => setIsOpen(true)}
                aria-label="Connect to localhost: guide and browser permissions"
                className={cn(
                  "relative shrink-0",
                  iconOnly ? "size-8 p-0" : "max-md:size-8 max-md:px-0",
                )}
              >
                <Globe className="size-4 shrink-0" aria-hidden="true" />
                {!iconOnly && (
                  <span className="hidden md:inline">Localhost</span>
                )}
                {isLocalhostActive && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "rounded-full bg-success",
                      iconOnly
                        ? "absolute top-1.5 right-1.5 size-1.5 ring-1 ring-surface-card"
                        : "size-1.5",
                    )}
                  />
                )}
              </Button>
            }
          />
          <TooltipContent side="bottom">
            <div className="flex items-center gap-1.5 font-medium">
              <span>Localhost Guide</span>
              {isLocalhostActive && (
                <span className="text-2xs px-1.5 py-0.2 rounded bg-success/20 text-success font-semibold">
                  Active
                </span>
              )}
            </div>
            <p className="text-2xs text-t-muted mt-0.5">
              Browser permissions & local CSMS setup
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      <DialogContent
        showCloseButton
        className="w-[95vw] sm:max-w-2xl bg-surface-card border border-b-strong shadow-2xl rounded-xl p-0 flex flex-col overflow-hidden text-t-primary"
      >
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-b-subtle bg-surface-elevated">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-b-strong bg-surface-inset text-brand">
              <Globe className="size-4.5 text-brand" aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-semibold text-t-primary">
                  Connect to Localhost
                </DialogTitle>
                <span className="text-2xs font-mono font-medium px-2 py-0.5 rounded-full bg-brand-subtle border border-brand/30 text-brand-strong">
                  ws://localhost
                </span>
              </div>
              <DialogDescription className="text-2xs text-t-muted">
                How to connect this simulator directly to your local CSMS
                backend.
              </DialogDescription>
            </div>
          </div>

          {/* Environment Status Strip */}
          <div className="mt-3 flex items-center justify-between text-xs px-3.5 py-2 rounded-lg bg-surface-inset border border-b-subtle">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  isLocalOrigin
                    ? "bg-success shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                    : isHttps
                      ? "bg-warning shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      : "bg-info",
                )}
                aria-hidden="true"
              />
              <span className="text-t-secondary font-mono text-2xs truncate">
                {originUrl || "Origin"}
              </span>
              <span className="text-t-faint text-2xs">•</span>
              <span className="text-t-primary text-xs font-medium truncate">
                {isLocalOrigin
                  ? "Localhost (Direct Access Permitted)"
                  : isHttps
                    ? "Hosted HTTPS (Permission Required)"
                    : "Standard Context"}
              </span>
            </div>

            {permissionState === "granted" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 text-2xs font-semibold shrink-0">
                <Check className="size-3" aria-hidden="true" /> Allowed
              </span>
            )}
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="min-h-0 gap-0"
        >
          <div className="px-5 pt-3 pb-0 bg-surface-card">
            <TabsList
              aria-label="Guide sections"
              activateOnFocus
              className="grid w-full grid-cols-3 h-auto p-1 bg-surface-inset border border-b-subtle rounded-lg"
            >
              <TabsTrigger
                value="permission"
                className="text-xs font-semibold py-1.5 gap-1.5"
              >
                <ShieldCheck aria-hidden="true" />
                Browser permission
              </TabsTrigger>
              <TabsTrigger
                value="tester"
                className="text-xs font-semibold py-1.5 gap-1.5"
              >
                <Zap aria-hidden="true" />
                Test connection
              </TabsTrigger>
              <TabsTrigger
                value="tunnel"
                className="text-xs font-semibold py-1.5 gap-1.5"
              >
                <Terminal aria-hidden="true" />
                Reverse tunnel
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto max-h-[calc(75vh-160px)] space-y-4">
            {/* TAB 1: BROWSER PERMISSION */}
            <TabsContent value="permission">
              <div className="space-y-4">
                {/* If user is running locally */}
                {isLocalOrigin ? (
                  <div className="p-4 rounded-xl bg-surface-inset border border-b-default space-y-2.5">
                    <div className="flex items-center gap-2 text-success font-semibold text-xs">
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Running in Local Environment
                    </div>
                    <p className="text-xs text-t-secondary leading-relaxed">
                      Because this simulator is running on{" "}
                      <code className="text-brand-strong font-mono px-1.5 py-0.5 rounded bg-surface-card border border-b-subtle text-xs">
                        {originUrl}
                      </code>
                      , your browser allows direct WebSocket connections to{" "}
                      <code className="text-brand-strong font-mono px-1.5 py-0.5 rounded bg-surface-card border border-b-subtle text-xs">
                        ws://localhost:9000
                      </code>{" "}
                      without needing any permission changes or tunnels.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <Button
                        variant="soft-brand"
                        size="sm"
                        onClick={() => setActiveTab("tester")}
                      >
                        <Zap aria-hidden="true" /> Test your local CSMS
                        connection
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* When running on hosted HTTPS */
                  <div className="p-3.5 rounded-xl bg-brand-subtle border border-brand/30 flex items-start gap-2.5 text-xs">
                    <Info
                      className="size-4 text-brand shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <p className="text-t-secondary leading-relaxed">
                      When hosted over HTTPS, browsers block unencrypted
                      WebSockets (
                      <code className="text-brand-strong font-mono text-xs">
                        ws://
                      </code>
                      ) to localhost by default. Allow{" "}
                      <strong className="text-t-primary">
                        "Insecure content"
                      </strong>{" "}
                      in site settings to connect directly with zero proxy or
                      tunnel.
                    </p>
                  </div>
                )}

                {/* Browser selector pills */}
                <ToggleGroup
                  aria-label="Your browser"
                  size="sm"
                  spacing={1}
                  value={[browser]}
                  onValueChange={(v) =>
                    v[0] && setBrowser(v[0] as typeof browser)
                  }
                  className="rounded-lg border border-b-subtle bg-surface-inset p-1"
                >
                  <ToggleGroupItem value="chromium">
                    <Laptop aria-hidden="true" />
                    Chrome / Edge / Brave
                  </ToggleGroupItem>
                  <ToggleGroupItem value="firefox">Firefox</ToggleGroupItem>
                  <ToggleGroupItem value="safari">Safari</ToggleGroupItem>
                </ToggleGroup>

                {/* CHROMIUM INSTRUCTIONS */}
                {browser === "chromium" && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-b-default bg-surface-inset p-4 space-y-3 text-xs">
                      {/* Step 1 */}
                      <div className="flex items-start gap-3">
                        <div className="size-5 rounded-full bg-brand-subtle border border-brand/30 text-brand-strong flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-t-primary">
                            Click the Page Settings icon in the address bar
                          </p>
                          <p className="text-xs text-t-secondary leading-relaxed">
                            In your browser address bar at the top, click the{" "}
                            <strong className="text-t-primary">Tune (🎛️)</strong>{" "}
                            or{" "}
                            <strong className="text-t-primary">
                              Padlock (🔒)
                            </strong>{" "}
                            icon next to the URL &rarr; click{" "}
                            <strong className="text-t-primary">
                              Site settings
                            </strong>
                            .
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-3">
                        <div className="size-5 rounded-full bg-brand-subtle border border-brand/30 text-brand-strong flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-t-primary">
                            Set "Insecure content" to Allow
                          </p>
                          <p className="text-xs text-t-secondary leading-relaxed">
                            Scroll down to{" "}
                            <strong className="text-t-primary">
                              Insecure content
                            </strong>{" "}
                            and change the dropdown from <em>Block</em> to{" "}
                            <strong className="text-success">Allow</strong>.
                            <em>
                              {" "}
                              (If "Local network access" is listed, ensure it is
                              also set to Allow).
                            </em>
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-3">
                        <div className="size-5 rounded-full bg-brand-subtle border border-brand/30 text-brand-strong flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          3
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-t-primary">
                            Reload the page & Connect
                          </p>
                          <p className="text-xs text-t-secondary leading-relaxed">
                            Switch back to this simulator tab, refresh, and
                            click{" "}
                            <strong className="text-t-primary">Connect</strong>.
                            Direct connections to{" "}
                            <code className="text-brand font-mono">
                              ws://localhost:9000
                            </code>{" "}
                            will now work!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Chrome 142 Prompt note */}
                    <div className="p-3.5 rounded-xl bg-surface-base border border-b-subtle flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-t-primary flex items-center gap-1.5">
                          <Zap
                            className="size-3.5 text-warning"
                            aria-hidden="true"
                          />
                          Chrome 142+ Permission Prompt
                        </span>
                        <p className="text-xs text-t-secondary">
                          If Chrome displays a prompt asking to connect to local
                          devices, click{" "}
                          <strong className="text-t-primary">Allow</strong>.
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold border border-success/30 text-2xs shrink-0">
                        Auto-prompt
                      </span>
                    </div>
                  </div>
                )}

                {/* FIREFOX INSTRUCTIONS */}
                {browser === "firefox" && (
                  <div className="p-4 rounded-xl border border-b-default bg-surface-inset space-y-3 text-xs">
                    <p className="font-semibold text-t-primary text-xs">
                      Firefox Configuration
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-t-secondary">
                      <li>
                        Open a new tab and go to:
                        <span className="inline-flex items-center gap-1.5 bg-surface-card border border-b-subtle rounded-md px-2 py-0.5 text-xs font-mono text-brand ml-1.5">
                          about:config
                          <CopyButton text="about:config" />
                        </span>
                      </li>
                      <li>
                        Click{" "}
                        <strong className="text-t-primary">
                          Accept the Risk and Continue
                        </strong>
                        .
                      </li>
                      <li>
                        Search for:
                        <div className="mt-1 flex items-center gap-1.5 bg-surface-card border border-b-subtle rounded-md px-2.5 py-1 text-xs font-mono text-brand w-fit">
                          <code>network.websocket.allowInsecureFromHTTPS</code>
                          <CopyButton text="network.websocket.allowInsecureFromHTTPS" />
                        </div>
                      </li>
                      <li>
                        Toggle value to{" "}
                        <strong className="text-success">true</strong> and
                        reload simulator.
                      </li>
                    </ol>
                  </div>
                )}

                {/* SAFARI INSTRUCTIONS */}
                {browser === "safari" && (
                  <div className="p-4 rounded-xl border border-b-default bg-surface-inset space-y-2.5 text-xs">
                    <p className="font-semibold text-t-primary text-xs">
                      Safari Configuration
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-t-secondary">
                      <li>
                        Go to{" "}
                        <strong className="text-t-primary">
                          Safari Settings
                        </strong>{" "}
                        &gt;{" "}
                        <strong className="text-t-primary">Advanced</strong>{" "}
                        &gt; Check{" "}
                        <strong className="text-t-primary">
                          "Show features for web developers"
                        </strong>
                        .
                      </li>
                      <li>
                        Under the{" "}
                        <strong className="text-t-primary">Develop</strong>{" "}
                        menu, disable local cross-origin restrictions.
                      </li>
                      <li>
                        Or run the simulator locally using{" "}
                        <code className="text-brand-strong font-mono px-1 py-0.5 rounded bg-surface-card border border-b-subtle text-xs">
                          npm run dev
                        </code>{" "}
                        for zero restrictions.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: TEST CONNECTION */}
            <TabsContent value="tester">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-inset border border-b-default space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-t-primary flex items-center gap-2">
                      <Server
                        className="size-4 text-warning"
                        aria-hidden="true"
                      />
                      Test Local CSMS Reachability
                    </span>
                    <span className="text-xs text-t-secondary truncate max-w-50">
                      Active:{" "}
                      <code className="text-brand-strong font-mono">
                        {config.endpoint}
                      </code>
                    </span>
                  </div>

                  {/* Port Input & Chips */}
                  <div className="space-y-2">
                    <label
                      htmlFor="test-port-input"
                      className="text-2xs font-semibold text-t-muted uppercase tracking-wider block"
                    >
                      Target Port
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-surface-card border border-b-control hover:border-b-strong focus-within:border-brand/70 focus-within:ring-1 focus-within:ring-brand/30 rounded-md pl-3 flex-1 min-w-45 transition-colors">
                        <span
                          className="text-xs font-mono text-t-muted select-none"
                          aria-hidden="true"
                        >
                          ws://localhost:
                        </span>
                        <Input
                          id="test-port-input"
                          inputMode="numeric"
                          value={testPort}
                          onChange={(e) => setTestPort(e.target.value)}
                          placeholder="9000"
                          className="h-8 border-0 bg-transparent px-0 font-mono text-xs text-t-primary focus-visible:ring-0 focus-visible:outline-none"
                        />
                      </div>

                      {["9000", "8080", "8180", "3000", "8887"].map((p) => (
                        <Button
                          key={p}
                          variant={testPort === p ? "soft-brand" : "neutral"}
                          size="sm"
                          aria-pressed={testPort === p}
                          aria-label={`Test port ${p}`}
                          className="font-mono h-8"
                          onClick={() => {
                            setTestPort(p);
                            runTestConnection(p);
                          }}
                        >
                          :{p}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={testStatus === "testing"}
                      onClick={() => runTestConnection(testPort)}
                    >
                      {testStatus === "testing" ? (
                        <>
                          <RefreshCw
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          Testing…
                        </>
                      ) : (
                        <>
                          <Play aria-hidden="true" />
                          Test WebSocket
                        </>
                      )}
                    </Button>

                    <Button
                      variant={applied ? "soft-success" : "neutral"}
                      size="sm"
                      onClick={() => {
                        updateConfig({
                          endpoint: `ws://localhost:${testPort.trim() || "9000"}`,
                        });
                        setApplied(true);
                        setTimeout(() => setApplied(false), 2000);
                      }}
                    >
                      {applied ? (
                        <>
                          <Check aria-hidden="true" />
                          Applied to active charger
                        </>
                      ) : (
                        <>
                          Apply ws://localhost:
                          {testPort || "9000"}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Test Result */}
                  {testStatus !== "idle" && (
                    <div
                      role="status"
                      className={`mt-2 p-3.5 rounded-xl border text-xs transition-all ${
                        testStatus === "testing"
                          ? "bg-surface-inset border-b-default text-t-secondary"
                          : testStatus === "success"
                            ? "bg-success/10 border-success/30 text-t-primary"
                            : testStatus === "blocked"
                              ? "bg-warning/10 border-warning/30 text-t-primary"
                              : "bg-danger/10 border-danger/30 text-t-primary"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {testStatus === "testing" && (
                          <RefreshCw className="size-4 animate-spin text-brand shrink-0 mt-0.5" />
                        )}
                        {testStatus === "success" && (
                          <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                        )}
                        {testStatus === "blocked" && (
                          <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                        )}
                        {testStatus === "error" && (
                          <ShieldAlert className="size-4 text-danger shrink-0 mt-0.5" />
                        )}

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">
                              {testStatus === "testing"
                                ? "Testing connection…"
                                : testStatus === "success"
                                  ? "Connected Successfully!"
                                  : testStatus === "blocked"
                                    ? "Blocked by Browser Security"
                                    : "Connection Refused / Closed"}
                            </span>
                            {testLatency !== null && (
                              <span className="font-mono text-xs opacity-75">
                                {testLatency} ms
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-t-secondary leading-relaxed">
                            {testMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: REVERSE TUNNEL */}
            <TabsContent value="tunnel">
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-surface-inset border border-b-default space-y-1 text-t-secondary">
                  <p className="font-semibold text-t-primary text-xs flex items-center gap-1.5">
                    <Terminal
                      className="size-3.5 text-brand"
                      aria-hidden="true"
                    />
                    When to use a Reverse Tunnel
                  </p>
                  <p className="text-xs leading-relaxed">
                    Use this if your computer is on a restricted corporate
                    network where browser site permissions cannot be changed.
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-2.5">
                  {[
                    {
                      num: "1",
                      title: "Install Ngrok",
                      command: "npm install -g ngrok",
                      desc: "Install Ngrok globally or download from ngrok.com",
                    },
                    {
                      num: "2",
                      title: "Start your CSMS server",
                      command: "node server.js",
                      desc: "Make sure your CSMS is running locally on port 9000",
                    },
                    {
                      num: "3",
                      title: "Create tunnel",
                      command: "ngrok http 9000",
                      desc: "Ngrok will provide a public forwarding address",
                    },
                    {
                      num: "4",
                      title: "Use secure wss:// URL",
                      command: "wss://xxxx-xx.ngrok-free.app",
                      desc: "Copy the HTTPS forwarding address and replace https:// with wss://",
                    },
                  ].map((step) => (
                    <div
                      key={step.num}
                      className="flex gap-3 p-3.5 rounded-xl bg-surface-inset border border-b-default"
                    >
                      <div className="size-5 rounded-full bg-brand-subtle border border-brand/30 flex items-center justify-center text-xs font-bold text-brand-strong shrink-0 mt-0.5">
                        {step.num}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-t-primary text-xs">
                            {step.title}
                          </span>
                          <span className="text-xs text-t-secondary">
                            {step.desc}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-surface-card border border-b-subtle rounded-md px-2.5 py-1.5">
                          <code className="flex-1 text-xs font-mono text-brand truncate">
                            {step.command}
                          </code>
                          <CopyButton text={step.command} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cloudflare Tunnel alternative */}
                <div className="p-3.5 rounded-xl bg-surface-inset border border-b-default space-y-1.5">
                  <span className="font-semibold text-t-primary text-xs">
                    Cloudflare Tunnel (Alternative)
                  </span>
                  <div className="flex items-center gap-1.5 bg-surface-card border border-b-subtle rounded-md px-2.5 py-1.5">
                    <code className="flex-1 text-xs font-mono text-brand truncate">
                      cloudflared tunnel --url http://localhost:9000
                    </code>
                    <CopyButton text="cloudflared tunnel --url http://localhost:9000" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-b-subtle bg-surface-elevated flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-2xs text-t-muted flex items-center gap-1.5 min-w-0">
                <Info
                  className="size-3.5 text-t-muted shrink-0"
                  aria-hidden="true"
                />
                <span className="shrink-0">CSMS URL:</span>
                <span className="font-mono text-t-primary truncate max-w-48">
                  {config.endpoint}
                </span>
              </span>
              <a
                href="https://developer.chrome.com/blog/local-network-access"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xs text-brand hover:text-brand-strong inline-flex items-center gap-1 transition-colors shrink-0"
              >
                Chrome LNA Docs
                <ExternalLink className="size-3" />
              </a>
            </div>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

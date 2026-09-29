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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Field, IconButton, Notice, PanelDialog, PanelSection } from "./kit";

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

/* ── Copyable code line ── */
function CodeLine({ text }: { text: string }) {
  return (
    <span className="mt-1.5 flex items-center gap-2 rounded-md border border-b-default bg-surface-card py-1 pr-1 pl-2.5">
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-brand-strong">
        {text}
      </code>
      <CopyButton text={text} />
    </span>
  );
}

/* ── Numbered steps ── */
function Steps({
  steps,
}: {
  steps: { title: string; body: React.ReactNode }[];
}) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-brand/35 bg-brand-subtle font-mono text-2xs font-semibold text-brand-strong"
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-t-primary">
              <span className="sr-only">Step {i + 1}: </span>
              {step.title}
            </p>
            <div className="mt-0.5 text-xs leading-relaxed text-t-secondary [&_strong]:font-semibold [&_strong]:text-t-primary">
              {step.body}
            </div>
          </div>
        </li>
      ))}
    </ol>
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

  const env = isLocalOrigin
    ? {
        tone: "success" as const,
        icon: <CheckCircle2 aria-hidden="true" />,
        title: "Running locally",
        text: "Direct connections to ws://localhost are allowed. No browser changes needed.",
      }
    : isHttps
      ? {
          tone: "warning" as const,
          icon: <ShieldAlert aria-hidden="true" />,
          title: "Hosted over HTTPS",
          text: "Browsers block unencrypted ws:// connections to localhost from HTTPS pages until you allow insecure content for this site.",
        }
      : {
          tone: "info" as const,
          icon: <Info aria-hidden="true" />,
          title: "Standard context",
          text: "Plain http:// pages can usually reach ws://localhost directly.",
        };

  const testTone =
    testStatus === "success"
      ? "success"
      : testStatus === "blocked"
        ? "warning"
        : testStatus === "error"
          ? "danger"
          : "info";
  const testTitle =
    testStatus === "testing"
      ? "Testing connection…"
      : testStatus === "success"
        ? "Connected"
        : testStatus === "blocked"
          ? "Blocked by browser security"
          : "Connection refused or closed";

  return (
    <>
      {!hideTrigger && !trigger && (
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
            Localhost guide
            <p className="mt-0.5 text-2xs text-t-muted">
              Browser permissions and local CSMS setup
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      <PanelDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          !hideTrigger && trigger ? (trigger as React.ReactElement) : undefined
        }
        size="xl"
        icon={<Globe aria-hidden="true" />}
        title="Connect to a local CSMS"
        description="Reach a CSMS running on your machine, such as ws://localhost:9000, from this simulator."
        footer={
          <>
            <a
              href="https://developer.chrome.com/blog/local-network-access"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "link", size: "xs" }),
                "px-0 sm:mr-auto",
              )}
            >
              Chrome local network access docs
              <ExternalLink aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </>
        }
      >
        <Notice tone={env.tone} icon={env.icon}>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-t-primary">{env.title}</span>
            {originUrl && (
              <span className="font-mono text-2xs text-t-muted">
                {originUrl}
              </span>
            )}
            {permissionState === "granted" && (
              <Badge variant="success" className="h-5">
                <Check aria-hidden="true" /> Allowed
              </Badge>
            )}
          </span>
          <span className="mt-0.5 block">{env.text}</span>
        </Notice>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="gap-4"
        >
          <TabsList
            aria-label="Guide sections"
            activateOnFocus
            className="grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0"
          >
            <TabsTrigger value="permission">
              <ShieldCheck aria-hidden="true" />
              Permission
            </TabsTrigger>
            <TabsTrigger value="tester">
              <Zap aria-hidden="true" />
              Test
            </TabsTrigger>
            <TabsTrigger value="tunnel">
              <Terminal aria-hidden="true" />
              Tunnel
            </TabsTrigger>
          </TabsList>

          {/* ── Browser permission ── */}
          <TabsContent value="permission" className="space-y-4">
            {isLocalOrigin ? (
              <PanelSection
                icon={<CheckCircle2 aria-hidden="true" />}
                title="Nothing to change"
              >
                <p className="text-xs leading-relaxed text-t-secondary">
                  This simulator runs on{" "}
                  <code className="font-mono text-brand-strong">
                    {originUrl}
                  </code>
                  , so the browser already allows connections to{" "}
                  <code className="font-mono text-brand-strong">
                    ws://localhost
                  </code>
                  .
                </p>
                <Button
                  variant="soft-brand"
                  size="sm"
                  className="mt-3"
                  onClick={() => setActiveTab("tester")}
                >
                  <Zap aria-hidden="true" /> Test your local CSMS
                </Button>
              </PanelSection>
            ) : (
              <PanelSection
                icon={<Laptop aria-hidden="true" />}
                title="Allow insecure content"
              >
                <ToggleGroup
                  aria-label="Your browser"
                  variant="outline"
                  size="sm"
                  spacing={1}
                  value={[browser]}
                  onValueChange={(v) =>
                    v[0] && setBrowser(v[0] as typeof browser)
                  }
                  className="mb-4 grid w-full grid-cols-3 gap-1"
                >
                  <ToggleGroupItem value="chromium" variant="outline">
                    Chrome / Edge
                  </ToggleGroupItem>
                  <ToggleGroupItem value="firefox" variant="outline">
                    Firefox
                  </ToggleGroupItem>
                  <ToggleGroupItem value="safari" variant="outline">
                    Safari
                  </ToggleGroupItem>
                </ToggleGroup>

                {browser === "chromium" && (
                  <Steps
                    steps={[
                      {
                        title: "Open site settings",
                        body: (
                          <>
                            Click the <strong>site information</strong> icon
                            (tune or padlock) at the left of the address bar,
                            then <strong>Site settings</strong>.
                          </>
                        ),
                      },
                      {
                        title: "Allow insecure content",
                        body: (
                          <>
                            Set <strong>Insecure content</strong> to{" "}
                            <strong>Allow</strong>. If{" "}
                            <strong>Local network access</strong> is listed,
                            allow it too.
                          </>
                        ),
                      },
                      {
                        title: "Reload and connect",
                        body: (
                          <>
                            Come back to this tab, reload, and select{" "}
                            <strong>Connect</strong>.
                          </>
                        ),
                      },
                    ]}
                  />
                )}
                {browser === "firefox" && (
                  <Steps
                    steps={[
                      {
                        title: "Open the advanced settings",
                        body: (
                          <>
                            In a new tab, go to <CodeLine text="about:config" />{" "}
                            and accept the risk warning.
                          </>
                        ),
                      },
                      {
                        title: "Find the WebSocket setting",
                        body: (
                          <CodeLine text="network.websocket.allowInsecureFromHTTPS" />
                        ),
                      },
                      {
                        title: "Turn it on",
                        body: (
                          <>
                            Set it to <strong>true</strong>, then reload this
                            page.
                          </>
                        ),
                      },
                    ]}
                  />
                )}
                {browser === "safari" && (
                  <Steps
                    steps={[
                      {
                        title: "Enable developer features",
                        body: (
                          <>
                            <strong>Safari Settings</strong> →{" "}
                            <strong>Advanced</strong> → check{" "}
                            <strong>Show features for web developers</strong>.
                          </>
                        ),
                      },
                      {
                        title: "Relax local restrictions",
                        body: (
                          <>
                            In the <strong>Develop</strong> menu, disable
                            cross-origin restrictions for local files.
                          </>
                        ),
                      },
                      {
                        title: "Or run the simulator locally",
                        body: <CodeLine text="npm run dev" />,
                      },
                    ]}
                  />
                )}
              </PanelSection>
            )}

            {browser === "chromium" && !isLocalOrigin && (
              <Notice icon={<Info aria-hidden="true" />}>
                Chrome 142 and later may also ask to connect to devices on your
                local network. Choose <strong>Allow</strong>.
              </Notice>
            )}
          </TabsContent>

          {/* ── Test connection ── */}
          <TabsContent value="tester" className="space-y-4">
            <PanelSection
              icon={<Server aria-hidden="true" />}
              title="Reachability test"
              action={
                <span className="max-w-48 truncate font-mono text-2xs text-t-muted">
                  Current: {config.endpoint}
                </span>
              }
            >
              <Field label="Port" htmlFor="test-port-input">
                <div className="flex min-w-0 items-center rounded-md border border-b-control bg-surface-inset pl-3 transition-colors focus-within:border-brand">
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs text-t-muted select-none"
                  >
                    ws://localhost:
                  </span>
                  <Input
                    id="test-port-input"
                    inputMode="numeric"
                    autoComplete="off"
                    value={testPort}
                    onChange={(e) => setTestPort(e.target.value)}
                    placeholder="9000"
                    className="border-0 bg-transparent pl-1 font-mono"
                  />
                </div>
              </Field>

              <fieldset className="mt-3">
                <legend className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-t-muted">
                  Common ports
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {["9000", "8080", "8180", "3000", "8887"].map((p) => (
                    <Button
                      key={p}
                      variant={testPort === p ? "soft-brand" : "neutral"}
                      size="sm"
                      aria-pressed={testPort === p}
                      aria-label={`Test port ${p}`}
                      className="font-mono"
                      onClick={() => {
                        setTestPort(p);
                        runTestConnection(p);
                      }}
                    >
                      :{p}
                    </Button>
                  ))}
                </div>
              </fieldset>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={testStatus === "testing"}
                  onClick={() => runTestConnection(testPort)}
                >
                  {testStatus === "testing" ? (
                    <>
                      <RefreshCw className="animate-spin" aria-hidden="true" />
                      Testing…
                    </>
                  ) : (
                    <>
                      <Play aria-hidden="true" /> Test WebSocket
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
                      <Check aria-hidden="true" /> Applied to active charger
                    </>
                  ) : (
                    <>Use ws://localhost:{testPort || "9000"}</>
                  )}
                </Button>
              </div>
            </PanelSection>

            <div role="status">
              {testStatus !== "idle" && (
                <Notice
                  tone={testTone}
                  icon={
                    testStatus === "testing" ? (
                      <RefreshCw className="animate-spin" aria-hidden="true" />
                    ) : testStatus === "success" ? (
                      <CheckCircle2 aria-hidden="true" />
                    ) : testStatus === "blocked" ? (
                      <AlertTriangle aria-hidden="true" />
                    ) : (
                      <ShieldAlert aria-hidden="true" />
                    )
                  }
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-t-primary">
                      {testTitle}
                    </span>
                    {testLatency !== null && (
                      <span className="font-mono text-2xs text-t-muted">
                        {testLatency} ms
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block">{testMessage}</span>
                </Notice>
              )}
            </div>
          </TabsContent>

          {/* ── Reverse tunnel ── */}
          <TabsContent value="tunnel" className="space-y-4">
            <Notice icon={<Info aria-hidden="true" />}>
              Use a tunnel when browser site settings can't be changed, for
              example on a managed work machine. The simulator then connects
              over secure <code className="font-mono">wss://</code>.
            </Notice>

            <PanelSection icon={<Terminal aria-hidden="true" />} title="ngrok">
              <Steps
                steps={[
                  {
                    title: "Install ngrok",
                    body: <CodeLine text="npm install -g ngrok" />,
                  },
                  {
                    title: "Start your CSMS on port 9000",
                    body: <CodeLine text="node server.js" />,
                  },
                  {
                    title: "Open a tunnel",
                    body: <CodeLine text="ngrok http 9000" />,
                  },
                  {
                    title: "Use the forwarding address with wss://",
                    body: (
                      <>
                        Replace <code className="font-mono">https://</code> with{" "}
                        <code className="font-mono">wss://</code>, e.g.
                        <CodeLine text="wss://xxxx-xx.ngrok-free.app" />
                      </>
                    ),
                  },
                ]}
              />
            </PanelSection>

            <PanelSection
              icon={<Terminal aria-hidden="true" />}
              title="Cloudflare Tunnel (alternative)"
            >
              <CodeLine text="cloudflared tunnel --url http://localhost:9000" />
            </PanelSection>
          </TabsContent>
        </Tabs>
      </PanelDialog>
    </>
  );
}

"use client";

import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BatteryCharging,
  Blocks,
  BookOpen,
  Boxes,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Network,
  ScrollText,
  ShieldCheck,
  TriangleAlert,
  User,
} from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GITHUB_URL, LIB_URL, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Field, IconButton, Notice } from "./kit";

/* ── Auth context ── */
const AuthCtx = createContext<{ logout: () => void } | null>(null);
export const useAuth = () => useContext(AuthCtx);

type AuthState = "unknown" | "authed" | "login";

/* ═══════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════ */

const FEATURES = [
  {
    icon: Network,
    title: "OCPP 1.6J, 2.0.1 and 2.1",
    body: "Switch protocol per charger and test any CSMS over WebSocket.",
  },
  {
    icon: BatteryCharging,
    title: "Real charging sessions",
    body: "Plug in, authorize and charge with live meter values and state of charge.",
  },
  {
    icon: ScrollText,
    title: "Every message logged",
    body: "Inspect each OCPP frame and export the log as JSON or CSV.",
  },
  {
    icon: Boxes,
    title: "Fleet load testing",
    body: "Spawn and connect up to 50 virtual chargers at once.",
  },
];

/** A few frames of an OCPP exchange, as the log panel shows them. */
const PREVIEW = [
  { dir: "TX", tone: "text-info", text: '[2,"8f3a","BootNotification",{…}]' },
  { dir: "RX", tone: "text-success", text: '[3,"8f3a",{"status":"Accepted"}]' },
  { dir: "TX", tone: "text-info", text: '[2,"91c2","StatusNotification",{…}]' },
  { dir: "TX", tone: "text-info", text: '[2,"a7d0","MeterValues",{…}]' },
];

const LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-sm text-xs text-t-secondary underline-offset-4 transition-colors hover:text-t-primary hover:underline [&_svg]:size-3.5";

function ProjectLinks({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Project links"
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}
    >
      <Link href="/ocpp-simulator" className={LINK_CLASS}>
        <BookOpen aria-hidden="true" /> Guides
      </Link>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASS}
      >
        <HugeiconsIcon icon={GithubIcon} strokeWidth={2} aria-hidden="true" />
        GitHub
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <a
        href={LIB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASS}
      >
        <Blocks aria-hidden="true" /> ocpp-ws-io
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </nav>
  );
}

function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [missing, setMissing] = useState({ username: false, password: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { username: !username.trim(), password: !password };
    setMissing(next);
    setError("");
    // Move focus to the first field that needs attention (WCAG 3.3.1)
    if (next.username) return userRef.current?.focus();
    if (next.password) return passRef.current?.focus();

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) return onSuccess();
      setError(
        res.status === 401
          ? "That username and password don't match. Check them and try again."
          : "Sign-in failed. Please try again.",
      );
      passRef.current?.select();
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const trackCapsLock = (e: React.KeyboardEvent) =>
    setCapsLock(e.getModifierState("CapsLock"));

  return (
    <main className="custom-scrollbar grid h-full w-full overflow-y-auto bg-surface-base lg:grid-cols-2">
      {/* ── Sign in ── */}
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-10 sm:px-8">
        {/* Brand, until the side panel takes over */}
        <div className="flex flex-col items-center gap-3 text-center lg:hidden">
          <span className="grid size-12 place-items-center rounded-xl border border-brand/30 bg-brand-subtle">
            <BrandMark className="size-7" gradientId="auth-mark-sm" />
          </span>
          <div>
            <p className="text-sm font-semibold text-t-primary">{SITE_NAME}</p>
            <p className="text-xs text-t-muted">
              OCPP simulator &amp; charge point emulator
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          noValidate
          aria-labelledby="login-title"
          aria-describedby="login-desc"
          className="w-full max-w-sm overflow-hidden rounded-xl border border-b-default bg-surface-card shadow-2xl shadow-black/30"
        >
          {/* Header — same anatomy as the panel dialogs */}
          <div className="flex items-start gap-3 border-b border-b-subtle px-5 py-4">
            <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-white [&_svg]:size-4">
              <KeyRound aria-hidden="true" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h1
                id="login-title"
                className="text-sm font-semibold text-t-primary"
              >
                Sign in
                <span className="sr-only"> to {SITE_NAME}</span>
              </h1>
              <p id="login-desc" className="text-xs text-t-secondary">
                This instance is private. Use the credentials set by its owner.
              </p>
            </div>
          </div>

          {/* The alert region stays mounted (so it is announced) but takes no
              space while empty */}
          <div className="space-y-4 px-5 py-5 [&>[role=alert]:empty]:mb-0">
            <div role="alert">
              {error && (
                <Notice tone="danger" icon={<CircleAlert aria-hidden="true" />}>
                  {error}
                </Notice>
              )}
            </div>

            <Field label="Username" htmlFor="login-username">
              <div className="relative">
                <User
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-t-muted"
                />
                <Input
                  ref={userRef}
                  id="login-username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setMissing((m) => ({ ...m, username: false }));
                    setError("");
                  }}
                  aria-invalid={missing.username || undefined}
                  aria-describedby={
                    missing.username ? "login-username-error" : undefined
                  }
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  className="h-10 pl-9 text-sm"
                />
              </div>
              {missing.username && (
                <p id="login-username-error" className="text-2xs text-danger">
                  Enter your username.
                </p>
              )}
            </Field>

            <Field label="Password" htmlFor="login-password">
              <div className="relative">
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-t-muted"
                />
                <Input
                  ref={passRef}
                  id="login-password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMissing((m) => ({ ...m, password: false }));
                    setError("");
                  }}
                  onKeyDown={trackCapsLock}
                  onKeyUp={trackCapsLock}
                  onBlur={() => setCapsLock(false)}
                  aria-invalid={missing.password || undefined}
                  aria-describedby={
                    [
                      missing.password && "login-password-error",
                      capsLock && "login-capslock",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  autoComplete="current-password"
                  className="h-10 pr-11 pl-9 text-sm"
                />
                <IconButton
                  label={showPw ? "Hide password" : "Show password"}
                  aria-pressed={showPw}
                  size="icon-sm"
                  className="absolute top-1/2 right-1.5 -translate-y-1/2"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </IconButton>
              </div>
              {missing.password && (
                <p id="login-password-error" className="text-2xs text-danger">
                  Enter your password.
                </p>
              )}
              {capsLock && (
                <p
                  id="login-capslock"
                  className="flex items-center gap-1.5 text-2xs text-warning"
                >
                  <TriangleAlert aria-hidden="true" className="size-3" />
                  Caps Lock is on.
                </p>
              )}
            </Field>
          </div>

          <div className="border-t border-b-subtle bg-surface-elevated/50 px-5 py-3">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </div>
        </form>

        <div className="w-full max-w-sm space-y-2 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-t-muted">
            <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
            You stay signed in on this device for 10 days.
          </p>
          <p className="text-2xs leading-5 text-t-muted">
            Running your own copy? Credentials come from{" "}
            <code className="font-mono text-t-secondary">MASTER_USERNAME</code>{" "}
            and{" "}
            <code className="font-mono text-t-secondary">MASTER_PASSWORD</code>.
          </p>
        </div>

        <ProjectLinks className="justify-center lg:hidden" />
      </div>

      {/* ── Product panel (desktop) ── */}
      <aside
        aria-label={`About ${SITE_NAME}`}
        className="relative hidden overflow-hidden border-l border-b-subtle bg-surface-card lg:flex lg:flex-col lg:justify-between lg:gap-10 lg:p-12 xl:p-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 size-112 rounded-full bg-brand/15 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -left-24 size-96 rounded-full bg-brand/10 blur-[120px]"
        />

        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-brand/30 bg-brand-subtle">
            <BrandMark className="size-6" gradientId="auth-mark-lg" />
          </span>
          <div>
            <p className="text-sm font-semibold text-t-primary">{SITE_NAME}</p>
            <p className="text-xs text-t-muted">
              OCPP simulator &amp; charge point emulator
            </p>
          </div>
        </div>

        <div className="relative max-w-lg space-y-8">
          <div className="space-y-3">
            <p className="text-3xl leading-tight font-bold tracking-tight text-t-primary xl:text-4xl">
              Test any CSMS with virtual EV chargers.
            </p>
            <ul
              aria-label="Supported protocols"
              className="flex flex-wrap gap-2"
            >
              {["OCPP 1.6J", "OCPP 2.0.1", "OCPP 2.1"].map((v) => (
                <li
                  key={v}
                  className="rounded-full border border-b-default bg-surface-inset px-2.5 py-0.5 font-mono text-2xs text-t-secondary"
                >
                  {v}
                </li>
              ))}
            </ul>
          </div>

          <ul className="grid gap-5 xl:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md border border-b-default bg-surface-elevated text-brand-strong [&_svg]:size-4">
                  <Icon aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-t-primary">
                    {title}
                  </p>
                  <p className="text-xs leading-5 text-t-secondary">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Decorative: a glimpse of the message log */}
          <div
            aria-hidden="true"
            className="overflow-hidden rounded-lg border border-b-default bg-surface-inset"
          >
            <div className="flex items-center gap-1.5 border-b border-b-subtle px-3 py-2">
              <span className="size-2 rounded-full bg-success" />
              <span className="font-mono text-2xs tracking-wider text-t-muted uppercase">
                ws://localhost:9000/CP001
              </span>
            </div>
            <ul className="space-y-1 px-3 py-2.5 font-mono text-2xs">
              {PREVIEW.map((row) => (
                <li key={row.text} className="flex gap-3 truncate">
                  <span className={cn("font-semibold", row.tone)}>
                    {row.dir}
                  </span>
                  <span className="truncate text-t-secondary">{row.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ProjectLinks className="relative" />
      </aside>
    </main>
  );
}

/* ═══════════════════════════════════════════
   AUTH GATE
   ═══════════════════════════════════════════ */
export function AuthGate({
  initialState,
  children,
}: {
  /** Session state read from the cookie on the server, when available. */
  initialState?: "authed" | "login";
  children: React.ReactNode;
}) {
  const authEnabled = process.env.NEXT_PUBLIC_ALLOW_AUTH === "true";

  // With auth off, or when the server already read the session cookie, the
  // first render is final — the server HTML carries the real screen
  // (crawlers, no-JS, first paint) instead of a spinner.
  const [state, setState] = useState<AuthState>(
    authEnabled ? (initialState ?? "unknown") : "authed",
  );

  const verify = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/check");
      setState(res.ok ? "authed" : "login");
    } catch {
      setState("login");
    }
  }, []);

  useEffect(() => {
    if (!authEnabled) {
      setState("authed");
      return;
    }
    if (!initialState) verify();
  }, [authEnabled, initialState, verify]);

  const logout = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setState("login");
  }, []);

  if (state === "unknown") {
    return (
      <div
        role="status"
        className="grid h-full w-full place-items-center bg-surface-base"
      >
        <Loader2
          aria-hidden="true"
          className="size-6 animate-spin text-brand"
        />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  if (state === "login") {
    return <LoginPage onSuccess={() => setState("authed")} />;
  }

  return <AuthCtx.Provider value={{ logout }}>{children}</AuthCtx.Provider>;
}

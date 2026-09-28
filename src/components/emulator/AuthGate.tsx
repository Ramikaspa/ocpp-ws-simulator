"use client";

import {
  BatteryCharging,
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, IconButton, Notice } from "./kit";

/* ── Auth context ── */
const AuthCtx = createContext<{ logout: () => void } | null>(null);
export const useAuth = () => useContext(AuthCtx);

/* ═══════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════ */
function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess();
      } else {
        setError(data.error ?? "Invalid credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-full w-full flex items-center justify-center bg-surface-base p-4 relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none"
      />

      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="size-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)]">
            <BatteryCharging className="text-white size-6" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-t-primary tracking-tight">
              OCPP Emulator
            </h1>
            <p className="text-xs text-t-secondary mt-0.5">
              Sign in to access the simulator
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-card border border-b-default rounded-2xl p-6 flex flex-col gap-4">
          <form
            onSubmit={submit}
            noValidate
            aria-describedby={error ? "login-error" : undefined}
            className="flex flex-col gap-4"
          >
            {/* Announced as soon as it appears */}
            <div id="login-error" role="alert">
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-t-muted pointer-events-none"
                />
                <Input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  aria-invalid={error && !username ? true : undefined}
                  placeholder="Enter username"
                  autoComplete="username"
                  // biome-ignore lint/a11y/noAutofocus: the only task on this screen is signing in
                  autoFocus
                  className="h-10 pl-9"
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="login-password">
              <div className="relative">
                <Lock
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-t-muted pointer-events-none"
                />
                <Input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  aria-invalid={error && !password ? true : undefined}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="h-10 pl-9 pr-11"
                />
                <IconButton
                  label={showPw ? "Hide password" : "Show password"}
                  aria-pressed={showPw}
                  size="icon-sm"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </IconButton>
              </div>
            </Field>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="mt-1 w-full"
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
          </form>
        </div>

        <p className="text-center text-xs text-t-muted">
          Your session stays signed in for 10 days.
        </p>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════
   AUTH GATE
   ═══════════════════════════════════════════ */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const authEnabled = process.env.NEXT_PUBLIC_ALLOW_AUTH === "true";

  // "unknown" = haven't checked yet (avoids flash)
  const [state, setState] = useState<"unknown" | "authed" | "login">("unknown");

  const verify = useCallback(async () => {
    try {
      // Hit a lightweight check endpoint — if cookie is valid the POST succeeds without creds
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
    verify();
  }, [authEnabled, verify]);

  const logout = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setState("login");
  }, []);

  if (state === "unknown") {
    // Show nothing while checking to avoid flash
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface-base">
        <Loader2 className="h-6 w-6 text-brand animate-spin" />
      </div>
    );
  }

  if (state === "login") {
    return <LoginPage onSuccess={() => setState("authed")} />;
  }

  return <AuthCtx.Provider value={{ logout }}>{children}</AuthCtx.Provider>;
}

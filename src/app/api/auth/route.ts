import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_MAX_AGE_SECS, isAuthEnabled } from "@/lib/auth";

const signedIn = () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "1", {
    maxAge: AUTH_MAX_AGE_SECS,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
};

export async function POST(req: NextRequest) {
  // If auth is disabled, auto-approve
  if (!isAuthEnabled()) return signedIn();

  const body = await req.json().catch(() => ({}));
  const { username, password } = body as {
    username?: string;
    password?: string;
  };

  const validUser = process.env.MASTER_USERNAME;
  const validPass = process.env.MASTER_PASSWORD;
  if (
    validUser &&
    validPass &&
    username === validUser &&
    password === validPass
  )
    return signedIn();

  return NextResponse.json(
    { ok: false, error: "Invalid credentials" },
    { status: 401 },
  );
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

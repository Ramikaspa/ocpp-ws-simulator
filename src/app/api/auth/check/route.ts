import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, hasSession, isAuthEnabled } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // If auth is globally disabled, always return ok
  if (!isAuthEnabled()) return NextResponse.json({ ok: true });

  if (hasSession(req.cookies.get(AUTH_COOKIE)?.value))
    return NextResponse.json({ ok: true });

  return NextResponse.json({ ok: false }, { status: 401 });
}

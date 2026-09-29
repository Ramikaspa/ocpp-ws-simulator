import type { Metadata } from "next";
import { cookies } from "next/headers";
import { EmulatorApp } from "@/components/emulator/EmulatorApp";
import { JsonLd } from "@/components/seo/JsonLd";
import { AUTH_COOKIE, hasSession, isAuthEnabled } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { DEFAULT_DESCRIPTION } from "@/lib/site";
import {
  appNode,
  authorNode,
  libraryNode,
  websiteNode,
} from "@/lib/structured-data";

// The home page is the product itself, so its title leads with the main
// query rather than the brand.
export const metadata: Metadata = pageMetadata({
  title: "OCPP Simulator & EV Charger Emulator — Free and Open Source",
  absoluteTitle: true,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

/**
 * With sign-in enabled, read the session here so the server renders the
 * sign-in screen or the app directly — no spinner while the client checks.
 * Reading cookies makes the page dynamic, so only do it when sign-in is on;
 * otherwise the page stays fully static.
 */
async function initialAuth() {
  if (!isAuthEnabled()) return undefined;
  const store = await cookies();
  return hasSession(store.get(AUTH_COOKIE)?.value) ? "authed" : "login";
}

export default async function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [websiteNode, appNode, authorNode, libraryNode],
        }}
      />
      <EmulatorApp initialAuth={await initialAuth()} />
    </>
  );
}

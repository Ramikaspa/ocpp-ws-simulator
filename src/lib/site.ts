/**
 * Site-wide facts used by metadata, structured data, the sitemap, the guide
 * pages and llms.txt — one source so they never disagree.
 *
 * Marketed as both an OCPP simulator and a charge point emulator: titles,
 * descriptions and keywords pair the two terms.
 */

import pkg from "../../package.json";

export const SITE_URL = "https://ocpp.rohittiwari.me";
export const SITE_NAME = "OCPP WS Simulator";
export const SITE_VERSION = pkg.version;

export const GITHUB_URL =
  "https://github.com/rohittiwari-dev/ocpp-ws-simulator";
export const LIB_NAME = "ocpp-ws-io";
export const LIB_URL = "https://ocpp-ws-io.rohittiwari.me";
export const LIB_GITHUB_URL = "https://github.com/rohittiwari-dev/ocpp-ws-io";
export const LIB_NPM_URL = "https://www.npmjs.com/package/ocpp-ws-io";

export const AUTHOR = {
  name: "Rohit Tiwari",
  url: "https://rohittiwari.me",
  github: "https://github.com/rohittiwari-dev",
  x: "https://x.com/rohittiwari_dev",
  xHandle: "@rohittiwari_dev",
} as const;

export const DEFAULT_DESCRIPTION =
  "Free, open-source OCPP simulator and charge point emulator in your browser. Run virtual EV chargers on OCPP 1.6J, 2.0.1 and 2.1 and test any CSMS over WebSocket.";

/** What the simulator does — reused in JSON-LD featureList and copy. */
export const FEATURES = [
  "OCPP 1.6J, 2.0.1 and 2.1 over WebSocket",
  "Multiple virtual chargers with one or two connectors each",
  "Start, stop and auto-charge transactions with realistic meter values",
  "State of charge (SoC) simulation against a configurable EV battery",
  "Remote commands: RemoteStart/Stop, Reset, UnlockConnector, TriggerMessage, ChangeConfiguration and more",
  "Reservations, smart charging profiles and local authorization lists",
  "Fault injection, offline mode and response-latency simulation",
  "Firmware update and diagnostics upload lifecycles",
  "Live OCPP message log with JSON/CSV export",
  "Fleet spawn for load testing a CSMS",
] as const;

export type Guide = {
  slug: string;
  /** Short label for navigation. */
  nav: string;
  /** <title> and H1. */
  title: string;
  description: string;
  keywords: string[];
};

/** Guide pages, in navigation order. */
export const GUIDES: Guide[] = [
  {
    slug: "ocpp-simulator",
    nav: "OCPP simulator",
    title: "OCPP Simulator & Emulator: Test a CSMS with a Virtual Charger",
    description:
      "A free online OCPP simulator and emulator for 1.6J, 2.0.1 and 2.1. Run virtual charge points in your browser and inspect every message.",
    keywords: [
      "OCPP simulator",
      "OCPP emulator",
      "charge point emulator",
      "charge point simulator",
      "virtual charge point",
      "CSMS testing",
      "OCPP test tool",
    ],
  },
  {
    slug: "ev-charger-simulator",
    nav: "EV charger simulator",
    title: "EV Charger Simulator & Emulator: Charging Sessions Online",
    description:
      "Simulate EV charging sessions in your browser: plug in, authorize, charge with live meter values and state of charge, inject faults and stop — all over real OCPP.",
    keywords: [
      "EV charger simulator",
      "EV charger emulator",
      "EV charging simulator",
      "EVSE emulator",
      "EVSE simulator",
      "charging station emulator",
      "EV simulator",
    ],
  },
  {
    slug: "ocpp-1-6-simulator",
    nav: "OCPP 1.6",
    title: "OCPP 1.6J Simulator & Emulator: Every Core Message",
    description:
      "Test OCPP 1.6J (JSON over WebSocket) against your central system: BootNotification, Authorize, StartTransaction, MeterValues, remote commands and more.",
    keywords: [
      "OCPP 1.6 simulator",
      "OCPP 1.6J simulator",
      "OCPP 1.6 emulator",
      "OCPP 1.6 charge point emulator",
      "OCPP 1.6 test",
      "OCPP-J 1.6",
    ],
  },
  {
    slug: "ocpp-2-0-1-simulator",
    nav: "OCPP 2.0.1",
    title: "OCPP 2.0.1 & 2.1 Simulator: TransactionEvent and Device Model",
    description:
      "Simulate and emulate OCPP 2.0.1 and 2.1 charging stations: TransactionEvent, EVSE status, device model variables, SetVariables and remote transactions over WebSocket.",
    keywords: [
      "OCPP 2.0.1 simulator",
      "OCPP 2.1 simulator",
      "OCPP 2.0.1 emulator",
      "TransactionEvent",
      "OCPP 2.0.1 test tool",
    ],
  },
  {
    slug: "ocpp-nodejs",
    nav: "OCPP in Node.js",
    title: "OCPP in Node.js: Build a CSMS with ocpp-ws-io",
    description:
      "Build an OCPP server or client in Node.js and TypeScript with ocpp-ws-io — an OCPP RPC WebSocket library for 1.6J, 2.0.1 and 2.1 — and test it with the simulator.",
    keywords: [
      "OCPP Node.js",
      "ocpp-ws-io",
      "OCPP RPC",
      "OCPP WebSocket Node",
      "OCPP TypeScript",
      "OCPP server Node.js",
      "ocpp-rpc",
    ],
  },
  {
    slug: "test-csms-locally",
    nav: "Test a local CSMS",
    title: "Test a Local CSMS: Connect the Simulator to ws://localhost",
    description:
      "Connect a browser OCPP simulator to a CSMS on your machine: allow insecure WebSockets from HTTPS, test reachability, or use an ngrok or Cloudflare tunnel.",
    keywords: [
      "test OCPP server locally",
      "OCPP localhost",
      "OCPP WebSocket localhost",
      "CSMS local testing",
      "ngrok OCPP",
    ],
  },
  {
    slug: "faq",
    nav: "FAQ",
    title: "OCPP Simulator & Emulator FAQ",
    description:
      "Answers about the free OCPP simulator and emulator: supported OCPP versions, connecting to a CSMS, localhost testing, meter values, state of charge and load testing.",
    keywords: [
      "OCPP simulator FAQ",
      "OCPP emulator FAQ",
      "what is OCPP",
      "OCPP charge point",
      "OCPP questions",
    ],
  },
];

export const guideUrl = (slug: string) => `${SITE_URL}/${slug}`;

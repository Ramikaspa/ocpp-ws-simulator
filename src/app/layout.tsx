import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AUTHOR, DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Search-console ownership tokens, set per deployment (see .env.example). */
const verification: Metadata["verification"] = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
    ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#0f1117",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// Canonical URLs and og:url are set per page: a canonical here would be
// inherited by every page and point them all at the home page.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Free OCPP Simulator & Emulator`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "technology",
  keywords: [
    "OCPP emulator",
    "OCPP simulator",
    "EV charger emulator",
    "EV charger simulator",
    "EV charging simulator",
    "EV simulator",
    "charge point emulator",
    "charge point simulator",
    "charging station emulator",
    "charging station simulator",
    "EVSE emulator",
    "EVSE simulator",
    "virtual charge point",
    "OCPP 1.6 emulator",
    "OCPP 1.6 simulator",
    "OCPP 1.6J",
    "OCPP 2.0.1 emulator",
    "OCPP 2.0.1 simulator",
    "OCPP 2.1",
    "OCPP-J",
    "OCPP WebSocket",
    "OCPP test tool",
    "CSMS testing",
    "test OCPP server",
    "OCPP load testing",
    "OCPP Node.js",
    "OCPP TypeScript",
    "OCPP RPC",
    "ocpp-rpc",
    "ocpp-ws-io",
    "Open Charge Point Protocol",
  ],
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  publisher: AUTHOR.name,
  formatDetection: { telephone: false, email: false, address: false },
  verification,

  /* ── Indexing ── */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  /* ── Social previews (images come from opengraph-image files) ── */
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free OCPP Simulator & Emulator`,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Free OCPP Simulator & Emulator`,
    description: DEFAULT_DESCRIPTION,
    creator: AUTHOR.xHandle,
    site: AUTHOR.xHandle,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full w-full overflow-hidden">
      <body
        className={`${inter.variable} ${inter.className} antialiased h-full w-full overflow-hidden`}
      >
        {/* ── Subtle grid overlay ── */}
        <div className="bg-grid-overlay" aria-hidden="true" />

        {/* ── App content ── */}
        <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
          <TooltipProvider>{children}</TooltipProvider>
        </div>
      </body>
    </html>
  );
}

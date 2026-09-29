import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight, Menu } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { buttonVariants } from "@/components/ui/button";
import {
  AUTHOR,
  GITHUB_URL,
  GUIDES,
  LIB_NPM_URL,
  LIB_URL,
  SITE_NAME,
} from "@/lib/site";
import { cn } from "@/lib/utils";

/** Guides navigation shown in the header (the rest live in the footer). */
const HEADER_GUIDES = GUIDES.filter((g) =>
  [
    "ocpp-simulator",
    "ev-charger-simulator",
    "ocpp-1-6-simulator",
    "ocpp-2-0-1-simulator",
    "ocpp-nodejs",
  ].includes(g.slug),
);

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-b-subtle bg-surface-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-sm font-semibold text-t-primary"
        >
          <span className="grid size-8 place-items-center rounded-lg border border-brand/30 bg-brand-subtle">
            <BrandMark className="size-5" gradientId="site-mark" />
          </span>
          {SITE_NAME}
        </Link>

        <nav
          aria-label="Guides"
          className="hidden flex-1 items-center gap-1 lg:flex"
        >
          {HEADER_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/${g.slug}`}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-t-secondary transition-colors hover:bg-surface-hover hover:text-t-primary"
            >
              {g.nav}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Link
            href="/"
            className={cn(buttonVariants({ size: "sm" }), "no-underline")}
          >
            Open simulator <ArrowRight aria-hidden="true" />
          </Link>

          {/* Mobile menu: native disclosure, works without JavaScript */}
          <details className="group relative lg:hidden">
            <summary
              aria-label="Guides menu"
              className={cn(
                buttonVariants({ variant: "neutral", size: "icon" }),
                "list-none [&::-webkit-details-marker]:hidden",
              )}
            >
              <Menu aria-hidden="true" />
            </summary>
            <nav
              aria-label="Guides"
              className="absolute right-0 mt-2 w-64 rounded-lg border border-b-strong bg-surface-elevated p-1 shadow-2xl"
            >
              {GUIDES.map((g) => (
                <Link
                  key={g.slug}
                  href={`/${g.slug}`}
                  className="block rounded-sm px-3 py-2 text-xs text-t-secondary hover:bg-brand-subtle hover:text-brand-strong"
                >
                  {g.nav}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-b-subtle bg-surface-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-t-primary">{SITE_NAME}</p>
          <p className="text-xs leading-6 text-t-muted">
            Free, open-source OCPP simulator and charge point emulator for
            testing CSMS backends. Built by{" "}
            <a
              href={AUTHOR.url}
              className="text-t-secondary underline underline-offset-4 hover:text-t-primary"
            >
              {AUTHOR.name}
            </a>
            .
          </p>
        </div>
        <nav aria-label="Guides (footer)">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-t-muted">
            Guides
          </p>
          <ul className="space-y-1.5">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/${g.slug}`}
                  className="text-xs text-t-secondary hover:text-t-primary"
                >
                  {g.nav}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Project">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-t-muted">
            Project
          </p>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/" className="text-t-secondary hover:text-t-primary">
                Open the simulator
              </Link>
            </li>
            <li>
              <a
                href={GITHUB_URL}
                className="inline-flex items-center gap-1.5 text-t-secondary hover:text-t-primary"
              >
                <HugeiconsIcon
                  icon={GithubIcon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden="true"
                />
                Source on GitHub
              </a>
            </li>
            <li>
              <a
                href={LIB_URL}
                className="text-t-secondary hover:text-t-primary"
              >
                ocpp-ws-io documentation
              </a>
            </li>
            <li>
              <a
                href={LIB_NPM_URL}
                className="text-t-secondary hover:text-t-primary"
              >
                ocpp-ws-io on npm
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

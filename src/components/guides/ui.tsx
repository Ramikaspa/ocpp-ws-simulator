import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Article body typography, in the app's tokens. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "space-y-5 text-sm leading-7 text-t-secondary",
        "[&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-brand-strong",
        "[&_strong]:font-semibold [&_strong]:text-t-primary",
        "[&_code]:rounded [&_code]:border [&_code]:border-b-default [&_code]:bg-surface-inset [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-brand-strong",
        "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_li]:pl-1 [&_li::marker]:text-t-muted",
      )}
    >
      {children}
    </div>
  );
}

/** A titled section with a linkable anchor. */
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-20 space-y-4">
      <h2
        id={id}
        className="pt-4 text-xl font-semibold tracking-tight text-t-primary"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Code sample; `pre` keeps it copyable and readable without JS. */
export function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-b-default bg-surface-inset">
      <figcaption className="border-b border-b-subtle px-4 py-2 font-mono text-2xs uppercase tracking-wider text-t-muted">
        {label}
      </figcaption>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-t-primary [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-t-primary">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function FeatureGrid({
  items,
}: {
  items: { title: string; body: ReactNode }[];
}) {
  return (
    <ul className="grid list-none! gap-3 pl-0! sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.title}
          className="rounded-lg border border-b-default bg-surface-card p-4 pl-4!"
        >
          <p className="text-sm font-semibold text-t-primary">{item.title}</p>
          <p className="mt-1 text-xs leading-6 text-t-secondary">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-lg border border-brand/30 bg-brand-subtle px-4 py-3 text-sm leading-7 text-t-secondary">
      {children}
    </aside>
  );
}

/** "Open the simulator" call to action. */
export function SimulatorCta({
  title = "Try it now — no install, no sign-up",
  body = "Open the simulator, point it at your CSMS URL and connect. Everything runs in your browser.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-b-default bg-surface-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-semibold text-t-primary">{title}</p>
        <p className="mt-1 text-sm text-t-secondary">{body}</p>
      </div>
      <Link
        href="/"
        className={cn(buttonVariants({ size: "lg" }), "shrink-0 no-underline")}
      >
        Open the simulator <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}

"use client";

import { Keyboard } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ── Shortcut data ─────────────────────────────────────────────────────────── */
const GROUPS = [
  {
    group: "Panels",
    items: [
      { keys: ["Ctrl", "`"], label: "Toggle Log Panel" },
      { keys: ["Ctrl", "1"], label: "Toggle Config Panel" },
    ],
  },
  {
    group: "Charger",
    items: [
      { keys: ["Alt", "C"], label: "New charger" },
      { keys: ["Ctrl", "Enter"], label: "Connect / Disconnect" },
      {
        keys: ["←", "→"],
        label: "Switch charger (charger tabs focused)",
      },
    ],
  },
  {
    group: "Logs",
    items: [
      { keys: ["Ctrl", "S"], label: "Export logs as JSON" },
      { keys: ["Ctrl", "Shift", "S"], label: "Export logs as CSV" },
    ],
  },
  {
    group: "This dialog",
    items: [
      { keys: ["Ctrl", "/"], label: "Open / close shortcuts" },
      { keys: ["Esc"], label: "Close" },
    ],
  },
] as const;

/* ── Component ─────────────────────────────────────────────────────────────── */
export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);

  /* Ctrl+/ global toggle */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="neutral"
              size="icon"
              onClick={() => setOpen(true)}
              aria-label="Keyboard shortcuts (Ctrl+/)"
              className="size-8 rounded-md shrink-0"
            >
              <Keyboard className="size-4" aria-hidden="true" />
            </Button>
          }
        />
        <TooltipContent side="bottom">
          <div className="flex items-center gap-2 font-medium">
            <span>Keyboard shortcuts</span>
            <kbd className="text-2xs font-mono bg-surface-inset px-1 py-0.5 rounded border border-b-strong text-t-muted">
              Ctrl+/
            </kbd>
          </div>
        </TooltipContent>
      </Tooltip>

      <DialogContent
        showCloseButton
        className="sm:max-w-lg p-0 overflow-hidden bg-surface-card border border-b-strong rounded-xl shadow-2xl flex flex-col text-t-primary"
      >
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-b-subtle bg-surface-elevated">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-b-strong bg-surface-inset text-brand">
              <Keyboard className="size-4.5" aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-sm font-semibold text-t-primary">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="text-2xs text-t-muted">
                Quick keyboard navigation and actions across the simulator.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          {GROUPS.map(({ group, items }) => (
            <section key={group}>
              <h3 className="text-2xs font-semibold uppercase tracking-wider mb-2 text-t-muted">
                {group}
              </h3>
              <div className="rounded-lg border border-b-subtle bg-surface-base divide-y divide-b-subtle overflow-hidden">
                {items.map(({ keys, label }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 px-3.5 py-2 hover:bg-surface-hover/50 transition-colors"
                  >
                    <span className="text-xs text-t-secondary font-medium">
                      {label}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {keys.map((k, i) => (
                        <span
                          key={`${k}-${i?.toString()}`}
                          className="flex items-center gap-1"
                        >
                          <kbd className="px-1.5 py-0.5 rounded font-mono text-2xs font-medium bg-surface-elevated border border-b-strong text-t-primary shadow-xs leading-none">
                            {k}
                          </kbd>
                          {i < keys.length - 1 && (
                            <span className="text-2xs text-t-muted">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-b-subtle bg-surface-elevated flex items-center justify-between">
          <span className="text-2xs text-t-muted">
            Press{" "}
            <kbd className="font-mono font-medium text-t-primary bg-surface-inset px-1.5 py-0.5 rounded border border-b-strong text-2xs">
              Ctrl+/
            </kbd>{" "}
            anytime to toggle
          </span>
          <Button
            variant="neutral"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

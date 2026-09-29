"use client";

import { Keyboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconButton, PanelDialog, SectionHeading } from "./kit";

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
      { keys: ["Alt", "A"], label: "All chargers (search)" },
      { keys: ["Ctrl", "Enter"], label: "Connect / Disconnect" },
      {
        keys: ["Ctrl", "← / →"],
        label: "Switch charger tab",
      },
    ],
  },
  {
    group: "Charger tabs (tab focused)",
    items: [
      { keys: ["← / →"], label: "Move between tabs" },
      { keys: ["Ctrl", "Shift", "← / →"], label: "Move tab left / right" },
      { keys: ["F2"], label: "Rename charger" },
      { keys: ["Delete"], label: "Close tab" },
      { keys: ["Shift", "F10"], label: "Tab menu" },
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
export function ShortcutsDialog({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Render only the dialog — opened from a menu item via `open`. */
  hideTrigger?: boolean;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  // The global shortcut outlives renders, so read the latest values via refs.
  const openRef = useRef(open);
  openRef.current = open;
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  /* Ctrl+/ global toggle */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setOpenRef.current(!openRef.current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {!hideTrigger && (
        <Tooltip>
          <TooltipTrigger
            render={
              <IconButton
                label="Keyboard shortcuts"
                variant="neutral"
                onClick={() => setOpen(true)}
              >
                <Keyboard aria-hidden="true" />
              </IconButton>
            }
          />
          <TooltipContent side="bottom">
            Keyboard shortcuts <Kbd className="ml-1">Ctrl+/</Kbd>
          </TooltipContent>
        </Tooltip>
      )}

      <PanelDialog
        open={open}
        onOpenChange={setOpen}
        size="xl"
        icon={<Keyboard aria-hidden="true" />}
        title="Keyboard shortcuts"
        description="Everything in the simulator can be done from the keyboard."
        bodyClassName="gap-4 space-y-0 sm:columns-2 [&>section]:mb-4 [&>section]:break-inside-avoid"
        footer={
          <>
            <p className="text-2xs text-t-muted sm:mr-auto">
              Press <Kbd>Ctrl+/</Kbd> anywhere to open this list.
            </p>
            <Button variant="neutral" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {GROUPS.map(({ group, items }) => (
          <section key={group} aria-label={group}>
            <SectionHeading>{group}</SectionHeading>
            <dl className="divide-y divide-b-subtle overflow-hidden rounded-lg border border-b-default bg-surface-inset">
              {items.map(({ keys, label }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <dt className="text-xs text-t-secondary">{label}</dt>
                  <dd>
                    <KbdGroup>
                      {keys.map((k, i) => (
                        <span
                          key={`${k}-${i?.toString()}`}
                          className="flex items-center gap-1"
                        >
                          <Kbd>{k}</Kbd>
                          {i < keys.length - 1 && (
                            <span
                              aria-hidden="true"
                              className="text-2xs text-t-muted"
                            >
                              +
                            </span>
                          )}
                        </span>
                      ))}
                    </KbdGroup>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </PanelDialog>
    </>
  );
}

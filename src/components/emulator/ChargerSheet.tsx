"use client";

/**
 * "All chargers" sheet — the explorer to the tab strip's open files.
 * Lists every charger (open as a tab or not) with search and sorting, so a
 * large fleet never has to fit in the tab bar.
 */

import { ListX, Plus, Search, Trash2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { removeService } from "@/lib/ocppClient";
import { cn } from "@/lib/utils";
import { type ChargerSlot, useEmulatorStore } from "@/store/emulatorStore";
import { ConfirmAction, IconButton, OptionSelect } from "./kit";

export const CHARGER_STATUS: Record<
  string,
  { dot: string; label: string; rank: number }
> = {
  connected: { dot: "bg-success", label: "Connected", rank: 0 },
  connecting: { dot: "bg-warning", label: "Connecting", rank: 1 },
  faulted: { dot: "bg-danger", label: "Faulted", rank: 2 },
  disconnected: { dot: "bg-t-muted", label: "Disconnected", rank: 3 },
};

/** Disconnects every charger, then resets to one fresh default charger. */
export function removeAllChargers() {
  const s = useEmulatorStore.getState();
  // Drop sockets and timers first, or chargers stay connected to the CSMS
  // with no tab left to disconnect them.
  for (const c of s.chargers) removeService(c.id);
  s.removeAllChargers();
}

/** Copy for the "Remove all chargers" confirmation, shared by every entry point. */
export const removeAllCopy = (count: number) => ({
  title: `Remove all ${count} charger${count === 1 ? "" : "s"}?`,
  description:
    "Every charger disconnects from the CSMS, and its configuration, saved profiles and logs are deleted. A new empty charger is created so you can start again. This can't be undone.",
  confirmLabel: "Remove all chargers",
});

type SortKey = "tabs" | "name" | "status";
const SORTS: { label: string; value: SortKey }[] = [
  { label: "Tab order", value: "tabs" },
  { label: "Name (A–Z)", value: "name" },
  { label: "Status", value: "status" },
];

export function ChargerSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    chargers,
    openTabIds,
    activeChargerId,
    setActiveCharger,
    addCharger,
    removeCharger,
  } = useEmulatorStore();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("tabs");
  const countId = useId();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? chargers.filter((c) =>
          [c.label, c.config.chargePointId, c.config.endpoint].some((v) =>
            v.toLowerCase().includes(q),
          ),
        )
      : [...chargers];
    const tabPos = (c: ChargerSlot) => {
      const i = openTabIds.indexOf(c.id);
      return i < 0 ? Number.MAX_SAFE_INTEGER : i;
    };
    const status = (c: ChargerSlot) =>
      (CHARGER_STATUS[c.runtime.status] ?? CHARGER_STATUS.disconnected).rank;
    return filtered.sort((a, b) =>
      sort === "name"
        ? a.label.localeCompare(b.label, undefined, { numeric: true })
        : sort === "status"
          ? status(a) - status(b) || tabPos(a) - tabPos(b)
          : tabPos(a) - tabPos(b),
    );
  }, [chargers, openTabIds, query, sort]);

  const openCharger = (id: string) => {
    setActiveCharger(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full gap-0 p-0 sm:max-w-sm data-[side=left]:w-full"
      >
        <SheetHeader className="border-b border-b-subtle pr-12">
          <SheetTitle>All chargers</SheetTitle>
          <SheetDescription>
            {chargers.length} charger{chargers.length === 1 ? "" : "s"} ·{" "}
            {openTabIds.length} open as tabs. Select one to open it.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 border-b border-b-subtle p-4">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-t-muted"
            />
            <Input
              type="search"
              aria-label="Search chargers"
              aria-describedby={countId}
              placeholder="Search by name, charge point ID or URL"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p id={countId} role="status" className="text-2xs text-t-muted">
              {query
                ? `${rows.length} of ${chargers.length} match`
                : `${chargers.length} total`}
            </p>
            <OptionSelect
              size="sm"
              aria-label="Sort chargers"
              value={sort}
              options={SORTS}
              onChange={setSort}
              className="w-36"
            />
          </div>
        </div>

        {rows.length > 0 ? (
          <ul
            aria-label="Chargers"
            className="flex-1 overflow-y-auto custom-scrollbar p-2"
          >
            {rows.map((c) => {
              const st =
                CHARGER_STATUS[c.runtime.status] ?? CHARGER_STATUS.disconnected;
              const isActive = c.id === activeChargerId;
              const isOpen = openTabIds.includes(c.id);
              return (
                <li key={c.id} className="group/row flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openCharger(c.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-hover",
                      isActive && "bg-brand-subtle hover:bg-brand-subtle",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-2 shrink-0 rounded-full", st.dot)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-t-primary">
                          {c.label}
                        </span>
                        {isActive ? (
                          <Badge variant="brand" className="h-5">
                            Active
                          </Badge>
                        ) : isOpen ? (
                          <Badge variant="neutral" className="h-5">
                            Open
                          </Badge>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-2xs text-t-muted">
                        {c.config.chargePointId} · {st.label}
                      </span>
                    </span>
                  </button>
                  {chargers.length > 1 && (
                    <ConfirmAction
                      title={`Remove ${c.label}?`}
                      description="The charger disconnects from the CSMS and its configuration and logs are deleted. This can't be undone."
                      confirmLabel="Remove charger"
                      onConfirm={() => {
                        removeService(c.id);
                        removeCharger(c.id);
                      }}
                      trigger={
                        <IconButton
                          label={`Remove ${c.label}`}
                          size="icon-sm"
                          className="hover:text-danger"
                        >
                          <Trash2 aria-hidden="true" />
                        </IconButton>
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
            <p className="text-sm font-semibold text-t-secondary">
              No chargers match
            </p>
            <p className="text-xs text-t-muted">Try a different search.</p>
          </div>
        )}

        <SheetFooter className="flex-row border-t border-b-subtle">
          <Button
            className="flex-1"
            onClick={() => {
              addCharger();
              onOpenChange(false);
            }}
          >
            <Plus aria-hidden="true" />
            New charger
          </Button>
          <ConfirmAction
            {...removeAllCopy(chargers.length)}
            onConfirm={() => {
              removeAllChargers();
              onOpenChange(false);
            }}
            trigger={
              <Button variant="soft-danger">
                <ListX aria-hidden="true" />
                Remove all
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

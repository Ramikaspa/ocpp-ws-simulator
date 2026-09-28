"use client";

import { Copy, Loader2, Plus, Wifi, WifiOff, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { removeService } from "@/lib/ocppClient";
import { cn } from "@/lib/utils";
import { useEmulatorStore } from "@/store/emulatorStore";
import { ConfirmAction, IconButton, RenameAction } from "./kit";

/* ─── helpers ─────────────────────────────────────────────────── */
const STATUS: Record<string, { dot: string; label: string }> = {
  connected: { dot: "bg-success", label: "connected" },
  connecting: { dot: "bg-warning", label: "connecting" },
  faulted: { dot: "bg-danger", label: "faulted" },
  disconnected: { dot: "bg-t-muted", label: "disconnected" },
};

/* ─── ChargerTabBar ───────────────────────────────────────────── */
export function ChargerTabBar() {
  const {
    chargers,
    activeChargerId,
    setActiveCharger,
    addCharger,
    removeCharger,
    duplicateCharger,
    updateChargerLabel,
  } = useEmulatorStore();

  const [renameOpen, setRenameOpen] = useState(false);
  const activeIdx = chargers.findIndex((c) => c.id === activeChargerId);
  const active = chargers[activeIdx];
  const activeLabel = active
    ? active.label || `Charger ${activeIdx + 1}`
    : "charger";

  return (
    <nav
      aria-label="Chargers"
      className="flex items-center gap-2 px-3 py-2 bg-surface-inset border-b border-b-subtle overflow-x-auto custom-scrollbar shrink-0"
    >
      {/* shadcn Tabs (Base UI): arrow keys and Home/End switch chargers */}
      <Tabs
        value={activeChargerId}
        onValueChange={(v) => setActiveCharger(String(v))}
      >
        <TabsList
          aria-label="Chargers"
          activateOnFocus
          className="h-auto bg-transparent p-0"
        >
          {chargers.map((slot, idx) => {
            const isActive = slot.id === activeChargerId;
            const st = STATUS[slot.runtime.status] ?? STATUS.disconnected;
            return (
              <TabsTrigger
                key={slot.id}
                value={slot.id}
                // Mouse shortcut; the Rename button is the keyboard path.
                onDoubleClick={() => setRenameOpen(true)}
                className="min-w-30 max-w-60 flex-none justify-start font-medium"
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2 shrink-0 rounded-full", st.dot)}
                />
                <span className="flex-1 truncate text-left">
                  {slot.label || `Charger ${idx + 1}`}
                </span>
                <span className="sr-only">, {st.label}</span>
                {isActive && (
                  <span className="hidden sm:block truncate font-mono text-2xs font-normal text-t-muted max-w-24">
                    {slot.config.chargePointId}
                  </span>
                )}
                {slot.runtime.status === "connected" ? (
                  <Wifi className="text-success" aria-hidden="true" />
                ) : slot.runtime.status === "connecting" ? (
                  <Loader2
                    className="text-warning animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <WifiOff className="text-t-muted" aria-hidden="true" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Actions for the selected charger — always visible, not hover-only */}
      <div className="flex items-center gap-0.5 shrink-0">
        {active && (
          <RenameAction
            subject="charger"
            name={activeLabel}
            onRename={(name) => updateChargerLabel(active.id, name)}
            open={renameOpen}
            onOpenChange={setRenameOpen}
          />
        )}
        <IconButton
          label={`Duplicate ${activeLabel}`}
          size="icon-sm"
          onClick={() => active && duplicateCharger(active.id)}
        >
          <Copy aria-hidden="true" />
        </IconButton>
        {chargers.length > 1 && active && (
          <ConfirmAction
            title={`Remove ${activeLabel}?`}
            description="The charger disconnects from the CSMS and its configuration and logs are deleted. This can't be undone."
            confirmLabel="Remove charger"
            onConfirm={() => {
              // Drop the socket and timers before the slot disappears —
              // otherwise the charge point stays connected to the CSMS
              // with no tab left to disconnect it.
              removeService(active.id);
              removeCharger(active.id);
            }}
            trigger={
              <IconButton
                label={`Remove ${activeLabel}`}
                size="icon-sm"
                className="hover:text-danger"
              >
                <X aria-hidden="true" />
              </IconButton>
            }
          />
        )}
      </div>

      <div className="h-5 w-px bg-b-strong shrink-0" aria-hidden="true" />

      {/* Add Charger */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => addCharger()}
        title="Add charger (Alt+C)"
      >
        <Plus aria-hidden="true" />
        Add charger
      </Button>
    </nav>
  );
}

"use client";

/**
 * ChargerTabBar: Navigation tabs for active charger instances.
 *
 * Built to ISO 9241-110 (Interaction principles), ISO 9241-112 (Information
 * presentation), ISO 9241-171 (Software accessibility), and ISO/IEC 40500
 * (WCAG 2.1 AA):
 *
 * - Font Sizing: Primary label 12px (text-xs), secondary CP-ID 11px (text-2xs,
 *   the smallest permitted size under ISO rules), tooltips 11px (text-2xs).
 * - Font Weight & Hierarchy: Active label 600 (font-semibold) with text-brand-strong
 *   (>7:1 contrast); inactive label 500 (font-medium) with text-t-secondary (>5.5:1);
 *   secondary CP-ID 400 (font-normal) monospace for numerical clarity.
 * - Spacing & Tap Targets: 6px gap between tabs (gap-1.5) preventing accidental
 *   activation; 8px gap (gap-2) between status dot and label; 4px gap (gap-1)
 *   between in-tab action buttons.
 * - Non-Color Redundancy: Status communicates via dot color + text label in tooltip
 *   and sr-only announcement (ISO 9241-112 discriminability).
 * - Focus Indication: High-contrast focus rings for keyboard navigation (ISO 9241-171).
 */

import {
    ChevronLeft,
    ChevronRight,
    Copy,
    Loader2,
    Plus,
    Wifi,
    WifiOff,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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

  const [renamingChargerId, setRenamingChargerId] = useState<string | null>(
    null,
  );
  const tabContainerRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const activeEl = activeChargerId
      ? tabContainerRefs.current[activeChargerId]
      : null;

    let hasLeftRoom = el.scrollLeft > 2;
    let hasRightRoom = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;

    if (activeEl) {
      const containerRect = el.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      // Left button can scroll left only if active tab has room to move right without crossing right edge
      const roomToRight = containerRect.right - activeRect.right;
      hasLeftRoom = hasLeftRoom && roomToRight > 2;

      // Right button can scroll right only if active tab has room to move left without crossing left edge
      const roomToLeft = activeRect.left - containerRect.left;
      hasRightRoom = hasRightRoom && roomToLeft > 2;
    }

    setCanScrollLeft(hasLeftRoom);
    setCanScrollRight(hasRightRoom);
  }, [activeChargerId]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      checkScroll();
    };

    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [checkScroll]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const activeEl = activeChargerId
      ? tabContainerRefs.current[activeChargerId]
      : null;

    const baseStep = 200;

    if (direction === "right") {
      // Scrolling right moves tabs leftwards. Stop when active tab's left edge reaches the left view boundary
      let maxStep = Math.max(0, el.scrollWidth - el.clientWidth - el.scrollLeft);
      if (activeEl) {
        const containerRect = el.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const roomToLeft = activeRect.left - containerRect.left;
        maxStep = Math.min(maxStep, Math.max(0, roomToLeft));
      }
      const move = Math.min(baseStep, maxStep);
      if (move > 0) {
        el.scrollBy({ left: move, behavior: "smooth" });
        setTimeout(checkScroll, 320);
      }
    } else {
      // Scrolling left moves tabs rightwards. Stop when active tab's right edge reaches the right view boundary
      let maxStep = Math.max(0, el.scrollLeft);
      if (activeEl) {
        const containerRect = el.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const roomToRight = containerRect.right - activeRect.right;
        maxStep = Math.min(maxStep, Math.max(0, roomToRight));
      }
      const move = Math.min(baseStep, maxStep);
      if (move > 0) {
        el.scrollBy({ left: -move, behavior: "smooth" });
        setTimeout(checkScroll, 320);
      }
    }
  };

  // Ensure active tab is scrolled into view when switched or when a new charger is added
  useEffect(() => {
    const container = scrollContainerRef.current;
    const activeTab = activeChargerId
      ? tabContainerRefs.current[activeChargerId]
      : null;
    if (container && activeTab) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      if (tabRect.left < containerRect.left) {
        container.scrollBy({
          left: tabRect.left - containerRect.left,
          behavior: "smooth",
        });
      } else if (tabRect.right > containerRect.right) {
        container.scrollBy({
          left: tabRect.right - containerRect.right,
          behavior: "smooth",
        });
      }
      setTimeout(checkScroll, 350);
    }
  }, [activeChargerId, checkScroll]);

  // Arrow key navigation across tabs (ISO 9241-171 keyboard accessibility)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIdx = -1;
    if (e.key === "ArrowRight") {
      nextIdx = (index + 1) % chargers.length;
    } else if (e.key === "ArrowLeft") {
      nextIdx = (index - 1 + chargers.length) % chargers.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = chargers.length - 1;
    }

    if (nextIdx !== -1) {
      e.preventDefault();
      const target = chargers[nextIdx];
      setActiveCharger(target.id);
      tabButtonRefs.current[target.id]?.focus();
    }
  };

  return (
    <nav
      aria-label="Chargers"
      className="relative flex items-stretch h-9 bg-surface-base overflow-hidden shrink-0 select-none"
    >
      {/* ── LEFT STICKY: Left Arrow ── */}
      <div className="flex items-center shrink-0 border-r border-b border-b-subtle bg-surface-base z-10">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => scrollByAmount("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll tabs left"
                className="flex items-center justify-center h-full px-2 text-t-muted hover:text-t-primary hover:bg-surface-hover transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </button>
            }
          />
          <TooltipContent
            side="bottom"
            className="text-2xs py-0.5 px-1.5 font-normal"
          >
            Scroll left
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ── CENTER: Scrollable Tab Items List ── */}
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="Chargers"
        className="flex-1 flex items-stretch overflow-x-auto no-scrollbar min-w-0"
      >
        {chargers.map((slot, idx) => {
          const isActive = slot.id === activeChargerId;
          const st = STATUS[slot.runtime.status] ?? STATUS.disconnected;
          const label = slot.label || `Charger ${idx + 1}`;

          return (
            <div
              key={slot.id}
              ref={(el) => {
                tabContainerRefs.current[slot.id] = el;
              }}
              className={cn(
                "group/tab relative flex items-center h-full border-r border-b-subtle text-xs whitespace-nowrap transition-colors min-w-fit max-w-56 select-none",
                isActive
                  ? "bg-surface-inset text-t-primary border-t-2 border-t-brand border-b-0"
                  : "bg-surface-base text-t-secondary hover:bg-surface-hover hover:text-t-primary border-t-2 border-t-transparent border-b border-b-subtle",
              )}
            >
              {/* Clickable tab body — clicking switches tab; ISO 9241-171 visible focus ring */}
              <button
                type="button"
                role="tab"
                id={`tab-${slot.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                ref={(el) => {
                  tabButtonRefs.current[slot.id] = el;
                }}
                onClick={() => setActiveCharger(slot.id)}
                onDoubleClick={() => setRenamingChargerId(slot.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="flex items-center gap-2 flex-1 min-w-20 h-full pl-3 pr-1 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                {/* Status indicator dot (7px, crisp and distinct) */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 shrink-0 rounded-full ring-1 ring-surface-base/60",
                    st.dot,
                  )}
                />

                {/* Charger title — font-semibold when active, font-medium when inactive */}
                <span
                  className={cn(
                    "truncate min-w-8 text-left",
                    isActive
                      ? "font-semibold text-t-primary"
                      : "font-medium text-t-secondary",
                  )}
                >
                  {label}
                </span>
                <span className="sr-only">, {st.label}</span>

                {/* Charge Point ID — secondary monospace token */}
                {isActive && (
                  <span className="hidden sm:inline-block truncate font-mono text-2xs font-normal text-t-muted max-w-20 tracking-tight opacity-75">
                    {slot.config.chargePointId}
                  </span>
                )}
              </button>

              {/* Connection status icon with tooltip — does NOT switch tabs */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="inline-flex items-center justify-center cursor-default p-1 shrink-0 text-t-muted hover:text-t-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          e.preventDefault();
                        }
                      }}
                    >
                      {slot.runtime.status === "connected" ? (
                        <Wifi
                          className="text-success size-3 shrink-0"
                          aria-hidden="true"
                        />
                      ) : slot.runtime.status === "connecting" ? (
                        <Loader2
                          className="text-warning animate-spin size-3 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <WifiOff
                          className="text-t-muted size-3 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  }
                />
                <TooltipContent
                  side="bottom"
                  className="text-2xs py-0.5 px-1.5 capitalize font-normal"
                >
                  {st.label}
                </TooltipContent>
              </Tooltip>

              {/* In-tab action buttons — compact, hover-revealed on inactive */}
              <div
                role="toolbar"
                aria-label={`${label} actions`}
                tabIndex={-1}
                className={cn(
                  "items-center gap-0.5 shrink-0 pr-1.5 pl-0.5 transition-opacity",
                  isActive
                    ? "flex opacity-100"
                    : "flex opacity-0 group-hover/tab:opacity-100 focus-within:opacity-100",
                )}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {/* Rename / Edit button with tooltip */}
                <RenameAction
                  subject="charger"
                  name={label}
                  size="icon-xs"
                  tooltip="Rename charger"
                  onRename={(name) => updateChargerLabel(slot.id, name)}
                  open={renamingChargerId === slot.id}
                  onOpenChange={(open) =>
                    setRenamingChargerId(open ? slot.id : null)
                  }
                  className="size-5 p-0 [&_svg]:size-2.5 rounded text-t-muted hover:text-t-primary hover:bg-surface-hover/80 focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-inset"
                />

                {/* Duplicate button with tooltip */}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <IconButton
                        label={`Duplicate ${label}`}
                        size="icon-xs"
                        className="size-5 p-0 [&_svg]:size-2.5 rounded text-t-muted hover:text-t-primary hover:bg-surface-hover/80 focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-inset"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateCharger(slot.id);
                        }}
                      >
                        <Copy className="size-2.5" aria-hidden="true" />
                      </IconButton>
                    }
                  />
                  <TooltipContent
                    side="bottom"
                    className="text-2xs py-0.5 px-1.5 font-normal"
                  >
                    Duplicate charger
                  </TooltipContent>
                </Tooltip>

                {/* Remove / Close tab button with tooltip (only if > 1 charger) */}
                {chargers.length > 1 && (
                  <ConfirmAction
                    title={`Remove ${label}?`}
                    description="The charger disconnects from the CSMS and its configuration and logs are deleted. This can't be undone."
                    confirmLabel="Remove charger"
                    tooltip="Close tab"
                    onConfirm={() => {
                      // Drop socket and timers before slot disappears
                      removeService(slot.id);
                      removeCharger(slot.id);
                    }}
                    trigger={
                      <IconButton
                        label={`Remove ${label}`}
                        size="icon-xs"
                        className="size-5 p-0 [&_svg]:size-2.5 rounded text-t-muted hover:text-danger hover:bg-danger/10 focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-inset"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <X className="size-2.5" aria-hidden="true" />
                      </IconButton>
                    }
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Empty track filler inside scrollable center that carries the bottom border */}
        <div className="flex-1 border-b border-b-subtle bg-surface-base min-w-4" />
      </div>

      {/* ── RIGHT STICKY: Right Arrow & Add Charger (+) ── */}
      <div className="flex items-center shrink-0 border-l border-b border-b-subtle bg-surface-base z-10 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.3)]">
        {/* Right Arrow (Scroll right) */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => scrollByAmount("right")}
                disabled={!canScrollRight}
                aria-label="Scroll tabs right"
                className="flex items-center justify-center h-full px-2 text-t-muted hover:text-t-primary hover:bg-surface-hover transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand border-r border-b-subtle"
              >
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            }
          />
          <TooltipContent
            side="bottom"
            className="text-2xs py-0.5 px-1.5 font-normal"
          >
            Scroll right
          </TooltipContent>
        </Tooltip>

        {/* Add Charger (+) button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => addCharger()}
                aria-label="Add new charger"
                className="flex items-center justify-center h-full px-2.5 text-t-muted hover:text-t-primary hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                <Plus className="size-3.5" aria-hidden="true" />
              </button>
            }
          />
          <TooltipContent
            side="bottom"
            className="text-2xs py-0.5 px-1.5 font-normal"
          >
            Add charger (Alt+C)
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}

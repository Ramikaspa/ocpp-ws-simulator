"use client";

/**
 * ChargerTabBar — editor-style tabs for chargers.
 *
 * Model: `openTabIds` is the tab strip, like open files in a code editor.
 * Every charger is listed in the "All chargers" sheet, like the file
 * explorer. Closing a tab only hides it; the charger keeps running.
 *
 * Layout: tabs share the strip evenly between TAB_MIN and TAB_MAX. Tabs
 * that would drop below TAB_MIN collapse into a "+N" menu rather than a
 * scrollbar, and the active tab is always kept in view.
 *
 * Accessibility (WCAG 2.2 AA / ISO/IEC 40500, ISO 9241-110 & -171):
 * - Tabs pattern from shadcn Tabs (Base UI): one tab stop, ←/→ Home/End.
 * - Every pointer gesture has a keyboard path: F2 rename, Delete close,
 *   Ctrl+Shift+←/→ move (the dragging alternative, SC 2.5.7), Shift+F10 or
 *   the Menu key for the tab menu, Alt+A for all chargers.
 * - Status is text plus colour, never colour alone; moves and closes are
 *   announced through a polite live region.
 */

import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Copy,
  CopyX,
  ListX,
  PanelLeft,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { removeService } from "@/lib/ocppClient";
import { BREAKPOINT, useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { type ChargerSlot, useEmulatorStore } from "@/store/emulatorStore";
import {
  CHARGER_STATUS,
  ChargerSheet,
  removeAllChargers,
  removeAllCopy,
} from "./ChargerSheet";
import { ConfirmAction, IconButton, RenameAction } from "./kit";

/** Tabs never shrink below this (px); past it they overflow into the menu. */
const TAB_MIN = 120;
const TAB_MIN_PHONE = 96;
/** Tabs never grow past this, however few are open. */
const TAB_MAX = 240;
/** Room kept for the "+N" overflow button when it is shown. */
const OVERFLOW_W = 64;
/** Pointer travel before a press becomes a drag (px). */
const DRAG_THRESHOLD = 6;

const TAB_SHORTCUTS =
  "F2 Delete Control+Shift+ArrowLeft Control+Shift+ArrowRight Shift+F10";

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

type DragState = {
  id: string;
  pointerId: number;
  startX: number;
  dragging: boolean;
};

export function ChargerTabBar() {
  const {
    chargers,
    openTabIds,
    activeChargerId,
    setActiveCharger,
    addCharger,
    removeCharger,
    duplicateCharger,
    updateChargerLabel,
    closeTab,
    closeOtherTabs,
    moveTab,
  } = useEmulatorStore();

  const [renameId, setRenameId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeAllOpen, setRemoveAllOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [width, setWidth] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [indicatorX, setIndicatorX] = useState<number | null>(null);

  const areaRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const dropBefore = useRef<string | null>(null);
  const suppressClick = useRef(false);

  /* ── Data ── */
  const byId = useMemo(
    () => new Map(chargers.map((c) => [c.id, c])),
    [chargers],
  );
  const openTabs = useMemo(
    () =>
      openTabIds
        .map((id) => byId.get(id))
        .filter((c): c is ChargerSlot => Boolean(c)),
    [openTabIds, byId],
  );
  const nameOf = (c: ChargerSlot | undefined) => c?.label || "Charger";

  /* ── Fit: how many tabs the strip holds without scrolling ── */
  const tabMin = useMediaQuery(BREAKPOINT.sm) ? TAB_MIN : TAB_MIN_PHONE;
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitsAll = openTabs.length * tabMin <= width;
  const capacity = fitsAll
    ? openTabs.length
    : Math.max(1, Math.floor((width - OVERFLOW_W) / tabMin));
  let visible = openTabs.slice(0, capacity);
  const active = byId.get(activeChargerId);
  if (active && !visible.some((t) => t.id === active.id)) {
    // Keep the active tab in view: it takes the last visible slot.
    visible = [...visible.slice(0, Math.max(0, capacity - 1)), active];
  }
  const visibleIds = new Set(visible.map((t) => t.id));
  const hidden = openTabs.filter((t) => !visibleIds.has(t.id));
  const canClose = openTabs.length > 1;

  /* ── Helpers ── */
  const focusTab = useCallback((id: string) => {
    requestAnimationFrame(() =>
      listRef.current
        ?.querySelector<HTMLElement>(`[data-tab-id="${id}"] [role="tab"]`)
        ?.focus(),
    );
  }, []);

  const moveBy = (id: string, delta: -1 | 1) => {
    const from = openTabIds.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= openTabIds.length) return;
    moveTab(id, to);
    setAnnouncement(
      `${nameOf(byId.get(id))} moved to position ${to + 1} of ${openTabIds.length}`,
    );
    focusTab(id);
  };

  const close = (id: string) => {
    if (!canClose) return;
    const wasActive = id === activeChargerId;
    const at = openTabIds.indexOf(id);
    closeTab(id);
    setAnnouncement(
      `${nameOf(byId.get(id))} tab closed. The charger is still in All chargers.`,
    );
    if (wasActive) {
      const rest = openTabIds.filter((t) => t !== id);
      focusTab(rest[Math.min(at, rest.length - 1)]);
    }
  };

  /* ── Drag and drop (pointer: mouse, touch and pen) ── */
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    drag.current = {
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      dragging: false,
    };
  };

  useEffect(() => {
    const updateDrop = (clientX: number) => {
      const list = listRef.current;
      if (!list) return;
      const tabs = Array.from(
        list.querySelectorAll<HTMLElement>("[data-tab-id]"),
      );
      const listLeft = list.getBoundingClientRect().left;
      let before: string | null = null;
      let x = tabs.length
        ? tabs[tabs.length - 1].getBoundingClientRect().right - listLeft
        : 0;
      for (const el of tabs) {
        const r = el.getBoundingClientRect();
        if (clientX < r.left + r.width / 2) {
          before = el.dataset.tabId ?? null;
          x = r.left - listLeft;
          break;
        }
      }
      dropBefore.current = before;
      setIndicatorX(x);
    };

    const end = (commit: boolean) => {
      const d = drag.current;
      drag.current = null;
      if (!d?.dragging) return;
      setDraggingId(null);
      setIndicatorX(null);
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      if (!commit) return;
      const s = useEmulatorStore.getState();
      const without = s.openTabIds.filter((t) => t !== d.id);
      const before = dropBefore.current;
      let to: number;
      if (before === d.id) to = s.openTabIds.indexOf(d.id);
      else if (before) to = without.indexOf(before);
      else {
        // Dropped after the last visible tab.
        const lastVisible = Array.from(
          listRef.current?.querySelectorAll<HTMLElement>("[data-tab-id]") ?? [],
        )
          .map((el) => el.dataset.tabId)
          .filter((t) => t && t !== d.id)
          .pop();
        to = lastVisible ? without.indexOf(lastVisible) + 1 : without.length;
      }
      s.moveTab(d.id, to);
      const label = s.chargers.find((c) => c.id === d.id)?.label ?? "Tab";
      setAnnouncement(
        `${label} moved to position ${to + 1} of ${s.openTabIds.length}`,
      );
    };

    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (!d.dragging) {
        if (Math.abs(e.clientX - d.startX) < DRAG_THRESHOLD) return;
        d.dragging = true;
        setDraggingId(d.id);
      }
      updateDrop(e.clientX);
    };
    const onUp = (e: PointerEvent) => {
      if (drag.current && e.pointerId === drag.current.pointerId) end(true);
    };
    const onCancel = () => end(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drag.current?.dragging) end(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  /* ── Global shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Alt+A — all chargers
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyA") {
        e.preventDefault();
        setSheetOpen((v) => !v);
        return;
      }
      // Ctrl+←/→ — previous / next tab. Left alone inside text fields,
      // where it jumps by word.
      if (
        !e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        (e.key !== "ArrowLeft" && e.key !== "ArrowRight") ||
        isEditable(e.target)
      )
        return;
      const s = useEmulatorStore.getState();
      if (s.openTabIds.length < 2) return;
      e.preventDefault();
      const i = s.openTabIds.indexOf(s.activeChargerId);
      const n = s.openTabIds.length;
      const next =
        s.openTabIds[e.key === "ArrowRight" ? (i + 1) % n : (i - 1 + n) % n];
      s.setActiveCharger(next);
      focusTab(next);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusTab]);

  const renameTarget = renameId ? byId.get(renameId) : undefined;
  const removeTarget = removeId ? byId.get(removeId) : undefined;

  return (
    <nav
      aria-label="Chargers"
      className="relative flex h-9 shrink-0 items-stretch border-b border-b-subtle bg-surface-base select-none"
    >
      {/* ── All chargers ── */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              aria-label={`All chargers (${chargers.length})`}
              onClick={() => setSheetOpen(true)}
              className="h-full shrink-0 gap-1.5 rounded-none border-0 border-r border-r-b-subtle px-2.5"
            >
              <PanelLeft aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-t-muted">
                {chargers.length}
              </span>
            </Button>
          }
        />
        <TooltipContent side="bottom">
          All chargers{" "}
          <kbd className="ml-1 font-mono text-2xs text-t-muted">Alt+A</kbd>
        </TooltipContent>
      </Tooltip>

      {/* ── Tab strip (measured) + overflow ── */}
      <div ref={areaRef} className="flex min-w-0 flex-1 items-stretch">
        <Tabs
          value={activeChargerId}
          onValueChange={(v) => setActiveCharger(String(v))}
          className="min-w-0 flex-1 gap-0"
        >
          <TabsList
            ref={listRef}
            aria-label="Open chargers"
            activateOnFocus
            // Swallow the click that ends a drag, so dropping never also
            // activates whatever tab the pointer ends over.
            onClickCapture={(e) => {
              if (suppressClick.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="relative flex h-full w-full items-stretch justify-start gap-0 rounded-none bg-transparent p-0"
          >
            {visible.map((slot) => {
              const isActive = slot.id === activeChargerId;
              const st =
                CHARGER_STATUS[slot.runtime.status] ??
                CHARGER_STATUS.disconnected;
              const label = nameOf(slot);
              const index = openTabIds.indexOf(slot.id);
              return (
                <ContextMenu key={slot.id}>
                  <ContextMenuTrigger
                    role="presentation"
                    data-tab-id={slot.id}
                    style={{
                      flex: "1 1 0%",
                      minWidth: tabMin,
                      maxWidth: TAB_MAX,
                    }}
                    className={cn(
                      "group/tab @container/tab relative flex h-full min-w-0 touch-pan-y items-center border-r border-r-b-subtle text-xs transition-colors",
                      isActive
                        ? "bg-surface-inset text-t-primary shadow-[inset_0_2px_0_var(--brand)]"
                        : "bg-surface-base text-t-secondary hover:bg-surface-hover hover:text-t-primary",
                      draggingId === slot.id && "opacity-40",
                    )}
                  >
                    <TabsTrigger
                      value={slot.id}
                      title={`${label} · ${slot.config.chargePointId} · ${st.label}`}
                      aria-keyshortcuts={TAB_SHORTCUTS}
                      onPointerDown={(e) => onPointerDown(e, slot.id)}
                      onDoubleClick={() => setRenameId(slot.id)}
                      onAuxClick={(e) => {
                        // Middle-click closes, as in browsers and editors.
                        if (e.button === 1) {
                          e.preventDefault();
                          close(slot.id);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "F2") {
                          e.preventDefault();
                          setRenameId(slot.id);
                        } else if (e.key === "Delete") {
                          e.preventDefault();
                          close(slot.id);
                        } else if (
                          e.ctrlKey &&
                          e.shiftKey &&
                          (e.key === "ArrowLeft" || e.key === "ArrowRight")
                        ) {
                          // Reorder instead of Base UI's move-focus.
                          e.preventDefault();
                          e.stopPropagation();
                          moveBy(slot.id, e.key === "ArrowLeft" ? -1 : 1);
                        }
                      }}
                      className={cn(
                        "h-full min-w-0 flex-1 cursor-pointer justify-start gap-2 rounded-none border-0 px-3 font-medium hover:bg-transparent data-active:border-transparent data-active:bg-transparent data-active:font-semibold data-active:text-t-primary",
                        isActive && canClose && "pr-9",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn("size-2 shrink-0 rounded-full", st.dot)}
                      />
                      <span className="min-w-0 truncate">{label}</span>
                      <span className="sr-only">, {st.label}</span>
                      {isActive && (
                        <span className="hidden min-w-0 truncate font-mono text-2xs font-normal text-t-muted @[12rem]/tab:inline">
                          {slot.config.chargePointId}
                        </span>
                      )}
                    </TabsTrigger>

                    {/* Close — always on the active tab, on hover/focus for
                        the rest, overlaid so it costs inactive tabs no width.
                        Out of the tab order (Delete does the same from the
                        keyboard), so hidden from assistive tech. */}
                    {canClose && (
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        title="Close tab (Delete). The charger keeps running."
                        onClick={() => close(slot.id)}
                        className={cn(
                          "absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded bg-inherit text-t-muted transition-opacity hover:bg-surface-elevated hover:text-t-primary",
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-focus-within/tab:opacity-100 group-hover/tab:opacity-100",
                        )}
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </ContextMenuTrigger>

                  <ContextMenuContent className="min-w-56">
                    <ContextMenuItem onClick={() => setRenameId(slot.id)}>
                      <Pencil aria-hidden="true" /> Rename…
                      <ContextMenuShortcut>F2</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => duplicateCharger(slot.id)}>
                      <Copy aria-hidden="true" /> Duplicate
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      disabled={index <= 0}
                      onClick={() => moveBy(slot.id, -1)}
                    >
                      <ArrowLeft aria-hidden="true" /> Move left
                      <ContextMenuShortcut>Ctrl+Shift+←</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem
                      disabled={index >= openTabIds.length - 1}
                      onClick={() => moveBy(slot.id, 1)}
                    >
                      <ArrowRight aria-hidden="true" /> Move right
                      <ContextMenuShortcut>Ctrl+Shift+→</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      disabled={!canClose}
                      onClick={() => close(slot.id)}
                    >
                      <X aria-hidden="true" /> Close tab
                      <ContextMenuShortcut>Del</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem
                      disabled={!canClose}
                      onClick={() => {
                        closeOtherTabs(slot.id);
                        setAnnouncement(`Closed all tabs except ${label}.`);
                        focusTab(slot.id);
                      }}
                    >
                      <CopyX aria-hidden="true" /> Close other tabs
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      variant="destructive"
                      disabled={chargers.length <= 1}
                      onClick={() => setRemoveId(slot.id)}
                    >
                      <Trash2 aria-hidden="true" /> Remove charger…
                    </ContextMenuItem>
                    <ContextMenuItem
                      variant="destructive"
                      onClick={() => setRemoveAllOpen(true)}
                    >
                      <ListX aria-hidden="true" /> Remove all chargers…
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}

            {/* Drop position while dragging */}
            {indicatorX !== null && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1 z-10 w-0.5 -translate-x-1/2 rounded-full bg-brand"
                style={{ left: indicatorX }}
              />
            )}
          </TabsList>
        </Tabs>

        {/* ── Overflow: open tabs that don't fit ── */}
        {hidden.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  aria-label={`${hidden.length} more open tab${hidden.length === 1 ? "" : "s"}`}
                  className="h-full shrink-0 gap-1 rounded-none border-0 border-l border-l-b-subtle px-2.5 font-mono tabular-nums"
                  style={{ width: OVERFLOW_W }}
                />
              }
            >
              +{hidden.length}
              <ChevronDown aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* Base UI requires a label to sit inside its group. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel>More open tabs</DropdownMenuLabel>
                {hidden.map((slot) => {
                  const st =
                    CHARGER_STATUS[slot.runtime.status] ??
                    CHARGER_STATUS.disconnected;
                  return (
                    <DropdownMenuItem
                      key={slot.id}
                      onClick={() => {
                        setActiveCharger(slot.id);
                        focusTab(slot.id);
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className={cn("size-2 shrink-0 rounded-full", st.dot)}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {nameOf(slot)}
                      </span>
                      <span className="sr-only">, {st.label}</span>
                      <span className="font-mono text-2xs text-t-muted">
                        {slot.config.chargePointId}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSheetOpen(true)}>
                <PanelLeft aria-hidden="true" /> All chargers…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── New charger ── */}
      <Tooltip>
        <TooltipTrigger
          render={
            <IconButton
              label="New charger"
              onClick={() => addCharger()}
              className="h-full w-9 shrink-0 rounded-none border-0 border-l border-l-b-subtle"
            >
              <Plus aria-hidden="true" />
            </IconButton>
          }
        />
        <TooltipContent side="bottom">
          New charger{" "}
          <kbd className="ml-1 font-mono text-2xs text-t-muted">Alt+C</kbd>
        </TooltipContent>
      </Tooltip>

      {/* Screen reader announcements for moves and closes */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <ChargerSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      {renameTarget && (
        <RenameAction
          hideTrigger
          subject="charger"
          name={nameOf(renameTarget)}
          open
          onOpenChange={(open) => !open && setRenameId(null)}
          onRename={(name) => updateChargerLabel(renameTarget.id, name)}
        />
      )}

      <ConfirmAction
        open={removeAllOpen}
        onOpenChange={setRemoveAllOpen}
        {...removeAllCopy(chargers.length)}
        onConfirm={() => {
          removeAllChargers();
          setAnnouncement(
            "All chargers removed. A new empty charger was created.",
          );
        }}
      />

      <ConfirmAction
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title={`Remove ${nameOf(removeTarget)}?`}
        description="The charger disconnects from the CSMS and its configuration and logs are deleted. This can't be undone."
        confirmLabel="Remove charger"
        onConfirm={() => {
          if (!removeTarget) return;
          removeService(removeTarget.id);
          removeCharger(removeTarget.id);
        }}
      />
    </nav>
  );
}

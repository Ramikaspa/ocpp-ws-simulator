"use client";

import {
  Activity,
  AlertTriangle,
  AlignLeft,
  ArrowDownLeft,
  ArrowUpToLine,
  Braces,
  CheckCheck,
  ChevronRight,
  Copy,
  Download,
  FileSpreadsheet,
  Info,
  PanelBottomClose,
  Radio,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JsonViewer } from "@/components/ui/json-viewer";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useActiveCharger } from "@/hooks/useActiveCharger";
import { cn } from "@/lib/utils";
import type { OCPPLog } from "@/store/emulatorStore";
import { ConfirmAction, IconButton, Notice } from "./kit";

/* ═══════════════════════════════════════════════════════
   DIRECTION CONFIG
   Direction is spelled out in the badge; colour only reinforces it.
   ═══════════════════════════════════════════════════════ */
const DIR: Record<
  string,
  {
    edge: string;
    badge: "warning" | "success" | "info" | "danger";
    icon: React.ElementType;
    label: string;
    long: string;
  }
> = {
  Tx: {
    edge: "border-l-warning",
    badge: "warning",
    icon: Zap,
    label: "TX",
    long: "Sent",
  },
  Rx: {
    edge: "border-l-success",
    badge: "success",
    icon: ArrowDownLeft,
    label: "RX",
    long: "Received",
  },
  System: {
    edge: "border-l-info",
    badge: "info",
    icon: Info,
    label: "SYS",
    long: "System",
  },
  Error: {
    edge: "border-l-danger",
    badge: "danger",
    icon: AlertTriangle,
    label: "ERR",
    long: "Error",
  },
};

/* ═══════════════════════════════════════════════════════
   LOG ENTRY
   ═══════════════════════════════════════════════════════ */
function LogEntry({ log, isNew }: { log: OCPPLog; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"parsed" | "raw">("parsed");
  const [copied, setCopied] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const detailsId = useId();

  const cfg = DIR[log.direction] ?? DIR.System;
  const Icon = cfg.icon;

  const t = new Date(log.timestamp);
  const time = t.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const ms = t.getMilliseconds().toString().padStart(3, "0");

  const fullRaw = log.rawMessage ?? JSON.stringify(log, null, 2);
  const hasPayload = log.payload !== undefined && log.payload !== null;

  const copyFull = () => {
    navigator.clipboard.writeText(fullRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 1800);
  };
  const download = () => {
    const blob = new Blob([fullRaw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${log.action}_${log.ocppMessageId ?? log.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = (
    <>
      <Badge variant={cfg.badge} className="h-5 px-1.5 font-mono">
        <Icon aria-hidden="true" />
        <span aria-hidden="true">{cfg.label}</span>
        <span className="sr-only">{cfg.long}</span>
      </Badge>
      <span className="shrink-0 font-mono text-xs text-t-muted tabular-nums">
        {time}
        <span className="text-t-faint">.{ms}</span>
      </span>
      <span
        className={cn(
          "flex-1 min-w-0 truncate text-left text-xs",
          log.direction === "Error" ? "text-danger" : "text-t-primary",
          isNew ? "font-semibold" : "font-medium",
        )}
      >
        {log.action}
      </span>
    </>
  );

  return (
    <li
      className={cn(
        "group flex flex-col border-l-[3px] transition-colors",
        cfg.edge,
        expanded ? "bg-surface-card" : "hover:bg-surface-hover/60",
      )}
    >
      {/* ── Row ── */}
      <div className="flex items-center gap-1 pr-2">
        {hasPayload ? (
          <Button
            variant="ghost"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => setExpanded(!expanded)}
            className="h-auto flex-1 min-w-0 justify-start gap-2 rounded-none px-2.5 py-2 font-normal hover:bg-transparent aria-expanded:bg-transparent"
          >
            {summary}
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "size-3.5 shrink-0 text-t-muted transition-transform",
                expanded && "rotate-90",
              )}
            />
          </Button>
        ) : (
          <div className="flex flex-1 min-w-0 items-center gap-2 px-2.5 py-2">
            {summary}
          </div>
        )}

        {/* Copy + download: shown on hover and whenever keyboard focus is inside */}
        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <IconButton
            label={copied ? "Copied" : `Copy ${log.action} message`}
            size="icon-xs"
            onClick={copyFull}
          >
            {copied ? (
              <CheckCheck className="text-success" aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
          </IconButton>
          <IconButton
            label={`Download ${log.action} message`}
            size="icon-xs"
            onClick={download}
          >
            <Download aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {/* ── Expanded payload ── */}
      {expanded && hasPayload && (
        <div
          id={detailsId}
          className="mx-3 mb-2.5 overflow-hidden rounded-lg border border-b-default"
        >
          {/* Payload toolbar */}
          <div className="flex items-center justify-between gap-2 border-b border-b-subtle bg-surface-base px-2 py-1.5">
            <ToggleGroup
              aria-label="Payload view"
              size="sm"
              spacing={1}
              value={[viewMode]}
              onValueChange={(v) =>
                v[0] && setViewMode(v[0] as "parsed" | "raw")
              }
            >
              <ToggleGroupItem value="parsed">
                <Braces aria-hidden="true" /> Parsed
              </ToggleGroupItem>
              <ToggleGroupItem value="raw">
                <AlignLeft aria-hidden="true" /> Raw
              </ToggleGroupItem>
            </ToggleGroup>
            <Button variant="neutral" size="xs" onClick={copyPayload}>
              {copiedPayload ? (
                <CheckCheck className="text-success" aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              {copiedPayload ? "Copied" : "Copy payload"}
            </Button>
          </div>
          {/* Payload body */}
          <div className="max-h-65 overflow-auto custom-scrollbar bg-surface-base">
            {Boolean(
              log.payload &&
                typeof log.payload === "object" &&
                "hint" in log.payload &&
                log.payload.hint,
            ) && (
              <Notice
                tone="warning"
                icon={<AlertTriangle aria-hidden="true" />}
                className="m-3 mb-0 w-auto"
              >
                {String((log.payload as Record<string, unknown>).hint)}
              </Notice>
            )}
            <div className="p-3">
              {viewMode === "parsed" ? (
                <JsonViewer data={log.payload} />
              ) : (
                <pre className="text-info font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                  {fullRaw}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

/* ═══════════════════════════════════════════════════════
   LOGS PANEL
   ═══════════════════════════════════════════════════════ */
const FILTERS = ["All", "Tx", "Rx", "Error"] as const;
type Filter = (typeof FILTERS)[number];

export function LogsPanel({ onHide }: { onHide?: () => void }) {
  const { logs, clearLogs } = useActiveCharger();
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(logs.length);
  const titleId = useId();

  /* counts */
  const counts = useMemo(() => {
    const c = { All: logs.length, Tx: 0, Rx: 0, Error: 0 };
    for (const l of logs) {
      if (l.direction === "Tx") c.Tx++;
      else if (l.direction === "Rx") c.Rx++;
      else if (l.direction === "Error") c.Error++;
    }
    return c;
  }, [logs]);

  /* filtered list */
  const displayLogs = useMemo(
    () =>
      logs.filter((l) => {
        if (filter !== "All" && l.direction !== filter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            l.action.toLowerCase().includes(q) ||
            (l.payload
              ? JSON.stringify(l.payload).toLowerCase().includes(q)
              : false)
          );
        }
        return true;
      }),
    [logs, filter, search],
  );

  /* track new log entries while paused */
  useEffect(() => {
    const diff = logs.length - prevLen.current;
    if (diff > 0 && !autoScroll) setNewCount((n) => n + diff);
    prevLen.current = logs.length;
  }, [logs.length, autoScroll]);

  /* auto-scroll to top (newest first) */
  useEffect(() => {
    if (autoScroll && viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [displayLogs, autoScroll]);

  /* focus search when toggled */
  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showSearch]);

  const jumpToLatest = () => {
    setAutoScroll(true);
    setNewCount(0);
    viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const downloadAll = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocpp_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = [
      "timestamp",
      "direction",
      "action",
      "raw_message",
      "payload",
    ].join(",");
    const rows = logs.map((l) =>
      [
        q(l.timestamp),
        q(l.direction),
        q(l.action),
        q(l.rawMessage ?? ""),
        q(JSON.stringify(l.payload ?? "")),
      ].join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocpp_logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ═══ RENDER ═══ */
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col h-full rounded-xl bg-surface-inset border border-b-default"
    >
      {/* ── HEADER ── */}
      <div className="shrink-0 flex flex-col bg-surface-card border-b border-b-subtle rounded-t-xl">
        {/* Top row */}
        <div className="flex flex-wrap items-center gap-2 min-h-11 px-3 py-1.5">
          <h2
            id={titleId}
            className="flex items-center gap-2 text-xs font-semibold text-t-primary uppercase tracking-wider shrink-0"
          >
            <Radio className="size-3.5 text-brand" aria-hidden="true" />
            OCPP log
          </h2>
          <Badge variant="neutral" className="h-5 font-mono tabular-nums">
            <span className="sr-only">Total messages: </span>
            {logs.length}
          </Badge>

          <div
            className="w-px h-4 bg-b-strong shrink-0 mx-1"
            aria-hidden="true"
          />

          {/* Direction filter */}
          <ToggleGroup
            aria-label="Filter by direction"
            size="sm"
            spacing={1}
            value={[filter]}
            onValueChange={(v) => v[0] && setFilter(v[0] as Filter)}
            className="flex-1 min-w-0"
          >
            {FILTERS.map((f) => (
              <ToggleGroupItem key={f} value={f} className="uppercase">
                {f}
                {counts[f] > 0 && (
                  <span className="font-mono font-normal text-t-muted">
                    {counts[f]}
                  </span>
                )}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Follow toggle */}
          <Toggle
            size="sm"
            variant="outline"
            pressed={autoScroll}
            onPressedChange={(pressed) => {
              setAutoScroll(pressed);
              setNewCount(0);
            }}
            title="Keep the newest message in view"
          >
            <ArrowUpToLine aria-hidden="true" />
            Follow
          </Toggle>

          <div
            className="w-px h-4 bg-b-strong shrink-0 mx-1"
            aria-hidden="true"
          />

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <Toggle
              size="sm"
              pressed={showSearch}
              onPressedChange={setShowSearch}
              aria-label="Search log"
              title="Search log"
            >
              <Search aria-hidden="true" />
            </Toggle>
            <IconButton
              label={copiedAll ? "Copied all messages" : "Copy all messages"}
              size="icon-sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
                setCopiedAll(true);
                setTimeout(() => setCopiedAll(false), 1800);
              }}
            >
              {copiedAll ? (
                <CheckCheck className="text-success" aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
            </IconButton>
            <IconButton
              label="Export log as JSON"
              size="icon-sm"
              onClick={downloadAll}
            >
              <Download aria-hidden="true" />
            </IconButton>
            <IconButton
              label="Export log as CSV"
              size="icon-sm"
              onClick={downloadCSV}
            >
              <FileSpreadsheet aria-hidden="true" />
            </IconButton>
            <ConfirmAction
              title="Clear the OCPP log?"
              description="All messages for this charger are removed from the log. Export first if you need them."
              confirmLabel="Clear log"
              onConfirm={clearLogs}
              trigger={
                <IconButton
                  label="Clear log"
                  size="icon-sm"
                  className="hover:text-danger"
                  disabled={logs.length === 0}
                >
                  <Trash2 aria-hidden="true" />
                </IconButton>
              }
            />
            {onHide && (
              <IconButton
                label="Hide log panel"
                size="icon-sm"
                onClick={onHide}
              >
                <PanelBottomClose aria-hidden="true" />
              </IconButton>
            )}
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="px-3 pb-2 flex items-center gap-2 border-t border-b-subtle pt-2">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-t-muted pointer-events-none"
              />
              <Input
                ref={searchRef}
                type="search"
                aria-label="Filter by action or payload content"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)}
                placeholder="Filter by action or payload content…"
                className="h-8 pl-9 pr-9 font-mono"
              />
              {search && (
                <IconButton
                  label="Clear search"
                  size="icon-xs"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setSearch("")}
                >
                  <X aria-hidden="true" />
                </IconButton>
              )}
            </div>
            <span role="status" className="shrink-0 text-xs text-t-muted">
              {search &&
                `${displayLogs.length} match${displayLogs.length !== 1 ? "es" : ""}`}
            </span>
          </div>
        )}
      </div>

      {/* ── LOG STREAM ── */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={viewportRef}
          className="absolute inset-0 overflow-y-auto custom-scrollbar"
        >
          {displayLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full min-h-50 px-4">
              <div className="size-10 rounded-lg bg-surface-card border border-b-default flex items-center justify-center">
                <Activity className="size-4 text-t-muted" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-t-secondary text-center">
                {search
                  ? `No results for "${search}"`
                  : "Waiting for OCPP messages…"}
              </p>
            </div>
          ) : (
            // Not a live region on purpose: a busy charger would flood
            // screen readers. Status changes are announced elsewhere.
            <ul aria-label="OCPP messages, newest first">
              {displayLogs.map((log, i) => (
                <LogEntry key={log.id} log={log} isNew={i === 0} />
              ))}
            </ul>
          )}
        </div>

        {/* "Jump to latest" — shown when paused */}
        {!autoScroll && displayLogs.length > 0 && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10">
            <Button
              size="xs"
              onClick={jumpToLatest}
              className="rounded-full px-3 shadow-[0_4px_16px_rgba(139,92,246,0.35)]"
            >
              <ArrowUpToLine aria-hidden="true" />
              {newCount > 0
                ? `${newCount} new — jump to latest`
                : "Jump to latest"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

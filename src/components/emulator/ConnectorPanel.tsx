"use client";

import {
  Activity,
  AlertTriangle,
  Banknote,
  Battery,
  Cable,
  CalendarCheck,
  CircleCheck,
  CircleX,
  Clock,
  Gauge,
  Lock,
  LockOpen,
  MessageSquare,
  Pencil,
  Play,
  PlugZap,
  Plus,
  PowerOff,
  Send,
  ShieldCheck,
  Square,
  Unplug,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useActiveCharger } from "@/hooks/useActiveCharger";
import { ocppService } from "@/lib/ocppClient";
import { cn } from "@/lib/utils";
import {
  type ConnectorStatus,
  type StopReason,
  sessionSocPct,
} from "@/store/emulatorStore";
import {
  Field,
  IconButton,
  Notice,
  OptionSelect,
  RenameAction,
  SectionHeading,
} from "./kit";

/* ──────────────────────────────────
   STATUS PRESENTATION
   Every status is shown as text; colour only reinforces it.
   ────────────────────────────────── */

type Tone = "success" | "info" | "brand" | "warning" | "neutral" | "danger";

const STATUS_TONE: Record<ConnectorStatus, Tone> = {
  Available: "success",
  Preparing: "info",
  Charging: "brand",
  SuspendedEV: "warning",
  SuspendedEVSE: "warning",
  Finishing: "info",
  Reserved: "warning",
  Unavailable: "neutral",
  Faulted: "danger",
};

const STATUS_DOT: Record<Tone, string> = {
  success: "bg-success",
  info: "bg-info",
  brand: "bg-brand",
  warning: "bg-warning",
  neutral: "bg-t-muted",
  danger: "bg-danger",
};

const STOP_REASONS: StopReason[] = [
  "Local",
  "EmergencyStop",
  "EVDisconnected",
  "HardReset",
  "Other",
  "PowerLoss",
  "Reboot",
  "Remote",
  "SoftReset",
  "UnlockCommand",
  "DeAuthorized",
];
const ALL_STATUSES: ConnectorStatus[] = [
  "Available",
  "Preparing",
  "Charging",
  "SuspendedEV",
  "SuspendedEVSE",
  "Finishing",
  "Reserved",
  "Unavailable",
  "Faulted",
];
const ERROR_CODES = [
  "InternalError",
  "ConnectorLockFailure",
  "EVCommunicationError",
  "GroundFailure",
  "HighTemperature",
  "LocalListConflict",
  "OtherError",
  "OverCurrentFailure",
  "PowerMeterFailure",
  "PowerSwitchFailure",
  "ReaderFailure",
  "ResetFailure",
  "UnderVoltage",
  "OverVoltage",
  "WeakSignal",
];

/* ──────────────────────────────────
   CONNECTOR PANEL
   ────────────────────────────────── */
export function ConnectorPanel({ connectorId }: { connectorId: number }) {
  const {
    status: globalStatus,
    config,
    connectors,
    connectorNames,
    updateConnector,
    updateConnectorName,
    updateSimulation,
    costInfo,
    displayMessages,
    clearDisplayMessage,
  } = useActiveCharger();
  const connector = connectors[connectorId];
  const is2x = config.ocppVersion !== "ocpp1.6";
  const uid = useId();
  const [renameOpen, setRenameOpen] = useState(false);
  const [targetSocOpen, setTargetSocOpen] = useState(false);
  const [targetKWhInput, setTargetKWhInput] = useState(
    String(config.simulation.autoChargeTargetKWh),
  );
  const [targetSocPercent, setTargetSocPercent] = useState<number>(100);

  useEffect(() => {
    setTargetKWhInput(String(config.simulation.autoChargeTargetKWh));
  }, [config.simulation.autoChargeTargetKWh]);

  const [selectedStatus, setSelectedStatus] = useState<ConnectorStatus>(
    connector?.status || "Available",
  );
  const [selectedErrorCode, setSelectedErrorCode] = useState("InternalError");
  const [customMeterStep, setCustomMeterStep] = useState<number>(10);
  const [meterSetInput, setMeterSetInput] = useState<string>("");
  const [inMaintenance, setInMaintenance] = useState(false);
  const [authResult, setAuthResult] = useState<
    null | "Accepted" | "Rejected" | "loading"
  >(null);

  const handleAuth = async () => {
    setAuthResult("loading");
    try {
      if (is2x) {
        const res = (await ocppService.sendAuthorize201(connector.idTag)) as
          | { idTokenInfo?: { status?: string } }
          | undefined;
        setAuthResult(
          res?.idTokenInfo?.status === "Accepted" ? "Accepted" : "Rejected",
        );
      } else {
        const ok = await ocppService.authorize(connectorId, connector.idTag);
        setAuthResult(ok ? "Accepted" : "Rejected");
      }
    } catch {
      setAuthResult("Rejected");
    }
    setTimeout(() => setAuthResult(null), 4000);
  };

  if (!connector) return null;

  const isConnected = globalStatus === "connected";
  const tone = STATUS_TONE[connector.status];
  const inTx = connector.inTransaction;
  // Same SoC the MeterValues carry: session energy over the configured target.
  const socPct = inTx ? sessionSocPct(connector, config.simulation) : 0;
  const sessionKWh = inTx
    ? (connector.currentMeterValue - connector.startMeterValue) / 1000
    : 0;
  const titleId = `${uid}-title`;
  const customName = connectorNames[connectorId]?.trim() ?? "";
  const connectorName = customName || `Connector ${connectorId}`;
  const unplugBlocker = connector.cableLocked
    ? "Unlock the cable before unplugging."
    : inTx
      ? "Stop the transaction before unplugging."
      : null;

  const handleSetMeter = () => {
    const val = parseFloat(meterSetInput);
    if (!Number.isNaN(val) && val >= 0) {
      updateConnector(connectorId, { currentMeterValue: val });
      setMeterSetInput("");
    }
  };

  // Maintenance mode toggle — sets Unavailable/Available locally + notifies CSMS
  const toggleMaintenance = () => {
    if (!inMaintenance) {
      updateConnector(connectorId, { status: "Unavailable" });
      if (isConnected)
        ocppService.sendStatusNotification(connectorId, "Unavailable");
      setInMaintenance(true);
    } else {
      updateConnector(connectorId, { status: "Available" });
      if (isConnected)
        ocppService.sendStatusNotification(connectorId, "Available");
      setInMaintenance(false);
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      className="@container flex h-full flex-col overflow-hidden rounded-xl border border-b-default bg-surface-card shadow-lg"
    >
      {/* ── HEADER ── */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-b-subtle bg-surface-elevated px-4 py-3">
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-b-strong bg-surface-inset">
          <PlugZap className="size-4 text-t-secondary" aria-hidden="true" />
          <span
            aria-hidden="true"
            className={cn(
              "absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-surface-elevated",
              STATUS_DOT[tone],
            )}
          />
        </div>
        <div className="flex min-w-0 items-center gap-1">
          {/* Double-click is a mouse shortcut; the Rename button is the keyboard path. */}
          <h2
            id={titleId}
            onDoubleClick={() => setRenameOpen(true)}
            className="truncate text-sm font-semibold text-t-primary"
          >
            {connectorName}
            {customName && (
              // The OCPP connector id stays visible: it is what the CSMS sees.
              <span className="ms-1.5 font-mono text-xs font-normal text-t-muted">
                Connector {connectorId}
              </span>
            )}
          </h2>
          <RenameAction
            subject="connector"
            name={connectorName}
            maxLength={30}
            tooltip="Rename connector"
            onRename={(name) => updateConnectorName(connectorId, name)}
            open={renameOpen}
            onOpenChange={setRenameOpen}
          />
        </div>
        <Badge variant={tone}>
          <span className="sr-only">Status: </span>
          {connector.status}
        </Badge>
        {inMaintenance && (
          <Badge variant="warning">
            <Wrench aria-hidden="true" />
            Maintenance
          </Badge>
        )}
        <div className="ms-auto">
          {inTx ? (
            <Badge className="font-mono" variant="brand">
              <Zap aria-hidden="true" />
              Transaction {connector.transactionId}
            </Badge>
          ) : connector.reservation ? (
            <Badge className="font-mono" variant="warning">
              <CalendarCheck aria-hidden="true" />
              Reservation {connector.reservation.reservationId}
            </Badge>
          ) : (
            <span className="text-xs text-t-muted">No active session</span>
          )}
        </div>
      </header>

      {!isConnected && (
        <Notice className="mx-4 mt-3">
          Not connected to a CSMS. Connect from the header to send OCPP
          messages. You can still edit the meter, ID tag and stop reason.
        </Notice>
      )}

      {/* ── BODY ── */}
      <div className="grid flex-1 grid-cols-1 @2xl:grid-cols-2">
        {/* LEFT: session metering, then status & fault testing */}
        <div className="@container flex flex-col divide-y divide-b-subtle @2xl:border-e @2xl:border-b-subtle">
          <div className="p-4">
            <SectionHeading
              icon={<Gauge aria-hidden="true" />}
              action={
                <Button
                  size="sm"
                  variant="soft-brand"
                  disabled={!inTx || !isConnected}
                  onClick={() => ocppService.sendMeterValues(connectorId)}
                >
                  <Send aria-hidden="true" /> Send MeterValues
                </Button>
              }
            >
              Session energy
            </SectionHeading>

            {/* Meter register readout — editable during a transaction */}
            <div className="flex items-baseline gap-2 border-b border-b-strong pb-1">
              <Input
                aria-label="Energy register in watt-hours"
                inputMode="decimal"
                value={connector.currentMeterValue}
                readOnly={!inTx}
                onChange={(e) =>
                  updateConnector(connectorId, {
                    currentMeterValue: Number(e.target.value),
                  })
                }
                className={cn(
                  "h-auto border-0 bg-transparent px-0 py-0 font-mono text-4xl font-bold tracking-tight tabular-nums",
                  inTx ? "text-t-primary" : "[[readonly]]:text-t-secondary",
                )}
              />
              <span className="text-sm font-semibold text-t-muted">Wh</span>
            </div>
            <p className="mt-1 text-2xs text-t-muted">
              {inTx
                ? `Started at ${Math.round(connector.startMeterValue)} Wh`
                : "Carried over as meterStart for the next transaction"}
            </p>

            {/* State of charge */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span
                  id={`${uid}-soc`}
                  className="flex items-center gap-1.5 font-semibold text-t-secondary"
                >
                  <Battery className="size-3.5" aria-hidden="true" />
                  State of charge {socPct.toFixed(1)}%
                </span>
                <span className="font-mono text-t-muted">
                  {sessionKWh.toFixed(2)} /{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetKWhInput(
                        String(config.simulation.autoChargeTargetKWh),
                      );
                      setTargetSocOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 font-semibold text-t-primary hover:text-brand hover:underline cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 rounded px-1 py-0.5"
                    title="Configure vehicle target energy / battery capacity"
                    aria-label={`Target: ${config.simulation.autoChargeTargetKWh} kWh. Click to configure vehicle need.`}
                  >
                    <span>{config.simulation.autoChargeTargetKWh} kWh</span>
                    <Pencil
                      className="size-3 text-t-muted hover:text-brand transition-colors"
                      aria-hidden="true"
                    />
                  </button>
                </span>
              </div>
              <Progress
                value={Number(socPct.toFixed(1))}
                aria-labelledby={`${uid}-soc`}
                className="mt-1.5"
              />
            </div>

            {/* Manual meter controls */}
            <div className="mt-4 grid grid-cols-1 gap-3 @sm:grid-cols-2">
              <Field label="Set register (Wh)" htmlFor={`${uid}-set`}>
                <div className="flex gap-1.5">
                  <Input
                    id={`${uid}-set`}
                    inputMode="decimal"
                    value={meterSetInput}
                    placeholder="e.g. 5000"
                    onChange={(e) => setMeterSetInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSetMeter()}
                    className="h-8 font-mono"
                  />
                  <Button
                    size="sm"
                    variant="soft-brand"
                    onClick={handleSetMeter}
                    disabled={meterSetInput.trim() === ""}
                  >
                    Set
                  </Button>
                </div>
              </Field>
              <Field label="Add energy (Wh)" htmlFor={`${uid}-add`}>
                <div className="flex gap-1.5">
                  <Input
                    id={`${uid}-add`}
                    inputMode="decimal"
                    value={customMeterStep}
                    disabled={!inTx}
                    onChange={(e) =>
                      setCustomMeterStep(Number(e.target.value) || 0)
                    }
                    className="h-8 font-mono"
                  />
                  <Button
                    size="sm"
                    variant="soft-brand"
                    disabled={!inTx}
                    onClick={() =>
                      updateConnector(connectorId, {
                        currentMeterValue:
                          connector.currentMeterValue + customMeterStep,
                      })
                    }
                  >
                    <Plus aria-hidden="true" /> Add
                  </Button>
                </div>
              </Field>
            </div>

            {/* Live Tariff / Cost */}
            {costInfo && (
              <div className="mt-4 rounded-lg border border-success/30 bg-success/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-success">
                    <Banknote className="size-3.5" aria-hidden="true" /> Latest
                    session cost
                  </span>
                  <span className="font-mono text-sm font-bold text-t-primary">
                    {costInfo.totalCost} {costInfo.currency}
                  </span>
                </div>
                {costInfo.message && (
                  <p className="mt-1 text-xs text-t-secondary">
                    {costInfo.message}
                  </p>
                )}
              </div>
            )}

            {/* Display Messages */}
            {displayMessages.length > 0 && (
              <ul className="mt-4 space-y-2" aria-label="Display messages">
                {displayMessages.slice(0, 3).map((msg) => (
                  <li
                    key={msg.id}
                    className="rounded-lg border border-b-default bg-surface-elevated p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-brand">
                        <MessageSquare
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        {msg.priority} message
                      </span>
                      <IconButton
                        label="Dismiss message"
                        className="size-7"
                        onClick={() => clearDisplayMessage(msg.id)}
                      >
                        <X aria-hidden="true" />
                      </IconButton>
                    </div>
                    <p className="mt-1 text-xs text-t-primary wrap-break-word">
                      {msg.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Status & fault testing */}
          <div className="flex-1 bg-surface-inset/60 p-4">
            <SectionHeading icon={<AlertTriangle aria-hidden="true" />}>
              Status &amp; fault testing
            </SectionHeading>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="neutral"
                disabled={!isConnected}
                onClick={() =>
                  ocppService.sendStatusNotification(
                    connectorId,
                    connector.status,
                  )
                }
              >
                <Activity aria-hidden="true" /> Resend status
              </Button>
              <Button
                size="sm"
                variant="neutral"
                disabled={!isConnected}
                onClick={() =>
                  ocppService.sendStatusNotification(connectorId, "Unavailable")
                }
              >
                <PowerOff aria-hidden="true" /> Send Unavailable
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 @sm:grid-cols-2">
              <Field label="Status to send">
                <div className="flex gap-1.5">
                  <OptionSelect
                    size="sm"
                    value={selectedStatus}
                    options={ALL_STATUSES}
                    onChange={setSelectedStatus}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="neutral"
                    disabled={!isConnected}
                    onClick={() =>
                      ocppService.sendStatusNotification(
                        connectorId,
                        selectedStatus,
                      )
                    }
                  >
                    <Send aria-hidden="true" /> Send
                  </Button>
                </div>
              </Field>
              <Field label="Fault code">
                <div className="flex gap-1.5">
                  <OptionSelect
                    size="sm"
                    value={selectedErrorCode}
                    options={ERROR_CODES}
                    onChange={setSelectedErrorCode}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="soft-danger"
                    disabled={!isConnected}
                    onClick={() =>
                      ocppService.sendStatusNotification(
                        connectorId,
                        "Faulted",
                        selectedErrorCode,
                      )
                    }
                  >
                    <AlertTriangle aria-hidden="true" /> Trip
                  </Button>
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* RIGHT: the charging flow, top to bottom */}
        <div className="@container flex flex-col divide-y divide-b-subtle">
          {/* Authorization */}
          <div className="p-4">
            <SectionHeading icon={<ShieldCheck aria-hidden="true" />}>
              Authorization
            </SectionHeading>
            <Field label="ID tag" htmlFor={`${uid}-idtag`}>
              <div className="flex gap-2">
                <Input
                  id={`${uid}-idtag`}
                  value={connector.idTag}
                  onChange={(e) =>
                    updateConnector(connectorId, {
                      idTag: e.target.value,
                    })
                  }
                  placeholder="RFID token"
                  className="font-mono"
                />
                <Button
                  variant="default"
                  disabled={!isConnected || authResult === "loading"}
                  onClick={handleAuth}
                >
                  <ShieldCheck aria-hidden="true" />
                  {authResult === "loading" ? "Authorizing…" : "Authorize"}
                </Button>
              </div>
            </Field>
            {authResult && (
              <div role="status" className="mt-2">
                {authResult === "Accepted" && (
                  <Badge variant="success">
                    <CircleCheck aria-hidden="true" />
                    Authorization accepted
                  </Badge>
                )}
                {authResult === "Rejected" && (
                  <Badge variant="danger">
                    <CircleX aria-hidden="true" />
                    Authorization rejected
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Cable */}
          <div className="p-4">
            <SectionHeading
              icon={<Cable aria-hidden="true" />}
              action={
                <div className="flex gap-1.5">
                  <Badge
                    variant={connector.cablePluggedIn ? "success" : "neutral"}
                  >
                    {connector.cablePluggedIn ? "Plugged in" : "Unplugged"}
                  </Badge>
                  <Badge
                    variant={connector.cableLocked ? "warning" : "neutral"}
                  >
                    {connector.cableLocked ? (
                      <Lock aria-hidden="true" />
                    ) : (
                      <LockOpen aria-hidden="true" />
                    )}
                    {connector.cableLocked ? "Locked" : "Unlocked"}
                  </Badge>
                </div>
              }
            >
              Cable
            </SectionHeading>
            <div className="grid grid-cols-3 gap-2">
              {!connector.cablePluggedIn ? (
                <Button
                  size="sm"
                  variant="soft-success"
                  disabled={!isConnected}
                  onClick={() => {
                    updateConnector(connectorId, {
                      cablePluggedIn: true,
                      status: "Preparing",
                    });
                    ocppService.sendStatusNotification(
                      connectorId,
                      "Preparing",
                    );
                  }}
                >
                  <PlugZap aria-hidden="true" /> Plug in
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="soft-danger"
                  disabled={!isConnected || unplugBlocker !== null}
                  aria-describedby={
                    unplugBlocker ? `${uid}-unplug-hint` : undefined
                  }
                  onClick={() => {
                    updateConnector(connectorId, {
                      cablePluggedIn: false,
                      status: "Available",
                    });
                    ocppService.sendStatusNotification(
                      connectorId,
                      "Available",
                    );
                  }}
                >
                  <Unplug aria-hidden="true" /> Unplug
                </Button>
              )}
              <Button
                size="sm"
                variant={connector.cableLocked ? "soft-warning" : "neutral"}
                aria-pressed={connector.cableLocked}
                disabled={!isConnected || !connector.cablePluggedIn}
                onClick={() =>
                  updateConnector(connectorId, {
                    cableLocked: !connector.cableLocked,
                  })
                }
              >
                {connector.cableLocked ? (
                  <LockOpen aria-hidden="true" />
                ) : (
                  <Lock aria-hidden="true" />
                )}
                {connector.cableLocked ? "Unlock" : "Lock"}
              </Button>
              <Button
                size="sm"
                variant={inMaintenance ? "soft-warning" : "neutral"}
                aria-pressed={inMaintenance}
                onClick={toggleMaintenance}
              >
                <Wrench aria-hidden="true" /> Maintenance
              </Button>
            </div>
            {connector.cablePluggedIn && unplugBlocker && (
              <p
                id={`${uid}-unplug-hint`}
                className="mt-2 text-2xs text-t-muted"
              >
                {unplugBlocker}
              </p>
            )}
          </div>

          {/* Transaction */}
          <div className="p-4">
            <SectionHeading icon={<Zap aria-hidden="true" />}>
              Transaction
            </SectionHeading>
            {!inTx ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="success"
                  size="lg"
                  disabled={!isConnected}
                  onClick={() =>
                    is2x
                      ? ocppService.startTransaction201(
                          connectorId,
                          connector.idTag,
                        )
                      : ocppService.startTransaction(connectorId)
                  }
                >
                  <Play aria-hidden="true" /> Start transaction
                </Button>
                <Button
                  variant="neutral"
                  size="lg"
                  disabled={!isConnected}
                  title="Start a transaction that charges to the target kWh, then stops"
                  onClick={() => ocppService.startAutoCharge(connectorId)}
                >
                  <Zap aria-hidden="true" /> Auto charge
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @sm:items-end">
                <Button
                  variant="danger"
                  size="lg"
                  disabled={!isConnected}
                  onClick={() =>
                    is2x
                      ? ocppService.stopTransaction201(connectorId)
                      : ocppService.stopTransaction(connectorId)
                  }
                >
                  <Square aria-hidden="true" /> Stop transaction
                </Button>
                <Field label="Stop reason">
                  <OptionSelect
                    size="sm"
                    value={connector.stopReason}
                    options={STOP_REASONS}
                    onChange={(v) =>
                      updateConnector(connectorId, {
                        stopReason: v,
                      })
                    }
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Charging Profiles — conditional */}
          {connector.chargingProfiles.length > 0 && (
            <div className="p-4">
              <SectionHeading
                icon={<Battery aria-hidden="true" />}
                action={
                  <span className="text-2xs text-t-muted">
                    {connector.chargingProfiles.length} active
                  </span>
                }
              >
                Charging profiles
              </SectionHeading>
              <ul className="space-y-2">
                {connector.chargingProfiles.map((profile) => {
                  const periods =
                    profile.chargingSchedule.chargingSchedulePeriod;
                  const unit =
                    profile.chargingSchedule.chargingRateUnit === "W"
                      ? "W"
                      : "A";
                  const maxLimit = Math.max(...periods.map((p) => p.limit));
                  return (
                    <li
                      key={profile.chargingProfileId}
                      className="rounded-lg border border-success/25 bg-success/5 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-success">
                          {profile.chargingProfilePurpose}
                        </span>
                        <span className="font-mono text-2xs text-t-muted">
                          ID {profile.chargingProfileId} · stack{" "}
                          {profile.stackLevel}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {periods.map((period) => {
                          const pct =
                            maxLimit > 0 ? (period.limit / maxLimit) * 100 : 0;
                          return (
                            <li
                              key={`${profile.chargingProfileId}-${period.startPeriod}`}
                              className="flex items-center gap-2"
                            >
                              <span className="w-12 shrink-0 font-mono text-2xs text-t-muted">
                                {period.startPeriod}s
                              </span>
                              <div
                                aria-hidden="true"
                                className="h-2 flex-1 overflow-hidden rounded-full bg-surface-inset"
                              >
                                <div
                                  className="h-full rounded-full bg-success/60"
                                  style={{
                                    width: `${pct}%`,
                                  }}
                                />
                              </div>
                              <span className="w-14 shrink-0 text-right font-mono text-2xs text-t-secondary">
                                {period.limit} {unit}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Reservation */}
          <div className="p-4">
            <SectionHeading
              icon={<CalendarCheck aria-hidden="true" />}
              action={
                connector.reservation && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-warning"
                    onClick={() => {
                      updateConnector(connectorId, {
                        reservation: null,
                      });
                      if (connector.status === "Reserved")
                        ocppService.sendStatusNotification(
                          connectorId,
                          "Available",
                        );
                    }}
                  >
                    Clear reservation
                  </Button>
                )
              }
            >
              Reservation
            </SectionHeading>
            {connector.reservation ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                <p className="font-mono text-sm font-semibold text-warning">
                  {connector.reservation.idTag}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-t-secondary">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden="true" />
                    Expires{" "}
                    {new Date(
                      connector.reservation.expiryDate,
                    ).toLocaleTimeString()}
                  </span>
                  <span className="text-t-muted">
                    Reservation #{connector.reservation.reservationId}
                  </span>
                </p>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-b-strong px-3 py-3 text-center text-xs text-t-muted">
                No active reservation
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Vehicle Charging Need & Target SoC Modal (ISO 9241 & WCAG 2.1 AA) ── */}
      <Dialog open={targetSocOpen} onOpenChange={setTargetSocOpen}>
        <DialogContent
          className="sm:max-w-md bg-surface-elevated border border-b-strong text-t-primary shadow-2xl"
          showCloseButton
        >
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-b-strong bg-surface-inset text-brand">
                <Battery className="size-4.5" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-t-primary">
                  Vehicle Charging Need & Target SoC
                </DialogTitle>
                <DialogDescription className="text-2xs text-t-muted">
                  Configure simulated EV battery capacity and target energy for
                  Connector {connectorId}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseFloat(targetKWhInput);
              if (!Number.isNaN(val) && val > 0) {
                updateSimulation({ autoChargeTargetKWh: val });
                setTargetSocOpen(false);
              }
            }}
            className="mt-1 flex flex-col gap-4"
          >
            {/* Target Capacity Input */}
            <Field
              label="EV Battery Capacity / Target Energy (kWh)"
              hint="Defines the denominator for State of Charge (SoC%) and the cutoff target for auto-charging."
              htmlFor={`${uid}-target-kwh`}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id={`${uid}-target-kwh`}
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    value={targetKWhInput}
                    onChange={(e) => setTargetKWhInput(e.target.value)}
                    placeholder="e.g. 60"
                    className="h-9 font-mono pr-12 text-sm"
                    autoFocus
                  />
                  <span className="pointer-events-none absolute right-3 top-2.5 text-xs font-semibold text-t-muted">
                    kWh
                  </span>
                </div>
                <span className="font-mono text-2xs text-t-muted">
                  ={" "}
                  {((parseFloat(targetKWhInput) || 0) * 1000).toLocaleString()}{" "}
                  Wh
                </span>
              </div>
            </Field>

            {/* EV Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-2xs font-semibold uppercase tracking-wider text-t-muted">
                Quick EV Vehicle Presets
              </span>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {[
                  { label: "PHEV", kwh: 18 },
                  { label: "City EV", kwh: 30 },
                  { label: "Sedan", kwh: 60 },
                  { label: "SUV / Long", kwh: 77 },
                  { label: "Truck / Semi", kwh: 100 },
                ].map((preset) => {
                  const isSelected = parseFloat(targetKWhInput) === preset.kwh;
                  return (
                    <button
                      key={preset.kwh}
                      type="button"
                      onClick={() => setTargetKWhInput(String(preset.kwh))}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
                        isSelected
                          ? "border-brand bg-brand-subtle text-brand-strong ring-1 ring-brand font-semibold"
                          : "border-b-subtle bg-surface-card hover:bg-surface-hover hover:border-b-strong text-t-secondary hover:text-t-primary",
                      )}
                    >
                      <span className="font-mono text-xs font-bold">
                        {preset.kwh}
                      </span>
                      <span className="text-2xs text-t-muted tracking-tight">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target SoC Percentage Multipliers (ISO 15118 & OCPP standard) */}
            <div className="rounded-lg border border-b-subtle bg-surface-card p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-t-secondary flex items-center gap-1">
                  <Gauge className="size-3 text-brand" aria-hidden="true" />{" "}
                  Target SoC Limit
                </span>
                <span className="font-mono text-t-muted">
                  {targetSocPercent}% (
                  {(
                    (parseFloat(targetKWhInput) || 0) *
                    (targetSocPercent / 100)
                  ).toFixed(1)}{" "}
                  kWh cutoff target)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { pct: 80, label: "80% (Daily / Battery Health)" },
                  { pct: 90, label: "90% (Standard)" },
                  { pct: 100, label: "100% (Full Trip)" },
                ].map((item) => (
                  <button
                    key={item.pct}
                    type="button"
                    onClick={() => {
                      setTargetSocPercent(item.pct);
                    }}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-md text-2xs font-medium border text-center transition-colors cursor-pointer min-h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
                      targetSocPercent === item.pct
                        ? "border-brand/40 bg-brand/10 text-brand-strong font-semibold"
                        : "border-b-subtle bg-surface-inset text-t-secondary hover:text-t-primary hover:bg-surface-hover",
                    )}
                  >
                    {item.pct}%
                  </button>
                ))}
              </div>
              <p className="text-2xs text-t-muted leading-relaxed">
                {targetSocPercent < 100
                  ? `Simulates vehicle cutoff at ${targetSocPercent}% SoC to optimize battery longevity (common DC fast charging practice).`
                  : "Simulates full charge to 100% SoC before stopping the transaction."}
              </p>
            </div>

            {/* Live Session Energy Feedback if in transaction */}
            {inTx && (
              <div className="flex items-center justify-between text-2xs rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-t-secondary">
                <span>Current Session Delivered:</span>
                <span className="font-mono font-semibold text-t-primary">
                  {sessionKWh.toFixed(2)} kWh (
                  {(sessionKWh * 1000).toLocaleString()} Wh)
                </span>
              </div>
            )}

            {/* Dialog Footer Actions */}
            <DialogFooter className="mt-2 flex items-center justify-between gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetKWhInput("30");
                  setTargetSocPercent(100);
                }}
                className="text-xs"
              >
                Reset to 30 kWh
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  onClick={() => setTargetSocOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    !parseFloat(targetKWhInput) ||
                    parseFloat(targetKWhInput) <= 0
                  }
                >
                  Apply Target
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

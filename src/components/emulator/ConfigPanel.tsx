"use client";

import {
  AlertTriangle,
  Check,
  Clock,
  Cpu,
  CreditCard,
  ExternalLink,
  FileText,
  FlaskConical,
  Gauge,
  Globe,
  HardDrive,
  Hash,
  KeyRound,
  Layers,
  ListVideo,
  MessageSquare,
  Play,
  Plug,
  Search,
  Send,
  Server,
  Settings2,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Square,
  Tag,
  Terminal,
  Upload,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useId, useState } from "react";
import { LocalhostGuideDialog } from "@/components/emulator/LocalhostGuideDialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveCharger } from "@/hooks/useActiveCharger";
import { getService, ocppService } from "@/lib/ocppClient";
import { type ScenarioMacro, useEmulatorStore } from "@/store/emulatorStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmAction, Field, IconButton, Notice, OptionSelect } from "./kit";

/* ═══════════════════════════════════════════
   READ-ONLY BADGE
   ═══════════════════════════════════════════ */

function ReadOnlyBadge({ setMessage }: { setMessage: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="outline"
            tabIndex={0}
            aria-label={`Read-only. A ${setMessage} from the CSMS is rejected.`}
            className="h-5 shrink-0 cursor-help border-warning/35 bg-warning/10 px-1.5 py-0 font-mono text-2xs text-warning"
          />
        }
      >
        RO
      </TooltipTrigger>
      <TooltipContent className="max-w-60 text-xs leading-snug">
        Read-only. Can't be edited here, and a {setMessage} from the CSMS is
        answered with Rejected.
      </TooltipContent>
    </Tooltip>
  );
}

/* ═══════════════════════════════════════════
   SECTION CARD
   One neutral heading style for every section. Colour is kept for
   meaning (status, danger), not decoration.
   ═══════════════════════════════════════════ */

function SectionCard({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="space-y-3 rounded-xl border border-b-default bg-surface-inset p-4"
    >
      <div>
        <h3
          id={id}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-t-primary [&_svg]:size-3.5 [&_svg]:text-brand"
        >
          {icon}
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-t-muted">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/* ═══════════════════════════════════════════
   TAB NAVIGATION
   ═══════════════════════════════════════════ */

const TABS = [
  { id: "connection", label: "Connect", icon: Plug },
  { id: "vendor", label: "Vendor", icon: Cpu },
  { id: "station", label: "Config", icon: SlidersHorizontal },
  { id: "simulation", label: "Simulate", icon: FlaskConical },
  { id: "auth", label: "Auth", icon: KeyRound },
  { id: "composer", label: "Send", icon: MessageSquare },
  { id: "macro", label: "Macro", icon: ListVideo },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ═══════════════════════════════════════════
   PROFILES SECTION
   ═══════════════════════════════════════════ */

function ProfilesSection() {
  const { savedProfiles, saveProfile, loadProfile, deleteProfile } =
    useActiveCharger();
  const [profileName, setProfileName] = useState("");

  const handleSave = () => {
    const name = profileName.trim();
    if (!name) return;
    saveProfile(name);
    setProfileName("");
  };

  return (
    <SectionCard
      title="Saved Profiles"
      icon={<HardDrive className="h-3.5 w-3.5" />}
      description="Save & restore config snapshots"
    >
      <div className="flex items-end gap-2">
        <Field label="Profile name" className="flex-1">
          <Input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="h-9 text-t-primary text-xs rounded-md"
            placeholder="e.g. Staging CSMS"
          />
        </Field>
        <Button
          variant="soft-brand"
          onClick={handleSave}
          disabled={!profileName.trim()}
        >
          Save profile
        </Button>
      </div>
      {savedProfiles.length > 0 && (
        <ul
          aria-label="Saved profiles"
          className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar"
        >
          {savedProfiles.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-card border border-b-default"
            >
              <div className="min-w-0">
                <span className="text-xs font-medium text-t-primary truncate block">
                  {p.name}
                </span>
                <span className="text-2xs font-mono text-t-muted">
                  Saved {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="soft-brand"
                  aria-label={`Load profile ${p.name}`}
                  onClick={() => loadProfile(p.name)}
                >
                  Load
                </Button>
                <ConfirmAction
                  title={`Delete profile “${p.name}”?`}
                  description="The saved snapshot is removed from this browser. Your current configuration is not affected."
                  confirmLabel="Delete profile"
                  onConfirm={() => deleteProfile(p.name)}
                  trigger={
                    <IconButton
                      label={`Delete profile ${p.name}`}
                      className="hover:text-danger"
                    >
                      <X aria-hidden="true" />
                    </IconButton>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════
   FLEET SPAWN SECTION
   ═══════════════════════════════════════════ */

function FleetSpawnSection() {
  const { spawnFleet } = useActiveCharger();
  const [count, setCount] = useState("5");
  const [prefix, setPrefix] = useState("CP-Fleet");
  const [endpoint, setEndpoint] = useState("ws://localhost:9000");
  const [isSpawning, setIsSpawning] = useState(false);

  const handleSpawn = () => {
    if (isSpawning) return;
    setIsSpawning(true);
    const numCount = parseInt(count, 10) || 1;
    spawnFleet(numCount, endpoint, prefix);

    // Auto connect all fleet chargers staggered
    setTimeout(() => {
      const store = useEmulatorStore.getState();
      const newFleet = store.chargers.filter((c) => c.label.startsWith(prefix));
      newFleet.forEach((c, i) => {
        setTimeout(() => getService(c.id).connect(), i * 500);
      });
      setIsSpawning(false);
    }, 100);
  };

  const handleDisconnectAll = () => {
    const store = useEmulatorStore.getState();
    const fleet = store.chargers.filter((c) => c.label.startsWith(prefix));
    fleet.forEach((c) => {
      getService(c.id).disconnect();
    });
  };

  return (
    <SectionCard
      title="Fleet Spawn"
      icon={<Layers className="h-3.5 w-3.5" />}
      description="Bulk create and connect multiple chargers for load testing"
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <Field
            label="Count"
            icon={<Hash className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="h-9 text-t-primary text-xs rounded-lg"
            />
          </Field>
          <Field
            label="Prefix"
            icon={<Tag className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="h-9 text-t-primary text-xs rounded-lg"
            />
          </Field>
          <Field
            label="Target CSMS"
            icon={<Globe className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="h-9 text-t-primary text-xs rounded-lg"
            />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button
            variant="soft-success"
            className="flex-1"
            onClick={handleSpawn}
            disabled={isSpawning}
          >
            <Zap aria-hidden="true" /> Spawn &amp; connect
          </Button>
          <ConfirmAction
            title={`Disconnect every “${prefix}” charger?`}
            description="All chargers whose name starts with this prefix drop their CSMS connection. Open transactions stay open on the CSMS side."
            confirmLabel="Disconnect all"
            onConfirm={handleDisconnectAll}
            trigger={
              <Button variant="soft-danger">
                <Plug aria-hidden="true" /> Disconnect all
              </Button>
            }
          />
        </div>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════
   CONNECTION TAB
   ═══════════════════════════════════════════ */

function ConnectionTab() {
  const { status, config, updateConfig } = useActiveCharger();
  const locked = status === "connected" || status === "connecting";

  return (
    <div className="space-y-4">
      {locked && (
        <Notice>
          Endpoint, identity and security are locked while connected. Disconnect
          to change them.
        </Notice>
      )}
      <SectionCard
        title="WebSocket Endpoint"
        icon={<Globe className="h-3.5 w-3.5" />}
      >
        <Field
          label="CSMS URL"
          icon={<Globe className="h-3 w-3" aria-hidden="true" />}
        >
          <Input
            value={config.endpoint}
            disabled={locked}
            onChange={(e) => updateConfig({ endpoint: e.target.value })}
            className="h-9 text-t-primary text-xs rounded-lg"
            placeholder="ws://localhost:9000"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-t-muted text-xs">Targeting local CSMS?</span>
            <LocalhostGuideDialog
              trigger={
                <Button variant="link" size="xs" className="px-0">
                  Browser permission guide
                  <ExternalLink aria-hidden="true" />
                </Button>
              }
            />
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="Identity" icon={<Hash className="h-3.5 w-3.5" />}>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Charge Point ID"
            icon={<Hash className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              value={config.chargePointId}
              disabled={locked}
              onChange={(e) => updateConfig({ chargePointId: e.target.value })}
              className="h-9 text-t-primary text-xs rounded-lg"
            />
          </Field>
          <Field
            label="OCPP Version"
            icon={<Layers className="h-3 w-3" aria-hidden="true" />}
          >
            <OptionSelect
              value={config.ocppVersion}
              disabled={locked}
              options={[
                { label: "OCPP 1.6J", value: "ocpp1.6" },
                { label: "OCPP 2.0.1", value: "ocpp2.0.1" },
                { label: "OCPP 2.1", value: "ocpp2.1" },
              ]}
              onChange={(v) => updateConfig({ ocppVersion: v as any })}
            />
          </Field>
          <Field
            label="Default RFID Tag"
            icon={<Tag className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              value={config.rfidTag}
              onChange={(e) => updateConfig({ rfidTag: e.target.value })}
              className="h-9 text-t-primary text-xs rounded-lg"
            />
          </Field>
          <Field
            label="Connectors"
            icon={<Plug className="h-3 w-3" aria-hidden="true" />}
          >
            <OptionSelect
              value={String(config.numberOfConnectors)}
              disabled={locked}
              options={[
                { label: "1 Connector", value: "1" },
                { label: "2 Connectors", value: "2" },
              ]}
              onChange={(v) =>
                updateConfig({
                  numberOfConnectors: Number(v) as 1 | 2,
                })
              }
            />
          </Field>
        </div>
      </SectionCard>

      {/* Security Profile */}
      <SectionCard
        title="Security"
        icon={<Shield className="h-3.5 w-3.5" />}
        description="OCPP Security Profile for connection auth"
      >
        <Field
          label="Security Profile"
          icon={<Shield className="h-3 w-3" aria-hidden="true" />}
        >
          <OptionSelect
            value={String(config.securityProfile)}
            disabled={locked}
            options={[
              { label: "0 — No Security", value: "0" },
              {
                label: "1 — Basic Auth (password in URL)",
                value: "1",
              },
            ]}
            onChange={(v) =>
              updateConfig({
                securityProfile: Number(v) as 0 | 1,
              })
            }
          />
        </Field>
        {config.securityProfile > 0 && (
          <Field
            label="Basic Auth Password"
            icon={<Shield className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              type="password"
              value={config.basicAuthPassword}
              disabled={locked}
              onChange={(e) =>
                updateConfig({
                  basicAuthPassword: e.target.value,
                })
              }
              className="h-9 text-t-primary text-xs rounded-lg"
              placeholder="Password..."
            />
          </Field>
        )}
      </SectionCard>

      {/* Config Profiles */}
      <ProfilesSection />

      {/* Fleet Spawn */}
      <FleetSpawnSection />
    </div>
  );
}

/* ═══════════════════════════════════════════
   BOOT NOTIFICATION TAB
   ═══════════════════════════════════════════ */

const BOOT_FIELDS: {
  key: string;
  label: string;
  icon: React.ReactNode;
  required?: boolean;
}[] = [
  {
    key: "chargePointVendor",
    label: "Vendor",
    icon: <Server className="h-3 w-3" aria-hidden="true" />,
    required: true,
  },
  {
    key: "chargePointModel",
    label: "Model",
    icon: <HardDrive className="h-3 w-3" aria-hidden="true" />,
    required: true,
  },
  {
    key: "chargePointSerialNumber",
    label: "CP Serial #",
    icon: <Hash className="h-3 w-3" aria-hidden="true" />,
  },
  {
    key: "chargeBoxSerialNumber",
    label: "Box Serial #",
    icon: <Hash className="h-3 w-3" aria-hidden="true" />,
  },
  {
    key: "firmwareVersion",
    label: "Firmware Ver.",
    icon: <Wrench className="h-3 w-3" aria-hidden="true" />,
  },
  {
    key: "iccid",
    label: "ICCID",
    icon: <CreditCard className="h-3 w-3" aria-hidden="true" />,
  },
  {
    key: "imsi",
    label: "IMSI",
    icon: <Smartphone className="h-3 w-3" aria-hidden="true" />,
  },
  {
    key: "meterType",
    label: "Meter Type",
    icon: <Gauge className="h-3 w-3" aria-hidden="true" />,
  },
  {
    key: "meterSerialNumber",
    label: "Meter Serial #",
    icon: <Hash className="h-3 w-3" aria-hidden="true" />,
  },
];

function VendorTab() {
  const { id, status, config, updateBootNotification, updateVendorConfig } =
    useActiveCharger();
  const locked = status === "connected" || status === "connecting";
  const boot = config.bootNotification;
  const vendor = config.vendorConfig;

  return (
    <div className="space-y-4">
      {locked && (
        <Notice>
          Hardware identity is sent in BootNotification when connecting, so it
          is locked while connected.
        </Notice>
      )}
      <SectionCard
        title="Hardware Identity"
        icon={<Cpu className="h-3.5 w-3.5" />}
        description="Sent to CSMS via BootNotification on connection."
      >
        <div className="grid grid-cols-2 gap-3">
          {BOOT_FIELDS.map(({ key, label, icon, required }) => (
            <Field key={key} label={label} icon={icon} required={required}>
              <Input
                value={(boot as any)[key] ?? ""}
                disabled={locked}
                onChange={(e) =>
                  updateBootNotification({
                    [key]: e.target.value,
                  } as any)
                }
                className="h-9 text-t-primary text-xs font-mono rounded-lg"
              />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Vendor Custom Extensions"
        icon={<Server className="h-3.5 w-3.5" />}
        description="DataTransfer & Boot customData"
      >
        <div className="space-y-3">
          <Field
            label="Vendor ID"
            icon={<HardDrive className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              value={vendor?.vendorId ?? ""}
              onChange={(e) => updateVendorConfig({ vendorId: e.target.value })}
              className="h-9 text-t-primary text-xs font-mono rounded-lg"
              placeholder="e.g. com.elmo.virtual"
            />
          </Field>
          <Field
            label="Custom Data Payload (JSON)"
            icon={<SlidersHorizontal className="h-3 w-3" aria-hidden="true" />}
          >
            <Textarea
              value={vendor?.customDataStr ?? "{}"}
              onChange={(e) =>
                updateVendorConfig({
                  customDataStr: e.target.value,
                })
              }
              className="h-24 resize-none custom-scrollbar"
              placeholder='{"customKey": "value"}'
              spellCheck={false}
            />
          </Field>

          <Button
            variant="soft-brand"
            className="w-full"
            onClick={() => {
              import("@/lib/ocppClient").then((m) =>
                // getService is keyed by the slot id, not the OCPP identity.
                m.getService(id).sendDataTransfer(),
              );
            }}
            disabled={!vendor?.vendorId || locked !== true}
          >
            <MessageSquare aria-hidden="true" />
            {locked !== true
              ? "Connect to send DataTransfer"
              : "Send DataTransfer"}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Simulated Vendor Errors"
        icon={<Plug className="h-3.5 w-3.5" />}
        description="Overrides standard StatusNotification error codes"
      >
        <Field
          label="Vendor Error Code"
          icon={<MessageSquare className="h-3 w-3" aria-hidden="true" />}
        >
          <Input
            value={vendor?.vendorErrorCode ?? ""}
            onChange={(e) =>
              updateVendorConfig({
                vendorErrorCode: e.target.value,
              })
            }
            className="h-9 text-t-primary text-xs font-mono rounded-lg"
            placeholder="e.g. 0x01B (Optional)"
          />
        </Field>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STATION CONFIG TAB
   ═══════════════════════════════════════════ */

// ── Helpers for UI Grouping ──
const GROUP_16_SECURITY = ["SecurityProfile", "AuthorizationKey"];
const GROUP_16_SMART_CHARGING = [
  "ChargeProfileMaxStackLevel",
  "MaxChargingProfilesInstalled",
  "ChargingScheduleAllowedChargingRateUnit",
  "ChargingScheduleMaxPeriods",
];
const GROUP_16_LOCAL_AUTH = [
  "LocalAuthListMaxLength",
  "SendLocalListMaxLength",
  "LocalAuthorizeOffline",
  "LocalPreAuthorize",
];

/** DOM id for a device-model variable input (component/variable → safe id). */
const dmId = (component: string, variable: string) =>
  `dm-${component}-${variable}`.replace(/\W/g, "-");

function StationConfigTab() {
  const { config, updateStationConfigKey, setDeviceVariable, deviceModel } =
    useActiveCharger();
  const is2x = config.ocppVersion !== "ocpp1.6";

  if (is2x) {
    // ── OCPP 2.x Device Model view ──
    const grouped = deviceModel.reduce(
      (acc, v) => {
        if (!acc[v.component]) acc[v.component] = [];
        acc[v.component].push(v);
        return acc;
      },
      {} as Record<string, typeof deviceModel>,
    );

    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([compName, vars]) => {
          const editableCount = vars.filter(
            (v) => v.mutability !== "ReadOnly",
          ).length;
          return (
            <SectionCard
              key={compName}
              title={compName}
              icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              description={`${vars.length} vars · ${editableCount} writable`}
            >
              <div className="space-y-0.5 -mx-1">
                {vars.map((v) => (
                  <div
                    key={`${v.component}/${v.variable}`}
                    className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-1.5 mr-2">
                      <label
                        htmlFor={dmId(v.component, v.variable)}
                        className={`text-xs font-mono truncate ${
                          v.mutability === "ReadOnly"
                            ? "text-t-muted"
                            : "text-t-secondary font-medium"
                        }`}
                        title={v.variable}
                      >
                        {v.variable}
                      </label>
                      {v.mutability === "ReadOnly" && (
                        <ReadOnlyBadge setMessage="SetVariables" />
                      )}
                    </div>
                    <Input
                      id={dmId(v.component, v.variable)}
                      value={v.value}
                      readOnly={v.mutability === "ReadOnly"}
                      onChange={(e) =>
                        setDeviceVariable(
                          v.component,
                          v.variable,
                          e.target.value,
                        )
                      }
                      className="h-8 w-36 shrink-0 font-mono"
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })}
      </div>
    );
  }

  // ── OCPP 1.6 Station Config ──
  const keys = config.stationConfig;

  const grouped = keys.reduce(
    (acc, k) => {
      if (GROUP_16_SECURITY.includes(k.key)) acc.Security.push(k);
      else if (GROUP_16_SMART_CHARGING.includes(k.key))
        acc["Smart Charging"].push(k);
      else if (GROUP_16_LOCAL_AUTH.includes(k.key))
        acc["Local Auth List"].push(k);
      else acc["Core / Misc"].push(k);
      return acc;
    },
    {
      "Core / Misc": [],
      Security: [],
      "Smart Charging": [],
      "Local Auth List": [],
    } as Record<string, typeof keys>,
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped)
        .filter(([_, list]) => list.length > 0)
        .map(([groupName, groupKeys]) => {
          const editableCount = groupKeys.filter((k) => !k.readonly).length;
          return (
            <SectionCard
              key={groupName}
              title={groupName}
              icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              description={`${groupKeys.length} keys · ${editableCount} editable`}
            >
              <div className="space-y-0.5 -mx-1">
                {groupKeys.map((k) => (
                  <div
                    key={k.key}
                    className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-1.5 mr-2">
                      <label
                        htmlFor={`cfg-${k.key}`}
                        className={`text-xs font-mono truncate ${
                          k.readonly
                            ? "text-t-muted"
                            : "text-t-secondary font-medium"
                        }`}
                        title={k.key}
                      >
                        {k.key}
                      </label>
                      {k.readonly && (
                        <ReadOnlyBadge setMessage="ChangeConfiguration" />
                      )}
                    </div>
                    <Input
                      id={`cfg-${k.key}`}
                      value={k.value}
                      readOnly={k.readonly}
                      onChange={(e) =>
                        updateStationConfigKey(k.key, e.target.value)
                      }
                      className="h-8 w-36 shrink-0 font-mono"
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SIMULATION TAB
   ═══════════════════════════════════════════ */

const FIRMWARE_STATUSES = [
  "NotDownloaded",
  "Downloading",
  "Downloaded",
  "Installing",
  "Installed",
  "SignatureError",
  "ChecksumError",
  "DownloadFailed",
  "InstallationFailed",
].map((s) => ({ label: s, value: s }));

const formatDelay = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

function SimulationTab() {
  const { config, updateSimulation, isUploading, uploadSecondsLeft, status } =
    useActiveCharger();
  const { simulation } = config;
  const isConnected = status === "connected";

  return (
    <div className="space-y-4">
      {/* Diagnostics Upload */}
      <SectionCard
        title="Diagnostics Upload"
        icon={<FileText className="h-3.5 w-3.5" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="File Name"
            icon={<FileText className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              value={simulation.diagnosticFileName}
              onChange={(e) =>
                updateSimulation({
                  diagnosticFileName: e.target.value,
                })
              }
              className="h-9 text-t-primary text-xs rounded-lg"
            />
          </Field>
          <Field
            label="Duration (s)"
            icon={<Clock className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              type="number"
              value={simulation.diagnosticUploadTime}
              onChange={(e) =>
                updateSimulation({
                  diagnosticUploadTime: Number(e.target.value),
                })
              }
              className="h-9 text-t-primary text-xs rounded-lg"
            />
          </Field>
        </div>
        <Field label="Final Status">
          <OptionSelect
            value={simulation.diagnosticStatus}
            options={[
              { label: "Uploaded", value: "Uploaded" },
              { label: "UploadFailed", value: "UploadFailed" },
            ]}
            onChange={(v) =>
              updateSimulation({
                diagnosticStatus: v as "Uploaded" | "UploadFailed",
              })
            }
          />
        </Field>

        {isUploading && (
          <Notice live icon={<Upload aria-hidden="true" />}>
            Uploading…{" "}
            <span className="font-mono font-semibold text-t-primary">
              {uploadSecondsLeft}s
            </span>{" "}
            left
          </Notice>
        )}

        <Button
          variant="soft-brand"
          className="w-full"
          disabled={!isConnected || isUploading}
          onClick={() => ocppService.startDiagnosticsUpload()}
        >
          <Upload aria-hidden="true" /> Trigger upload
        </Button>
      </SectionCard>

      {/* Firmware */}
      <SectionCard title="Firmware" icon={<Shield className="h-3.5 w-3.5" />}>
        <Field
          label="Firmware Status"
          icon={<Shield className="h-3 w-3" aria-hidden="true" />}
        >
          <OptionSelect
            value={simulation.firmwareStatus}
            options={FIRMWARE_STATUSES}
            onChange={(v) =>
              updateSimulation({ firmwareStatus: v || undefined })
            }
          />
        </Field>
        <Button
          variant="soft-brand"
          className="w-full"
          disabled={!isConnected}
          onClick={() =>
            ocppService.sendFirmwareStatus(simulation.firmwareStatus)
          }
        >
          <Shield aria-hidden="true" /> Send FirmwareStatusNotification
        </Button>
      </SectionCard>

      {/* Auto Charging */}
      <SectionCard
        title="Auto Charging"
        icon={<FlaskConical className="h-3.5 w-3.5" />}
        description="Configure the auto-charge state machine behavior. Target kWh is also the EV battery size SoC is computed against."
      >
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Target kWh"
            icon={<Gauge className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              type="number"
              value={simulation.autoChargeTargetKWh}
              onChange={(e) =>
                updateSimulation({
                  autoChargeTargetKWh: Number(e.target.value),
                })
              }
              className="h-9 text-t-primary text-xs rounded-lg"
            />
          </Field>
          <Field
            label="Duration (s)"
            icon={<Clock className="h-3 w-3" aria-hidden="true" />}
          >
            <Input
              type="number"
              value={simulation.autoChargeDurationSec}
              onChange={(e) =>
                updateSimulation({
                  autoChargeDurationSec: Number(e.target.value),
                })
              }
              className="h-9 text-t-primary text-xs rounded-lg"
            />
          </Field>
        </div>
        <Field
          label="Meter Increment / tick (Wh)"
          icon={<Gauge className="h-3 w-3" aria-hidden="true" />}
        >
          <Input
            type="number"
            value={simulation.autoChargeMeterIncrement}
            onChange={(e) =>
              updateSimulation({
                autoChargeMeterIncrement: Number(e.target.value),
              })
            }
            className="h-9 text-t-primary text-xs rounded-lg"
          />
        </Field>
      </SectionCard>

      {/* MeterValues Measurands */}
      <SectionCard
        title="MeterValues Measurands"
        icon={<Gauge className="h-3.5 w-3.5" />}
        description="Choose which measurands are included in every MeterValues message"
      >
        <fieldset className="grid grid-cols-2 gap-x-3 gap-y-2 @xs:grid-cols-3">
          <legend className="sr-only">Measurands to include</legend>
          {(
            [
              { key: "energy", label: "Energy" },
              { key: "power", label: "Power" },
              { key: "soc", label: "State of charge" },
              { key: "voltage", label: "Voltage" },
              { key: "current", label: "Current" },
              { key: "temperature", label: "Temperature" },
              { key: "frequency", label: "Frequency" },
              { key: "threePhase", label: "Three-phase" },
            ] as {
              key: keyof NonNullable<typeof simulation.measurands>;
              label: string;
            }[]
          ).map(({ key, label }) => (
            <label
              key={key}
              className="flex min-h-8 items-center gap-2 rounded-md px-1.5 cursor-pointer hover:bg-surface-hover"
            >
              <Checkbox
                checked={simulation.measurands?.[key] ?? false}
                onCheckedChange={(checked) =>
                  updateSimulation({
                    measurands: {
                      ...(simulation.measurands ?? {}),
                      [key]: checked,
                    },
                  })
                }
              />
              <span className="text-xs text-t-secondary">{label}</span>
            </label>
          ))}
        </fieldset>
      </SectionCard>

      {/* Response Latency */}
      <SectionCard
        title="Response Latency"
        icon={<Clock className="h-3.5 w-3.5" />}
        description="Add artificial delay to all OCPP responses to test CSMS timeouts"
      >
        <div className="flex items-center gap-3">
          <Slider
            thumbLabel="Response delay"
            getAriaValueText={(_, value) => formatDelay(value)}
            min={0}
            max={30000}
            step={500}
            value={[simulation.responseDelayMs]}
            onValueChange={(v) =>
              updateSimulation({
                responseDelayMs: Array.isArray(v) ? v[0] : v,
              })
            }
            className="flex-1"
          />
          <output className="shrink-0 text-xs font-mono text-t-primary tabular-nums w-14 text-right">
            {formatDelay(simulation.responseDelayMs)}
          </output>
        </div>
        {simulation.responseDelayMs > 0 && (
          <Notice tone="warning" icon={<Clock aria-hidden="true" />}>
            Every response to the CSMS is delayed by{" "}
            {formatDelay(simulation.responseDelayMs)}.
          </Notice>
        )}
      </SectionCard>

      {/* Fault Injection */}
      <FaultInjectionSection />

      {/* Raw Payload Injection */}
      <RawPayloadSection />
    </div>
  );
}

/* ═══════════════════════════════════════════
   FAULT INJECTION SECTION
   ═══════════════════════════════════════════ */

// All six are faults, so they share one (danger) treatment: colour carries
// meaning, not decoration.
const FAULTS = [
  { code: "GroundFailure", label: "Ground fault" },
  { code: "OverVoltage", label: "Over voltage" },
  { code: "PowerMeterFailure", label: "Meter failure" },
  { code: "EVCommunicationError", label: "EV comm error" },
  { code: "ReaderFailure", label: "Reader failure" },
  { code: "InternalError", label: "Internal error" },
] as const;

function FaultInjectionSection() {
  const { status, config } = useActiveCharger();
  const isConnected = status === "connected";
  const [lastFault, setLastFault] = useState("");

  const inject = (code: string) => {
    for (let i = 1; i <= config.numberOfConnectors; i++) {
      ocppService.triggerFault(i, code);
    }
    setLastFault(code);
    setTimeout(() => setLastFault(""), 3000);
  };

  return (
    <SectionCard
      title="Fault Injection"
      icon={<AlertTriangle className="h-3.5 w-3.5" />}
      description="Simulate hardware faults on every connector. Stops active transactions and sends Faulted status."
    >
      <div className="grid grid-cols-2 gap-2">
        {FAULTS.map((f) => (
          <Button
            size="sm"
            key={f.code}
            variant="soft-danger"
            className="justify-start"
            disabled={!isConnected}
            onClick={() => inject(f.code)}
          >
            <Zap aria-hidden="true" />
            {f.label}
          </Button>
        ))}
      </div>
      <div role="status">
        {lastFault && (
          <Notice tone="danger" icon={<AlertTriangle aria-hidden="true" />}>
            Injected fault{" "}
            <span className="font-mono font-semibold text-t-primary">
              {lastFault}
            </span>
          </Notice>
        )}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════
   RAW PAYLOAD INJECTION
   ═══════════════════════════════════════════ */

function RawPayloadSection() {
  const { status } = useActiveCharger();
  const isConnected = status === "connected";
  const [raw, setRaw] = useState('[2,"test-123","Heartbeat",{}]');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!raw.trim()) return;
    ocppService.sendRawString(raw);
    setSent(true);
    setTimeout(() => setSent(false), 1500);
  };

  return (
    <SectionCard
      title="Raw Payload Injection"
      icon={<Terminal className="h-3.5 w-3.5" />}
      description="Send arbitrary strings directly over the WebSocket. Bypasses OCPP validation."
    >
      <Field
        label="Raw frame"
        hint={
          <>
            Use OCPP Call format{" "}
            <code className="font-mono text-t-secondary">
              [2, &quot;id&quot;, &quot;Action&quot;, &#123;&#125;]
            </code>{" "}
            or send malformed data to test error handling.
          </>
        }
      >
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={3}
          spellCheck={false}
          placeholder='[2,"uuid","Action",{...}]'
        />
      </Field>
      <Button
        variant={sent ? "soft-success" : "soft-danger"}
        className="w-full"
        disabled={!isConnected || !raw.trim()}
        onClick={handleSend}
      >
        {sent ? (
          <>
            <Check aria-hidden="true" /> Sent
          </>
        ) : (
          <>
            <Send aria-hidden="true" /> Inject raw payload
          </>
        )}
      </Button>
    </SectionCard>
  );
}
/* ═══════════════════════════════════════════
   LOCAL AUTH LIST TAB
   ═══════════════════════════════════════════ */

const STATUS_TONE: Record<string, "success" | "danger" | "warning" | "brand"> =
  {
    Accepted: "success",
    Blocked: "danger",
    Expired: "warning",
    Invalid: "danger",
    ConcurrentTx: "brand",
  };

function LocalAuthListTab() {
  const { localAuthList, localAuthListVersion } = useActiveCharger();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? localAuthList.filter(
        (e) =>
          e.idTag.toLowerCase().includes(search.toLowerCase()) ||
          (e.idTagInfo?.status ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : localAuthList;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Local Authorization List"
        icon={<KeyRound className="h-3.5 w-3.5" />}
        description={`List version ${localAuthListVersion} · ${localAuthList.length} entries`}
      >
        {localAuthList.length > 0 && (
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-t-muted"
            />
            <Input
              type="search"
              aria-label="Filter by ID tag or status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by ID tag or status"
              className="h-9 pl-9 text-t-primary text-xs rounded-md"
            />
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="max-h-100 overflow-y-auto custom-scrollbar rounded-lg border border-b-default">
            <Table>
              <TableCaption className="sr-only">
                Local authorization list entries
              </TableCaption>
              <TableHeader className="sticky top-0 bg-surface-elevated">
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID tag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => {
                  const status = entry.idTagInfo?.status ?? "Unknown";
                  const expiry = entry.idTagInfo?.expiryDate;
                  return (
                    <TableRow key={entry.idTag}>
                      <TableCell className="max-w-0 truncate px-3 font-mono text-t-primary">
                        {entry.idTag}
                      </TableCell>
                      <TableCell className="px-3">
                        <Badge variant={STATUS_TONE[status] ?? "neutral"}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 font-mono text-t-secondary">
                        {expiry ? new Date(expiry).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <KeyRound
              className="h-8 w-8 text-t-muted mb-3"
              aria-hidden="true"
            />
            <p className="text-sm text-t-secondary font-semibold">
              {localAuthList.length === 0
                ? "No entries yet"
                : "No matching entries"}
            </p>
            <p className="text-xs text-t-muted mt-1">
              {localAuthList.length === 0
                ? "Connect to a CSMS and wait for a SendLocalList command."
                : "Try a different filter."}
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MESSAGE COMPOSER TAB
   ═══════════════════════════════════════════ */

const OCPP_ACTIONS = [
  "Authorize",
  "BootNotification",
  "DataTransfer",
  "DiagnosticsStatusNotification",
  "FirmwareStatusNotification",
  "Heartbeat",
  "MeterValues",
  "StartTransaction",
  "StatusNotification",
  "StopTransaction",
  "SecurityEventNotification",
  "LogStatusNotification",
  "SignCertificate",
];

interface ComposerHistory {
  action: string;
  payload: string;
  timestamp: string;
}

function MessageComposerTab() {
  const { status } = useActiveCharger();
  const isConnected = status === "connected";
  const [action, setAction] = useState("Heartbeat");
  const [payload, setPayload] = useState("{}");
  const [sending, setSending] = useState(false);
  const [jsonError, setJsonError] = useState("");
  const [history, setHistory] = useState<ComposerHistory[]>([]);

  const handleSend = async () => {
    setJsonError("");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payload);
    } catch {
      setJsonError("Invalid JSON");
      return;
    }
    setSending(true);
    setHistory((h) => [
      { action, payload, timestamp: new Date().toLocaleTimeString() },
      ...h.slice(0, 9),
    ]);
    await ocppService.sendRawCall(action, parsed);
    setSending(false);
  };

  const loadFromHistory = (item: ComposerHistory) => {
    setAction(item.action);
    setPayload(item.payload);
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Send OCPP Message"
        icon={<MessageSquare className="h-3.5 w-3.5" />}
        description="Send any CP → CSMS action with custom payload"
      >
        <Field
          label="Action"
          icon={<MessageSquare className="h-3 w-3" aria-hidden="true" />}
        >
          <OptionSelect
            value={action}
            options={OCPP_ACTIONS}
            onChange={(v) => setAction(v)}
          />
        </Field>

        <Field label="Payload (JSON)">
          <Textarea
            value={payload}
            onChange={(e) => {
              setPayload(e.target.value);
              setJsonError("");
            }}
            rows={6}
            spellCheck={false}
            aria-invalid={jsonError ? true : undefined}
            aria-errormessage={jsonError ? "composer-json-error" : undefined}
            placeholder='{ "key": "value" }'
          />
          {jsonError && (
            <p
              id="composer-json-error"
              role="alert"
              className="text-xs text-danger"
            >
              {jsonError}. Check for missing quotes, commas or braces.
            </p>
          )}
        </Field>

        <Button
          variant="default"
          className="w-full"
          disabled={!isConnected || sending}
          onClick={handleSend}
        >
          <Send aria-hidden="true" />
          {sending ? "Sending…" : isConnected ? "Send" : "Connect to send"}
        </Button>
      </SectionCard>

      {/* History */}
      {history.length > 0 && (
        <SectionCard
          title="History"
          icon={<Clock className="h-3.5 w-3.5" />}
          description="Select an entry to load it back into the composer."
        >
          <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            {history.map((h, i) => (
              <li key={`${i?.toString()}-${h.action}`}>
                <Button
                  variant="neutral"
                  onClick={() => loadFromHistory(h)}
                  className="w-full justify-between font-normal"
                >
                  <span className="text-xs font-medium text-t-primary truncate">
                    {h.action}
                  </span>
                  <span className="text-2xs font-mono text-t-muted shrink-0">
                    {h.timestamp}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MACRO TAB
   ═══════════════════════════════════════════ */

const getPrebuiltMacros = (rfidTag: string): ScenarioMacro[] => [
  {
    name: "Full Charge Cycle",
    description:
      "Plug in, authorize, start Tx, send 2 meter values, stop Tx, unplug",
    steps: [
      { action: "plugIn", delayMs: 500 },
      { action: "authorize", params: { idTag: rfidTag }, delayMs: 1500 },
      {
        action: "startTransaction",
        params: { idTag: rfidTag },
        delayMs: 1500,
      },
      { action: "sendMeterValues", delayMs: 3000 },
      { action: "sendMeterValues", delayMs: 3000 },
      { action: "stopTransaction", delayMs: 1500 },
      { action: "unplug", delayMs: 1000 },
    ],
  },
  {
    name: "Auth Failure & Unplug",
    description: "Plug in, send invalid RFID, unplug after failure",
    steps: [
      { action: "plugIn", delayMs: 500 },
      {
        action: "authorize",
        params: { idTag: "INVALID_TAG" },
        delayMs: 2000,
      },
      { action: "unplug", delayMs: 1000 },
    ],
  },
  {
    name: "Fault Recovery",
    description: "Trip a hardware fault, wait 5s, auto-recover to Available",
    steps: [
      {
        action: "triggerFault",
        params: { errorCode: "GroundFailure" },
        delayMs: 1000,
      },
      { action: "wait", delayMs: 5000 },
      {
        action: "sendStatus",
        params: { status: "Available" },
        delayMs: 500,
      },
    ],
  },
];

function MacroTab() {
  const { id, scenarioState, setScenarioState, config } = useActiveCharger();
  const [selectedMacroIdx, setSelectedMacroIdx] = useState(0);

  const scenario = scenarioState;
  const isRunning = scenario.running;
  const prebuiltMacros = getPrebuiltMacros(config.rfidTag || "DEADBEEF");
  const activeMacro = prebuiltMacros[selectedMacroIdx];

  const macroToDisplay = isRunning
    ? prebuiltMacros.find((m) => m.name === scenario.macroName) || activeMacro
    : activeMacro;

  const handleRun = () => {
    getService(id).runScenario(activeMacro.name, activeMacro.steps);
  };

  const handleRunAll = () => {
    const store = useEmulatorStore.getState();
    store.chargers.forEach((c) => {
      if (c.runtime.status === "connected") {
        const macrosForC = getPrebuiltMacros(c.config.rfidTag || "DEADBEEF");
        const macroToRun = macrosForC[selectedMacroIdx];
        getService(c.id).runScenario(macroToRun.name, macroToRun.steps);
      }
    });
  };

  const handleStop = () => {
    setScenarioState({ running: false });
  };

  const handleStopAll = () => {
    const store = useEmulatorStore.getState();
    store.chargers.forEach((c) => {
      store.setScenarioState(c.id, { running: false });
    });
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <SectionCard
        title="Automated Scenarios"
        icon={<ListVideo className="h-4 w-4" />}
        description="Run pre-recorded sequences of OCPP operations"
      >
        <Field label="Scenario" hint={macroToDisplay.description}>
          <OptionSelect
            value={String(selectedMacroIdx)}
            options={prebuiltMacros.map((m, i) => ({
              label: m.name,
              value: String(i),
            }))}
            onChange={(v) => setSelectedMacroIdx(Number(v))}
            disabled={isRunning}
          />
        </Field>

        <div className="rounded-lg border border-b-default bg-surface-card p-3">
          <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wider text-t-muted">
            Steps
          </h4>
          <ol className="flex flex-col gap-1.5 max-h-62.5 overflow-y-auto custom-scrollbar">
            {macroToDisplay.steps.map((step, idx) => {
              const isActive = isRunning && scenario.currentStep === idx;
              const isPast = isRunning && scenario.currentStep > idx;
              return (
                <li
                  key={`${activeMacro.name}-step-${idx?.toString()}`}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex items-center gap-3 rounded-md border p-2 text-xs ${
                    isActive
                      ? "border-brand/50 bg-brand-subtle text-brand-strong"
                      : isPast
                        ? "border-transparent bg-success/5 text-t-muted"
                        : "border-transparent bg-surface-inset text-t-secondary"
                  }`}
                >
                  <span className="w-5 shrink-0 font-mono text-t-muted">
                    {isPast ? (
                      <Check
                        className="size-3.5 text-success"
                        aria-label="Done"
                      />
                    ) : (
                      `${idx + 1}.`
                    )}
                  </span>
                  <span className="w-32 shrink-0 font-semibold">
                    {step.action}
                  </span>
                  <span className="truncate font-mono text-t-muted">
                    {step.params ? JSON.stringify(step.params) : ""}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-t-muted">
                    {step.delayMs}ms
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex gap-2">
          {!isRunning ? (
            <>
              <Button
                variant="default"
                size="lg"
                className="flex-1"
                onClick={handleRun}
              >
                <Play aria-hidden="true" /> Run scenario
              </Button>
              <Button
                variant="neutral"
                size="lg"
                onClick={handleRunAll}
                title="Run on every connected charger"
              >
                Run on all
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="danger"
                size="lg"
                className="flex-1"
                onClick={handleStop}
              >
                <Square aria-hidden="true" fill="currentColor" /> Stop
              </Button>
              <Button
                variant="soft-danger"
                size="lg"
                onClick={handleStopAll}
                title="Stop on every charger"
              >
                Stop all
              </Button>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CONFIG PANEL
   ═══════════════════════════════════════════ */

export function ConfigPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>("connection");
  const uid = useId();

  return (
    <aside
      aria-labelledby={`${uid}-title`}
      className="@container flex flex-col h-full bg-surface-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-b-subtle shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary flex items-center justify-center">
            <Settings2 className="size-4 text-white" aria-hidden="true" />
          </div>
          <h2
            id={`${uid}-title`}
            className="text-sm font-semibold text-t-primary"
          >
            Configuration
          </h2>
        </div>
        <IconButton label="Close configuration panel" onClick={onClose}>
          <X aria-hidden="true" />
        </IconButton>
      </div>

      {/* shadcn Tabs (Base UI): arrow keys, Home/End and tab/panel wiring */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="flex-1 min-h-0 gap-0"
      >
        <div className="px-3 py-2 border-b border-b-subtle shrink-0">
          <TabsList
            aria-label="Configuration sections"
            activateOnFocus
            className="grid w-full grid-cols-4 @xl:grid-cols-7 h-auto bg-transparent p-0"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <Icon aria-hidden="true" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {TABS.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="@container min-h-0 flex-1 overflow-y-auto custom-scrollbar p-3"
          >
            {tab.id === "connection" && <ConnectionTab />}
            {tab.id === "vendor" && <VendorTab />}
            {tab.id === "station" && <StationConfigTab />}
            {tab.id === "simulation" && <SimulationTab />}
            {tab.id === "auth" && <LocalAuthListTab />}
            {tab.id === "composer" && <MessageComposerTab />}
            {tab.id === "macro" && <MacroTab />}
          </TabsContent>
        ))}
      </Tabs>
    </aside>
  );
}

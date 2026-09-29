import Link from "next/link";
import { CodeBlock, FeatureGrid, Prose, Section, SimulatorCta } from "../ui";

export const faqs = [
  {
    q: "What is the main difference between OCPP 1.6 and OCPP 2.0.1?",
    a: "OCPP 2.0.1 replaces StartTransaction and StopTransaction with a single TransactionEvent message, models chargers as EVSEs with connectors, and replaces configuration keys with a device model of components and variables read and written through GetVariables and SetVariables.",
  },
  {
    q: "Does the simulator support OCPP 2.1?",
    a: "Yes. OCPP 2.0.1 and 2.1 are both selectable; the simulator negotiates the matching WebSocket subprotocol (ocpp2.0.1 or ocpp2.1).",
  },
  {
    q: "Can I test device model variables?",
    a: "Yes. The simulator exposes a device model the CSMS can read with GetVariables and change with SetVariables; read-only variables are rejected, and you can view and edit the values in the Config tab.",
  },
];

const FRAME = `// Charging station → CSMS
[2, "c71e", "TransactionEvent", {
  "eventType": "Started",
  "seqNo": 1,
  "timestamp": "2026-09-29T10:00:00Z",
  "triggerReason": "Authorized",
  "transactionInfo": {
    "transactionId": "1759140000000",
    "chargingState": "Charging"
  },
  "evse": { "id": 1, "connectorId": 1 },
  "idToken": { "idToken": "DEADBEEF", "type": "ISO14443" }
}]`;

export function Ocpp201SimulatorBody() {
  return (
    <Prose>
      <Section id="changes" title="What changes in OCPP 2.0.1">
        <ul>
          <li>
            <strong>TransactionEvent</strong> covers the whole transaction
            lifecycle with <code>Started</code>, <code>Updated</code> and{" "}
            <code>Ended</code> events and a sequence number.
          </li>
          <li>
            <strong>EVSEs and connectors</strong>: status is reported per EVSE
            and connector, with a simpler status set (Available, Occupied,
            Reserved, Unavailable, Faulted).
          </li>
          <li>
            <strong>Device model</strong>: configuration becomes components and
            variables, managed with <code>GetVariables</code> and{" "}
            <code>SetVariables</code>.
          </li>
          <li>
            <strong>ID tokens</strong> carry a type (ISO14443, eMAID and others)
            instead of a bare ID tag.
          </li>
        </ul>
        <CodeBlock label="OCPP 2.0.1 TransactionEvent" code={FRAME} />
      </Section>

      <Section id="supported" title="What the simulator supports">
        <FeatureGrid
          items={[
            {
              title: "Transactions",
              body: "TransactionEvent Started and Ended with energy, plus RequestStartTransaction and RequestStopTransaction from the CSMS.",
            },
            {
              title: "Status and availability",
              body: "StatusNotification per EVSE and connector, ChangeAvailability, Reset, UnlockConnector, TriggerMessage.",
            },
            {
              title: "Device model",
              body: "GetVariables and SetVariables against an editable set of components and variables.",
            },
            {
              title: "Smart charging",
              body: "SetChargingProfile, ClearChargingProfile, GetChargingProfiles, GetCompositeSchedule.",
            },
            {
              title: "Driver-facing messages",
              body: "Display messages and CostUpdated, shown live on the connector panel.",
            },
            {
              title: "Security",
              body: "Certificate installation and removal, and GetLog, over ws:// or TLS-encrypted wss://.",
            },
          ]}
        />
      </Section>

      <Section id="switch" title="Switching versions">
        <p>
          Each charger has its own OCPP version, so you can run a 1.6J charger
          and a 2.0.1 charger side by side against the same CSMS. Change the
          version while disconnected; the simulator then negotiates the matching
          WebSocket subprotocol on connect.
        </p>
        <p>
          Still on 1.6? See the{" "}
          <Link href="/ocpp-1-6-simulator">OCPP 1.6J simulator guide</Link>.
        </p>
      </Section>

      <SimulatorCta title="Test your OCPP 2.0.1 or 2.1 CSMS" />
    </Prose>
  );
}

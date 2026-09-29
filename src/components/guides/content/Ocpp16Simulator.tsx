import Link from "next/link";
import { CodeBlock, FeatureGrid, Prose, Section, SimulatorCta } from "../ui";

export const faqs = [
  {
    q: "What is OCPP 1.6J?",
    a: "OCPP 1.6J is version 1.6 of the Open Charge Point Protocol using JSON over WebSocket (the 'J' stands for JSON; 1.6S was the SOAP variant). It is still the most widely deployed OCPP version on public chargers.",
  },
  {
    q: "Which WebSocket subprotocol does OCPP 1.6J use?",
    a: "ocpp1.6. The charge point connects to the CSMS URL with its identity appended to the path and requests the ocpp1.6 subprotocol during the WebSocket handshake.",
  },
  {
    q: "Does the simulator support the OCPP 1.6 security extensions?",
    a: "It answers the security-whitepaper messages for certificates, signed firmware updates and log retrieval, and connects over plain ws:// or encrypted wss:// URLs.",
  },
];

const FRAMES = `// Charge point → CSMS  (CALL: [2, uniqueId, action, payload])
[2, "8f3a", "BootNotification", {
  "chargePointVendor": "Elmo",
  "chargePointModel": "Virtual-Emulator-1"
}]

// CSMS → charge point  (CALLRESULT: [3, uniqueId, payload])
[3, "8f3a", {
  "status": "Accepted",
  "currentTime": "2026-09-29T10:00:00Z",
  "interval": 300
}]

// Later, during a transaction
[2, "91c2", "MeterValues", {
  "connectorId": 1,
  "transactionId": 1001,
  "meterValue": [{
    "timestamp": "2026-09-29T10:05:00Z",
    "sampledValue": [
      { "measurand": "Energy.Active.Import.Register", "value": "4500", "unit": "Wh" },
      { "measurand": "SoC", "value": "15.0", "unit": "Percent", "location": "EV" }
    ]
  }]
}]`;

export function Ocpp16SimulatorBody() {
  return (
    <Prose>
      <Section id="overview" title="OCPP 1.6J in a nutshell">
        <p>
          In OCPP 1.6J the charge point keeps one WebSocket open to the Central
          System and both sides send <strong>CALL</strong> frames that the other
          answers with a <strong>CALLRESULT</strong> or{" "}
          <strong>CALLERROR</strong>. Transactions are bracketed by{" "}
          <code>StartTransaction</code> and <code>StopTransaction</code>, and
          energy is reported in between with <code>MeterValues</code>.
        </p>
        <CodeBlock label="OCPP 1.6J frames" code={FRAMES} />
      </Section>

      <Section id="sends" title="Messages the simulator sends">
        <p>
          <code>BootNotification</code>, <code>Heartbeat</code>,{" "}
          <code>StatusNotification</code>, <code>Authorize</code>,{" "}
          <code>StartTransaction</code>, <code>MeterValues</code>,{" "}
          <code>StopTransaction</code>, <code>DataTransfer</code>,{" "}
          <code>DiagnosticsStatusNotification</code>,{" "}
          <code>FirmwareStatusNotification</code>,{" "}
          <code>SecurityEventNotification</code> and{" "}
          <code>LogStatusNotification</code> — plus any other action with a
          custom payload from the built-in message composer.
        </p>
      </Section>

      <Section id="answers" title="CSMS commands it answers">
        <FeatureGrid
          items={[
            {
              title: "Remote control",
              body: "RemoteStartTransaction, RemoteStopTransaction, Reset, UnlockConnector, ChangeAvailability, TriggerMessage.",
            },
            {
              title: "Configuration",
              body: "GetConfiguration and ChangeConfiguration, with read-only keys rejected as a real charger would.",
            },
            {
              title: "Reservations and authorization",
              body: "ReserveNow, CancelReservation, SendLocalList, GetLocalListVersion, ClearCache.",
            },
            {
              title: "Smart charging",
              body: "SetChargingProfile, ClearChargingProfile, GetCompositeSchedule.",
            },
            {
              title: "Firmware and diagnostics",
              body: "UpdateFirmware and GetDiagnostics run their full status sequences; SignedUpdateFirmware and GetLog from the security extension.",
            },
            {
              title: "Certificates and data transfer",
              body: "InstallCertificate, DeleteCertificate, GetInstalledCertificateIds, CertificateSigned, ExtendedTriggerMessage, DataTransfer.",
            },
          ]}
        />
      </Section>

      <Section id="connect" title="Connecting to your Central System">
        <ol>
          <li>
            Set the CSMS URL, for example <code>ws://localhost:9000</code>. The
            charge point ID is appended to the path when connecting.
          </li>
          <li>
            Pick <strong>OCPP 1.6J</strong>. Use a <code>wss://</code> URL if
            your server requires TLS.
          </li>
          <li>
            Select <strong>Connect</strong>. After an accepted BootNotification
            the simulator sends heartbeats at the interval your CSMS returned.
          </li>
        </ol>
        <p>
          Moving to the newer protocol? The{" "}
          <Link href="/ocpp-2-0-1-simulator">OCPP 2.0.1 simulator guide</Link>{" "}
          covers what changes.
        </p>
      </Section>

      <SimulatorCta title="Test your OCPP 1.6J Central System" />
    </Prose>
  );
}

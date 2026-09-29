import Link from "next/link";
import { Callout, FeatureGrid, Prose, Section, SimulatorCta } from "../ui";

export const faqs = [
  {
    q: "Can I simulate an EV charging session without hardware?",
    a: "Yes. The simulator emulates the charger side of the session over OCPP: plug in, authorize, start the transaction, report meter values and state of charge, then stop and unplug — all from the browser.",
  },
  {
    q: "How is state of charge (SoC) calculated?",
    a: "SoC is the energy delivered in the current session divided by the configured battery capacity, sent with one decimal place. Every session starts from an empty battery; the energy meter itself keeps counting across sessions, as a real meter does.",
  },
  {
    q: "Can I stop charging at 80%?",
    a: "Yes. Set the auto-charge target to 80%, 90% or 100% of the battery capacity. Auto charge stops the transaction when the session reaches that state of charge.",
  },
  {
    q: "Can I simulate charger faults?",
    a: "Yes. Trip any OCPP error code (for example GroundFailure or OverVoltage) on a connector, force the charger offline, or delay every response to test CSMS timeouts.",
  },
];

export function EvChargerSimulatorBody() {
  return (
    <Prose>
      <Section id="what" title="What an EV charger simulator does">
        <p>
          An <strong>EV charger simulator</strong> (or EV charger emulator)
          stands in for a physical charging station. It reproduces what a real
          charger reports to its backend — connector status, authorization,
          energy delivered, faults — so you can build and test charging software
          without a car, a charger or a lab.
        </p>
        <p>
          This one speaks <Link href="/ocpp-simulator">OCPP</Link>, the open
          protocol most chargers use, so the backend you test against it is the
          same one that will run your real fleet.
        </p>
      </Section>

      <Section id="session" title="A full charging session, step by step">
        <ol>
          <li>
            <strong>Plug in</strong> — the connector goes from{" "}
            <code>Available</code> to <code>Preparing</code>.
          </li>
          <li>
            <strong>Authorize</strong> — the simulator sends the ID tag (RFID)
            to the CSMS and shows whether it was accepted.
          </li>
          <li>
            <strong>Start the transaction</strong> — status becomes{" "}
            <code>Charging</code> and the transaction ID appears.
          </li>
          <li>
            <strong>Charge</strong> — meter values arrive at the configured
            sample interval: energy, power, voltage, current, state of charge
            and more.
          </li>
          <li>
            <strong>Stop and unplug</strong> — with the stop reason you choose
            (Local, Remote, EVDisconnected and others), then back to{" "}
            <code>Available</code>.
          </li>
        </ol>
        <p>
          Or press <strong>Auto charge</strong> and the simulator runs the whole
          session for you until the battery reaches its target.
        </p>
      </Section>

      <Section id="battery" title="Battery and state of charge">
        <p>
          Pick a vehicle preset — PHEV (18 kWh), city EV (30 kWh), sedan (60
          kWh), SUV (77 kWh) or truck (100 kWh) — or enter any capacity. State
          of charge is the energy delivered this session divided by that
          capacity, sent in <code>MeterValues</code> with one decimal place.
        </p>
        <p>
          Choose where auto charge stops: <strong>80%</strong> (daily charging),{" "}
          <strong>90%</strong> or <strong>100%</strong>. The energy register
          carries over between sessions, like a real meter, while each new
          session starts from an empty battery.
        </p>
      </Section>

      <Section id="measurands" title="Meter values you can send">
        <FeatureGrid
          items={[
            {
              title: "Energy and power",
              body: "Energy.Active.Import.Register in Wh and Power.Active.Import in W.",
            },
            {
              title: "Voltage and current",
              body: "Per phase, with single- or three-phase wiring.",
            },
            {
              title: "State of charge",
              body: "SoC in percent, measured at the EV.",
            },
            {
              title: "Temperature and frequency",
              body: "Optional measurands for thermal and grid testing.",
            },
          ]}
        />
      </Section>

      <Section id="edge-cases" title="Faults and other edge cases">
        <ul>
          <li>
            <strong>Fault injection</strong> — trip any OCPP error code on a
            connector; active transactions stop as they would on real hardware.
          </li>
          <li>
            <strong>Offline mode</strong> — drop the network, queue messages and
            replay them when the charger comes back.
          </li>
          <li>
            <strong>Response latency</strong> — delay every reply by up to 30
            seconds to test CSMS timeouts.
          </li>
          <li>
            <strong>
              Reservations, charging profiles and local auth lists
            </strong>{" "}
            — all handled when the CSMS sends them.
          </li>
        </ul>
        <Callout>
          Need many chargers? Open several as tabs, or use{" "}
          <strong>Fleet spawn</strong> to create and connect up to 50 at once
          for load testing.
        </Callout>
      </Section>

      <SimulatorCta title="Simulate your first charging session" />
    </Prose>
  );
}

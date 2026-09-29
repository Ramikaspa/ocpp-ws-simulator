import Link from "next/link";
import { FeatureGrid, Prose, Section, SimulatorCta } from "../ui";

export const faqs = [
  {
    q: "What is an OCPP simulator?",
    a: "An OCPP simulator is software that behaves like a real EV charge point. It connects to a CSMS (Central System) over WebSocket and exchanges OCPP messages — boot, authorization, transactions, meter values — so you can test the backend without charging hardware.",
  },
  {
    q: "Is an OCPP emulator the same as an OCPP simulator?",
    a: "Yes — both terms describe software that acts as a charge point over OCPP. “Simulator” stresses that no charging hardware is involved; “emulator” stresses that it speaks the real protocol, message for message, to a real CSMS. This tool is both.",
  },
  {
    q: "Is this OCPP simulator free?",
    a: "Yes. OCPP WS Simulator is free and open source under the MIT license. It runs in your browser with no install and no account.",
  },
  {
    q: "Which OCPP versions are supported?",
    a: "OCPP 1.6J, OCPP 2.0.1 and OCPP 2.1, all using JSON over WebSocket (OCPP-J).",
  },
  {
    q: "Can it connect to a CSMS running on localhost?",
    a: "Yes. When the simulator itself runs locally it connects directly. From the hosted HTTPS site, allow insecure content for the site in your browser settings, or expose your CSMS through a tunnel such as ngrok.",
  },
];

export function OcppSimulatorBody() {
  return (
    <Prose>
      <Section id="what" title="What is an OCPP simulator?">
        <p>
          The <strong>Open Charge Point Protocol (OCPP)</strong> is how EV
          chargers talk to the software that manages them — the{" "}
          <strong>CSMS</strong> (Charging Station Management System, called the
          Central System in OCPP 1.6). A charger opens a WebSocket to the CSMS,
          announces itself with a BootNotification, and from then on both sides
          exchange JSON messages: authorizations, transactions, meter readings,
          status changes and remote commands.
        </p>
        <p>
          An <strong>OCPP simulator</strong> — also called an{" "}
          <strong>OCPP emulator</strong> or charge point emulator — plays the
          charger&apos;s side of that conversation. Instead of wiring up real
          hardware, you point a virtual charge point at your CSMS and drive it
          from a UI. That makes it the fastest way to develop, debug and
          regression-test OCPP backends, and to reproduce edge cases that are
          hard to trigger on a physical charger.
        </p>
      </Section>

      <Section id="features" title="What this simulator can do">
        <FeatureGrid
          items={[
            {
              title: "Three OCPP versions",
              body: (
                <>
                  <Link href="/ocpp-1-6-simulator">OCPP 1.6J</Link>,{" "}
                  <Link href="/ocpp-2-0-1-simulator">2.0.1 and 2.1</Link> over
                  WebSocket, switchable per charger.
                </>
              ),
            },
            {
              title: "Real charging sessions",
              body: (
                <>
                  Plug in, authorize, start, stop or{" "}
                  <Link href="/ev-charger-simulator">auto-charge</Link> with
                  live meter values and state of charge.
                </>
              ),
            },
            {
              title: "Remote commands",
              body: "Answers RemoteStart/Stop, Reset, UnlockConnector, TriggerMessage, Get/ChangeConfiguration and around 30 more CSMS requests.",
            },
            {
              title: "Many chargers at once",
              body: "Open chargers as editor-style tabs, or spawn a whole fleet to load-test your CSMS.",
            },
            {
              title: "Edge cases on demand",
              body: "Inject hardware faults, drop offline, add response latency or send malformed frames.",
            },
            {
              title: "Every message logged",
              body: "A live log of each frame with direction and timing, exportable as JSON or CSV.",
            },
          ]}
        />
      </Section>

      <Section id="how" title="How to test a CSMS in four steps">
        <ol>
          <li>
            <Link href="/">Open the simulator</Link>. It runs entirely in the
            browser.
          </li>
          <li>
            Open <strong>Configuration</strong> and enter your CSMS WebSocket
            URL (for example <code>wss://csms.example.com/ocpp</code>) and the
            charge point ID your CSMS expects.
          </li>
          <li>
            Choose the OCPP version and select <strong>Connect</strong>. The
            simulator sends a BootNotification and starts heartbeats once it is
            accepted.
          </li>
          <li>
            Plug in, authorize and start a transaction — or wait for your CSMS
            to send a RemoteStartTransaction — and watch each message in the
            log.
          </li>
        </ol>
        <p>
          Testing a CSMS on your own machine? See{" "}
          <Link href="/test-csms-locally">connecting to ws://localhost</Link>.
        </p>
      </Section>

      <Section id="who" title="Who uses it">
        <ul>
          <li>
            <strong>CSMS developers</strong> building or debugging an OCPP
            backend.
          </li>
          <li>
            <strong>QA engineers</strong> reproducing charger behaviour, faults
            and timeouts on demand.
          </li>
          <li>
            <strong>Charge point operators and integrators</strong> checking a
            platform before real hardware arrives.
          </li>
          <li>
            <strong>Students and newcomers</strong> learning how OCPP works by
            watching real message exchanges.
          </li>
        </ul>
        <p>
          Building the CSMS in Node.js? The simulator is built on the same
          library you can use for the server —{" "}
          <Link href="/ocpp-nodejs">see OCPP in Node.js with ocpp-ws-io</Link>.
        </p>
      </Section>

      <SimulatorCta />
    </Prose>
  );
}

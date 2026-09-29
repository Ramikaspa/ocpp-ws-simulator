import Link from "next/link";
import { LIB_GITHUB_URL, LIB_NPM_URL, LIB_URL } from "@/lib/site";
import {
  Callout,
  CodeBlock,
  FeatureGrid,
  Prose,
  Section,
  SimulatorCta,
} from "../ui";

export const faqs = [
  {
    q: "What is the best way to use OCPP in Node.js?",
    a: "Use an OCPP-J RPC library that handles the WebSocket connection, message framing, request/response matching and error codes for you. ocpp-ws-io is one such library: it supports OCPP 1.6J, 2.0.1 and 2.1 with typed messages in TypeScript.",
  },
  {
    q: "What does OCPP RPC mean?",
    a: "OCPP-J carries remote procedure calls over WebSocket as JSON arrays: a CALL [2, id, action, payload], answered by a CALLRESULT [3, id, payload] or a CALLERROR [4, id, code, description, details]. An OCPP RPC library implements that framing for you.",
  },
  {
    q: "Is ocpp-ws-io an alternative to ocpp-rpc?",
    a: "Both are open-source Node.js libraries for the OCPP-J RPC framing. ocpp-ws-io adds typed messages for OCPP 1.6J, 2.0.1 and 2.1, optional JSON schema validation, all security profiles, Redis clustering and a browser client. Compare both projects' documentation to choose what fits your stack.",
  },
  {
    q: "How do I test my Node.js CSMS?",
    a: "Start your server, open the OCPP WS Simulator, set the endpoint to your server's WebSocket URL (for example ws://localhost:9000) and connect. The simulator acts as a real charge point.",
  },
];

const SERVER = `import { OCPPServer } from "ocpp-ws-io";

const server = new OCPPServer({
  protocols: ["ocpp1.6", "ocpp2.0.1"],
  logging: { prettify: true, exchangeLog: true, level: "info" },
});

server.on("client", (client) => {
  console.log(\`\${client.identity} connected\`);

  client.handle("ocpp1.6", "BootNotification", ({ params }) => {
    console.log("Boot from:", params.chargePointVendor);
    return {
      status: "Accepted",
      currentTime: new Date().toISOString(),
      interval: 300,
    };
  });
});

await server.listen(9000);`;

const CLIENT = `import { OCPPClient } from "ocpp-ws-io";

const client = new OCPPClient({
  endpoint: "ws://localhost:9000",
  identity: "CP001",
  protocols: ["ocpp1.6"],
});

client.handle("ocpp1.6", "Reset", async ({ params }) => {
  console.log("Reset requested:", params.type);
  return { status: "Accepted" };
});

await client.connect();

const response = await client.call("ocpp1.6", "BootNotification", {
  chargePointVendor: "VendorX",
  chargePointModel: "ModelY",
});
console.log("Status:", response.status);`;

export function OcppNodejsBody() {
  return (
    <Prose>
      <Section id="why" title="OCPP in Node.js">
        <p>
          OCPP-J is JSON over WebSocket, which makes Node.js a natural fit for a
          CSMS: one process can hold thousands of charger connections and handle
          their messages asynchronously. What you don&apos;t want to write by
          hand is the protocol plumbing — message framing, matching responses to
          requests, timeouts and the OCPP error codes.
        </p>
        <p>
          <a href={LIB_URL}>ocpp-ws-io</a> is an{" "}
          <strong>OCPP RPC WebSocket library</strong> for Node.js and TypeScript
          that does exactly that, for OCPP 1.6J, 2.0.1 and 2.1. It is also what
          powers this simulator, so the same library sits on both ends of your
          tests.
        </p>
      </Section>

      <Section id="rpc" title="What “OCPP RPC” means">
        <p>
          OCPP-J sends remote procedure calls as JSON arrays. A{" "}
          <strong>CALL</strong> is <code>[2, id, action, payload]</code>; the
          receiver replies with a <strong>CALLRESULT</strong>{" "}
          <code>[3, id, payload]</code> or a <strong>CALLERROR</strong>{" "}
          <code>[4, id, code, description, details]</code>. An OCPP RPC library
          handles that framing, so your code works with typed requests and
          responses.
        </p>
      </Section>

      <Section id="features" title="What ocpp-ws-io gives you">
        <FeatureGrid
          items={[
            {
              title: "OCPP 1.6J, 2.0.1 and 2.1",
              body: "Full OCPP-J RPC framing with version-aware handlers.",
            },
            {
              title: "Type-safe TypeScript",
              body: "Generated types for every OCPP action and payload.",
            },
            {
              title: "Schema validation",
              body: "Optional strict JSON schema validation of messages.",
            },
            {
              title: "All security profiles",
              body: "Plain WebSocket, Basic Auth, TLS and mutual TLS.",
            },
            {
              title: "Scales out",
              body: "Redis pub/sub clustering for multi-node CSMS deployments.",
            },
            {
              title: "Client, server and browser",
              body: "Server and client for Node.js, plus a browser client.",
            },
          ]}
        />
      </Section>

      <Section id="server" title="Build a minimal CSMS">
        <p>Install the package:</p>
        <CodeBlock label="Terminal" code="npm install ocpp-ws-io" />
        <p>
          Then start a server that accepts OCPP 1.6J and 2.0.1 chargers and
          answers their BootNotification:
        </p>
        <CodeBlock label="server.ts" code={SERVER} />
      </Section>

      <Section id="test" title="Test it with the simulator">
        <ol>
          <li>
            Run the server above; it listens on <code>ws://localhost:9000</code>
            .
          </li>
          <li>
            <Link href="/">Open the simulator</Link>, keep the endpoint{" "}
            <code>ws://localhost:9000</code> and select <strong>Connect</strong>
            .
          </li>
          <li>
            Your server logs the connection and the BootNotification. Add more
            handlers — Authorize, StartTransaction, MeterValues — and drive them
            from the simulator.
          </li>
        </ol>
        <Callout>
          Using the hosted simulator over HTTPS against a server on your own
          machine? Browsers block <code>ws://localhost</code> from HTTPS by
          default —{" "}
          <Link href="/test-csms-locally">here is how to allow it</Link>.
        </Callout>
      </Section>

      <Section id="client" title="Or write a charge point in Node.js">
        <p>
          The same library also works on the charger side, for scripted tests
          and headless simulators:
        </p>
        <CodeBlock label="charge-point.ts" code={CLIENT} />
        <p>
          Full API reference and guides:{" "}
          <a href={LIB_URL}>ocpp-ws-io documentation</a> ·{" "}
          <a href={LIB_NPM_URL}>npm</a> · <a href={LIB_GITHUB_URL}>GitHub</a>.
        </p>
      </Section>

      <SimulatorCta
        title="Point the simulator at your Node.js CSMS"
        body="Connect a virtual charge point to ws://localhost:9000 and watch every OCPP message."
      />
    </Prose>
  );
}

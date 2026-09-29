import Link from "next/link";
import { GITHUB_URL } from "@/lib/site";
import { Callout, CodeBlock, Prose, Section, SimulatorCta } from "../ui";

export const faqs = [
  {
    q: "Why can't the simulator connect to ws://localhost?",
    a: "When the simulator is opened over HTTPS, browsers block unencrypted ws:// connections from it as mixed content, and newer Chrome versions also ask before a site can reach devices on your local network. Allow insecure content for the site, run the simulator locally, or use a wss:// tunnel.",
  },
  {
    q: "Do I need a tunnel to test locally?",
    a: "No. Allowing insecure content for the simulator site, or running the simulator itself on localhost, both work without a tunnel. A tunnel is useful when browser settings can't be changed, for example on a managed work machine.",
  },
  {
    q: "How do I check that my CSMS is reachable?",
    a: "Open the Localhost guide from the simulator header, go to Test and run the WebSocket test against your port. It reports whether the connection succeeded, was blocked by the browser or was refused, with the round-trip time.",
  },
];

export function TestCsmsLocallyBody() {
  return (
    <Prose>
      <Section id="why" title="Why the browser blocks localhost">
        <p>
          The hosted simulator runs on <strong>HTTPS</strong>. A page loaded
          over HTTPS may not open an unencrypted <code>ws://</code> connection —
          browsers treat it as mixed content — and recent Chrome versions also
          ask before a public site can reach devices on your local network. Your
          CSMS at <code>ws://localhost:9000</code> is both, so the connection is
          refused until you allow it.
        </p>
      </Section>

      <Section id="option-1" title="Option 1: allow insecure content (fastest)">
        <p>
          <strong>Chrome, Edge and Brave:</strong>
        </p>
        <ol>
          <li>
            Click the site information icon at the left of the address bar, then{" "}
            <strong>Site settings</strong>.
          </li>
          <li>
            Set <strong>Insecure content</strong> to <strong>Allow</strong>. If{" "}
            <strong>Local network access</strong> is listed, allow it too.
          </li>
          <li>Reload the simulator and connect.</li>
        </ol>
        <p>
          <strong>Firefox:</strong> open <code>about:config</code>, accept the
          warning, set <code>network.websocket.allowInsecureFromHTTPS</code> to{" "}
          <code>true</code> and reload.
        </p>
      </Section>

      <Section id="option-2" title="Option 2: run the simulator locally">
        <p>
          Served from <code>http://localhost</code>, the simulator can reach any
          local port with no browser changes:
        </p>
        <CodeBlock
          label="Terminal"
          code={`git clone ${GITHUB_URL}.git
cd ocpp-ws-simulator
npm install
npm run dev`}
        />
        <p>
          Then open <code>http://localhost:3000</code>. If your CSMS also uses
          port 3000, run the simulator on another port with{" "}
          <code>npm run dev -- -p 3100</code>.
        </p>
      </Section>

      <Section id="option-3" title="Option 3: expose your CSMS with a tunnel">
        <p>
          A tunnel gives your local server a public <code>wss://</code> address,
          which HTTPS pages may always use:
        </p>
        <CodeBlock
          label="Terminal"
          code={`# ngrok
ngrok http 9000
# → use wss://<your-subdomain>.ngrok-free.app as the CSMS URL

# or Cloudflare Tunnel
cloudflared tunnel --url http://localhost:9000`}
        />
        <p>
          Replace <code>https://</code> with <code>wss://</code> in the address
          the tunnel prints.
        </p>
      </Section>

      <Section id="check" title="Check the connection">
        <p>
          The simulator header has a <strong>Localhost guide</strong> with a
          built-in reachability test: enter your port, run the WebSocket test
          and it tells you whether the connection succeeded, was blocked by the
          browser or was refused — and applies the URL to your charger in one
          click.
        </p>
        <Callout>
          Building the CSMS itself? Start from the{" "}
          <Link href="/ocpp-nodejs">Node.js OCPP server example</Link>, which
          listens on <code>ws://localhost:9000</code> — the simulator&apos;s
          default endpoint.
        </Callout>
      </Section>

      <SimulatorCta
        title="Connect to your local CSMS"
        body="Open the simulator, keep ws://localhost:9000 and select Connect."
      />
    </Prose>
  );
}

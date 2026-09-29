import {
  DEFAULT_DESCRIPTION,
  FEATURES,
  GITHUB_URL,
  GUIDES,
  guideUrl,
  LIB_NPM_URL,
  LIB_URL,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

// llms.txt (https://llmstxt.org): a plain-text map of the site for AI search
// and answer engines. Static — rebuilt with the site.
export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE_NAME}

> ${DEFAULT_DESCRIPTION}

${SITE_NAME} is a free, open-source web app that emulates OCPP charge points (EV chargers) in the browser. It connects to any CSMS (Central System) over WebSocket, so developers can test OCPP backends without hardware. It is built on ocpp-ws-io, an OCPP RPC WebSocket library for Node.js and TypeScript.

## What it does

${FEATURES.map((f) => `- ${f}`).join("\n")}

## Pages

- [Simulator](${SITE_URL}/): the app itself — connect a virtual charge point to your CSMS
${GUIDES.map((g) => `- [${g.title}](${guideUrl(g.slug)}): ${g.description}`).join("\n")}

## Related

- [ocpp-ws-io documentation](${LIB_URL}): OCPP RPC client and server library for Node.js
- [ocpp-ws-io on npm](${LIB_NPM_URL})
- [Source code on GitHub](${GITHUB_URL})
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

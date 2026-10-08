const http = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const port = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();

const chargerSessions = new Map();
const browserClients = new Set();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    if (parsedUrl.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, app: "ocpp-ws-simulator" }));
      return;
    }

    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const pathname = parse(req.url).pathname;

    if (pathname === "/charger") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        const url = new URL(req.url, "http://localhost");
        const chargerId = url.searchParams.get("chargerId") || "default";

        if (url.searchParams.has("chargerId")) {
          chargerSessions.set(chargerId, ws);

          ws.isAlive = true;
          ws.on("pong", () => {
            ws.isAlive = true;
          });

          ws.on("message", (msg) => {
            for (const browserWs of browserClients) {
              if (browserWs.readyState === browserWs.OPEN) {
                browserWs.send(
                  JSON.stringify({
                    type: "charger-message",
                    chargerId,
                    payload: msg.toString(),
                  }),
                );
              }
            }
          });

          ws.on("close", () => {
            chargerSessions.delete(chargerId);
          });

          return;
        }

        browserClients.add(ws);

        ws.on("message", (msg) => {
          try {
            const payload = JSON.parse(msg.toString());
            const target = chargerSessions.get(payload.chargerId);

            if (target && target.readyState === target.OPEN) {
              target.send(payload.data);
            }
          } catch (err) {
            console.error("Browser websocket relay error:", err);
          }
        });

        ws.on("close", () => {
          browserClients.delete(ws);
        });
      });

      return;
    }

    socket.destroy();
  });

  function heartbeat() {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }

  setInterval(heartbeat, 30000);

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
});

import { renderOgImage } from "@/lib/og";

export const alt =
  "OCPP WS Simulator — free online OCPP simulator and EV charger emulator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "Free OCPP simulator & emulator",
    title: "Emulate EV chargers and test any CSMS in your browser",
    subtitle: "Virtual charge points over WebSocket. No install, no sign-up.",
  });
}

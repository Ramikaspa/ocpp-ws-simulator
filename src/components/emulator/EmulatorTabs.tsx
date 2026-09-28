"use client";

import { useActiveCharger } from "@/hooks/useActiveCharger";
import { ConnectorPanel } from "./ConnectorPanel";

export function ConnectorsView() {
  const { config } = useActiveCharger();

  // Sized by the space the panel actually has (container queries), so the
  // layout holds up whether or not the config sidebar is open.
  return (
    <div className="@container flex-1 min-w-0">
      <div
        className={`grid gap-5 min-w-0 ${
          config.numberOfConnectors === 2
            ? "grid-cols-1 @6xl:grid-cols-2"
            : "grid-cols-1 max-w-5xl"
        }`}
      >
        <ConnectorPanel connectorId={1} />
        {config.numberOfConnectors === 2 && <ConnectorPanel connectorId={2} />}
      </div>
    </div>
  );
}

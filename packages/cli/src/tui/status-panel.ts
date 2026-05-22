import { Box, Text, t, bold, fg } from "@opentui/core";

import type { SyncStatus } from "../worker/sync-engine.js";

export function StatusPanel(status: SyncStatus): ReturnType<typeof Box> {
  const connectedColor = status.connected ? "#0F0" : "#F00";
  const connectedText = status.connected ? "Connected" : "Disconnected";

  return Box(
    {
      width: 50,
      borderStyle: "rounded",
      borderColor: "#666",
      padding: 1,
      flexDirection: "column",
      gap: 1,
    },
    Text({
      content: t`${bold(fg("#FFFF00")("Sync Status"))}`,
    }),
    Text({
      content: t`Connection: ${fg(connectedColor)(connectedText)}`,
    }),
    Text({
      content: `Pending Mutations: ${status.pendingCount}`,
    }),
    Text({
      content: `Last Sync: ${status.lastSyncTimestamp ?? "Never"}`,
    }),
    Text({
      content: `Convex URL: ${status.convexUrl ?? "Not configured"}`,
      fg: "#888",
    }),
  );
}

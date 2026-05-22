import { tool, type ToolDefinition } from "@opencode-ai/plugin";

import type { SyncEngine } from "./sync.js";

/**
 * Creates the set of custom sync tools for the plugin.
 *
 * Each tool receives the sync engine instance via closure and uses it to interact with the Convex
 * backend or report local state.
 */
export function createTools(syncEngine: SyncEngine): Record<string, ToolDefinition> {
  return {
    "sync-status": tool({
      description:
        "Returns the current sync state: connection status, pending mutation count, and last sync timestamp.",
      args: {},
      async execute() {
        const status = syncEngine.status();
        return JSON.stringify(status, null, 2);
      },
    }),

    "sync-push": tool({
      description: "Forces an immediate push of all buffered local changes to the Convex backend.",
      args: {
        force: tool.schema
          .boolean()
          .optional()
          .default(false)
          .describe("If true, skips the connectivity check and attempts push anyway"),
      },
      async execute(args) {
        if (args.force) {
          const result = await syncEngine.flush();
          return JSON.stringify(
            {
              replayed: result.replayed,
              failedCount: result.failed.length,
              failed: result.failed.map((m) => m.id),
            },
            null,
            2,
          );
        }

        const connected = await syncEngine.checkConnectivity();
        if (!connected) {
          return JSON.stringify({ error: "Not connected to Convex backend" });
        }

        const result = await syncEngine.flush();
        return JSON.stringify(
          {
            replayed: result.replayed,
            failedCount: result.failed.length,
            failed: result.failed.map((m) => m.id),
          },
          null,
          2,
        );
      },
    }),

    "sync-pull": tool({
      description:
        "Forces a pull of remote changes from the Convex backend and returns them as JSON.",
      args: {
        since: tool.schema
          .string()
          .optional()
          .describe("ISO 8601 timestamp to pull changes from (defaults to last sync)"),
      },
      async execute(args) {
        const connected = await syncEngine.checkConnectivity();
        if (!connected) {
          return JSON.stringify({ error: "Not connected to Convex backend" });
        }

        const pullOptions = args.since ? { since: args.since } : undefined;
        const result = await syncEngine.pull(pullOptions);
        if (!result.success) {
          return JSON.stringify({ error: result.error });
        }

        return JSON.stringify({ data: result.data }, null, 2);
      },
    }),
  };
}

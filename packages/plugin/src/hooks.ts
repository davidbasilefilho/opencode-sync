import type { Config } from "@opencode-ai/plugin";

import type { ConfigManager } from "./config.js";
import type { SyncEngine } from "./sync.js";

/**
 * Creates the config hook that loads sync settings when OpenCode initialises or re-reads its
 * config.
 */
export function configHook(configManager: ConfigManager) {
  return async (input: Config): Promise<void> => {
    if (input.plugin) {
      const pluginOpts = Array.isArray(input.plugin) ? input.plugin : [input.plugin];

      for (const entry of pluginOpts) {
        if (typeof entry === "string" && entry.startsWith("opencodedb-plugin")) {
          continue;
        }
        if (Array.isArray(entry) && entry[0] === "opencodedb-plugin") {
          const opts = entry[1] as Record<string, unknown> | undefined;
          if (opts?.configPath && typeof opts.configPath === "string") {
            const customManager = new (configManager.constructor as new (
              path: string,
            ) => ConfigManager)(opts.configPath);
            const cfg = customManager.read();
            if (cfg) {
              customManager.write(cfg);
            }
          }
        }
      }
    }
  };
}

/** Creates event handlers that react to OpenCode lifecycle events. */
export function createEventHandlers(syncEngine: SyncEngine) {
  return async (input: { event: { type: string; data?: unknown } }): Promise<void> => {
    const { event } = input;

    switch (event.type) {
      case "message.created": {
        const status = syncEngine.status();
        if (status.connected && status.pendingCount > 0) {
          await syncEngine.flush();
        }
        break;
      }

      case "session.idle": {
        const status = syncEngine.status();
        if (status.connected && status.pendingCount > 0) {
          await syncEngine.flush();
        }
        break;
      }

      default:
        break;
    }
  };
}

/** Creates the tool.execute.before hook that logs tool execution start. */
export function toolExecuteBefore(): (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: unknown },
) => Promise<void> {
  return async (
    input: { tool: string; sessionID: string; callID: string },
    _output: { args: unknown },
  ): Promise<void> => {
    const message = `[sync] BEFORE tool=${input.tool} session=${input.sessionID} call=${input.callID}`;
    console.log(message);
  };
}

/** Creates the tool.execute.after hook that logs tool execution completion. */
export function toolExecuteAfter(): (
  input: { tool: string; sessionID: string; callID: string; args: unknown },
  output: { title: string; output: string; metadata: unknown },
) => Promise<void> {
  return async (
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: { title: string; output: string; metadata: unknown },
  ): Promise<void> => {
    const message = `[sync] AFTER tool=${input.tool} session=${input.sessionID} call=${input.callID} title=${output.title}`;
    console.log(message);
  };
}

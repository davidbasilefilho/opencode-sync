import type { Plugin, Hooks } from "@opencode-ai/plugin";

import { ConfigManager } from "./config.js";
import { configHook, createEventHandlers, toolExecuteBefore, toolExecuteAfter } from "./hooks.js";
import { SyncEngine } from "./sync.js";
import { createTools } from "./tools.js";

/**
 * SyncPlugin - hooks into OpenCode lifecycle events to sync sessions, messages, and tool executions
 * to a Convex backend.
 */
export const SyncPlugin: Plugin = async (ctx) => {
  const syncEngine = new SyncEngine();
  const config = new ConfigManager(ctx.directory);

  const storedConfig = config.read();
  if (storedConfig) {
    syncEngine.connect(storedConfig);
  }

  const hooks: Hooks = {
    config: configHook(config),
    tool: createTools(syncEngine),
    event: createEventHandlers(syncEngine),
    "tool.execute.before": toolExecuteBefore(),
    "tool.execute.after": toolExecuteAfter(),
  };

  return hooks;
};

export default SyncPlugin;

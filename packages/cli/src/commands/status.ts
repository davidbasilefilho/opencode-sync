import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

import { SyncConfigSchema } from "opencodedb-types";
import type { SyncConfig } from "opencodedb-types";

import { CliSyncEngine } from "../worker/sync-engine.js";

const CONFIG_PATH = resolve(homedir(), ".config", "opencode-sync", "config.json");

function loadConfig(): SyncConfig | null {
  if (!existsSync(CONFIG_PATH)) {
    return null;
  }
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    const result = SyncConfigSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function statusCommand(): Promise<void> {
  const config = loadConfig();

  if (!config) {
    console.log("Not configured. Run 'opencode-sync link' first.");
    return;
  }

  const engine = new CliSyncEngine();
  engine.connect(config);
  const connected = await engine.checkConnectivity();
  const status = engine.status();

  console.log("Sync Status:");
  console.log(`  Connected:    ${connected ? "Yes" : "No"}`);
  console.log(`  Pending:      ${status.pendingCount} mutations`);
  console.log(`  Last Sync:    ${status.lastSyncTimestamp ?? "Never"}`);
  console.log(`  Convex URL:   ${status.convexUrl}`);
  console.log(`  Machine ID:   ${config.machineId}`);
  console.log(`  Storage Root: ${config.storageRoot}`);
}

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

import { SyncConfigSchema } from "opencodedb-types";
import type { SyncConfig } from "opencodedb-types";

import { CliSyncEngine } from "../worker/sync-engine.js";

const CONFIG_PATH = resolve(homedir(), ".config", "opencode-sync", "config.json");

function loadConfig(): SyncConfig {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`Config not found at ${CONFIG_PATH}. Run "opencode-sync link" first.`);
  }
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  return SyncConfigSchema.parse(parsed);
}

export async function divergenceResolutionCommand(): Promise<void> {
  const config = loadConfig();
  const engine = new CliSyncEngine();
  engine.connect(config);

  console.log("Fetching remote state...");
  const remoteResult = await engine.pull<Record<string, unknown>>();

  if (!remoteResult.success) {
    console.error(`Failed to fetch remote state: ${remoteResult.error ?? "Unknown error"}`);
    return;
  }

  const remoteData = remoteResult.data ?? [];
  console.log(`Fetched ${remoteData.length} remote record(s).`);

  console.log("Overriding local state with remote data...");
  const localPath = resolve(config.storageRoot, ".sync-state.json");
  const dir = resolve(config.storageRoot);
  if (!existsSync(dir)) {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(localPath, JSON.stringify(remoteData, null, 2), "utf-8");

  console.log("Divergence resolved. Local state overridden from remote.");
}

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

import { SyncConfigSchema } from "@opencode-sync/types";
import type { SyncConfig } from "@opencode-sync/types";

import { ChatWorker } from "../worker/chat-worker.js";
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

export async function runCommand(): Promise<void> {
  const config = loadConfig();
  const engine = new CliSyncEngine();
  engine.connect(config);

  const worker = new ChatWorker(engine);
  await worker.start();
}

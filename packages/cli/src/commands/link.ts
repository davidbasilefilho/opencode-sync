import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir, hostname } from "node:os";
import { resolve } from "node:path";
import { platform } from "node:process";

import { SyncConfigSchema } from "opencodedb-types";
import type { SyncConfig } from "opencodedb-types";

const CONFIG_DIR = resolve(homedir(), ".config", "opencode-sync");
const CONFIG_PATH = resolve(CONFIG_DIR, "config.json");

function generateMachineId(): string {
  const raw = `${hostname()}-${platform}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function readConfig(): SyncConfig | null {
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

function writeConfig(config: SyncConfig): void {
  const validated = SyncConfigSchema.parse(config);
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(validated, null, 2), "utf-8");
}

export async function linkCommand(): Promise<void> {
  const existing = readConfig();

  const convexUrl = process.env.CONVEX_URL ?? existing?.convexUrl ?? "";
  const apiKey = process.env.CONVEX_API_KEY ?? existing?.apiKey ?? "";
  const storageRoot =
    process.env.SYNC_STORAGE_ROOT ?? existing?.storageRoot ?? resolve(homedir(), ".opencode");
  const machineId = existing?.machineId ?? generateMachineId();

  const config: SyncConfig = {
    convexUrl,
    apiKey,
    machineId,
    storageRoot,
  };

  const result = SyncConfigSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`Invalid configuration:\n${issues}`);
    console.error(
      "Set environment variables CONVEX_URL, CONVEX_API_KEY, SYNC_STORAGE_ROOT or create config interactively.",
    );
    return;
  }

  writeConfig(result.data);
  console.log(`Configuration written to ${CONFIG_PATH}`);
  console.log(`  Machine ID: ${result.data.machineId}`);
  console.log(`  Convex URL: ${result.data.convexUrl}`);
  console.log(`  Storage Root: ${result.data.storageRoot}`);
}

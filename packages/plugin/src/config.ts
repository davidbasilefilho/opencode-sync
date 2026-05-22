import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { SyncConfigSchema } from "@opencode-sync/types";
import type { SyncConfig } from "@opencode-sync/types";

/** Manages reading and writing of the local sync configuration file. */
export class ConfigManager {
  private readonly filePath: string;

  /** @param directory - The plugin's working directory (where .opencode-sync.json lives) */
  constructor(directory: string) {
    this.filePath = resolve(directory, ".opencode-sync.json");
  }

  /**
   * Reads and validates the sync config from disk. Returns null if the file does not exist or fails
   * validation.
   */
  read(): SyncConfig | null {
    try {
      if (!existsSync(this.filePath)) {
        return null;
      }
      const raw = readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      const result = SyncConfigSchema.safeParse(parsed);
      if (!result.success) {
        return null;
      }
      return result.data;
    } catch {
      return null;
    }
  }

  /**
   * Writes the sync config to disk, creating parent directories if needed. Throws if validation
   * fails.
   */
  write(config: SyncConfig): void {
    const validated = SyncConfigSchema.parse(config);
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.filePath, JSON.stringify(validated, null, 2), "utf-8");
  }

  /**
   * Validates a config object against the schema without reading/writing. Returns the validated
   * config or throws a ZodError.
   */
  validate(config: unknown): SyncConfig {
    return SyncConfigSchema.parse(config);
  }
}

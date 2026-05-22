import { mkdirSync, existsSync, rmSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

import type { SyncConfig } from "@opencode-sync/types";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function makeTestConfig(): SyncConfig {
  return {
    convexUrl: "https://test.convex.cloud",
    apiKey: "sk-test",
    machineId: "test-machine",
    storageRoot: "/tmp/test",
  };
}

describe("CLI routing", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it("exports all command functions", async () => {
    const mod = await import("./index.js");
    expect(mod.linkCommand).toBeTypeOf("function");
    expect(mod.runCommand).toBeTypeOf("function");
    expect(mod.statusCommand).toBeTypeOf("function");
    expect(mod.divergenceResolutionCommand).toBeTypeOf("function");
  });
});

describe("link command", () => {
  const testConfigDir = resolve(homedir(), ".config", "opencode-sync");
  const testConfigPath = resolve(testConfigDir, "config.json");

  beforeEach(() => {
    if (!existsSync(testConfigDir)) {
      mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testConfigPath)) {
      rmSync(testConfigPath, { force: true });
    }
  });

  it("writes a valid config file when env vars are set", async () => {
    process.env.CONVEX_URL = "https://test-project.convex.cloud";
    process.env.CONVEX_API_KEY = "sk-test-key-123";
    process.env.SYNC_STORAGE_ROOT = "/tmp/opencode-test";

    const { linkCommand } = await import("./commands/link.js");
    await linkCommand();

    expect(existsSync(testConfigPath)).toBe(true);
    const raw = readFileSync(testConfigPath, "utf-8");
    const config = JSON.parse(raw);

    expect(config.convexUrl).toBe("https://test-project.convex.cloud");
    expect(config.apiKey).toBe("sk-test-key-123");
    expect(config.storageRoot).toBe("/tmp/opencode-test");
    expect(config.machineId).toBeTypeOf("string");
    expect(config.machineId.length).toBeGreaterThan(0);
  });
});

describe("status command", () => {
  const testConfigDir = resolve(homedir(), ".config", "opencode-sync");
  const testConfigPath = resolve(testConfigDir, "config.json");

  afterEach(() => {
    if (existsSync(testConfigPath)) {
      rmSync(testConfigPath, { force: true });
    }
    delete process.env.CONVEX_URL;
    delete process.env.CONVEX_API_KEY;
  });

  it("prints not-configured message when no config exists", async () => {
    if (existsSync(testConfigPath)) {
      rmSync(testConfigPath, { force: true });
    }
    const { statusCommand } = await import("./commands/status.js");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await statusCommand();
    expect(spy).toHaveBeenCalledWith("Not configured. Run 'opencode-sync link' first.");
    spy.mockRestore();
  });
});

describe("divergence-resolution command", () => {
  const testConfigDir = resolve(homedir(), ".config", "opencode-sync");
  const testConfigPath = resolve(testConfigDir, "config.json");

  afterEach(() => {
    if (existsSync(testConfigPath)) {
      rmSync(testConfigPath, { force: true });
    }
  });

  it("throws when no config exists", async () => {
    if (existsSync(testConfigPath)) {
      rmSync(testConfigPath, { force: true });
    }
    const { divergenceResolutionCommand } = await import("./commands/divergence-resolution.js");
    await expect(divergenceResolutionCommand()).rejects.toThrow(/Run "opencode-sync link" first/);
  });
});

describe("CliSyncEngine", () => {
  // eslint-disable-next-line ts/no-redeclare
  let CliSyncEngine: new (...args: never[]) => import("./worker/sync-engine.js").CliSyncEngine;

  beforeEach(async () => {
    const mod = await import("./worker/sync-engine.js");
    CliSyncEngine = mod.CliSyncEngine;
  });

  it("starts disconnected", () => {
    const engine = new CliSyncEngine();
    const status = engine.status();
    expect(status.connected).toBe(false);
    expect(status.pendingCount).toBe(0);
    expect(status.lastSyncTimestamp).toBeNull();
    expect(status.convexUrl).toBeNull();
  });

  it("connects with config and reflects connection state", () => {
    const engine = new CliSyncEngine();
    engine.connect(makeTestConfig());

    const status = engine.status();
    expect(status.connected).toBe(true);
    expect(status.convexUrl).toBe("https://test.convex.cloud");
    expect(status.pendingCount).toBe(0);
  });

  it("disconnect clears state", () => {
    const engine = new CliSyncEngine();
    engine.connect(makeTestConfig());
    engine.disconnect();
    const status = engine.status();
    expect(status.connected).toBe(false);
    expect(status.convexUrl).toBeNull();
  });

  it("buffers mutations when offline", async () => {
    const engine = new CliSyncEngine();
    const result = await engine.push({ test: true });
    expect(result).toEqual({ success: false, error: "Offline: mutation buffered" });
  });

  it("flush replays buffered mutations", async () => {
    const engine = new CliSyncEngine();
    await engine.push({ id: 1 });
    await engine.push({ id: 2 });

    expect(engine.getPendingMutations()).toHaveLength(2);

    const flushResult = await engine.flush();
    expect(flushResult.replayed).toBe(0);
    expect(flushResult.failed).toHaveLength(2);
    expect(engine.getPendingMutations()).toHaveLength(4);
  });

  it("strips trailing slash from convexUrl on connect", () => {
    const engine = new CliSyncEngine();
    engine.connect({
      ...makeTestConfig(),
      convexUrl: "https://test.convex.cloud/",
    });
    expect(engine.status().convexUrl).toBe("https://test.convex.cloud");
  });
});

describe("ChatWorker", () => {
  let CliSyncEngine: new (...args: never[]) => import("./worker/sync-engine.js").CliSyncEngine;

  beforeEach(async () => {
    const mod = await import("./worker/sync-engine.js");
    CliSyncEngine = mod.CliSyncEngine;
  });

  it("initializes with default status", async () => {
    const { ChatWorker } = await import("./worker/chat-worker.js");
    const engine = new CliSyncEngine();
    const worker = new ChatWorker(engine);

    const status = worker.status();
    expect(status.running).toBe(false);
    expect(status.lastPullTimestamp).toBeNull();
    expect(status.lastPushTimestamp).toBeNull();
    expect(status.errorCount).toBe(0);
  });

  it("stop on non-running worker is safe", async () => {
    const { ChatWorker } = await import("./worker/chat-worker.js");
    const engine = new CliSyncEngine();
    const worker = new ChatWorker(engine);

    expect(() => worker.stop()).not.toThrow();
  });
});

import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import { ConfigManager } from "./config.js";
import { configHook, createEventHandlers, toolExecuteBefore, toolExecuteAfter } from "./hooks.js";
import { SyncPlugin } from "./index.js";
import { SyncEngine } from "./sync.js";
import { createTools } from "./tools.js";

// ---------------------------------------------------------------------------
// ConfigManager
// ---------------------------------------------------------------------------

describe("ConfigManager", () => {
  const tmpDir = resolve(tmpdir(), "opencode-sync-plugin-test", "config");
  const configPath = resolve(tmpDir, ".opencode-sync.json");

  beforeEach(() => {
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterEach(() => {
    try {
      if (existsSync(configPath)) {
        unlinkSync(configPath);
      }
    } catch {
      // cleanup best-effort
    }
  });

  it("returns null when no config file exists", () => {
    const mgr = new ConfigManager(tmpDir);
    expect(mgr.read()).toBeNull();
  });

  it("writes and reads a valid config roundtrip", () => {
    const mgr = new ConfigManager(tmpDir);
    const config = {
      convexUrl: "https://test.convex.cloud",
      apiKey: "sk-test-123",
      machineId: "mac-test-001",
      storageRoot: "/tmp/opencode-test",
    };

    mgr.write(config);
    const read = mgr.read();
    expect(read).toEqual(config);
  });

  it("returns null for invalid config on disk", () => {
    writeFileSync(configPath, JSON.stringify({ convexUrl: "not-a-url" }), "utf-8");
    const mgr = new ConfigManager(tmpDir);
    expect(mgr.read()).toBeNull();
  });

  it("validate returns parsed config for valid input", () => {
    const mgr = new ConfigManager(tmpDir);
    const valid = {
      convexUrl: "https://valid.convex.cloud",
      apiKey: "sk-valid",
      machineId: "m1",
      storageRoot: "/data",
    };
    const result = mgr.validate(valid);
    expect(result.convexUrl).toBe("https://valid.convex.cloud");
  });

  it("validate throws for invalid input", () => {
    const mgr = new ConfigManager(tmpDir);
    expect(() => mgr.validate({})).toThrow("Required");
  });
});

// ---------------------------------------------------------------------------
// SyncEngine
// ---------------------------------------------------------------------------

describe("SyncEngine", () => {
  let engine: SyncEngine;

  beforeEach(() => {
    engine = new SyncEngine();
  });

  describe("connect / disconnect / status", () => {
    it("starts disconnected with zero pending", () => {
      const s = engine.status();
      expect(s.connected).toBe(false);
      expect(s.pendingCount).toBe(0);
      expect(s.lastSyncTimestamp).toBeNull();
      expect(s.convexUrl).toBeNull();
    });

    it("connect sets connection state", () => {
      engine.connect({
        convexUrl: "https://test.convex.cloud",
        apiKey: "sk-key",
        machineId: "mac-001",
        storageRoot: "/tmp",
      });
      const s = engine.status();
      expect(s.connected).toBe(true);
      expect(s.convexUrl).toBe("https://test.convex.cloud");
    });

    it("disconnect clears state", () => {
      engine.connect({
        convexUrl: "https://test.convex.cloud",
        apiKey: "sk-key",
        machineId: "mac-001",
        storageRoot: "/tmp",
      });
      engine.disconnect();
      const s = engine.status();
      expect(s.connected).toBe(false);
      expect(s.convexUrl).toBeNull();
    });
  });

  describe("push", () => {
    it("buffers mutations when offline", async () => {
      const result = await engine.push({ hello: "world" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Offline");

      const pending = engine.getPendingMutations();
      expect(pending).toHaveLength(1);
      expect(pending[0]!.type).toBe("pushMessage");
      expect(pending[0]!.payload).toEqual({ hello: "world" });
    });

    it("returns failure when fetch fails (no real server)", async () => {
      engine.connect({
        convexUrl: "https://nonexistent.convex.cloud",
        apiKey: "sk-key",
        machineId: "mac-001",
        storageRoot: "/tmp",
      });

      const result = await engine.push({ test: true });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("pull", () => {
    it("returns not-connected error when offline", async () => {
      const result = await engine.pull();
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
    });

    it("returns failure when fetch fails (no real server)", async () => {
      engine.connect({
        convexUrl: "https://nonexistent.convex.cloud",
        apiKey: "sk-key",
        machineId: "mac-001",
        storageRoot: "/tmp",
      });

      const result = await engine.pull({ since: "2025-01-01T00:00:00Z" });
      expect(result.success).toBe(false);
    });
  });

  describe("flush", () => {
    it("replays buffered mutations and reports counts", async () => {
      await engine.push({ msg: "one" });
      await engine.push({ msg: "two" });
      expect(engine.getPendingMutations()).toHaveLength(2);

      const result = await engine.flush();
      expect(result.replayed).toBe(0);
      expect(result.failed).toHaveLength(2);
    });

    it("handles empty buffer gracefully", async () => {
      const result = await engine.flush();
      expect(result.replayed).toBe(0);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe("checkConnectivity", () => {
    it("returns false when not connected", async () => {
      const ok = await engine.checkConnectivity();
      expect(ok).toBe(false);
    });

    it("returns false for unreachable URL", async () => {
      engine.connect({
        convexUrl: "https://nonexistent-test-12345.convex.cloud",
        apiKey: "sk-key",
        machineId: "m1",
        storageRoot: "/tmp",
      });
      const ok = await engine.checkConnectivity();
      expect(ok).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

describe("createTools", () => {
  it("returns an object with three tools", () => {
    const engine = new SyncEngine();
    const tools = createTools(engine);
    expect(tools["sync-status"]).toBeDefined();
    expect(tools["sync-push"]).toBeDefined();
    expect(tools["sync-pull"]).toBeDefined();
  });

  it("sync-status returns JSON with disconnected state", async () => {
    const engine = new SyncEngine();
    const tools = createTools(engine);
    const result = await tools["sync-status"]!.execute({}, {} as never);
    const parsed = JSON.parse(result as string);
    expect(parsed.connected).toBe(false);
    expect(parsed.pendingCount).toBe(0);
  });

  it("sync-push returns not-connected message", async () => {
    const engine = new SyncEngine();
    const tools = createTools(engine);
    const result = await tools["sync-push"]!.execute({ force: false }, {} as never);
    const parsed = JSON.parse(result as string);
    expect(parsed.error).toContain("Not connected");
  });
});

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

describe("configHook", () => {
  it("returns a function", () => {
    const mgr = new ConfigManager("/tmp");
    const hook = configHook(mgr);
    expect(typeof hook).toBe("function");
  });
});

describe("createEventHandlers", () => {
  it("handles message.created and session.idle without error", async () => {
    const engine = new SyncEngine();
    const handler = createEventHandlers(engine);

    await expect(handler({ event: { type: "message.created" } })).resolves.toBeUndefined();

    await expect(handler({ event: { type: "session.idle" } })).resolves.toBeUndefined();
  });

  it("ignores unknown event types", async () => {
    const engine = new SyncEngine();
    const handler = createEventHandlers(engine);

    await expect(handler({ event: { type: "unknown.event.type" } })).resolves.toBeUndefined();
  });

  it("flushes pending mutations on message.created when connected", async () => {
    const engine = new SyncEngine();
    await engine.push({ msg: "buffer-me" });
    engine.connect({
      convexUrl: "https://test.convex.cloud",
      apiKey: "sk-key",
      machineId: "m1",
      storageRoot: "/tmp",
    });

    const spy = vi.spyOn(engine, "flush");

    const handler = createEventHandlers(engine);
    await handler({ event: { type: "message.created" } });

    expect(spy).toHaveBeenCalled();
  });
});

describe("toolExecuteBefore", () => {
  it("logs tool execution start", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const hook = toolExecuteBefore();

    await hook({ tool: "bash", sessionID: "ses-1", callID: "call-1" }, { args: { command: "ls" } });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("tool=bash"));
    spy.mockRestore();
  });
});

describe("toolExecuteAfter", () => {
  it("logs tool execution completion", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const hook = toolExecuteAfter();

    await hook(
      { tool: "bash", sessionID: "ses-1", callID: "call-1", args: {} },
      { title: "ls output", output: "file1.txt", metadata: {} },
    );

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("tool=bash"));
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Plugin factory
// ---------------------------------------------------------------------------

describe("SyncPlugin", () => {
  it("returns a Hooks-shaped object", async () => {
    const mockCtx = {
      client: {} as never,
      project: {} as never,
      directory: "/tmp",
      worktree: "/tmp",
      experimental_workspace: { register: () => {} },
      serverUrl: new URL("http://localhost"),
      $: {} as never,
    };

    const hooks = await SyncPlugin(mockCtx);

    expect(hooks).toBeDefined();
    expect(typeof hooks.config).toBe("function");
    expect(typeof hooks.event).toBe("function");
    expect(typeof hooks.tool).toBe("object");
    expect(typeof hooks["tool.execute.before"]).toBe("function");
    expect(typeof hooks["tool.execute.after"]).toBe("function");

    expect(hooks.tool).toBeDefined();
    expect(typeof hooks.tool!["sync-status"]).toBe("object");
    expect(typeof hooks.tool!["sync-push"]).toBe("object");
    expect(typeof hooks.tool!["sync-pull"]).toBe("object");
  });

  it("returns correct tool count", async () => {
    const mockCtx = {
      client: {} as never,
      project: {} as never,
      directory: "/tmp",
      worktree: "/tmp",
      experimental_workspace: { register: () => {} },
      serverUrl: new URL("http://localhost"),
      $: {} as never,
    };

    const hooks = await SyncPlugin(mockCtx);
    expect(Object.keys(hooks.tool ?? {})).toHaveLength(3);
  });
});

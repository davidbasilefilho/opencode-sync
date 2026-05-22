import { describe, it, expect } from "vitest";

import {
  ThreadSchema,
  MessageSchema,
  MessageStatus,
  AttachmentSchema,
  SyncConfigSchema,
  MachineProfileSchema,
} from "./index.js";

describe("ThreadSchema", () => {
  it("validates a complete thread object", () => {
    const result = ThreadSchema.safeParse({
      title: "My Thread",
      createdAt: "2025-01-01T00:00:00Z",
      lastActiveMachineId: "mac-001",
      storageRoot: "/home/user/projects",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a thread without required fields", () => {
    const result = ThreadSchema.safeParse({ title: "Incomplete" });
    expect(result.success).toBe(false);
  });

  it("applies default for enabledPlugins", () => {
    const result = ThreadSchema.parse({
      title: "Thread",
      createdAt: "2025-01-01T00:00:00Z",
      lastActiveMachineId: "mac-001",
      storageRoot: "/tmp",
    });
    expect(result.enabledPlugins).toEqual({});
  });
});

describe("MessageSchema", () => {
  it("validates a complete message object", () => {
    const result = MessageSchema.safeParse({
      threadId: "thread-1",
      role: "user",
      text: "Hello!",
    });
    expect(result.success).toBe(true);
  });

  it("applies default status as streaming", () => {
    const result = MessageSchema.parse({
      threadId: "thread-1",
      role: "assistant",
    });
    expect(result.status).toBe("streaming");
  });

  it("accepts valid status transitions", () => {
    const statuses = [
      "streaming",
      "awaiting tool",
      "tool executing",
      "completed",
      "failed",
    ] as const;
    for (const status of statuses) {
      expect(MessageStatus.parse(status)).toBe(status);
    }
  });

  it("rejects invalid status", () => {
    const result = MessageSchema.safeParse({
      threadId: "thread-1",
      role: "user",
      status: "invalid-status",
    });
    expect(result.success).toBe(false);
  });

  it("validates tool execution metadata", () => {
    const result = MessageSchema.parse({
      threadId: "t-1",
      role: "assistant",
      status: "awaiting tool",
      toolCallId: "call-001",
      toolName: "bash",
      toolArgs: '{"command":"ls"}',
      assignedMachine: "mac-001",
    });
    expect(result.toolCallId).toBe("call-001");
  });
});

describe("AttachmentSchema", () => {
  it("validates with required fields only", () => {
    const result = AttachmentSchema.safeParse({
      storageFileId: "file-001",
      originalName: "photo.png",
      mimeType: "image/png",
    });
    expect(result.success).toBe(true);
  });

  it("validates with thread and message references", () => {
    const result = AttachmentSchema.parse({
      threadId: "thread-1",
      messageId: "msg-1",
      storageFileId: "file-001",
      originalName: "doc.pdf",
      mimeType: "application/pdf",
    });
    expect(result.threadId).toBe("thread-1");
    expect(result.messageId).toBe("msg-1");
  });
});

describe("SyncConfigSchema", () => {
  it("validates a complete config", () => {
    const result = SyncConfigSchema.safeParse({
      convexUrl: "https://my-project.convex.cloud",
      apiKey: "sk-secret-123",
      machineId: "mac-001",
      storageRoot: "/home/user/opencode",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL", () => {
    const result = SyncConfigSchema.safeParse({
      convexUrl: "not-a-url",
      apiKey: "sk-secret",
      machineId: "m1",
      storageRoot: "/tmp",
    });
    expect(result.success).toBe(false);
  });
});

describe("MachineProfileSchema", () => {
  it("validates with explicit platform", () => {
    const result = MachineProfileSchema.safeParse({
      machineId: "mac-001",
      hostname: "my-laptop",
      platform: "darwin",
      storageRoot: "/Users/me/opencode",
    });
    expect(result.success).toBe(true);
  });

  it("applies default platform as unknown", () => {
    const result = MachineProfileSchema.parse({
      machineId: "m1",
      hostname: "server-01",
      storageRoot: "/data/opencode",
    });
    expect(result.platform).toBe("unknown");
  });
});

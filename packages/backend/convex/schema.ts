import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Defines the Convex database schema for opencode-sync.
 *
 * Tables: - threads: conversation threads with machine ownership - messages: individual messages
 * within threads with status tracking - attachments: file references linked to threads or messages
 */
export default defineSchema({
  threads: defineTable({
    title: v.string(),
    createdAt: v.string(),
    lastActiveMachineId: v.string(),
    storageRoot: v.string(),
    enabledPlugins: v.any(),
  }).index("by_createdAt", ["createdAt"]),

  messages: defineTable({
    threadId: v.id("threads"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    text: v.string(),
    status: v.union(
      v.literal("streaming"),
      v.literal("awaiting tool"),
      v.literal("tool executing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    toolCallId: v.optional(v.string()),
    toolName: v.optional(v.string()),
    toolArgs: v.optional(v.string()),
    toolResult: v.optional(v.string()),
    assignedMachine: v.optional(v.string()),
  })
    .index("by_threadId", ["threadId"])
    .index("by_status", ["status"]),

  attachments: defineTable({
    threadId: v.optional(v.id("threads")),
    messageId: v.optional(v.id("messages")),
    storageFileId: v.string(),
    originalName: v.string(),
    mimeType: v.string(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_messageId", ["messageId"]),
});

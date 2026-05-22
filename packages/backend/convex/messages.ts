import { v } from "convex/values";

import { mutation, query } from "./_generated/server.js";

/**
 * Creates a new message within a thread.
 *
 * @param args.threadId - Parent thread document ID
 * @param args.role - Sender role (user, assistant, system)
 * @param args.text - Initial text content (defaults to empty string)
 * @param args.status - Processing status (defaults to "streaming")
 * @returns The newly created document ID
 */
export const createMessage = mutation({
  args: {
    threadId: v.id("threads"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    text: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("streaming"),
        v.literal("awaiting tool"),
        v.literal("tool executing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      threadId: args.threadId,
      role: args.role,
      text: args.text ?? "",
      status: args.status ?? "streaming",
    });
  },
});

/**
 * Updates the status of an existing message.
 *
 * @param args.id - The message document ID
 * @param args.status - New processing status
 */
export const updateMessageStatus = mutation({
  args: {
    id: v.id("messages"),
    status: v.union(
      v.literal("streaming"),
      v.literal("awaiting tool"),
      v.literal("tool executing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const appendText = mutation({
  args: {
    id: v.id("messages"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);
    if (message === null) {
      throw new Error("Message not found");
    }
    const currentText = (message as Record<string, string>).text ?? "";
    const appendTextValue = args.text as unknown as string;
    await ctx.db.patch(args.id, { text: currentText + appendTextValue });
  },
});

/**
 * Sets tool call metadata on a message (typically when yielding to a tool).
 *
 * @param args.id - The message document ID
 * @param args.toolCallId - Tool call identifier
 * @param args.toolName - Name of the tool being executed
 * @param args.toolArgs - Raw JSON arguments for the tool call
 * @param args.assignedMachine - Machine assigned to execute the tool
 */
export const setToolMetadata = mutation({
  args: {
    id: v.id("messages"),
    toolCallId: v.string(),
    toolName: v.string(),
    toolArgs: v.string(),
    assignedMachine: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      toolCallId: args.toolCallId,
      toolName: args.toolName,
      toolArgs: args.toolArgs,
      assignedMachine: args.assignedMachine,
    });
  },
});

/**
 * Sets the tool execution result on a message.
 *
 * @param args.id - The message document ID
 * @param args.toolResult - Text result from tool execution
 */
export const setToolResult = mutation({
  args: {
    id: v.id("messages"),
    toolResult: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { toolResult: args.toolResult });
  },
});

/**
 * Lists all messages for a given thread, ordered by creation time ascending.
 *
 * @param args.threadId - The thread document ID
 * @returns Array of message documents
 */
export const listMessages = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();
  },
});

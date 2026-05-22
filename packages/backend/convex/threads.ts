import { v } from "convex/values";

import { mutation, query } from "./_generated/server.js";

/**
 * Creates a new thread document.
 *
 * @param args.title - Human-readable thread title (1-200 chars)
 * @param args.createdAt - ISO 8601 creation timestamp
 * @param args.lastActiveMachineId - Machine identifier that owns this thread
 * @param args.storageRoot - Storage root directory on the owning machine
 * @param args.enabledPlugins - JSON blob of enabled SDK plugin configurations
 * @returns The newly created document ID
 */
export const createThread = mutation({
  args: {
    title: v.string(),
    createdAt: v.string(),
    lastActiveMachineId: v.string(),
    storageRoot: v.string(),
    enabledPlugins: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("threads", {
      title: args.title,
      createdAt: args.createdAt,
      lastActiveMachineId: args.lastActiveMachineId,
      storageRoot: args.storageRoot,
      enabledPlugins: args.enabledPlugins,
    });
  },
});

/**
 * Updates select fields on an existing thread.
 *
 * @param args.id - The thread document ID
 * @param args.title - (Optional) New title
 * @param args.lastActiveMachineId - (Optional) New machine identifier
 * @param args.storageRoot - (Optional) New storage root
 * @param args.enabledPlugins - (Optional) New plugin configuration
 */
export const updateThread = mutation({
  args: {
    id: v.id("threads"),
    title: v.optional(v.string()),
    lastActiveMachineId: v.optional(v.string()),
    storageRoot: v.optional(v.string()),
    enabledPlugins: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.lastActiveMachineId !== undefined)
      patch.lastActiveMachineId = args.lastActiveMachineId;
    if (args.storageRoot !== undefined) patch.storageRoot = args.storageRoot;
    if (args.enabledPlugins !== undefined) patch.enabledPlugins = args.enabledPlugins;
    await ctx.db.patch(args.id, patch);
  },
});

/**
 * Deletes a thread and its associated messages and attachments.
 *
 * @param args.id - The thread document ID
 */
export const deleteThread = mutation({
  args: { id: v.id("threads") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.id))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete((msg as Record<string, unknown>)._id);
    }

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.id))
      .collect();
    for (const att of attachments) {
      await ctx.db.delete((att as Record<string, unknown>)._id);
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Lists all threads ordered by creation time descending.
 *
 * @returns Array of thread documents
 */
export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("threads").order("desc").collect();
  },
});

/**
 * Retrieves a single thread by its document ID.
 *
 * @param args.id - The thread document ID
 * @returns The thread document, or null if not found
 */
export const getThread = query({
  args: { id: v.id("threads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

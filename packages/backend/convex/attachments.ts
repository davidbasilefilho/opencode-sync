import { v } from "convex/values";

import { mutation, query } from "./_generated/server.js";

export const createAttachment = mutation({
  args: {
    storageFileId: v.string(),
    originalName: v.string(),
    mimeType: v.string(),
    threadId: v.optional(v.id("threads")),
    messageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("attachments", {
      storageFileId: args.storageFileId,
      originalName: args.originalName,
      mimeType: args.mimeType,
      threadId: args.threadId,
      messageId: args.messageId,
    });
  },
});

export const deleteAttachment = mutation({
  args: { id: v.id("attachments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listAttachments = query({
  args: {
    threadId: v.optional(v.id("threads")),
    messageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    if (args.threadId !== undefined) {
      return await ctx.db
        .query("attachments")
        .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
        .collect();
    }
    if (args.messageId !== undefined) {
      return await ctx.db
        .query("attachments")
        .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
        .collect();
    }
    return await ctx.db.query("attachments").collect();
  },
});

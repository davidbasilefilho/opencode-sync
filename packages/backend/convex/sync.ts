import { v } from "convex/values";

import { internal } from "./_generated/api.js";
import { action } from "./_generated/server.js";

type ThreadInput = {
  _id?: string;
  title: string;
  createdAt: string;
  lastActiveMachineId: string;
  storageRoot: string;
  enabledPlugins: unknown;
};
type MessageInput = {
  _id?: string;
  threadId: string;
  role: string;
  text: string;
  status: string;
  toolCallId?: string;
  toolName?: string;
  toolArgs?: string;
  toolResult?: string;
  assignedMachine?: string;
};
type AttachmentInput = {
  _id?: string;
  threadId?: string;
  messageId?: string;
  storageFileId: string;
  originalName: string;
  mimeType: string;
};

export const pushUpdates = action({
  args: {
    threads: v.array(
      v.object({
        _id: v.optional(v.id("threads")),
        title: v.string(),
        createdAt: v.string(),
        lastActiveMachineId: v.string(),
        storageRoot: v.string(),
        enabledPlugins: v.any(),
      }),
    ),
    messages: v.array(
      v.object({
        _id: v.optional(v.id("messages")),
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
      }),
    ),
    attachments: v.array(
      v.object({
        _id: v.optional(v.id("attachments")),
        threadId: v.optional(v.id("threads")),
        messageId: v.optional(v.id("messages")),
        storageFileId: v.string(),
        originalName: v.string(),
        mimeType: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const threadInputs = args.threads as unknown as ThreadInput[];
    for (const thread of threadInputs) {
      if (thread._id !== undefined) {
        await ctx.runMutation(internal.threads.updateThread, {
          id: thread._id,
          title: thread.title,
          lastActiveMachineId: thread.lastActiveMachineId,
          storageRoot: thread.storageRoot,
          enabledPlugins: thread.enabledPlugins,
        } as never);
      } else {
        await ctx.runMutation(internal.threads.createThread, {
          title: thread.title,
          createdAt: thread.createdAt,
          lastActiveMachineId: thread.lastActiveMachineId,
          storageRoot: thread.storageRoot,
          enabledPlugins: thread.enabledPlugins,
        } as never);
      }
    }

    const messageInputs = args.messages as unknown as MessageInput[];
    for (const message of messageInputs) {
      if (message._id !== undefined) {
        await ctx.runMutation(internal.messages.updateMessageStatus, {
          id: message._id,
          status: message.status,
        } as never);
      } else {
        await ctx.runMutation(internal.messages.createMessage, {
          threadId: message.threadId,
          role: message.role,
          text: message.text,
          status: message.status,
        } as never);
      }
    }

    const attachmentInputs = args.attachments as unknown as AttachmentInput[];
    for (const attachment of attachmentInputs) {
      if (attachment._id !== undefined) {
        continue;
      }
      await ctx.runMutation(internal.attachments.createAttachment, {
        storageFileId: attachment.storageFileId,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        threadId: attachment.threadId,
        messageId: attachment.messageId,
      } as never);
    }
  },
});

export const pullUpdates = action({
  args: {
    since: v.string(),
  },
  handler: async (ctx, args) => {
    const sinceTimestamp = Date.parse(args.since as unknown as string);

    const threads = await ctx.runQuery(internal.threads.listThreads, {});
    const threadList = threads as Array<{ _creationTime: number; _id: string }>;

    const filteredThreads = threadList.filter((t) => t._creationTime > sinceTimestamp);

    const messageResults = await Promise.all(
      threadList.map((t) => ctx.runQuery(internal.messages.listMessages, { threadId: t._id })),
    );
    const allMessages = messageResults.flat();
    const filteredMessages = (allMessages as Array<{ _creationTime: number }>).filter(
      (m) => m._creationTime > sinceTimestamp,
    );

    const attachmentResults = await Promise.all(
      threadList.map((t) =>
        ctx.runQuery(internal.attachments.listAttachments, { threadId: t._id }),
      ),
    );
    const allAttachments = attachmentResults.flat();
    const filteredAttachments = (allAttachments as Array<{ _creationTime: number }>).filter(
      (a) => a._creationTime > sinceTimestamp,
    );

    return {
      threads: filteredThreads,
      messages: filteredMessages,
      attachments: filteredAttachments,
    };
  },
});

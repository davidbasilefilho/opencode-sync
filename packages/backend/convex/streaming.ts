import { v } from "convex/values";

import { api } from "./_generated/api.js";
import { action, httpAction } from "./_generated/server.js";

export const createStream = action({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, _args) => {
    const streamId = await ctx.runMutation(api.persistentTextStreaming.stream.createStream, {});
    return { streamId: streamId as string };
  },
});

export const streamChat = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = (await request.json()) as { streamId?: string };
  const streamId = body.streamId;

  if (typeof streamId !== "string" || streamId.length === 0) {
    return new Response(JSON.stringify({ error: "streamId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = await ctx.runAction(api.persistentTextStreaming.stream.stream, { streamId });

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

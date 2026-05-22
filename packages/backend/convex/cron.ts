import { cronJobs } from "convex/server";

import { internal } from "./_generated/api.js";
import { internalMutation } from "./_generated/server.js";

const crons = cronJobs();

crons.interval("deadlock-detection", { minutes: 10 }, internal.cron.deadlockDetection as never);

export default crons;

export const deadlockDetection = internalMutation({
  args: {},
  handler: async (ctx) => {
    const stuckStatuses = ["awaiting tool", "tool executing"] as const;

    const now = Date.now();
    const tenMinutesMs = 10 * 60 * 1000;

    for (const status of stuckStatuses) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();

      for (const message of messages) {
        const msg = message as Record<string, unknown>;
        const creationTime = msg._creationTime as number;
        const age = now - creationTime;
        if (age > tenMinutesMs) {
          await ctx.db.patch(msg._id, { status: "failed" });
        }
      }
    }
  },
});

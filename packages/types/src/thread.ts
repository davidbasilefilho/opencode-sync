import { z } from "zod";

/** Schema for a conversation thread. */
export const ThreadSchema = z.object({
  /** Unique identifier (Convex document ID) */
  _id: z.string().optional(),
  /** Human-readable thread title */
  title: z.string().min(1).max(200),
  /** ISO 8601 creation timestamp */
  createdAt: z.string().datetime(),
  /** Identifier of the last machine that modified this thread */
  lastActiveMachineId: z.string().min(1),
  /** Storage root directory on the active machine */
  storageRoot: z.string().min(1),
  /** JSON blob of enabled SDK plugin configurations */
  enabledPlugins: z.record(z.string(), z.unknown()).default({}),
});

/** TypeScript type derived from ThreadSchema */
export type Thread = z.infer<typeof ThreadSchema>;

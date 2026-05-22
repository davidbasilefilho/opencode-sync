import { z } from "zod";

/** Schema for local sync configuration persisted on the client machine. */
export const SyncConfigSchema = z.object({
  /** Self-hosted Convex deployment URL */
  convexUrl: z.string().url(),
  /** Sync Security Key (API Key) for authentication */
  apiKey: z.string().min(1),
  /** Unique hardware-based machine identifier */
  machineId: z.string().min(1),
  /** Absolute path to the local storage root directory */
  storageRoot: z.string().min(1),
});

/** TypeScript type derived from SyncConfigSchema */
export type SyncConfig = z.infer<typeof SyncConfigSchema>;

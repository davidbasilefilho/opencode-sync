import { z } from "zod";

/** Schema for a machine profile registered in the workspace. */
export const MachineProfileSchema = z.object({
  /** Unique hardware-based machine identifier */
  machineId: z.string().min(1),
  /** Human-readable hostname */
  hostname: z.string().min(1),
  /** Operating system / platform identifier */
  platform: z.enum(["win32", "darwin", "linux", "unknown"]).default("unknown"),
  /** Absolute path to the storage root on this machine */
  storageRoot: z.string().min(1),
});

/** TypeScript type derived from MachineProfileSchema */
export type MachineProfile = z.infer<typeof MachineProfileSchema>;

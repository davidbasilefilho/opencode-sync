import { z } from "zod";

/**
 * Valid status transitions for a message: streaming -> awaiting tool -> tool executing -> completed
 * -> failed
 */
export const MessageStatus = z.enum([
  "streaming",
  "awaiting tool",
  "tool executing",
  "completed",
  "failed",
]);
export type MessageStatus = z.infer<typeof MessageStatus>;

/** Schema for a single message within a thread. */
export const MessageSchema = z.object({
  /** Unique identifier (Convex document ID) */
  _id: z.string().optional(),
  /** Parent thread identifier */
  threadId: z.string().min(1),
  /** Sender role */
  role: z.enum(["user", "assistant", "system"]),
  /** Text content buffer (accumulated during streaming) */
  text: z.string().default(""),
  /** Current processing status */
  status: MessageStatus.default("streaming"),
  /** Tool call identifier, set when status is "awaiting tool" */
  toolCallId: z.string().optional(),
  /** Name of the tool being executed */
  toolName: z.string().optional(),
  /** Raw JSON arguments for the tool call */
  toolArgs: z.string().optional(),
  /** Text result from tool execution */
  toolResult: z.string().optional(),
  /** Machine assigned to execute the tool */
  assignedMachine: z.string().optional(),
});

/** TypeScript type derived from MessageSchema */
export type Message = z.infer<typeof MessageSchema>;

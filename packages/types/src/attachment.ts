import { z } from "zod";

/** Schema for file attachments linked to threads or messages. */
export const AttachmentSchema = z.object({
  /** Unique identifier (Convex document ID) */
  _id: z.string().optional(),
  /** Optional parent thread reference */
  threadId: z.string().optional(),
  /** Optional parent message reference */
  messageId: z.string().optional(),
  /** Convex Storage file identifier */
  storageFileId: z.string().min(1),
  /** Original file name for display or restore */
  originalName: z.string().min(1),
  /** MIME type for content negotiation */
  mimeType: z.string().min(1),
});

/** TypeScript type derived from AttachmentSchema */
export type Attachment = z.infer<typeof AttachmentSchema>;

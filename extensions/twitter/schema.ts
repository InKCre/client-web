/**
 * Twitter Extension Schema
 *
 * Zod schemas for Tweet content aligned with core-py's Twitter extension.
 */

import { z } from "zod";

// Video variant schema
export const VideoVariantSchema = z.object({
  bitrate: z.number().nullable().optional(),
  content_type: z.string().nullable().optional(),
  url: z.string(),
});

// Photo schema
export const TweetPhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt_text: z.string().nullable().optional(),
});

// Video schema
export const TweetVideoSchema = z.object({
  id: z.string(),
  variants: z.array(VideoVariantSchema),
});

// Tweet schema
export const TweetSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  text: z.string(), // Contains [photo], [video], [link] placeholders
});

// Type exports
export type Tweet = z.infer<typeof TweetSchema>;
export type TweetPhoto = z.infer<typeof TweetPhotoSchema>;
export type TweetVideo = z.infer<typeof TweetVideoSchema>;
export type VideoVariant = z.infer<typeof VideoVariantSchema>;

// Relation patterns (aligned with core-py)
export const RELATION_ATTACHMENT_PHOTO = "attachment:photo";
export const RELATION_ATTACHMENT_VIDEO = "attachment:video";
export const RELATION_ENTITIES_URL = "entities:url";

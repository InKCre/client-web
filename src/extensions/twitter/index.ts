/**
 * Twitter Extension
 *
 * This module imports the TweetResolver to trigger decorator registration.
 * Import this module in main.ts to enable tweet block support.
 */

// Import resolver to trigger @ResolverManager.registry() decorator registration
import "./resolver";

// Re-export for external use
export { TweetResolver } from "./resolver";
export { TweetSchema, type Tweet, type TweetPhoto, type TweetVideo } from "./schema";
export {
  RELATION_ATTACHMENT_PHOTO,
  RELATION_ATTACHMENT_VIDEO,
  RELATION_ENTITIES_URL,
} from "./schema";

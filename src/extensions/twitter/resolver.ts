/**
 * Twitter Resolver
 *
 * Handles Tweet content with inline media display.
 * Aligned with core-py's TweetResolver (rso_type="tweet")
 */

import { markRaw } from "vue";
import { BaseResolver, ResolverManager } from "@/business/info-base/resolver";
import type { Tweet } from "./schema";
import ContentTweet from "./components/ContentTweet.vue";

@ResolverManager.registry("tweet")
export class TweetResolver extends BaseResolver<string, Tweet> {
  readonly type = "tweet";
  readonly contentComp = markRaw(ContentTweet);

  // No methods needed - component handles everything:
  // - resolver.block.content to parse tweet JSON
  // - resolver.getRelations() to get related photo/video blocks
  // - Relation.getByPattern() to filter by attachment type
}

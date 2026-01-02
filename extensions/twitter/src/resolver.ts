/**
 * Twitter Resolver
 *
 * Handles Tweet content with inline media display.
 * Aligned with core-py's TweetResolver (rso_type="tweet")
 */

import { markRaw } from "vue";
import { BaseResolver, ResolverManager } from "@host/business/info-base/resolver";
import { TweetSchema, type Tweet } from "./schema";
import ContentTweet from "./components/ContentTweet.vue";

@ResolverManager.registry("tweet")
export class TweetResolver extends BaseResolver<string, Tweet> {
  readonly type = "tweet";
  readonly contentComp = markRaw(ContentTweet);

  protected async _getSolvedContent(): Promise<Tweet> {
    const rawContent = await this.getRawContent();
    return TweetSchema.parse(JSON.parse(rawContent));
  }
}

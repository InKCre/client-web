/**
 * Twitter Resolver
 *
 * Handles Tweet content with inline media display.
 * Aligned with core-py's TweetResolver (rso_type="tweet")
 */

import { markRaw } from "vue";
import { Resolver } from "@inkcre/core";
import { TweetSchema, type Tweet } from "./schema";
import ContentTweet from "./components/ContentTweet.vue";

export class TweetResolver extends Resolver<string, Tweet> {
  static readonly type = "extensions.twitter.tweet";
  static readonly contentComp = markRaw(ContentTweet);

  static {
    Resolver.register(TweetResolver.type, TweetResolver);
  }

  protected async _getSolvedContent(): Promise<Tweet> {
    const rawContent = await this.getRawContent();
    return TweetSchema.parse(JSON.parse(rawContent));
  }
}

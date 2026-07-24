/**
 * Twitter Resolver
 *
 * Handles Tweet content with inline media display.
 * Aligned with core-py's TweetResolver (rso_type="tweet")
 *
 * Features:
 * - Parses raw JSON to Tweet object
 * - Fetches attachment images/videos from relations
 * - Uses resolver cache to avoid redundant content loading
 * - Gracefully handles missing/invalid attachments
 */

import { markRaw } from 'vue'
import { Resolver, ResolverCache } from '@inkcre/core'
import {
  TweetSchema,
  type Tweet,
  RELATION_ATTACHMENT_PHOTO,
  RELATION_ATTACHMENT_VIDEO,
} from './schema'
import ContentTweet from './components/contentTweet/contentTweet.vue'

export class TweetResolver extends Resolver<string, Tweet> {
  static readonly type = 'extensions.twitter.tweet'
  static readonly contentComp = markRaw(ContentTweet)

  static {
    Resolver.register(TweetResolver.type, TweetResolver)
  }

  protected async _getSolvedContent(): Promise<Tweet> {
    const rawContent = await this.getRawContent()
    const tweet = TweetSchema.parse(JSON.parse(rawContent))

    // If attachments are already populated, return as-is
    if (tweet.attachments && tweet.attachments.length > 0) {
      return tweet
    }

    // Fetch attachment relations (outgoing only: from_ = this block)
    const attachmentRelations = await this.getRelations({
      includeOut: true,
      includeIn: false,
    })

    const attachmentPatterns = [RELATION_ATTACHMENT_PHOTO, RELATION_ATTACHMENT_VIDEO]
    const filteredRelations = attachmentRelations.filter((rel) =>
      attachmentPatterns.some((pattern) => rel.content.startsWith(pattern))
    )

    if (filteredRelations.length === 0) {
      return tweet
    }

    // Resolve attachment content
    try {
      const attachments: string[] = []

      for (const relation of filteredRelations) {
        try {
          // Get the attachment block from relation
          const { Block } = await import('@inkcre/core')
          const attachmentBlock = await Block.get(relation.to_)

          // Use ResolverCache to get resolver for attachment block
          const attachmentResolver = await ResolverCache.getResolver(attachmentBlock)
          const attachmentContent = await attachmentResolver.getSolvedContent()

          // Content should be ObjectURL string (from ImageResolver or VideoResolver)
          if (typeof attachmentContent === 'string') {
            attachments.push(attachmentContent)
          }
        } catch (error) {
          // Log error but continue with other attachments
          console.warn(
            `[TweetResolver] Failed to resolve attachment relation ${relation.id}:`,
            error
          )
        }
      }

      // Populate attachments array
      if (attachments.length > 0) {
        tweet.attachments = attachments
      }
    } catch (error) {
      // Log error but return tweet without attachments
      console.warn('[TweetResolver] Failed to fetch attachments:', error)
    }

    return tweet
  }
}

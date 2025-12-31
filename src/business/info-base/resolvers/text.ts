/**
 * Text Resolver
 *
 * Handles plain text content (characters, numbers, punctuation - no formatting).
 * Aligned with core-py's TextResolver (rso_type="text")
 */

import { markRaw } from "vue";
import { BaseResolver, ResolverManager } from "../resolver";
import ContentText from "@/components/info-base/resolvers/ContentText.vue";

@ResolverManager.registry("text")
export class TextResolver extends BaseResolver<string> {
  readonly type = "text";
  readonly contentComp = markRaw(ContentText);

  protected async _getSolvedContent(): Promise<string> {
    return this.getRawContent();
  }
}

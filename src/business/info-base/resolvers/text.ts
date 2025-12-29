/**
 * Text Resolver
 *
 * Handles plain text content (characters, numbers, punctuation - no formatting).
 * Aligned with core-py's TextResolver (rso_type="text")
 */

import { markRaw } from "vue";
import { BaseResolver, type RenderedContent } from "../resolver";
import InGraphText from "@/components/info-base/resolvers/InGraphText.vue";

export class TextResolver extends BaseResolver<string> {
  readonly type = "text";
  readonly inGraph = markRaw(InGraphText);

  getText(rawContent: string): string {
    return rawContent;
  }

  preview(rawContent: string, maxLength: number = 50): string {
    return this.truncate(rawContent, maxLength);
  }

  async resolve(rawContent: string): Promise<RenderedContent> {
    return {
      type: "text",
      html: this.escapeHtml(rawContent),
    };
  }
}

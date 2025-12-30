/**
 * HTML Resolver
 *
 * Handles HTML content from various sources.
 * Aligned with core-py's HtmlResolver (rso_type="html")
 */

import { markRaw } from "vue";
import { BaseResolver, ResolverManager } from "../resolver";
import type { HtmlContent } from "../storages/http";
import ContentHtml from "@/components/info-base/resolvers/ContentHtml.vue";

export type HtmlRawContent = string | HtmlContent;

@ResolverManager.registry("html")
export class HtmlResolver extends BaseResolver<HtmlRawContent> {
  readonly type = "html";
  readonly contentComp = markRaw(ContentHtml);
}

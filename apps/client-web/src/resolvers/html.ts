/**
 * HTML Resolver for client-web
 *
 * Extends HtmlResolver from @inkcre/core with Vue component.
 */

import { markRaw } from "vue";
import { HtmlResolver, ResolverManager } from "@inkcre/core";
import ContentHtml from "@/components/info-base/resolvers/ContentHtml.vue";

@ResolverManager.registry("html")
export class HtmlResolver extends HtmlResolver {
  readonly contentComp = markRaw(ContentHtml);
}

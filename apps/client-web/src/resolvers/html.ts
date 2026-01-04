/**
 * HTML Resolver for client-web
 *
 * Extends CoreHtmlResolver from @inkcre/core with Vue component.
 */

import { markRaw } from "vue";
import { CoreHtmlResolver, ResolverManager } from "@inkcre/core";
import ContentHtml from "@/components/info-base/resolvers/ContentHtml.vue";

@ResolverManager.registry("html")
export class HtmlResolver extends CoreHtmlResolver {
  readonly contentComp = markRaw(ContentHtml);
}

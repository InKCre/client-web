/**
 * Text Resolver for client-web
 *
 * Extends TextResolver from @inkcre/core with Vue component.
 */

import { markRaw } from "vue";
import { TextResolver, ResolverManager } from "@inkcre/core";
import ContentText from "@/components/info-base/resolvers/ContentText.vue";

@ResolverManager.registry("text")
export class TextResolver extends TextResolver {
  readonly contentComp = markRaw(ContentText);
}

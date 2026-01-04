/**
 * Text Resolver for client-web
 *
 * Extends CoreTextResolver from @inkcre/core with Vue component.
 */

import { markRaw } from "vue";
import { CoreTextResolver, ResolverManager } from "@inkcre/core";
import ContentText from "@/components/info-base/resolvers/ContentText.vue";

@ResolverManager.registry("text")
export class TextResolver extends CoreTextResolver {
  readonly contentComp = markRaw(ContentText);
}

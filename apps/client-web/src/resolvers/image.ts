/**
 * Image Resolver for client-web
 *
 * Extends CoreImageResolver from @inkcre/core with Vue component.
 */

import { markRaw } from "vue";
import { CoreImageResolver, ResolverManager } from "@inkcre/core";
import ContentImage from "@/components/info-base/resolvers/ContentImage.vue";

@ResolverManager.registry("image")
export class ImageResolver extends CoreImageResolver {
  readonly contentComp = markRaw(ContentImage);
}

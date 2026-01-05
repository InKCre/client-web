/**
 * Image Resolver for client-web
 *
 * Extends ImageResolver from @inkcre/core with Vue component.
 */

import { markRaw } from "vue";
import { ImageResolver, ResolverManager } from "@inkcre/core";
import ContentImage from "@/components/info-base/resolvers/ContentImage.vue";

@ResolverManager.registry("image")
export class ImageResolver extends ImageResolver {
  readonly contentComp = markRaw(ContentImage);
}

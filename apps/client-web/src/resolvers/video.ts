/**
 * Video Resolver for client-web
 *
 * Extends CoreVideoResolver from @inkcre/core with Vue component.
 */

import { markRaw } from "vue";
import { CoreVideoResolver, ResolverManager } from "@inkcre/core";
import ContentVideo from "@/components/info-base/resolvers/ContentVideo.vue";

@ResolverManager.registry("video")
export class VideoResolver extends CoreVideoResolver {
  readonly contentComp = markRaw(ContentVideo);
}

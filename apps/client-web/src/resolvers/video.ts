/**
 * Video Resolver for client-web
 *
 * Extends VideoResolver from @inkcre/core with Vue component.
 */

import { markRaw } from "vue";
import { VideoResolver, ResolverManager } from "@inkcre/core";
import ContentVideo from "@/components/info-base/resolvers/ContentVideo.vue";

@ResolverManager.registry("video")
export class VideoResolver extends VideoResolver {
  readonly contentComp = markRaw(ContentVideo);
}

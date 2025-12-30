/**
 * Video Resolver
 *
 * Handles video content from various sources.
 * Aligned with core-py's VideoResolver (rso_type="video")
 */

import { markRaw } from "vue";
import { BaseResolver, ResolverManager } from "../resolver";
import type { VideoContent } from "../storages/http";
import ContentVideo from "@/components/info-base/resolvers/ContentVideo.vue";

export type VideoRawContent = string | VideoContent;

@ResolverManager.registry("video")
export class VideoResolver extends BaseResolver<VideoRawContent> {
  readonly type = "video";
  readonly contentComp = markRaw(ContentVideo);
}

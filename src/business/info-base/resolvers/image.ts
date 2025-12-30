/**
 * Image Resolver
 *
 * Handles image content from various sources.
 * Aligned with core-py's ImageResolver (rso_type="image")
 */

import { markRaw } from "vue";
import { BaseResolver, ResolverManager } from "../resolver";
import type { ImageContent } from "../storages/http";
import ContentImage from "@/components/info-base/resolvers/ContentImage.vue";

export type ImageRawContent = string | ImageContent;

@ResolverManager.registry("image")
export class ImageResolver extends BaseResolver<ImageRawContent> {
  readonly type = "image";
  readonly contentComp = markRaw(ContentImage);
}

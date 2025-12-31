/**
 * Image Resolver
 *
 * Handles image content from various sources.
 * Aligned with core-py's ImageResolver (rso_type="image")
 */

import { markRaw } from "vue";
import { BaseResolver, ResolverManager } from "../resolver";
import ContentImage from "@/components/info-base/resolvers/ContentImage.vue";

export type ImageRawContent = Blob;

@ResolverManager.registry("image")
/**
 * @description
 * Expect raw content to be Blob, solved content to be Object URL.
 */
export class ImageResolver extends BaseResolver<Blob, string> {
  readonly type = "image";
  readonly contentComp = markRaw(ContentImage);

  protected async _getSolvedContent(): Promise<string> {
    const rawContent = await this.getRawContent();
    return URL.createObjectURL(rawContent);
  }
}

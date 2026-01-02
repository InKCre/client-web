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
  private _objectUrl: string | null = null;

  protected async _getSolvedContent(): Promise<string> {
    const rawContent = await this.getRawContent();
    this._objectUrl = URL.createObjectURL(rawContent);
    return this._objectUrl;
  }

  /**
   * ObjectURL requires explicit revocation to free memory.
   * Check `chrome://blob-internals/` to see active Blob URLs.
   * Run `fetch(_objectUrl)` to confirm revocation.
   */
  async dispose(): Promise<void> {
    if (this._objectUrl) {
      URL.revokeObjectURL(this._objectUrl);
      this._objectUrl = null;
    }
  }
}

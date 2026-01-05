/**
 * Core Image Resolver
 *
 * Handles image content from various sources.
 * Converts Blob to Object URL for display.
 * Apps must extend this class and provide contentComp Vue component.
 */

import { Resolver } from "./base";

/**
 * Abstract image resolver with logic implementation.
 * Expects raw content to be Blob, solved content to be Object URL.
 * Apps must extend and provide contentComp.
 */
export abstract class ImageResolver extends Resolver<Blob, string> {
  readonly type = "image";
  protected _objectUrl: string | null = null;

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

/**
 * @deprecated Use `ImageResolver` instead. Will be removed in v2.0.
 */

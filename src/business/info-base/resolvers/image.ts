/**
 * Image Resolver
 *
 * Handles image content from various sources.
 * Aligned with core-py's ImageResolver (rso_type="image")
 */

import { markRaw } from "vue";
import { BaseResolver, type RenderedContent } from "../resolver";
import type { ImageContent } from "../storages/http";
import InGraphImage from "@/components/info-base/resolvers/InGraphImage.vue";

export type ImageRawContent = string | ImageContent;

export class ImageResolver extends BaseResolver<ImageRawContent> {
  readonly type = "image";
  readonly inGraph = markRaw(InGraphImage);

  getText(rawContent: ImageRawContent): string {
    if (typeof rawContent === "string") {
      return `[Image: ${rawContent}]`;
    }
    return `[Image: ${rawContent.mimeType || "unknown"}]`;
  }

  preview(rawContent: ImageRawContent, maxLength: number = 50): string {
    const text = this.getText(rawContent);
    return this.truncate(text, maxLength);
  }

  async resolve(rawContent: ImageRawContent): Promise<RenderedContent> {
    const src = this.getImageSrc(rawContent);

    return {
      type: "html",
      html: `<img src="${this.escapeHtml(src)}" alt="Image" style="max-width: 100%; height: auto;" />`,
    };
  }

  private getImageSrc(rawContent: ImageRawContent): string {
    if (typeof rawContent === "string") {
      return rawContent;
    }

    if (rawContent.dataUrl) {
      return rawContent.dataUrl;
    }

    if (rawContent.blob) {
      return URL.createObjectURL(rawContent.blob);
    }

    return rawContent.url;
  }
}

/**
 * Video Resolver
 *
 * Handles video content from various sources.
 * Aligned with core-py's VideoResolver (rso_type="video")
 */

import { markRaw } from "vue";
import { BaseResolver, type RenderedContent } from "../resolver";
import type { VideoContent } from "../storages/http";
import InGraphVideo from "@/components/info-base/resolvers/InGraphVideo.vue";

export type VideoRawContent = string | VideoContent;

export class VideoResolver extends BaseResolver<VideoRawContent> {
  readonly type = "video";
  readonly inGraph = markRaw(InGraphVideo);

  getText(rawContent: VideoRawContent): string {
    if (typeof rawContent === "string") {
      return `[Video: ${rawContent}]`;
    }
    return `[Video: ${rawContent.mimeType || "unknown"}]`;
  }

  preview(rawContent: VideoRawContent, maxLength: number = 50): string {
    const text = this.getText(rawContent);
    return this.truncate(text, maxLength);
  }

  async resolve(rawContent: VideoRawContent): Promise<RenderedContent> {
    const src = this.getVideoSrc(rawContent);
    const mimeType = this.getMimeType(rawContent);

    return {
      type: "html",
      html: `<video controls style="max-width: 100%; height: auto;">
        <source src="${this.escapeHtml(src)}" type="${mimeType}" />
        Your browser does not support the video tag.
      </video>`,
    };
  }

  private getVideoSrc(rawContent: VideoRawContent): string {
    if (typeof rawContent === "string") {
      return rawContent;
    }
    return rawContent.url;
  }

  private getMimeType(rawContent: VideoRawContent): string {
    if (typeof rawContent === "string") {
      return this.inferMimeType(rawContent);
    }
    return rawContent.mimeType || "video/mp4";
  }

  private inferMimeType(url: string): string {
    const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
    const mimeTypes: Record<string, string> = {
      mp4: "video/mp4",
      webm: "video/webm",
      ogg: "video/ogg",
      ogv: "video/ogg",
    };
    return mimeTypes[ext || ""] || "video/mp4";
  }
}

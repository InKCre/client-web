/**
 * HTML Resolver
 *
 * Handles HTML content from various sources.
 * Aligned with core-py's HtmlResolver (rso_type="html")
 */

import { markRaw } from "vue";
import { BaseResolver, type RenderedContent } from "../resolver";
import type { HtmlContent } from "../storages/http";
import InGraphHtml from "@/components/info-base/resolvers/InGraphHtml.vue";

export type HtmlRawContent = string | HtmlContent;

export class HtmlResolver extends BaseResolver<HtmlRawContent> {
  readonly type = "html";
  readonly inGraph = markRaw(InGraphHtml);

  getText(rawContent: HtmlRawContent): string {
    const html = this.getHtmlString(rawContent);
    return this.stripHtml(html);
  }

  preview(rawContent: HtmlRawContent, maxLength: number = 50): string {
    // Use title if available
    if (typeof rawContent !== "string" && rawContent.title) {
      return this.truncate(rawContent.title, maxLength);
    }

    const text = this.getText(rawContent);
    return this.truncate(text, maxLength) || "[HTML]";
  }

  async resolve(rawContent: HtmlRawContent): Promise<RenderedContent> {
    const html = this.getHtmlString(rawContent);

    // Sanitize HTML for safe rendering
    const sanitizedHtml = this.sanitizeHtml(html);

    return {
      type: "html",
      html: sanitizedHtml,
    };
  }

  private getHtmlString(rawContent: HtmlRawContent): string {
    if (typeof rawContent === "string") {
      return rawContent;
    }
    return rawContent.html;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private sanitizeHtml(html: string): string {
    // Basic sanitization - remove script tags and event handlers
    // In production, use a proper sanitizer like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/on\w+\s*=\s*[^\s>]+/gi, "");
  }
}

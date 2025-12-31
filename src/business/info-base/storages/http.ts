/**
 * HTTP-based Storage Handlers
 *
 * These handlers fetch content from URLs stored in block.content.
 * Aligned with core-py's app/business/info_base/storage/http.py
 */

import type { Block } from "../block";
import { Storage } from "../storage";

// ============================================================================
// HTTP Storage Configuration
// ============================================================================

export interface HttpStorageConfig {
  timeout?: number; // Request timeout in ms (default: 30000)
  followRedirects?: boolean; // Whether to follow redirects (default: true)
}

const DEFAULT_TIMEOUT = 30000;

// ============================================================================
// Base HTTP Storage
// ============================================================================

/**
 * Base class for HTTP-based storage handlers.
 * Provides common URL fetching functionality.
 */
export abstract class HttpStorage<
  ContentT = unknown
> extends Storage<ContentT> {
  protected abstract readonly acceptHeader: string;

  /**
   * Fetch content from URL with configured options.
   */
  protected async fetchUrl(
    url: string,
    config?: HttpStorageConfig
  ): Promise<Response> {
    const timeout = config?.timeout ?? DEFAULT_TIMEOUT;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: this.acceptHeader,
        },
        redirect: config?.followRedirects !== false ? "follow" : "manual",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ============================================================================
// HTTP Image Storage
// ============================================================================

/**
 * Fetches image content from (http/https)URL.
 * Returns Blob.
 */
@Storage.registry("http-image")
export class HttpImageStorage extends HttpStorage<Blob> {
  protected readonly acceptHeader = "image/*";

  protected async _getRawContent(block: Block): Promise<Blob> {
    const url = block.content.trim();
    const response = await this.fetchUrl(url);
    return await response.blob();
  }

  /** Base64 encoded image data */
  public blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// ============================================================================
// HTTP Video Storage
// ============================================================================

export interface VideoContent {
  url: string;
  mimeType: string;
  thumbnailUrl?: string;
}

/**
 * Fetches video content from URL.
 * Returns the URL for lazy loading (videos are typically streamed).
 */
@Storage.registry("http-video")
export class HttpVideoStorage extends HttpStorage<VideoContent> {
  protected readonly acceptHeader = "video/*";

  protected async _getRawContent(block: Block): Promise<VideoContent> {
    const url = block.content.trim();

    return {
      url,
      mimeType: this.inferMimeType(url),
    };
  }

  private inferMimeType(url: string): string {
    const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
    const mimeTypes: Record<string, string> = {
      mp4: "video/mp4",
      webm: "video/webm",
      ogg: "video/ogg",
      ogv: "video/ogg",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      mkv: "video/x-matroska",
    };
    return mimeTypes[ext || ""] || "video/unknown";
  }
}

// ============================================================================
// HTTP Text Storage
// ============================================================================

export interface TextContent {
  text: string;
  encoding?: string;
}

/**
 * Fetches plain text content from URL.
 */
@Storage.registry("http-text")
export class HttpTextStorage extends HttpStorage<TextContent> {
  protected readonly acceptHeader = "text/plain";

  protected async _getRawContent(block: Block): Promise<TextContent> {
    const url = block.content.trim();

    const response = await this.fetchUrl(url);
    const text = await response.text();
    const encoding =
      response.headers.get("content-type")?.match(/charset=([^;]+)/)?.[1] ||
      "utf-8";

    return {
      text,
      encoding,
    };
  }
}

// ============================================================================
// HTTP HTML Storage
// ============================================================================

export interface HtmlContent {
  html: string;
  sourceUrl: string;
  title?: string;
}

/**
 * Fetches HTML content from URL.
 * Optionally extracts title and sanitizes content.
 */
@Storage.registry("http-html")
export class HttpHtmlStorage extends HttpStorage<HtmlContent> {
  protected readonly acceptHeader = "text/html";

  protected async _getRawContent(block: Block): Promise<HtmlContent> {
    const url = block.content.trim();

    const response = await this.fetchUrl(url);
    let html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Basic sanitization - remove script tags and event handlers
    html = this.sanitizeHtml(html);

    return {
      html,
      sourceUrl: url,
      title,
    };
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

// ============================================================================
// HTTP JSON Storage
// ============================================================================

export interface JsonContent {
  data: unknown;
  sourceUrl: string;
}

/**
 * Fetches JSON content from URL.
 */
@Storage.registry("http-json")
export class HttpJsonStorage extends HttpStorage<JsonContent> {
  protected readonly acceptHeader = "application/json";

  protected async _getRawContent(block: Block): Promise<JsonContent> {
    const url = block.content.trim();

    const response = await this.fetchUrl(url);
    const data = await response.json();

    return {
      data,
      sourceUrl: url,
    };
  }
}

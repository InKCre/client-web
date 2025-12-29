/**
 * HTTP-based Storage Handlers
 *
 * These handlers fetch content from URLs stored in block.content.
 * Aligned with core-py's app/business/info_base/storage/http.py
 */

import type { Block } from "../block";
import type { StorageHandler } from "../storage";

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
export abstract class HttpStorage<ContentT = unknown>
  implements StorageHandler<ContentT>
{
  abstract readonly type: string;
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

  abstract getRawContent(
    block: Block,
    config?: Record<string, unknown>
  ): Promise<ContentT>;
}

// ============================================================================
// HTTP Image Storage
// ============================================================================

export interface ImageContent {
  url: string;
  blob?: Blob;
  dataUrl?: string;
  mimeType: string;
  width?: number;
  height?: number;
}

/**
 * Fetches image content from URL.
 * Returns the URL directly for lazy loading, or fetches as blob/dataUrl if configured.
 */
export class HttpImageStorage extends HttpStorage<ImageContent> {
  readonly type = "http-image";
  protected readonly acceptHeader = "image/*";

  async getRawContent(
    block: Block,
    config?: Record<string, unknown>
  ): Promise<ImageContent> {
    const url = block.content.trim();
    const fetchAsBlob = config?.fetchAsBlob ?? false;
    const fetchAsDataUrl = config?.fetchAsDataUrl ?? false;

    // Default: return URL for lazy loading (better performance in graphs)
    if (!fetchAsBlob && !fetchAsDataUrl) {
      return {
        url,
        mimeType: this.inferMimeType(url),
      };
    }

    // Fetch as blob
    const response = await this.fetchUrl(url, config as HttpStorageConfig);
    const blob = await response.blob();
    const mimeType =
      response.headers.get("content-type") || this.inferMimeType(url);

    const result: ImageContent = {
      url,
      blob,
      mimeType,
    };

    // Convert to dataUrl if requested
    if (fetchAsDataUrl) {
      result.dataUrl = await this.blobToDataUrl(blob);
    }

    return result;
  }

  private inferMimeType(url: string): string {
    const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      bmp: "image/bmp",
    };
    return mimeTypes[ext || ""] || "image/unknown";
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
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
export class HttpVideoStorage extends HttpStorage<VideoContent> {
  readonly type = "http-video";
  protected readonly acceptHeader = "video/*";

  async getRawContent(
    block: Block,
    config?: Record<string, unknown>
  ): Promise<VideoContent> {
    const url = block.content.trim();

    return {
      url,
      mimeType: this.inferMimeType(url),
      thumbnailUrl: config?.thumbnailUrl as string | undefined,
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
export class HttpTextStorage extends HttpStorage<TextContent> {
  readonly type = "http-text";
  protected readonly acceptHeader = "text/plain";

  async getRawContent(
    block: Block,
    config?: Record<string, unknown>
  ): Promise<TextContent> {
    const url = block.content.trim();

    const response = await this.fetchUrl(url, config as HttpStorageConfig);
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
export class HttpHtmlStorage extends HttpStorage<HtmlContent> {
  readonly type = "http-html";
  protected readonly acceptHeader = "text/html";

  async getRawContent(
    block: Block,
    config?: Record<string, unknown>
  ): Promise<HtmlContent> {
    const url = block.content.trim();

    const response = await this.fetchUrl(url, config as HttpStorageConfig);
    let html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Sanitize if configured (basic sanitization, use DOMPurify in production)
    if (config?.sanitize !== false) {
      html = this.sanitizeHtml(html);
    }

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
export class HttpJsonStorage extends HttpStorage<JsonContent> {
  readonly type = "http-json";
  protected readonly acceptHeader = "application/json";

  async getRawContent(
    block: Block,
    config?: Record<string, unknown>
  ): Promise<JsonContent> {
    const url = block.content.trim();

    const response = await this.fetchUrl(url, config as HttpStorageConfig);
    const data = await response.json();

    return {
      data,
      sourceUrl: url,
    };
  }
}

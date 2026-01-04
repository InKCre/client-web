/**
 * Core HTML Resolver
 *
 * Handles HTML content from various sources.
 * Apps must extend this class and provide contentComp Vue component.
 */

import { InfoBaseResolver } from "./base";

export interface HtmlContent {
  html: string;
  sourceUrl: string;
  title?: string;
}

export type HtmlRawContent = string | HtmlContent;

/**
 * Abstract HTML resolver with logic implementation.
 * Apps must extend and provide contentComp.
 */
export abstract class CoreHtmlResolver extends InfoBaseResolver<HtmlRawContent> {
  readonly type = "html";

  protected async _getSolvedContent(): Promise<HtmlRawContent> {
    return this.getRawContent();
  }
}

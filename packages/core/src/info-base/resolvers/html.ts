/**
 * Core HTML Resolver
 *
 * Handles HTML content from various sources.
 * Apps must extend this class and provide contentComp Vue component.
 */

import { Resolver } from './base'
import type { ProjectionOptions } from './contracts'
import { decodeHtml } from './decode'

export type HtmlRawContent = string | Uint8Array

/**
 * Abstract HTML resolver with logic implementation.
 * Apps must extend and provide contentComp.
 */
export class HtmlResolver extends Resolver<HtmlRawContent, string> {
  static readonly type = 'core.html.v1'

  protected async _getSolvedContent(options: ProjectionOptions): Promise<string> {
    return decodeHtml(await this.getRawContent(options), HtmlResolver.type)
  }

  async getText(options: ProjectionOptions = {}): Promise<string> {
    const source = await this.getSolvedContent(options)
    const text =
      typeof DOMParser === 'undefined'
        ? source.replace(/<[^>]+>/g, ' ')
        : (new DOMParser().parseFromString(source, 'text/html').body.textContent ?? '')
    return text.replace(/\s+/g, ' ').trim()
  }

  async getStrForEmbedding(options: ProjectionOptions = {}): Promise<string> {
    return this.getText(options)
  }
}

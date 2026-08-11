/**
 * Text Resolver
 *
 * Handles plain text content (characters, numbers, punctuation - no formatting).
 * Apps bind a presentation-neutral solved-content renderer.
 */

import { Resolver } from './base'
import type { ProjectionOptions } from './contracts'
import { decodeUnicode } from './decode'

/**
 * Abstract text resolver with logic implementation.
 * Apps bind the renderer without changing this Resolver contract.
 */
export class TextResolver extends Resolver<string | Uint8Array, string> {
  static readonly type = 'core.text.v1'

  protected async _getSolvedContent(options: ProjectionOptions): Promise<string> {
    return decodeUnicode(await this.getRawContent(options), TextResolver.type)
  }

  async getText(options: ProjectionOptions = {}): Promise<string> {
    return this.getSolvedContent(options)
  }

  async getStrForEmbedding(options: ProjectionOptions = {}): Promise<string> {
    return this.getText(options)
  }
}

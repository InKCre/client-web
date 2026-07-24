/**
 * Text Resolver
 *
 * Handles plain text content (characters, numbers, punctuation - no formatting).
 * Apps must extend this class and provide contentComp Vue component.
 */

import { Resolver } from './base'

/**
 * Abstract text resolver with logic implementation.
 * Apps must extend and provide contentComp.
 */
export class TextResolver extends Resolver<string> {
  static readonly type = 'text'

  static {
    Resolver.register('text', this)
  }

  protected async _getSolvedContent(): Promise<string> {
    return this.getRawContent()
  }
}

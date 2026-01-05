/**
 * Text Resolver
 *
 * Handles plain text content (characters, numbers, punctuation - no formatting).
 * Apps must extend this class and provide contentComp Vue component.
 */

import { Resolver } from "./base";

/**
 * Abstract text resolver with logic implementation.
 * Apps must extend and provide contentComp.
 */
export abstract class TextResolver extends Resolver<string> {
  readonly type = "text";

  protected async _getSolvedContent(): Promise<string> {
    return this.getRawContent();
  }
}

/**
 * @deprecated Use `TextResolver` instead. Will be removed in v2.0.
 */

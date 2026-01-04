/**
 * Core Text Resolver
 *
 * Handles plain text content (characters, numbers, punctuation - no formatting).
 * Apps must extend this class and provide contentComp Vue component.
 */

import { InfoBaseResolver } from "./base";

/**
 * Abstract text resolver with logic implementation.
 * Apps must extend and provide contentComp.
 */
export abstract class CoreTextResolver extends InfoBaseResolver<string> {
  readonly type = "text";

  protected async _getSolvedContent(): Promise<string> {
    return this.getRawContent();
  }
}

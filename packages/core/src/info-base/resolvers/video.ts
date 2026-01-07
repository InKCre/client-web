/**
 * Core Video Resolver
 *
 * Handles video content from various sources.
 * Apps must extend this class and provide contentComp Vue component.
 */

import { Resolver } from './base'

export interface VideoContent {
  url: string
  mimeType: string
  thumbnailUrl?: string
}

export type VideoRawContent = string | VideoContent

/**
 * Abstract video resolver with logic implementation.
 * Apps must extend and provide contentComp.
 */
export class VideoResolver extends Resolver<VideoRawContent> {
  static readonly type = 'video'

  static {
    Resolver.register('video', this)
  }

  protected async _getSolvedContent(): Promise<VideoRawContent> {
    return this.getRawContent()
  }
}

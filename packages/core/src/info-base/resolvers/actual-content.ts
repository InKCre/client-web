export interface ByteSolvedContent {
  content: Uint8Array
  byte_size: number
  detected_media_type: string | null
  objectUrl: string
}

export class ActualContentHandle {
  private objectUrl: string | null = null

  replace(content: Uint8Array, mediaType?: string): ByteSolvedContent {
    this.dispose()
    const blob = new Blob([content as BlobPart], mediaType ? { type: mediaType } : undefined)
    this.objectUrl = URL.createObjectURL(blob)
    return {
      content,
      byte_size: content.byteLength,
      detected_media_type: null,
      objectUrl: this.objectUrl,
    }
  }

  dispose(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }
  }
}

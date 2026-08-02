import { Storage, type IStorageBlock } from './base'

export type HttpStorageConfig = {
  timeout?: number
  follow_redirects?: boolean
  max_response_bytes?: number
}

const DEFAULT_TIMEOUT_SECONDS = 30
const DEFAULT_MAX_RESPONSE_BYTES = 64 * 1024 * 1024

export class StorageContentTooLargeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageContentTooLargeError'
  }
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

/** Fetch opaque bytes over HTTP(S) without assigning content semantics. */
export class HttpStorage extends Storage<Uint8Array> {
  protected async _getRawContent(block: IStorageBlock): Promise<Uint8Array> {
    const url = block.content.trim()
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new TypeError('HTTP storage pointer must use http:// or https://')
    }

    const config = this.config as HttpStorageConfig
    const timeoutSeconds = positiveNumber(config.timeout, DEFAULT_TIMEOUT_SECONDS)
    const maximumBytes = positiveNumber(config.max_response_bytes, DEFAULT_MAX_RESPONSE_BYTES)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000)

    try {
      const response = await fetch(parsedUrl, {
        signal: controller.signal,
        redirect: config.follow_redirects === false ? 'manual' : 'follow',
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const declaredLength = Number(response.headers.get('content-length'))
      if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
        throw new StorageContentTooLargeError(
          `HTTP response declares ${declaredLength} bytes; limit is ${maximumBytes}`
        )
      }

      if (!response.body) return new Uint8Array(await response.arrayBuffer())

      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let received = 0
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        received += value.byteLength
        if (received > maximumBytes) {
          await reader.cancel()
          throw new StorageContentTooLargeError(`HTTP response exceeded ${maximumBytes} bytes`)
        }
        chunks.push(value)
      }

      const content = new Uint8Array(received)
      let offset = 0
      for (const chunk of chunks) {
        content.set(chunk, offset)
        offset += chunk.byteLength
      }
      return content
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

Storage.register('http', HttpStorage)

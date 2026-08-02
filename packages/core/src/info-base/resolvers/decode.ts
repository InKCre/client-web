import { ResolverContentError } from './contracts'

const UTF8_BOM = [0xef, 0xbb, 0xbf]
const UTF16_LE_BOM = [0xff, 0xfe]
const UTF16_BE_BOM = [0xfe, 0xff]

function startsWith(content: Uint8Array, prefix: number[]): boolean {
  return prefix.every((byte, index) => content[index] === byte)
}

function decodeStrict(content: Uint8Array, encoding: string, resolverId: string): string {
  try {
    return new TextDecoder(encoding, { fatal: true }).decode(content)
  } catch {
    throw new ResolverContentError(resolverId, `invalid ${encoding} text`)
  }
}

export function decodeUnicode(content: string | Uint8Array, resolverId: string): string {
  if (typeof content === 'string') return content
  if (startsWith(content, UTF8_BOM)) return decodeStrict(content, 'utf-8', resolverId)
  if (startsWith(content, UTF16_LE_BOM)) return decodeStrict(content, 'utf-16le', resolverId)
  if (startsWith(content, UTF16_BE_BOM)) return decodeStrict(content, 'utf-16be', resolverId)
  return decodeStrict(content, 'utf-8', resolverId)
}

export function decodeHtml(content: string | Uint8Array, resolverId: string): string {
  if (typeof content === 'string') return content
  if (
    startsWith(content, UTF8_BOM) ||
    startsWith(content, UTF16_LE_BOM) ||
    startsWith(content, UTF16_BE_BOM)
  ) {
    return decodeUnicode(content, resolverId)
  }

  const prefix = new TextDecoder('ascii').decode(content.slice(0, 4096))
  const declared =
    /<meta\s+[^>]*charset\s*=\s*["']?\s*([a-zA-Z0-9._-]+)/i.exec(prefix)?.[1] ??
    /<meta\s+[^>]*content\s*=\s*["'][^"']*charset=([a-zA-Z0-9._-]+)/i.exec(prefix)?.[1] ??
    'utf-8'
  return decodeStrict(content, declared, resolverId)
}

import type { ProtocolWithReturn } from 'webext-bridge'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    // define message protocol types
    // see https://github.com/antfu/webext-bridge#type-safe-protocols
    'open-sidepanel': { path?: '/explain.html' | '/taking-note.html' }
    'sidepanel-opened': undefined
    'sidepanel-closed': undefined
    'get-page-content': ProtocolWithReturn<Record<string, never>, { pageContent?: string }>
  }
}

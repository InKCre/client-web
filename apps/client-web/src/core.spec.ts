import { describe, expect, it } from 'vitest'
import { shouldLoadPeerConfigAtBootstrap } from './core'

describe('Peer configuration bootstrap', () => {
  it('keeps Settings reachable without contacting a configured Peer', () => {
    expect(shouldLoadPeerConfigAtBootstrap('/settings')).toBe(false)
    expect(shouldLoadPeerConfigAtBootstrap('/settings/')).toBe(false)
  })

  it('loads deployment configuration before ordinary application routes', () => {
    expect(shouldLoadPeerConfigAtBootstrap('/')).toBe(true)
    expect(shouldLoadPeerConfigAtBootstrap('/extensions')).toBe(true)
  })
})

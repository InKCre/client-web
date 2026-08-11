import { describe, expect, it } from 'vitest'
import { shouldLoadClientConfigAtBootstrap } from './core'

describe('client configuration bootstrap', () => {
  it('keeps Settings reachable without contacting a configured Peer', () => {
    expect(shouldLoadClientConfigAtBootstrap('/settings')).toBe(false)
    expect(shouldLoadClientConfigAtBootstrap('/settings/')).toBe(false)
  })

  it('loads deployment configuration before ordinary application routes', () => {
    expect(shouldLoadClientConfigAtBootstrap('/')).toBe(true)
    expect(shouldLoadClientConfigAtBootstrap('/extensions')).toBe(true)
  })
})

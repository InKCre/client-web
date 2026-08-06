import { afterEach, describe, expect, it, vi } from 'vitest'

import { PeerManager } from '../peer'
import { Extension } from './base'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Extension.updateConfig', () => {
  it('uses exact-target extension management delegation', async () => {
    const delegate = vi.spyOn(PeerManager, 'delegate').mockResolvedValue({
      status: 200,
      headers: {},
      body: {
        id: 'memos',
        version: '0.1.0',
        enabled: [],
        nickname: 'Memos',
        config: { personal_access_token: `memos_pat_${'A'.repeat(32)}` },
        config_schema: null,
      },
    })
    const extension = Extension.parse({
      id: 'memos',
      version: '0.1.0',
      enabled: [],
      nickname: 'Memos',
      config: { personal_access_token: null },
      config_schema: null,
    })
    const patch = { personal_access_token: `memos_pat_${'A'.repeat(32)}` }
    const peer = '00000000-0000-0000-0000-000000000001'

    await extension.updateConfig(peer, patch)

    expect(delegate).toHaveBeenCalledWith(
      'core.extension.management.v1',
      { body: { action: 'patch_config', extension: 'memos', patch } },
      peer
    )
  })
})

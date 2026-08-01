import { afterEach, describe, expect, it, vi } from 'vitest'

import { Client } from '../client/client'
import { Extension } from './base'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Extension.updateConfig', () => {
  it('uses the peer-authenticated core extension config endpoint', async () => {
    const request = vi.fn().mockResolvedValue({ id: 'memos' })
    vi.spyOn(Client, 'get').mockResolvedValue({ request } as unknown as Client)
    const extension = Extension.parse({
      id: 'memos',
      version: '0.1.0',
      enabled: [],
      nickname: 'Memos',
      config: { personal_access_token: null },
      config_schema: null,
    })
    const patch = { personal_access_token: `memos_pat_${'A'.repeat(32)}` }

    await extension.updateConfig('00000000-0000-0000-0000-000000000001', patch)

    expect(request).toHaveBeenCalledOnce()
    expect(request).toHaveBeenCalledWith({
      method: 'PUT',
      path: '/extensions/memos/config',
      body: patch,
    })
  })
})

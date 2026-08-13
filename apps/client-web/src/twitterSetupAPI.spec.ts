import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@inkcre/core'
import { discoverCoreCandidates, TwitterSetupAPI } from '../../../extensions/twitter/src/setup-api'

const extension = {
  name: 'inkcre/twitter',
  version: '0.2.0',
  enabled: ['00000000-0000-4000-8000-000000000002'],
  nickname: 'Twitter',
  config: {},
  config_schema: null,
}

describe('Twitter setup Core transport', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('discovers candidates by probing the semantic Core management endpoint', async () => {
    const core = Client.parse({
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Core',
      rest_api_url: 'https://core.example/',
    })
    const web = Client.parse({
      id: '00000000-0000-4000-8000-000000000003',
      name: 'Web',
      rest_api_url: 'https://web.example/',
    })
    vi.spyOn(Client, 'list').mockResolvedValue([core, web])
    vi.spyOn(core, 'request').mockResolvedValue(extension)
    vi.spyOn(web, 'request').mockRejectedValue(new Error('not a Core Peer'))

    await expect(discoverCoreCandidates()).resolves.toMatchObject([
      { client: { id: core.id }, enabled: true, extension },
    ])
  })

  it('keeps OAuth App secrets in a JSON command body and forwards cancellation', async () => {
    const client = Client.parse({
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Core',
      rest_api_url: 'https://core.example/',
    })
    const request = vi.spyOn(client, 'request').mockResolvedValue({})
    const controller = new AbortController()

    await new TwitterSetupAPI(client).saveOAuthApp(
      'client-id',
      'client-secret',
      false,
      controller.signal
    )

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        path: '/twitter/setup/oauth-app',
        body: {
          client_id: 'client-id',
          client_secret: 'client-secret',
          confirm_account_reset: false,
        },
        signal: controller.signal,
      })
    )
  })
})

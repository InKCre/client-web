import { describe, expect, it, vi } from 'vitest'
import { extensionClientControlMode, setExtensionClientEnabled } from './extension-client-control'

const currentClientId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const remoteClientId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const extension = {
  name: 'inkcre/twitter',
  version: '0.2.0',
  enabled: [],
  nickname: 'Twitter',
  config: {},
  config_schema: null,
}

function harness(client: { id: string; rest_api_url: string | null }) {
  return {
    client: {
      ...client,
      request: vi.fn(async (request: { path: string }) => ({
        ...extension,
        enabled: request.path.endsWith('/enable') ? [client.id] : [],
      })),
    },
    webHost: {
      enable: vi.fn(async () => ({ ...extension, enabled: [currentClientId] })),
      disable: vi.fn(async () => extension),
    },
    state: {
      setPeerEnabled: vi.fn(async (_name: string, clientId: string, enabled: boolean) => ({
        ...extension,
        enabled: enabled ? [clientId] : [],
      })),
    },
  }
}

describe('Extension Client control', () => {
  it('uses the Web Host lifecycle for the current browser Client', async () => {
    const control = harness({ id: currentClientId, rest_api_url: null })

    expect(extensionClientControlMode(control.client, currentClientId)).toBe('current-runtime')
    await setExtensionClientEnabled({
      name: extension.name,
      client: control.client,
      currentClientId,
      enabled: true,
      webHost: control.webHost,
      state: control.state,
    })

    expect(control.webHost.enable).toHaveBeenCalledWith(extension.name)
    expect(control.client.request).not.toHaveBeenCalled()
    expect(control.state.setPeerEnabled).not.toHaveBeenCalled()
  })

  it('uses the selected Client Host API when it has a management endpoint', async () => {
    const control = harness({ id: remoteClientId, rest_api_url: 'https://core.example.test' })

    expect(extensionClientControlMode(control.client, currentClientId)).toBe('remote-host')
    const updated = await setExtensionClientEnabled({
      name: extension.name,
      client: control.client,
      currentClientId,
      enabled: false,
      webHost: control.webHost,
      state: control.state,
    })

    expect(control.client.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/extensions/inkcre/twitter/disable',
      resBodySchema: expect.anything(),
    })
    expect(updated.enabled).toEqual([])
    expect(control.webHost.disable).not.toHaveBeenCalled()
    expect(control.state.setPeerEnabled).not.toHaveBeenCalled()
  })

  it('updates only durable desired state for an unaddressable Client', async () => {
    const control = harness({ id: remoteClientId, rest_api_url: null })

    expect(extensionClientControlMode(control.client, currentClientId)).toBe('desired-state')
    const updated = await setExtensionClientEnabled({
      name: extension.name,
      client: control.client,
      currentClientId,
      enabled: true,
      webHost: control.webHost,
      state: control.state,
    })

    expect(control.state.setPeerEnabled).toHaveBeenCalledWith(extension.name, remoteClientId, true)
    expect(updated.enabled).toEqual([remoteClientId])
    expect(control.webHost.enable).not.toHaveBeenCalled()
    expect(control.client.request).not.toHaveBeenCalled()
  })

  it('rejects a remote Host response that changed a different Client', async () => {
    const control = harness({ id: remoteClientId, rest_api_url: 'https://core.example.test' })
    control.client.request.mockResolvedValueOnce({ ...extension, enabled: [currentClientId] })

    await expect(
      setExtensionClientEnabled({
        name: extension.name,
        client: control.client,
        currentClientId,
        enabled: true,
        webHost: control.webHost,
        state: control.state,
      })
    ).rejects.toThrow(`did not enable the selected Client ${remoteClientId}`)
  })
})

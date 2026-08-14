import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExtensionsView from './extensions.vue'

const fixtures = vi.hoisted(() => {
  const currentClientId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const remoteClientId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const clients = [
    {
      id: currentClientId,
      name: 'Browser A',
      labels: ['web'],
      rest_api_url: null,
      request: vi.fn(),
    },
    {
      id: remoteClientId,
      name: 'Browser B',
      labels: ['web'],
      rest_api_url: null,
      request: vi.fn(),
    },
  ]
  const extension = {
    name: 'inkcre/twitter',
    version: '0.2.0',
    enabled: [currentClientId],
    nickname: 'Twitter',
    config: {},
    config_schema: null,
  }
  return {
    currentClientId,
    remoteClientId,
    clients,
    extension,
    host: { list: vi.fn(async () => [extension]) },
    listClients: vi.fn(async () => clients),
    setClientEnabled: vi.fn(),
  }
})

vi.mock('@inkcre/core', () => ({
  Client: { list: fixtures.listClients },
  configStore: { metaConfig: { client_id: fixtures.currentClientId } },
}))
vi.mock('@/core', () => ({
  getExtensionHost: () => fixtures.host,
  getExtensionState: () => ({ setPeerEnabled: vi.fn() }),
  startExtensionHost: vi.fn(async () => undefined),
}))
vi.mock('@/extension-client-control', () => ({
  extensionClientControlMode: (client: { id: string; rest_api_url: string | null }) =>
    client.id === fixtures.currentClientId
      ? 'current-runtime'
      : client.rest_api_url
        ? 'remote-host'
        : 'desired-state',
  setExtensionClientEnabled: fixtures.setClientEnabled,
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const ExtensionCardStub = defineComponent({
  props: ['extension', 'enabled', 'controlsCurrentWebRuntime', 'setEnabled'],
  template:
    '<div data-test="extension-card" :data-enabled="String(enabled)" :data-current="String(controlsCurrentWebRuntime)" />',
})
const InkDropdownStub = defineComponent({
  props: ['modelValue', 'options', 'label', 'placeholder'],
  emits: ['update:modelValue'],
  template: '<button data-test="client-selector" />',
})

describe('Extensions Client selector', () => {
  beforeEach(() => vi.clearAllMocks())

  it('defaults to this browser and projects enabled state for the selected Client', async () => {
    const wrapper = mount(ExtensionsView, {
      global: {
        stubs: {
          extensionCard: ExtensionCardStub,
          installExtension: true,
          InkDropdown: InkDropdownStub,
          InkLoading: true,
        },
      },
    })
    await flushPromises()

    const selector = wrapper.getComponent(InkDropdownStub)
    expect(selector.props('modelValue')).toBe(fixtures.currentClientId)
    expect(selector.props('options')[0]).toMatchObject({
      value: fixtures.currentClientId,
      label: 'Browser A (extension.currentBrowser)',
    })
    expect(wrapper.get('[data-test="extension-card"]').attributes()).toMatchObject({
      'data-enabled': 'true',
      'data-current': 'true',
    })

    selector.vm.$emit('update:modelValue', fixtures.remoteClientId)
    await nextTick()

    expect(wrapper.get('[data-test="extension-card"]').attributes()).toMatchObject({
      'data-enabled': 'false',
      'data-current': 'false',
    })
    expect(wrapper.text()).toContain('extension.desiredStateOnly')
  })

  it('keeps current-browser management available when the Client list fails', async () => {
    fixtures.listClients.mockRejectedValueOnce(new Error('Client row could not be parsed'))
    fixtures.setClientEnabled.mockResolvedValueOnce({ ...fixtures.extension, enabled: [] })
    const wrapper = mount(ExtensionsView, {
      global: {
        stubs: {
          extensionCard: ExtensionCardStub,
          installExtension: true,
          InkDropdown: InkDropdownStub,
          InkLoading: true,
        },
      },
    })
    await flushPromises()

    const selector = wrapper.getComponent(InkDropdownStub)
    const card = wrapper.getComponent(ExtensionCardStub)
    expect(selector.props('modelValue')).toBe(fixtures.currentClientId)
    expect(selector.props('options')).toEqual([
      {
        label: 'extension.currentBrowser',
        value: fixtures.currentClientId,
        description: fixtures.currentClientId,
      },
    ])
    expect(wrapper.text()).toContain('extension.clientListUnavailable')

    await card.props('setEnabled')(false)
    expect(fixtures.setClientEnabled).toHaveBeenCalledWith(
      expect.objectContaining({
        client: { id: fixtures.currentClientId, rest_api_url: null },
        currentClientId: fixtures.currentClientId,
      })
    )
  })
})

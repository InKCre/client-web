import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExtensionsView from './extensions.vue'

const fixtures = vi.hoisted(() => {
  const currentPeerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const remotePeerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const peers = [
    { id: currentPeerId, name: 'Browser A', capabilities: [], lease_expires_at: new Date() },
    { id: remotePeerId, name: 'Browser B', capabilities: [], lease_expires_at: new Date(0) },
  ]
  const extension = {
    name: 'inkcre/twitter',
    version: '0.2.0',
    enabled: [currentPeerId],
    nickname: 'Twitter',
    config: {},
    config_schema: null,
  }
  return {
    currentPeerId,
    remotePeerId,
    peers,
    extension,
    host: { list: vi.fn(async () => [extension]) },
    listPeers: vi.fn(async () => peers),
    setPeerEnabled: vi.fn(),
  }
})

vi.mock('@inkcre/core', () => ({
  Peer: {
    list: fixtures.listPeers,
    parse: (value: unknown) => value,
  },
  configStore: { metaConfig: { INKCRE_PEER_ID: fixtures.currentPeerId } },
}))
vi.mock('@/core', () => ({
  getExtensionHost: () => fixtures.host,
  getExtensionState: () => ({ setPeerEnabled: vi.fn() }),
  startExtensionHost: vi.fn(async () => undefined),
}))
vi.mock('@/extension-peer-control', () => ({
  extensionPeerControlMode: (peer: { id: string }) =>
    peer.id === fixtures.currentPeerId ? 'current-runtime' : 'desired-state',
  setExtensionPeerEnabled: fixtures.setPeerEnabled,
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

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
    expect(selector.props('modelValue')).toBe(fixtures.currentPeerId)
    expect(selector.props('options')[0]).toMatchObject({
      value: fixtures.currentPeerId,
      label: 'Browser A (extension.currentBrowser)',
    })
    expect(wrapper.get('[data-test="extension-card"]').attributes()).toMatchObject({
      'data-enabled': 'true',
      'data-current': 'true',
    })

    selector.vm.$emit('update:modelValue', fixtures.remotePeerId)
    await nextTick()
    expect(wrapper.get('[data-test="extension-card"]').attributes()).toMatchObject({
      'data-enabled': 'false',
      'data-current': 'false',
    })
    expect(wrapper.text()).toContain('extension.desiredStateOnly')
  })

  it('keeps this-browser management available when the Client list fails', async () => {
    fixtures.listPeers.mockRejectedValueOnce(new Error('Peer row could not be parsed'))
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
    expect(selector.props('options')).toEqual([
      {
        label: 'extension.currentBrowser',
        value: fixtures.currentPeerId,
        description: fixtures.currentPeerId,
      },
    ])
    expect(wrapper.text()).toContain('extension.peerListUnavailable')
  })
})

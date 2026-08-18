import { defineComponent, onMounted } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configStore, MetaConfigSchema, PeerConfigSchema } from '@inkcre/core'
import Settings from './settings.vue'

const peerListState = vi.hoisted(() => ({ mounts: 0 }))
const appRuntimeState = vi.hoisted(() => ({
  adopt: vi.fn(),
  startConfigured: vi.fn(async () => undefined),
  stop: vi.fn(),
}))

vi.mock('@/core', () => ({
  adoptWebPeerRuntime: appRuntimeState.adopt,
  startConfiguredWebPeerRuntime: appRuntimeState.startConfigured,
  stopWebPeerRuntime: appRuntimeState.stop,
}))

vi.mock('@/components/peer/peerList/peerList.vue', () => ({
  default: defineComponent({
    name: 'PeerList',
    setup() {
      onMounted(() => {
        peerListState.mounts += 1
      })
    },
    template: '<section data-test="all-clients" />',
  }),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ t: (key: string) => key }),
}))

const connectedMeta = MetaConfigSchema.parse({
  INKCRE_PGREST_URL: 'https://database.example.test/',
  INKCRE_JWT_SECRET: 'secret',
  INKCRE_PEER_ID: '00000000-0000-4000-8000-000000000001',
})
const originalMeta = { ...configStore.metaConfig }
const originalPeer = PeerConfigSchema.parse(configStore.peerConfig)

const stubs = {
  InkForm: defineComponent({ template: '<form><slot /></form>' }),
  InkInput: true,
  InkButton: defineComponent({
    props: ['text'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ text }}</button>',
  }),
  InkDoubleCheck: defineComponent({ template: '<div><slot /></div>' }),
}

describe('Settings Client scopes', () => {
  beforeEach(() => {
    peerListState.mounts = 0
    appRuntimeState.adopt.mockReset()
    appRuntimeState.startConfigured.mockClear()
    appRuntimeState.stop.mockReset()
    vi.stubGlobal('alert', vi.fn())
  })

  afterEach(() => {
    Object.assign(configStore.metaConfig, originalMeta)
    Object.assign(configStore.peerConfig, originalPeer)
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps bootstrap recovery available without mounting deployment Clients', async () => {
    Object.assign(configStore.metaConfig, MetaConfigSchema.parse({}))
    const loadPeerConfig = vi.spyOn(configStore, 'loadPeerConfig').mockResolvedValue()

    const wrapper = mount(Settings, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-test="all-clients"]').exists()).toBe(false)
    expect(loadPeerConfig).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('loads Client settings and the complete Client list once connected', async () => {
    Object.assign(configStore.metaConfig, connectedMeta)
    vi.spyOn(configStore, 'loadPeerConfig').mockResolvedValue()

    const wrapper = mount(Settings, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-test="all-clients"]').exists()).toBe(true)
    expect(peerListState.mounts).toBe(1)
    wrapper.unmount()
  })

  it('refreshes the Client list after validated Client settings are saved', async () => {
    Object.assign(configStore.metaConfig, connectedMeta)
    vi.spyOn(configStore, 'loadPeerConfig').mockResolvedValue()
    const runtime = { stop: vi.fn() }
    vi.spyOn(configStore, 'connectAndSave').mockImplementation(async (meta, peer) => {
      Object.assign(configStore.metaConfig, meta)
      Object.assign(configStore.peerConfig, peer)
      return runtime as never
    })
    const wrapper = mount(Settings, { global: { stubs } })
    await flushPromises()
    const save = wrapper.findAll('button').find((button) => button.text() === 'settings.saveConfig')

    await save?.trigger('click')
    await flushPromises()

    expect(configStore.connectAndSave).toHaveBeenCalledOnce()
    expect(appRuntimeState.adopt).toHaveBeenCalledWith(runtime)
    expect(peerListState.mounts).toBe(2)
    wrapper.unmount()
  })

  it('does not overwrite Client settings while their initial read is pending', async () => {
    Object.assign(configStore.metaConfig, connectedMeta)
    let resolveLoad: (() => void) | undefined
    vi.spyOn(configStore, 'loadPeerConfig').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve
        })
    )
    const connect = vi.spyOn(configStore, 'connectAndSave')
    const wrapper = mount(Settings, { global: { stubs } })
    await flushPromises()
    const save = wrapper.findAll('button').find((button) => button.text() === 'settings.saveConfig')

    expect(save?.attributes('disabled')).toBeDefined()
    await save?.trigger('click')
    expect(connect).not.toHaveBeenCalled()

    resolveLoad?.()
    await flushPromises()
    wrapper.unmount()
  })
})

import { defineComponent, onMounted } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientConfigSchema, configStore, MetaConfigSchema } from '@inkcre/core'
import Settings from './settings.vue'

const clientListState = vi.hoisted(() => ({ mounts: 0 }))

vi.mock('@/components/client/clientList/clientList.vue', () => ({
  default: defineComponent({
    name: 'ClientList',
    setup() {
      onMounted(() => {
        clientListState.mounts += 1
      })
    },
    template: '<section data-test="all-clients-scope" />',
  }),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ t: (key: string) => key }),
}))

const connectedMetaConfig = MetaConfigSchema.parse({
  INKCRE_PGREST_URL: 'https://database.example.test/',
  INKCRE_JWT_SECRET: 'secret',
  client_id: '00000000-0000-4000-8000-000000000001',
})
const originalMetaConfig = { ...configStore.metaConfig }
const originalClientConfig = ClientConfigSchema.parse(configStore.clientConfig)

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

describe('Settings client scopes', () => {
  beforeEach(() => {
    clientListState.mounts = 0
    vi.stubGlobal('alert', vi.fn())
  })

  afterEach(() => {
    Object.assign(configStore.metaConfig, originalMetaConfig)
    Object.assign(configStore.clientConfig, originalClientConfig)
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps the browser recovery scope local while bootstrap is unconfigured', async () => {
    Object.assign(configStore.metaConfig, MetaConfigSchema.parse({}))
    const loadClientConfig = vi.spyOn(configStore, 'loadClientConfig').mockResolvedValue()

    const wrapper = mount(Settings, { global: { stubs } })
    await flushPromises()

    expect(wrapper.get('[data-test="current-browser-scope"]').text()).toContain(
      'settings.currentBrowserScope'
    )
    expect(wrapper.find('[data-test="all-clients-scope"]').exists()).toBe(false)
    expect(loadClientConfig).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('mounts deployment Clients after the current browser scope when connected', async () => {
    Object.assign(configStore.metaConfig, connectedMetaConfig)
    vi.spyOn(configStore, 'loadClientConfig').mockResolvedValue()

    const wrapper = mount(Settings, { global: { stubs } })
    await flushPromises()

    const browserScope = wrapper.get('[data-test="current-browser-scope"]')
    const allClientsScope = wrapper.get('[data-test="all-clients-scope"]')
    const relativePosition = browserScope.element.compareDocumentPosition(allClientsScope.element)

    expect(relativePosition & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(clientListState.mounts).toBe(1)
    wrapper.unmount()
  })

  it('reloads the deployment Client list after saving browser configuration', async () => {
    Object.assign(configStore.metaConfig, connectedMetaConfig)
    vi.spyOn(configStore, 'loadClientConfig').mockResolvedValue()
    vi.spyOn(configStore, 'connectAndSave').mockImplementation(async (meta, client) => {
      Object.assign(configStore.metaConfig, meta)
      Object.assign(configStore.clientConfig, client)
    })

    const wrapper = mount(Settings, { global: { stubs } })
    await flushPromises()
    const save = wrapper.findAll('button').find((button) => button.text() === 'settings.saveConfig')

    await save?.trigger('click')
    await flushPromises()

    expect(configStore.connectAndSave).toHaveBeenCalledOnce()
    expect(clientListState.mounts).toBe(2)
    wrapper.unmount()
  })
})

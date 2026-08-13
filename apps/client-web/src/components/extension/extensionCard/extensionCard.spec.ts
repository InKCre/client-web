import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import extensionCard from './extensionCard.vue'

const SetupComponent = defineComponent({
  template: '<p data-test="twitter-setup">Twitter setup</p>',
})
const host = {
  getSetupContribution: vi.fn(() => ({ component: SetupComponent })),
  enable: vi.fn(),
  disable: vi.fn(),
  changeVersion: vi.fn(),
  updateConfig: vi.fn(),
  uninstall: vi.fn(),
}

vi.mock('@/core', () => ({ getExtensionHost: () => host }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

const extension = {
  name: 'inkcre/twitter',
  version: '0.2.0',
  enabled: ['00000000-0000-4000-8000-000000000001'],
  nickname: 'Twitter',
  config: {},
  config_schema: null,
}

const stubs = {
  InkButton: defineComponent({
    props: ['text'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ text }}</button>',
  }),
  InkSwitch: defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<button data-test="switch" @click="$emit(\'update:modelValue\', false)" />',
  }),
  InkDialog: defineComponent({ template: '<section><slot /></section>' }),
  InkInput: true,
  InkJsonEditor: true,
}

describe('ExtensionCard setup contribution', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mounts setup only for an enabled, running Web Extension contribution', async () => {
    const wrapper = mount(extensionCard, {
      props: { extension, enabled: true },
      global: { stubs },
    })

    const setup = wrapper.findAll('button').find((button) => button.text() === 'extension.setup')
    expect(setup).toBeDefined()
    await setup?.trigger('click')

    expect(host.getSetupContribution).toHaveBeenCalledWith('inkcre/twitter')
    expect(wrapper.get('[data-test="twitter-setup"]').text()).toBe('Twitter setup')
  })

  it('does not offer setup while this Web Peer is disabled', () => {
    const wrapper = mount(extensionCard, {
      props: { extension: { ...extension, enabled: [] }, enabled: false },
      global: { stubs },
    })

    expect(wrapper.text()).not.toContain('extension.setup')
    expect(host.getSetupContribution).not.toHaveBeenCalled()
  })

  it('unmounts contributed setup before disabling its Remote runtime', async () => {
    const wrapper = mount(extensionCard, {
      props: { extension, enabled: true },
      global: { stubs },
    })
    const setup = wrapper.findAll('button').find((button) => button.text() === 'extension.setup')
    await setup?.trigger('click')
    expect(wrapper.find('[data-test="twitter-setup"]').exists()).toBe(true)
    host.disable.mockImplementationOnce(async () => {
      expect(wrapper.find('[data-test="twitter-setup"]').exists()).toBe(false)
    })

    await wrapper.get('[data-test="switch"]').trigger('click')
    await flushPromises()

    expect(host.disable).toHaveBeenCalledWith('inkcre/twitter')
  })
})

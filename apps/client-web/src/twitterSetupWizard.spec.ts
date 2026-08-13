import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@inkcre/core'
import TwitterSetupWizard from '../../../extensions/twitter/src/components/twitterSetupWizard/twitterSetupWizard.vue'

const coreId = '00000000-0000-4000-8000-000000000002'
const installed = {
  name: 'inkcre/twitter',
  version: '0.2.0',
  enabled: [] as string[],
  nickname: 'Twitter',
  config: {},
  config_schema: null,
}
const status = {
  backend: 'official',
  callback_url: 'https://core.example/twitter/auth/callback',
  oauth_app_configured: false,
  client_id: null,
  connected: false,
  user_id: null,
  handle: null,
  scopes: [],
  reconnect_required: false,
  bookmark_source_id: null,
  bookmark_sources: [],
  bookmark_source_ready: false,
  ready: false,
}

const stubs = {
  InkButton: defineComponent({
    props: ['text'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ text }}</button>',
  }),
  InkInput: true,
  InkLoading: true,
}

describe('TwitterSetupWizard', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('requires explicit Core enablement before showing whole-Extension setup commands', async () => {
    const core = Client.parse({
      id: coreId,
      name: 'Core',
      rest_api_url: 'https://core.example/',
    })
    vi.spyOn(Client, 'list').mockResolvedValue([core])
    vi.spyOn(core, 'request').mockImplementation(async (options) => {
      if (options.path === '/extensions/inkcre/twitter' && options.method === 'GET') {
        return installed
      }
      if (options.path === '/extensions/inkcre/twitter/enable') {
        return { ...installed, enabled: [coreId] }
      }
      if (options.path === '/twitter/setup') return status
      throw new Error(`Unexpected setup request: ${options.method} ${options.path}`)
    })
    const wrapper = mount(TwitterSetupWizard, { global: { stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Enable Twitter on this Core Peer')
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Connect an X account')
    expect(wrapper.text()).toContain('https://core.example/twitter/auth/callback')
  })
})

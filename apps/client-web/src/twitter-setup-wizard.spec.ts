import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TwitterSetupWizard from '../../../extensions/twitter/src/components/twitterSetupWizard/twitterSetupWizard.vue'

const fixtures = vi.hoisted(() => {
  const peerId = '00000000-0000-4000-8000-000000000002'
  const extension = {
    name: 'inkcre/twitter',
    version: '0.2.0',
    enabled: [] as string[],
    nickname: 'Twitter',
    config: {},
    config_schema: null,
  }
  const candidate = {
    peer: { id: peerId, name: 'Core Preview' },
    extension,
    enabled: false,
    setupAvailable: false,
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
    bookmark_cron_id: null,
    bookmark_sources: [],
    collect_at: { day_of_week: null, hour: 0, minute: 0 },
    bookmark_source_ready: false,
    ready: false,
  }
  return {
    peerId,
    extension,
    candidate,
    status,
    discover: vi.fn(async () => [candidate]),
    enableCore: vi.fn(async () => ({ ...extension, enabled: [peerId] })),
    readStatus: vi.fn(async () => status),
  }
})

vi.mock('../../../extensions/twitter/src/setup-api', () => ({
  discoverCoreCandidates: fixtures.discover,
  TwitterSetupAPI: class {
    enableCore = fixtures.enableCore
    status = fixtures.readStatus
  },
}))

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
  beforeEach(() => {
    fixtures.candidate.enabled = false
    fixtures.candidate.extension = fixtures.extension
    vi.clearAllMocks()
  })

  it('requires explicit Core enablement before whole-Extension setup commands', async () => {
    const wrapper = mount(TwitterSetupWizard, { global: { stubs } })
    await flushPromises()

    const enable = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Enable Twitter on this Core Peer')
    expect(enable).toBeDefined()
    await enable?.trigger('click')
    await flushPromises()

    expect(fixtures.enableCore).toHaveBeenCalledOnce()
    expect(fixtures.readStatus).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Connect an X account')
    expect(wrapper.text()).toContain('https://core.example/twitter/auth/callback')
  })
})

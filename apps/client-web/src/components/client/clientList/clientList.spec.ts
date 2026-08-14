import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@inkcre/core'
import ClientList from './clientList.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

const stubs = {
  InkButton: defineComponent({
    props: ['text'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ text }}</button>',
  }),
  InkLoading: defineComponent({ template: '<span data-test="loading" />' }),
  ClientCard: defineComponent({
    props: ['client', 'status'],
    emits: ['updated'],
    template: '<article data-test="client-card">{{ client.name }}:{{ status }}</article>',
  }),
}

describe('ClientList', () => {
  afterEach(() => vi.restoreAllMocks())

  it('presents registered Clients as a deployment-wide scope', async () => {
    const client = Client.parse({
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Core',
      rest_api_url: 'https://core.example.test/',
    })
    vi.spyOn(Client, 'list').mockResolvedValue([client])

    const wrapper = mount(ClientList, { global: { stubs } })
    await flushPromises()

    expect(wrapper.get('h2').text()).toBe('settings.allClientsScope')
    expect(wrapper.text()).toContain('settings.allClientsNotice')
    expect(wrapper.get('[data-test="client-card"]').text()).toBe('Core:unknown')
  })

  it('shows a load failure instead of claiming that no Clients exist', async () => {
    vi.spyOn(Client, 'list').mockRejectedValue(new Error('Database connection refused'))

    const wrapper = mount(ClientList, { global: { stubs } })
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Database connection refused')
    expect(wrapper.text()).not.toContain('client.noClients')
  })
})

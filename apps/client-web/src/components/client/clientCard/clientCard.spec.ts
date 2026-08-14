import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@inkcre/core'
import ClientCard from './clientCard.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

const stubs = {
  InkInput: defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue ?? \'\'" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  }),
  InkButton: defineComponent({
    props: ['text', 'loading'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ text }}</button>',
  }),
  InkDialog: defineComponent({ template: '<div><slot /></div>' }),
  InkJsonEditor: true,
}

describe('ClientCard', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn())
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('explicitly updates an existing Client without an upsert lifecycle', async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null, status: 200 })
    const select = vi.fn(() => ({ single }))
    const eq = vi.fn(() => ({ select }))
    const update = vi.spyOn(Client.dbApi, 'update').mockReturnValue({ eq } as never)
    const client = Client.parse({
      id: '00000000-0000-4000-8000-000000000003',
      name: 'Old name',
      rest_api_url: 'https://old.example.test/',
    })
    const wrapper = mount(ClientCard, {
      props: { client, status: 'unknown' },
      global: { stubs },
    })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Renamed Client')
    await inputs[1].setValue('https://new.example.test/')
    const save = wrapper.findAll('button').find((button) => button.text() === 'settings.saveConfig')
    await save?.trigger('click')
    await flushPromises()

    expect(update).toHaveBeenCalledWith({
      name: 'Renamed Client',
      rest_api_url: 'https://new.example.test/',
    })
    expect(eq).toHaveBeenCalledWith('id', client.id)
    expect(single).toHaveBeenCalledOnce()
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })

  it('rejects an invalid management URL before writing the Client row', async () => {
    const update = vi.spyOn(Client.dbApi, 'update')
    const client = Client.parse({
      id: '00000000-0000-4000-8000-000000000003',
      name: 'Core',
      rest_api_url: 'https://core.example.test/',
    })
    const wrapper = mount(ClientCard, {
      props: { client, status: 'unknown' },
      global: { stubs },
    })

    await wrapper.findAll('input')[1].setValue('not a URL')
    const save = wrapper.findAll('button').find((button) => button.text() === 'settings.saveConfig')
    await save?.trigger('click')
    await flushPromises()

    expect(update).not.toHaveBeenCalled()
    expect(alert).toHaveBeenCalledOnce()
  })
})

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Block, OrganizationManager, PeerOutcomeUnknown } from '@inkcre/core'
import BlockDetailsPanel from './BlockDetailsPanel.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const block = Block.parse({
  id: 42,
  resolver: 'core.resolver.text.v1',
  storage: null,
  content: 'A focal block',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
})

function mountPanel() {
  return mount(BlockDetailsPanel, {
    props: { block },
    global: {
      stubs: {
        BlockContent: { template: '<div />' },
        InkField: { template: '<div><slot /></div>' },
        InkButton: {
          emits: ['click'],
          template: '<button type="button" @click="$emit(\'click\')">action</button>',
        },
      },
    },
  })
}

describe('BlockDetailsPanel rumination', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('delegates once and emits ruminated only after successful completion', async () => {
    const ruminate = vi.spyOn(OrganizationManager, 'ruminate').mockResolvedValue()
    const wrapper = mountPanel()

    await wrapper.findAll('button')[1].trigger('click')
    await flushPromises()

    expect(ruminate).toHaveBeenCalledOnce()
    expect(ruminate).toHaveBeenCalledWith(42)
    expect(wrapper.emitted('ruminated')).toHaveLength(1)
    expect(wrapper.text()).toContain('infoBase.blockDetails.rumination.success')
  })

  it('surfaces outcome-unknown without retrying or claiming success', async () => {
    const ruminate = vi
      .spyOn(OrganizationManager, 'ruminate')
      .mockRejectedValue(new PeerOutcomeUnknown('dispatch outcome unknown'))
    const wrapper = mountPanel()

    await wrapper.findAll('button')[1].trigger('click')
    await flushPromises()

    expect(ruminate).toHaveBeenCalledOnce()
    expect(wrapper.emitted('ruminated')).toBeUndefined()
    expect(wrapper.text()).toContain('infoBase.blockDetails.rumination.outcome-unknown')
  })
})

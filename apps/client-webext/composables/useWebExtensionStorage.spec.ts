import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWebExtensionStorage } from './useWebExtensionStorage'

const storageMocks = vi.hoisted(() => ({
  getItem: vi.fn(),
  removeItem: vi.fn(),
  setItem: vi.fn(),
  watch: vi.fn(() => vi.fn()),
}))

vi.mock('@wxt-dev/storage', () => ({
  storage: storageMocks,
}))

describe('useWebExtensionStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageMocks.getItem.mockResolvedValue(null)
  })

  it('persists nested ref changes to extension-local storage', async () => {
    const { data, dataReady } = useWebExtensionStorage('aiConfig', {
      providers: [] as { id: string; apiKey: string }[],
    })

    await dataReady
    storageMocks.setItem.mockClear()

    data.value.providers.push({
      id: 'local-provider',
      apiKey: 'browser-local-key',
    })
    await nextTick()

    expect(storageMocks.setItem).toHaveBeenCalledWith(
      'local:aiConfig',
      JSON.stringify({
        providers: [
          {
            id: 'local-provider',
            apiKey: 'browser-local-key',
          },
        ],
      })
    )
  })
})

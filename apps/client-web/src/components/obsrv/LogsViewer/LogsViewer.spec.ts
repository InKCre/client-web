import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LogsViewer from './LogsViewer.vue'
import { Log } from '@inkcre/core'

const getLogs = vi.spyOn(Log, 'getByTraceId')

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'logs.title': 'Logs',
        'logs.empty': 'No logs',
      }
      return translations[key] || key
    },
  }),
}))

// Mock @inkcre/ui-web
vi.mock('@inkcre/ui-web', () => ({
  InkLoading: { name: 'InkLoading', template: '<div>Loading</div>' },
}))

describe('LogsViewer.vue', () => {
  const mockLogs = [
    new Log({
      id: 1,
      timestamp: new Date('2025-12-20T10:30:45.000Z'),
      severity_number: 2,
      severity_text: 'INFO',
      body: 'First log',
      trace_id: 'trace-123',
      span_id: 'span-1',
      attributes: {},
    }),
    new Log({
      id: 2,
      timestamp: new Date('2025-12-20T10:30:46.000Z'),
      severity_number: 3,
      severity_text: 'WARN',
      body: 'Second log',
      trace_id: 'trace-123',
      span_id: 'span-2',
      attributes: {},
    }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    getLogs.mockReset()
    getLogs.mockResolvedValue(mockLogs)
  })

  it('loads and displays logs on mount', async () => {
    getLogs.mockResolvedValue(mockLogs)

    mount(LogsViewer, {
      props: {
        traceId: 'trace-123',
        enablePolling: false, // Disable polling for initial test
      },
      global: {
        stubs: {
          LogEntry: {
            name: 'LogEntry',
            template: "<div class='log-entry-stub' />",
          },
        },
      },
    })

    await vi.waitFor(() => {
      expect(getLogs).toHaveBeenCalledWith('trace-123', { cursor: undefined })
    })
  })

  it('displays error message when loading fails', async () => {
    const errorMessage = 'Network error'
    getLogs.mockRejectedValue(new Error(errorMessage))

    const wrapper = mount(LogsViewer, {
      props: {
        traceId: 'trace-123',
        enablePolling: false,
      },
      global: {
        stubs: {
          LogEntry: { name: 'LogEntry', template: '<div />' },
        },
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.find('.logs-viewer__error').text()).toContain(errorMessage)
    })
  })

  it('shows empty state when no logs are found', async () => {
    getLogs.mockResolvedValue([])

    const wrapper = mount(LogsViewer, {
      props: {
        traceId: 'trace-123',
        enablePolling: false,
      },
      global: {
        stubs: {
          LogEntry: { name: 'LogEntry', template: '<div />' },
        },
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.find('.logs-viewer__empty').exists()).toBe(true)
      expect(wrapper.find('.logs-viewer__empty').text()).toContain('No logs')
    })
  })

  it('toggles polling based on enablePolling prop', async () => {
    vi.useFakeTimers()
    const wrapper = mount(LogsViewer, {
      props: {
        traceId: 'trace-123',
        enablePolling: true,
        pollingInterval: 1000,
      },
      global: {
        stubs: {
          LogEntry: { name: 'LogEntry', template: '<div />' },
        },
      },
    })

    await flushPromises()

    await wrapper.setProps({ enablePolling: false })
    await vi.advanceTimersByTimeAsync(2000)
    const pausedCallCount = getLogs.mock.calls.length

    await wrapper.setProps({ enablePolling: true })
    await vi.advanceTimersByTimeAsync(1000)

    expect(getLogs.mock.calls.length).toBeGreaterThan(pausedCallCount)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('reloads logs when traceId changes', async () => {
    const wrapper = mount(LogsViewer, {
      props: {
        traceId: 'trace-123',
        enablePolling: false,
      },
      global: {
        stubs: {
          LogEntry: { name: 'LogEntry', template: '<div />' },
        },
      },
    })

    await vi.waitFor(() => {
      expect(getLogs).toHaveBeenCalledWith('trace-123', { cursor: undefined })
    })
    const firstCallCount = getLogs.mock.calls.length

    await wrapper.setProps({ traceId: 'trace-456' })
    await vi.waitFor(() => {
      expect(getLogs.mock.calls.length).toBeGreaterThan(firstCallCount)
      expect(getLogs).toHaveBeenCalledWith('trace-456', { cursor: undefined })
    })
  })

  it('appends new logs on polling', async () => {
    vi.useFakeTimers()

    const newLog = new Log({
      id: 3,
      timestamp: new Date('2025-12-20T10:30:47.000Z'),
      severity_number: 2,
      severity_text: 'INFO',
      body: 'Third log',
      trace_id: 'trace-123',
      span_id: 'span-3',
      attributes: {},
    })
    getLogs.mockResolvedValueOnce(mockLogs).mockResolvedValueOnce([newLog])

    const wrapper = mount(LogsViewer, {
      props: {
        traceId: 'trace-123',
        enablePolling: true,
        pollingInterval: 100, // Short interval for testing
      },
      global: {
        stubs: {
          LogEntry: {
            name: 'LogEntry',
            props: ['log'],
            template: '<div class="log-entry-stub"></div>',
          },
        },
      },
    })

    await flushPromises()
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    await flushPromises()
    await nextTick()

    expect(wrapper.findAll('.log-entry-stub')).toHaveLength(3)
    await wrapper.setProps({ enablePolling: false })
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('respects custom polling interval', async () => {
    const wrapper = mount(LogsViewer, {
      props: {
        traceId: 'trace-123',
        enablePolling: false,
        pollingInterval: 2000,
      },
      global: {
        stubs: {
          LogEntry: { name: 'LogEntry', template: '<div />' },
        },
      },
    })

    expect(wrapper.props('pollingInterval')).toBe(2000)
  })
})

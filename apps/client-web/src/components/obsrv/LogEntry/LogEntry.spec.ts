import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LogEntry from './LogEntry.vue'
import { Log } from '@inkcre/core'

const getLog = vi.spyOn(Log, 'get')

describe('LogEntry.vue', () => {
  const mockLog = new Log({
    id: 1,
    timestamp: new Date('2025-12-20T10:30:45.123Z'),
    severity_number: 2,
    severity_text: 'INFO',
    body: 'Test log message',
    trace_id: 'trace-123',
    span_id: 'span-456',
    attributes: {},
  })

  beforeEach(() => {
    getLog.mockReset()
  })

  it('renders log entry with log object prop', () => {
    const wrapper = mount(LogEntry, {
      props: {
        log: mockLog,
      },
    })

    expect(wrapper.find('.log-time').text()).toContain('10:30:45')
    expect(wrapper.find('.log-severity').text()).toBe('INFO')
    expect(wrapper.find('.log-body').text()).toBe('Test log message')
  })

  it('fetches and renders log entry with logId prop', async () => {
    getLog.mockResolvedValue(mockLog)

    const wrapper = mount(LogEntry, {
      props: {
        logId: 1,
      },
    })

    await wrapper.vm.$nextTick()
    // Wait for async resolution
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(getLog).toHaveBeenCalledWith(1)
  })

  it('formats timestamp correctly', () => {
    const wrapper = mount(LogEntry, {
      props: {
        log: mockLog,
      },
    })

    const timeText = wrapper.find('.log-time').text()
    // Should be in format HH:MM:SS.mmm
    expect(timeText).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/)
  })

  it('does not render when neither log nor logId is provided', () => {
    const wrapper = mount(LogEntry, {
      props: {} as any,
    })

    expect(wrapper.find('.log-entry').exists()).toBe(false)
  })

  it('renders with different severity levels', () => {
    const logWithWarning = new Log({
      id: mockLog.id,
      timestamp: mockLog.timestamp,
      severity_text: 'WARN',
      severity_number: 3,
      body: mockLog.body,
      trace_id: mockLog.trace_id,
      span_id: mockLog.span_id,
      attributes: mockLog.attributes,
    })

    const wrapper = mount(LogEntry, {
      props: {
        log: logWithWarning,
      },
    })

    expect(wrapper.find('.log-severity').text()).toBe('WARN')
  })
})

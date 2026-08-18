import { beforeEach, describe, expect, it, vi } from 'vitest'

const transport = vi.hoisted(() => {
  const row = {
    name: 'inkcre/twitter',
    version: '0.1.1',
    enabled: [],
    nickname: 'Twitter',
    config: { preserved: true },
    config_schema: null,
  }
  const query = {
    eq: vi.fn(),
    filter: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  }
  query.eq.mockReturnValue(query)
  query.filter.mockReturnValue(query)
  query.order.mockResolvedValue({ data: [row], error: null })
  query.select.mockReturnValue(query)
  query.maybeSingle.mockResolvedValue({ data: row, error: null })
  query.single.mockResolvedValue({ data: row, error: null })
  const client = {
    from: vi.fn(() => query),
    insert: vi.fn((_values: Record<string, unknown>) => query),
    rpc: vi.fn(),
    update: vi.fn((_values: Record<string, unknown>) => query),
  }
  const rpcQuery = {
    select: vi.fn(),
  }
  return { client, query, row, rpcQuery }
})

vi.mock('../base', () => ({
  APIError: class APIError extends Error {},
  DBAPIClient: class DBAPIClient {
    constructor() {
      return transport.client
    }
  },
}))

import { PostgrestExtensionStatePort } from './postgrest-state'

describe('PostgrestExtensionStatePort', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    transport.query.eq.mockReturnValue(transport.query)
    transport.query.filter.mockReturnValue(transport.query)
    transport.query.order.mockResolvedValue({ data: [transport.row], error: null })
    transport.query.select.mockReturnValue(transport.query)
    transport.query.maybeSingle.mockResolvedValue({ data: transport.row, error: null })
    transport.query.single.mockResolvedValue({ data: transport.row, error: null })
    transport.client.from.mockReturnValue(transport.query)
    transport.client.insert.mockReturnValue(transport.query)
    transport.rpcQuery.select.mockResolvedValue({ data: [transport.row], error: null })
    transport.client.rpc.mockReturnValue(transport.rpcQuery)
    transport.client.update.mockReturnValue(transport.query)
  })

  it('projects only generic management fields and never fetches Extension state', async () => {
    const state = new PostgrestExtensionStatePort()

    await expect(state.list()).resolves.toEqual([transport.row])
    await expect(state.get('inkcre/twitter')).resolves.toEqual(transport.row)

    expect(transport.query.select).toHaveBeenCalledTimes(2)
    expect(transport.query.select).toHaveBeenNthCalledWith(
      1,
      'name,version,enabled,nickname,config,config_schema'
    )
    expect(transport.query.select).toHaveBeenNthCalledWith(
      2,
      'name,version,enabled,nickname,config,config_schema'
    )
  })

  it('lets the database default enabled to an empty array during install', async () => {
    const state = new PostgrestExtensionStatePort()
    vi.spyOn(state, 'get').mockResolvedValue(null)

    await expect(state.install(transport.row)).resolves.toEqual(transport.row)

    expect(transport.client.insert).toHaveBeenCalledWith({
      name: 'inkcre/twitter',
      version: '0.1.1',
      nickname: 'Twitter',
      config: { preserved: true },
      config_schema: null,
    })
    expect(transport.client.insert.mock.calls[0]?.[0]).not.toHaveProperty('enabled')
  })

  it('writes config without including enabled state', async () => {
    const state = new PostgrestExtensionStatePort()

    await expect(state.updateConfig('inkcre/twitter', { next: true })).resolves.toEqual(
      transport.row
    )

    expect(transport.client.update).toHaveBeenCalledWith({ config: { next: true } })
    expect(transport.client.update.mock.calls[0]?.[0]).not.toHaveProperty('enabled')
  })

  it('changes version only through an atomic empty-enabled conditional update', async () => {
    const state = new PostgrestExtensionStatePort()

    await expect(state.changeVersion('inkcre/twitter', '0.1.1', 'Twitter')).resolves.toEqual(
      transport.row
    )

    expect(transport.client.update).toHaveBeenCalledWith({
      version: '0.1.1',
      nickname: 'Twitter',
      config_schema: null,
    })
    expect(transport.query.eq).toHaveBeenCalledWith('name', 'inkcre/twitter')
    expect(transport.query.filter).toHaveBeenCalledWith('enabled', 'eq', '{}')
    expect(transport.client.update.mock.calls[0]?.[0]).not.toHaveProperty('enabled')
  })

  it('enables and disables Peers only through the atomic RPC', async () => {
    const state = new PostgrestExtensionStatePort()

    await state.setPeerEnabled('inkcre/twitter', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true)
    await state.setPeerEnabled('inkcre/twitter', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', false)

    expect(transport.client.rpc).toHaveBeenNthCalledWith(1, 'set_extension_peer_enabled', {
      p_name: 'inkcre/twitter',
      p_peer_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      p_enabled: true,
    })
    expect(transport.client.rpc).toHaveBeenNthCalledWith(2, 'set_extension_peer_enabled', {
      p_name: 'inkcre/twitter',
      p_peer_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      p_enabled: false,
    })
    expect(transport.rpcQuery.select).toHaveBeenNthCalledWith(
      1,
      'name,version,enabled,nickname,config,config_schema'
    )
    expect(transport.rpcQuery.select).toHaveBeenNthCalledWith(
      2,
      'name,version,enabled,nickname,config,config_schema'
    )
    expect(transport.client.insert).not.toHaveBeenCalled()
    expect(transport.client.update).not.toHaveBeenCalled()
  })
})

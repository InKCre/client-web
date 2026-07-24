import { describe, it, expect } from 'vitest'
import { useEither } from './use-either'

describe('useEither composable', () => {
  it('returns object directly when object is provided', async () => {
    const testObject = { id: 1, name: 'test' }
    const fetcher = async (id: number) => ({
      id,
      name: 'fetched',
    })

    const result = useEither(undefined, testObject, fetcher)

    // computedAsync returns the value synchronously if already provided
    expect(result.value).toEqual(testObject)
  })

  it('fetches object when only id is provided', async () => {
    const expectedObject = { id: 1, name: 'fetched' }
    const fetcher = async (_id: number) => expectedObject

    const result = useEither(1, undefined, fetcher)

    // Wait for async computation
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(result.value).toEqual(expectedObject)
  })

  it('returns undefined when neither id nor object is provided', async () => {
    const fetcher = async (id: number) => ({ id, name: 'test' })

    const result = useEither(undefined, undefined, fetcher)

    expect(result.value).toBeUndefined()
  })

  it('calls fetcher with correct id', async () => {
    let fetchedId: number | undefined
    const fetcher = async (id: number) => {
      fetchedId = id
      return { id, name: 'fetched' }
    }

    useEither(42, undefined, fetcher)

    // Wait for async computation
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(fetchedId).toBe(42)
  })

  it('prefers object over id when both are provided', async () => {
    const testObject = { id: 1, name: 'object' }
    const fetcher = async (id: number) => ({
      id,
      name: 'fetched',
    })

    const result = useEither(999, testObject, fetcher)

    expect(result.value).toEqual(testObject)
  })

  it('handles different types', async () => {
    interface User {
      id: number
      username: string
      email: string
    }

    const user: User = {
      id: 1,
      username: 'john',
      email: 'john@example.com',
    }

    const fetcher = async (_id: number): Promise<User> => user

    const result = useEither<User>(1, undefined, fetcher)

    // Wait for async computation
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(result.value).toEqual(user)
  })

  it('handles async fetcher errors gracefully', async () => {
    const fetcher = async (_id: number) => {
      throw new Error('Fetch failed')
    }

    const result = useEither(1, undefined, fetcher)

    // Wait for async computation
    await new Promise((resolve) => setTimeout(resolve, 50))

    // The composable should handle the error and return undefined
    // (computedAsync behavior with no onError handler)
    expect(result.value).toBeUndefined()
  })
})

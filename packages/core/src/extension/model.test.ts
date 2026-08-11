import { describe, expect, it } from 'vitest'
import { ExtensionNameSchema, ExtensionVersionSchema } from './model'

describe('native Extension coordinates', () => {
  it('uses the Registry canonical lowercase ASCII segment grammar', () => {
    const segment64 = `a${'-'.repeat(62)}z`

    expect(ExtensionNameSchema.parse('inkcre/twitter')).toBe('inkcre/twitter')
    expect(ExtensionNameSchema.parse(`${segment64}/${segment64}`)).toBe(`${segment64}/${segment64}`)
    for (const invalid of [
      'inkcre',
      'inkcre/twitter/extra',
      'InKCre/twitter',
      'inkcre/twitter_name',
      'inkcre/-twitter',
      'inkcre/twitter-',
      `${segment64}a/twitter`,
    ]) {
      expect(ExtensionNameSchema.safeParse(invalid).success, invalid).toBe(false)
    }
  })

  it('uses canonical strict SemVer without build metadata', () => {
    expect(ExtensionVersionSchema.parse('1.2.3-rc.1')).toBe('1.2.3-rc.1')
    for (const invalid of ['v1.2.3', '1.2', '1.2.3+build.1', '1.02.3']) {
      expect(ExtensionVersionSchema.safeParse(invalid).success, invalid).toBe(false)
    }
  })
})

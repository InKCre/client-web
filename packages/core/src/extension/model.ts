import { parse as parseSemVer } from 'semver'
import { z } from 'zod'

const EXTENSION_NAME_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\/[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/

export const ExtensionNameSchema = z
  .string()
  .refine((value) => EXTENSION_NAME_PATTERN.test(value), {
    error: 'Extension name must be one canonical lowercase ASCII namespace/name pair.',
  })

export const ExtensionVersionSchema = z.string().refine(
  (value) => {
    const parsed = parseSemVer(value)
    return parsed !== null && parsed.version === value && parsed.build.length === 0
  },
  { error: 'Extension version must be strict SemVer without build metadata.' }
)

/** One deployment-wide installed Extension row. */
export const InstalledExtensionSchema = z.object({
  name: ExtensionNameSchema,
  version: ExtensionVersionSchema,
  enabled: z.array(z.uuid()).default([]),
  nickname: z.string().nullable(),
  config: z.record(z.string(), z.unknown()).default({}),
  config_schema: z.record(z.string(), z.unknown()).nullable(),
})

export const InstallExtensionInputSchema = InstalledExtensionSchema.pick({
  name: true,
  version: true,
})

export type InstalledExtension = z.infer<typeof InstalledExtensionSchema>
export type InstallExtensionInput = z.infer<typeof InstallExtensionInputSchema>

/** Default export exposed by a Web Extension's native Module Federation Remote. */
export interface ExtensionModule {
  initialize?(): Promise<void>
  activate?(): Promise<void>
  deactivate?(): Promise<void>
  dispose?(): Promise<void>
}

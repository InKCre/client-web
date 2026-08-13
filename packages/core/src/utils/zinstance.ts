import { z } from 'zod'

/**
 * Create a zod transformer that accepts either a plain object or an instance.
 * If the value is already an instance of the class, it's returned as-is.
 * Otherwise, the value is parsed through the class.
 *
 * @param cls - A class with a Zod-compatible safeParse method
 * @returns A zod transformer
 */
export function zinstance<T>(cls: {
  safeParse: (
    value: unknown
  ) =>
    | { success: true; data: T }
    | { success: false; error: { issues: Parameters<z.RefinementCtx['addIssue']>[0][] } }
}) {
  return z.unknown().transform((value, context): T | typeof z.NEVER => {
    const parsed = cls.safeParse(value)
    if (parsed.success) return parsed.data
    for (const issue of parsed.error.issues) context.addIssue(issue)
    return z.NEVER
  })
}

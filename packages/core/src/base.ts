import z from "zod";

/**
 * Create a zod transformer that accepts either a plain object or an instance.
 * If the value is already an instance of the class, it's returned as-is.
 * Otherwise, the value is parsed through the class.
 *
 * @param cls - A class with parse method and Symbol.hasInstance
 * @returns A zod transformer
 */
export function zinstance<T = any>(cls: {
  parse: (arg: any) => T;
  [Symbol.hasInstance](instance: T): boolean;
}) {
  return z.transform<any, T>((val) => {
    if (val instanceof cls) {
      return val;
    } else {
      return cls.parse(val);
    }
  });
}

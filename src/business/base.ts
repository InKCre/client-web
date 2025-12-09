import z from "zod";

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

import { computed, isRef, type Ref, unref } from "vue";

export function anyMeets<T = any>(
  args: T[],
  predicate: (arg: T) => boolean
): boolean {
  return args.some(predicate);
}

export const anyTrue = (...args: (Ref<any> | any | (() => any))[]) => {
  return computed(() =>
    anyMeets(args, (arg) =>
      Boolean(typeof arg === "function" ? arg() : unref(arg))
    )
  );
};

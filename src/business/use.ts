import { ref } from "vue";
import { z } from "zod";
import { Z } from "zod-class";

export function usePromise<T = any, IT = any>(
  promise: () => Promise<T>,
  initalValue?: IT
) {
  const result = ref<T>(initalValue as T);
  const state = State.parse({});

  promise()
    .then((res) => {
      result.value = res;
    })
    .catch((err) => {
      state.errors.push(err);
    })
    .finally(() => {
      state.loading = false;
    });
  state.loading = true;

  return {
    state,
    result,
  };
}

export class State extends Z.class({
  loading: z.boolean().default(false),
  errors: z.array(z.instanceof(Error)).default(() => []),
}) {
  hasError() {
    return this.errors.length > 0;
  }
}

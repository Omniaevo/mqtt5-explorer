import { onScopeDispose, ref, watch } from "vue";

/**
 * Copy of `source` that updates only after it stops changing for `delayMs`.
 * An empty value (clear) is applied at once.
 * @param {import("vue").Ref} source
 * @param {number} delayMs
 * @returns {import("vue").Ref}
 */
export function useDebouncedRef(source, delayMs) {
  const debounced = ref(source.value);
  let timer;

  watch(source, (value) => {
    clearTimeout(timer);

    if (!value) {
      debounced.value = value;
      return;
    }

    timer = setTimeout(() => (debounced.value = value), delayMs);
  });

  onScopeDispose(() => clearTimeout(timer));

  return debounced;
}

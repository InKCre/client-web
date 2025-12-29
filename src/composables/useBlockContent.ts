/**
 * useBlockContent Composable
 *
 * Provides reactive access to block content through the storage + resolver pipeline.
 * Handles content retrieval, caching, and resolver lookup.
 */

import { ref, computed, watch, type Ref, type ComputedRef } from "vue";
import type { Block } from "@/business/info-base/block";
import { resolverManager, type AnyResolver } from "@/business/info-base/resolver";

export interface UseBlockContentOptions {
  /** The block to get content for */
  block: Ref<Block> | ComputedRef<Block>;
  /** Whether to auto-fetch content on mount/change (default: true) */
  autoFetch?: boolean;
  /** Callback when loading state changes */
  onLoadingChange?: (isLoading: boolean) => void;
}

export interface UseBlockContentReturn {
  /** Raw content after storage retrieval */
  rawContent: Ref<unknown>;
  /** The resolver for this block */
  resolver: ComputedRef<AnyResolver>;
  /** Loading state */
  isLoading: Ref<boolean>;
  /** Error state */
  error: Ref<Error | null>;
  /** Preview string */
  preview: ComputedRef<string>;
  /** Manually trigger content retrieval */
  fetchContent: () => Promise<void>;
}

/**
 * Composable for accessing block content through the storage + resolver pipeline.
 *
 * @example
 * ```typescript
 * const block = ref(myBlock);
 * const { rawContent, resolver, isLoading, preview } = useBlockContent({ block });
 *
 * // Use in template:
 * // <component :is="resolver.inGraph" :block="block" :rawContent="rawContent" />
 * ```
 */
export function useBlockContent(
  options: UseBlockContentOptions
): UseBlockContentReturn {
  const { block, autoFetch = true, onLoadingChange } = options;

  const rawContent = ref<unknown>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // Notify parent of loading state changes
  if (onLoadingChange) {
    watch(isLoading, (val) => onLoadingChange(val), { immediate: true });
  }

  const resolver = computed(() => {
    return resolverManager.get(block.value.resolver);
  });

  const fetchContent = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const content = await resolver.value.getRawContent(block.value);
      rawContent.value = content;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      // Fallback to raw block.content
      rawContent.value = block.value.content;
    } finally {
      isLoading.value = false;
    }
  };

  const preview = computed(() => {
    if (rawContent.value === null) {
      // Use raw content for preview if not yet processed
      return resolver.value.preview(block.value.content);
    }
    return resolver.value.preview(rawContent.value);
  });

  // Auto-fetch on mount and block change
  if (autoFetch) {
    watch(
      () => [block.value.id, block.value.content, block.value.storage],
      () => fetchContent(),
      { immediate: true }
    );
  }

  return {
    rawContent,
    resolver,
    isLoading,
    error,
    preview,
    fetchContent,
  };
}

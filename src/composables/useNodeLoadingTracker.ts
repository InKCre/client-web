/**
 * useNodeLoadingTracker Composable
 *
 * Tracks loading state across all graph nodes using Vue's provide/inject pattern.
 * Used to trigger re-layout after all node content has finished loading.
 */

import {
  ref,
  computed,
  provide,
  inject,
  type InjectionKey,
  type ComputedRef,
} from "vue";

/**
 * Interface for node loading state tracker (used by child components)
 */
export interface NodeLoadingTracker {
  /** Set loading state for a specific node */
  setLoading(nodeId: string, isLoading: boolean): void;
  /** Remove a node from tracking (called on unmount) */
  untrack(nodeId: string): void;
}

/**
 * Interface for provider return (used by parent graph component)
 */
export interface NodeLoadingTrackerProvider {
  /** Whether all tracked nodes have finished loading */
  isAllLoaded: ComputedRef<boolean>;
  /** Reset all tracking state */
  reset(): void;
}

/** Injection key for type-safe provide/inject */
export const NODE_LOADING_TRACKER_KEY: InjectionKey<NodeLoadingTracker> =
  Symbol("nodeLoadingTracker");

/**
 * Creates and provides a loading tracker for child components.
 * Call this in the parent graph component (graph.vue).
 *
 * @returns Provider interface with isAllLoaded computed and reset function
 */
export function provideNodeLoadingTracker(): NodeLoadingTrackerProvider {
  const loadingStates = ref(new Map<string, boolean>());

  const tracker: NodeLoadingTracker = {
    setLoading(nodeId: string, isLoading: boolean) {
      loadingStates.value.set(nodeId, isLoading);
      // Create new Map to trigger Vue reactivity
      loadingStates.value = new Map(loadingStates.value);
    },
    untrack(nodeId: string) {
      loadingStates.value.delete(nodeId);
      loadingStates.value = new Map(loadingStates.value);
    },
  };

  provide(NODE_LOADING_TRACKER_KEY, tracker);

  const isAllLoaded = computed(() => {
    // No nodes tracked yet - not considered "all loaded"
    if (loadingStates.value.size === 0) return false;
    // All loaded when every tracked node has isLoading = false
    return Array.from(loadingStates.value.values()).every((v) => !v);
  });

  const reset = () => {
    loadingStates.value = new Map();
  };

  return {
    isAllLoaded,
    reset,
  };
}

/**
 * Injects the loading tracker from parent component.
 * Call this in child node components (BlockNode.vue).
 *
 * @returns The tracker interface, or null if not provided
 */
export function useNodeLoadingReporter(): NodeLoadingTracker | null {
  return inject(NODE_LOADING_TRACKER_KEY, null);
}

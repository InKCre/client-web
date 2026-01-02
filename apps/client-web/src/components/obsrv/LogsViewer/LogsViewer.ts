import type { PropType } from "vue";

// --- Types ---

// --- Props ---
export const logsViewerProps = {
  /** The trace ID to filter logs by */
  traceId: {
    type: String,
    required: true,
  },
  /** Polling interval in milliseconds, default 5000 */
  pollingInterval: {
    type: Number as PropType<number>,
    default: 5000,
  },
  /** Whether to enable polling, default true */
  enablePolling: {
    type: Boolean,
    default: true,
  },
};

// --- Emits ---
export const logsViewerEmits = {} as const;

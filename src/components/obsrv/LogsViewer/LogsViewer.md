# LogsViewer

## Rationale

Provide a centralized, reusable component for viewing logs filtered by trace ID with dynamic polling, error handling, and automatic scrolling to the latest log entries.

## Goals

Display logs for a specific trace ID with support for dynamic polling intervals, toggle-able polling, basic error display, and automatic scrolling to the bottom using CSS flexbox layout.

## Key Concepts

- Log: Observability log entry from the database
- Trace ID: Unique identifier for distributed traces
- Polling: Incremental fetching of new logs at configurable intervals

## Specification

The component displays logs filtered by trace ID in a scrollable container. It supports:

1. **Filtering**: Accepts a trace ID prop to filter logs
2. **Polling**: Periodically fetches new logs using `useIntervalFn` from VueUse
3. **Toggle Control**: `enablePolling` prop controls pause/resume of polling
4. **Auto-Scroll**: Uses flex layout with `margin-top: auto` on last log entry for automatic scrolling to bottom
5. **Loading State**: Shows loading indicator while polling is active (`isActive` from useIntervalFn)
6. **Error Display**: Inline error message display if fetching fails
7. **Empty State**: Shows "No logs" message when no logs are found

## Implementation

### Props

- `traceId` (`string`, required): The trace ID to filter logs by
- `pollingInterval` (`number`, 5000ms, optional): Polling interval in milliseconds
- `enablePolling` (`boolean`, true, optional): Toggle to start/stop polling

### Key Features

- Initial load of all logs for the given trace ID on mount
- Incremental polling appends new logs without pagination
- Polling pauses/resumes based on `enablePolling` prop
- Loading state indicator appears only when polling is active
- Error state shows inline error message instead of logs
- Auto-scroll to bottom via CSS (no JavaScript scroll management)
- Reuses existing log styles from sourceCollectJob.scss
- Integrates LogEntry component for individual log rendering
- Watches traceId changes and reloads logs accordingly

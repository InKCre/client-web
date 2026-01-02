# Obsrv Components

This directory contains components for the observability (obsrv) domain, providing UI for viewing and filtering logs.

## Components

### LogEntry

- **Purpose**: Display individual log entries with timestamp, severity, and body
- **Props**: Accepts either `log` object or `logId` for flexibility
- **Features**: Formats timestamp, displays severity level and message body

### LogsViewer

- **Purpose**: Container component for viewing logs filtered by trace ID
- **Props**:
  - `traceId` (required): Filter logs by trace ID
  - `pollingInterval` (optional, default 5000ms): Dynamic polling interval
  - `enablePolling` (optional, default true): Toggle polling on/off
- **Features**:
  - Initial load of all logs for a trace
  - Incremental polling for new logs
  - Auto-scroll to bottom via CSS flexbox
  - Inline error display
  - Loading indicator when polling active
  - Empty state handling

## Composables Used

- `useEither`: Accepts either an id or the actual object, fetching asynchronously if needed

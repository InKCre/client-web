# LogEntry

## Rationale

Display individual log entries with timestamp, severity, and message body. Part of the observability logging system to visualize trace logs.

## Goals

Render a single log entry in a reusable component that accepts either a log object or a log ID, maintaining consistency with the codebase pattern.

## Key Concepts

- Log: Observability log entry from the database
- Trace: Distributed tracing context

## Specification

The component displays a single log entry with formatted timestamp, severity level, and body text. Clicking on the log entry expands a panel showing additional details including trace ID, span ID, severity number, and attributes. It accepts props that can be either the complete log object or the log ID, fetching the object asynchronously if only the ID is provided.

## Implementation

### Props

- `log` (`Log`, optional): The log object to display. If not provided, `logId` must be provided.
- `logId` (`number`, optional): The ID of the log to fetch. If not provided, `log` must be provided.

### Key Features

- Accepts both log object or logId (uses `useEither` composable)
- Formats timestamp to HH:MM:SS.mmm format
- Displays severity_text and body in a flex layout
- Expandable details panel showing trace_id, span_id, severity_number, and attributes
- Click handler to toggle expansion state
- Visual indicator (chevron icon) for expand/collapse state

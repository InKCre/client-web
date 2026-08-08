# clientCard

## Rationale

Display and edit a single client in the client list.

## Goals

Allow users to view client details and edit client name and URL.

## Key Concepts

Client management, health status.

## Specification

Shows client name, ID, URL, and status. Has edit mode with inputs for name and URL, save/cancel buttons.

## Implementation

Uses reactive editing state, emits updated on save.

### Props

- `client` (`Client`, required): The client object
- `status` (`"online" | "offline" | "unknown"`, required): Health status

### Events

- `updated()`: Emitted after successful save

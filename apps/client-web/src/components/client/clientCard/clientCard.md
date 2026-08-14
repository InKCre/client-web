# clientCard

## Rationale

Display and edit a registered Client in the deployment Client list.

## Goals

Allow users to view Client details and explicitly save its name, management URL, or configuration.

## Key Concepts

Client management, health status.

## Specification

Shows Client name, ID, management URL, and health status. Name and URL changes use an explicit save action. Configuration changes use a JSON dialog.

## Implementation

Updates only an existing Client and emits `updated` after a successful save.

### Props

- `client` (`Client`, required): The client object
- `status` (`"online" | "offline" | "unknown"`, required): Health status

### Events

- `updated()`: Emitted after successful save

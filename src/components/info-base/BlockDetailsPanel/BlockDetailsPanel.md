# BlockDetailsPanel

## Rationale

Provides a detailed view of a specific block's metadata and rendered content.

## Goals

- Display block metadata (ID, Resolver, Timestamps, Storage).
- Render block content using the appropriate resolver.
- Provide a way to close the panel.

## Key Concepts

- **Block**: The core data unit in the info-base.
- **Resolver**: Logic used to render the block's raw content into HTML.

## Specification

- Displays a header with a title and a close button.
- Lists metadata fields using `InkField`.
- Shows a loading state while the content is being resolved.
- Displays the rendered HTML content or a "No content" message.

## Implementation

### Props

- `block` (`Block`, [required]): The block to display details for.

### Events

- `close()`: Emitted when the close button is clicked.

### Watchers

- `props.block`: Triggers `resolveContent()` to update the rendered content when the block changes.

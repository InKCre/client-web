# sourceCollectJobCard

## Rationale

Provides a card component to display source collect job information in a list.

## Goals

Display collect job details in a consistent, clickable card format.

## Specification

- Shows job ID, status (color-coded), and creation date
- Clickable card that navigates to job detail
- Compact layout for list display

## Implementation

### Props

- `job` (`SourceCollectJob`, required): The job data to display

### Events

- `click()`: Emitted when card is clicked

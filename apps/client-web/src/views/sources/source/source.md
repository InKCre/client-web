# Source Detail View

## Rationale

Provides a detailed view of a single source with its configuration and associated collect jobs.

## Goals

- Display comprehensive source information
- Allow inline editing of nickname and config
- List all collect jobs for this source with pagination
- Provide actions to create new jobs and delete the source

## Specification

### Layout

- Two-panel layout (left: source details, right: collect jobs)
- Similar to SourceCollectJob view layout

### Left Panel (Source Details)

- Source type, nickname, and ID
- Inline nickname editing (using InkInput)
- Config display and editing (using InkJsonEditor with save button)
- Collect at schedule display
- Delete action button

### Right Panel (Collect Jobs List)

- "New Job" button at the top (full width)
- List of collect jobs with pagination
- Each job shows: ID, status, created date, and clickable link to job detail
- Pagination controls at the bottom

### Actions

- New Job: Opens center popup with title, newCollectJob component, and cancel/create buttons
- Delete: Deletes the source and navigates back to sources list
- Save Config: Saves the edited configuration

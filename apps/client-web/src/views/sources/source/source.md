# Source Detail View

## Rationale

Provides a detailed view of one Source with its configuration, Jobs, and ordinary collection Crons.

## Goals

- Display comprehensive source information
- Allow inline editing of nickname and config
- List Jobs whose parameters reference this Source
- Create ordinary and historical collection Jobs
- Create, run, and delete ordinary collection Crons
- Provide actions to create new jobs and delete the source

## Specification

### Layout

- Two-panel layout (left: Source details, right: scheduling and Jobs)

### Left Panel (Source Details)

- Source type, nickname, and ID
- Inline nickname editing (using InkInput)
- Config display and editing (using InkJsonEditor with save button)
- Delete action button

### Right Panel (Scheduling and Jobs)

- "New Job" button at the top (full width)
- Cron controls and current schedules
- List of Jobs for this Source
- Each job shows: ID, status, created date, and clickable link to job detail

### Actions

- New Job: chooses ordinary collection or historical backfill, validates its JSON config, and creates a global Job
- Schedule: creates an ordinary collection Cron from a five-field schedule
- Delete: Deletes the source and navigates back to sources list
- Save Config: Saves the edited configuration

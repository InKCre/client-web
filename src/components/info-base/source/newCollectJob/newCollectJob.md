# newCollectJob

## Rationale

Provides a simple form interface to create a new source collect job.

## Goals

Allow users to create a new collect job for a source.

## Specification

- Simple form with minimal configuration
- Uses source ID as a prop
- Emits `create` event when job is created with the created job object

## Implementation

### Props

- `sourceId` (`number`, required): ID of the source to create job for

### Events

- `create(job: SourceCollectJob)`: Emitted when a new job is created

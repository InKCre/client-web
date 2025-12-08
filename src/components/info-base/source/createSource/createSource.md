# createSource

## Rationale

Component for creating a new source in the info-base.

## Goals

Provide a form to input source details and emit the creation data.

## Key Concepts

- Source creation

## Specification

Form with fields for nickname, type, and collect at. Emits create event with the data.

## Implementation

### Events

- `create(data: SourceForm)`: Emitted when create button is clicked, with the form data.

# SourceCard

A card component for displaying and managing source information.

## Props

- `source` (SourceData): Source data object containing:
  - `id` (number): Source ID
  - `nickname` (string): Source nickname
  - `type` (string): Source type
  - `config` (object): Source configuration
  - `collectAt` (string, optional): Collection schedule

## Emits

- `edit`: Emitted when edit button is clicked with source ID
- `delete`: Emitted when delete button is clicked with source ID
- `run`: Emitted when run now button is clicked with source ID
- `editConfig`: Emitted when edit config button is clicked with source ID

## Usage

```vue
<SourceCard
  :source="sourceData"
  @edit="handleEdit"
  @delete="handleDelete"
  @run="handleRun"
  @editConfig="handleEditConfig"
/>
```

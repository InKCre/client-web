# InkJsonEditor

## Rationale

A specialized textarea component for editing JSON with enhanced editing features.

## Goals

Provide a consistent JSON editor field for forms with smart indentation, quote completion, and comma completion to streamline JSON configuration editing.

## Specification

Displays an editable textarea optimized for JSON editing or read-only formatted text. Provides smart editing features to streamline JSON configuration editing. When used inside InkForm with a label, it automatically integrates with InkField for consistent field layout.

## Implementation

### Props

- `value` (`string`, `""`)：The textarea value
- `editable` (`boolean`, `true`)：Whether the field is editable
- `placeholder` (`string`, `""`)：Placeholder text
- `rows` (`number`, `5`)：Number of visible rows
- `prop` (`string`, `""`)：The property name for form binding
- `label` (`string`, `""`)：The field label. When provided and inside InkForm, the component uses InkField internally
- `layout` (`"inline" | "col" | "row"`, `"inline"`)：The field layout (only applies when inside InkForm with label). If not specified, inherits from InkForm's layout

### Events

- `update:value(value: string)`: Emitted when the textarea value changes

### JSON Edit Features

- **Tab/Shift+Tab**: Add or remove 2-space indentation on the current line
- **Quote auto-completion**: Typing `"` or `'` automatically adds the closing quote and places cursor between them
- **Comma completion**: Automatically suggests comma placement after closing braces in appropriate contexts

## Others

现在还不是造轮子，学习的时候，要先把产品搞上线先；用成熟的轮子就好：Code Mirror 6

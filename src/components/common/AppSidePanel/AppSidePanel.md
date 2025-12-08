# AppSidePanel

Application-specific sidebar panel component that displays the main navigation menu (Managing section).

## Features

- Integrates SidePanel for expand/collapse functionality
- Displays Managing menu with Sources, Extensions, and Settings buttons
- Handles navigation internally (Sources, Extensions, Settings)
- Automatically expands on start view, collapses on other routes
- Manages its own expanded state

## Usage

```vue
<template>
  <AppSidePanel :expanded="sidebarExpanded" />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `expanded` | `boolean` | `false` | Controls whether the panel is expanded or collapsed |

## Emits

| Event | Payload | Description |
|-------|---------|-------------|
| `update:expanded` | `boolean` | Emitted when the expanded state changes based on route |

## Behavior

- **On Start View (`/`)**: Panel expands by default
- **On Other Routes**: Panel collapses by default
- **Sources Button**: Navigates to `/sources`
- **Extensions Button**: Placeholder for future navigation
- **Settings Button**: Placeholder for future navigation

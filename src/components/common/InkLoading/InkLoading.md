# InkLoading

## Rationale

Provides visual feedback during asynchronous operations, preventing user confusion when content is being loaded or processed.

## Goals

Display an animated loading indicator with three rectangular blocks that pulse with a sequential color-shift animation to indicate ongoing activity.

## Specification

### Content

- Three vertical rectangular blocks arranged horizontally
- Each block animates with a sequential delay creating a wave effect
- Color shifts from subtle (dark) to base (light) in a smooth loop

### UI/UX

- Compact and unobtrusive design
- Smooth animation with proper timing (1.5s cycle)
- Configurable size and spacing density

### Behavior

- Continuous looping animation
- Sequential animation delays (0s, 0.3s, 0.6s) create visual wave pattern
- Smooth ease-in-out timing function

## Implementation

### Props

- `size` (`"xs" | "sm" | "md"`, `"md"`)：Controls block dimensions
  - `xs`: 4px × 12px blocks
  - `sm`: 6px × 16px blocks
  - `md`: 8px × 20px blocks
- `density` (`"sm" | "md"`, `"md"`)：Controls gap between blocks
  - `sm`: Uses `space-xs` token
  - `md`: Uses `space-sm` token

### Animation

- Keyframe animation `ink-loading-pulse` with 1.5s duration
- Sequential delays: block-1 (0s), block-2 (0.3s), block-3 (0.6s)
- Color transitions between `color-surface-subtle` and `color-surface-base`
- Ease-in-out timing for smooth transitions

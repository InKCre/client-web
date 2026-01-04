# WritingAssist Component

A sophisticated writing assistance component that provides real-time vocabulary suggestions for editable text fields on web pages, helping users improve their English writing.

## Overview

The WritingAssist component monitors editable elements on web pages (input fields, textareas, contenteditable elements) and provides intelligent vocabulary suggestions based on the user's content. It uses embedding-based search to find better word choices and displays them in a floating panel.

## Usage

```vue
<template>
  <WritingAssist />
</template>

<script setup lang="ts">
import WritingAssist from "~/components/contentScripts/WritingAssist/WritingAssist.vue";
</script>
```

This component is typically injected into web pages via content scripts and doesn't require explicit props.

## Props

This component does not accept any props. It automatically activates when editable elements are focused.

## Events

This component does not emit events. It operates autonomously within the content script context.

## Features

### Automatic Element Detection

- Detects text input fields (`<input type="text">`)
- Detects textareas (`<textarea>`)
- Detects contenteditable elements
- Automatically shows/hides based on focus state

### Intelligent Word Analysis

- Filters out stopwords (common words like "the", "a", "is")
- Identifies content words worth improving
- Excludes proper nouns (capitalized words mid-sentence)
- Processes text sentence by sentence
- Prevents duplicate suggestions per word

### Debounced Fetching

- 5-second debounce after user stops typing
- Immediate fetch on focus loss
- Prevents excessive API calls
- Optimizes performance and user experience

### Stopwords Management

- Loads stopwords from storage
- Falls back to network fetch if not cached
- Uses default list as final fallback
- Caches stopwords for future use
- Normalizes all stopwords to lowercase

### Floating UI Panel

- Fixed position in bottom-right corner
- Collapsible with logo button
- Responsive sizing (30vw, min 200px)
- Scrollable suggestions list
- Toast notifications for actions

### Suggestion Interaction

- Click to apply suggestion
- Copy button with toast feedback
- Visual hover states
- Seamless text replacement

## State Management

### Local State

```typescript
const show = ref(false);                    // Show/hide entire component
const showPanel = ref(false);               // Show/hide suggestions panel
const showToast = ref(false);               // Show/hide success toast
const suggestions = ref<Array>([]);         // Current suggestions
const isLoading = ref(false);               // Loading state
const currentElement = ref<HTMLElement>();  // Currently focused element
const debounceTimer = ref<NodeJS.Timeout>(); // Debounce timer
```

### Suggestion Structure

```typescript
interface Suggestion {
  original: string;    // Original word from text
  replacement: string; // Suggested replacement
}
```

## Methods

### Text Processing

**`cleanText(text: string): string`**

Cleans and normalizes text:
- Removes HTML tags
- Removes extra whitespace
- Removes URLs
- Removes non-linguistic characters
- Preserves punctuation

**`loadStopwords(): Promise<string[]>`**

Loads stopwords with fallback strategy:
1. Check storage cache
2. Fetch from GitHub (stopwords-iso)
3. Use default hardcoded list

**`getReplacableUnits(text: string): Promise<ReplacableUnit[]>`**

Extracts words worth replacing:
- Splits text into sentences
- Tokenizes by word boundaries
- Filters stopwords
- Excludes proper nouns
- Returns unique words per sentence

### Suggestion Management

**`fetchSuggestions(): Promise<void>`**

Fetches suggestions for current text:
1. Gets text from focused element
2. Cleans and processes text
3. Identifies replaceable units
4. Queries embedding database
5. Updates suggestions list

**`applySuggestion(suggestion: string): void`**

Applies selected suggestion to focused element.

**`displayToast(): void`**

Shows success toast for 2 seconds.

### Element Utilities

**`getTextFromElement(element: HTMLElement): string`**

Extracts text content from various element types.

**`setTextToElement(element: HTMLElement, text: string): void`**

Sets text content to various element types.

**`isEditable(element: HTMLElement): boolean`**

Checks if element is editable (input, textarea, or contenteditable).

### Event Handlers

**`handleFocusIn(event: FocusEvent): void`**

Activates component when editable element focused:
- Clears existing debounce timer
- Shows component
- Stores current element reference

**`handleFocusOut(event: FocusEvent): void`**

Triggers suggestion fetch when element loses focus.

**`handleInput(event: Event): void`**

Sets up debounced fetch on text input (5-second delay).

## Component Hierarchy

```
WritingAssist
├── .writing-assist-panel (suggestions)
│   ├── .panel-header
│   ├── .suggestions-list
│   │   └── Suggestion × N
│   ├── .loading-state (if loading)
│   └── .empty-state (if no suggestions)
└── .control-bar
    ├── .toast-message (transition)
    └── .toggle-button (logo)
```

## Styling

### Layout

- Fixed positioning in bottom-right
- 30vw width (responsive)
- 60vh height
- High z-index (10000) for visibility
- Flexbox layout for alignment

### Visual Design

- White background with shadow
- Rounded corners (4px)
- Border for definition
- Smooth transitions
- Hover effects on interactive elements

### Responsive Breakpoints

**Tablet (≤768px)**:
- Width: 50vw
- Min-width: 150px

**Mobile (≤480px)**:
- Width: 70vw
- Reduced margins (8px)

### CSS Classes

- `.writing-assist-container` - Main fixed container
- `.writing-assist-panel` - Suggestions panel
- `.panel-header` - Header with title
- `.suggestions-list` - Scrollable suggestions
- `.loading-state` - Loading indicator
- `.empty-state` - No suggestions message
- `.control-bar` - Bottom control bar
- `.toggle-button` - Panel toggle button
- `.logo-icon` - InKCre logo
- `.toast-message` - Success notification

### Animations

**Toast Transition** (0.3s ease):
```
Enter: opacity 0 → 1, translateX(100% → 0)
Leave: opacity 1 → 0, translateX(0 → 100%)
```

## Integration Flow

1. Content script loads WritingAssist component
2. Component adds event listeners to document
3. User focuses editable element
4. Component activates and shows toggle button
5. User types content
6. After 5 seconds or blur, suggestions fetched
7. Panel displays suggestions
8. User clicks suggestion to apply
9. Text replaced in original element
10. Toast confirms action

## Dependencies

### Components

- `Suggestion.vue` - Individual suggestion card

### Logic Modules

- `~/logic/info-base/root` - Root data structures
- `~/logic/info-base/block` - Block with embedding search
- `~/logic/storage` - Stopwords storage

### Assets

- `~/assets/inkcre.svg` - Logo icon

### External APIs

- GitHub stopwords-iso - Stopword list
- Embedding API - Vocabulary suggestions

## Performance Considerations

- Debounced API calls (5-second delay)
- Cached stopwords in storage
- Efficient text processing algorithms
- Lazy suggestion loading
- Minimal DOM manipulation
- Event listener cleanup on unmount

## Best Practices

1. **Clean up resources** - Remove event listeners on unmount
2. **Cache stopwords** - Save to storage for future use
3. **Debounce aggressively** - Prevent API spam
4. **Validate element types** - Check before accessing properties
5. **Handle errors gracefully** - Catch and log API failures
6. **Test with various inputs** - Different text lengths and formats
7. **Respect user privacy** - Only process visible text

## Accessibility

- High contrast colors
- Readable font sizes
- Keyboard-accessible toggle
- Screen reader friendly structure
- Focus management
- Clear visual feedback

## Security Considerations

- Sanitizes HTML input
- Validates element types before manipulation
- No eval() or innerHTML usage
- Safe text replacement methods
- CORS-compliant API calls

## File Structure

- `WritingAssist.vue` - Component template and logic
- `WritingAssist.scss` - Styling with responsive design
- `WritingAssist.md` - This documentation file

## Browser Compatibility

- Modern browsers with ES6+ support
- Content script context
- Browser extension APIs
- Fetch API for network requests
- Transition/animation support

## Future Enhancements

Potential improvements:

- Multi-language support
- Custom stopword lists
- Configurable debounce time
- Grammar checking integration
- Context-aware suggestions
- Tone adjustment (formal/casual)
- Synonym alternatives
- Usage examples for suggestions
- Keyboard shortcuts for navigation
- Dark mode support
- Position customization
- Suggestion history
- User feedback mechanism
- Offline mode with cached suggestions
- Performance metrics
- A/B testing different algorithms

## Related Components

- `Suggestion.vue` - Individual suggestion display
- `ActionBar.vue` - Other content script UI
- Storage configuration - Stopwords management

## Troubleshooting

### Component not appearing
- Check content script injection
- Verify z-index isn't overridden
- Inspect console for errors
- Check element focus detection

### Suggestions not loading
- Verify API endpoint is accessible
- Check network connectivity
- Inspect stopwords loading
- Validate text processing logic

### Text replacement not working
- Check element type detection
- Verify element is still editable
- Inspect DOM manipulation code
- Test with different input types

### Performance issues
- Increase debounce time
- Reduce suggestion count
- Optimize text processing
- Cache more aggressively
- Profile JavaScript performance

## Known Limitations

- Only works with Latin alphabet
- Requires internet for first-time stopwords load
- May not detect all editable elements
- Limited to single-word replacements
- No context awareness across sentences
- Cannot handle rich text formatting
- Suggestions limited by embedding database

## Configuration

Future configuration options could include:

```typescript
interface WritingAssistConfig {
  debounceTime: number;        // Default: 5000ms
  maxSuggestions: number;      // Default: unlimited
  stopwordSource: string;      // Custom stopword URL
  position: Position;          // Default: bottom-right
  theme: Theme;                // Default: light
  autoShow: boolean;           // Default: true
  enableToasts: boolean;       // Default: true
}
```

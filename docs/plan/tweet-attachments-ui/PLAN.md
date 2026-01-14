# Plan: Tweet Attachments UI Enhancement

## Context

The backend infrastructure for tweet attachments is complete (see [tweet-attachments-enhancement/RESULT.md](../tweet-attachments-enhancement/RESULT.md)):

- Tweet schema includes `attachments: string[]` field (blob URLs)
- TweetResolver populates attachments from image/video relations
- ResolverCache optimizes nested resolver instantiation

**Current Issue:** ContentTweet.vue doesn't render the attachments. It has a placeholder `photoUrls` ref that's never populated.

**Goal:** Enhance ContentTweet.vue to display images and videos with a Twitter-like UI experience.

## Research Summary

### Twitter Media Layout Patterns

Based on research of Twitter's actual UI:

#### 1. Single Image

- Full width display
- Flexible aspect ratio (typically 16:9)
- Max height: ~508px
- Border radius: 16px

#### 2. Two Images

- Side-by-side 50/50 split
- Forced to 1:1 aspect ratio (square crops)
- 2px gap between images
- Border radius: 16px on outer edges

#### 3. Three Images

- Asymmetric grid layout
- Left: 1 large image (66% width, 2:1 aspect ratio)
- Right: 2 small stacked images (33% width each, 1:1 aspect ratio)
- 2px gaps between all images

#### 4. Four Images

- Even 2×2 grid
- All forced to 1:1 aspect ratio
- 2px gaps between images
- Border radius: 16px on outer corners

#### Videos

- Displayed as thumbnails with centered play button overlay
- Play button: circular, ~64-72px diameter, semi-transparent black background
- Same grid patterns as images
- VIDEO badge in bottom-right corner

#### General Properties

- `object-fit: cover` with `object-position: center`
- Container max-width: ~504-506px
- Smooth transitions (200ms) for hover states
- Images slightly scale/brighten on hover

## Implementation Plan

### Phase 1: Update ContentTweet.vue Template

**Goals:**

1. Remove unused `photoUrls` ref
2. Add computed property to derive media items from `solvedContent.attachments`
3. Add dynamic grid layout based on attachment count
4. Render images with proper `object-fit` and error handling
5. Render videos with play button overlay and VIDEO badge

**Template Structure:**

```
.content-tweet
  .content-tweet__header (existing)
  .content-tweet__text (existing)
  .content-tweet__media (new/enhanced)
    .content-tweet__media-grid
      .content-tweet__media-item (for each attachment)
        img (for images)
        OR
        video preview with play overlay (for videos)
```

**Dynamic Classes:**

- `.content-tweet__media-grid--1` (single image)
- `.content-tweet__media-grid--2` (two images)
- `.content-tweet__media-grid--3` (three images)
- `.content-tweet__media-grid--4` (four+ images, show max 4)

### Phase 2: Script Logic Enhancement

**Script Changes:**

1. **Remove unused code:**
   - Remove `photoUrls` ref

2. **Add computed properties:**

   ```typescript
   // Derive attachment list from solvedContent
   const attachments = computed(() => {
     return props.solvedContent?.attachments || [];
   });

   // Limit to max 4 attachments (Twitter-like behavior)
   const displayAttachments = computed(() => {
     return attachments.value.slice(0, 4);
   });

   // Count for dynamic grid class
   const attachmentCount = computed(() => {
     return displayAttachments.value.length;
   });
   ```

3. **Add error handling:**
   - Track failed image loads per attachment
   - Hide broken images gracefully
   - Show placeholder for failed videos

4. **Media type detection:**
   - Use blob URL or check if ObjectURL has video MIME type
   - For now, assume all attachments are images (videos show as thumbnails)
   - Future: extend schema to include type metadata

### Phase 3: SCSS Styling (Twitter-like Grid)

**File:** `extensions/twitter/src/components/ContentTweet.scss` (create new file)

**Key SCSS Patterns:**

```scss
.content-tweet__media {
  margin-top: sys-var(space, sm);
  
  &-grid {
    display: grid;
    gap: 2px;
    border-radius: 16px;
    overflow: hidden;
    
    // Single image: full width, flexible height
    &--1 {
      grid-template-columns: 1fr;
      max-height: 508px;
      
      .content-tweet__media-item {
        aspect-ratio: auto;
        max-height: 508px;
      }
    }
    
    // Two images: side-by-side squares
    &--2 {
      grid-template-columns: 1fr 1fr;
      
      .content-tweet__media-item {
        aspect-ratio: 1 / 1;
      }
    }
    
    // Three images: asymmetric layout
    &--3 {
      grid-template-columns: 2fr 1fr;
      grid-template-rows: 1fr 1fr;
      
      .content-tweet__media-item:nth-child(1) {
        grid-row: 1 / 3;
        aspect-ratio: 2 / 1;
      }
      
      .content-tweet__media-item:nth-child(2),
      .content-tweet__media-item:nth-child(3) {
        aspect-ratio: 1 / 1;
      }
    }
    
    // Four images: 2x2 grid
    &--4 {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      
      .content-tweet__media-item {
        aspect-ratio: 1 / 1;
      }
    }
  }
  
  &-item {
    position: relative;
    overflow: hidden;
    background: sys-var(color, surface, subtle);
    
    img, video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      transition: transform 200ms ease, opacity 200ms ease;
    }
    
    &:hover img,
    &:hover video {
      transform: scale(1.03);
      opacity: 0.95;
    }
  }
  
  // Video play button overlay
  &-play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition: transform 200ms ease;
    
    &-icon {
      color: white;
      font-size: 32px;
    }
  }
  
  .content-tweet__media-item:hover &-play {
    transform: translate(-50%, -50%) scale(1.1);
  }
  
  // VIDEO badge
  &-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    @include apply-font(label-sm);
    font-weight: 600;
    border-radius: 4px;
    text-transform: uppercase;
  }
}
```

**Design Token Usage:**

- Spacing: `sys-var(space, xs|sm|md)`
- Colors: `sys-var(color, surface, subtle)`, `sys-var(color, text, base)`
- Fonts: `apply-font(label-sm|label-lg)`
- Border radius: Use fixed 16px for Twitter authenticity (or `sys-var(radius, md)` if available)

### Phase 4: Update ContentTweet Component Structure

**Create separate SCSS file** following component structure guidelines:

- Create `extensions/twitter/src/components/ContentTweet.scss`
- Import in ContentTweet.vue: `<style lang="scss" scoped src="./ContentTweet.scss" />`

### Phase 5: Video Support Enhancement (Future)

For now, videos will display as thumbnails (ObjectURLs from VideoResolver). Full video playback can be added later:

**Future enhancements:**

1. Detect video vs image types from blob MIME or relation pattern
2. Add clickable video playback modal/inline player
3. Implement video controls (play/pause/seek)
4. Handle video loading states

## Implementation Order

1. **Step 1:** Create ContentTweet.scss with grid layouts
2. **Step 2:** Update ContentTweet.vue script (remove photoUrls, add computed properties)
3. **Step 3:** Update ContentTweet.vue template (use attachments, dynamic grid classes)
4. **Step 4:** Test with various attachment counts (0, 1, 2, 3, 4+)
5. **Step 5:** Polish hover states and error handling

## Success Criteria

✅ Display 1-4 attachments with Twitter-like grid layouts
✅ Images load from `solvedContent.attachments` blob URLs
✅ Proper aspect ratios enforced per attachment count
✅ Smooth hover interactions (scale, opacity)
✅ Error handling for broken images
✅ Border radius and gap spacing match Twitter aesthetics
✅ Responsive to container width
✅ Videos display with play button overlay (static thumbnail)
✅ Follow component structure guidelines (separate .scss file)
✅ Use design tokens (sys-var, apply-font)

## Non-Goals (Out of Scope)

- ❌ Video playback functionality (show thumbnails only)
- ❌ Image lightbox/fullscreen view
- ❌ Lazy loading optimization
- ❌ Advanced video controls
- ❌ GIF animation support
- ❌ Alt text display
- ❌ Image download functionality

## Questions for User

1. **Max attachment count:** Should we cap at 4 attachments like Twitter, or display all?
2. **Video detection:** How to distinguish video vs image blobs? Check relation pattern or MIME type?
3. **Error states:** Should failed images show placeholder icon or just hide?
4. **Hover behavior:** Should clicking images open lightbox/fullscreen view, or just hover preview for now?
5. **Responsive breakpoints:** Should mobile use different grid patterns (e.g., stack vertically)?

## File Changes Summary

**Files to modify:**

1. `extensions/twitter/src/components/ContentTweet.vue` - Update script and template

**Files to create:**
2. `extensions/twitter/src/components/ContentTweet.scss` - New SCSS file with grid layouts

**Files to reference (no changes):**
3. `extensions/twitter/src/schema.ts` - Already has attachments field
4. `extensions/twitter/src/resolver.ts` - Already populates attachments

---

## Observations from Exploration Phase

### Similar Patterns Found

1. **ContentImage.vue** - Shows how to handle blob URLs with error states
2. **ContentVideo.vue** - Shows video thumbnail display with play overlay and badge
3. **Design token system** - Well-established with `sys-var()` and mixins
4. **Component structure** - Clear separation of .vue, .ts, .scss files

### Architectural Decisions

1. **Pure presentation component:** ContentTweet.vue receives pre-resolved blob URLs, doesn't fetch relations itself
2. **Leverage existing patterns:** Reuse error handling from ContentImage, play overlay from ContentVideo
3. **CSS Grid over Flexbox:** Better for complex multi-image layouts with asymmetric patterns
4. **Fixed 2px gaps:** Twitter uses very small gaps, design tokens might be too large
5. **Aspect ratio control:** Use CSS `aspect-ratio` property for clean responsive behavior

### Why This Approach

**Separation of concerns:**

- Resolver layer handles data fetching and caching
- Component layer handles presentation only
- Clear boundary makes testing and maintenance easier

**Performance:**

- Blob URLs are pre-fetched and cached
- No additional network requests in component
- ResolverCache prevents redundant resolver instantiation

**Maintainability:**

- Twitter-like layouts are well-documented and familiar
- CSS Grid provides declarative layout logic
- Design token usage ensures visual consistency

**Extensibility:**

- Easy to add more attachment types (polls, cards, etc.)
- Grid patterns can be extended for 5+ attachments
- Video playback can be added without structural changes

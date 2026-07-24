# Twitter (X) Media Attachment Layout Specification

## Overview

This document specifies Twitter's visual layout patterns for media attachments in tweets. These patterns can be used to implement a Twitter-like media grid in Vue.js with SCSS.

---

## 1. Image Count Layout Patterns

### 1 Image - Full Width

- **Layout**: Single full-width container
- **Aspect Ratio**: Flexible (16:9 recommended, 2:1 also common)
- **Recommended Size**: 1200 x 675px (16:9) or 1200 x 600px (2:1)
- **Display**: Full width of tweet container (~506px max on desktop)
- **Behavior**: Maintains original aspect ratio, constrained by max-height

### 2 Images - Side-by-Side

- **Layout**: Two equal columns (1:1 grid, 50% width each)
- **Aspect Ratio**: Both images displayed as 1:1 (square) regardless of original
- **Grid Pattern**: `grid-template-columns: 1fr 1fr`
- **Behavior**: Images are center-cropped to square aspect ratio

### 3 Images - Large + Stacked

- **Layout**: Asymmetric grid
  - Left: 1 large image (2/3 width, full height)
  - Right: 2 stacked images (1/3 width each, half height)
- **Aspect Ratio**:
  - Large image: ~2:1 or maintains natural aspect
  - Small images: ~1:1 (square)
- **Grid Pattern**:

  ```
  [Large ] [Small1]
  [Large ] [Small2]
  ```

- **CSS Grid Template**: `grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr`

### 4 Images - 2x2 Grid

- **Layout**: Even 2x2 grid
- **Aspect Ratio**: All images displayed as 1:1 (square)
- **Grid Pattern**: `grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr`
- **Display**: 4 equal squares

### 4+ Images (5+ not standard)

- **Standard Behavior**: Twitter caps at 4 images in the UI
- **Layout**: Same as 4 images (2x2 grid)
- **Overflow**: Additional images not displayed in main grid

---

## 2. Aspect Ratios by Count

| Image Count | Pattern           | Individual Aspect Ratios       |
| ----------- | ----------------- | ------------------------------ |
| 1           | Full width        | 16:9, 2:1, 1:1, 4:5 (flexible) |
| 2           | Side-by-side      | 1:1 (both)                     |
| 3           | 1 large + 2 small | Large: ~2:1, Small: 1:1 each   |
| 4           | 2x2 grid          | 1:1 (all)                      |

**Key Rule**: For 2, 3, or 4 images, Twitter force-crops images to fit specific aspect ratios using CSS `object-fit: cover` and center positioning.

---

## 3. Grid Spacing & Visual Properties

### Gap Between Images

- **Gap Size**: `2px` (very small gap between images)
- **CSS**: `gap: 2px` on grid container

### Border Radius

- **Value**: `16px` (rounded corners)
- **Applied To**:
  - Individual images get rounded corners
  - Outer container also has rounded corners
- **CSS**: `border-radius: 16px` for outer container, individual images inherit or have same value

### Maximum Height

- **Single Image**: ~508px max height (desktop)
- **Multiple Images Grid**: Height constrained to maintain aspect ratios
- **Mobile**: Full width, proportional height
- **Constraint**: `max-height: 508px` or similar, with `object-fit: cover`

### Container Width

- **Desktop**: ~504-506px max width within tweet container
- **Mobile**: Full width minus padding (typically ~100vw - 32px)

---

## 4. Video Display

### Video Thumbnail

- **Appearance**: Static thumbnail image with centered play button overlay
- **Aspect Ratio**: 16:9 (1280 x 720px recommended)
- **Play Button**:
  - Circular badge with triangle icon
  - Centered absolutely over thumbnail
  - Semi-transparent background or white icon on dark overlay
  - Size: ~64-72px diameter

### Video + Images Mixed

- **Layout**: Treats video as an image in the grid
- **Grid Pattern**: Follows same rules as image count (1-4 media items)
- **Video Badge**: Play button overlay distinguishes video from static images
- **Example**: 1 video + 2 images = 3-image layout (1 large + 2 stacked)

---

## 5. CSS Grid/Flexbox Patterns

### Implementation Strategy

Use CSS Grid for multi-image layouts for precise control.

### Grid Templates

#### 1 Image

```scss
.media-grid--single {
  display: block; // or grid with 1 column
  max-height: 508px;
  border-radius: 16px;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    object-fit: cover;
    max-height: 508px;
    border-radius: 16px;
  }
}
```

#### 2 Images

```scss
.media-grid--two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  border-radius: 16px;
  overflow: hidden;

  img {
    aspect-ratio: 1 / 1;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}
```

#### 3 Images

```scss
.media-grid--three {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
  border-radius: 16px;
  overflow: hidden;
  max-height: 508px;

  .media-item:first-child {
    grid-row: 1 / 3; // Span both rows
    aspect-ratio: 2 / 1; // or auto based on max-height
  }

  .media-item:not(:first-child) {
    aspect-ratio: 1 / 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
```

#### 4 Images

```scss
.media-grid--four {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
  border-radius: 16px;
  overflow: hidden;

  img {
    aspect-ratio: 1 / 1;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}
```

---

## 6. Hover & Interaction States

### Image Hover

- **Brightness**: Slight decrease (overlay with `rgba(0, 0, 0, 0.05)` or filter)
- **Cursor**: `pointer`
- **Transition**: Smooth ~200ms transition
- **No Scale**: Images don't scale on hover

### Video Hover

- **Play Button**: Scale slightly larger (~1.1x transform) on hover
- **Background**: Play button background may lighten or pulse
- **Transition**: ~200ms ease

### Click Behavior

- Opens lightbox/modal with full image
- In multi-image tweets, allows navigation between images

### Accessibility

- Images should have alt text
- Play button should have `aria-label="Play video"`
- Keyboard navigation support

---

## 7. Responsive Behavior

### Mobile (< 600px)

- **Full Width**: Media grid takes full container width
- **Same Patterns**: Layout patterns remain (1 full, 2 side-by-side, 3 asymmetric, 4 grid)
- **Touch Targets**: Minimum 44x44px for interactive elements

### Tablet (600px - 1024px)

- **Scaled Container**: Proportional width within tweet container
- **Same Rules**: Grid patterns and aspect ratios identical to desktop

### Desktop (> 1024px)

- **Max Width**: ~504-506px
- **Centered**: Within tweet container (typically ~600px total width)

---

## 8. Implementation Notes for Vue.js + SCSS

### Component Structure

```
MediaGrid.vue
├── computed: gridClass (based on media count)
├── template: <div :class="gridClass">
│   └── <div v-for="media in mediaItems" :key="media.id" class="media-item">
│       ├── <img v-if="media.type === 'image'" />
│       └── <video-thumbnail v-else-if="media.type === 'video'" />
└── style: SCSS with grid patterns
```

### Dynamic Class Binding

```vue
<div
  class="media-grid"
  :class="`media-grid--${mediaCount}`"
>
```

### SCSS Variables

```scss
$media-gap: 2px;
$media-border-radius: 16px;
$media-max-height: 508px;
$hover-overlay-color: rgba(0, 0, 0, 0.05);
$transition-speed: 200ms;
```

### Key CSS Properties

- `display: grid`
- `gap: 2px`
- `border-radius: 16px`
- `overflow: hidden` (for rounded corners on children)
- `object-fit: cover` (crop images to fit)
- `object-position: center` (center crop point)

### Video Play Button

```scss
.video-play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 200ms ease;

  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
  }
}
```

---

## 9. Additional Design Specifications

### Colors

- **Video Overlay**: Semi-transparent black `rgba(0, 0, 0, 0.3)` optional
- **Play Button Background**: White `#ffffff` or `rgba(255, 255, 255, 0.9)`
- **Play Icon**: Black `#000000` or Twitter blue `#1DA1F2`

### File Size Limits (Twitter's actual limits)

- **Images**: 5MB (15MB on web upload)
- **Video**: 512MB
- **Supported Formats**: JPG, PNG, WEBP for images; MP4, MOV for video

### Performance Optimization

- Use lazy loading for images
- Preload video thumbnails
- Consider using `<picture>` element with srcset for responsive images
- Implement IntersectionObserver for viewport-based loading

---

## 10. Summary: Quick Reference

| Count | Layout       | Grid Template      | Aspect Ratios       | Gap | Border Radius | Max Height |
| ----- | ------------ | ------------------ | ------------------- | --- | ------------- | ---------- |
| 1     | Full         | `1fr`              | Flexible (16:9 rec) | N/A | 16px          | 508px      |
| 2     | Side-by-side | `1fr 1fr`          | 1:1 both            | 2px | 16px          | Auto       |
| 3     | 1L + 2S      | `2fr 1fr` (2 rows) | L: 2:1, S: 1:1      | 2px | 16px          | 508px      |
| 4     | 2x2 Grid     | `1fr 1fr` (2 rows) | 1:1 all             | 2px | 16px          | Auto       |

**Key CSS Properties**: `object-fit: cover`, `object-position: center`, `overflow: hidden`, `transition: 200ms`

---

## References

- Based on research from Twitter's actual implementation (2026)
- Observed behavior across desktop and mobile platforms
- Aligns with Twitter's official ad specifications where available

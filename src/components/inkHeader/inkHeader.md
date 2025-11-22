````markdown
# InkHeader Component

The InkHeader component is a versatile header that supports both brand display and generalized page headers.

## Features

- **Default Mode**: Brand header with logo and navigation to home
- **Page Mode**: Generalized header with custom title and navigation links
- Responsive design with mobile-friendly layouts
- Consistent styling following the design system
- Support for both internal router links and external links

## Usage

### Default Brand Header
```vue
<InkHeader />
<!-- or explicitly -->
<InkHeader mode="default" />
```

### Page Header
```vue
<InkHeader 
  mode="page"
  title="EXTENSIONS"
  :navLinks="[
    { to: '/', label: 'BACK_TO_HOME' },
    { to: '/settings', label: 'SETTINGS' }
  ]"
/>
```

### External Links
```vue
<InkHeader 
  mode="page"
  title="DOCUMENTATION"
  :navLinks="[
    { to: '/', label: 'HOME' },
    { to: 'https://docs.example.com', label: 'DOCS', external: true }
  ]"
/>
```

## Props

### InkHeaderProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'default' \| 'page'` | `'default'` | Header display mode |
| `title` | `string` | `''` | Page title (page mode only) |
| `navLinks` | `NavLink[]` | `[]` | Navigation links array |

### NavLink Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `to` | `string` | Yes | Link destination (route path or URL) |
| `label` | `string` | Yes | Link display text |
| `external` | `boolean` | No | Whether link opens in new tab |

## Modes

### Default Mode
- Displays InKCre brand logo and name
- Gradient background styling
- Always links to home page
- Compact layout suitable for application navigation

### Page Mode
- Displays custom page title in mono caps styling
- Navigation links with consistent button styling
- Flat card background for content separation
- Responsive layout that stacks on mobile devices

## Design

The header follows the minimalist design philosophy with:

- **Default Mode**: Gradient background, brand-focused
- **Page Mode**: Flat background, content-focused
- Monospace typography for titles
- Small caps styling for navigation elements
- Consistent spacing and elevation
- Mobile-responsive behavior

## Examples

Generalized version of extensionsView header:
```vue
<InkHeader 
  mode="page"
  title="EXTENSIONS"
  :navLinks="[{ to: '/', label: 'BACK_TO_HOME' }]"
/>
```

Multiple navigation options:
```vue
<InkHeader 
  mode="page"
  title="SETTINGS"
  :navLinks="[
    { to: '/', label: 'HOME' },
    { to: '/extensions', label: 'EXTENSIONS' },
    { to: 'https://docs.inkcre.com', label: 'HELP', external: true }
  ]"
/>
```

````

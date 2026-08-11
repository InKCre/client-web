# InKCre/client-web Component Architecture

Components are organized by **business domain**, with shared utilities in `common/`. Each component follows a consistent file structure for maintainability.

## Component Development Pattern

### File Structure

Every component follows this pattern:

```
componentName/
├── componentName.md            # Documentation
├── componentName.vue           # Template & logic
├── componentName.ts            # Props, emits, types, utilities
└── componentName.scss          # Styles (optional)
```

## Component Types

### Domain Components

**Purpose**: Tightly coupled to specific business domains.

**Characteristics**:

- Props accept domain-owned models or generated contracts
- Emits carry typed domain payloads
- Contain domain-specific logic

**Examples**: `sourceCard`, `extensionCard`, `BlockNode`

### Common Components

**Purpose**: Cross-domain reusable utilities.

**Characteristics**:

- Generic props (not tied to business entities)
- Highly reusable
- Minimal business logic

**Examples**: `AppSidePanel`, design system components

### Resolver Content Components

**Purpose**: Display resolved block content.

**Location**: `info-base/resolvers/`

**Characteristics**:

- Use `ContentCompProps` interface
- Render specific content types

**Examples**: `ContentText`, `ContentImage`, `ContentTweet`

## Props & Emits Pattern

### Prop Helpers

Use helper functions from `vue-props.ts` for type-safe props:

- `makeObjectProp<T>()`
- `makeStringProp<T>()`
- `makeNumberProp<T>()`
- `makeBooleanProp()`

### Domain Props

Use Vue `PropType` or the shared prop helpers to preserve the owning model's exact TypeScript type.
Extension components consume the canonical `InstalledExtension` contract exported by
`@inkcre/core`; they do not define a parallel UI model.

### Emit Validators

Define emits with payload validation:

- Emit the owning domain model when the consumer needs the changed state, not a reconstructed ID
- Use type-safe validators for event payloads

## Business Domain Organization

### Folder Structure

Components are grouped by business domain:

```
components/
├── client/          # Client-related components
├── extension/       # Extension management
├── info-base/       # Information base (blocks, relations)
├── obsrv/           # Observation/logging
├── source/          # Data sources
└── common/          # Shared utilities
```

### Naming Conventions

- Domain folders: lowercase, plural (e.g., `sources/`, )
- Component folders: camelCase (e.g., `sourceCard/`, `extensionForm/`)
- Files: match component name (e.g., `sourceCard.vue`, `sourceCard.ts`)

### Domain Boundaries

- Keep domain-specific logic within domain folders
- Use common/ for cross-domain utilities
- Import business classes from `@/business/` domain modules

**Last Updated**: January 2, 2026

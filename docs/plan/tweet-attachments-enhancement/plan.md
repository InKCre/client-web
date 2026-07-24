# Plan: Update Tweet Schema to Include Optional Attachments and Resolver Enhancement

## Overview

Update the Twitter extension to support tweet attachments (photos/videos) by:

1. Extending the `Tweet` schema with optional `attachments` field
2. Implementing `TweetResolver._getSolvedContent()` to fetch attachment data from relations
3. Implementing a resolver cache mechanism to avoid redundant network requests

## Current State Analysis

### Tweet Schema (`extensions/twitter/src/schema.ts`)

- **Current**: `TweetSchema` contains `id` (number), `user_id` (string), `text` (string)
- **Missing**: No attachment data structure in the schema
- **Media Types**: Already defines `TweetPhotoSchema` and `TweetVideoSchema` (with variants)

### TweetResolver (`extensions/twitter/src/resolver.ts`)

- **Current**: Stub implementation that parses raw JSON to Tweet object
- **Missing**: No attachment population from relations
- **Architecture**: Extends `Resolver<string, Tweet>` (raw=JSON string, solved=Tweet object)

### Relation System (`packages/core/src/info-base/relation.ts`)

- **Structure**: Relation has `from_`, `to_`, and `content` fields
- **Pattern**: Content contains relation type prefix (e.g., "attachment:photo", "attachment:video")
- **Query API**: `getByPattern()` method to filter relations by type
- **Direction**: For attachments, tweet block is the source (`from_`), so we need outgoing relation filtering

### Block System (`packages/core/src/info-base/block.ts`)

- **Timestamps**: Includes `created_at` and `updated_at` for cache invalidation
- **Resolver Access**: Each block has a resolver type specified in `resolver` field

### Resolver Base (`packages/core/src/info-base/resolvers/base.ts`)

- **Architecture**: Creates per-block instances with optional pre-loaded relations
- **Content Methods**: `getRawContent()`, `getSolvedContent()`, `_getSolvedContent()`
- **State Management**: Includes `solvedContentState` for loading/error tracking
- **Cleanup**: Has `dispose()` method for cleanup
- **Relations API**: `getRelations()` currently fetches both incoming and outgoing relations
  - **Enhancement Needed**: Add `includeIn` and `includeOut` parameters
  - For attachments, we only need outgoing relations (from tweet to attachment blocks)

## Proposed Changes

### 1. Update Tweet Schema (`extensions/twitter/src/schema.ts`)

**Changes:**

- Add `attachments` field as optional array of ObjectURLs (strings)
- ImageResolver and VideoResolver return ObjectURL (blob URLs)
- Attachments are stored as `string[]` of object URLs

```
export const TweetSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  text: z.string(),
  attachments: z.array(z.string()).optional(), // Array of ObjectURLs
})
```

### 2. Implement Resolver Cache System (`packages/core/src/info-base/resolvers/cache.ts`)

**Purpose**: Share resolver instances and avoid redundant content loading

**Design**:

- Global cache: Map of `{blockId -> { resolver, blockUpdatedAt }}`
- Validation: Check current block `updated_at` against cached `blockUpdatedAt`
- Expiration: Invalidate if `block.updated_at > cachedBlockUpdatedAt`
- Simplicity: No TTL, only timestamp-based invalidation

**Key Features**:

- Get or create resolver: `getResolver(block, relations?) -> Promise<Resolver>`
- Automatic cache invalidation on block updates
- Per-resolver block timestamp tracking for optimistic expiration checks

```typescript
// Usage in TweetResolver
const imageResolver = await ResolverCache.getResolver(imageBlock)
const imageSolved = await imageResolver.getSolvedContent() // Returns ObjectURL string
```

### 3. Implement TweetResolver (`extensions/twitter/src/resolver.ts`)

**Changes to `_getSolvedContent()`**:

1. Parse raw JSON to get tweet data
2. If `attachments` already populated, return Tweet as-is
3. Otherwise, fetch outgoing relations using `getRelations({ includeOut: true })`
4. Filter for `RELATION_ATTACHMENT_PHOTO` and `RELATION_ATTACHMENT_VIDEO` patterns
5. For each attachment relation:
   - Get the related block (from relation `to_` field)
   - Resolve attachment content using `ResolverCache`
   - Collect resolved ObjectURL strings
6. Populate `attachments` array with ObjectURL strings in Tweet object
7. Return complete Tweet with attachments

**Implementation Details**:

- Use enhanced `getRelations({ includeOut: true })` to get only outgoing attachment relations
- Filter relations by attachment pattern types
- Handle both photo and video attachment types
- Map resolved content (ObjectURLs) into attachments array
- Gracefully handle missing/invalid attachments

## Implementation Steps

### Phase 1: Schema Updates

1. Update `TweetSchema` to include optional `attachments` field as `string[]`
2. Update `Tweet` type exports

### Phase 2: Enhance Relation System

1. Update `getRelations()` in `packages/core/src/info-base/resolvers/base.ts`
2. Add parameters:
   - `includeIn?: boolean` - Include relations where block is `to_` (default: true)
   - `includeOut?: boolean` - Include relations where block is `from_` (default: true)
3. Filter logic: Only return relations matching the specified directions

### Phase 3: Resolver Cache

1. Create `cache.ts` in `packages/core/src/info-base/resolvers/`
2. Implement `ResolverCache` class with:
   - Global cache map: `{blockId -> { resolver, blockUpdatedAt }}`
   - `getResolver(block, relations?)` factory method
   - Timestamp-based invalidation: `block.updated_at > cachedBlockUpdatedAt`
   - Per-resolver block update timestamp tracking

### Phase 4: TweetResolver Enhancement

1. Implement `_getSolvedContent()` logic
2. Add relation fetching with direction filtering
3. Use `ResolverCache` for nested resolvers (ImageResolver, VideoResolver)
4. Handle edge cases (missing relations, invalid content)

## Trade-offs and Considerations

### Cache Strategy

- **Optimistic timestamp check**: Simple, avoids overcomplicated invalidation logic
- **Global vs. per-instance cache**: Global cache allows sharing across resolvers
- **Manual vs. automatic cleanup**: No automatic cleanup (assume reasonable block count)

### Type Safety

- Use Zod schemas for runtime validation
- Union types for attachment variants
- Type exports for consuming components

### Error Handling

- Graceful degradation if attachment resolution fails
- Partial attachments (some succeed, some fail)
- Logging for debugging attachment resolution issues

## Risk Assessment

- **Low Risk**: Schema changes are backward compatible (optional field)
- **Medium Risk**: Cache invalidation timing (timestamp precision)
- **Low Risk**: Relation direction filtering is straightforward query change
- **Medium Risk**: Circular dependencies in nested resolver calls (mitigated by cache)

## Success Criteria

1. ✅ Tweet schema includes optional attachments field
2. ✅ TweetResolver populates attachments from relations
3. ✅ Cache mechanism prevents duplicate resolver instantiation
4. ✅ No breaking changes to existing component APIs
5. ✅ All types properly exported and usable by components
6. ✅ Graceful error handling for missing/invalid attachments

## Files to Modify

- `extensions/twitter/src/schema.ts` - Add optional attachments field to Tweet schema
- `packages/core/src/info-base/resolvers/base.ts` - Enhance getRelations() with direction filtering
- `packages/core/src/info-base/resolvers/cache.ts` - Create new cache system
- `extensions/twitter/src/resolver.ts` - Implement attachment fetching logic with cache

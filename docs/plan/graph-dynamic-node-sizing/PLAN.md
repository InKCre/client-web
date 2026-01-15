# Graph Dynamic Node Sizing Implementation Plan

**Date:** January 15, 2026  
**Status:** Draft - Awaiting Approval 存在严重缺陷, read <https://gemini.google.com/u/1/app/d35719439cfd023e> for more

## Overview

Enable dynamic node sizing in the info-base graph visualization based on content, replacing fixed dimensions. The layout algorithms must adapt to prevent node overlaps.

## Current State Analysis

### Node Structure

**Component:** `BlockNode.vue`

- Currently uses fixed sizing via CSS:
  - `min-width: 120px`
  - `max-width: 200px`
  - `max-height: 150px`
- Content rendered by `BlockContent.vue` (resolver-based dynamic content)

**Data Flow:**

1. `Block` entities → `blockToNode()` → `BlockNode` (Vue Flow nodes)
2. Node dimensions fixed at 200×150 in layout configs (DEFAULT_NODE_WIDTH/HEIGHT)
3. Layouts (Dagre, Force, etc.) use hardcoded dimensions

### Layout Systems

**Dagre Layout** (`useDagreLayout.ts`):

- Currently reads `node.measured?.width` and `node.measured?.height`
- Falls back to `node.width/height` or defaults (200×80)
- Already has dynamic sizing support pattern

**Force Layout** (`useForceLayout.ts`):

- Uses `collideRadius: 150` - assumes max node size
- No per-node radius calculation
- Collision detection needs node-specific radii

**Other Layouts:**

- Circular, Radial, Grid: Use uniform spacing
- Don't directly depend on node dimensions

### Vue Flow Auto-Measurement

Vue Flow automatically measures node DOM elements and adds:

- `node.measured.width`
- `node.measured.height`
- `node.width` and `node.height` (after measurement)

This happens after initial render when `fit-view-on-init` is enabled.

## Implementation Strategy

### Phase 1: Enable Dynamic Node Sizing in DOM

**Goal:** Remove fixed dimensions, let content determine size

**Changes to BlockNode:**

1. **Remove CSS size constraints** in `BlockNode.scss`:
   - Remove `max-width: 200px`
   - Remove `max-height: 150px`
   - Keep `min-width: 120px` as safety baseline
   - Add `max-width: 400px` as reasonable upper bound

2. **Add proper content wrapping:**
   - Ensure BlockContent allows natural height expansion
   - Add `word-break: break-word` for long words
   - Consider `white-space: pre-wrap` for content

3. **Update padding/spacing:**
   - Review padding to ensure consistent sizing
   - May need to adjust for larger nodes

### Phase 2: Update Layout Algorithms

#### 2.1 Force Layout

**File:** `apps/client-web/src/composables/useForceLayout.ts`

**Changes:**

1. **Per-node collision radius:**

   ```typescript
   // Replace static collideRadius with dynamic calculation
   .force("collide", forceCollide<SimulationNode>()
     .radius((node) => {
       const vfNode = nodes.value.find(n => n.id === node.id);
       const width = vfNode?.measured?.width ?? vfNode?.width ?? 200;
       const height = vfNode?.measured?.height ?? vfNode?.height ?? 150;
       // Use diagonal/2 + padding for collision radius
       return Math.sqrt(width * width + height * height) / 2 + 20;
     })
     .strength(mergedConfig.collideStrength)
     .iterations(mergedConfig.collideIterations)
   )
   ```

2. **Update DEFAULT_FORCE_CONFIG:**
   - Change `collideRadius` to be a function or remove it
   - Adjust `chargeForce` if needed for larger nodes

3. **Handle remeasurement:**
   - When node size changes, restart simulation
   - Watch for `node.measured` changes

#### 2.2 Dagre Layout

**File:** `apps/client-web/src/composables/layouts/useDagreLayout.ts`

**Already supports dynamic sizing!**

- Line 47-48 already use `node.measured?.width` and `node.measured?.height`
- Just needs updated fallback defaults

**Changes:**

1. Update `DEFAULT_NODE_WIDTH` to 250 (reasonable average)
2. Update `DEFAULT_NODE_HEIGHT` to 120 (reasonable average)
3. Test edge routing with varying node sizes

#### 2.3 Other Layouts

**Circular/Radial Layouts:**

- Need to account for node size when calculating positions
- Add spacing adjustments based on max node dimensions

**Grid Layout:**

- Calculate cell size dynamically based on max node dimensions
- Add padding between cells

### Phase 3: Layout Configuration Updates

**File:** `packages/core/src/sink/graph/graph-types.ts`

**Changes:**

1. **Update DEFAULT_FORCE_CONFIG:**

   ```typescript
   export const DEFAULT_FORCE_CONFIG = {
     centerForce: 0.3,
     chargeForce: -1000, // Increase for larger nodes
     linkDistance: 300,  // Increase for larger nodes
     collideRadius: null, // Remove static value, use dynamic
     collideStrength: 1.0,
     collideIterations: 10,
     alphaDecay: 0.02,
     preWarmTicks: 300,
     maxIterations: 0,
   }
   ```

2. **Add node measurement utilities:**

   ```typescript
   export function getNodeDimensions(node: Node): { width: number; height: number } {
     return {
       width: node.measured?.width ?? node.width ?? 250,
       height: node.measured?.height ?? node.height ?? 120,
     };
   }

   export function getNodeCollisionRadius(node: Node): number {
     const { width, height } = getNodeDimensions(node);
     return Math.sqrt(width * width + height * height) / 2 + 20;
   }
   ```

### Phase 4: Reactive Size Updates

**Challenge:** Vue Flow measures nodes after initial render. Layouts may run before measurement completes.

**Solution:**

1. **Add measurement watcher** in `graph.vue`:

   ```typescript
   watch(
     () => allNodes.value.map(n => n.measured?.width + ',' + n.measured?.height).join('|'),
     (newVal, oldVal) => {
       if (newVal !== oldVal && layoutManager.effectiveLayout.value === LayoutType.Force) {
         // Restart force simulation when node sizes change
         layoutManager.forceLayout.restart();
       }
     }
   );
   ```

2. **Delay initial layout** until measurement:

   ```typescript
   // Wait for Vue Flow to measure nodes before applying layout
   watch(isLoading, (loading, wasLoading) => {
     if (!loading && wasLoading && allNodes.value.length > 0) {
       // Delay to allow Vue Flow measurement
       setTimeout(() => {
         if (selectedCommunityId.value === "all") {
           allCommunitiesLayout.applyLayout();
         } else {
           layoutManager.applyLayout();
         }
         setTimeout(() => fitView(fitViewOptions), 500);
       }, 100);
     }
   });
   ```

### Phase 5: Testing & Refinement

**Test Cases:**

1. **Varying content lengths:**
   - Short text blocks
   - Long multi-line content
   - Empty blocks

2. **Different resolvers:**
   - Text resolver (varying lengths)
   - Link resolver (with metadata)
   - Any other resolver types

3. **Layout algorithms:**
   - Force layout with mixed sizes
   - Dagre with very tall/wide nodes
   - Circular with varying sizes

4. **Performance:**
   - Large graphs (100+ nodes)
   - Rapid content changes
   - Drag performance with dynamic collisions

**Refinement Areas:**

1. **Visual polish:**
   - Ensure edges connect properly to varied node sizes
   - Handle selection/hover states with dynamic sizes
   - MiniMap representation

2. **Layout parameters:**
   - Tune spacing for optimal density
   - Adjust forces for stability
   - Balance readability vs. compactness

3. **Edge cases:**
   - Very large content (needs max-width limit)
   - Very small content (needs min-width)
   - Content with images/embeds

## Technical Considerations

### Vue Flow Measurement Timing

- Vue Flow measures nodes **after** initial render
- Layouts may execute before measurement
- Need to handle "remeasurement" when content changes
- Use `fit-view-on-init` to trigger measurement

### Performance Impact

- Dynamic collision radius calculation per tick (Force layout)
- More expensive than static radius
- Mitigate with:
  - Cache radius calculations
  - Use optimized Math.sqrt
  - Limit simulation iterations

### Content Size Constraints

- Need reasonable max-width to prevent oversized nodes
- Min-width prevents tiny unreadable nodes
- Balance between readability and graph density

### Layout Algorithm Compatibility

| Layout | Dynamic Size Support | Changes Needed |
|--------|---------------------|----------------|
| Dagre | ✅ Already supported | Update defaults |
| Force | ⚠️ Needs work | Dynamic collision |
| Circular | ⚠️ Needs work | Spacing adjustments |
| Radial | ⚠️ Needs work | Spacing adjustments |
| Grid | ⚠️ Needs work | Dynamic cell size |

## Implementation Order

1. ✅ **Exploration** - Understand current system (DONE)
2. 🔄 **Plan** - Create detailed plan (THIS DOCUMENT)
3. ⏳ **CSS Changes** - Enable dynamic sizing in BlockNode
4. ⏳ **Force Layout** - Implement dynamic collision
5. ⏳ **Dagre Updates** - Update defaults
6. ⏳ **Other Layouts** - Add size awareness
7. ⏳ **Core Utilities** - Add measurement helpers
8. ⏳ **Reactivity** - Handle size changes
9. ⏳ **Testing** - Comprehensive testing
10. ⏳ **Polish** - Refinement and optimization

## Open Questions

1. **Max node width limit?**
   - Proposal: 400px (2x current max)
   - Allows long content without breaking layout

2. **Min node width/height?**
   - Keep min-width: 120px
   - Add min-height: 60px?

3. **Content truncation?**
   - Should we truncate very long content in nodes?
   - Or let them grow with scrolling?

4. **Performance target?**
   - How many nodes should perform smoothly?
   - Current: ~100 nodes, Target: same

5. **Layout parameter tuning?**
   - Need to test different force strengths
   - May need different configs for size ranges

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance degradation | High | Medium | Cache calculations, limit iterations |
| Layout instability | High | Medium | Careful parameter tuning, testing |
| Edge routing issues | Medium | Medium | Test thoroughly, adjust Vue Flow configs |
| Breaking existing graphs | Low | Low | All changes are additive/refinements |

## Success Criteria

✅ Nodes size dynamically based on content  
✅ No overlapping nodes in any layout  
✅ Smooth performance with 100+ nodes  
✅ Proper edge routing to/from variable-sized nodes  
✅ Stable force simulation  
✅ All layouts work correctly

## Next Steps

1. **Get user approval** for this plan
2. **Start implementation** with CSS changes
3. **Iterate** on each layout algorithm
4. **Test thoroughly** with real data
5. **Document** any new patterns/utilities

---

**Questions for User:**

1. Do you approve this implementation approach?
2. Any concerns about the max-width limit (400px)?
3. Should we prioritize any specific layout algorithm?
4. Any specific content types/resolvers to focus on?

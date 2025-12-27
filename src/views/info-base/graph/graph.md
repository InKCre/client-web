# Info-Base Graph View

The info-base graph view provides an interactive visualization of blocks and their relations as a force-directed graph.

## Features

- **Force-Directed Layout**: Blocks are automatically positioned using a physics-based simulation that creates natural, organic layouts
- **Interactive Navigation**:
  - **Zoom**: Use mouse wheel to zoom in/out
  - **Pan**: Click and drag on empty canvas to pan around
  - **Select**: Click on any block to view its details
- **Details Panel**: Shows complete block information including metadata and rendered content
- **Resolver System**: Blocks are rendered using their specified resolver (text, markdown, etc.)

## Usage

Navigate to `/info-base/graph` to view the graph visualization.

### Interactions

1. **Viewing Block Details**
   - Click on any block node in the graph
   - A details panel will slide in from the right
   - View block ID, resolver, timestamps, and rendered content
   - Click the × button or press Escape to close the panel

2. **Navigating the Graph**
   - **Zoom In/Out**: Scroll mouse wheel
   - **Pan**: Click and drag on empty canvas areas
   - The graph will automatically position itself on load

3. **Understanding the Visualization**
   - **Nodes**: White rectangles represent blocks
   - **Edges**: Curved lines represent relations between blocks
   - **Labels**: Text on edges shows the relation content
   - **Selection**: Selected blocks have a blue border and stronger shadow

## Technical Details

### Components

- **graph.vue**: Main view component that orchestrates the visualization
- **GraphCanvas.vue**: Konva canvas component handling rendering and interactions
- **BlockNode.vue**: Individual block node renderer
- **RelationEdge.vue**: Relation edge renderer (curved lines with labels)
- **BlockDetailsPanel.vue**: Side panel for viewing block details

### Layout Algorithm

The graph uses **d3-force** for automatic layout with the following forces:

- **Link Force**: Connects related blocks with flexible links (distance: 150px)
- **Charge Force**: Repels blocks from each other (strength: -300)
- **Center Force**: Pulls the graph toward the canvas center
- **Collision Force**: Prevents blocks from overlapping (radius: 70px)

The simulation runs automatically on load and stops when the graph stabilizes (alpha < threshold).

### Resolver System

Blocks are rendered using the resolver system defined in `@/business/info-base/resolver.ts`:

- **TextResolver**: Default plain text rendering
- **MarkdownResolver**: Parses and renders markdown content
- Custom resolvers can be registered via plugins

In the graph:
- **Node Preview**: Shows first 30 characters using `resolver.preview()`
- **Details Panel**: Shows full content using `resolver.resolve()`

## Performance

The implementation includes optimizations for handling large graphs:

- Reactive state management with Vue 3 composition API
- Efficient Konva canvas rendering
- Automatic simulation stopping when stable
- Future: Viewport culling for very large graphs (>100 nodes)

## Future Enhancements

Potential improvements for future versions:

- **Edit Mode**: Create, update, and delete blocks and relations
- **Search/Filter**: Search for specific blocks
- **Export**: Save graph as SVG or PNG
- **Layout Options**: Choose between different layout algorithms
- **Minimap**: Overview of large graphs
- **Manual Positioning**: Drag nodes to custom positions
- **Relation Types**: Different visual styles for different relation types
- **Clustering**: Group related blocks visually

## Keyboard Shortcuts

- **Escape**: Close details panel

## Browser Compatibility

The graph view uses modern web technologies:

- Vue 3 (Composition API)
- Konva (HTML5 Canvas)
- d3-force (Force simulation)

Supported browsers: Latest versions of Chrome, Firefox, Safari, and Edge.

/**
 * Type definitions for BlockNode component
 */

/**
 * Node dimensions
 */
export const NODE_WIDTH = 120;
export const NODE_HEIGHT = 60;
export const NODE_CORNER_RADIUS = 8;

/**
 * Collision detection parameters
 * For rectangular nodes, we use the half-diagonal as collision radius
 * to ensure corners don't overlap with other nodes.
 */
export const NODE_PADDING = 10; // Spacing between nodes
export const NODE_STROKE_WIDTH = 3; // Max stroke width (when selected)

// Half-diagonal of the rectangle: √((width/2)² + (height/2)²)
const HALF_DIAGONAL = Math.sqrt((NODE_WIDTH / 2) ** 2 + (NODE_HEIGHT / 2) ** 2);

// Total collision radius includes half-diagonal + stroke + padding
export const NODE_COLLISION_RADIUS = Math.ceil(
  HALF_DIAGONAL + NODE_STROKE_WIDTH + NODE_PADDING
);

/**
 * Colors
 */
export const NODE_FILL = "#ffffff";
export const NODE_STROKE = "#cccccc";
export const NODE_STROKE_SELECTED = "#007bff";
export const NODE_TEXT_COLOR = "#333333";

/**
 * Shadows
 */
export const NODE_SHADOW_COLOR = "black";
export const NODE_SHADOW_BLUR = 5;
export const NODE_SHADOW_BLUR_SELECTED = 10;
export const NODE_SHADOW_OPACITY = 0.2;
export const NODE_SHADOW_OPACITY_SELECTED = 0.3;

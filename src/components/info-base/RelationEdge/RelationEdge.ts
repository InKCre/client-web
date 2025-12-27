/**
 * Type definitions and utilities for RelationEdge component
 */

import type { Point } from "@/utils/graph/graph-types";
import {
  NODE_WIDTH,
  NODE_HEIGHT,
} from "@/components/info-base/BlockNode/BlockNode";

/**
 * Colors and styling
 */
export const EDGE_STROKE = "#666666";
export const EDGE_STROKE_WIDTH = 2;
export const EDGE_TEXT_COLOR = "#666666";
export const EDGE_TEXT_FONT_SIZE = 11;
export const EDGE_TEXT_PADDING = 4;
export const EDGE_TEXT_BG = "#ffffff";

/**
 * Arrow configuration
 */
export const ARROW_POINTER_LENGTH = 10;
export const ARROW_POINTER_WIDTH = 8;
export const ARROW_FILL = "#666666";

/**
 * Curve configuration
 */
export const CURVE_OFFSET_RATIO = 0.15;

/**
 * Calculate the intersection point between a line from center to target
 * and a rectangular node boundary.
 *
 * @param center - Center point of the rectangle
 * @param target - Target point to connect to
 * @param halfWidth - Half width of the rectangle
 * @param halfHeight - Half height of the rectangle
 * @returns Intersection point on the rectangle boundary
 */
export function getRectangleEdgePoint(
  center: Point,
  target: Point,
  halfWidth: number,
  halfHeight: number
): Point {
  const dx = target.x - center.x;
  const dy = target.y - center.y;

  // Handle zero distance case
  if (dx === 0 && dy === 0) {
    return { x: center.x + halfWidth, y: center.y };
  }

  // Calculate the intersection with rectangle edges
  // We need to find where the line from center to target intersects the rectangle
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let t: number;

  // Determine which edge is intersected first
  if (absDx * halfHeight > absDy * halfWidth) {
    // Intersects left or right edge
    t = halfWidth / absDx;
  } else {
    // Intersects top or bottom edge
    t = halfHeight / absDy;
  }

  return {
    x: center.x + dx * t,
    y: center.y + dy * t,
  };
}

/**
 * Calculate edge endpoints that connect at node boundaries
 * for the shortest visual path.
 *
 * @param fromCenter - Center of source node
 * @param toCenter - Center of target node
 * @returns Object with adjusted from and to points on node boundaries
 */
export function getEdgeEndpoints(
  fromCenter: Point,
  toCenter: Point
): { from: Point; to: Point } {
  const halfWidth = NODE_WIDTH / 2;
  const halfHeight = NODE_HEIGHT / 2;

  const from = getRectangleEdgePoint(
    fromCenter,
    toCenter,
    halfWidth,
    halfHeight
  );
  const to = getRectangleEdgePoint(toCenter, fromCenter, halfWidth, halfHeight);

  return { from, to };
}

/**
 * Calculate control point for quadratic bezier curve
 * Creates a slight curve perpendicular to the line between from and to
 *
 * @param from - Start point (on node boundary)
 * @param to - End point (on node boundary)
 * @returns Control point for bezier curve
 */
export function getControlPoint(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Perpendicular offset for curve
  const offsetX = -dy * CURVE_OFFSET_RATIO;
  const offsetY = dx * CURVE_OFFSET_RATIO;

  return {
    x: (from.x + to.x) / 2 + offsetX,
    y: (from.y + to.y) / 2 + offsetY,
  };
}

/**
 * Calculate midpoint of quadratic bezier curve for label placement
 *
 * @param from - Start point
 * @param control - Control point
 * @param to - End point
 * @returns Midpoint on the bezier curve (t=0.5)
 */
export function getBezierMidpoint(
  from: Point,
  control: Point,
  to: Point
): Point {
  const t = 0.5;
  const mt = 1 - t;

  return {
    x: mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x,
    y: mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y,
  };
}

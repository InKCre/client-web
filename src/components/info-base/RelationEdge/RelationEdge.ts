/**
 * Type definitions and utilities for RelationEdge component
 */

import type { Point } from "@/utils/graph/graph-types";

/**
 * Colors and styling
 */
export const EDGE_STROKE = "#999999";
export const EDGE_STROKE_WIDTH = 2;
export const EDGE_TEXT_COLOR = "#666666";
export const EDGE_TEXT_FONT_SIZE = 11;
export const EDGE_TEXT_PADDING = 4;
export const EDGE_TEXT_BG = "#ffffff";

/**
 * Calculate control point for quadratic bezier curve
 * Creates a curve that bends perpendicular to the line between from and to
 *
 * @param from - Start point
 * @param to - End point
 * @returns Control point for bezier curve
 */
export function getControlPoint(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Perpendicular offset for curve (20% of distance)
  const offsetX = -dy * 0.2;
  const offsetY = dx * 0.2;

  return {
    x: (from.x + to.x) / 2 + offsetX,
    y: (from.y + to.y) / 2 + offsetY,
  };
}

/**
 * Calculate midpoint of bezier curve for label placement
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

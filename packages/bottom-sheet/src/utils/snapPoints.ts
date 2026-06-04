import type { SnapPoint } from '../types';

/**
 * Converts snap points (% strings or pixel numbers) into translateY pixel
 * values relative to screenHeight.
 *
 * e.g. '50%' with screenHeight=800 → translateY=400 (sheet half visible)
 * Returns sorted ascending (smallest = most-open, largest = most-closed).
 */
export function resolveSnapPoints(
  snapPoints: SnapPoint[],
  screenHeight: number,
): number[] {
  const resolved = snapPoints.map((point) => {
    if (typeof point === 'string') {
      const pct = parseFloat(point) / 100;
      return Math.round(screenHeight * (1 - pct));
    }
    return Math.round(screenHeight - point);
  });

  // Ascending: index 0 = most open (lowest translateY), last = most closed
  return [...new Set(resolved)].sort((a, b) => a - b);
}

/** Find the closest snap Y position to the given value */
export function findClosestSnap(
  snapPositions: number[],
  value: number,
): number {
  'worklet';
  let closestIndex = 0;
  let minDist = Math.abs(snapPositions[0]! - value);
  for (let i = 1; i < snapPositions.length; i++) {
    const dist = Math.abs(snapPositions[i]! - value);
    if (dist < minDist) {
      minDist = dist;
      closestIndex = i;
    }
  }
  return snapPositions[closestIndex]!;
}

/** Find index of snap position closest to the given translateY */
export function findSnapIndex(
  snapPositions: number[],
  value: number,
): number {
  'worklet';
  let closestIndex = 0;
  let minDist = Math.abs(snapPositions[0]! - value);
  for (let i = 1; i < snapPositions.length; i++) {
    const dist = Math.abs(snapPositions[i]! - value);
    if (dist < minDist) {
      minDist = dist;
      closestIndex = i;
    }
  }
  return closestIndex;
}

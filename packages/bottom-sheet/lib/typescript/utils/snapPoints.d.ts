import type { SnapPoint } from '../types';
/**
 * Converts snap points (% strings or pixel numbers) into translateY pixel
 * values relative to screenHeight.
 *
 * e.g. '50%' with screenHeight=800 → translateY=400 (sheet half visible)
 * Returns sorted ascending (smallest = most-open, largest = most-closed).
 */
export declare function resolveSnapPoints(snapPoints: SnapPoint[], screenHeight: number): number[];
/** Find the closest snap Y position to the given value */
export declare function findClosestSnap(snapPositions: number[], value: number): number;
/** Find index of snap position closest to the given translateY */
export declare function findSnapIndex(snapPositions: number[], value: number): number;
//# sourceMappingURL=snapPoints.d.ts.map
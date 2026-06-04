import { useRef } from 'react';
import type { BottomSheetMethods } from '../types';

/**
 * Returns a ref to attach to <BottomSheet ref={bottomSheetRef} />.
 * Use bottomSheetRef.current?.snapToIndex(n), .close(), .expand(), .collapse()
 */
export function useBottomSheet() {
  return useRef<BottomSheetMethods>(null);
}

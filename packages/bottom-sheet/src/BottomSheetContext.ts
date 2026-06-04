import { createContext, useContext } from 'react';
import type { BottomSheetContextType } from './types';

export const BottomSheetContext = createContext<BottomSheetContextType | null>(
  null,
);

export const useBottomSheetInternal = (): BottomSheetContextType => {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) {
    throw new Error(
      'useBottomSheetInternal must be used inside a <BottomSheet>',
    );
  }
  return ctx;
};

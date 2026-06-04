import React, { forwardRef, useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useBottomSheetInternal } from '../BottomSheetContext';
import type { BottomSheetScrollViewProps } from '../types';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

const BottomSheetScrollView = forwardRef<ScrollView, BottomSheetScrollViewProps>(
  (props, ref) => {
    const { scrollLocked, scrollY } = useBottomSheetInternal();

    const [scrollEnabled, setScrollEnabled] = useState(true);

    useAnimatedReaction(
      () => scrollLocked.value,
      (locked) => {
        runOnJS(setScrollEnabled)(!locked);
      },
    );

    const onScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.value = e.nativeEvent.contentOffset.y;
        props.onScroll?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [scrollY],
    );

    return (
      <ScrollView
        ref={ref}
        {...props}
        scrollEnabled={scrollEnabled}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />
    );
  },
);

BottomSheetScrollView.displayName = 'BottomSheetScrollView';

export { BottomSheetScrollView };

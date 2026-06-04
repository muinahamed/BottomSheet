import React, { forwardRef, useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useBottomSheetInternal } from '../BottomSheetContext';
import type { BottomSheetFlatListProps } from '../types';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

function BottomSheetFlatListInner<T>(
  props: BottomSheetFlatListProps<T>,
  ref: React.ForwardedRef<FlatList<T>>,
) {
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
    <FlatList
      ref={ref}
      {...props}
      scrollEnabled={scrollEnabled}
      onScroll={onScroll}
      scrollEventThrottle={16}
      bounces={false}
    />
  );
}

const BottomSheetFlatList = forwardRef(BottomSheetFlatListInner) as <T>(
  props: BottomSheetFlatListProps<T> & { ref?: React.Ref<FlatList<T>> },
) => React.ReactElement;

(BottomSheetFlatList as React.FC).displayName = 'BottomSheetFlatList';

export { BottomSheetFlatList };

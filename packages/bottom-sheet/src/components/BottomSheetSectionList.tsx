import React, { forwardRef, useCallback, useState } from 'react';
import { SectionList } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useBottomSheetInternal } from '../BottomSheetContext';
import type { BottomSheetSectionListProps } from '../types';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

function BottomSheetSectionListInner<ItemT, SectionT>(
  props: BottomSheetSectionListProps<ItemT, SectionT>,
  ref: React.ForwardedRef<SectionList<ItemT, SectionT>>,
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
    <SectionList
      ref={ref}
      {...props}
      scrollEnabled={scrollEnabled}
      onScroll={onScroll}
      scrollEventThrottle={16}
      bounces={false}
    />
  );
}

const BottomSheetSectionList = forwardRef(BottomSheetSectionListInner) as <
  ItemT,
  SectionT,
>(
  props: BottomSheetSectionListProps<ItemT, SectionT> & {
    ref?: React.Ref<SectionList<ItemT, SectionT>>;
  },
) => React.ReactElement;

(BottomSheetSectionList as React.FC).displayName = 'BottomSheetSectionList';

export { BottomSheetSectionList };

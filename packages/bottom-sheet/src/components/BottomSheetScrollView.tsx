import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useBottomSheetInternal } from '../BottomSheetContext';
import { findClosestSnap, findSnapIndex } from '../utils/snapPoints';
import type { BottomSheetScrollViewProps } from '../types';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

const SPRING_CONFIG = {
  damping: 30,
  stiffness: 300,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};
const CLOSE_VELOCITY_THRESHOLD = 500;

const BottomSheetScrollView = forwardRef<ScrollView, BottomSheetScrollViewProps>(
  (props, ref) => {
    const {
      scrollLocked,
      scrollY,
      animatedPosition,
      animatedIndex,
      snapPositions,
      closedY,
      enablePanDownToClose,
      onIndexChange,
    } = useBottomSheetInternal();

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

    // Track where the sheet was when this gesture started
    const panStartY = useSharedValue(0);
    // Whether this gesture is driving the sheet (vs. scrolling the content)
    const isDrivingSheet = useSharedValue(false);

    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .onStart(() => {
            panStartY.value = animatedPosition.value;
            isDrivingSheet.value = false;
          })
          .onUpdate(({ translationY }) => {
            // Only take over sheet movement when scroll is at the very top
            // and the user is dragging downward
            if (scrollY.value <= 0 && translationY > 0) {
              isDrivingSheet.value = true;
              scrollLocked.value = true;
              animatedPosition.value = panStartY.value + translationY;
            }
          })
          .onEnd(({ velocityY }) => {
            if (!isDrivingSheet.value) return;
            isDrivingSheet.value = false;

            const positions = snapPositions.value;
            const current = animatedPosition.value;
            const cY = closedY.value;

            // Fast fling down → close immediately
            if (enablePanDownToClose.value && velocityY > CLOSE_VELOCITY_THRESHOLD) {
              animatedPosition.value = withSpring(cY, SPRING_CONFIG, (finished) => {
                if (finished) {
                  runOnJS(onIndexChange)(-1);
                  scrollLocked.value = false;
                }
              });
              return;
            }

            const projected = current + velocityY * 0.12;
            const lastSnap = positions[positions.length - 1] ?? cY;

            // Slow drag past the last snap point → close
            if (enablePanDownToClose.value && projected > lastSnap + 80) {
              animatedPosition.value = withSpring(cY, SPRING_CONFIG, (finished) => {
                if (finished) {
                  runOnJS(onIndexChange)(-1);
                  scrollLocked.value = false;
                }
              });
            } else {
              // Snap to nearest position
              const target = findClosestSnap(positions, projected);
              const idx = findSnapIndex(positions, target);
              animatedPosition.value = withSpring(target, SPRING_CONFIG, (finished) => {
                if (finished) {
                  runOnJS(onIndexChange)(idx);
                  scrollLocked.value = animatedPosition.value > (positions[0] ?? cY);
                }
              });
            }
          })
          .activeOffsetY([-8, 8])
          .failOffsetX([-15, 15]),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [animatedPosition, panStartY, isDrivingSheet, scrollY, scrollLocked,
       snapPositions, closedY, enablePanDownToClose, onIndexChange, animatedIndex],
    );

    // Native gesture lets the scroll view and pan run simultaneously
    const nativeGesture = useMemo(() => Gesture.Native(), []);
    const composed = useMemo(
      () => Gesture.Simultaneous(nativeGesture, panGesture),
      [nativeGesture, panGesture],
    );

    return (
      <GestureDetector gesture={composed}>
        <ScrollView
          ref={ref}
          {...props}
          scrollEnabled={scrollEnabled}
          onScroll={onScroll}
          scrollEventThrottle={16}
          bounces={false}
        />
      </GestureDetector>
    );
  },
);

BottomSheetScrollView.displayName = 'BottomSheetScrollView';

export { BottomSheetScrollView };

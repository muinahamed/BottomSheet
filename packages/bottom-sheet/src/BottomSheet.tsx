import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import { BottomSheetContext } from './BottomSheetContext';
import { resolveSnapPoints, findClosestSnap, findSnapIndex } from './utils/snapPoints';
import type { BottomSheetMethods, BottomSheetProps } from './types';

const SPRING_CONFIG = {
  damping: 30,
  stiffness: 300,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const CLOSE_VELOCITY_THRESHOLD = 500; // px/s — fast fling down closes sheet

const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(
  (props, ref) => {
    const {
      children,
      snapPoints: snapPointsProp = ['50%'],
      initialSnapIndex = 0,
      enablePanDownToClose = true,
      enableDynamicSizing = false,
      maxDynamicContentSize,
      enableBackdrop = true,
      backdropOpacity = 0.5,
      backdropPressBehavior = 'close',
      handleComponent,
      enableHandleIndicator = true,
      handleHeight = 28,
      bottomInset = 0,
      style,
      backgroundStyle,
      handleIndicatorStyle,
      onChange,
      onClose,
      onOpen,
    } = props;

    const { height: screenHeight } = useWindowDimensions();

    // ─── Snap positions (translateY values, ascending = most-open → most-closed) ──
    const [dynamicContentHeight, setDynamicContentHeight] = useState(0);

    const snapPositions = useMemo<number[]>(() => {
      if (enableDynamicSizing && dynamicContentHeight > 0) {
        const h = maxDynamicContentSize
          ? Math.min(dynamicContentHeight, maxDynamicContentSize)
          : dynamicContentHeight;
        return [Math.round(screenHeight - h)];
      }
      return resolveSnapPoints(snapPointsProp, screenHeight);
    }, [
      enableDynamicSizing,
      dynamicContentHeight,
      maxDynamicContentSize,
      snapPointsProp,
      screenHeight,
    ]);

    const closedY = screenHeight;
    // Most-open position is index 0 (smallest translateY)
    const mostOpenY = snapPositions[0] ?? closedY;
    // Clamp initial index
    const clampedInitial = Math.min(
      Math.max(initialSnapIndex, 0),
      snapPositions.length - 1,
    );

    // ─── Shared values ─────────────────────────────────────────────────────────
    const translateY = useSharedValue(closedY);
    const prevTranslateY = useSharedValue(closedY);
    const animatedIndex = useSharedValue(-1);
    const scrollY = useSharedValue(0);
    const scrollLocked = useSharedValue(true);
    const animatedContentHeight = useSharedValue(0);
    const isOpened = useRef(false);

    // SharedValue so gesture/animation worklets on the UI thread can read it
    const snapPositionsShared = useSharedValue<number[]>(snapPositions);
    snapPositionsShared.value = snapPositions;

    // ─── Stable prop refs — lets worklet callbacks stay stable across renders ──
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const onOpenRef = useRef(onOpen);
    onOpenRef.current = onOpen;

    // ─── JS callbacks ─────────────────────────────────────────────────────────
    const onChangeJS = useCallback(
      (index: number) => {
        animatedIndex.value = index;
        onChangeRef.current?.(index);
        if (index === -1) {
          onCloseRef.current?.();
        }
      },
      [animatedIndex],
    );

    const onOpenJS = useCallback(() => {
      onOpenRef.current?.();
    }, []);

    const snapToPositionWorklet = useCallback(
      (toY: number) => {
        'worklet';
        translateY.value = withSpring(toY, SPRING_CONFIG, (finished) => {
          if (finished) {
            const positions = snapPositionsShared.value;
            const idx = findSnapIndex(positions, toY);
            const resolvedIndex = toY >= closedY ? -1 : idx;
            runOnJS(onChangeJS)(resolvedIndex);
            scrollLocked.value = toY > (positions[0] ?? closedY);
          }
        });
        prevTranslateY.value = toY;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [translateY, prevTranslateY, scrollLocked, closedY, snapPositionsShared],
    );

    // ─── Imperative handle ────────────────────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        snapToIndex(index: number) {
          const clamped = Math.max(0, Math.min(index, snapPositions.length - 1));
          snapToPositionWorklet(snapPositions[clamped] ?? closedY);
        },
        close() {
          snapToPositionWorklet(closedY);
        },
        expand() {
          snapToPositionWorklet(snapPositions[0] ?? closedY);
        },
        collapse() {
          const lastIdx = snapPositions.length - 1;
          snapToPositionWorklet(snapPositions[lastIdx] ?? closedY);
        },
      }),
      [snapPositions, closedY, snapToPositionWorklet],
    );

    // ─── Open on mount ────────────────────────────────────────────────────────
    useEffect(() => {
      if (
        enableDynamicSizing
          ? dynamicContentHeight > 0
          : snapPositions.length > 0
      ) {
        if (!isOpened.current) {
          isOpened.current = true;
          const targetY = snapPositions[clampedInitial] ?? closedY;
          const openSnap = snapPositions[0] ?? closedY;
          translateY.value = withSpring(targetY, SPRING_CONFIG, (finished) => {
            if (finished) {
              runOnJS(onChangeJS)(clampedInitial);
              scrollLocked.value = targetY > openSnap;
              if (targetY < closedY) {
                runOnJS(onOpenJS)();
              }
            }
          });
          prevTranslateY.value = targetY;
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [snapPositions, dynamicContentHeight]);

    // ─── Dynamic sizing layout ────────────────────────────────────────────────
    const onContentLayout = useCallback(
      (e: LayoutChangeEvent) => {
        if (!enableDynamicSizing) return;
        const h = e.nativeEvent.layout.height;
        if (h > 0 && h !== dynamicContentHeight) {
          setDynamicContentHeight(h + handleHeight + bottomInset);
        }
      },
      [enableDynamicSizing, dynamicContentHeight, handleHeight, bottomInset],
    );

    // ─── Pan gesture ──────────────────────────────────────────────────────────
    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .onStart(() => {
            prevTranslateY.value = translateY.value;
          })
          .onUpdate(({ translationY }) => {
            const next = prevTranslateY.value + translationY;
            const positions = snapPositionsShared.value;
            const maxOpen = positions[0] ?? closedY;

            if (next < maxOpen) {
              const overscroll = maxOpen - next;
              translateY.value = maxOpen - overscroll * 0.18;
            } else {
              translateY.value = next;
            }

            scrollLocked.value = translateY.value > maxOpen + 2;
          })
          .onEnd(({ velocityY }) => {
            const positions = snapPositionsShared.value;
            const current = translateY.value;

            if (enablePanDownToClose && velocityY > CLOSE_VELOCITY_THRESHOLD) {
              snapToPositionWorklet(closedY);
              return;
            }

            const projected = current + velocityY * 0.12;
            const target = findClosestSnap(positions, projected);

            if (
              enablePanDownToClose &&
              projected > (positions[positions.length - 1] ?? closedY) + 80
            ) {
              snapToPositionWorklet(closedY);
            } else {
              snapToPositionWorklet(target);
            }
          })
          .activeOffsetY([-8, 8])
          .failOffsetX([-15, 15]),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [closedY, enablePanDownToClose, snapPositionsShared, snapToPositionWorklet, translateY, prevTranslateY, scrollLocked],
    );

    // ─── Animated styles ──────────────────────────────────────────────────────
    const sheetAnimStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropAnimStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        translateY.value,
        [closedY, mostOpenY],
        [0, backdropOpacity],
        Extrapolation.CLAMP,
      );
      return {
        opacity,
        pointerEvents: translateY.value >= closedY ? 'none' : 'auto',
      };
    });

    // ─── Backdrop press ───────────────────────────────────────────────────────
    const backdropTap = useMemo(
      () =>
        Gesture.Tap().onEnd(() => {
          if (backdropPressBehavior === 'close') {
            snapToPositionWorklet(closedY);
          } else if (backdropPressBehavior === 'collapse') {
            const positions = snapPositionsShared.value;
            const last = positions[positions.length - 1] ?? closedY;
            snapToPositionWorklet(last);
          }
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [backdropPressBehavior, closedY, snapPositionsShared, snapToPositionWorklet],
    );

    // ─── Render ───────────────────────────────────────────────────────────────
    const contextValue = useMemo(
      () => ({
        animatedPosition: translateY,
        animatedIndex,
        scrollY,
        scrollLocked,
        animatedContentHeight,
      }),
      [translateY, animatedIndex, scrollY, scrollLocked, animatedContentHeight],
    );

    // Sheet height: from its top snap to bottom of screen
    const sheetHeight = screenHeight - mostOpenY + handleHeight;

    return (
      <BottomSheetContext.Provider value={contextValue}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop */}
          {enableBackdrop && (
            <GestureDetector gesture={backdropTap}>
              <Animated.View
                style={[StyleSheet.absoluteFill, styles.backdrop, backdropAnimStyle]}
              />
            </GestureDetector>
          )}

          {/* Sheet */}
          <Animated.View
            style={[
              styles.sheet,
              { height: sheetHeight, top: mostOpenY },
              backgroundStyle,
              style,
              sheetAnimStyle,
            ]}
          >
            {/* Handle area — full-width pan target */}
            <GestureDetector gesture={panGesture}>
              <View style={[styles.handleContainer, { height: handleHeight }]}>
                {handleComponent ?? (
                  enableHandleIndicator && (
                    <View style={[styles.handleIndicator, handleIndicatorStyle]} />
                  )
                )}
              </View>
            </GestureDetector>

            {/* Content */}
            <View
              style={styles.contentContainer}
              onLayout={onContentLayout}
            >
              {children}
            </View>

            {bottomInset > 0 && <View style={{ height: bottomInset }} />}
          </Animated.View>
        </View>
      </BottomSheetContext.Provider>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';

export { BottomSheet, GestureHandlerRootView };

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    // Elevation / shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  contentContainer: {
    flex: 1,
  },
});

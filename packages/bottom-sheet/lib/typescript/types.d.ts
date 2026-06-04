import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, FlatListProps, SectionListProps, ScrollViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
export type SnapPoint = `${number}%` | number;
export interface BottomSheetMethods {
    /** Expand to specific snap index (0 = first/smallest, length-1 = largest) */
    snapToIndex: (index: number) => void;
    /** Close the sheet fully */
    close: () => void;
    /** Expand to the maximum snap point */
    expand: () => void;
    /** Collapse to the minimum snap point */
    collapse: () => void;
}
export interface BottomSheetProps {
    children?: ReactNode;
    /** Array of snap points. e.g. ['30%', '60%', '90%'] or [300, 500] */
    snapPoints?: SnapPoint[];
    /** Index within snapPoints to open at. Default 0 */
    initialSnapIndex?: number;
    /** Allow sheet to be closed by dragging past last snap point */
    enablePanDownToClose?: boolean;
    /** Whether to auto-measure children height (ignores snapPoints when true) */
    enableDynamicSizing?: boolean;
    /** Max height when using dynamic sizing */
    maxDynamicContentSize?: number;
    /** Whether the backdrop is rendered */
    enableBackdrop?: boolean;
    /** Backdrop opacity 0-1. Default 0.5 */
    backdropOpacity?: number;
    /** Tap backdrop to close */
    backdropPressBehavior?: 'close' | 'collapse' | 'none';
    /** Custom handle component */
    handleComponent?: ReactNode;
    /** Hide the default handle indicator */
    enableHandleIndicator?: boolean;
    /** Handle container height. Default 24 */
    handleHeight?: number;
    /** Extra padding at the bottom of the sheet (safe area) */
    bottomInset?: number;
    /** Style for the container behind the handle + children */
    style?: StyleProp<ViewStyle>;
    /** Style for the background of the sheet */
    backgroundStyle?: StyleProp<ViewStyle>;
    /** Style for the handle indicator pill */
    handleIndicatorStyle?: StyleProp<ViewStyle>;
    /** Called when snap index changes */
    onChange?: (index: number) => void;
    /** Called when fully closed */
    onClose?: () => void;
    /** Called when sheet is opened / first shown */
    onOpen?: () => void;
}
export interface BottomSheetContextType {
    /** Current translateY shared value */
    animatedPosition: SharedValue<number>;
    /** Whether the sheet is being dragged */
    animatedIndex: SharedValue<number>;
    /** Internal scroll Y for coordinating sheet pan + scroll */
    scrollY: SharedValue<number>;
    /** Whether nested scrollables should be locked */
    scrollLocked: SharedValue<boolean>;
    /** Animated sheet height (for dynamic sizing) */
    animatedContentHeight: SharedValue<number>;
}
export interface BottomSheetScrollViewProps extends ScrollViewProps {
    children?: ReactNode;
}
export interface BottomSheetFlatListProps<T> extends FlatListProps<T> {
}
export interface BottomSheetSectionListProps<T, S> extends SectionListProps<T, S> {
}
//# sourceMappingURL=types.d.ts.map
import React, { useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  BottomSheet,
  BottomSheetScrollView,
  GestureHandlerRootView,
  useBottomSheet,
} from '@lyxa/bottom-sheet';

const ITEMS = Array.from({ length: 60 }, (_, i) => `Item ${i + 1}`);

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Demo />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Demo() {
  const sheetRef = useBottomSheet();

  const open = useCallback(() => sheetRef.current?.expand(), [sheetRef]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>@lyxa/bottom-sheet</Text>
      <Text style={styles.subtitle}>Tap below to open the sheet</Text>

      <TouchableOpacity style={styles.button} onPress={open}>
        <Text style={styles.buttonText}>Open Sheet</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => sheetRef.current?.snapToIndex(1)}
      >
        <Text style={styles.buttonText}>Snap to 50%</Text>
      </TouchableOpacity>

      <BottomSheet
        ref={sheetRef}
        snapPoints={['30%', '60%', '90%']}
        initialSnapIndex={1}
        enablePanDownToClose={true}
        // enableBackdrop
        backdropOpacity={0.4}
        backdropPressBehavior="close"
        onChange={index => console.log('Snap index:', index)}
        onClose={() => console.log('Closed')}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Your Sheet</Text>
          <Text style={styles.sheetSub}>
            Drag the handle or swipe down to dismiss
          </Text>
        </View>

        <BottomSheetScrollView contentContainerStyle={styles.list}>
          {ITEMS.map(item => (
            <View key={item} style={styles.listItem}>
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: 200,
    alignItems: 'center',
  },
  buttonSecondary: { backgroundColor: '#7C3AED' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  sheetHeader: { paddingHorizontal: 20, paddingBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  sheetSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  listItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listItemText: { fontSize: 15, color: '#374151' },
});

export default App;

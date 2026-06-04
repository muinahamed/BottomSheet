const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const packagesDir = path.resolve(projectRoot, 'packages');

const config = {
  watchFolders: [packagesDir],
  resolver: {
    sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json'],
    // Ensure workspace package files resolve peer deps from the root node_modules
    nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
    extraNodeModules: {
      'react': path.resolve(projectRoot, 'node_modules/react'),
      'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
      'react-native-reanimated': path.resolve(projectRoot, 'node_modules/react-native-reanimated'),
      'react-native-gesture-handler': path.resolve(projectRoot, 'node_modules/react-native-gesture-handler'),
      'react-native-safe-area-context': path.resolve(projectRoot, 'node_modules/react-native-safe-area-context'),
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        // Required for Reanimated worklets — ensures shared values and
        // worklet closures are evaluated lazily on the UI thread
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);

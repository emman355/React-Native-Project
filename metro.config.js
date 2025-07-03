import { getDefaultConfig } from 'expo/metro-config';

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.assetExts.push('svg');

defaultConfig.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

export default defaultConfig;
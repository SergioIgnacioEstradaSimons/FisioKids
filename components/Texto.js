import { Text, StyleSheet } from 'react-native';

// Text con la fuente Plus Jakarta Sans. Convierte fontWeight en la familia correcta.
const FAMILIAS = {
  '400': 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
};

export const familiaDe = (peso) => FAMILIAS[String(peso ?? '400')] ?? FAMILIAS['400'];

export default function Texto({ style, ...props }) {
  const { fontWeight, ...resto } = StyleSheet.flatten(style) || {};
  return <Text {...props} style={[{ fontFamily: familiaDe(fontWeight) }, resto]} />;
}

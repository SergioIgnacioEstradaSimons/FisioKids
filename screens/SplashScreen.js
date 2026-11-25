import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Texto from '../components/Texto';
import { colores, degradadoSplash } from '../tema';

export default function PantallaSplash() {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={degradadoSplash} style={[estilos.fondo, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={estilos.centro}>
        <View style={estilos.logo}>
          <Image source={require('../assets/splash-icon-light.png')} style={estilos.imagen} resizeMode="contain" />
        </View>
        <Texto style={estilos.marca}>
          Fisio<Texto style={{ color: colores.menta }}>Kids</Texto>
        </Texto>
        <Texto style={estilos.sub}>Sistema de gestión de atención infantil</Texto>
        <ActivityIndicator color={colores.menta} size="large" style={estilos.cargando} />
      </View>
      <Texto style={[estilos.pie, { bottom: insets.bottom + 24 }]}>Atención que impulsa su futuro</Texto>
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centro: { alignItems: 'center', paddingHorizontal: 32 },
  logo: {
    width: 118,
    height: 118,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagen: { width: 88, height: 88 },
  marca: { fontSize: 34, fontWeight: '800', color: '#fff', marginTop: 18 },
  sub: { color: '#BFE3E6', fontSize: 13, marginTop: 8, textAlign: 'center' },
  cargando: { marginTop: 40 },
  pie: { position: 'absolute', color: '#BFE3E6', fontSize: 12 },
});

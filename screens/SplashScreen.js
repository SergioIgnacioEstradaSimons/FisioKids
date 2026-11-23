import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import { colores, degradadoSplash } from '../tema';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    // Jornada 3/4: aquí se revisará si ya hay una sesión guardada
    const t = setTimeout(() => navigation.replace('Login'), 1800);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <LinearGradient colors={degradadoSplash} style={estilos.fondo}>
      <View style={estilos.centro}>
        <View style={estilos.logo}><Feather name="activity" size={36} color={colores.menta} /></View>
        <Texto style={estilos.marca}>Fisio<Texto style={{ color: colores.menta }}>Kids</Texto></Texto>
        <Texto style={estilos.sub}>Sistema de gestión de atención infantil</Texto>
        <Texto style={estilos.puntos}>• • •</Texto>
      </View>
      <Texto style={estilos.pie}>Atención que impulsa su futuro</Texto>
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centro: { alignItems: 'center' },
  logo: { width: 76, height: 76, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  marca: { fontSize: 34, fontWeight: '800', color: '#fff', marginTop: 16 },
  sub: { color: '#BFE3E6', fontSize: 13, marginTop: 8 },
  puntos: { color: 'rgba(255,255,255,0.5)', fontSize: 18, letterSpacing: 4, marginTop: 40 },
  pie: { position: 'absolute', bottom: 40, color: '#BFE3E6', fontSize: 12 },
});

import { TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto from './Texto';
import { colores, degradadoBoton } from '../tema';

// Botón flotante con degradado (Agregar niño / profesional / sala)
export default function Fab({ texto, onPress }) {
  return (
    <TouchableOpacity style={estilos.caja} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={degradadoBoton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={estilos.fab}>
        <Feather name="plus" size={18} color="#fff" />
        <Texto style={estilos.texto}>{texto}</Texto>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  caja: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28, elevation: 5, shadowColor: colores.azul, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  fab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 28 },
  texto: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 },
});

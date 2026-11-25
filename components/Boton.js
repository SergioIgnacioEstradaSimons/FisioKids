import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto from './Texto';
import { colores, degradadoBoton } from '../tema';

// variantes: primario (degradado), secundario (borde), peligro (rojo suave)
export default function Boton({ texto, onPress, variante = 'primario', icono, style, deshabilitado }) {
  const color = variante === 'primario' ? '#fff' : variante === 'peligro' ? colores.error : colores.texto;
  const contenido = (
    <View style={estilos.fila}>
      {icono ? <Feather name={icono} size={16} color={color} style={{ marginRight: 8 }} /> : null}
      <Texto style={[estilos.texto, { color }]}>{texto}</Texto>
    </View>
  );
  const alPresionar = deshabilitado ? undefined : onPress;
  if (variante === 'primario') {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={alPresionar} disabled={deshabilitado} style={[estilos.base, style, deshabilitado && { opacity: 0.45 }]}>
        <LinearGradient colors={degradadoBoton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={estilos.degradado}>
          {contenido}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={alPresionar} disabled={deshabilitado}
      style={[estilos.base, estilos.degradado, variante === 'peligro' ? estilos.peligro : estilos.secundario, style, deshabilitado && { opacity: 0.45 }]}>
      {contenido}
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  base: { borderRadius: 14, marginBottom: 10 },
  degradado: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  secundario: { backgroundColor: colores.tarjeta, borderWidth: 1, borderColor: colores.borde },
  peligro: { backgroundColor: colores.rojoClaro, borderWidth: 1, borderColor: '#F7C9C9' },
  fila: { flexDirection: 'row', alignItems: 'center' },
  texto: { fontSize: 15, fontWeight: '700' },
});

import { TouchableOpacity, StyleSheet } from 'react-native';
import Texto from './Texto';
import { colores } from '../tema';

export default function Chip({ texto, activo, onPress }) {
  return (
    <TouchableOpacity style={[estilos.chip, activo && estilos.activo]} onPress={onPress} activeOpacity={0.8}>
      <Texto style={[estilos.texto, activo && { color: '#fff' }]}>{texto}</Texto>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colores.tarjeta, borderWidth: 1, borderColor: colores.borde, marginRight: 8 },
  activo: { backgroundColor: colores.marino, borderColor: colores.marino },
  texto: { fontSize: 12, color: colores.texto, fontWeight: '600' },
});

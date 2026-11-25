import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from './Texto';
import { colores, tarjeta } from '../tema';
import { NOMBRES_DIA } from '../utiles';

// Tarjeta reutilizable para un bloque horario. El bloque llega de SQLite ya con
// sala_nombre, profesional_nombre, cupo y capacidad (ver obtenerBloques en datos.js).
export default function TarjetaBloque({ bloque, onPress, mostrarDia = false }) {
  const max = Math.min(4, bloque.capacidad ?? 4);
  const lleno = bloque.cupo >= max;
  return (
    <TouchableOpacity style={estilos.tarjeta} onPress={onPress} activeOpacity={0.8}>
      <View style={estilos.hora}>
        <Texto style={estilos.horaTexto}>{bloque.hora_inicio}</Texto>
        <Texto style={estilos.horaFin}>{bloque.hora_fin}</Texto>
      </View>
      <View style={[estilos.barra, { backgroundColor: lleno ? colores.alerta : colores.azul }]} />
      <View style={{ flex: 1 }}>
        <Texto style={estilos.actividad}>{bloque.actividad}</Texto>
        <Texto style={estilos.sub} numberOfLines={1}>{mostrarDia ? NOMBRES_DIA[bloque.dia_semana] + ' · ' : ''}{bloque.sala_nombre} · {bloque.profesional_nombre}</Texto>
      </View>
      <Texto style={[estilos.cupo, lleno && { color: colores.alerta }]}>{bloque.cupo}/{max}</Texto>
      <Feather name="chevron-right" size={18} color={colores.textoSuave} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  hora: { width: 46 },
  horaTexto: { fontSize: 13, fontWeight: '700', color: colores.texto },
  horaFin: { fontSize: 11, color: colores.textoSuave },
  barra: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginHorizontal: 10 },
  actividad: { fontSize: 14, fontWeight: '700', color: colores.texto },
  sub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  cupo: { fontSize: 12, fontWeight: '700', color: colores.azul },
});

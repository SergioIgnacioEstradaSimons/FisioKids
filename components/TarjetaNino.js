import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from './Texto';
import Insignia from './Insignia';
import { colores, tarjeta } from '../tema';
import { calcularEdad } from '../utiles';

export const iniciales = (nombre = '') => nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

// Tarjeta reutilizable para mostrar un niño en una lista
export default function TarjetaNino({ nino, onPress }) {
  return (
    <TouchableOpacity style={estilos.tarjeta} onPress={onPress} activeOpacity={0.8}>
      <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(nino.nombre)}</Texto></View>
      <View style={{ flex: 1 }}>
        <Texto style={estilos.nombre}>{nino.nombre}</Texto>
        <Texto style={estilos.sub} numberOfLines={1}>
          {calcularEdad(nino.fecha_nacimiento)} años · {nino.tipo_discapacidad}{nino.grado ? ` · Grado ${nino.grado.toLowerCase()}` : ''}
        </Texto>
      </View>
      <Insignia texto={nino.activo ? 'Activo' : 'Inactivo'} tipo={nino.activo ? 'verde' : 'gris'} />
      <Feather name="chevron-right" size={18} color={colores.textoSuave} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iniciales: { color: colores.azul, fontWeight: '700', fontSize: 13 },
  nombre: { fontSize: 14, fontWeight: '700', color: colores.texto },
  sub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
});

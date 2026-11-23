import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from './Texto';
import { colores } from '../tema';

// Aviso que se muestra cuando la fecha tiene una suspensión guardada en SQLite
export default function AvisoSuspension({ suspension, style }) {
  if (!suspension) return null;
  return (
    <View style={[estilos.caja, style]}>
      <Feather name="alert-triangle" size={18} color={colores.alerta} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Texto style={estilos.titulo}>Atención suspendida</Texto>
        <Texto style={estilos.texto}>{suspension.motivo}. No se generan sesiones ni se toma asistencia ese día.</Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.naranjaClaro, borderWidth: 1, borderColor: '#F6D9AE', borderRadius: 14, padding: 12, marginBottom: 14 },
  titulo: { fontSize: 13, fontWeight: '700', color: colores.alerta },
  texto: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
});

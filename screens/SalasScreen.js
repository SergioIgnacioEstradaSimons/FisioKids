import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Insignia from '../components/Insignia';
import Fab from '../components/Fab';
import { colores, tarjeta } from '../tema';
import Estado from '../components/Estado';
import { useConsulta } from '../hooks';
import { obtenerSalas } from '../datos';

export default function SalasScreen({ navigation }) {
  const { datos, cargando, error, recargar } = useConsulta(obtenerSalas);
  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo, padding: 16 }}>
      <Texto style={estilos.titulo}>Salas del centro</Texto>
      <FlatList contentContainerStyle={{ paddingBottom: 90 }} data={datos ?? []}
        ListEmptyComponent={<Estado cargando={cargando} error={error} recargar={recargar} />} keyExtractor={(s) => String(s.id)} renderItem={({ item }) => (
        <TouchableOpacity style={estilos.fila} activeOpacity={0.8} onPress={() => navigation.navigate('FormularioSala', { salaId: item.id })}>
          <View style={estilos.icono}><Feather name="layout" size={18} color={colores.morado} /></View>
          <View style={{ flex: 1 }}>
            <Texto style={estilos.nombre}>{item.nombre}</Texto>
            <Texto style={estilos.sub}>Capacidad: {item.capacidad} · {item.bloques_semana} bloques por semana</Texto>
          </View>
          <Insignia texto={item.activo ? 'Activa' : 'Inactiva'} tipo={item.activo ? 'verde' : 'gris'} />
          <Feather name="edit-2" size={15} color={colores.textoSuave} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )} />
      <Fab texto="Agregar sala" onPress={() => navigation.navigate('FormularioSala')} />
    </View>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  fila: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  icono: { width: 42, height: 42, borderRadius: 13, backgroundColor: colores.moradoClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  nombre: { fontSize: 14, fontWeight: '700', color: colores.marino },
  sub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
});

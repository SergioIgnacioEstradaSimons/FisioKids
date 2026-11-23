import { useState } from 'react';
import { View, TextInput, FlatList, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto, { familiaDe } from '../components/Texto';
import Estado from '../components/Estado';
import TarjetaNino from '../components/TarjetaNino';
import { colores } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import { obtenerNinosDeProfesional, obtenerNinos } from '../datos';

// Atenciones: niños que atiende el profesional (el administrador ve todos los activos). Cada uno abre su historial de atención.
export default function AtencionesScreen({ navigation }) {
  const { usuario } = useSesion();
  const [texto, setTexto] = useState('');
  const { datos, cargando, error, recargar } = useConsulta(
    async (db) => (usuario.rol === 'admin' ? (await obtenerNinos(db)).filter((n) => n.activo) : obtenerNinosDeProfesional(db, usuario.id)), [usuario?.id]);
  const lista = (datos ?? []).filter((n) => n.nombre.toLowerCase().includes(texto.trim().toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo, padding: 16 }}>
      <View style={estilos.buscador}>
        <Feather name="search" size={17} color={colores.textoSuave} />
        <TextInput style={estilos.input} placeholder="Buscar niño…" placeholderTextColor="#9AA9BC" value={texto} onChangeText={setTexto} />
      </View>
      <Texto style={estilos.titulo}>Elige un niño para ver su historial de atención</Texto>
      <FlatList data={lista} keyExtractor={(n) => String(n.id)}
        ListEmptyComponent={cargando || error ? <Estado cargando={cargando} error={error} recargar={recargar} /> : <Texto style={estilos.vacio}>No hay niños para mostrar.</Texto>}
        renderItem={({ item }) => <TarjetaNino nino={item} onPress={() => navigation.navigate('HistorialAtencion', { ninoId: item.id })} />} />
    </View>
  );
}

const estilos = StyleSheet.create({
  buscador: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12 },
  input: { flex: 1, paddingVertical: 12, paddingLeft: 10, fontSize: 14, color: colores.texto, fontFamily: familiaDe(400) },
  titulo: { fontSize: 12, color: colores.textoSuave, marginBottom: 10 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 30 },
});

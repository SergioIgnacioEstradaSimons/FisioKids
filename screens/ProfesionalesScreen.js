import { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto, { familiaDe } from '../components/Texto';
import Chip from '../components/Chip';
import Fab from '../components/Fab';
import Insignia from '../components/Insignia';
import { iniciales } from '../components/TarjetaNino';
import { colores, tarjeta } from '../tema';
import Estado from '../components/Estado';
import { useConsulta } from '../hooks';
import { obtenerProfesionales } from '../datos';
import { diaDeHoy } from '../utiles';

const FILTROS = ['Todos', 'Disponibles', 'Inactivos'];

export default function ProfesionalesScreen({ navigation }) {
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const hoy = diaDeHoy();
  const { datos, cargando, error, recargar } = useConsulta((db) => obtenerProfesionales(db, hoy), [hoy]);
  const todos = datos ?? [];

  const lista = todos.filter((p) => {
    const coincide = p.nombre.toLowerCase().includes(texto.trim().toLowerCase());
    const estado = filtro === 'Todos' || (filtro === 'Disponibles' ? p.activo === 1 : p.activo === 0);
    return coincide && estado;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo, padding: 16 }}>
      <View style={estilos.buscador}>
        <Feather name="search" size={17} color={colores.textoSuave} />
        <TextInput style={estilos.input} placeholder="Buscar profesional…" placeholderTextColor="#9AA9BC" value={texto} onChangeText={setTexto} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        {FILTROS.map((f) => <Chip key={f} texto={f === 'Todos' ? `Todos (${todos.length})` : f} activo={filtro === f} onPress={() => setFiltro(f)} />)}
      </View>
      <Texto style={estilos.titulo}>Equipo profesional</Texto>
      <FlatList contentContainerStyle={{ paddingBottom: 90 }} data={lista} keyExtractor={(p) => String(p.id)}
        ListEmptyComponent={cargando || error ? <Estado cargando={cargando} error={error} recargar={recargar} /> : <Texto style={estilos.vacio}>No se encontraron profesionales.</Texto>}
        renderItem={({ item }) => (
          <TouchableOpacity style={estilos.fila} activeOpacity={0.8} onPress={() => navigation.navigate('FormularioProfesional', { profesionalId: item.id })}>
            <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(item.nombre)}</Texto></View>
            <View style={{ flex: 1 }}>
              <Texto style={estilos.nombre}>{item.nombre}</Texto>
              <Texto style={estilos.sub}>{item.especialidad} · {!item.activo ? 'No disponible' : item.bloques_hoy > 0 ? 'Disponible hoy' : 'Sin bloques hoy'}</Texto>
            </View>
            <Insignia texto={item.activo ? 'Activo' : 'Inactivo'} tipo={item.activo ? 'verde' : 'gris'} />
            <Feather name="edit-2" size={15} color={colores.textoSuave} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )} />
      <Fab texto="Agregar profesional" onPress={() => navigation.navigate('FormularioProfesional')} />
    </View>
  );
}

const estilos = StyleSheet.create({
  buscador: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12 },
  input: { flex: 1, paddingVertical: 12, paddingLeft: 10, fontSize: 14, color: colores.texto, fontFamily: familiaDe(400) },
  titulo: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  fila: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iniciales: { fontSize: 13, fontWeight: '700', color: colores.azul },
  nombre: { fontSize: 14, fontWeight: '700', color: colores.marino },
  sub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 30 },
});

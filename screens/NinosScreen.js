import { useState } from 'react';
import { View, TextInput, FlatList, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import { familiaDe } from '../components/Texto';
import TarjetaNino from '../components/TarjetaNino';
import Chip from '../components/Chip';
import { colores, degradadoTarjeta } from '../tema';
import Estado from '../components/Estado';
import Fab from '../components/Fab';
import { useConsulta } from '../hooks';
import { obtenerNinos } from '../datos';

const FILTROS = ['Todos', 'Activos', 'Inactivos'];

export default function NinosScreen({ navigation }) {
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState('Todos');

  const { datos, cargando, error, recargar } = useConsulta(obtenerNinos);
  const ninos = datos ?? [];
  const lista = ninos.filter((n) => {
    const coincide = n.nombre.toLowerCase().includes(texto.trim().toLowerCase());
    const estado = filtro === 'Todos' || (filtro === 'Activos' ? n.activo === 1 : n.activo === 0);
    return coincide && estado;
  });
  const activos = ninos.filter((n) => n.activo).length;

  const Resumen = (
    <>
      <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.resumen}>
        {[[ninos.length, 'Registrados'], [activos, 'Activos'], [ninos.length - activos, 'Inactivos']].map(([v, e], i) => (
          <View key={e} style={[estilos.resumenItem, i > 0 && estilos.resumenLinea]}>
            <Texto style={estilos.resumenValor}>{v}</Texto>
            <Texto style={estilos.resumenEtiqueta}>{e}</Texto>
          </View>
        ))}
      </LinearGradient>
      <View style={estilos.buscador}>
        <Feather name="search" size={17} color={colores.textoSuave} />
        <TextInput style={estilos.input} placeholder="Buscar niño por nombre…" placeholderTextColor="#9AA9BC" value={texto} onChangeText={setTexto} />
      </View>
      <View style={estilos.filtros}>
        {FILTROS.map((f) => <Chip key={f} texto={f} activo={filtro === f} onPress={() => setFiltro(f)} />)}
      </View>
      <View style={estilos.tituloFila}>
        <Texto style={estilos.titulo}>Niños registrados</Texto>
        <Texto style={estilos.cuenta}>{lista.length} resultados</Texto>
      </View>
    </>
  );

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={lista}
        keyExtractor={(n) => String(n.id)}
        ListHeaderComponent={Resumen}
        renderItem={({ item }) => (
          <TarjetaNino nino={item} onPress={() => navigation.navigate('DetalleNino', { ninoId: item.id, nombre: item.nombre })} />
        )}
        ListEmptyComponent={cargando || error ? <Estado cargando={cargando} error={error} recargar={recargar} /> : <Texto style={estilos.vacio}>No se encontraron niños.</Texto>}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />
      <Fab texto="Agregar niño" onPress={() => navigation.navigate('FormularioNino')} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  resumen: { flexDirection: 'row', borderRadius: 18, paddingVertical: 18, marginBottom: 14 },
  resumenItem: { flex: 1, alignItems: 'center' },
  resumenLinea: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.18)' },
  resumenValor: { fontSize: 24, fontWeight: '800', color: '#fff' },
  resumenEtiqueta: { fontSize: 11, color: '#CFEAEC', marginTop: 2 },
  buscador: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12 },
  input: { flex: 1, paddingVertical: 12, paddingLeft: 10, fontSize: 14, color: colores.texto, fontFamily: familiaDe(400) },
  filtros: { flexDirection: 'row', marginBottom: 14 },
  tituloFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  titulo: { fontSize: 15, fontWeight: '700', color: colores.marino },
  cuenta: { fontSize: 11, color: colores.textoSuave },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 30 },
  fabCaja: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28, elevation: 5, shadowColor: colores.azul, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  fab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 28 },
  fabTexto: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 },
});

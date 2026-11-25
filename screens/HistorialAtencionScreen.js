import { useState } from 'react';
import { View, TextInput, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto, { familiaDe } from '../components/Texto';
import Chip from '../components/Chip';
import Insignia from '../components/Insignia';
import Estado from '../components/Estado';
import { iniciales } from '../components/TarjetaNino';
import { colores, degradadoTarjeta, tarjeta } from '../tema';
import { useConsulta } from '../hooks';
import { obtenerNino, obtenerHistorialAtencion } from '../datos';
import { calcularEdad, MESES } from '../utiles';

const FILTROS = ['Todas', 'Presentes', 'Faltas'];

// Línea de tiempo de atención de un niño (parámetro: ninoId)
export default function HistorialAtencionScreen({ route }) {
  const id = route.params?.ninoId;
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState('Todas');
  const { datos, cargando, error, recargar } = useConsulta(async (db) => ({ nino: await obtenerNino(db, id), registros: await obtenerHistorialAtencion(db, id) }), [id]);
  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  const { nino, registros } = datos;
  if (!nino) return <Texto style={{ padding: 20 }}>No se encontró el niño.</Texto>;

  const q = texto.trim().toLowerCase();
  const lista = registros.filter((r) =>
    (filtro === 'Todas' || (filtro === 'Presentes' ? r.estado === 'Presente' : r.estado === 'Falta')) &&
    (!q || `${r.actividades ?? ''} ${r.observaciones ?? ''} ${r.actividad} ${r.profesional_nombre}`.toLowerCase().includes(q)));
  const fechaCorta = (iso) => { const [, m, d] = iso.split('-'); return `${d} ${MESES[Number(m) - 1].slice(0, 3).toUpperCase()}`; };

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.banner}>
        <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(nino.nombre)}</Texto></View>
        <View style={{ flex: 1 }}>
          <Texto style={estilos.nombre}>{nino.nombre}</Texto>
          <Texto style={estilos.sub}>{calcularEdad(nino.fecha_nacimiento)} años · {registros.length} sesiones registradas</Texto>
        </View>
      </LinearGradient>

      <View style={estilos.buscador}>
        <Feather name="search" size={17} color={colores.textoSuave} />
        <TextInput style={estilos.input} placeholder="Buscar…" placeholderTextColor="#9AA9BC" value={texto} onChangeText={setTexto} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {FILTROS.map((f) => <Chip key={f} texto={f} activo={filtro === f} onPress={() => setFiltro(f)} />)}
      </View>

      {lista.length === 0 ? <Texto style={estilos.vacio}>No hay registros para mostrar.</Texto> : null}
      {lista.map((r, i) => (
        <View key={i} style={estilos.fila}>
          <Texto style={estilos.fecha}>{fechaCorta(r.fecha)}</Texto>
          <View style={estilos.linea}>
            <View style={[estilos.punto, { backgroundColor: r.estado === 'Presente' ? colores.turquesa : colores.error }]} />
          </View>
          <View style={estilos.tarjeta}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <Texto style={estilos.titulo} numberOfLines={2}>{r.estado === 'Presente' ? (r.actividades || r.actividad) : 'Sesión no realizada'}</Texto>
              <Insignia texto={r.estado} tipo={r.estado === 'Presente' ? 'verde' : 'rojo'} />
            </View>
            <Texto style={estilos.profesional}>Lic. {r.profesional_nombre} · {r.hora_inicio}</Texto>
            <Texto style={estilos.detalle}>{r.estado === 'Falta' ? 'Falta registrada al cierre del bloque.' : r.observaciones || 'Sin observaciones.'}</Texto>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iniciales: { color: '#fff', fontWeight: '700' },
  nombre: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub: { color: '#D6EEF0', fontSize: 11, marginTop: 2 },
  buscador: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12 },
  input: { flex: 1, paddingVertical: 11, paddingLeft: 10, fontSize: 13, color: colores.texto, fontFamily: familiaDe(400) },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 20 },
  fila: { flexDirection: 'row', marginBottom: 12 },
  fecha: { width: 48, fontSize: 10, fontWeight: '700', color: colores.textoSuave, paddingTop: 12 },
  linea: { width: 18, alignItems: 'center', borderLeftWidth: 0 },
  punto: { width: 10, height: 10, borderRadius: 5, marginTop: 14 },
  tarjeta: { ...tarjeta, flex: 1, padding: 12 },
  titulo: { flex: 1, fontSize: 13, fontWeight: '700', color: colores.marino },
  profesional: { fontSize: 10, color: colores.azul, marginTop: 6 },
  detalle: { fontSize: 11, color: colores.textoSuave, marginTop: 6 },
});

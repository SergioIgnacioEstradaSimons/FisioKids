import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Texto from '../components/Texto';
import Boton from '../components/Boton';
import Estado from '../components/Estado';
import TarjetaNino from '../components/TarjetaNino';
import { colores, degradadoTarjeta } from '../tema';
import { useConsulta } from '../hooks';
import { useSesion } from '../sesion';
import { obtenerBloque, obtenerNinosDeBloque } from '../datos';
import { NOMBRES_DIA } from '../utiles';

// Recibe el bloque por parámetros: route.params.bloqueId
export default function DetalleBloqueScreen({ navigation, route }) {
  const id = route.params?.bloqueId;
  const { usuario } = useSesion();
  const { datos, cargando, error, recargar } = useConsulta(async (db) => ({
    bloque: await obtenerBloque(db, id),
    ninos: await obtenerNinosDeBloque(db, id),
  }), [id]);

  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  const { bloque, ninos } = datos;
  if (!bloque) return <Texto style={{ padding: 20 }}>No se encontró el bloque.</Texto>;
  const max = Math.min(4, bloque.capacidad);

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16 }}>
      <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.cabecera}>
        <Texto style={estilos.actividad}>{bloque.actividad}</Texto>
        <Texto style={estilos.texto}>{NOMBRES_DIA[bloque.dia_semana]} · {bloque.hora_inicio} – {bloque.hora_fin}</Texto>
        <Texto style={estilos.texto}>{bloque.sala_nombre} · {bloque.profesional_nombre}</Texto>
      </LinearGradient>

      <Texto style={estilos.seccion}>Niños asignados ({ninos.length}/{max})</Texto>
      {ninos.map((n) => (
        <TarjetaNino key={n.id} nino={n} onPress={() => navigation.navigate('DetalleNino', { ninoId: n.id, nombre: n.nombre, bloqueId: bloque.id })} />
      ))}

      <Boton texto="Tomar asistencia" icono="check-square" style={{ marginTop: 6 }}
        onPress={() => navigation.navigate('AsistenciaBloque', { bloqueId: bloque.id })} />
      {usuario?.rol === 'admin' ? (
        <Boton texto="Editar bloque" icono="edit-2" variante="secundario" style={{ marginTop: 6 }}
          onPress={() => navigation.navigate('FormularioBloque', { bloqueId: bloque.id })} />
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  cabecera: { borderRadius: 20, padding: 18, marginBottom: 18 },
  actividad: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  texto: { color: '#D6EEF0', fontSize: 12, marginTop: 3 },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
});

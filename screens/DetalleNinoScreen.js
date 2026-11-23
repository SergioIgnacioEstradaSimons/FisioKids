import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import Texto from '../components/Texto';
import Boton from '../components/Boton';
import Insignia from '../components/Insignia';
import Estado from '../components/Estado';
import { iniciales } from '../components/TarjetaNino';
import { colores, tarjeta } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import { obtenerNino, obtenerBloquesDeNino, obtenerHistorialNino, cambiarEstadoNino, eliminarNino, obtenerBloque, obtenerAsistenciaNino } from '../datos';
import { calcularEdad, isoADmy, hoyISO, NOMBRES_DIA } from '../utiles';

function Fila({ etiqueta, valor }) {
  return (
    <View style={estilos.fila}>
      <Texto style={estilos.etiqueta}>{etiqueta}</Texto>
      <Texto style={estilos.valor}>{valor || '—'}</Texto>
    </View>
  );
}

// Recibe el niño por parámetros: route.params.ninoId
export default function DetalleNinoScreen({ navigation, route }) {
  const db = useSQLiteContext();
  const { usuario } = useSesion();
  const id = route.params?.ninoId;
  const bloqueId = route.params?.bloqueId; // si llega, se muestra «Sesión de hoy» con el estado de la asistencia
  const { datos, cargando, error, recargar } = useConsulta(async (d) => ({
    bloque: bloqueId ? await obtenerBloque(d, bloqueId) : null,
    asistencia: bloqueId ? await obtenerAsistenciaNino(d, bloqueId, id, hoyISO()) : null,
    nino: await obtenerNino(d, id),
    horarios: await obtenerBloquesDeNino(d, id),
    historial: await obtenerHistorialNino(d, id),
  }), [id, bloqueId]);

  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  const { nino, horarios, historial, bloque, asistencia } = datos;
  if (!nino) return <Texto style={{ padding: 20 }}>No se encontró el niño.</Texto>;
  const esAdmin = usuario?.rol === 'admin';

  const cambiarEstado = async () => {
    await cambiarEstadoNino(db, nino.id, nino.activo ? 0 : 1); // UPDATE ... WHERE id = ?
    recargar();
  };
  const borrar = () => Alert.alert(
    'Eliminar niño',
    `¿Eliminar definitivamente a ${nino.nombre}? Se borrarán también sus horarios y su historial. Para conservar el historial usa «Dar de baja».`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await eliminarNino(db, nino.id); navigation.goBack(); } }, // DELETE ... WHERE id = ?
    ]);

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={estilos.cabecera}>
        <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(nino.nombre)}</Texto></View>
        <Texto style={estilos.nombre}>{nino.nombre}</Texto>
        <Insignia texto={nino.activo ? 'Activo' : 'Inactivo'} tipo={nino.activo ? 'verde' : 'gris'} />
      </View>

      {bloque ? (
        <>
          <Texto style={estilos.seccion}>Sesión de hoy</Texto>
          <View style={estilos.sesion}>
            <View style={estilos.sesionHora}><Texto style={estilos.sesionHoraTexto}>{bloque.hora_inicio}</Texto></View>
            <View style={{ flex: 1 }}>
              <Texto style={estilos.sesionTitulo}>{bloque.actividad}</Texto>
              <Texto style={estilos.sesionSub}>{bloque.hora_inicio} · {bloque.sala_nombre}</Texto>
              <Texto style={estilos.sesionSub}>Lic. {bloque.profesional_nombre}</Texto>
            </View>
            <Insignia texto={asistencia?.estado ?? 'Pendiente'} tipo={asistencia?.estado === 'Presente' ? 'verde' : asistencia?.estado === 'Falta' ? 'rojo' : 'gris'} />
          </View>
          {!esAdmin ? (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <Boton texto="Registrar atención" icono="edit-3" style={{ flex: 1, marginBottom: 0 }}
                onPress={() => navigation.navigate('RegistrarAtencion', { bloqueId: bloque.id, ninoId: nino.id })} />
              <Boton texto="Ver historial" icono="clock" variante="secundario" style={{ flex: 1, marginBottom: 0 }}
                onPress={() => navigation.navigate('HistorialAtencion', { ninoId: nino.id })} />
            </View>
          ) : null}
        </>
      ) : null}

      <View style={estilos.tarjeta}>
        <Texto style={estilos.titulo}>Datos del niño</Texto>
        <Fila etiqueta="Edad" valor={`${calcularEdad(nino.fecha_nacimiento)} años (${isoADmy(nino.fecha_nacimiento)})`} />
        <Fila etiqueta="Discapacidad" valor={nino.tipo_discapacidad} />
        <Fila etiqueta="Grado" valor={nino.grado} />
        <Fila etiqueta="Observaciones" valor={nino.observaciones} />
      </View>

      <View style={estilos.tarjeta}>
        <Texto style={estilos.titulo}>Tutor de contacto</Texto>
        <Fila etiqueta="Nombre" valor={nino.tutor_nombre} />
        <Fila etiqueta="Teléfono" valor={nino.tutor_telefono} />
      </View>

      <View style={estilos.tarjeta}>
        <Texto style={estilos.titulo}>Horarios asignados</Texto>
        {horarios.length === 0 ? <Texto style={estilos.vacio}>Sin horarios asignados.</Texto> :
          horarios.map((b) => (
            <Texto key={b.id} style={estilos.item}>• {NOMBRES_DIA[b.dia_semana]} {b.hora_inicio}–{b.hora_fin} · {b.actividad}</Texto>
          ))}
      </View>

      <View style={estilos.tarjeta}>
        <Texto style={estilos.titulo}>Historial de sesiones</Texto>
        {historial.length === 0 ? <Texto style={estilos.vacio}>Sin sesiones registradas.</Texto> :
          historial.map((h, i) => (
            <View key={i} style={estilos.historial}>
              <Texto style={estilos.item}>{isoADmy(h.fecha)}{h.actividades ? ` · ${h.actividades}` : ''}</Texto>
              <Insignia texto={h.estado} tipo={h.estado === 'Presente' ? 'verde' : 'rojo'} />
            </View>
          ))}
      </View>

      {!bloque || esAdmin ? <Boton texto="Ver historial de atención" icono="clock" variante="secundario" onPress={() => navigation.navigate('HistorialAtencion', { ninoId: nino.id })} /> : null}
      {esAdmin ? (
        <>
          <Boton texto="Editar niño" icono="edit-2" onPress={() => navigation.navigate('FormularioNino', { ninoId: nino.id })} />
          <Boton texto={nino.activo ? 'Dar de baja' : 'Reactivar'} icono={nino.activo ? 'user-x' : 'user-check'} variante="secundario" onPress={cambiarEstado} />
          <Boton texto="Eliminar definitivamente" icono="trash-2" variante="peligro" onPress={borrar} />
        </>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  cabecera: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 22, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iniciales: { fontSize: 24, fontWeight: '800', color: colores.azul },
  nombre: { fontSize: 20, fontWeight: '800', color: colores.marino, marginBottom: 8 },
  tarjeta: { ...tarjeta, padding: 14, marginBottom: 12 },
  titulo: { fontSize: 14, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  sesion: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  sesionHora: { width: 54, height: 54, borderRadius: 14, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sesionHoraTexto: { fontSize: 13, fontWeight: '800', color: colores.azul },
  sesionTitulo: { fontSize: 14, fontWeight: '700', color: colores.marino },
  sesionSub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  fila: { flexDirection: 'row', marginBottom: 7 },
  etiqueta: { width: 105, color: colores.textoSuave, fontSize: 12 },
  valor: { flex: 1, color: colores.texto, fontSize: 12, fontWeight: '600' },
  item: { color: colores.texto, fontSize: 12, marginBottom: 4, flex: 1 },
  historial: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  vacio: { color: colores.textoSuave, fontStyle: 'italic', fontSize: 12 },
});

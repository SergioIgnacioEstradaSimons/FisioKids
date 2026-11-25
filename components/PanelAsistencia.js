import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useBase } from '../supabase';
import Texto from './Texto';
import Boton from './Boton';
import Estado from './Estado';
import Insignia from './Insignia';
import { iniciales } from './TarjetaNino';
import { colores, degradadoTarjeta, tarjeta } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import AvisoSuspension from './AvisoSuspension';
import { obtenerBloque, obtenerNinosDeBloque, obtenerAsistenciaDelBloque, bloqueAnteriorPendiente, bloqueCerrado, guardarAsistencia, reabrirBloque, obtenerSuspensionDeFecha } from '../datos';
import { hoyISO, calcularEdad, estadoBloque } from '../utiles';

// Toma la asistencia de HOY de un bloque (se usa en la pestaña Asistencia y en la pantalla AsistenciaBloque).
// Reglas: 1) no se puede si un bloque anterior del mismo profesional sigue abierto; 2) un bloque cerrado
// no admite cambios (solo el administrador puede reabrirlo).
export default function PanelAsistencia({ bloqueId, navigation }) {
  const db = useBase();
  const { usuario } = useSesion();
  const fecha = hoyISO();
  const { datos, cargando, error, recargar } = useConsulta(async (d) => ({
    bloque: await obtenerBloque(d, bloqueId),
    ninos: await obtenerNinosDeBloque(d, bloqueId),
    previa: await obtenerAsistenciaDelBloque(d, bloqueId, fecha),
    anterior: await bloqueAnteriorPendiente(d, bloqueId, fecha),
    cerrado: await bloqueCerrado(d, bloqueId, fecha),
    suspension: await obtenerSuspensionDeFecha(d, fecha),
  }), [bloqueId]);

  const [cambios, setCambios] = useState({});
  const marcar = (ninoId, estado) => setCambios((prev) => ({ ...prev, [ninoId]: estado }));

  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  const { bloque, ninos, previa, anterior, cerrado, suspension } = datos;
  const estados = { ...Object.fromEntries(previa.map((p) => [p.nino_id, p.estado])), ...cambios };
  if (!bloque) return <Texto style={{ padding: 20 }}>No se encontró el bloque.</Texto>;

  const esAdmin = usuario?.rol === 'admin';
  const bloqueadoPorOrden = !!anterior && !cerrado;
  const soloLectura = !!suspension || bloqueadoPorOrden || (cerrado && !esAdmin); // un día suspendido no admite asistencia
  const registrados = ninos.filter((n) => estados[n.id]).length;
  const estadoB = estadoBloque({ ...bloque, cerrado: cerrado ? 1 : 0 }, true);
  const tieneAtencion = (id) => !!previa.find((p) => p.nino_id === id)?.actividades;

  const guardar = async () => {
    const marcados = ninos.filter((n) => estados[n.id]).map((n) => ({ ninoId: n.id, estado: estados[n.id] }));
    if (marcados.length === 0) return Alert.alert('Sin marcar', 'Marca Presente o Falta en al menos un niño.');
    try {
      await guardarAsistencia(db, bloque.id, fecha, marcados); // INSERT ... ON CONFLICT DO UPDATE
      navigation.navigate('CerrarBloque', { bloqueId: bloque.id });
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
    }
  };

  // El registro de atención solo existe para quien estuvo Presente: primero se guarda esa asistencia
  const registrarAtencion = async (n) => {
    try {
      await guardarAsistencia(db, bloque.id, fecha, [{ ninoId: n.id, estado: 'Presente' }]);
      navigation.navigate('RegistrarAtencion', { bloqueId: bloque.id, ninoId: n.id });
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
    }
  };

  const reabrir = () => Alert.alert('Reabrir bloque', '¿Reabrir este bloque para corregir la asistencia?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Reabrir', onPress: async () => { await reabrirBloque(db, bloque.id, fecha); recargar(); } },
  ]);

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.cabecera}>
        <View style={estilos.cabeceraFila}>
          <Texto style={estilos.hora}>{bloque.hora_inicio} – {bloque.hora_fin}</Texto>
          <Insignia texto={estadoB.texto} tipo={estadoB.tipo} />
        </View>
        <Texto style={estilos.actividad}>{bloque.actividad}</Texto>
        <Texto style={estilos.sub}>{bloque.sala_nombre} · {ninos.length} niños · {bloque.profesional_nombre}</Texto>
      </LinearGradient>

      <View style={estilos.progresoFila}>
        <Texto style={estilos.progresoTexto}><Texto style={{ fontWeight: '800', color: colores.marino }}>{registrados} de {ninos.length}</Texto> registrados</Texto>
      </View>
      <View style={estilos.progresoFondo}><View style={[estilos.progreso, { width: `${ninos.length ? (registrados / ninos.length) * 100 : 0}%` }]} /></View>

      <AvisoSuspension suspension={suspension} />
      {bloqueadoPorOrden && !suspension ? (
        <View style={estilos.aviso}>
          <Feather name="lock" size={18} color={colores.alerta} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Texto style={estilos.avisoTitulo}>Primero cierra el bloque anterior</Texto>
            <Texto style={estilos.avisoTexto}>Falta cerrar el bloque de las {anterior.hora_inicio} ({anterior.actividad}) para dar asistencia de este horario.</Texto>
            <TouchableOpacity onPress={() => navigation.navigate('AsistenciaBloque', { bloqueId: anterior.id })}>
              <Texto style={estilos.enlace}>Ir al bloque de las {anterior.hora_inicio} ›</Texto>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {cerrado ? (
        <View style={[estilos.aviso, { backgroundColor: '#E9F8F1', borderColor: '#BDE8D3' }]}>
          <Feather name="check-circle" size={18} color={colores.exito} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Texto style={[estilos.avisoTitulo, { color: colores.exito }]}>Bloque cerrado</Texto>
            <Texto style={estilos.avisoTexto}>{esAdmin ? 'Como administrador puedes reabrirlo para corregir.' : 'No admite cambios sin autorización del administrador.'}</Texto>
            {esAdmin ? <TouchableOpacity onPress={reabrir}><Texto style={estilos.enlace}>Reabrir bloque ›</Texto></TouchableOpacity> : null}
          </View>
        </View>
      ) : null}

      <Texto style={estilos.seccion}>Niños programados</Texto>
      {ninos.map((n) => {
        const estado = estados[n.id];
        return (
          <View key={n.id} style={estilos.tarjeta}>
            <TouchableOpacity style={estilos.ninoFila} activeOpacity={0.8}
              onPress={() => navigation.navigate('DetalleNino', { ninoId: n.id, nombre: n.nombre, bloqueId: bloque.id })}>
              <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(n.nombre)}</Texto></View>
              <View style={{ flex: 1 }}>
                <Texto style={estilos.nombre}>{n.nombre}</Texto>
                <Texto style={estilos.detalle}>{calcularEdad(n.fecha_nacimiento)} años · {bloque.hora_inicio}</Texto>
              </View>
              <Feather name="chevron-right" size={16} color={colores.textoSuave} />
            </TouchableOpacity>
            <View style={estilos.botones}>
              {['Presente', 'Falta'].map((op) => {
                const activo = estado === op;
                const color = op === 'Presente' ? colores.exito : colores.error;
                return (
                  <TouchableOpacity key={op} activeOpacity={0.8} disabled={soloLectura}
                    style={[estilos.opcion, activo && { backgroundColor: op === 'Presente' ? colores.verdeClaro : colores.rojoClaro, borderColor: color }, soloLectura && { opacity: 0.6 }]}
                    onPress={() => marcar(n.id, op)}>
                    <Feather name={op === 'Presente' ? 'check' : 'x'} size={15} color={activo ? color : colores.textoSuave} />
                    <Texto style={[estilos.opcionTexto, activo && { color }]}>{op}</Texto>
                  </TouchableOpacity>
                );
              })}
            </View>
            {estado === 'Presente' ? (
              <TouchableOpacity style={estilos.atencion} activeOpacity={0.8} disabled={soloLectura} onPress={() => registrarAtencion(n)}>
                <Feather name={tieneAtencion(n.id) ? 'check-circle' : 'edit-3'} size={15} color={tieneAtencion(n.id) ? colores.exito : colores.azul} />
                <Texto style={[estilos.atencionTexto, tieneAtencion(n.id) && { color: colores.exito }]}>
                  {tieneAtencion(n.id) ? 'Atención registrada · editar' : 'Registrar atención'}
                </Texto>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}

      {!cerrado ? (
        <View style={estilos.advertencia}>
          <Feather name="alert-triangle" size={16} color={colores.alerta} />
          <Texto style={estilos.advertenciaTexto}>Al cerrar el bloque, las asistencias pendientes se registrarán automáticamente como falta.</Texto>
        </View>
      ) : null}
      {!cerrado ? <Boton texto="Guardar asistencia" icono="check" deshabilitado={soloLectura} onPress={guardar} /> : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  cabecera: { borderRadius: 20, padding: 18, marginBottom: 14 },
  cabeceraFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hora: { color: colores.menta, fontSize: 12, fontWeight: '700' },
  actividad: { color: '#fff', fontSize: 21, fontWeight: '800', marginTop: 8 },
  sub: { color: '#D6EEF0', fontSize: 12, marginTop: 4 },
  progresoFila: { marginBottom: 6 },
  progresoTexto: { fontSize: 12, color: colores.textoSuave },
  progresoFondo: { height: 6, borderRadius: 3, backgroundColor: '#DCE5EF', marginBottom: 16 },
  progreso: { height: 6, borderRadius: 3, backgroundColor: colores.turquesa },
  aviso: { flexDirection: 'row', backgroundColor: colores.naranjaClaro, borderWidth: 1, borderColor: '#F6D9AE', borderRadius: 14, padding: 12, marginBottom: 14 },
  avisoTitulo: { fontSize: 13, fontWeight: '700', color: colores.alerta },
  avisoTexto: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  enlace: { fontSize: 12, fontWeight: '700', color: colores.azul, marginTop: 6 },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  tarjeta: { ...tarjeta, padding: 12, marginBottom: 10 },
  ninoFila: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 13, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  iniciales: { fontSize: 13, fontWeight: '700', color: colores.azul },
  nombre: { fontSize: 14, fontWeight: '700', color: colores.marino },
  detalle: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  botones: { flexDirection: 'row', gap: 10 },
  opcion: { flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colores.borde, backgroundColor: '#F8FAFC' },
  opcionTexto: { fontSize: 13, fontWeight: '600', color: colores.textoSuave },
  atencion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 10, borderRadius: 12, backgroundColor: colores.azulClaro },
  atencionTexto: { fontSize: 12, fontWeight: '700', color: colores.azul },
  advertencia: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colores.naranjaClaro, borderRadius: 14, padding: 12, marginVertical: 8 },
  advertenciaTexto: { flex: 1, fontSize: 11, color: '#92400E' },
});

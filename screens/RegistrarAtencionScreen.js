import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBase } from '../supabase';
import Texto from '../components/Texto';
import Campo from '../components/Campo';
import Boton from '../components/Boton';
import Estado from '../components/Estado';
import { iniciales } from '../components/TarjetaNino';
import { colores, degradadoTarjeta } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import { obtenerBloque, obtenerNino, obtenerAsistenciaNino, bloqueCerrado, registrarAtencion } from '../datos';
import { hoyISO, isoADmy } from '../utiles';

const ETIQUETAS = ['Control postural', 'Equilibrio', 'Movilidad', 'Coordinación', 'Fortalecimiento', 'Marcha'];

// Registro de atención de un niño que estuvo Presente. La fecha, el horario y el profesional responsable
// ya vienen determinados (no se escriben): solo se completan las actividades y las observaciones.
export default function RegistrarAtencionScreen(props) {
  const { ninoId, bloqueId } = props.route.params;
  const fecha = hoyISO();
  const { datos, cargando, error, recargar } = useConsulta(async (db) => ({
    bloque: await obtenerBloque(db, bloqueId),
    nino: await obtenerNino(db, ninoId),
    asistencia: await obtenerAsistenciaNino(db, bloqueId, ninoId, fecha),
    cerrado: await bloqueCerrado(db, bloqueId, fecha),
  }), [ninoId, bloqueId]);
  if (cargando || error || !datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  return <Formulario {...props} {...datos} fecha={fecha} />;
}

function Formulario({ navigation, bloque, nino, asistencia, cerrado, fecha }) {
  const db = useBase();
  const { usuario } = useSesion();
  const insets = useSafeAreaInsets();
  const [actividades, setActividades] = useState(asistencia?.actividades ?? '');
  const [observaciones, setObservaciones] = useState(asistencia?.observaciones ?? '');
  const [error, setError] = useState(null);

  const sinPermiso = cerrado && usuario?.rol !== 'admin';
  const esPresente = asistencia?.estado === 'Presente';

  const agregar = (etiqueta) => {
    if (actividades.toLowerCase().includes(etiqueta.toLowerCase())) return;
    setActividades((actividades ? actividades.replace(/[.\s]+$/, '') + ', ' : '') + etiqueta.toLowerCase());
  };

  const guardar = async () => {
    if (actividades.trim().length < 5) return setError('Describe las actividades realizadas (mínimo 5 caracteres)');
    setError(null);
    try {
      await registrarAtencion(db, bloque.id, nino.id, fecha, { actividades, observaciones }); // UPDATE asistencias ...
      Alert.alert('Atención registrada', 'El registro pasa al historial del niño.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.banner}>
          <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(nino.nombre)}</Texto></View>
          <View style={{ flex: 1 }}>
            <Texto style={estilos.nombre}>{nino.nombre}</Texto>
            <Texto style={estilos.sub}>{isoADmy(fecha)} · {bloque.hora_inicio} · {bloque.sala_nombre}</Texto>
          </View>
        </LinearGradient>

        {!esPresente ? (
          <View style={estilos.aviso}>
            <Texto style={estilos.avisoTexto}>Solo se registra atención de los niños que estuvieron Presentes. Marca la asistencia como Presente primero.</Texto>
          </View>
        ) : sinPermiso ? (
          <View style={estilos.aviso}><Texto style={estilos.avisoTexto}>El bloque está cerrado: no admite cambios sin autorización del administrador.</Texto></View>
        ) : null}

        <Campo etiqueta="Fecha de atención" icono="calendar" soloLectura value={isoADmy(fecha)} />
        <Campo etiqueta="Horario" icono="clock" soloLectura value={`${bloque.hora_inicio} – ${bloque.hora_fin} · ${bloque.actividad}`} />
        <Campo etiqueta="Profesional responsable" icono="user" soloLectura value={`Lic. ${bloque.profesional_nombre}`} />

        <Campo etiqueta="Actividades realizadas" obligatorio multiline value={actividades} onChangeText={setActividades} maxLength={500}
          placeholder="Ej. Ejercicios de control postural, equilibrio asistido…" error={error} soloLectura={!esPresente || sinPermiso} />
        <Texto style={estilos.contador}>{actividades.length} / 500</Texto>
        <View style={estilos.etiquetas}>
          {ETIQUETAS.map((e) => (
            <TouchableOpacity key={e} style={estilos.etiqueta} onPress={() => agregar(e)} disabled={!esPresente || sinPermiso}>
              <Texto style={estilos.etiquetaTexto}>{e}</Texto>
            </TouchableOpacity>
          ))}
        </View>

        <Campo etiqueta="Observaciones del profesional" multiline value={observaciones} onChangeText={setObservaciones} maxLength={500}
          placeholder="Describe avances, respuesta a la terapia y recomendaciones…" soloLectura={!esPresente || sinPermiso} />
      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => navigation.goBack()} />
        <Boton texto="Guardar registro" icono="check" style={{ flex: 1.6, marginBottom: 0 }} deshabilitado={!esPresente || sinPermiso} onPress={guardar} />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iniciales: { color: '#fff', fontWeight: '700' },
  nombre: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub: { color: '#D6EEF0', fontSize: 11, marginTop: 2 },
  aviso: { backgroundColor: colores.naranjaClaro, borderRadius: 14, padding: 12, marginBottom: 14 },
  avisoTexto: { fontSize: 12, color: '#92400E' },
  contador: { fontSize: 10, color: colores.textoSuave, textAlign: 'right', marginTop: -8, marginBottom: 8 },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  etiqueta: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: colores.borde, backgroundColor: '#fff' },
  etiquetaTexto: { fontSize: 11, fontWeight: '600', color: colores.marino },
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

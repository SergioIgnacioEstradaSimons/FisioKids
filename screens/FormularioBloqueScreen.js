import { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBase } from '../supabase';
import Texto from '../components/Texto';
import Campo from '../components/Campo';
import Selector from '../components/Selector';
import Boton from '../components/Boton';
import Estado from '../components/Estado';
import { colores } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import { obtenerBloque, obtenerProfesionales, obtenerSalas, actualizarBloque, registrarEventoParaProfesional } from '../datos';
import { NOMBRES_DIA, HORAS, limpiar } from '../utiles';

export default function FormularioBloqueScreen({ navigation, route }) {
  const id = route.params?.bloqueId;
  const { datos, cargando, error, recargar } = useConsulta(async (db) => {
    if (!id) return { bloque: null, profes: [], salas: [] };
    const bloque = await obtenerBloque(db, id);
    return {
      bloque,
      profes: bloque ? await obtenerProfesionales(db, 0) : [],
      salas: bloque ? await obtenerSalas(db) : [],
    };
  }, [id]);

  if (cargando || error) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  if (!datos?.bloque) return <View style={estilos.caja}><Texto style={estilos.vacio}>No se encontró el bloque.</Texto></View>;
  return <Formulario navigation={navigation} actual={datos.bloque} profes={datos.profes} salas={datos.salas} />;
}

function Formulario({ navigation, actual, profes, salas }) {
  const db = useBase();
  const insets = useSafeAreaInsets();
  const { usuario } = useSesion();
  const [v, setV] = useState({
    actividad: actual.actividad,
    dia_semana: actual.dia_semana,
    hora_inicio: actual.hora_inicio,
    profesional_id: actual.profesional_id,
    sala_id: actual.sala_id,
  });
  const [errores, setErrores] = useState({});
  const cambiar = (campo) => (valor) => setV({ ...v, [campo]: valor });

  const indiceHora = HORAS.indexOf(v.hora_inicio);
  const horaFin = HORAS[indiceHora + 1] ?? '19:00';
  const dias = [1, 2, 3, 4, 5].map((d) => ({ valor: d, etiqueta: NOMBRES_DIA[d] }));
  const horas = HORAS.map((h) => ({ valor: h, etiqueta: h }));
  const opcionesProfes = profes.filter((p) => p.activo || p.id === actual.profesional_id).map((p) => ({ valor: p.id, etiqueta: p.nombre }));
  const opcionesSalas = salas.filter((s) => s.activo || s.id === actual.sala_id).map((s) => ({ valor: s.id, etiqueta: s.nombre }));

  const guardar = async () => {
    const e = {};
    const actividad = limpiar(v.actividad);
    if (!actividad) e.actividad = 'Escribe la actividad';
    if (!v.dia_semana) e.dia = 'Selecciona un día';
    if (indiceHora < 0 || indiceHora === HORAS.length - 1) e.hora = 'Selecciona una hora de inicio válida';
    if (!v.profesional_id) e.prof = 'Selecciona un profesional';
    if (!v.sala_id) e.sala = 'Selecciona una sala';
    setErrores(e);
    if (Object.keys(e).length > 0) return Alert.alert('Revisa el formulario', 'Hay campos con errores. Corrígelos e inténtalo de nuevo.');

    try {
      await actualizarBloque(db, actual.id, {
        actividad,
        dia_semana: v.dia_semana,
        hora_inicio: v.hora_inicio,
        hora_fin: horaFin,
        profesional_id: v.profesional_id,
        sala_id: v.sala_id,
      });
      const sala = salas.find((s) => s.id === v.sala_id);
      const destinatarios = [...new Set([actual.profesional_id, v.profesional_id].filter(Boolean))];
      await Promise.all(destinatarios.map((profesionalId) => registrarEventoParaProfesional(db, {
        actor: usuario,
        profesionalId,
        bloqueId: actual.id,
        titulo: 'Bloque actualizado',
        texto: profesionalId === v.profesional_id
          ? `Se actualizó tu bloque de ${actividad}: ${NOMBRES_DIA[v.dia_semana]} ${v.hora_inicio}–${horaFin} en ${sala?.nombre ?? 'su sala'}.`
          : `Ya no tienes el bloque de ${actividad} los ${NOMBRES_DIA[actual.dia_semana]} a las ${actual.hora_inicio}.`,
      })));
      Alert.alert('Bloque actualizado', 'Los cambios se guardaron.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Texto style={estilos.seccion}>Datos del bloque</Texto>
        <Campo etiqueta="Actividad" obligatorio value={v.actividad} onChangeText={cambiar('actividad')} error={errores.actividad} />
        <Selector etiqueta="Día" obligatorio valor={v.dia_semana} onChange={cambiar('dia_semana')} opciones={dias} error={errores.dia} />
        <Selector etiqueta="Hora de inicio" obligatorio valor={v.hora_inicio} onChange={cambiar('hora_inicio')} opciones={horas} error={errores.hora} />
        <Campo etiqueta="Hora de fin" soloLectura value={horaFin} />
        <Texto style={[estilos.seccion, { marginTop: 6 }]}>Responsable y sala</Texto>
        <Selector etiqueta="Profesional" obligatorio valor={v.profesional_id} onChange={cambiar('profesional_id')} opciones={opcionesProfes} error={errores.prof} />
        <Selector etiqueta="Sala" obligatorio valor={v.sala_id} onChange={cambiar('sala_id')} opciones={opcionesSalas} error={errores.sala} />
      </ScrollView>
      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => navigation.goBack()} />
        <Boton texto="Guardar cambios" icono="check" style={{ flex: 1.6, marginBottom: 0 }} onPress={guardar} />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 12 },
  caja: { padding: 30, alignItems: 'center' },
  vacio: { color: colores.textoSuave, textAlign: 'center' },
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

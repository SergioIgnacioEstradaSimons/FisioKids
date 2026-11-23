import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import Texto from '../components/Texto';
import Selector, { SelectorModal } from '../components/Selector';
import Boton from '../components/Boton';
import Estado from '../components/Estado';
import { iniciales } from '../components/TarjetaNino';
import { colores, tarjeta } from '../tema';
import { useConsulta } from '../hooks';
import { obtenerNinos, obtenerProfesionales, obtenerSalas, obtenerBloquesEnHorario, obtenerNinosDeBloque, crearAsignacion } from '../datos';
import { NOMBRES_DIA, TURNOS, turnoDe } from '../utiles';

const ACTIVIDADES = ['Terapia motriz', 'Estimulación temprana', 'Terapia individual', 'Terapia ocupacional'].map((a) => ({ valor: a, etiqueta: a }));

function Chequeo({ ok, titulo, texto }) {
  return (
    <View style={estilos.chequeo}>
      <View style={[estilos.chequeoIcono, { backgroundColor: ok ? colores.verdeClaro : colores.naranjaClaro }]}>
        <Feather name={ok ? 'check' : 'alert-triangle'} size={14} color={ok ? colores.exito : colores.alerta} />
      </View>
      <View style={{ flex: 1 }}>
        <Texto style={estilos.chequeoTitulo}>{titulo}</Texto>
        <Texto style={estilos.chequeoTexto}>{texto}</Texto>
      </View>
    </View>
  );
}

// Parámetros opcionales: dia (1-5) y hora (HH:MM) para precargar el formulario
export default function NuevaAsignacionScreen({ navigation, route }) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [ninoIds, setNinoIds] = useState([]);   // varios niños a la vez (sin pasar el máximo del bloque)
  const [agregando, setAgregando] = useState(false);
  const [profId, setProfId] = useState(null);
  const [salaId, setSalaId] = useState(null);
  const [dia, setDia] = useState(route.params?.dia ?? 1);
  const [hora, setHora] = useState(route.params?.hora ?? '09:00');
  const turno = turnoDe(hora);
  const cambiarTurno = (t) => { if (t !== turno) setHora(TURNOS[t][0]); };
  const [actividad, setActividad] = useState('Terapia motriz');
  const [errores, setErrores] = useState({});

  // Listas para los selectores (SELECT sobre ninos, usuarios y salas)
  const listas = useConsulta(async (d) => ({
    ninos: (await obtenerNinos(d)).filter((n) => n.activo),
    profes: (await obtenerProfesionales(d, 0)).filter((p) => p.activo),
    salas: (await obtenerSalas(d)).filter((s) => s.activo),
  }));
  // Disponibilidad del horario elegido
  const slot = useConsulta(async (d) => {
    const bloques = await obtenerBloquesEnHorario(d, dia, hora);
    const delSala = bloques.find((b) => b.sala_id === salaId);
    return { bloques, delSala, ninos: delSala ? await obtenerNinosDeBloque(d, delSala.id) : [] };
  }, [dia, hora, salaId]);

  if (!listas.datos) return <Estado cargando={listas.cargando} error={listas.error} recargar={listas.recargar} />;
  const { ninos, profes, salas } = listas.datos;
  const bloques = slot.datos?.bloques ?? [];
  const delSala = slot.datos?.delSala;
  const ninosEnBloque = slot.datos?.ninos ?? [];
  const sala = salas.find((s) => s.id === salaId);
  const max = Math.min(4, sala?.capacidad ?? 4);

  const conflictoProf = !!profId && bloques.some((b) => b.profesional_id === profId && b.sala_id !== salaId);
  const conflictoSala = !!salaId && !!profId && !!delSala && delSala.profesional_id !== profId;
  const cupoLleno = ninosEnBloque.length >= max;
  const yaAsignados = ninoIds.filter((id) => ninosEnBloque.some((n) => n.id === id));
  const yaAsignado = yaAsignados.length > 0;
  const espacios = Math.max(max - ninosEnBloque.length, 0);         // lugares libres en el bloque
  const restantes = espacios - ninoIds.length;                        // lugares que quedan después de lo seleccionado
  const excedido = ninoIds.length > espacios;
  const seleccionados = ninoIds.map((id) => ninos.find((n) => n.id === id)).filter(Boolean);
  const disponibles = ninos.filter((n) => !ninoIds.includes(n.id) && !ninosEnBloque.some((b) => b.id === n.id));

  const guardar = async () => {
    const e = {};
    if (ninoIds.length === 0) e.nino = 'Agrega al menos un niño';
    if (!profId) e.prof = 'Selecciona un profesional';
    if (!salaId) e.sala = 'Selecciona una sala';
    setErrores(e);
    if (Object.keys(e).length) return;
    try {
      await crearAsignacion(db, { ninoIds, profesionalId: profId, salaId, dia, hora, actividad: delSala?.actividad ?? actividad });
      Alert.alert('Asignación guardada', ninoIds.length === 1 ? 'El niño quedó asignado al bloque.' : `Los ${ninoIds.length} niños quedaron asignados al bloque.`, [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('No se pudo asignar', err.message); // las reglas de negocio se validan en datos.js
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={estilos.capacidad}>
          <Feather name="users" size={18} color={colores.azul} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Texto style={estilos.capacidadTitulo}>Capacidad del bloque</Texto>
            <Texto style={estilos.capacidadSub}>Máximo {max} niños por horario</Texto>
          </View>
          <Texto style={[estilos.capacidadValor, (cupoLleno || excedido) && { color: colores.error }]}>{ninosEnBloque.length + ninoIds.length}/{max}</Texto>
        </View>

        <View style={{ marginBottom: 14 }}>
          <View style={estilos.ninosTitulo}>
            <Texto style={estilos.etiqueta}>Niños <Texto style={{ color: colores.error }}>*</Texto></Texto>
            <Texto style={estilos.ninosCuenta}>{ninoIds.length} {ninoIds.length === 1 ? 'seleccionado' : 'seleccionados'} · {Math.max(restantes, 0)} {Math.max(restantes, 0) === 1 ? 'lugar libre' : 'lugares libres'}</Texto>
          </View>
          {seleccionados.map((n) => (
            <View key={n.id} style={estilos.seleccionado}>
              <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(n.nombre)}</Texto></View>
              <Texto style={[estilos.asignadoNombre, { flex: 1 }]}>{n.nombre}</Texto>
              <TouchableOpacity style={estilos.quitar} onPress={() => setNinoIds(ninoIds.filter((id) => id !== n.id))}>
                <Feather name="x" size={15} color={colores.error} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={[estilos.agregar, errores.nino && { borderColor: colores.error }, restantes <= 0 && { opacity: 0.5 }]}
            disabled={restantes <= 0} onPress={() => setAgregando(true)} activeOpacity={0.8}>
            <Feather name="plus" size={16} color={colores.azul} />
            <Texto style={estilos.agregarTexto}>{restantes <= 0 ? 'Cupo completo' : seleccionados.length ? 'Agregar otro niño' : 'Agregar niño'}</Texto>
          </TouchableOpacity>
          {errores.nino ? <Texto style={estilos.error}>{errores.nino}</Texto> : null}
          {excedido ? <Texto style={estilos.error}>Seleccionaste {ninoIds.length} niños pero este bloque solo tiene {espacios} lugar(es) libre(s). Quita {ninoIds.length - espacios}.</Texto> : null}
        </View>
        <Selector etiqueta="Profesional" obligatorio valor={profId} onChange={setProfId} error={errores.prof} placeholder="Seleccionar profesional"
          opciones={profes.map((p) => ({ valor: p.id, etiqueta: p.nombre }))} />
        <Selector etiqueta="Sala" obligatorio valor={salaId} onChange={setSalaId} error={errores.sala} placeholder="Seleccionar sala"
          opciones={salas.map((s) => ({ valor: s.id, etiqueta: s.nombre }))} />
        <Selector etiqueta="Día" valor={dia} onChange={setDia} opciones={[1, 2, 3, 4, 5].map((d) => ({ valor: d, etiqueta: NOMBRES_DIA[d] }))} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Selector estiloContenedor={{ flex: 1 }} etiqueta="Turno" valor={turno} onChange={cambiarTurno}
            opciones={[{ valor: 'Mañana', etiqueta: 'Mañana (8:00 a 12:00)' }, { valor: 'Tarde', etiqueta: 'Tarde (14:00 a 19:00)' }]} />
          <Selector estiloContenedor={{ flex: 1 }} etiqueta="Hora de inicio" valor={hora} onChange={setHora} opciones={TURNOS[turno].map((h) => ({ valor: h, etiqueta: h }))} />
        </View>
        {delSala ? (
          <View style={{ marginBottom: 14 }}>
            <Texto style={estilos.etiqueta}>Actividad</Texto>
            <View style={estilos.turno}><Texto style={estilos.turnoTexto}>{delSala.actividad} (bloque existente)</Texto></View>
          </View>
        ) : (
          <Selector etiqueta="Actividad del nuevo bloque" valor={actividad} onChange={setActividad} opciones={ACTIVIDADES} />
        )}

        <Texto style={estilos.seccion}>Disponibilidad</Texto>
        <View style={estilos.tarjeta}>
          <Chequeo ok={!conflictoProf} titulo={conflictoProf ? 'Profesional con otro bloque' : 'Profesional disponible'} texto={conflictoProf ? 'Ya atiende otra sala en este horario' : 'Sin cruces en este horario'} />
          <View style={estilos.linea} />
          <Chequeo ok={!conflictoSala} titulo={conflictoSala ? 'Sala ocupada' : 'Sala disponible'} texto={conflictoSala ? 'Otro profesional usa la sala a esta hora' : `Capacidad para ${Math.max(max - ninosEnBloque.length, 0)} niños más`} />
          <View style={estilos.linea} />
          <Chequeo ok={!cupoLleno && !yaAsignado && !excedido} titulo={yaAsignado ? 'Niño ya asignado' : excedido ? 'Demasiados niños' : cupoLleno ? 'Bloque lleno' : 'Cupo disponible'} texto={yaAsignado ? 'Alguno ya está en este bloque; quítalo de la lista' : excedido ? `Solo caben ${espacios} más en este bloque` : cupoLleno ? `Máximo de ${max} niños alcanzado` : `Se pueden agregar hasta ${espacios} niño(s)`} />
        </View>

        {ninosEnBloque.length > 0 ? (
          <>
            <Texto style={estilos.seccionChica}>NIÑOS YA ASIGNADOS</Texto>
            {ninosEnBloque.map((n) => (
              <View key={n.id} style={estilos.asignado}>
                <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(n.nombre)}</Texto></View>
                <Texto style={estilos.asignadoNombre}>{n.nombre}</Texto>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => navigation.goBack()} />
        <Boton texto={ninoIds.length > 1 ? `Guardar asignación (${ninoIds.length})` : 'Guardar asignación'} icono="check" style={{ flex: 1.6, marginBottom: 0 }} onPress={guardar} />
      </View>
      <SelectorModal visible={agregando} titulo="Agregar niño" opciones={disponibles.map((n) => ({ valor: n.id, etiqueta: n.nombre }))}
        onElegir={(id) => setNinoIds([...ninoIds, id])} onCerrar={() => setAgregando(false)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  capacidad: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.azulClaro, borderRadius: 14, padding: 14, marginBottom: 16 },
  capacidadTitulo: { fontSize: 12, fontWeight: '700', color: colores.azul },
  capacidadSub: { fontSize: 11, color: colores.textoSuave },
  capacidadValor: { fontSize: 20, fontWeight: '800', color: colores.azul },
  etiqueta: { fontSize: 13, fontWeight: '600', color: colores.texto, marginBottom: 7 },
  ninosTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ninosCuenta: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  seleccionado: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 8, marginBottom: 8 },
  quitar: { width: 30, height: 30, borderRadius: 10, backgroundColor: colores.rojoClaro, alignItems: 'center', justifyContent: 'center' },
  agregar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colores.azul, backgroundColor: colores.azulClaro },
  agregarTexto: { fontSize: 13, fontWeight: '700', color: colores.azul },
  error: { color: colores.error, fontSize: 12, marginTop: 5 },
  turno: { backgroundColor: '#EDF1F6', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14 },
  turnoTexto: { fontSize: 14, color: colores.textoSuave, fontWeight: '500' },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginTop: 8, marginBottom: 10 },
  seccionChica: { fontSize: 10, fontWeight: '700', color: colores.textoSuave, letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  tarjeta: { ...tarjeta, padding: 12 },
  chequeo: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  chequeoIcono: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  chequeoTitulo: { fontSize: 13, fontWeight: '700', color: colores.marino },
  chequeoTexto: { fontSize: 11, color: colores.textoSuave },
  linea: { height: 1, backgroundColor: colores.borde },
  asignado: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 8 },
  avatar: { width: 34, height: 34, borderRadius: 11, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  iniciales: { fontSize: 12, fontWeight: '700', color: colores.azul },
  asignadoNombre: { fontSize: 13, fontWeight: '600', color: colores.marino },
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

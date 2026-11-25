import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBase } from '../supabase';
import Texto from '../components/Texto';
import Chip from '../components/Chip';
import Boton from '../components/Boton';
import Insignia from '../components/Insignia';
import Fab from '../components/Fab';
import { colores, tarjeta } from '../tema';
import { useConsulta } from '../hooks';
import { obtenerFeriados } from '../api';
import { obtenerSuspensiones, agregarSuspension, eliminarSuspension } from '../datos';
import { isoADmy, hoyISO, NOMBRES_DIA } from '../utiles';

const DIAS = ['Domingo', ...NOMBRES_DIA.slice(1), 'Sábado'];
const diaDe = (iso) => { const [a, m, d] = iso.split('-').map(Number); return DIAS[new Date(a, m - 1, d).getDay()]; };

// Suspensiones. Patrón A (catálogo + guardados): la API trae el catálogo de feriados de Bolivia y el
// administrador guarda en Supabase los que suspenden la atención. Los tres estados de la API:
// cargando, error (con «Reintentar») y datos.
export default function FeriadosScreen({ navigation }) {
  const db = useBase();
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'error' | 'datos'
  const [feriados, setFeriados] = useState([]);
  const [mensajeError, setMensajeError] = useState('');
  const guardadas = useConsulta(obtenerSuspensiones);

  const cargar = useCallback(async (cancelado = { valor: false }) => {
    setEstado('cargando');
    try {
      const lista = await obtenerFeriados(anio, 'BO');
      if (cancelado.valor) return;
      setFeriados(lista);
      setEstado('datos');
    } catch (e) {
      if (cancelado.valor) return;
      setMensajeError(e.message);
      setEstado('error');
    }
  }, [anio]);

  useEffect(() => {
    const cancelado = { valor: false };
    cargar(cancelado);
    return () => { cancelado.valor = true; };
  }, [cargar]);

  const lista = guardadas.datos ?? [];
  const estaGuardado = (fecha) => lista.some((s) => s.fecha === fecha);
  const hoy = hoyISO();

  // Integración API + base: guardar o quitar la suspensión de un feriado
  const alternar = async (f) => {
    try {
      if (estaGuardado(f.fecha)) await eliminarSuspension(db, f.fecha);                                    // DELETE
      else await agregarSuspension(db, { fecha: f.fecha, motivo: f.nombre, origen: 'api' });             // INSERT
      guardadas.recargar();
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
    }
  };

  const quitar = (s) => Alert.alert('Quitar suspensión', `¿Quitar la suspensión del ${isoADmy(s.fecha)} (${s.motivo})?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Quitar', style: 'destructive', onPress: async () => { await eliminarSuspension(db, s.fecha); guardadas.recargar(); } },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Texto style={estilos.explicacion}>Elige qué feriados suspenden la atención del centro. Los días suspendidos no tienen sesiones ni asistencia.</Texto>

        <View style={estilos.cabeceraSeccion}>
          <Texto style={estilos.seccion}>Feriados de Bolivia</Texto>
          <View style={{ flexDirection: 'row' }}>
            {[anioActual, anioActual + 1].map((a) => <Chip key={a} texto={String(a)} activo={anio === a} onPress={() => setAnio(a)} />)}
          </View>
        </View>

        {estado === 'cargando' ? (
          <View style={estilos.estado}>
            <ActivityIndicator size="large" color={colores.azul} />
            <Texto style={estilos.estadoTexto}>Consultando los feriados de {anio}…</Texto>
          </View>
        ) : null}

        {estado === 'error' ? (
          <View style={estilos.estado}>
            <View style={estilos.errorIcono}><Feather name="wifi-off" size={26} color={colores.error} /></View>
            <Texto style={estilos.errorTitulo}>No se pudieron cargar los feriados</Texto>
            <Texto style={estilos.estadoTexto}>{mensajeError}</Texto>
            <Boton texto="Reintentar" icono="refresh-cw" onPress={() => cargar()} style={{ alignSelf: 'stretch', marginTop: 12 }} />
            <Texto style={estilos.estadoNota}>Las suspensiones ya guardadas se ven abajo aunque no haya internet.</Texto>
          </View>
        ) : null}

        {estado === 'datos' ? (
          feriados.length === 0 ? <Texto style={estilos.vacio}>No hay feriados para {anio}.</Texto> :
          feriados.map((f) => {
            const activo = estaGuardado(f.fecha);
            const pasado = f.fecha < hoy;
            return (
              <View key={f.fecha + f.nombre} style={[estilos.fila, pasado && { opacity: 0.6 }]}>
                <View style={estilos.fecha}>
                  <Texto style={estilos.fechaDia}>{f.fecha.slice(8)}</Texto>
                  <Texto style={estilos.fechaMes}>{isoADmy(f.fecha).slice(3, 5)}/{f.fecha.slice(2, 4)}</Texto>
                </View>
                <View style={{ flex: 1 }}>
                  <Texto style={estilos.nombre}>{f.nombre}</Texto>
                  <Texto style={estilos.sub}>{diaDe(f.fecha)} · {f.global ? 'Nacional' : 'Regional'}</Texto>
                </View>
                <TouchableOpacity style={[estilos.boton, activo && estilos.botonActivo]} onPress={() => alternar(f)} activeOpacity={0.8}>
                  <Feather name={activo ? 'check' : 'slash'} size={13} color={activo ? '#fff' : colores.alerta} />
                  <Texto style={[estilos.botonTexto, activo && { color: '#fff' }]}>{activo ? 'Suspendida' : 'Suspender'}</Texto>
                </TouchableOpacity>
              </View>
            );
          })
        ) : null}

        <Texto style={[estilos.seccion, { marginTop: 22, marginBottom: 10 }]}>Suspensiones guardadas ({lista.length})</Texto>
        {lista.length === 0 ? <Texto style={estilos.vacio}>Todavía no hay suspensiones guardadas.</Texto> : null}
        {lista.map((s) => (
          <View key={s.fecha} style={estilos.fila}>
            <View style={[estilos.fecha, { backgroundColor: colores.naranjaClaro }]}>
              <Texto style={[estilos.fechaDia, { color: colores.alerta }]}>{s.fecha.slice(8)}</Texto>
              <Texto style={estilos.fechaMes}>{isoADmy(s.fecha).slice(3, 5)}/{s.fecha.slice(2, 4)}</Texto>
            </View>
            <View style={{ flex: 1 }}>
              <Texto style={estilos.nombre}>{s.motivo}</Texto>
              <Texto style={estilos.sub}>{diaDe(s.fecha)} · {isoADmy(s.fecha)}</Texto>
            </View>
            <Insignia texto={s.origen === 'api' ? 'Feriado (API)' : 'Manual'} tipo={s.origen === 'api' ? 'azul' : 'gris'} punto={false} />
            <TouchableOpacity style={estilos.quitar} onPress={() => quitar(s)}><Feather name="trash-2" size={15} color={colores.error} /></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <Fab texto="Agregar manual" onPress={() => navigation.navigate('FormularioSuspension')} />
    </View>
  );
}

const estilos = StyleSheet.create({
  explicacion: { fontSize: 12, color: colores.textoSuave, marginBottom: 14 },
  cabeceraSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino },
  estado: { ...tarjeta, padding: 22, alignItems: 'center' },
  estadoTexto: { fontSize: 12, color: colores.textoSuave, textAlign: 'center', marginTop: 8 },
  estadoNota: { fontSize: 11, color: colores.textoSuave, textAlign: 'center', marginTop: 4 },
  errorIcono: { width: 54, height: 54, borderRadius: 18, backgroundColor: colores.rojoClaro, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  errorTitulo: { fontSize: 15, fontWeight: '700', color: colores.marino },
  vacio: { textAlign: 'center', color: colores.textoSuave, paddingVertical: 14 },
  fila: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  fecha: { width: 48, height: 48, borderRadius: 14, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fechaDia: { fontSize: 17, fontWeight: '800', color: colores.azul },
  fechaMes: { fontSize: 9, color: colores.textoSuave },
  nombre: { fontSize: 13, fontWeight: '700', color: colores.marino },
  sub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  boton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colores.alerta, backgroundColor: '#fff' },
  botonActivo: { backgroundColor: colores.alerta, borderColor: colores.alerta },
  botonTexto: { fontSize: 11, fontWeight: '700', color: colores.alerta },
  quitar: { width: 32, height: 32, borderRadius: 10, backgroundColor: colores.rojoClaro, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});

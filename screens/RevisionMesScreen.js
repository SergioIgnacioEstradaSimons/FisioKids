import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Texto from '../components/Texto';
import Pasos from '../components/Pasos';
import Boton from '../components/Boton';
import { colores, degradadoTarjeta, tarjeta } from '../tema';
import Estado from '../components/Estado';
import { useConsulta } from '../hooks';
import { contarTotales } from '../datos';

const ESTILOS = {
  ok: { fondo: colores.verdeClaro, color: colores.exito, icono: 'check' },
  alerta: { fondo: colores.naranjaClaro, color: colores.alerta, icono: 'alert-triangle' },
  error: { fondo: colores.rojoClaro, color: colores.error, icono: 'alert-triangle' },
  info: { fondo: colores.azulClaro, color: colores.azul, icono: 'calendar' },
};

// Paso 3 de 3. Las validaciones son EJEMPLOS de avisos (conflictos de sala, bloque sobre capacidad…).
// Al tocar un conflicto se puede marcar como corregido para probar el flujo.
export default function RevisionMesScreen(props) {
  const { datos, cargando, error, recargar } = useConsulta(contarTotales);
  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  return <Revision {...props} totales={datos} />;
}

function Revision({ navigation, route, totales }) {
  const insets = useSafeAreaInsets();
  const { mes = 'Diciembre', anio = 2026, cantidad = 0 } = route.params ?? {};
  const profes = totales.profesionales;
  const [items, setItems] = useState([
    { id: 'dup', tipo: 'ok', titulo: 'Sin horarios duplicados', texto: 'Todas las sesiones tienen horarios únicos', conflicto: 0 },
    { id: 'prof', tipo: 'ok', titulo: 'Profesionales disponibles', texto: `${profes} profesionales confirmados`, conflicto: 0 },
    { id: 'sala', tipo: 'alerta', titulo: '2 conflictos de sala', texto: 'Revisa Sala Motriz: 8 y 15 del mes', conflicto: 2 },
    { id: 'cap', tipo: 'error', titulo: '1 bloque supera capacidad', texto: 'Martes 22 · 09:00 tiene 5 niños', conflicto: 1 },
    { id: 'sus', tipo: 'info', titulo: '1 fecha suspendida', texto: 'Viernes 25 · Feriado (Navidad)', conflicto: 0 },
  ]);
  const pendientes = items.reduce((t, i) => t + i.conflicto, 0);

  const abrir = (i) => {
    if (i.conflicto === 0) return;
    Alert.alert(i.titulo, i.texto, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Marcar como corregido', onPress: () => setItems(items.map((x) => (x.id === i.id ? { ...x, tipo: 'ok', conflicto: 0, titulo: 'Corregido: ' + x.titulo.replace(/^\d+ /, '') } : x))) },
    ]);
  };

  const confirmar = () => {
    if (pendientes > 0) return Alert.alert('Requiere ajustes', `Corrige los ${pendientes} conflictos antes de confirmar.`);
    Alert.alert('Programación confirmada', 'Los conflictos están resueltos. La generación automática de sesiones queda como mejora futura.', [{ text: 'Aceptar', onPress: () => navigation.popToTop() }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Pasos actual={3} />
        <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.resumen}>
          <Texto style={estilos.mes}>{mes.toUpperCase()} {anio}</Texto>
          <Texto style={estilos.sesiones}>{cantidad * 4} sesiones programadas</Texto>
          <View style={estilos.stats}>
            {[[cantidad, 'niños'], [profes, 'profesionales'], [totales.salas, 'salas']].map(([v, e]) => (
              <View key={e} style={{ alignItems: 'center', flex: 1 }}>
                <Texto style={estilos.statValor}>{v}</Texto>
                <Texto style={estilos.statEtiqueta}>{e}</Texto>
              </View>
            ))}
          </View>
        </LinearGradient>

        <Texto style={estilos.seccion}>Validación del periodo</Texto>
        {items.map((i) => {
          const e = ESTILOS[i.tipo];
          return (
            <TouchableOpacity key={i.id} style={estilos.item} activeOpacity={i.conflicto ? 0.7 : 1} onPress={() => abrir(i)}>
              <View style={[estilos.icono, { backgroundColor: e.fondo }]}><Feather name={e.icono} size={17} color={e.color} /></View>
              <View style={{ flex: 1 }}>
                <Texto style={estilos.itemTitulo}>{i.titulo}</Texto>
                <Texto style={estilos.itemTexto}>{i.texto}</Texto>
              </View>
              {i.conflicto ? <Feather name="chevron-right" size={18} color={colores.textoSuave} /> : null}
            </TouchableOpacity>
          );
        })}

        <View style={[estilos.banner, pendientes === 0 && { backgroundColor: '#E9F8F1', borderColor: '#BDE8D3' }]}>
          <Feather name={pendientes ? 'alert-triangle' : 'check-circle'} size={17} color={pendientes ? colores.alerta : colores.exito} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Texto style={[estilos.bannerTitulo, pendientes === 0 && { color: colores.exito }]}>{pendientes ? 'Requiere ajustes' : 'Listo para confirmar'}</Texto>
            <Texto style={estilos.bannerTexto}>{pendientes ? `Corrige los ${pendientes} conflictos antes de confirmar.` : 'No quedan conflictos pendientes.'}</Texto>
          </View>
        </View>
      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={{ justifyContent: 'center', paddingHorizontal: 4 }} onPress={() => navigation.goBack()}><Texto style={estilos.volver}>Volver a editar</Texto></TouchableOpacity>
        <Boton texto="Guardar borrador" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => Alert.alert('Borrador', 'La programación mensual completa se genera en la versión final; por ahora se revisa y valida.')} />
        <Boton texto="Confirmar" style={{ flex: 1, marginBottom: 0 }} onPress={confirmar} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  resumen: { borderRadius: 20, padding: 18, alignItems: 'center', marginBottom: 18 },
  mes: { fontSize: 10, fontWeight: '700', color: colores.menta, letterSpacing: 1 },
  sesiones: { fontSize: 22, fontWeight: '800', color: '#fff', marginVertical: 8 },
  stats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 6 },
  statValor: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statEtiqueta: { fontSize: 10, color: '#CFEAEC' },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  item: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
  icono: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemTitulo: { fontSize: 13, fontWeight: '700', color: colores.marino },
  itemTexto: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.naranjaClaro, borderWidth: 1, borderColor: '#F6D9AE', borderRadius: 14, padding: 12, marginTop: 6 },
  bannerTitulo: { fontSize: 12, fontWeight: '700', color: colores.alerta },
  bannerTexto: { fontSize: 11, color: colores.textoSuave },
  barra: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
  volver: { fontSize: 12, fontWeight: '700', color: colores.azul },
});

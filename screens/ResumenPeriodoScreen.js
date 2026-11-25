import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Anillo from '../components/Anillo';
import Insignia from '../components/Insignia';
import Estado from '../components/Estado';
import { iniciales } from '../components/TarjetaNino';
import { colores, degradadoTarjeta, tarjeta } from '../tema';
import { useConsulta } from '../hooks';
import { resumenPeriodo } from '../datos';

function Dato({ icono, color, fondo, valor, etiqueta }) {
  return (
    <View style={estilos.dato}>
      <View style={[estilos.datoIcono, { backgroundColor: fondo }]}><Feather name={icono} size={16} color={color} /></View>
      <Texto style={estilos.datoValor}>{valor}</Texto>
      <Texto style={estilos.datoEtiqueta}>{etiqueta}</Texto>
    </View>
  );
}

// Parámetros: mes (nombre), anio, mesIdx (0-11). Resumen de un periodo calculado con COUNT / SUM sobre asistencias.
export default function ResumenPeriodoScreen({ route }) {
  const { mes = 'Octubre', anio = 2026, mesIdx = 9 } = route.params ?? {};
  const { datos: r, cargando, error, recargar } = useConsulta((db) => resumenPeriodo(db, anio, mesIdx), [anio, mesIdx]);
  if (!r) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  const maxSesiones = Math.max(...r.porProfesional.map((x) => x.sesiones), 1);

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.resumen}>
        <View style={{ flex: 1 }}>
          <Texto style={estilos.etiqueta}>{mes.toUpperCase()} {anio}</Texto>
          <Texto style={estilos.sesiones}>{r.total} sesiones</Texto>
          <Texto style={estilos.sub}>{r.presentes} asistidas · {r.faltas} faltas</Texto>
          <View style={{ marginTop: 10, alignSelf: 'flex-start' }}><Insignia texto="Cerrado" tipo="gris" /></View>
        </View>
        <Anillo porcentaje={r.porcentaje} tam={72} />
      </LinearGradient>

      <View style={estilos.fila}>
        <Dato icono="check" color={colores.exito} fondo={colores.verdeClaro} valor={r.presentes} etiqueta="Presentes" />
        <Dato icono="x" color={colores.error} fondo={colores.rojoClaro} valor={r.faltas} etiqueta="Faltas" />
        <Dato icono="alert-triangle" color={colores.alerta} fondo={colores.naranjaClaro} valor={r.suspendidas} etiqueta="Días suspendidos" />
      </View>

      <Texto style={estilos.seccion}>Sesiones por profesional</Texto>
      <View style={estilos.bloque}>
        {r.porProfesional.length === 0 ? <Texto style={estilos.vacio}>Sin sesiones registradas en este periodo.</Texto> : null}
        {r.porProfesional.map((x, i) => (
          <View key={x.id} style={[estilos.profesional, i > 0 && estilos.separador]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Texto style={estilos.nombre}>{x.nombre}</Texto>
              <Texto style={estilos.nombre}>{x.sesiones}</Texto>
            </View>
            <View style={estilos.barraFondo}><View style={[estilos.barra, { width: `${(x.sesiones / maxSesiones) * 100}%` }]} /></View>
          </View>
        ))}
      </View>

      <Texto style={[estilos.seccion, { marginTop: 18 }]}>Asistencia por niño</Texto>
      {r.porNino.map((x) => {
        const pct = Math.round((x.presentes / x.total) * 100);
        const faltas = x.total - x.presentes;
        return (
          <View key={x.id} style={estilos.nino}>
            <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(x.nombre)}</Texto></View>
            <View style={{ flex: 1 }}>
              <Texto style={estilos.nombre}>{x.nombre}</Texto>
              <Texto style={estilos.detalle}>{x.presentes} de {x.total} sesiones · {faltas} {faltas === 1 ? 'falta' : 'faltas'}</Texto>
            </View>
            <Insignia texto={`${pct}%`} tipo={pct >= 85 ? 'verde' : pct >= 65 ? 'naranja' : 'rojo'} punto={false} />
          </View>
        );
      })}

      <View style={estilos.nota}>
        <Feather name="shield" size={16} color={colores.exito} />
        <Texto style={estilos.notaTexto}>Periodo cerrado: sus sesiones, asistencias y actividades no cambian aunque se modifique la programación nueva.</Texto>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  resumen: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 18, marginBottom: 12 },
  etiqueta: { fontSize: 10, fontWeight: '700', color: colores.menta, letterSpacing: 1 },
  sesiones: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 6 },
  sub: { fontSize: 12, color: '#D6EEF0', marginTop: 2 },
  fila: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  dato: { ...tarjeta, flex: 1, padding: 12 },
  datoIcono: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  datoValor: { fontSize: 20, fontWeight: '800', color: colores.marino },
  datoEtiqueta: { fontSize: 10, color: colores.textoSuave, marginTop: 2 },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  bloque: { ...tarjeta, paddingHorizontal: 14 },
  profesional: { paddingVertical: 12 },
  separador: { borderTopWidth: 1, borderTopColor: colores.borde },
  nombre: { fontSize: 13, fontWeight: '700', color: colores.marino },
  vacio: { color: colores.textoSuave, fontStyle: 'italic', paddingVertical: 14, textAlign: 'center' },
  barraFondo: { height: 6, borderRadius: 3, backgroundColor: '#E6EDF5', marginTop: 8 },
  barra: { height: 6, borderRadius: 3, backgroundColor: colores.azul },
  nino: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
  avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  iniciales: { fontSize: 12, fontWeight: '700', color: colores.azul },
  detalle: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  nota: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E9F8F1', borderWidth: 1, borderColor: '#BDE8D3', borderRadius: 14, padding: 12, marginTop: 14, gap: 10 },
  notaTexto: { flex: 1, fontSize: 11, color: colores.exito, fontWeight: '600' },
});

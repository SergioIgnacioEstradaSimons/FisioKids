import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Insignia from '../components/Insignia';
import { colores, degradadoTarjeta, tarjeta } from '../tema';
import Estado from '../components/Estado';
import { useConsulta } from '../hooks';
import { contarTotales, contarSesionesDelMes } from '../datos';
import { MESES, mayuscula } from '../utiles';

function Opcion({ icono, titulo, texto, onPress, resaltada }) {
  return (
    <TouchableOpacity style={[estilos.opcion, resaltada && { borderColor: '#B9D4F7' }]} onPress={onPress} activeOpacity={0.8}>
      <View style={estilos.opcionIcono}><Feather name={icono} size={18} color={colores.azul} /></View>
      <View style={{ flex: 1 }}>
        <Texto style={estilos.opcionTitulo}>{titulo}</Texto>
        <Texto style={estilos.opcionTexto}>{texto}</Texto>
      </View>
      <Feather name="chevron-right" size={18} color={colores.textoSuave} />
    </TouchableOpacity>
  );
}

export default function MesScreen({ navigation }) {
  const hoy = new Date();
  const nombreMes = (delta) => {
    const f = new Date(hoy.getFullYear(), hoy.getMonth() + delta, 1);
    return { nombre: mayuscula(MESES[f.getMonth()]), anio: f.getFullYear(), idx: f.getMonth() };
  };
  const actual = nombreMes(0);
  const anteriores = [nombreMes(-1), nombreMes(-2)];
  const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const transcurrido = Math.round((hoy.getDate() / diasMes) * 100);

  // COUNT de totales y de asistencias registradas en cada mes (tabla asistencias)
  const { datos, cargando, error, recargar } = useConsulta(async (db) => ({
    totales: await contarTotales(db),
    sesionesMes: await contarSesionesDelMes(db, hoy.getFullYear(), hoy.getMonth()),
    anteriores: await Promise.all(anteriores.map(async (p) => ({ ...p, sesiones: await contarSesionesDelMes(db, p.anio, p.idx) }))),
  }));

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Estado cargando={cargando && !datos} error={error} recargar={recargar} />
      {datos ? <>
      <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.periodo}>
        <Texto style={estilos.periodoEtiqueta}>PERIODO ACTUAL</Texto>
        <Texto style={estilos.periodoMes}>{actual.nombre} {actual.anio}</Texto>
        <View style={estilos.progresoFondo}><View style={[estilos.progreso, { width: `${transcurrido}%` }]} /></View>
        <Texto style={estilos.periodoSub}>Mes en curso · {transcurrido}% transcurrido · {datos.sesionesMes} sesiones registradas</Texto>
      </LinearGradient>

      <View style={estilos.stats}>
        {[['user-plus', colores.azul, datos.totales.activos, 'Niños'], ['calendar', colores.exito, datos.sesionesMes, 'Sesiones'], ['users', colores.morado, datos.totales.profesionales, 'Profesionales'], ['layout', colores.alerta, datos.totales.salas, 'Salas']].map(([ic, c, v, e]) => (
          <View key={e} style={estilos.stat}>
            <Feather name={ic} size={16} color={c} />
            <Texto style={estilos.statValor}>{v}</Texto>
            <Texto style={estilos.statEtiqueta}>{e}</Texto>
          </View>
        ))}
      </View>

      <Texto style={estilos.seccion}>Nueva programación</Texto>
      <Opcion resaltada icono="plus" titulo="Generar desde cero" texto="Crea una programación vacía y agrega las sesiones manualmente." onPress={() => navigation.navigate('ConfigurarMes', { origen: 'cero' })} />
      <Opcion icono="layers" titulo="Copiar mes anterior" texto="Usa el mes como plantilla y modifica solo lo necesario." onPress={() => navigation.navigate('ConfigurarMes', { origen: 'copiar', desde: anteriores[0].nombre })} />

      <Texto style={[estilos.seccion, { marginTop: 18 }]}>Periodos anteriores</Texto>
      {datos.anteriores.map((p) => (
        <TouchableOpacity key={p.nombre} style={estilos.anterior} activeOpacity={0.8}
          onPress={() => navigation.navigate('ResumenPeriodo', { mes: p.nombre, anio: p.anio, mesIdx: p.idx })}>
          <View style={estilos.anteriorIcono}><Texto style={estilos.anteriorSigla}>{p.nombre.slice(0, 2).toUpperCase()}</Texto></View>
          <View style={{ flex: 1 }}>
            <Texto style={estilos.anteriorNombre}>{p.nombre} {p.anio}</Texto>
            <Texto style={estilos.anteriorSub}>{p.sesiones} sesiones · Cerrado</Texto>
          </View>
          <Insignia texto="Cerrado" tipo="gris" />
          <Feather name="chevron-right" size={18} color={colores.textoSuave} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      ))}

      <View style={estilos.nota}>
        <Feather name="shield" size={16} color={colores.exito} />
        <Texto style={estilos.notaTexto}>Historial protegido: cada periodo conserva sus sesiones, asistencias y actividades sin cambios.</Texto>
      </View>
      </> : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  periodo: { borderRadius: 20, padding: 18, marginBottom: 12 },
  periodoEtiqueta: { fontSize: 10, fontWeight: '700', color: colores.menta, letterSpacing: 1 },
  periodoMes: { fontSize: 24, fontWeight: '800', color: '#fff', marginVertical: 6 },
  progresoFondo: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 4 },
  progreso: { height: 6, borderRadius: 3, backgroundColor: colores.menta },
  periodoSub: { fontSize: 11, color: '#CFEAEC', marginTop: 8 },
  stats: { ...tarjeta, flexDirection: 'row', paddingVertical: 14, marginBottom: 18 },
  stat: { flex: 1, alignItems: 'center' },
  statValor: { fontSize: 18, fontWeight: '800', color: colores.marino, marginTop: 4 },
  statEtiqueta: { fontSize: 10, color: colores.textoSuave },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  opcion: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10 },
  opcionIcono: { width: 40, height: 40, borderRadius: 12, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  opcionTitulo: { fontSize: 14, fontWeight: '700', color: colores.marino },
  opcionTexto: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  anterior: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
  anteriorIcono: { width: 40, height: 40, borderRadius: 12, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  anteriorSigla: { fontSize: 12, fontWeight: '700', color: colores.azul },
  anteriorNombre: { fontSize: 14, fontWeight: '700', color: colores.marino },
  anteriorSub: { fontSize: 11, color: colores.textoSuave },
  nota: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E9F8F1', borderWidth: 1, borderColor: '#BDE8D3', borderRadius: 14, padding: 12, marginTop: 10, gap: 10 },
  notaTexto: { flex: 1, fontSize: 11, color: colores.exito, fontWeight: '600' },
});

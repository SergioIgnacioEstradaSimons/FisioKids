import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Anillo from '../components/Anillo';
import Estado from '../components/Estado';
import Avatar from '../components/Avatar';
import { colores, degradadoTarjeta, tarjeta } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import AvisoSuspension from '../components/AvisoSuspension';
import { contarTotales, resumenDelDia, obtenerBloques, obtenerNinosDeBloque, obtenerSuspensionDeFecha } from '../datos';
import { diaLaboralDeHoy, fechaLarga, saludo, hoyISO, horaActual } from '../utiles';

function Dato({ icono, tinte, color, valor, etiqueta, onPress }) {
  return (
    <TouchableOpacity style={estilos.dato} onPress={onPress} activeOpacity={0.8}>
      <View style={[estilos.datoIcono, { backgroundColor: tinte }]}><Feather name={icono} size={17} color={color} /></View>
      <Texto style={estilos.valor}>{valor}</Texto>
      <Texto style={estilos.etiqueta}>{etiqueta}</Texto>
    </TouchableOpacity>
  );
}

function Acceso({ icono, texto, onPress }) {
  return (
    <TouchableOpacity style={estilos.acceso} onPress={onPress} activeOpacity={0.8}>
      <View style={estilos.accesoIcono}><Feather name={icono} size={18} color={colores.azul} /></View>
      <Texto style={estilos.accesoTexto}>{texto}</Texto>
    </TouchableOpacity>
  );
}

export default function InicioAdminScreen({ navigation }) {
  const { usuario } = useSesion();
  const hoy = diaLaboralDeHoy(); // null si es fin de semana
  const { datos, cargando, error, recargar } = useConsulta(async (db) => {
    const ahora = horaActual();
    const suspension = await obtenerSuspensionDeFecha(db, hoyISO()); // feriado o día sin atención guardado en SQLite
    const totales = await contarTotales(db);
    const dia = await resumenDelDia(db, hoy, hoyISO());
    // Próximas sesiones: las de hoy que todavía no terminaron
    const bloques = hoy && !suspension ? (await obtenerBloques(db, hoy)).filter((b) => b.hora_fin > ahora).slice(0, 3) : [];
    const conNino = await Promise.all(bloques.map(async (b) => ({ ...b, primero: (await obtenerNinosDeBloque(db, b.id))[0] })));
    return { totales, dia, bloques: conNino, suspension };
  }, [hoy]);

  const t = datos?.totales;
  const d = datos?.dia;
  // El porcentaje sale de las asistencias realmente registradas, no de la hora del día
  const sinRegistrar = d ? Math.max(d.programadas - d.registradas, 0) : 0;
  const porcentaje = d && d.programadas ? Math.round((d.registradas / d.programadas) * 100) : 0;

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={estilos.contenido}>
      <View style={estilos.saludoFila}>
        <View style={{ flex: 1 }}>
          <Texto style={estilos.fecha}>{fechaLarga()}</Texto>
          <Texto style={estilos.saludo}>{saludo()}, {usuario?.nombre?.split(' ')[0]}</Texto>
          <Texto style={estilos.sub}>Todo está listo para hoy.</Texto>
        </View>
        <Avatar foto={usuario?.foto} nombre={usuario?.nombre} tam={44} radio={14} />
      </View>

      <Estado cargando={cargando && !datos} error={error} recargar={recargar} />
      {datos ? (
        <>
          <AvisoSuspension suspension={datos.suspension} />
          <View style={estilos.rejilla}>
            <Dato icono="user-plus" tinte={colores.azulClaro} color={colores.azul} valor={t.ninos} etiqueta="Niños registrados" onPress={() => navigation.navigate('Niños')} />
            <Dato icono="users" tinte={colores.verdeClaro} color={colores.exito} valor={t.profesionales} etiqueta="Profesionales" onPress={() => navigation.navigate('Profesionales')} />
            <Dato icono="layout" tinte={colores.moradoClaro} color={colores.morado} valor={t.salas} etiqueta="Salas activas" onPress={() => navigation.navigate('Salas')} />
            <Dato icono="calendar" tinte={colores.naranjaClaro} color={colores.alerta} valor={d.programadas} etiqueta="Sesiones hoy" onPress={() => navigation.navigate('SesionesHoy')} />
          </View>

          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('SesionesHoy')}>
            <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.asistencia}>
              <View style={{ flex: 1 }}>
                <Texto style={estilos.asistenciaEtiqueta}>RESUMEN DEL DÍA</Texto>
                {hoy && !datos.suspension ? (
                  <>
                    <Texto style={estilos.asistenciaValor}>{d.registradas} de {d.programadas} asistencias registradas</Texto>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                      <Texto style={estilos.leyenda}><Texto style={{ color: colores.menta }}>● </Texto>{d.presentes} presentes</Texto>
                      <Texto style={[estilos.leyenda, { marginLeft: 12 }]}><Texto style={{ color: '#F6B26B' }}>● </Texto>{d.faltas} faltas</Texto>
                      {sinRegistrar > 0 ? <Texto style={[estilos.leyenda, { marginLeft: 12 }]}><Texto style={{ color: '#9FB3C8' }}>● </Texto>{sinRegistrar} sin registrar</Texto> : null}
                    </View>
                    <Texto style={estilos.detalleEnlace}>Ver detalle de cada sesión ›</Texto>
                  </>
                ) : <Texto style={estilos.asistenciaValor}>{datos.suspension ? 'Hoy la atención está suspendida' : 'Hoy no hay sesiones (fin de semana)'}</Texto>}
              </View>
              <Anillo porcentaje={porcentaje} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={estilos.seccionFila}>
            <Texto style={estilos.seccion}>Próximas sesiones</Texto>
            <TouchableOpacity onPress={() => navigation.navigate('Horarios')}><Texto style={estilos.enlace}>Ver agenda</Texto></TouchableOpacity>
          </View>
          <View style={estilos.lista}>
            {datos.bloques.map((b, i) => (
              <TouchableOpacity key={b.id} style={[estilos.sesion, i > 0 && estilos.separador]} activeOpacity={0.8}
                onPress={() => navigation.navigate('DetalleBloque', { bloqueId: b.id })}>
                <Texto style={estilos.hora}>{b.hora_inicio}</Texto>
                <View style={[estilos.barra, { backgroundColor: i % 2 ? colores.turquesa : colores.azul }]} />
                <View style={{ flex: 1 }}>
                  <Texto style={estilos.nombre}>{b.primero?.nombre ?? b.actividad}</Texto>
                  <Texto style={estilos.detalle} numberOfLines={1}>{b.profesional_nombre} · {b.sala_nombre}</Texto>
                </View>
                <Feather name="chevron-right" size={18} color={colores.textoSuave} />
              </TouchableOpacity>
            ))}
            {datos.bloques.length === 0 ? <Texto style={estilos.vacio}>{hoy ? 'No quedan más sesiones hoy.' : 'Hoy no hay sesiones.'}</Texto> : null}
          </View>

          <Texto style={[estilos.seccion, { marginTop: 18, marginBottom: 10 }]}>Accesos rápidos</Texto>
          <View style={estilos.accesos}>
            <Acceso icono="user-plus" texto="Nuevo niño" onPress={() => navigation.navigate('FormularioNino')} />
            <Acceso icono="plus" texto="Asignar sesión" onPress={() => navigation.navigate('NuevaAsignacion')} />
            <Acceso icono="layers" texto="Generar mes" onPress={() => navigation.navigate('Mes')} />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, paddingBottom: 30 },
  saludoFila: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  fecha: { fontSize: 11, fontWeight: '700', color: colores.turquesa },
  saludo: { fontSize: 23, fontWeight: '800', color: colores.marino, marginTop: 2 },
  sub: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  iniciales: { width: 44, height: 44, borderRadius: 14, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center' },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  dato: { ...tarjeta, width: '48%', flexGrow: 1, padding: 14 },
  datoIcono: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  valor: { fontSize: 24, fontWeight: '800', color: colores.marino },
  etiqueta: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  asistencia: { borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  asistenciaEtiqueta: { fontSize: 10, fontWeight: '700', color: colores.menta, letterSpacing: 1 },
  asistenciaValor: { fontSize: 19, fontWeight: '800', color: '#fff', marginTop: 6 },
  leyenda: { fontSize: 11, color: '#D6EEF0' },
  detalleEnlace: { fontSize: 11, fontWeight: '700', color: colores.menta, marginTop: 10 },
  seccionFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 10 },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino },
  enlace: { fontSize: 12, fontWeight: '700', color: colores.azul },
  lista: { ...tarjeta, paddingHorizontal: 14 },
  sesion: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  separador: { borderTopWidth: 1, borderTopColor: colores.borde },
  hora: { width: 44, fontSize: 12, fontWeight: '700', color: colores.marino },
  barra: { width: 3, height: 32, borderRadius: 2, marginRight: 10 },
  nombre: { fontSize: 14, fontWeight: '700', color: colores.marino },
  detalle: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  vacio: { color: colores.textoSuave, fontStyle: 'italic', paddingVertical: 14, textAlign: 'center' },
  accesos: { flexDirection: 'row', gap: 10 },
  acceso: { ...tarjeta, flex: 1, alignItems: 'center', paddingVertical: 14 },
  accesoIcono: { width: 38, height: 38, borderRadius: 12, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  accesoTexto: { fontSize: 11, fontWeight: '600', color: colores.marino },
});

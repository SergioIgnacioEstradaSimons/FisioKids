import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Insignia from '../components/Insignia';
import Estado from '../components/Estado';
import Avatar from '../components/Avatar';
import { iniciales } from '../components/TarjetaNino';
import { colores, degradadoTarjeta, tarjeta } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import AvisoSuspension from '../components/AvisoSuspension';
import { obtenerBloquesConEstado, obtenerNinosDeBloque, obtenerSuspensionDeFecha } from '../datos';
import { diaLaboralDeHoy, hoyISO, horaActual, fechaLarga, saludo, estadoBloque } from '../utiles';

const COLORES_BARRA = [colores.turquesa, colores.azul, colores.alerta];

// Inicio del Profesional (la vista del Administrador es InicioAdminScreen)
export default function InicioScreen({ navigation }) {
  const { usuario } = useSesion();
  const dia = diaLaboralDeHoy();
  const { datos, cargando, error, recargar } = useConsulta(async (db) => {
    const suspension = await obtenerSuspensionDeFecha(db, hoyISO());
    const bloques = dia && !suspension ? await obtenerBloquesConEstado(db, dia, hoyISO(), usuario.id) : [];
    const siguiente = bloques.find((b) => !b.cerrado);
    const ninos = siguiente ? await obtenerNinosDeBloque(db, siguiente.id) : [];
    return { bloques, siguiente, ninos, suspension };
  }, [dia, usuario?.id]);

  const ahora = horaActual();
  const bloques = datos?.bloques ?? [];
  const atendidas = bloques.filter((b) => b.cerrado).length;

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={estilos.saludoFila}>
        <View style={{ flex: 1 }}>
          <Texto style={estilos.fecha}>{fechaLarga()}</Texto>
          <Texto style={estilos.saludo}>Hola, {usuario?.nombres?.split(' ')[0] ?? usuario?.nombre?.split(' ')[0]}</Texto>
          <Texto style={estilos.sub}>{usuario?.especialidad}</Texto>
        </View>
        <Avatar foto={usuario?.foto} nombre={usuario?.nombre} tam={46} radio={14} />
      </View>

      <Estado cargando={cargando && !datos} error={error} recargar={recargar} />
      {datos ? (
        <>
          <AvisoSuspension suspension={datos.suspension} />
          <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.jornada}>
            <Texto style={estilos.etiqueta}>TU JORNADA</Texto>
            <View style={estilos.cifras}>
              {[[bloques.length, 'sesiones'], [bloques.length - atendidas, 'pendientes'], [atendidas, 'atendidas']].map(([v, e], i) => (
                <View key={e} style={[estilos.cifra, i > 0 && estilos.cifraLinea]}>
                  <Texto style={estilos.valor}>{v}</Texto>
                  <Texto style={estilos.legenda}>{e}</Texto>
                </View>
              ))}
            </View>
            <TouchableOpacity style={estilos.verAgenda} onPress={() => navigation.navigate('Agenda')} activeOpacity={0.8}>
              <Texto style={estilos.verAgendaTexto}>Ver agenda completa</Texto>
            </TouchableOpacity>
          </LinearGradient>

          <View style={estilos.seccionFila}>
            <Texto style={estilos.seccion}>Siguiente bloque</Texto>
            {datos.siguiente ? <Insignia {...estadoBloque(datos.siguiente, true, ahora)} texto={estadoBloque(datos.siguiente, true, ahora).texto === 'Ahora' ? 'En curso' : estadoBloque(datos.siguiente, true, ahora).texto} /> : null}
          </View>
          {datos.siguiente ? (
            <TouchableOpacity style={estilos.siguiente} activeOpacity={0.85} onPress={() => navigation.navigate('AsistenciaBloque', { bloqueId: datos.siguiente.id })}>
              <View style={estilos.horaCaja}>
                <Texto style={estilos.horaGrande}>{datos.siguiente.hora_inicio}</Texto>
                <Texto style={estilos.horaMin}>60 min</Texto>
              </View>
              <View style={{ flex: 1 }}>
                <Texto style={estilos.siguienteSala}>{datos.siguiente.sala_nombre}</Texto>
                <Texto style={estilos.siguienteSub}>{datos.ninos.length} niños programados</Texto>
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 4 }}>
                  {datos.ninos.slice(0, 4).map((n) => (
                    <View key={n.id} style={estilos.mini}><Texto style={estilos.miniTexto}>{iniciales(n.nombre)}</Texto></View>
                  ))}
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colores.marino} />
            </TouchableOpacity>
          ) : (
            <Texto style={estilos.vacio}>{datos.suspension ? 'Hoy la atención está suspendida.' : bloques.length ? 'Cerraste todos los bloques de hoy. ¡Buen trabajo!' : dia ? 'No tienes bloques hoy.' : 'Hoy es fin de semana.'}</Texto>
          )}

          <Texto style={[estilos.seccion, { marginTop: 18, marginBottom: 10 }]}>Agenda de hoy</Texto>
          <View style={estilos.lista}>
            {bloques.map((b, i) => {
              const est = estadoBloque(b, true, ahora);
              return (
                <TouchableOpacity key={b.id} style={[estilos.fila, i > 0 && estilos.separador]} activeOpacity={0.8}
                  onPress={() => navigation.navigate('AsistenciaBloque', { bloqueId: b.id })}>
                  <Texto style={estilos.hora}>{b.hora_inicio}</Texto>
                  <View style={[estilos.barra, { backgroundColor: COLORES_BARRA[i % 3] }]} />
                  <View style={{ flex: 1 }}>
                    <Texto style={estilos.actividad}>{b.actividad}</Texto>
                    <Texto style={estilos.detalle}>{b.sala_nombre} · {est.texto}</Texto>
                  </View>
                  <Feather name="chevron-right" size={18} color={colores.textoSuave} />
                </TouchableOpacity>
              );
            })}
            {bloques.length === 0 ? <Texto style={[estilos.vacio, { padding: 14 }]}>Sin bloques programados.</Texto> : null}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  saludoFila: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  fecha: { fontSize: 11, fontWeight: '700', color: colores.turquesa },
  saludo: { fontSize: 24, fontWeight: '800', color: colores.marino, marginTop: 2 },
  sub: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  iniciales: { width: 46, height: 46, borderRadius: 14, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center' },
  jornada: { borderRadius: 20, padding: 18, marginBottom: 18 },
  etiqueta: { fontSize: 10, fontWeight: '700', color: colores.menta, letterSpacing: 1 },
  cifras: { flexDirection: 'row', marginVertical: 14 },
  cifra: { flex: 1, paddingLeft: 12 },
  cifraLinea: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.18)' },
  valor: { fontSize: 28, fontWeight: '800', color: '#fff' },
  legenda: { fontSize: 11, color: '#CFEAEC' },
  verAgenda: { backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  verAgendaTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  seccionFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino },
  siguiente: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12 },
  horaCaja: { width: 64, height: 64, borderRadius: 16, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  horaGrande: { fontSize: 15, fontWeight: '800', color: colores.azul },
  horaMin: { fontSize: 10, color: colores.textoSuave },
  siguienteSala: { fontSize: 15, fontWeight: '700', color: colores.marino },
  siguienteSub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  mini: { width: 24, height: 24, borderRadius: 12, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center' },
  miniTexto: { fontSize: 8, fontWeight: '700', color: colores.azul },
  vacio: { color: colores.textoSuave, fontStyle: 'italic', fontSize: 13 },
  lista: { ...tarjeta, paddingHorizontal: 14 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  separador: { borderTopWidth: 1, borderTopColor: colores.borde },
  hora: { width: 44, fontSize: 12, fontWeight: '700', color: colores.marino },
  barra: { width: 3, height: 34, borderRadius: 2, marginRight: 10 },
  actividad: { fontSize: 14, fontWeight: '700', color: colores.marino },
  detalle: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
});

import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Insignia from '../components/Insignia';
import Estado from '../components/Estado';
import { colores, tarjeta } from '../tema';
import { useConsulta } from '../hooks';
import AvisoSuspension from '../components/AvisoSuspension';
import { obtenerSesionesDelDia, obtenerSuspensionDeFecha } from '../datos';
import { diaLaboralDeHoy, hoyISO, horaActual, fechaLarga, NOMBRES_DIA } from '../utiles';

// Detalle de cada sesión de hoy: hora, sala, profesional y asistencia de cada niño.
// «Dada» = la hora de fin del bloque ya pasó.
function estadoDelBloque(b, ahora) {
  if (b.hora_fin <= ahora) return { texto: 'Dada', tipo: 'verde' };
  if (b.hora_inicio <= ahora) return { texto: 'En curso', tipo: 'azul' };
  return { texto: 'Pendiente', tipo: 'gris' };
}

export default function SesionesHoyScreen({ navigation }) {
  const dia = diaLaboralDeHoy();
  const { datos, cargando, error, recargar } = useConsulta(async (db) => ({ sesiones: await obtenerSesionesDelDia(db, dia, hoyISO()), suspension: await obtenerSuspensionDeFecha(db, hoyISO()) }), [dia]);
  const ahora = horaActual();

  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  const { sesiones: lista, suspension } = datos;
  const dadas = lista.filter((b) => b.hora_fin <= ahora).length;
  const enCurso = lista.filter((b) => b.hora_inicio <= ahora && b.hora_fin > ahora).length;

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Texto style={estilos.fecha}>{fechaLarga()} · {ahora}</Texto>
      <AvisoSuspension suspension={suspension} />
      {!dia || lista.length === 0 ? (
        <Texto style={estilos.vacio}>{suspension ? 'Hoy no hay sesiones: la atención está suspendida.' : dia ? `No hay bloques programados el ${NOMBRES_DIA[dia].toLowerCase()}.` : 'Hoy es fin de semana: el centro no tiene sesiones.'}</Texto>
      ) : (
        <>
          <View style={estilos.resumen}>
            {[[dadas, 'Dadas', colores.exito], [enCurso, 'En curso', colores.azul], [lista.length - dadas - enCurso, 'Pendientes', colores.textoSuave]].map(([v, e, c]) => (
              <View key={e} style={{ flex: 1, alignItems: 'center' }}>
                <Texto style={[estilos.resumenValor, { color: c }]}>{v}</Texto>
                <Texto style={estilos.resumenEtiqueta}>{e}</Texto>
              </View>
            ))}
          </View>

          {lista.map((b) => {
            const est = estadoDelBloque(b, ahora);
            const dada = b.hora_fin <= ahora;
            return (
              <View key={b.id} style={estilos.bloque}>
                <TouchableOpacity style={estilos.cabecera} activeOpacity={0.8} onPress={() => navigation.navigate('DetalleBloque', { bloqueId: b.id })}>
                  <View style={estilos.hora}>
                    <Texto style={estilos.horaTexto}>{b.hora_inicio}</Texto>
                    <Texto style={estilos.horaFin}>{b.hora_fin}</Texto>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Texto style={estilos.actividad}>{b.actividad}</Texto>
                    <Texto style={estilos.sub} numberOfLines={1}>{b.sala_nombre} · {b.profesional_nombre}</Texto>
                  </View>
                  <Insignia texto={est.texto} tipo={est.tipo} />
                  <Feather name="chevron-right" size={17} color={colores.textoSuave} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                {b.ninos.map((n) => (
                  <View key={n.id} style={estilos.nino}>
                    <View style={{ flex: 1 }}>
                      <Texto style={estilos.ninoNombre}>{n.nombre}</Texto>
                      {n.actividades ? <Texto style={estilos.sub}>{n.actividades}</Texto> : null}
                    </View>
                    {n.estado ? <Insignia texto={n.estado} tipo={n.estado === 'Presente' ? 'verde' : 'rojo'} />
                      : dada ? <Insignia texto="Sin registrar" tipo="naranja" /> : <Insignia texto="Pendiente" tipo="gris" punto={false} />}
                  </View>
                ))}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fecha: { fontSize: 12, fontWeight: '700', color: colores.turquesa, marginBottom: 12 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 40 },
  resumen: { ...tarjeta, flexDirection: 'row', paddingVertical: 14, marginBottom: 14 },
  resumenValor: { fontSize: 22, fontWeight: '800' },
  resumenEtiqueta: { fontSize: 11, color: colores.textoSuave },
  bloque: { ...tarjeta, padding: 12, marginBottom: 12 },
  cabecera: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colores.borde, marginBottom: 6 },
  hora: { width: 46 },
  horaTexto: { fontSize: 13, fontWeight: '700', color: colores.marino },
  horaFin: { fontSize: 11, color: colores.textoSuave },
  actividad: { fontSize: 14, fontWeight: '700', color: colores.marino },
  sub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  nino: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  ninoNombre: { fontSize: 13, fontWeight: '600', color: colores.marino },
});

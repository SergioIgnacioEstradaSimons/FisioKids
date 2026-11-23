import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import { colores, tarjeta } from '../tema';
import Estado from '../components/Estado';
import Fab from '../components/Fab';
import { useConsulta } from '../hooks';
import AvisoSuspension from '../components/AvisoSuspension';
import { obtenerBloques, obtenerSuspensionDeFecha } from '../datos';
import { diaDeHoy, MESES, TURNOS, turnoDe, horaActual, mayuscula, aISO } from '../utiles';

const DIAS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];

// Lunes de la semana de una fecha
function lunesDe(f) {
  const l = new Date(f);
  l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
  l.setHours(0, 0, 0, 0);
  return l;
}

export default function HorariosScreen({ navigation }) {
  const [lunes, setLunes] = useState(lunesDe(new Date()));
  const [dia, setDia] = useState(diaDeHoy());
  const [turno, setTurno] = useState(turnoDe(horaActual())); // Mañana 8-12, Tarde 14-19

  const fechas = [0, 1, 2, 3, 4].map((i) => { const f = new Date(lunes); f.setDate(f.getDate() + i); return f; });
  const mover = (dias) => { const l = new Date(lunes); l.setDate(l.getDate() + dias); setLunes(l); };
  const { datos, cargando, error, recargar } = useConsulta(async (db) => ({
    bloques: await obtenerBloques(db, dia),
    suspension: await obtenerSuspensionDeFecha(db, aISO(fechas[dia - 1])),
  }), [dia, lunes.getTime()]);
  const bloquesDia = datos?.bloques ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={estilos.semanaFila}>
          <TouchableOpacity style={estilos.flecha} onPress={() => mover(-7)}><Feather name="chevron-left" size={18} color={colores.texto} /></TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Texto style={estilos.mes}>{mayuscula(MESES[fechas[0].getMonth()])} {fechas[0].getFullYear()}</Texto>
            <Texto style={estilos.semana}>Semana {fechas[0].getDate()}–{fechas[4].getDate()}</Texto>
          </View>
          <TouchableOpacity style={estilos.flecha} onPress={() => mover(7)}><Feather name="chevron-right" size={18} color={colores.texto} /></TouchableOpacity>
        </View>

        <View style={estilos.dias}>
          {fechas.map((f, i) => {
            const activo = dia === i + 1;
            return (
              <TouchableOpacity key={i} style={[estilos.dia, activo && estilos.diaActivo]} onPress={() => setDia(i + 1)} activeOpacity={0.8}>
                <Texto style={[estilos.diaNombre, activo && { color: '#CFE3FB' }]}>{DIAS[i]}</Texto>
                <Texto style={[estilos.diaNum, activo && { color: '#fff' }]}>{f.getDate()}</Texto>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={estilos.turnos}>
          {Object.keys(TURNOS).map((t) => (
            <TouchableOpacity key={t} style={[estilos.turno, turno === t && estilos.turnoActivo]} onPress={() => setTurno(t)} activeOpacity={0.8}>
              <Feather name={t === 'Mañana' ? 'sun' : 'moon'} size={14} color={turno === t ? colores.azul : colores.textoSuave} />
              <Texto style={[estilos.turnoTexto, turno === t && { color: colores.azul }]}>{t} · {t === 'Mañana' ? '8:00 a 12:00' : '14:00 a 19:00'}</Texto>
            </TouchableOpacity>
          ))}
        </View>

        <View style={estilos.leyenda}>
          {[['Disponible', colores.turquesa], ['Ocupado', colores.azul], ['Completo', colores.alerta]].map(([t, c]) => (
            <View key={t} style={estilos.leyendaItem}><View style={[estilos.punto, { backgroundColor: c }]} /><Texto style={estilos.leyendaTexto}>{t}</Texto></View>
          ))}
        </View>

        <Estado cargando={cargando && !datos} error={error} recargar={recargar} />
        <AvisoSuspension suspension={datos?.suspension} />
        {datos ? TURNOS[turno].map((h) => {
          const bloques = bloquesDia.filter((b) => b.hora_inicio === h);
          return (
            <View key={h} style={estilos.fila}>
              <Texto style={estilos.hora}>{h}</Texto>
              <View style={{ flex: 1 }}>
                {bloques.length === 0 ? (
                  <TouchableOpacity style={estilos.libre} activeOpacity={0.8} onPress={() => navigation.navigate('NuevaAsignacion', { dia, hora: h })}>
                    <Feather name="plus" size={14} color={colores.turquesa} />
                    <Texto style={estilos.libreTexto}>{h} disponible</Texto>
                  </TouchableOpacity>
                ) : bloques.map((b) => {
                  const n = b.cupo;
                  const max = Math.min(4, b.capacidad);
                  const lleno = n >= max;
                  return (
                    <TouchableOpacity key={b.id} activeOpacity={0.8}
                      style={[estilos.bloque, { backgroundColor: lleno ? colores.naranjaClaro : colores.azulClaro, borderLeftColor: lleno ? colores.alerta : colores.azul }]}
                      onPress={() => navigation.navigate('DetalleBloque', { bloqueId: b.id })}>
                      <Texto style={estilos.bloqueTitulo}>{b.actividad}</Texto>
                      <Texto style={estilos.bloqueSub}>{b.hora_inicio} · {b.sala_nombre}</Texto>
                      <Texto style={estilos.bloqueSub}>{n}/{max} niños · {b.profesional_nombre}</Texto>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }) : null}
      </ScrollView>

      <Fab texto="Crear asignación" onPress={() => navigation.navigate('NuevaAsignacion', { dia, hora: TURNOS[turno][0] })} />
    </View>
  );
}

const estilos = StyleSheet.create({
  semanaFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  flecha: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, alignItems: 'center', justifyContent: 'center' },
  mes: { fontSize: 15, fontWeight: '800', color: colores.marino },
  semana: { fontSize: 11, color: colores.textoSuave },
  dias: { flexDirection: 'row', ...tarjeta, padding: 6, marginBottom: 10 },
  dia: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  diaActivo: { backgroundColor: colores.azul },
  diaNombre: { fontSize: 9, fontWeight: '700', color: colores.textoSuave },
  diaNum: { fontSize: 18, fontWeight: '800', color: colores.marino, marginTop: 2 },
  turnos: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  turno: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde },
  turnoActivo: { backgroundColor: colores.azulClaro, borderColor: '#B9D4F7' },
  turnoTexto: { fontSize: 11, fontWeight: '700', color: colores.textoSuave },
  leyenda: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center' },
  punto: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  leyendaTexto: { fontSize: 11, color: colores.textoSuave },
  fila: { flexDirection: 'row', marginBottom: 12 },
  hora: { width: 46, fontSize: 11, color: colores.textoSuave, paddingTop: 4 },
  bloque: { borderRadius: 12, borderLeftWidth: 4, padding: 12, marginBottom: 6 },
  bloqueTitulo: { fontSize: 13, fontWeight: '700', color: colores.marino, marginBottom: 3 },
  bloqueSub: { fontSize: 11, color: colores.textoSuave },
  libre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colores.turquesa, backgroundColor: '#EAF8F8', borderRadius: 12, paddingVertical: 12 },
  libreTexto: { fontSize: 12, color: colores.turquesa, marginLeft: 6, fontWeight: '600' },
  fabCaja: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28, elevation: 5, shadowColor: colores.azul, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  fab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 28 },
  fabTexto: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 },
});

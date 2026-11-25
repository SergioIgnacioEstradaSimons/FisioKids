import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from './Texto';
import Estado from './Estado';
import { colores, tarjeta } from '../tema';
import { useConsulta } from '../hooks';
import { obtenerResumenMes } from '../datos';
import { MESES, mayuscula, aISO, hoyISO, diaSemanaDe } from '../utiles';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const PUNTOS = { ok: colores.exito, faltas: colores.error, programado: colores.azul, sinregistro: '#B0BCCB' };

// Calendario completo por mes. Cada día muestra su estado: asistencia registrada, con faltas, programado, sin registro
// o suspendido. Al tocar un día se abre el detalle de sus sesiones (también de meses anteriores).
export default function CalendarioMes({ navigation }) {
  const hoy = hoyISO();
  const [mes, setMes] = useState(() => { const h = new Date(); return new Date(h.getFullYear(), h.getMonth(), 1); });
  const anio = mes.getFullYear();
  const idx = mes.getMonth();
  const { datos, cargando, error, recargar } = useConsulta((db) => obtenerResumenMes(db, anio, idx), [anio, idx]);

  const primerDia = (mes.getDay() + 6) % 7; // lunes = 0
  const totalDias = new Date(anio, idx + 1, 0).getDate();
  const celdas = [...Array(primerDia).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const filas = Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7));

  const totales = datos ? Object.values(datos.porFecha).reduce((t, d) => ({ p: t.p + d.presentes, f: t.f + d.faltas }), { p: 0, f: 0 }) : { p: 0, f: 0 };
  const mover = (n) => setMes(new Date(anio, idx + n, 1));

  return (
    <View>
      <View style={estilos.cabecera}>
        <TouchableOpacity style={estilos.flecha} onPress={() => mover(-1)}><Feather name="chevron-left" size={18} color={colores.texto} /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Texto style={estilos.mes}>{mayuscula(MESES[idx])} {anio}</Texto>
          <TouchableOpacity onPress={() => { const h = new Date(); setMes(new Date(h.getFullYear(), h.getMonth(), 1)); }}><Texto style={estilos.hoy}>Ir a hoy</Texto></TouchableOpacity>
        </View>
        <TouchableOpacity style={estilos.flecha} onPress={() => mover(1)}><Feather name="chevron-right" size={18} color={colores.texto} /></TouchableOpacity>
      </View>

      <Estado cargando={cargando && !datos} error={error} recargar={recargar} />
      {datos ? (
        <>
          <View style={estilos.tarjeta}>
            <View style={estilos.semana}>{DIAS.map((d, i) => <Texto key={i} style={[estilos.diaNombre, i >= 5 && { color: '#B0BCCB' }]}>{d}</Texto>)}</View>
            {filas.map((fila, i) => (
              <View key={i} style={estilos.semana}>
                {fila.map((dia, j) => {
                  if (!dia) return <View key={j} style={estilos.celda} />;
                  const iso = aISO(new Date(anio, idx, dia));
                  const dow = diaSemanaDe(iso);
                  const reg = datos.porFecha[iso];
                  const susp = datos.suspendidas[iso];
                  const programado = !!dow && (datos.bloquesPorDia[dow] ?? 0) > 0;
                  const estado = susp ? 'susp' : reg ? (reg.faltas > 0 ? 'faltas' : 'ok') : programado ? (iso < hoy ? 'sinregistro' : 'programado') : null;
                  const tocable = !!estado;
                  return (
                    <TouchableOpacity key={j} style={estilos.celda} disabled={!tocable} activeOpacity={0.7}
                      onPress={() => navigation.navigate('SesionesHoy', { fecha: iso })}>
                      <View style={[estilos.circulo, estado === 'susp' && estilos.suspendido, iso === hoy && estilos.esHoy]}>
                        <Texto style={[estilos.diaTexto, !dow && { color: '#B0BCCB' }, iso === hoy && { color: colores.azul, fontWeight: '800' }, estado === 'susp' && { color: colores.alerta }]}>{dia}</Texto>
                        {estado && estado !== 'susp' ? <View style={[estilos.punto, { backgroundColor: PUNTOS[estado] }]} /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={estilos.leyenda}>
            {[['Asistencia completa', PUNTOS.ok], ['Con faltas', PUNTOS.faltas], ['Programado', PUNTOS.programado], ['Sin registro', PUNTOS.sinregistro], ['Suspendido', colores.alerta]].map(([t, c]) => (
              <View key={t} style={estilos.leyendaItem}><View style={[estilos.leyendaPunto, { backgroundColor: c }]} /><Texto style={estilos.leyendaTexto}>{t}</Texto></View>
            ))}
          </View>

          <View style={estilos.resumen}>
            {[[totales.p, 'Atendidas'], [totales.f, 'Faltas'], [Object.keys(datos.suspendidas).length, 'Días suspendidos']].map(([v, e]) => (
              <View key={e} style={{ flex: 1, alignItems: 'center' }}>
                <Texto style={estilos.resumenValor}>{v}</Texto>
                <Texto style={estilos.resumenEtiqueta}>{e}</Texto>
              </View>
            ))}
          </View>
          <Texto style={estilos.ayuda}>Toca un día para ver sus sesiones y la asistencia de cada niño.</Texto>
        </>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  flecha: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, alignItems: 'center', justifyContent: 'center' },
  mes: { fontSize: 16, fontWeight: '800', color: colores.marino },
  hoy: { fontSize: 11, fontWeight: '700', color: colores.azul, marginTop: 2 },
  tarjeta: { ...tarjeta, padding: 8 },
  semana: { flexDirection: 'row' },
  diaNombre: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colores.textoSuave, paddingVertical: 8 },
  celda: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  circulo: { width: '88%', aspectRatio: 1, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  suspendido: { backgroundColor: colores.naranjaClaro },
  esHoy: { borderWidth: 1.5, borderColor: colores.azul },
  diaTexto: { fontSize: 14, color: colores.texto, fontWeight: '500' },
  punto: { position: 'absolute', bottom: 4, width: 6, height: 6, borderRadius: 3 },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, marginBottom: 12 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leyendaPunto: { width: 8, height: 8, borderRadius: 4 },
  leyendaTexto: { fontSize: 11, color: colores.textoSuave },
  resumen: { ...tarjeta, flexDirection: 'row', paddingVertical: 14 },
  resumenValor: { fontSize: 20, fontWeight: '800', color: colores.marino },
  resumenEtiqueta: { fontSize: 10, color: colores.textoSuave, marginTop: 2 },
  ayuda: { textAlign: 'center', fontSize: 11, color: colores.textoSuave, marginTop: 12 },
});

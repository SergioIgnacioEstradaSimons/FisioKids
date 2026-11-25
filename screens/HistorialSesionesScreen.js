import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Insignia from '../components/Insignia';
import Estado from '../components/Estado';
import { iniciales } from '../components/TarjetaNino';
import { colores, tarjeta } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import { resumenHistorial } from '../datos';
import { MESES, mayuscula, isoADmy } from '../utiles';

function Dato({ valor, etiqueta }) {
  return (
    <View style={estilos.dato}>
      <Texto style={estilos.datoValor}>{valor}</Texto>
      <Texto style={estilos.datoEtiqueta}>{etiqueta}</Texto>
    </View>
  );
}

// Historial de sesiones del mes. El profesional ve solo las suyas; el administrador, todas las del centro.
// Todo se calcula con COUNT sobre la tabla asistencias.
export default function HistorialSesionesScreen() {
  const { usuario } = useSesion();
  const hoy = new Date();
  const [desplazamiento, setDesplazamiento] = useState(0); // meses hacia atrás
  const ref = new Date(hoy.getFullYear(), hoy.getMonth() - desplazamiento, 1);
  const profesionalId = usuario?.rol === 'profesional' ? usuario.id : null;
  const { datos: r, cargando, error, recargar } = useConsulta(
    (db) => resumenHistorial(db, ref.getFullYear(), ref.getMonth(), profesionalId), [desplazamiento, profesionalId]);

  const maxBarra = Math.max(...(r?.barras ?? [0]), 1);
  const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={estilos.mesFila}>
        <TouchableOpacity style={estilos.flecha} onPress={() => setDesplazamiento(desplazamiento + 1)}><Feather name="chevron-left" size={18} color={colores.texto} /></TouchableOpacity>
        <Texto style={estilos.mes}>{mayuscula(MESES[ref.getMonth()])} {ref.getFullYear()}</Texto>
        <TouchableOpacity style={[estilos.flecha, desplazamiento === 0 && { opacity: 0.4 }]} disabled={desplazamiento === 0} onPress={() => setDesplazamiento(desplazamiento - 1)}>
          <Feather name="chevron-right" size={18} color={colores.texto} />
        </TouchableOpacity>
      </View>

      <Estado cargando={cargando && !r} error={error} recargar={recargar} />
      {r ? (
        <>
          <View style={estilos.rejilla}>
            <Dato valor={r.generadas} etiqueta="Generadas" />
            <Dato valor={r.presentes} etiqueta="Atendidas" />
            <Dato valor={r.faltas} etiqueta="Faltas" />
            <Dato valor={r.suspendidas} etiqueta="Suspendidas" />
          </View>

          <View style={estilos.resumen}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Texto style={estilos.resumenEtiqueta}>RESUMEN MENSUAL</Texto>
                <Texto style={estilos.resumenValor}>{r.porcentaje}% completado</Texto>
              </View>
              <Feather name="bar-chart-2" size={20} color={colores.menta} />
            </View>
            <View style={estilos.barras}>
              {r.barras.map((n, i) => (
                <View key={i} style={estilos.barraCol}>
                  <View style={[estilos.barra, { height: 8 + (n / maxBarra) * 62 }, n === maxBarra && n > 0 && { backgroundColor: colores.menta }]} />
                  <Texto style={estilos.barraDia}>{dias[i]}</Texto>
                </View>
              ))}
            </View>
          </View>

          <Texto style={estilos.seccion}>Sesiones recientes</Texto>
          <View style={estilos.lista}>
            {r.recientes.length === 0 ? <Texto style={estilos.vacio}>Sin sesiones registradas en este mes.</Texto> : null}
            {r.recientes.map((s, i) => (
              <View key={i} style={[estilos.fila, i > 0 && estilos.separador]}>
                <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(s.nino_nombre)}</Texto></View>
                <View style={{ flex: 1 }}>
                  <Texto style={estilos.nombre}>{s.nino_nombre}</Texto>
                  <Texto style={estilos.detalle} numberOfLines={1}>{isoADmy(s.fecha)} · {s.profesional_nombre} · {s.sala_nombre}</Texto>
                </View>
                <Insignia texto={s.estado === 'Presente' ? 'Atendida' : 'Falta'} tipo={s.estado === 'Presente' ? 'verde' : 'rojo'} />
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  mesFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  flecha: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, alignItems: 'center', justifyContent: 'center' },
  mes: { fontSize: 16, fontWeight: '800', color: colores.marino },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  dato: { ...tarjeta, width: '48%', flexGrow: 1, padding: 14 },
  datoValor: { fontSize: 24, fontWeight: '800', color: colores.marino },
  datoEtiqueta: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  resumen: { backgroundColor: colores.marinoOscuro, borderRadius: 18, padding: 16, marginBottom: 18 },
  resumenEtiqueta: { fontSize: 10, fontWeight: '700', color: colores.menta, letterSpacing: 1 },
  resumenValor: { fontSize: 19, fontWeight: '800', color: '#fff', marginTop: 4 },
  barras: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14, height: 92 },
  barraCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barra: { width: 22, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.22)' },
  barraDia: { fontSize: 9, color: '#BFD3E3', marginTop: 6 },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  lista: { ...tarjeta, paddingHorizontal: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  separador: { borderTopWidth: 1, borderTopColor: colores.borde },
  avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  iniciales: { fontSize: 12, fontWeight: '700', color: colores.azul },
  nombre: { fontSize: 13, fontWeight: '700', color: colores.marino },
  detalle: { fontSize: 10, color: colores.textoSuave, marginTop: 2 },
  vacio: { textAlign: 'center', color: colores.textoSuave, paddingVertical: 20 },
});

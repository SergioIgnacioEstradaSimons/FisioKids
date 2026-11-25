import { useState } from 'react';
import { View, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Texto from './Texto';
import { colores, degradadoBoton } from '../tema';
import { MESES, aISO, mayuscula, fechaLarga } from '../utiles';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const aFecha = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };

// Campo de fecha con calendario visual. valor e iso en formato AAAA-MM-DD.
// minima: primera fecha elegible. marcadas: fechas que ya tienen algo (se muestran con un punto y no se pueden elegir).
export default function SelectorFecha({ etiqueta, obligatorio, valor, onChange, minima, marcadas = [], error, placeholder = 'Seleccionar fecha' }) {
  const [abierto, setAbierto] = useState(false);
  const inicial = valor ? aFecha(valor) : minima ? aFecha(minima) : new Date();
  const [mes, setMes] = useState(new Date(inicial.getFullYear(), inicial.getMonth(), 1));
  const hoy = aISO(new Date());

  const primerDia = (mes.getDay() + 6) % 7; // lunes = 0
  const totalDias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas = [...Array(primerDia).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const filas = Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7));
  const anterior = minima && aISO(new Date(mes.getFullYear(), mes.getMonth(), 0)) < minima; // no hay fechas elegibles antes

  const elegir = (dia) => {
    const iso = aISO(new Date(mes.getFullYear(), mes.getMonth(), dia));
    onChange(iso);
    setAbierto(false);
  };
  const abrir = () => {
    const base = valor ? aFecha(valor) : minima ? aFecha(minima) : new Date();
    setMes(new Date(base.getFullYear(), base.getMonth(), 1));
    setAbierto(true);
  };
  const fechaValor = valor ? aFecha(valor) : null;

  return (
    <View style={{ marginBottom: 14 }}>
      {etiqueta ? (
        <Texto style={estilos.etiqueta}>{etiqueta}{obligatorio ? <Texto style={{ color: colores.error }}> *</Texto> : null}</Texto>
      ) : null}
      <TouchableOpacity style={[estilos.caja, error ? { borderColor: colores.error } : null]} onPress={abrir} activeOpacity={0.8}>
        <Feather name="calendar" size={17} color={colores.azul} style={{ marginRight: 10 }} />
        <Texto style={[estilos.valor, !fechaValor && { color: '#9AA9BC' }]} numberOfLines={1}>
          {fechaValor ? `${fechaLarga(fechaValor)} de ${fechaValor.getFullYear()}` : placeholder}
        </Texto>
        <Feather name="chevron-down" size={18} color={colores.textoSuave} />
      </TouchableOpacity>
      {error ? <Texto style={estilos.error}>{error}</Texto> : null}

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <TouchableWithoutFeedback onPress={() => setAbierto(false)}>
          <View style={estilos.fondo}>
            <TouchableWithoutFeedback>
              <View style={estilos.hoja}>
                <View style={estilos.cabecera}>
                  <TouchableOpacity style={[estilos.flecha, anterior && { opacity: 0.3 }]} disabled={anterior} onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>
                    <Feather name="chevron-left" size={18} color={colores.texto} />
                  </TouchableOpacity>
                  <View style={{ alignItems: 'center' }}>
                    <Texto style={estilos.mes}>{mayuscula(MESES[mes.getMonth()])}</Texto>
                    <Texto style={estilos.anio}>{mes.getFullYear()}</Texto>
                  </View>
                  <TouchableOpacity style={estilos.flecha} onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>
                    <Feather name="chevron-right" size={18} color={colores.texto} />
                  </TouchableOpacity>
                </View>

                <View style={estilos.semana}>
                  {DIAS.map((d, i) => <Texto key={i} style={[estilos.diaNombre, i >= 5 && { color: '#B0BCCB' }]}>{d}</Texto>)}
                </View>

                {filas.map((fila, i) => (
                  <View key={i} style={estilos.semana}>
                    {fila.map((dia, j) => {
                      if (!dia) return <View key={j} style={estilos.celda} />;
                      const iso = aISO(new Date(mes.getFullYear(), mes.getMonth(), dia));
                      const pasado = !!minima && iso < minima;
                      const marcada = marcadas.includes(iso);
                      const bloqueada = pasado || marcada;
                      const elegida = iso === valor;
                      const esHoy = iso === hoy;
                      const contenido = (
                        <>
                          <Texto style={[estilos.diaTexto, bloqueada && { color: '#B0BCCB' }, elegida && { color: '#fff', fontWeight: '800' }, esHoy && !elegida && { color: colores.azul, fontWeight: '800' }]}>{dia}</Texto>
                          {marcada ? <View style={estilos.punto} /> : null}
                        </>
                      );
                      return (
                        <TouchableOpacity key={j} style={estilos.celda} disabled={bloqueada} activeOpacity={0.7} onPress={() => elegir(dia)}>
                          {elegida ? (
                            <LinearGradient colors={degradadoBoton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.circulo}>{contenido}</LinearGradient>
                          ) : (
                            <View style={[estilos.circulo, esHoy && estilos.hoy]}>{contenido}</View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}

                <View style={estilos.leyenda}>
                  <View style={estilos.leyendaItem}><View style={[estilos.punto, { position: 'relative', bottom: 0 }]} /><Texto style={estilos.leyendaTexto}>Ya suspendido</Texto></View>
                  <TouchableOpacity onPress={() => { if (!minima || hoy >= minima) { onChange(hoy); setAbierto(false); } }}>
                    <Texto style={estilos.hoyEnlace}>Ir a hoy</Texto>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: { fontSize: 13, fontWeight: '600', color: colores.texto, marginBottom: 7 },
  caja: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.tarjeta, borderWidth: 1, borderColor: colores.borde, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  valor: { flex: 1, fontSize: 14, color: colores.texto, fontWeight: '500' },
  error: { color: colores.error, fontSize: 12, marginTop: 5 },
  fondo: { flex: 1, backgroundColor: 'rgba(15,42,67,0.45)', justifyContent: 'flex-end' },
  hoja: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 30 },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  flecha: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F3F7FB', alignItems: 'center', justifyContent: 'center' },
  mes: { fontSize: 18, fontWeight: '800', color: colores.marino },
  anio: { fontSize: 12, color: colores.textoSuave },
  semana: { flexDirection: 'row', marginBottom: 4 },
  diaNombre: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colores.textoSuave, paddingVertical: 6 },
  celda: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  circulo: { width: '86%', aspectRatio: 1, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  hoy: { borderWidth: 1.5, borderColor: colores.azul },
  diaTexto: { fontSize: 14, color: colores.texto, fontWeight: '500' },
  punto: { position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: colores.alerta },
  leyenda: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colores.borde },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaTexto: { fontSize: 11, color: colores.textoSuave },
  hoyEnlace: { fontSize: 13, fontWeight: '700', color: colores.azul },
});

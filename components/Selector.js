import { useState } from 'react';
import { View, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from './Texto';
import { colores } from '../tema';

// Ventana inferior para elegir una opción. opciones: [{ valor, etiqueta }]
export function SelectorModal({ visible, titulo, opciones, valor, onElegir, onCerrar }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <TouchableWithoutFeedback onPress={onCerrar}>
        <View style={estilos.fondo}>
          <TouchableWithoutFeedback>
            <View style={estilos.hoja}>
              <View style={estilos.cabecera}>
                <Texto style={estilos.titulo}>{titulo}</Texto>
                <TouchableOpacity onPress={onCerrar}><Feather name="x" size={22} color={colores.textoSuave} /></TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 360 }}>
                {opciones.length === 0 ? <Texto style={estilos.vacio}>No hay opciones disponibles.</Texto> : null}
                {opciones.map((o) => (
                  <TouchableOpacity key={String(o.valor)} style={[estilos.opcion, o.valor === valor && estilos.activa]}
                    onPress={() => { onElegir(o.valor); onCerrar(); }}>
                    <Texto style={[estilos.opcionTexto, o.valor === valor && { color: colores.azul, fontWeight: '700' }]}>{o.etiqueta}</Texto>
                    {o.valor === valor ? <Feather name="check" size={18} color={colores.azul} /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Campo que se ve como «Seleccionar >» y abre la ventana de opciones
export default function Selector({ etiqueta, obligatorio, valor, opciones, onChange, placeholder = 'Seleccionar', error, estiloContenedor }) {
  const [abierto, setAbierto] = useState(false);
  const actual = opciones.find((o) => o.valor === valor);
  return (
    <View style={[{ marginBottom: 14 }, estiloContenedor]}>
      {etiqueta ? (
        <Texto style={estilos.etiqueta}>
          {etiqueta}{obligatorio ? <Texto style={{ color: colores.error }}> *</Texto> : null}
        </Texto>
      ) : null}
      <TouchableOpacity style={[estilos.caja, error ? { borderColor: colores.error } : null]} onPress={() => setAbierto(true)} activeOpacity={0.8}>
        <Texto style={[estilos.valor, !actual && { color: '#9AA9BC' }]} numberOfLines={1}>{actual ? actual.etiqueta : placeholder}</Texto>
        <Feather name="chevron-right" size={18} color={colores.textoSuave} />
      </TouchableOpacity>
      {error ? <Texto style={estilos.error}>{error}</Texto> : null}
      <SelectorModal visible={abierto} titulo={etiqueta ?? 'Seleccionar'} opciones={opciones} valor={valor} onElegir={onChange} onCerrar={() => setAbierto(false)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: { fontSize: 13, fontWeight: '600', color: colores.texto, marginBottom: 7 },
  caja: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colores.tarjeta, borderWidth: 1, borderColor: colores.borde, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  valor: { flex: 1, fontSize: 14, color: colores.texto, fontWeight: '500' },
  error: { color: colores.error, fontSize: 12, marginTop: 5 },
  fondo: { flex: 1, backgroundColor: 'rgba(15,42,67,0.45)', justifyContent: 'flex-end' },
  hoja: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 30 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  titulo: { fontSize: 17, fontWeight: '800', color: colores.texto },
  opcion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  activa: { backgroundColor: colores.azulClaro },
  opcionTexto: { fontSize: 15, color: colores.texto },
  vacio: { color: colores.textoSuave, textAlign: 'center', padding: 20 },
});

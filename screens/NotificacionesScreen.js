import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import { colores, tarjeta } from '../tema';
import { notificacionesEjemplo } from '../semilla';

const TINTES = {
  azul: [colores.azulClaro, colores.azul], verde: [colores.verdeClaro, colores.exito],
  naranja: [colores.naranjaClaro, colores.alerta], morado: [colores.moradoClaro, colores.morado],
};

// Solo pantalla de ejemplo: las notificaciones push quedan fuera del alcance del proyecto final.
export default function NotificacionesScreen() {
  const [lista, setLista] = useState(notificacionesEjemplo);
  const [pestana, setPestana] = useState('todas');
  const visibles = lista.filter((n) => pestana === 'todas' || !n.leida);

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16 }}>
      <View style={estilos.cabecera}>
        <View style={estilos.pestanas}>
          {[['todas', 'Todas'], ['noleidas', 'No leídas']].map(([k, t]) => (
            <TouchableOpacity key={k} style={[estilos.pestana, pestana === k && estilos.pestanaActiva]} onPress={() => setPestana(k)}>
              <Texto style={[estilos.pestanaTexto, pestana === k && { color: colores.marino }]}>{t}</Texto>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => setLista(lista.map((n) => ({ ...n, leida: true })))}><Texto style={estilos.marcar}>Marcar leídas</Texto></TouchableOpacity>
      </View>

      {['Hoy', 'Ayer'].map((g) => {
        const items = visibles.filter((n) => n.grupo === g);
        if (items.length === 0) return null;
        return (
          <View key={g}>
            <Texto style={estilos.grupo}>{g.toUpperCase()}</Texto>
            <View style={estilos.bloque}>
              {items.map((n, i) => {
                const [fondo, color] = TINTES[n.tinte];
                return (
                  <TouchableOpacity key={n.id} activeOpacity={0.8} style={[estilos.item, i > 0 && estilos.separador]}
                    onPress={() => setLista(lista.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))}>
                    <View style={[estilos.icono, { backgroundColor: fondo }]}><Feather name={n.icono} size={17} color={color} /></View>
                    <View style={{ flex: 1 }}>
                      <Texto style={estilos.titulo}>{n.titulo}</Texto>
                      <Texto style={estilos.texto}>{n.texto}</Texto>
                      <Texto style={estilos.hace}>{n.hace}</Texto>
                    </View>
                    {!n.leida ? <View style={estilos.punto} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
      {visibles.length === 0 ? <Texto style={estilos.vacio}>No tienes notificaciones sin leer.</Texto> : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pestanas: { flexDirection: 'row', backgroundColor: '#E6EDF5', borderRadius: 12, padding: 3 },
  pestana: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10 },
  pestanaActiva: { backgroundColor: '#fff' },
  pestanaTexto: { fontSize: 12, fontWeight: '700', color: colores.textoSuave },
  marcar: { fontSize: 12, fontWeight: '700', color: colores.azul },
  grupo: { fontSize: 10, fontWeight: '700', color: colores.textoSuave, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  bloque: { ...tarjeta, paddingHorizontal: 12, marginBottom: 14 },
  item: { flexDirection: 'row', paddingVertical: 12 },
  separador: { borderTopWidth: 1, borderTopColor: colores.borde },
  icono: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  titulo: { fontSize: 13, fontWeight: '700', color: colores.marino },
  texto: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  hace: { fontSize: 10, color: '#9AA9BC', marginTop: 4 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.azul, marginTop: 4 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 30 },
});

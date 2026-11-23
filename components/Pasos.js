import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from './Texto';
import { colores } from '../tema';

// Indicador de pasos 1-2-3 de la programación mensual
export default function Pasos({ actual, nombres = ['Periodo', 'Configurar', 'Revisar'] }) {
  return (
    <View style={estilos.fila}>
      <View style={estilos.linea} />
      {nombres.map((n, i) => {
        const num = i + 1;
        const hecho = num < actual;
        const activo = num === actual;
        return (
          <View key={n} style={estilos.paso}>
            <View style={[estilos.circulo, hecho && { backgroundColor: colores.turquesa }, activo && { backgroundColor: colores.azul }]}>
              {hecho ? <Feather name="check" size={14} color="#fff" /> : <Texto style={[estilos.num, (activo) && { color: '#fff' }]}>{num}</Texto>}
            </View>
            <Texto style={[estilos.nombre, activo && { color: colores.texto, fontWeight: '700' }]}>{n}</Texto>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 18 },
  linea: { position: 'absolute', top: 14, left: 46, right: 46, height: 2, backgroundColor: colores.borde },
  paso: { alignItems: 'center', width: 70 },
  circulo: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#DCE5EF', alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 13, fontWeight: '700', color: colores.textoSuave },
  nombre: { fontSize: 11, color: colores.textoSuave, marginTop: 5 },
});

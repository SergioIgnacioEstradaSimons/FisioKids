import { View, StyleSheet } from 'react-native';
import Texto from './Texto';
import { colores } from '../tema';

// Etiqueta de estado: Activo / Inactivo / Presente / Falta, etc.
const TIPOS = {
  verde: { fondo: colores.verdeClaro, texto: colores.exito },
  gris: { fondo: '#EDF1F6', texto: colores.textoSuave },
  rojo: { fondo: colores.rojoClaro, texto: colores.error },
  naranja: { fondo: colores.naranjaClaro, texto: colores.alerta },
  azul: { fondo: colores.azulClaro, texto: colores.azul },
};

export default function Insignia({ texto, tipo = 'verde', punto = true }) {
  const t = TIPOS[tipo];
  return (
    <View style={[estilos.caja, { backgroundColor: t.fondo }]}>
      {punto ? <View style={[estilos.punto, { backgroundColor: t.texto }]} /> : null}
      <Texto style={{ fontSize: 11, fontWeight: '600', color: t.texto }}>{texto}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  punto: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
});

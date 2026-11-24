import { View, Image, StyleSheet } from 'react-native';
import Texto from './Texto';
import { colores } from '../tema';

export const inicialesDe = (nombre = '') => nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

// Avatar: muestra la foto de perfil si existe y, si no, las iniciales
export default function Avatar({ foto, nombre, tam = 44, radio, fondo = colores.azulClaro, color = colores.azul }) {
  const r = radio ?? Math.round(tam * 0.3);
  if (foto) return <Image source={{ uri: foto }} style={{ width: tam, height: tam, borderRadius: r, backgroundColor: fondo }} />;
  return (
    <View style={[estilos.caja, { width: tam, height: tam, borderRadius: r, backgroundColor: fondo }]}>
      <Texto style={{ color, fontWeight: '800', fontSize: Math.round(tam * 0.34) }}>{inicialesDe(nombre)}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({ caja: { alignItems: 'center', justifyContent: 'center' } });

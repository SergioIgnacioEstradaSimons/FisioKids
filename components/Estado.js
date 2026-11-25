import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Texto from './Texto';
import Boton from './Boton';
import { colores } from '../tema';

// Muestra «cargando» o el error de una consulta (con botón Reintentar). Si no hay ninguno devuelve null.
export default function Estado({ cargando, error, recargar }) {
  if (cargando) return <View style={estilos.caja}><ActivityIndicator color={colores.azul} size="large" /></View>;
  if (error) {
    return (
      <View style={estilos.caja}>
        <Texto style={estilos.error}>No se pudieron leer los datos.{'\n'}{error}</Texto>
        <Boton texto="Reintentar" onPress={recargar} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }
  return null;
}

const estilos = StyleSheet.create({
  caja: { padding: 30, alignItems: 'center' },
  error: { color: colores.error, textAlign: 'center', marginBottom: 14, fontSize: 13 },
});

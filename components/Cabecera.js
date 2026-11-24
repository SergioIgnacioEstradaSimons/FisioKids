import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Texto from './Texto';
import { colores, sombra } from '../tema';
import { useSesion } from '../sesion';
import { useAvisosSinLeer } from '../hooks';

// Encabezado del diseño: botón (menú o atrás) – título centrado – campana
export default function Cabecera({ titulo, navigation, menu }) {
  const insets = useSafeAreaInsets();
  const { usuario } = useSesion();
  const esAdmin = usuario?.rol === 'admin';
  const sinLeer = useAvisosSinLeer(usuario);
  const puedeVolver = navigation.canGoBack();

  return (
    <View style={[estilos.barra, { paddingTop: insets.top + 8 }]}>
      <View style={estilos.lado}>
        {menu ? (
          <TouchableOpacity style={estilos.boton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Feather name="menu" size={20} color={colores.texto} />
          </TouchableOpacity>
        ) : puedeVolver ? (
          <TouchableOpacity style={estilos.boton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={colores.texto} />
          </TouchableOpacity>
        ) : null}
      </View>
      <Texto style={estilos.titulo} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{titulo}</Texto>
      <View style={[estilos.lado, { alignItems: 'flex-end' }]}>
        {usuario ? (
          <TouchableOpacity style={estilos.boton} onPress={() => navigation.navigate('Principal', esAdmin ? { screen: 'Notificaciones' } : { screen: 'Tabs', params: { screen: 'Notificaciones' } })}>
            <Feather name="bell" size={19} color={colores.texto} />
            {sinLeer > 0 ? <View style={estilos.punto} /> : null}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// Fábrica para usarla como opción `header` de los navegadores
export const crearCabecera = (menu) => ({ navigation, options, route }) => (
  <Cabecera titulo={options.title ?? route.name} navigation={navigation} menu={menu} />
);

const estilos = StyleSheet.create({
  barra: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: colores.fondo },
  lado: { width: 48 },
  boton: { width: 40, height: 40, borderRadius: 13, backgroundColor: colores.tarjeta, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colores.borde, ...sombra },
  titulo: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colores.texto },
  punto: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colores.error, borderWidth: 1.5, borderColor: '#fff' },
});

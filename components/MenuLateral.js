import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Texto from './Texto';
import { colores, degradadoTarjeta } from '../tema';
import { useSesion, irALogin } from '../sesion';
import Avatar from './Avatar';
import { useAvisosSinLeer } from '../hooks';

// tab: true  -> es una pestaña dentro de «Tabs»; false -> es una pantalla del menú
const MODULOS_ADMIN = [
  { nombre: 'Inicio', icono: 'home', tab: true },
  { nombre: 'Niños', icono: 'user-plus', tab: true },
  { nombre: 'Profesionales', icono: 'users' },
  { nombre: 'Salas', icono: 'layout' },
  { nombre: 'Tipos', etiqueta: 'Tipos de discapacidad', icono: 'heart' },
  { nombre: 'Horarios', icono: 'calendar', tab: true },
  { nombre: 'Mes', etiqueta: 'Gestión mensual', icono: 'layers', tab: true },
  { nombre: 'Suspensiones', icono: 'alert-triangle' },
  { nombre: 'Historial', icono: 'clock' },
  { nombre: 'Notificaciones', icono: 'bell', insignia: true },
  { nombre: 'Mi perfil', icono: 'user', tab: true },
];
const MODULOS_PROFESIONAL = [
  { nombre: 'Inicio', icono: 'home', tab: true },
  { nombre: 'Agenda', etiqueta: 'Agenda diaria', icono: 'calendar', tab: true },
  { nombre: 'Asistencia', icono: 'check', tab: true },
  { nombre: 'Atenciones', icono: 'activity' },
  { nombre: 'Historial', icono: 'clock' },
  { nombre: 'Notificaciones', icono: 'bell', insignia: true, tab: true },
  { nombre: 'Mi perfil', icono: 'user', tab: true },
];

export default function MenuLateral({ navigation, state }) {
  const insets = useSafeAreaInsets();
  const { usuario, setUsuario } = useSesion();
  const ruta = state.routes[state.index];
  const activa = ruta.name === 'Tabs' ? ruta.state?.routes?.[ruta.state.index]?.name ?? 'Inicio' : ruta.name;
  const sinLeer = useAvisosSinLeer(usuario);
  const esAdmin = usuario?.rol === 'admin';
  const MODULOS = esAdmin ? MODULOS_ADMIN : MODULOS_PROFESIONAL;

  const ir = (m) => {
    if (m.tab) navigation.navigate('Tabs', { screen: m.nombre });
    else navigation.navigate(m.nombre);
    navigation.closeDrawer();
  };
  const cerrarSesion = () => {
    setUsuario(null);
    irALogin();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top + 12 }}>
      <View style={estilos.cabecera}>
        <View style={estilos.logo}><Feather name="activity" size={18} color={colores.menta} /></View>
        <Texto style={estilos.marca}>Fisio<Texto style={{ color: colores.turquesa }}>Kids</Texto></Texto>
        <TouchableOpacity style={estilos.cerrar} onPress={() => navigation.closeDrawer()}><Feather name="x" size={18} color={colores.textoSuave} /></TouchableOpacity>
      </View>

      <LinearGradient colors={degradadoTarjeta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.usuario}>
        <View style={{ marginRight: 12 }}><Avatar foto={usuario?.foto} nombre={usuario?.nombre} tam={40} fondo="rgba(255,255,255,0.18)" color="#fff" /></View>
        <View>
          <Texto style={estilos.nombre}>{usuario?.nombre}</Texto>
          <Texto style={estilos.rol}>{esAdmin ? 'Administradora' : usuario?.especialidad}</Texto>
        </View>
      </LinearGradient>

      <Texto style={estilos.etiqueta}>MÓDULOS</Texto>
      <ScrollView>
        {MODULOS.map((m) => {
          const on = activa === m.nombre;
          return (
            <TouchableOpacity key={m.nombre} style={[estilos.item, on && estilos.itemActivo]} onPress={() => ir(m)} activeOpacity={0.8}>
              <Feather name={m.icono} size={18} color={on ? colores.azul : colores.textoSuave} />
              <Texto style={[estilos.itemTexto, on && { color: colores.azul, fontWeight: '700' }]}>{m.etiqueta ?? m.nombre}</Texto>
              {m.insignia && sinLeer > 0 ? <View style={estilos.insignia}><Texto style={estilos.insigniaTexto}>{sinLeer}</Texto></View> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {__DEV__ ? (
        <TouchableOpacity style={estilos.item} onPress={() => { navigation.navigate('Exportar'); navigation.closeDrawer(); }} activeOpacity={0.8}>
          <Feather name="download" size={18} color={colores.textoSuave} />
          <Texto style={estilos.itemTexto}>Exportar datos</Texto>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={[estilos.salir, { paddingBottom: insets.bottom + 14 }]} onPress={cerrarSesion}>
        <Feather name="log-out" size={17} color={colores.error} />
        <Texto style={{ color: colores.error, fontWeight: '700', marginLeft: 10, fontSize: 13 }}>Cerrar sesión</Texto>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  logo: { width: 38, height: 38, borderRadius: 12, backgroundColor: colores.marinoOscuro, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  marca: { flex: 1, fontSize: 18, fontWeight: '800', color: colores.marino },
  cerrar: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  usuario: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, borderRadius: 16, padding: 14, marginBottom: 18 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iniciales: { color: '#fff', fontWeight: '700' },
  nombre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rol: { color: '#CFEAEC', fontSize: 11 },
  etiqueta: { fontSize: 10, fontWeight: '700', color: colores.textoSuave, letterSpacing: 1, marginLeft: 20, marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 },
  itemActivo: { backgroundColor: colores.azulClaro },
  itemTexto: { flex: 1, marginLeft: 14, fontSize: 13, color: colores.texto, fontWeight: '500' },
  insignia: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colores.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  insigniaTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  salir: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 14, borderTopWidth: 1, borderTopColor: colores.borde },
});

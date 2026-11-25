import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './supabase';
import { Feather } from '@expo/vector-icons';
import {
  useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { colores } from './tema';
import { SesionContext, useSesion, navRef } from './sesion';
import { crearCabecera } from './components/Cabecera';
import MenuLateral from './components/MenuLateral';
import Texto from './components/Texto';

import LoginScreen from './screens/LoginScreen';
import InicioAdminScreen from './screens/InicioAdminScreen';
import InicioScreen from './screens/InicioScreen';
import NinosScreen from './screens/NinosScreen';
import HorariosScreen from './screens/HorariosScreen';
import MesScreen from './screens/MesScreen';
import PerfilScreen from './screens/PerfilScreen';
import ProfesionalesScreen from './screens/ProfesionalesScreen';
import SalasScreen from './screens/SalasScreen';
import FeriadosScreen from './screens/FeriadosScreen';
import HistorialSesionesScreen from './screens/HistorialSesionesScreen';
import AtencionesScreen from './screens/AtencionesScreen';
import HistorialAtencionScreen from './screens/HistorialAtencionScreen';
import RegistrarAtencionScreen from './screens/RegistrarAtencionScreen';
import CerrarBloqueScreen from './screens/CerrarBloqueScreen';
import CambiarContrasenaScreen from './screens/CambiarContrasenaScreen';
import NotificacionesScreen from './screens/NotificacionesScreen';
import AgendaScreen from './screens/AgendaScreen';
import AsistenciaScreen from './screens/AsistenciaScreen';
import DetalleNinoScreen from './screens/DetalleNinoScreen';
import FormularioNinoScreen from './screens/FormularioNinoScreen';
import DetalleBloqueScreen from './screens/DetalleBloqueScreen';
import FormularioBloqueScreen from './screens/FormularioBloqueScreen';
import AsistenciaBloqueScreen from './screens/AsistenciaBloqueScreen';
import NuevaAsignacionScreen from './screens/NuevaAsignacionScreen';
import ConfigurarMesScreen from './screens/ConfigurarMesScreen';
import RevisionMesScreen from './screens/RevisionMesScreen';
import ResumenPeriodoScreen from './screens/ResumenPeriodoScreen';
import SesionesHoyScreen from './screens/SesionesHoyScreen';
import TiposDiscapacidadScreen from './screens/TiposDiscapacidadScreen';
import FormularioSuspensionScreen from './screens/FormularioSuspensionScreen';
import EditarPerfilScreen from './screens/EditarPerfilScreen';
import FormularioProfesionalScreen from './screens/FormularioProfesionalScreen';
import FormularioSalaScreen from './screens/FormularioSalaScreen';
import ExportarScreen from './screens/ExportarScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const icono = (nombre) => ({ color }) => <Feather name={nombre} size={21} color={color} />;

const opcionesTabs = {
  tabBarActiveTintColor: colores.azul,
  tabBarInactiveTintColor: colores.textoSuave,
  tabBarStyle: { backgroundColor: '#fff', borderTopColor: colores.borde, height: 64, paddingTop: 6, paddingBottom: 8 },
  tabBarLabel: ({ color, children }) => <Texto style={{ color, fontSize: 10, fontWeight: '600' }}>{children}</Texto>,
};

// Pestañas del Administrador: Inicio, Niños, Horarios, Mes, Mi perfil (con menú lateral)
function TabsAdmin() {
  return (
    <Tab.Navigator screenOptions={{ ...opcionesTabs, header: crearCabecera(true) }}>
      <Tab.Screen name="Inicio" component={InicioAdminScreen} options={{ title: 'Resumen', tabBarIcon: icono('home') }} />
      <Tab.Screen name="Niños" component={NinosScreen} options={{ title: 'Niños', tabBarIcon: icono('user-plus') }} />
      <Tab.Screen name="Horarios" component={HorariosScreen} options={{ title: 'Calendario', tabBarIcon: icono('calendar') }} />
      <Tab.Screen name="Mes" component={MesScreen} options={{ title: 'Mes', tabBarIcon: icono('layers') }} />
      <Tab.Screen name="Mi perfil" component={PerfilScreen} options={{ title: 'Mi perfil', tabBarIcon: icono('user') }} />
    </Tab.Navigator>
  );
}

// Menú lateral del Administrador: contiene las pestañas y los módulos extra
function DrawerAdmin() {
  const conCabecera = (titulo) => ({ headerShown: true, header: crearCabecera(true), title: titulo });
  return (
    <Drawer.Navigator drawerContent={(props) => <MenuLateral {...props} />}
      screenOptions={{ headerShown: false, drawerType: 'front', drawerStyle: { width: 300 } }}>
      <Drawer.Screen name="Tabs" component={TabsAdmin} />
      <Drawer.Screen name="Profesionales" component={ProfesionalesScreen} options={conCabecera('Profesionales')} />
      <Drawer.Screen name="Salas" component={SalasScreen} options={conCabecera('Salas')} />
      <Drawer.Screen name="Tipos" component={TiposDiscapacidadScreen} options={conCabecera('Tipos de discapacidad')} />
      <Drawer.Screen name="Suspensiones" component={FeriadosScreen} options={conCabecera('Suspensiones')} />
      <Drawer.Screen name="Historial" component={HistorialSesionesScreen} options={conCabecera('Historial de sesiones')} />
      <Drawer.Screen name="Notificaciones" component={NotificacionesScreen} options={conCabecera('Notificaciones')} />
    </Drawer.Navigator>
  );
}

// Pestañas del Profesional: Inicio, Agenda diaria, Asistencia, Notificaciones, Mi perfil (con menú lateral)
function TabsProfesional() {
  return (
    <Tab.Navigator screenOptions={{ ...opcionesTabs, header: crearCabecera(true) }}>
      <Tab.Screen name="Inicio" component={InicioScreen} options={{ title: 'Resumen', tabBarIcon: icono('home') }} />
      <Tab.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda diaria', tabBarLabel: ({ color }) => <Texto style={{ color, fontSize: 10, fontWeight: '600' }}>Agenda</Texto>, tabBarIcon: icono('calendar') }} />
      <Tab.Screen name="Asistencia" component={AsistenciaScreen} options={{ title: 'Registrar asistencia', tabBarLabel: ({ color }) => <Texto style={{ color, fontSize: 10, fontWeight: '600' }}>Asistencia</Texto>, tabBarIcon: icono('check') }} />
      <Tab.Screen name="Notificaciones" component={NotificacionesScreen} options={{ title: 'Notificaciones', tabBarLabel: ({ color }) => <Texto style={{ color, fontSize: 10, fontWeight: '600' }}>Avisos</Texto>, tabBarIcon: icono('bell') }} />
      <Tab.Screen name="Mi perfil" component={PerfilScreen} options={{ title: 'Mi perfil', tabBarIcon: icono('user') }} />
    </Tab.Navigator>
  );
}

// Menú lateral del Profesional
function DrawerProfesional() {
  const conCabecera = (titulo) => ({ headerShown: true, header: crearCabecera(true), title: titulo });
  return (
    <Drawer.Navigator drawerContent={(props) => <MenuLateral {...props} />}
      screenOptions={{ headerShown: false, drawerType: 'front', drawerStyle: { width: 300 } }}>
      <Drawer.Screen name="Tabs" component={TabsProfesional} />
      <Drawer.Screen name="Atenciones" component={AtencionesScreen} options={conCabecera('Atenciones')} />
      <Drawer.Screen name="Historial" component={HistorialSesionesScreen} options={conCabecera('Historial de sesiones')} />
    </Drawer.Navigator>
  );
}

function Principal() {
  const { usuario } = useSesion();
  return usuario?.rol === 'admin' ? <DrawerAdmin /> : <DrawerProfesional />;
}

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [cargada] = useFonts({
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    let activo = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (evento, sesion) => {
      if (evento === 'SIGNED_OUT') {
        if (activo) setUsuario(null);
        if (navRef.isReady()) navRef.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      if (!sesion?.user) return;
      const { data: perfil } = await supabase.from('v_usuarios').select('*').eq('auth_id', sesion.user.id).maybeSingle();
      if (activo && perfil) setUsuario(perfil);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: perfil } = await supabase.from('v_usuarios').select('*').eq('auth_id', data.session.user.id).maybeSingle();
        if (activo) setUsuario(perfil);
      }
      if (activo) setVerificando(false);
    });

    return () => { activo = false; subscription.unsubscribe(); };
  }, []);

  if (!cargada || verificando) return <View style={{ flex: 1, backgroundColor: colores.fondo }} />;

  return (
    <SesionContext.Provider value={{ usuario, setUsuario }}>
      <NavigationContainer ref={navRef}>
        <StatusBar style="dark" />
        <Stack.Navigator initialRouteName={usuario ? 'Principal' : 'Login'} screenOptions={{ header: crearCabecera(false), contentStyle: { backgroundColor: colores.fondo } }}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Principal" component={Principal} options={{ headerShown: false }} />
          <Stack.Screen name="DetalleNino" component={DetalleNinoScreen} options={({ route }) => ({ title: route.params?.nombre ?? 'Ficha del niño' })} />
          <Stack.Screen name="FormularioNino" component={FormularioNinoScreen} options={({ route }) => ({ title: route.params?.ninoId ? 'Editar niño' : 'Registrar niño' })} />
          <Stack.Screen name="FormularioProfesional" component={FormularioProfesionalScreen} options={({ route }) => ({ title: route.params?.profesionalId ? 'Editar profesional' : 'Registrar profesional' })} />
          <Stack.Screen name="FormularioSala" component={FormularioSalaScreen} options={({ route }) => ({ title: route.params?.salaId ? 'Editar sala' : 'Registrar sala' })} />
          <Stack.Screen name="DetalleBloque" component={DetalleBloqueScreen} options={{ title: 'Detalle de bloque' }} />
          <Stack.Screen name="FormularioBloque" component={FormularioBloqueScreen} options={{ title: 'Editar bloque' }} />
          <Stack.Screen name="AsistenciaBloque" component={AsistenciaBloqueScreen} options={{ title: 'Tomar asistencia' }} />
          <Stack.Screen name="NuevaAsignacion" component={NuevaAsignacionScreen} options={{ title: 'Nueva asignación' }} />
          <Stack.Screen name="ConfigurarMes" component={ConfigurarMesScreen} options={{ title: 'Configurar mes' }} />
          <Stack.Screen name="ResumenPeriodo" component={ResumenPeriodoScreen} options={({ route }) => ({ title: `Resumen de ${route.params?.mes ?? 'periodo'}` })} />
          <Stack.Screen name="SesionesHoy" component={SesionesHoyScreen} options={({ route }) => ({ title: route.params?.fecha ? `Sesiones del ${route.params.fecha.split('-').reverse().slice(0, 2).join('/')}` : 'Sesiones de hoy' })} />
          <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} options={{ title: 'Editar perfil' }} />
          <Stack.Screen name="FormularioSuspension" component={FormularioSuspensionScreen} options={{ title: 'Nueva suspensión' }} />
          <Stack.Screen name="RegistrarAtencion" component={RegistrarAtencionScreen} options={{ title: 'Registrar atención' }} />
          <Stack.Screen name="CerrarBloque" component={CerrarBloqueScreen} options={{ title: 'Cerrar bloque' }} />
          <Stack.Screen name="HistorialAtencion" component={HistorialAtencionScreen} options={{ title: 'Historial de atención' }} />
          <Stack.Screen name="CambiarContrasena" component={CambiarContrasenaScreen} options={{ title: 'Cambiar contraseña' }} />
          <Stack.Screen name="RevisionMes" component={RevisionMesScreen} options={{ title: 'Revisión mensual' }} />
          {__DEV__ ? <Stack.Screen name="Exportar" component={ExportarScreen} options={{ title: 'Exportar datos' }} /> : null}
        </Stack.Navigator>
      </NavigationContainer>
    </SesionContext.Provider>
  );
}

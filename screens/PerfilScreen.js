import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Boton from '../components/Boton';
import Insignia from '../components/Insignia';
import Avatar from '../components/Avatar';
import { colores, tarjeta } from '../tema';
import { useSesion, irALogin } from '../sesion';

function Dato({ etiqueta, valor, ultimo }) {
  return (
    <View style={[estilos.dato, !ultimo && estilos.linea]}>
      <Texto style={estilos.etiqueta}>{etiqueta}</Texto>
      <Texto style={estilos.valor}>{valor}</Texto>
    </View>
  );
}

function Fila({ icono, titulo, texto, onPress }) {
  return (
    <TouchableOpacity style={estilos.fila} onPress={onPress} activeOpacity={0.8}>
      <View style={estilos.filaIcono}><Feather name={icono} size={17} color={colores.azul} /></View>
      <View style={{ flex: 1 }}>
        <Texto style={estilos.filaTitulo}>{titulo}</Texto>
        <Texto style={estilos.filaTexto}>{texto}</Texto>
      </View>
      <Feather name="chevron-right" size={18} color={colores.textoSuave} />
    </TouchableOpacity>
  );
}

// Mi perfil (administrador y profesional). Desde aquí se editan los nombres y la contraseña;
// el correo, el rol y la especialidad NO se pueden cambiar (solo el administrador, desde Profesionales).
export default function PerfilScreen({ navigation }) {
  const { usuario, setUsuario } = useSesion();
  const esAdmin = usuario?.rol === 'admin';
  const cerrar = () => {
    setUsuario(null);
    irALogin();
  };

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <TouchableOpacity onPress={() => navigation.navigate('EditarPerfil')} activeOpacity={0.85}>
          <Avatar foto={usuario?.foto} nombre={usuario?.nombre} tam={84} radio={26} />
          <View style={estilos.editar}><Feather name="edit-2" size={13} color="#fff" /></View>
        </TouchableOpacity>
        <Texto style={estilos.nombre}>{usuario?.nombre}</Texto>
        <Texto style={estilos.rol}>{esAdmin ? 'Administradora del centro' : usuario?.especialidad}</Texto>
        <Insignia texto="Cuenta activa" />
      </View>

      <Texto style={estilos.seccion}>Información personal</Texto>
      <View style={estilos.tarjeta}>
        <Dato etiqueta="Nombre completo" valor={usuario?.nombre} />
        <Dato etiqueta="Correo electrónico" valor={usuario?.correo} />
        <Dato etiqueta="Rol" valor={esAdmin ? 'Administrador' : 'Profesional'} />
        <Dato etiqueta="Especialidad" valor={usuario?.especialidad} ultimo />
        <TouchableOpacity style={estilos.editarFila} onPress={() => navigation.navigate('EditarPerfil')}>
          <Feather name="edit-2" size={15} color={colores.azul} />
          <Texto style={estilos.editarTexto}>Editar información</Texto>
        </TouchableOpacity>
      </View>

      <Texto style={[estilos.seccion, { marginTop: 18 }]}>Seguridad</Texto>
      <Fila icono="lock" titulo="Cambiar contraseña" texto="Actualiza tu contraseña de acceso" onPress={() => navigation.navigate('CambiarContrasena')} />
      <Fila icono="bell" titulo="Notificaciones" texto="Ver los avisos del centro" onPress={() => navigation.navigate('Notificaciones')} />

      <Boton texto="Cerrar sesión" icono="log-out" variante="peligro" style={{ marginTop: 20 }} onPress={cerrar} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  avatar: { width: 84, height: 84, borderRadius: 26, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center' },
  iniciales: { fontSize: 28, fontWeight: '800', color: colores.azul },
  editar: { position: 'absolute', right: -4, bottom: -4, width: 28, height: 28, borderRadius: 10, backgroundColor: colores.azul, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colores.fondo },
  nombre: { fontSize: 20, fontWeight: '800', color: colores.marino, marginTop: 14 },
  rol: { fontSize: 12, color: colores.textoSuave, marginTop: 2, marginBottom: 8 },
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 10 },
  tarjeta: { ...tarjeta, paddingHorizontal: 14 },
  dato: { paddingVertical: 12 },
  linea: { borderBottomWidth: 1, borderBottomColor: colores.borde },
  etiqueta: { fontSize: 10, color: colores.textoSuave },
  valor: { fontSize: 14, fontWeight: '600', color: colores.marino, marginTop: 2 },
  editarFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colores.borde },
  editarTexto: { fontSize: 13, fontWeight: '700', color: colores.azul },
  fila: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  filaIcono: { width: 38, height: 38, borderRadius: 12, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  filaTitulo: { fontSize: 14, fontWeight: '700', color: colores.marino },
  filaTexto: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
});

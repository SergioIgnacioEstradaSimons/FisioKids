import { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import Texto from '../components/Texto';
import Campo from '../components/Campo';
import Boton from '../components/Boton';
import Estado from '../components/Estado';
import { colores } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import SelectorFoto from '../components/SelectorFoto';
import { obtenerUsuario, usuarioConNombreExiste, modificarPerfil, modificarFoto } from '../datos';
import { limpiar } from '../utiles';

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;

// Envoltorio: lee al usuario de SQLite y luego muestra el formulario
export default function EditarPerfilScreen(props) {
  const { usuario } = useSesion();
  const { datos, cargando, error, recargar } = useConsulta((db) => obtenerUsuario(db, usuario.id), [usuario?.id]);
  if (cargando || error || !datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  return <Formulario {...props} actual={datos} />;
}

// Cada usuario puede cambiar sus nombres y apellidos (la contraseña tiene su propia pantalla). El correo y el rol NO se pueden cambiar aquí:
// el correo solo lo modifica el administrador desde Profesionales → Editar profesional.
function Formulario({ navigation, actual }) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { usuario, setUsuario } = useSesion();
  const [v, setV] = useState({ nombres: actual.nombres, apellidos: actual.apellidos });
  const [foto, setFoto] = useState(actual.foto ?? null); // se puede subir una foto o sacarla con la cámara
  const [errores, setErrores] = useState({});
  const cambiar = (campo) => (valor) => setV({ ...v, [campo]: valor });

  const validar = async () => {
    const e = {};
    const nombres = limpiar(v.nombres);
    const apellidos = limpiar(v.apellidos);
    if (!nombres) e.nombres = 'Los nombres son obligatorios';
    else if (nombres.length < 2) e.nombres = 'Escribe al menos 2 letras';
    else if (!SOLO_LETRAS.test(nombres)) e.nombres = 'Solo se permiten letras y espacios';
    if (!apellidos) e.apellidos = 'Los apellidos son obligatorios';
    else if (apellidos.length < 2) e.apellidos = 'Escribe al menos 2 letras';
    else if (!SOLO_LETRAS.test(apellidos)) e.apellidos = 'Solo se permiten letras y espacios';
    else if (!e.nombres && await usuarioConNombreExiste(db, nombres, apellidos, actual.id)) e.apellidos = 'Ya existe un usuario con esos nombres y apellidos';

    return e;
  };

  const guardar = async () => {
    const e = await validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return Alert.alert('Revisa el formulario', 'Hay campos con errores. Corrígelos e inténtalo de nuevo.');
    const nombres = limpiar(v.nombres);
    const apellidos = limpiar(v.apellidos);
    try {
      await modificarPerfil(db, actual.id, { nombres, apellidos, contrasena: '' }); // UPDATE usuarios ... WHERE id = ?
      await modificarFoto(db, actual.id, foto);                                     // UPDATE usuarios SET foto = ?
      setUsuario({ ...usuario, nombres, apellidos, nombre: `${nombres} ${apellidos}`, foto }); // el saludo y el menú se actualizan al instante
      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <SelectorFoto foto={foto} nombre={`${v.nombres} ${v.apellidos}`} onChange={setFoto} etiqueta="Foto de perfil" />
        <Texto style={estilos.seccion}>Datos personales</Texto>
        <Campo etiqueta="Nombres" obligatorio value={v.nombres} onChangeText={cambiar('nombres')} autoCapitalize="words" error={errores.nombres} />
        <Campo etiqueta="Apellidos" obligatorio value={v.apellidos} onChangeText={cambiar('apellidos')} autoCapitalize="words" error={errores.apellidos} />

        <Texto style={[estilos.seccion, { marginTop: 6 }]}>Datos de la cuenta</Texto>
        <Campo etiqueta="Correo electrónico" soloLectura icono="mail" value={actual.correo} />
        <Campo etiqueta="Rol" soloLectura value={actual.rol === 'admin' ? 'Administrador' : 'Profesional'} />
        {actual.rol === 'profesional' ? <Campo etiqueta="Especialidad" soloLectura value={actual.especialidad ?? ''} /> : null}
        <Texto style={estilos.nota}>El correo, el rol y la especialidad solo los puede cambiar el administrador desde Profesionales → Editar profesional.</Texto>

      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => navigation.goBack()} />
        <Boton texto="Guardar cambios" icono="check" style={{ flex: 1.6, marginBottom: 0 }} onPress={guardar} />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 12 },
  nota: { fontSize: 11, color: colores.textoSuave, marginTop: -4 },
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

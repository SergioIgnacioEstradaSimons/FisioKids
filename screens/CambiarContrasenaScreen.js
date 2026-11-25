import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBase } from '../supabase';
import Texto from '../components/Texto';
import Campo from '../components/Campo';
import Boton from '../components/Boton';
import { colores } from '../tema';
import { useSesion } from '../sesion';
import { contrasenaCorrecta, modificarPerfil, registrarEventoParaAdmins } from '../datos';

// Cambio de contraseña: pide la actual, la nueva y su repetición. La nueva se guarda en Supabase Auth.
export default function CambiarContrasenaScreen({ navigation }) {
  const db = useBase();
  const insets = useSafeAreaInsets();
  const { usuario } = useSesion();
  const [v, setV] = useState({ actual: '', nueva: '', repetida: '' });
  const [ver, setVer] = useState(false);
  const [errores, setErrores] = useState({});
  const cambiar = (campo) => (valor) => setV({ ...v, [campo]: valor });

  const guardar = async () => {
    const e = {};
    if (!v.actual) e.actual = 'Escribe tu contraseña actual';
    else if (!(await contrasenaCorrecta(db, usuario.id, v.actual))) e.actual = 'La contraseña actual no es correcta';
    if (!v.nueva) e.nueva = 'Escribe la nueva contraseña';
    else if (v.nueva.length < 6) e.nueva = 'Mínimo 6 caracteres';
    else if (v.nueva === v.actual) e.nueva = 'La nueva contraseña debe ser distinta a la actual';
    if (v.repetida !== v.nueva) e.repetida = 'Las contraseñas no coinciden';
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    try {
      await modificarPerfil(db, usuario.id, { nombres: usuario.nombres, apellidos: usuario.apellidos, contrasena: v.nueva });
      if (usuario.rol === 'profesional') {
        await registrarEventoParaAdmins(db, {
          actor: usuario,
          tipo: 'password',
          titulo: 'Profesional cambió su contraseña',
          texto: `${usuario.nombres} ${usuario.apellidos} actualizó su contraseña de acceso.`,
          icono: 'key',
          tono: 'morado',
        });
      }
      Alert.alert('Contraseña actualizada', 'Usa la nueva contraseña la próxima vez que inicies sesión.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message);
    }
  };

  const ojo = <TouchableOpacity onPress={() => setVer(!ver)}><Feather name={ver ? 'eye-off' : 'eye'} size={18} color={colores.textoSuave} /></TouchableOpacity>;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Campo etiqueta="Contraseña actual" obligatorio icono="lock" secureTextEntry={!ver} value={v.actual} onChangeText={cambiar('actual')} error={errores.actual} derecha={ojo} />
        <Campo etiqueta="Nueva contraseña" obligatorio icono="lock" secureTextEntry={!ver} value={v.nueva} onChangeText={cambiar('nueva')} placeholder="Mínimo 6 caracteres" error={errores.nueva} />
        <Campo etiqueta="Repetir nueva contraseña" obligatorio icono="lock" secureTextEntry={!ver} value={v.repetida} onChangeText={cambiar('repetida')} error={errores.repetida} />
      </ScrollView>
      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => navigation.goBack()} />
        <Boton texto="Guardar" icono="check" style={{ flex: 1.6, marginBottom: 0 }} onPress={guardar} />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

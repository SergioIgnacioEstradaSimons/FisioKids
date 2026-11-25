import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Campo from '../components/Campo';
import Boton from '../components/Boton';
import { colores, tarjeta } from '../tema';
import { useBase } from '../supabase';
import { useSesion } from '../sesion';

export default function LoginScreen({ navigation }) {
  const db = useBase();
  const { setUsuario } = useSesion();
  const [rol, setRol] = useState('admin');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [ver, setVer] = useState(false);
  const [errores, setErrores] = useState({});

  const elegirRol = (r) => {
    setRol(r);
    setCorreo(r === 'admin' ? 'admin@fisiokids.bo' : 'carmen@fisiokids.bo'); // atajo para pruebas
  };

  const ingresar = async () => {
    const e = {};
    if (!correo.trim()) e.correo = 'Ingresa tu correo';
    else if (!/^\S+@\S+\.\S+$/.test(correo.trim())) e.correo = 'El correo no tiene un formato válido';
    if (!contrasena) e.contrasena = 'Ingresa tu contraseña';
    else if (contrasena.length < 6) e.contrasena = 'Mínimo 6 caracteres';
    if (Object.keys(e).length === 0) {
      try {
        const { error: errorAuth } = await db.auth.signInWithPassword({
          email: correo.trim().toLowerCase(),
          password: contrasena,
        });
        if (errorAuth) {
          e.general = errorAuth.message.includes('Email not confirmed')
            ? 'Confirma tu correo para poder ingresar.'
            : 'Correo o contraseña incorrectos';
        } else {
          const { data: { user } } = await db.auth.getUser();
          const { data: perfil } = await db.from('v_usuarios').select('*').eq('auth_id', user.id).maybeSingle();
          if (!perfil?.activo) {
            await db.auth.signOut();
            e.general = 'Tu usuario está inactivo. Contacta al administrador.';
          } else {
            setUsuario(perfil);
            setErrores({});
            navigation.replace('Principal', { rol: perfil.rol });
            return;
          }
        }
      } catch (err) {
        e.general = 'No se pudo iniciar sesión';
      }
    }
    setErrores(e);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <View style={estilos.marcaFila}>
          <View style={estilos.logo}><Feather name="activity" size={22} color={colores.menta} /></View>
          <View>
            <Texto style={estilos.marca}>Fisio<Texto style={{ color: colores.turquesa }}>Kids</Texto></Texto>
            <Texto style={estilos.marcaSub}>Gestión de atención infantil</Texto>
          </View>
        </View>

        <Texto style={estilos.bienvenido}>BIENVENIDO</Texto>
        <Texto style={estilos.titulo}>Inicia sesión en tu cuenta</Texto>
        <Texto style={estilos.sub}>Accede de forma segura a tu espacio de trabajo.</Texto>

        <Texto style={estilos.etiqueta}>Explorar como</Texto>
        <View style={estilos.segmento}>
          {[['admin', 'Administrador', 'shield'], ['profesional', 'Profesional', 'user']].map(([k, t, ic]) => (
            <TouchableOpacity key={k} style={[estilos.opcion, rol === k && estilos.opcionActiva]} onPress={() => elegirRol(k)} activeOpacity={0.8}>
              <Feather name={ic} size={15} color={rol === k ? colores.azul : colores.textoSuave} style={{ marginRight: 6 }} />
              <Texto style={[estilos.opcionTexto, rol === k && { color: colores.azul }]}>{t}</Texto>
            </TouchableOpacity>
          ))}
        </View>

        <Campo etiqueta="Correo electrónico" icono="mail" value={correo} onChangeText={setCorreo}
          placeholder="correo@fisiokids.bo" keyboardType="email-address" autoCapitalize="none" error={errores.correo} />
        <Campo etiqueta="Contraseña" icono="lock" value={contrasena} onChangeText={setContrasena}
          placeholder="••••••" secureTextEntry={!ver} error={errores.contrasena}
          derecha={<TouchableOpacity onPress={() => setVer(!ver)}><Feather name={ver ? 'eye-off' : 'eye'} size={18} color={colores.textoSuave} /></TouchableOpacity>} />
        {errores.general ? <Texto style={estilos.errorGeneral}>{errores.general}</Texto> : null}

        <Boton texto="Iniciar sesión" onPress={ingresar} style={{ marginTop: 8 }} />

        <View style={estilos.ayuda}>
          <Texto style={estilos.ayudaTitulo}>Usuarios de prueba</Texto>
          <Texto style={estilos.ayudaTexto}>Administrador: admin@fisiokids.bo / admin123</Texto>
          <Texto style={estilos.ayudaTexto}>Profesional: carmen@fisiokids.bo / prof123</Texto>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexGrow: 1, padding: 24, paddingTop: 60, justifyContent: 'center' },
  marcaFila: { flexDirection: 'row', alignItems: 'center', marginBottom: 34 },
  logo: { width: 46, height: 46, borderRadius: 14, backgroundColor: colores.marinoOscuro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  marca: { fontSize: 20, fontWeight: '800', color: colores.marino },
  marcaSub: { fontSize: 11, color: colores.textoSuave },
  bienvenido: { fontSize: 11, fontWeight: '700', color: colores.turquesa, letterSpacing: 1 },
  titulo: { fontSize: 26, fontWeight: '800', color: colores.marino, marginTop: 6 },
  sub: { color: colores.textoSuave, fontSize: 13, marginTop: 6, marginBottom: 22 },
  etiqueta: { fontSize: 13, fontWeight: '600', color: colores.texto, marginBottom: 7 },
  segmento: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  opcion: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: colores.borde, backgroundColor: '#fff' },
  opcionActiva: { backgroundColor: colores.azulClaro, borderColor: '#B9D4F7' },
  opcionTexto: { fontSize: 13, fontWeight: '600', color: colores.textoSuave },
  errorGeneral: { color: colores.error, marginBottom: 6, textAlign: 'center', fontWeight: '600', fontSize: 13 },
  ayuda: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colores.azulClaro },
  ayudaTitulo: { fontWeight: '700', color: colores.marino, marginBottom: 4, fontSize: 12 },
  ayudaTexto: { fontSize: 11, color: colores.texto },
});

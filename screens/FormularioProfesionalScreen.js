import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Texto from '../components/Texto';
import Campo from '../components/Campo';
import Selector from '../components/Selector';
import Boton from '../components/Boton';
import SelectorFoto from '../components/SelectorFoto';
import { colores } from '../tema';
import { useBase } from '../supabase';
import Estado from '../components/Estado';
import { useConsulta } from '../hooks';
import { obtenerUsuario, correoExiste, usuarioConNombreExiste, agregarProfesional, modificarProfesional } from '../datos';
import { limpiar } from '../utiles';

const ESPECIALIDADES = ['Fisioterapia pediátrica', 'Terapia motriz', 'Estimulación temprana', 'Terapia respiratoria', 'Terapia ocupacional', 'Otra']
  .map((e) => ({ valor: e, etiqueta: e }));

// Parámetro opcional: profesionalId (si llega, el formulario es de edición)
export default function FormularioProfesionalScreen(props) {
  const id = props.route.params?.profesionalId;
  const { datos, cargando, error, recargar } = useConsulta((db) => (id ? obtenerUsuario(db, id) : Promise.resolve(null)), [id]);
  if (cargando || error) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  return <Formulario {...props} existente={datos} />;
}

function Formulario({ navigation, existente }) {
  const db = useBase();
  const insets = useSafeAreaInsets();
  const [v, setV] = useState({
    foto: existente?.foto ?? null, // opcional
    nombres: existente?.nombres ?? '',
    apellidos: existente?.apellidos ?? '',
    especialidad: existente?.especialidad ?? null,
    correo: existente?.correo ?? '',
    contrasena: '',
    activo: existente ? existente.activo : 1,
  });
  const [ver, setVer] = useState(false);
  const [errores, setErrores] = useState({});
  const cambiar = (campo) => (valor) => setV({ ...v, [campo]: valor });

  const validar = async () => {
    const e = {};
    const nombres = limpiar(v.nombres);
    const apellidos = limpiar(v.apellidos);
    if (!nombres) e.nombres = 'Los nombres son obligatorios';
    else if (nombres.length < 2) e.nombres = 'Escribe al menos 2 letras';
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/.test(nombres)) e.nombres = 'Solo se permiten letras y espacios';
    if (!apellidos) e.apellidos = 'Los apellidos son obligatorios';
    else if (apellidos.length < 2) e.apellidos = 'Escribe al menos 2 letras';
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/.test(apellidos)) e.apellidos = 'Solo se permiten letras y espacios';
    else if (!e.nombres && await usuarioConNombreExiste(db, nombres, apellidos, existente?.id ?? 0)) e.apellidos = 'Ya existe un usuario con esos nombres y apellidos';
    if (!v.especialidad) e.especialidad = 'Selecciona una especialidad';
    const correo = v.correo.trim().toLowerCase();
    if (!correo) e.correo = 'El correo es obligatorio';
    else if (!/^\S+@\S+\.\S+$/.test(correo)) e.correo = 'El correo no tiene un formato válido';
    else if (await correoExiste(db, correo, existente?.id ?? 0)) e.correo = 'Ya existe un usuario con ese correo';
    if (!existente && !v.contrasena) e.contrasena = 'La contraseña es obligatoria';
    else if (!existente && v.contrasena.length < 6) e.contrasena = 'Mínimo 6 caracteres';
    return e;
  };

  const guardar = async () => {
    const e = await validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return Alert.alert('Revisa el formulario', 'Hay campos con errores. Corrígelos e inténtalo de nuevo.');
    try {
      if (existente) await modificarProfesional(db, existente.id, { ...v, nombres: limpiar(v.nombres), apellidos: limpiar(v.apellidos) }); // UPDATE usuarios ... WHERE id = ?
      else await agregarProfesional(db, { ...v, nombres: limpiar(v.nombres), apellidos: limpiar(v.apellidos) });                             // INSERT INTO usuarios
      Alert.alert('Guardado', existente ? 'Los cambios se guardaron.' : 'El profesional se registró correctamente.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <SelectorFoto foto={v.foto} nombre={`${v.nombres} ${v.apellidos}`} onChange={cambiar('foto')} etiqueta="Foto de perfil (opcional)" />
        <Texto style={estilos.seccion}>Datos del profesional</Texto>
        <Campo etiqueta="Nombres" obligatorio value={v.nombres} onChangeText={cambiar('nombres')} placeholder="Ej. Carmen Rosa" autoCapitalize="words" error={errores.nombres} />
        <Campo etiqueta="Apellidos" obligatorio value={v.apellidos} onChangeText={cambiar('apellidos')} placeholder="Ej. Ruiz Vargas" autoCapitalize="words" error={errores.apellidos} />
        <Selector etiqueta="Especialidad" obligatorio valor={v.especialidad} opciones={ESPECIALIDADES} onChange={cambiar('especialidad')} error={errores.especialidad} />

        <Texto style={[estilos.seccion, { marginTop: 6 }]}>Acceso a la app</Texto>
        <Campo etiqueta="Correo electrónico" obligatorio icono="mail" value={v.correo} onChangeText={cambiar('correo')}
          placeholder="correo@fisiokids.bo" keyboardType="email-address" autoCapitalize="none" error={errores.correo} soloLectura={Boolean(existente)} />
        {existente ? (
          <Texto style={estilos.nota}>Cada profesional cambia su contraseña desde Mi perfil.</Texto>
        ) : (
          <Campo etiqueta="Contraseña" obligatorio icono="lock" value={v.contrasena}
            onChangeText={cambiar('contrasena')} placeholder="Mínimo 6 caracteres"
            secureTextEntry={!ver} error={errores.contrasena}
            derecha={<TouchableOpacity onPress={() => setVer(!ver)}><Feather name={ver ? 'eye-off' : 'eye'} size={18} color={colores.textoSuave} /></TouchableOpacity>} />
        )}

        {existente ? (
          <Selector etiqueta="Estado" valor={v.activo} opciones={[{ valor: 1, etiqueta: 'Activo' }, { valor: 0, etiqueta: 'Inactivo (baja lógica)' }]} onChange={cambiar('activo')} />
        ) : null}
      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => navigation.goBack()} />
        <Boton texto={existente ? 'Guardar cambios' : 'Guardar profesional'} icono="check" style={{ flex: 1.6, marginBottom: 0 }} onPress={guardar} />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 12 },
  nota: { fontSize: 11, color: colores.textoSuave, marginBottom: 14 },
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

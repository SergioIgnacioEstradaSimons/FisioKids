import { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Texto from '../components/Texto';
import Campo from '../components/Campo';
import Selector from '../components/Selector';
import Boton from '../components/Boton';
import { colores } from '../tema';
import { useBase } from '../supabase';
import Estado from '../components/Estado';
import { useConsulta } from '../hooks';
import ModalTexto from '../components/ModalTexto';
import { obtenerNino, agregarNino, modificarNino, ninoExiste, obtenerTipos, agregarTipo, tipoExiste } from '../datos';
import { isoADmy, dmyAIso, GRADOS as LISTA_GRADOS, limpiar } from '../utiles';

const GRADOS = LISTA_GRADOS.map((g) => ({ valor: g, etiqueta: g }));
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;
const NUEVO_TIPO = '__nuevo__';

// Pone las diagonales mientras se escribe la fecha: 14032019 -> 14/03/2019
const formatearFecha = (t) => {
  const d = t.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

// Validación: devuelve un objeto con los errores encontrados
function validar(v) {
  const e = {};
  const nombres = limpiar(v.nombres);
  const apellidos = limpiar(v.apellidos);
  if (!nombres) e.nombres = 'Los nombres son obligatorios';
  else if (nombres.length < 2) e.nombres = 'Escribe al menos 2 letras';
  else if (!SOLO_LETRAS.test(nombres)) e.nombres = 'Solo se permiten letras y espacios';
  if (!apellidos) e.apellidos = 'Los apellidos son obligatorios';
  else if (apellidos.length < 2) e.apellidos = 'Escribe al menos 2 letras';
  else if (!SOLO_LETRAS.test(apellidos)) e.apellidos = 'Solo se permiten letras y espacios';

  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.fecha);
  if (!v.fecha) e.fecha = 'La fecha de nacimiento es obligatoria';
  else if (!m) e.fecha = 'Usa el formato DD/MM/AAAA';
  else {
    const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const f = new Date(a, mes - 1, d);
    if (f.getFullYear() !== a || f.getMonth() !== mes - 1 || f.getDate() !== d) e.fecha = 'La fecha no existe';
    else if (f > new Date()) e.fecha = 'La fecha no puede ser futura';
    else if (new Date().getFullYear() - a > 18) e.fecha = 'El niño debe tener 18 años o menos';
  }
  if (!v.tipo) e.tipo = 'Selecciona el tipo de discapacidad';
  if (!v.grado) e.grado = 'Selecciona el grado de discapacidad';

  if (!v.tutor_nombre.trim()) e.tutor_nombre = 'El nombre del tutor es obligatorio';
  else if (v.tutor_nombre.trim().length < 3) e.tutor_nombre = 'Escribe al menos 3 letras';

  if (!v.tutor_telefono.trim()) e.tutor_telefono = 'El teléfono es obligatorio';
  else if (!/^[67]\d{7}$/.test(v.tutor_telefono.trim())) e.tutor_telefono = 'Debe tener 8 dígitos y empezar con 6 o 7';
  return e;
}

// Envoltorio: si llega ninoId, primero lee el niño de SQLite y luego muestra el formulario
export default function FormularioNinoScreen(props) {
  const id = props.route.params?.ninoId;
  const { datos, cargando, error, recargar } = useConsulta(async (db) => ({
    existente: id ? await obtenerNino(db, id) : null,
    tipos: await obtenerTipos(db, true), // los tipos activos; el administrador puede agregar más
  }), [id]);
  if (cargando || error || !datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  return <Formulario {...props} existente={datos.existente} tipos={datos.tipos} recargarTipos={recargar} />;
}

function Formulario({ navigation, existente, tipos, recargarTipos }) {
  const db = useBase();
  const insets = useSafeAreaInsets();
  const [v, setV] = useState({
    nombres: existente?.nombres ?? '',
    apellidos: existente?.apellidos ?? '',
    fecha: isoADmy(existente?.fecha_nacimiento),
    tipo: existente?.tipo_discapacidad ?? null,
    grado: existente?.grado ?? null,
    tutor_nombre: existente?.tutor_nombre ?? '',
    tutor_telefono: existente?.tutor_telefono ?? '',
    observaciones: existente?.observaciones ?? '',
  });
  const [errores, setErrores] = useState({});
  const [nuevoTipo, setNuevoTipo] = useState(false);
  // tipos activos (+ el que ya tiene el niño aunque esté inactivo) y la opción para agregar uno nuevo
  const nombres = tipos.map((t) => t.nombre);
  if (existente?.tipo_discapacidad && !nombres.includes(existente.tipo_discapacidad)) nombres.push(existente.tipo_discapacidad);
  const opcionesTipo = [...nombres.map((t) => ({ valor: t, etiqueta: t })), { valor: NUEVO_TIPO, etiqueta: '＋ Agregar nuevo tipo' }];
  const guardarNuevoTipo = async (texto) => {
    const nombre = limpiar(texto);
    if (nombre.length < 3) return 'Escribe al menos 3 caracteres';
    if (await tipoExiste(db, nombre)) return 'Ese tipo ya existe';
    await agregarTipo(db, nombre); // INSERT INTO tipos_discapacidad
    await recargarTipos();
    setV((anterior) => ({ ...anterior, tipo: nombre }));
    return null;
  };
  const cambiar = (campo) => (valor) => setV({ ...v, [campo]: valor });

  const guardar = async () => {
    const e = validar(v);
    // Evita duplicados: mismos nombres, apellidos y fecha de nacimiento
    if (!e.nombres && !e.apellidos && !e.fecha && await ninoExiste(db, limpiar(v.nombres), limpiar(v.apellidos), dmyAIso(v.fecha), existente?.id ?? 0)) {
      e.apellidos = 'Ya existe un niño con esos nombres, apellidos y fecha de nacimiento';
    }
    setErrores(e);
    if (Object.keys(e).length > 0) {
      Alert.alert('Revisa el formulario', 'Hay campos con errores. Corrígelos e inténtalo de nuevo.');
      return;
    }
    const datos = {
      nombres: limpiar(v.nombres), apellidos: limpiar(v.apellidos), fecha_nacimiento: dmyAIso(v.fecha), tipo_discapacidad: v.tipo, grado: v.grado,
      tutor_nombre: v.tutor_nombre, tutor_telefono: v.tutor_telefono, observaciones: v.observaciones,
    };
    try {
      if (existente) await modificarNino(db, existente.id, datos); // UPDATE ... WHERE id = ?
      else await agregarNino(db, datos);                           // INSERT
      Alert.alert('Guardado', existente ? 'Los cambios se guardaron.' : 'El niño se registró correctamente.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Texto style={estilos.seccion}>Información personal</Texto>
        <Campo etiqueta="Nombres" obligatorio value={v.nombres} onChangeText={cambiar('nombres')} placeholder="Ej. Sofía Camila" autoCapitalize="words" error={errores.nombres} />
        <Campo etiqueta="Apellidos" obligatorio value={v.apellidos} onChangeText={cambiar('apellidos')} placeholder="Ej. Valdez Rojas" autoCapitalize="words" error={errores.apellidos} />
        <Campo etiqueta="Fecha de nacimiento" obligatorio icono="calendar" value={v.fecha} onChangeText={(t) => cambiar('fecha')(formatearFecha(t))}
          placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} error={errores.fecha} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Selector estiloContenedor={{ flex: 3 }} etiqueta="Tipo de discapacidad" obligatorio valor={v.tipo} opciones={opcionesTipo}
            onChange={(t) => (t === NUEVO_TIPO ? setNuevoTipo(true) : cambiar('tipo')(t))} error={errores.tipo} />
          <Selector estiloContenedor={{ flex: 2 }} etiqueta="Grado de discapacidad" obligatorio valor={v.grado} opciones={GRADOS} onChange={cambiar('grado')} error={errores.grado} />
        </View>

        <Texto style={[estilos.seccion, { marginTop: 6 }]}>Datos del tutor</Texto>
        <Campo etiqueta="Nombre del tutor" obligatorio value={v.tutor_nombre} onChangeText={cambiar('tutor_nombre')} placeholder="Nombre completo" error={errores.tutor_nombre} />
        <Campo etiqueta="Teléfono de contacto" obligatorio icono="phone" value={v.tutor_telefono} onChangeText={cambiar('tutor_telefono')}
          placeholder="70123456" keyboardType="phone-pad" maxLength={8} error={errores.tutor_telefono} />
        <Campo etiqueta="Observaciones" value={v.observaciones} onChangeText={cambiar('observaciones')} placeholder="Información relevante para la atención…" multiline />
      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => navigation.goBack()} />
        <Boton texto={existente ? 'Guardar cambios' : 'Guardar niño'} icono="check" style={{ flex: 1.6, marginBottom: 0 }} onPress={guardar} />
      </View>
      <ModalTexto visible={nuevoTipo} titulo="Nuevo tipo de discapacidad" etiqueta="Nombre del tipo" placeholder="Ej. Discapacidad visual" textoBoton="Agregar"
        onGuardar={guardarNuevoTipo} onCerrar={() => setNuevoTipo(false)} />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 12 },
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

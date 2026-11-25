import { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Texto from '../components/Texto';
import Campo from '../components/Campo';
import Selector from '../components/Selector';
import Boton from '../components/Boton';
import { colores } from '../tema';
import { useBase } from '../supabase';
import Estado from '../components/Estado';
import { useConsulta } from '../hooks';
import { obtenerSala, salaExiste, agregarSala, modificarSala } from '../datos';

const CAPACIDADES = [1, 2, 3, 4].map((n) => ({ valor: n, etiqueta: `${n} ${n === 1 ? 'niño' : 'niños'}` }));

// Parámetro opcional: salaId (si llega, el formulario es de edición)
export default function FormularioSalaScreen(props) {
  const id = props.route.params?.salaId;
  const { datos, cargando, error, recargar } = useConsulta((db) => (id ? obtenerSala(db, id) : Promise.resolve(null)), [id]);
  if (cargando || error) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  return <Formulario {...props} existente={datos} />;
}

function Formulario({ navigation, existente }) {
  const db = useBase();
  const insets = useSafeAreaInsets();
  const [v, setV] = useState({
    nombre: existente?.nombre ?? '',
    capacidad: existente?.capacidad ?? null,
    activo: existente ? existente.activo : 1,
  });
  const [errores, setErrores] = useState({});
  const cambiar = (campo) => (valor) => setV({ ...v, [campo]: valor });

  const guardar = async () => {
    const e = {};
    const nombre = v.nombre.trim();
    if (!nombre) e.nombre = 'El nombre es obligatorio';
    else if (nombre.length < 3) e.nombre = 'Escribe al menos 3 caracteres';
    else if (await salaExiste(db, nombre, existente?.id ?? 0)) e.nombre = 'Ya existe una sala con ese nombre';
    if (!v.capacidad) e.capacidad = 'Selecciona la capacidad (máximo 4 niños por bloque)';
    setErrores(e);
    if (Object.keys(e).length > 0) return Alert.alert('Revisa el formulario', 'Hay campos con errores. Corrígelos e inténtalo de nuevo.');
    try {
      if (existente) await modificarSala(db, existente.id, v); // UPDATE salas ... WHERE id = ?
      else await agregarSala(db, v);                             // INSERT INTO salas
      Alert.alert('Guardado', existente ? 'Los cambios se guardaron.' : 'La sala se registró correctamente.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Texto style={estilos.seccion}>Datos de la sala</Texto>
        <Campo etiqueta="Nombre de la sala" obligatorio value={v.nombre} onChangeText={cambiar('nombre')} placeholder="Ej. Sala Motriz" error={errores.nombre} />
        <Selector etiqueta="Capacidad" obligatorio valor={v.capacidad} opciones={CAPACIDADES} onChange={cambiar('capacidad')} error={errores.capacidad} />
        {existente ? (
          <Selector etiqueta="Estado" valor={v.activo} opciones={[{ valor: 1, etiqueta: 'Activa' }, { valor: 0, etiqueta: 'Inactiva (baja lógica)' }]} onChange={cambiar('activo')} />
        ) : null}
      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => navigation.goBack()} />
        <Boton texto={existente ? 'Guardar cambios' : 'Guardar sala'} icono="check" style={{ flex: 1.6, marginBottom: 0 }} onPress={guardar} />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  seccion: { fontSize: 15, fontWeight: '700', color: colores.marino, marginBottom: 12 },
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

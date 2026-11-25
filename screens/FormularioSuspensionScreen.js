import { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBase } from '../supabase';
import Campo from '../components/Campo';
import Boton from '../components/Boton';
import SelectorFecha from '../components/SelectorFecha';
import { colores } from '../tema';
import { useConsulta } from '../hooks';
import { agregarSuspension, obtenerSuspensionDeFecha, obtenerSuspensiones } from '../datos';
import { hoyISO, limpiar } from '../utiles';

// Suspensión manual de un día (por ejemplo, un día sin atención que no es feriado nacional)
export default function FormularioSuspensionScreen({ navigation }) {
  const db = useBase();
  const insets = useSafeAreaInsets();
  const [fecha, setFecha] = useState(null); // AAAA-MM-DD, se elige en el calendario
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState({});
  const { datos: guardadas } = useConsulta(obtenerSuspensiones);

  const guardar = async () => {
    const e = {};
    if (!fecha) e.fecha = 'Elige la fecha de la suspensión';
    else if (fecha < hoyISO()) e.fecha = 'La fecha no puede ser anterior a hoy';
    else if (await obtenerSuspensionDeFecha(db, fecha)) e.fecha = 'Ese día ya tiene una suspensión';
    const texto = limpiar(motivo);
    if (!texto) e.motivo = 'El motivo es obligatorio';
    else if (texto.length < 4) e.motivo = 'Escribe al menos 4 caracteres';
    setErrores(e);
    if (Object.keys(e).length > 0) return Alert.alert('Revisa el formulario', 'Hay campos con errores. Corrígelos e inténtalo de nuevo.');
    try {
      await agregarSuspension(db, { fecha, motivo: texto, origen: 'manual' }); // INSERT INTO suspensiones
      Alert.alert('Suspensión guardada', 'Ese día no habrá sesiones ni asistencia.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <SelectorFecha etiqueta="Fecha de la suspensión" obligatorio valor={fecha} onChange={setFecha} minima={hoyISO()}
          marcadas={(guardadas ?? []).map((s) => s.fecha)} error={errores.fecha} />
        <Campo etiqueta="Motivo" obligatorio value={motivo} onChangeText={setMotivo} placeholder="Ej. Mantenimiento del centro" error={errores.motivo} />
      </ScrollView>
      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={() => navigation.goBack()} />
        <Boton texto="Guardar suspensión" icono="check" style={{ flex: 1.6, marginBottom: 0 }} onPress={guardar} />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

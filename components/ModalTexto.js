import { useState } from 'react';
import { View, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Texto from './Texto';
import Campo from './Campo';
import Boton from './Boton';
import { colores } from '../tema';

// Ventana para escribir un texto corto (por ejemplo, un nuevo tipo de discapacidad).
// onGuardar(texto) puede devolver un mensaje de error (string) o nada si todo salió bien.
export default function ModalTexto({ visible, ...props }) {
  if (!visible) return null;
  return <ModalTextoVisible visible {...props} />;
}

function ModalTextoVisible({ visible, titulo, etiqueta, valorInicial = '', placeholder, textoBoton = 'Guardar', onGuardar, onCerrar }) {
  const [texto, setTexto] = useState(valorInicial);
  const [error, setError] = useState(null);

  const guardar = async () => {
    const mensaje = await onGuardar(texto);
    if (mensaje) setError(mensaje);
    else onCerrar();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <TouchableWithoutFeedback onPress={onCerrar}>
        <KeyboardAvoidingView style={estilos.fondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableWithoutFeedback>
            <View style={estilos.tarjeta}>
              <Texto style={estilos.titulo}>{titulo}</Texto>
              <Campo etiqueta={etiqueta} value={texto} onChangeText={setTexto} placeholder={placeholder} error={error} autoFocus autoCapitalize="sentences" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Boton texto="Cancelar" variante="secundario" style={{ flex: 1, marginBottom: 0 }} onPress={onCerrar} />
                <Boton texto={textoBoton} icono="check" style={{ flex: 1.4, marginBottom: 0 }} onPress={guardar} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(15,42,67,0.5)', justifyContent: 'center', padding: 24 },
  tarjeta: { backgroundColor: '#fff', borderRadius: 22, padding: 20 },
  titulo: { fontSize: 17, fontWeight: '800', color: colores.marino, marginBottom: 14 },
});

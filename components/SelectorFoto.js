import { useState } from 'react';
import { View, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Texto from './Texto';
import Avatar from './Avatar';
import { SelectorModal } from './Selector';
import { colores } from '../tema';

// La foto se recorta cuadrada y se comprime; se guarda en la base como texto (base64)
const OPCIONES = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true };

// Foto de perfil: permite tomar una foto con la cámara, elegirla de la galería o quitarla.
// foto: imagen actual (data URI) o null. onChange recibe la nueva imagen o null.
export default function SelectorFoto({ foto, nombre, onChange, tam = 92, etiqueta = 'Foto de perfil (opcional)' }) {
  const [abierto, setAbierto] = useState(false);

  const elegir = async (opcion) => {
    if (opcion === 'quitar') return onChange(null);
    try {
      let resultado;
      if (opcion === 'camara') {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) return Alert.alert('Permiso necesario', 'Permite el acceso a la cámara para tomar la foto.');
        resultado = await ImagePicker.launchCameraAsync(OPCIONES);
      } else {
        resultado = await ImagePicker.launchImageLibraryAsync(OPCIONES);
      }
      const imagen = resultado.assets?.[0];
      if (!resultado.canceled && imagen?.base64) onChange(`data:image/jpeg;base64,${imagen.base64}`);
    } catch (e) {
      Alert.alert('No se pudo obtener la foto', e.message);
    }
  };

  const opciones = [
    { valor: 'camara', etiqueta: 'Tomar foto' },
    { valor: 'galeria', etiqueta: 'Elegir de la galería' },
    ...(foto ? [{ valor: 'quitar', etiqueta: 'Quitar foto' }] : []),
  ];

  return (
    <View style={estilos.caja}>
      <TouchableOpacity onPress={() => setAbierto(true)} activeOpacity={0.85}>
        <Avatar foto={foto} nombre={nombre || '?'} tam={tam} radio={Math.round(tam * 0.3)} />
        <View style={estilos.camara}><Feather name="camera" size={14} color="#fff" /></View>
      </TouchableOpacity>
      <Texto style={estilos.etiqueta}>{etiqueta}</Texto>
      <TouchableOpacity onPress={() => setAbierto(true)}><Texto style={estilos.enlace}>{foto ? 'Cambiar foto' : 'Agregar foto'}</Texto></TouchableOpacity>
      <SelectorModal visible={abierto} titulo="Foto de perfil" opciones={opciones} onElegir={elegir} onCerrar={() => setAbierto(false)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { alignItems: 'center', marginBottom: 18 },
  camara: { position: 'absolute', right: -4, bottom: -4, width: 30, height: 30, borderRadius: 11, backgroundColor: colores.azul, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colores.fondo },
  etiqueta: { fontSize: 11, color: colores.textoSuave, marginTop: 10 },
  enlace: { fontSize: 13, fontWeight: '700', color: colores.azul, marginTop: 2 },
});

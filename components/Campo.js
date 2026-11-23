import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto, { familiaDe } from './Texto';
import { colores } from '../tema';

// Campo de formulario con etiqueta, ícono opcional, elemento a la derecha y mensaje de error
export default function Campo({ etiqueta, error, obligatorio, icono, derecha, estiloContenedor, multiline, soloLectura, ...props }) {
  return (
    <View style={[estilos.grupo, estiloContenedor]}>
      {etiqueta ? (
        <Texto style={estilos.etiqueta}>
          {etiqueta}
          {obligatorio ? <Texto style={{ color: colores.error }}> *</Texto> : null}
        </Texto>
      ) : null}
      <View style={[estilos.caja, multiline && { alignItems: 'flex-start' }, error ? estilos.cajaError : null, soloLectura && estilos.cajaLectura]}>
        {icono ? <Feather name={icono} size={17} color={colores.textoSuave} style={{ marginRight: 10 }} /> : null}
        <TextInput
          style={[estilos.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
          placeholderTextColor="#9AA9BC"
          multiline={multiline}
          editable={!soloLectura}
          {...props}
        />
        {soloLectura ? <Feather name="lock" size={15} color={colores.textoSuave} /> : derecha}
      </View>
      {error ? <Texto style={estilos.error}>{error}</Texto> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { marginBottom: 14 },
  etiqueta: { fontSize: 13, fontWeight: '600', color: colores.texto, marginBottom: 7 },
  caja: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.tarjeta, borderWidth: 1, borderColor: colores.borde, borderRadius: 14, paddingHorizontal: 14 },
  cajaLectura: { backgroundColor: '#EDF1F6' },
  cajaError: { borderColor: colores.error, backgroundColor: '#FFF8F8' },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: colores.texto, fontFamily: familiaDe(400) },
  error: { color: colores.error, fontSize: 12, marginTop: 5 },
});

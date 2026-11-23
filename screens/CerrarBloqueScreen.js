import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import Texto from '../components/Texto';
import Boton from '../components/Boton';
import Estado from '../components/Estado';
import Insignia from '../components/Insignia';
import { iniciales } from '../components/TarjetaNino';
import { colores, tarjeta } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import { obtenerBloque, obtenerNinosDeBloque, obtenerAsistenciaDelBloque, marcarPendientesComoFalta, cerrarBloque } from '../datos';
import { hoyISO } from '../utiles';

function Contador({ valor, etiqueta, icono, color, fondo }) {
  return (
    <View style={estilos.contador}>
      <View style={estilos.contadorFila}>
        <View style={[estilos.contadorIcono, { backgroundColor: fondo }]}><Feather name={icono} size={13} color={color} /></View>
        <Texto style={estilos.contadorValor}>{valor}</Texto>
      </View>
      <Texto style={estilos.contadorEtiqueta}>{etiqueta}</Texto>
    </View>
  );
}

// Revisión final antes de cerrar el bloque. No se puede confirmar mientras queden niños sin asistencia:
// hay que marcarlos o registrarlos como falta.
export default function CerrarBloqueScreen({ navigation, route }) {
  const db = useSQLiteContext();
  const { usuario } = useSesion();
  const id = route.params?.bloqueId;
  const fecha = hoyISO();
  const { datos, cargando, error, recargar } = useConsulta(async (d) => ({
    bloque: await obtenerBloque(d, id),
    ninos: await obtenerNinosDeBloque(d, id),
    asistencia: await obtenerAsistenciaDelBloque(d, id, fecha),
  }), [id]);

  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  const { bloque, ninos, asistencia } = datos;
  if (!bloque) return <Texto style={{ padding: 20 }}>No se encontró el bloque.</Texto>;

  const estadoDe = (nid) => asistencia.find((a) => a.nino_id === nid);
  const presentes = ninos.filter((n) => estadoDe(n.id)?.estado === 'Presente');
  const faltas = ninos.filter((n) => estadoDe(n.id)?.estado === 'Falta');
  const pendientes = ninos.filter((n) => !estadoDe(n.id));
  const sinAtencion = presentes.filter((n) => !estadoDe(n.id)?.actividades).length;

  const pendientesComoFalta = async () => {
    await marcarPendientesComoFalta(db, bloque.id, fecha); // INSERT OR IGNORE ... 'Falta'
    recargar();
  };

  const confirmar = () => Alert.alert('Cerrar bloque', 'Esta acción no se puede deshacer. ¿Cerrar el bloque?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Cerrar bloque', onPress: async () => {
      try {
        await cerrarBloque(db, bloque.id, fecha, usuario.id);
        Alert.alert('Bloque cerrado', 'La asistencia quedó registrada y pasa al historial.', [{ text: 'Aceptar', onPress: () => navigation.popToTop() }]);
      } catch (e) {
        Alert.alert('No se pudo cerrar', e.message);
      }
    } },
  ]);

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <View style={estilos.reloj}><Feather name="clock" size={30} color={colores.azul} /></View>
        <Texto style={estilos.titulo}>Cerrar bloque de las {bloque.hora_inicio}</Texto>
        <Texto style={estilos.sub}>Revisa el resumen antes de finalizar la sesión.</Texto>
      </View>

      <View style={estilos.contadores}>
        <Contador valor={presentes.length} etiqueta="Presente" icono="check" color={colores.exito} fondo={colores.verdeClaro} />
        <Contador valor={faltas.length} etiqueta="Falta" icono="x" color={colores.error} fondo={colores.rojoClaro} />
        <Contador valor={pendientes.length} etiqueta="Pendiente" icono="clock" color={colores.alerta} fondo={colores.naranjaClaro} />
      </View>

      {pendientes.map((n) => (
        <View key={n.id} style={estilos.nino}>
          <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(n.nombre)}</Texto></View>
          <View style={{ flex: 1 }}>
            <Texto style={estilos.nombre}>{n.nombre}</Texto>
            <Texto style={estilos.detalle}>Se registrará automáticamente como falta</Texto>
          </View>
          <Insignia texto="Pendiente" tipo="naranja" />
        </View>
      ))}

      {pendientes.length > 0 ? (
        <Boton texto="Marcar pendientes como falta" icono="x-circle" variante="secundario" onPress={pendientesComoFalta} />
      ) : null}
      {pendientes.length === 0 && sinAtencion > 0 ? (
        <View style={estilos.info}>
          <Feather name="info" size={15} color={colores.azul} />
          <Texto style={estilos.infoTexto}>{sinAtencion} niño(s) presente(s) sin registro de atención. Puedes completarlo antes de cerrar.</Texto>
        </View>
      ) : null}

      <View style={estilos.advertencia}>
        <Feather name="alert-triangle" size={17} color={colores.alerta} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Texto style={estilos.advertenciaTitulo}>Esta acción no se puede deshacer</Texto>
          <Texto style={estilos.advertenciaTexto}>El bloque quedará cerrado y no admitirá cambios sin autorización.</Texto>
        </View>
      </View>

      <Boton texto="Confirmar y cerrar bloque" deshabilitado={pendientes.length > 0} onPress={confirmar} />
      {pendientes.length > 0 ? <Texto style={estilos.nota}>Marca la asistencia de todos o registra los pendientes como falta para poder confirmar.</Texto> : null}
      <Texto style={estilos.volver} onPress={() => navigation.goBack()}>Volver a asistencia</Texto>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  reloj: { width: 64, height: 64, borderRadius: 20, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  titulo: { fontSize: 21, fontWeight: '800', color: colores.marino },
  sub: { fontSize: 12, color: colores.textoSuave, marginTop: 4 },
  contadores: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  contador: { ...tarjeta, flex: 1, padding: 10 },
  contadorFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contadorIcono: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contadorValor: { fontSize: 18, fontWeight: '800', color: colores.marino },
  contadorEtiqueta: { fontSize: 11, color: colores.textoSuave, marginTop: 4 },
  nino: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 8 },
  avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  iniciales: { fontSize: 12, fontWeight: '700', color: colores.azul },
  nombre: { fontSize: 13, fontWeight: '700', color: colores.marino },
  detalle: { fontSize: 11, color: colores.textoSuave },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colores.azulClaro, borderRadius: 14, padding: 12, marginBottom: 10 },
  infoTexto: { flex: 1, fontSize: 11, color: colores.marino },
  advertencia: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.naranjaClaro, borderWidth: 1, borderColor: '#F6D9AE', borderRadius: 14, padding: 12, marginVertical: 12 },
  advertenciaTitulo: { fontSize: 12, fontWeight: '700', color: colores.alerta },
  advertenciaTexto: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  nota: { fontSize: 11, color: colores.textoSuave, textAlign: 'center', marginBottom: 6 },
  volver: { textAlign: 'center', color: colores.azul, fontWeight: '700', fontSize: 13, paddingVertical: 12 },
});

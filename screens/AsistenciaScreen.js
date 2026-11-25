import { View, StyleSheet } from 'react-native';
import Texto from '../components/Texto';
import Estado from '../components/Estado';
import PanelAsistencia from '../components/PanelAsistencia';
import { colores } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import { obtenerBloquesConEstado, obtenerSuspensionDeFecha } from '../datos';
import { diaLaboralDeHoy, hoyISO } from '../utiles';

// Pestaña Asistencia del profesional: abre directamente el SIGUIENTE bloque de hoy que todavía no está cerrado.
export default function AsistenciaScreen({ navigation }) {
  const { usuario } = useSesion();
  const dia = diaLaboralDeHoy();
  const { datos, cargando, error, recargar } = useConsulta(
    async (db) => ({
      suspension: await obtenerSuspensionDeFecha(db, hoyISO()),
      bloques: dia ? await obtenerBloquesConEstado(db, dia, hoyISO(), usuario.id) : [],
    }), [dia, usuario?.id]);

  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  if (datos.suspension) return <Mensaje icono="⚠️" texto={`Hoy la atención está suspendida: ${datos.suspension.motivo}.`} />;
  if (datos.bloques.length === 0) return <Mensaje icono="🗓️" texto={dia ? 'No tienes bloques programados hoy.' : 'Hoy es fin de semana: no hay sesiones.'} />;
  const siguiente = datos.bloques.find((b) => !b.cerrado);
  if (!siguiente) return <Mensaje icono="✅" texto={`Cerraste los ${datos.bloques.length} bloques de hoy. ¡Buen trabajo!`} />;
  return <PanelAsistencia key={siguiente.id} bloqueId={siguiente.id} navigation={navigation} />;
}

function Mensaje({ icono, texto }) {
  return (
    <View style={estilos.caja}>
      <Texto style={{ fontSize: 40 }}>{icono}</Texto>
      <Texto style={estilos.texto}>{texto}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { flex: 1, backgroundColor: colores.fondo, alignItems: 'center', justifyContent: 'center', padding: 30 },
  texto: { marginTop: 12, textAlign: 'center', color: colores.textoSuave, fontSize: 14 },
});

import PanelAsistencia from '../components/PanelAsistencia';

// Asistencia de un bloque concreto (parámetro: bloqueId)
export default function AsistenciaBloqueScreen({ navigation, route }) {
  return <PanelAsistencia bloqueId={route.params?.bloqueId} navigation={navigation} />;
}

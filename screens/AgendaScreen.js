import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Texto from '../components/Texto';
import Chip from '../components/Chip';
import Insignia from '../components/Insignia';
import Estado from '../components/Estado';
import { colores, tarjeta } from '../tema';
import { useSesion } from '../sesion';
import { useConsulta } from '../hooks';
import AvisoSuspension from '../components/AvisoSuspension';
import { obtenerBloquesConEstado, obtenerSuspensionDeFecha } from '../datos';
import { diaDeHoy, diaLaboralDeHoy, lunesDe, aISO, hoyISO, horaActual, estadoBloque, fechaLarga, NOMBRES_DIA } from '../utiles';

const FILTROS = ['Todas', 'Pendientes', 'Finalizadas'];

// Agenda diaria del profesional: navega entre los días de la semana y filtra por estado
export default function AgendaScreen({ navigation }) {
  const { usuario } = useSesion();
  const [dia, setDia] = useState(diaDeHoy());
  const [filtro, setFiltro] = useState('Todas');
  const fechaDia = new Date(lunesDe()); fechaDia.setDate(fechaDia.getDate() + dia - 1);
  const fecha = aISO(fechaDia);
  const esHoy = fecha === hoyISO();
  const { datos, cargando, error, recargar } = useConsulta(async (db) => ({
    suspension: await obtenerSuspensionDeFecha(db, fecha),
    bloques: await obtenerBloquesConEstado(db, dia, fecha, usuario.id),
  }), [dia, fecha, usuario?.id]);

  const suspension = datos?.suspension;
  const bloques = suspension ? [] : datos?.bloques ?? []; // un día suspendido no tiene sesiones
  const ahora = horaActual();
  const finalizadas = bloques.filter((b) => b.cerrado).length;
  const lista = bloques.filter((b) => filtro === 'Todas' || (filtro === 'Finalizadas' ? b.cerrado : !b.cerrado));
  const totalNinos = bloques.reduce((t, b) => t + b.cupo, 0);

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={estilos.diaFila}>
        <TouchableOpacity style={[estilos.flecha, dia <= 1 && { opacity: 0.4 }]} disabled={dia <= 1} onPress={() => setDia(dia - 1)}><Feather name="chevron-left" size={18} color={colores.texto} /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Texto style={estilos.dia}>{fechaLarga(fechaDia)}</Texto>
          <Texto style={estilos.diaSub}>{bloques.length} sesiones · {totalNinos} niños</Texto>
        </View>
        <TouchableOpacity style={[estilos.flecha, dia >= 5 && { opacity: 0.4 }]} disabled={dia >= 5} onPress={() => setDia(dia + 1)}><Feather name="chevron-right" size={18} color={colores.texto} /></TouchableOpacity>
      </View>

      <View style={estilos.perfil}>
        <View style={{ flex: 1 }}>
          <Texto style={estilos.perfilNombre}>{usuario?.nombre}</Texto>
          <Texto style={estilos.perfilSub}>{usuario?.especialidad}</Texto>
        </View>
        {esHoy && diaLaboralDeHoy() ? <Insignia texto="En jornada" /> : null}
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        {FILTROS.map((f) => {
          const n = f === 'Todas' ? bloques.length : f === 'Finalizadas' ? finalizadas : bloques.length - finalizadas;
          return <Chip key={f} texto={`${f} (${n})`} activo={filtro === f} onPress={() => setFiltro(f)} />;
        })}
      </View>

      <Estado cargando={cargando && !datos} error={error} recargar={recargar} />
      <AvisoSuspension suspension={suspension} />
      {datos && !suspension && lista.length === 0 ? <Texto style={estilos.vacio}>{bloques.length ? 'No hay bloques con este filtro.' : 'No tienes bloques este día.'}</Texto> : null}
      {lista.map((b) => {
        const est = estadoBloque(b, esHoy, ahora);
        const ahoraMismo = est.texto === 'Ahora';
        return (
          <TouchableOpacity key={b.id} activeOpacity={0.85} style={[estilos.bloque, ahoraMismo && estilos.bloqueAhora]}
            onPress={() => navigation.navigate(esHoy ? 'AsistenciaBloque' : 'DetalleBloque', { bloqueId: b.id })}>
            <View style={estilos.hora}>
              <Texto style={estilos.horaTexto}>{b.hora_inicio}</Texto>
              <Texto style={estilos.horaMin}>60 min</Texto>
            </View>
            <View style={[estilos.barra, { backgroundColor: b.cerrado ? colores.turquesa : ahoraMismo ? colores.azul : '#C9D5E3' }]} />
            <View style={{ flex: 1 }}>
              <Texto style={estilos.sala}>{b.sala_nombre}</Texto>
              <Texto style={estilos.actividad}>{b.actividad}</Texto>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Feather name="users" size={12} color={colores.textoSuave} />
                <Texto style={estilos.ninos}>{b.cupo} {b.cupo === 1 ? 'niño' : 'niños'}</Texto>
              </View>
            </View>
            {b.cerrado ? <Feather name="check" size={18} color={colores.turquesa} /> : ahoraMismo ? <Insignia texto="Ahora" tipo="azul" /> : <Feather name="chevron-right" size={18} color={colores.textoSuave} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  diaFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  flecha: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, alignItems: 'center', justifyContent: 'center' },
  dia: { fontSize: 15, fontWeight: '800', color: colores.marino },
  diaSub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  perfil: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 14 },
  perfilNombre: { fontSize: 14, fontWeight: '700', color: colores.marino },
  perfilSub: { fontSize: 11, color: colores.textoSuave },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 30 },
  bloque: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10 },
  bloqueAhora: { borderColor: colores.azul, borderWidth: 1.5 },
  hora: { width: 58 },
  horaTexto: { fontSize: 14, fontWeight: '800', color: colores.marino },
  horaMin: { fontSize: 10, color: colores.textoSuave },
  barra: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginHorizontal: 10 },
  sala: { fontSize: 10, fontWeight: '700', color: colores.azul },
  actividad: { fontSize: 14, fontWeight: '700', color: colores.marino, marginTop: 2 },
  ninos: { fontSize: 11, color: colores.textoSuave, marginLeft: 5 },
});

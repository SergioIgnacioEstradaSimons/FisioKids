import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBase } from '../supabase';
import Texto from '../components/Texto';
import Estado from '../components/Estado';
import { colores, tarjeta } from '../tema';
import { useSesion, notificarAvisos } from '../sesion';
import { useConsulta } from '../hooks';
import { obtenerAvisos, obtenerClavesLeidas, marcarAvisoLeido, marcarAvisosLeidos } from '../datos';
import { hoyISO, horaActual } from '../utiles';

const TINTES = {
  azul: [colores.azulClaro, colores.azul], verde: [colores.verdeClaro, colores.exito],
  naranja: [colores.naranjaClaro, colores.alerta], morado: [colores.moradoClaro, colores.morado],
  rojo: [colores.rojoClaro, colores.error],
};

// Avisos del centro, calculados con los datos reales: bloques pasados (sin asistencia, sin cerrar o finalizados),
// suspensiones próximas y eventos persistentes (perfil, contraseña y asignaciones). El profesional ve solo lo suyo.
export default function NotificacionesScreen({ navigation }) {
  const db = useBase();
  const { usuario } = useSesion();
  const [pestana, setPestana] = useState('todas');
  const { datos, cargando, error, recargar } = useConsulta(async (d) => ({
    avisos: await obtenerAvisos(d, usuario, hoyISO(), horaActual()),
    leidas: await obtenerClavesLeidas(d, usuario.id),
  }), [usuario?.id]);

  // se actualiza sola cada 30 segundos mientras la pantalla está abierta
  useEffect(() => { const t = setInterval(recargar, 30000); return () => clearInterval(t); }, [recargar]);

  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  const { avisos, leidas } = datos;
  const visibles = avisos.filter((a) => pestana === 'todas' || !leidas.has(a.clave));

  const abrir = async (a) => {
    await marcarAvisoLeido(db, usuario.id, a.clave);
    notificarAvisos();
    recargar();
    if (a.bloqueId) navigation.navigate(usuario.rol === 'admin' ? 'SesionesHoy' : 'AsistenciaBloque', { bloqueId: a.bloqueId });
  };
  const marcarTodas = async () => {
    await marcarAvisosLeidos(db, usuario.id, avisos.map((a) => a.clave));
    notificarAvisos();
    recargar();
  };

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16 }}>
      <View style={estilos.cabecera}>
        <View style={estilos.pestanas}>
          {[['todas', 'Todas'], ['noleidas', 'No leídas']].map(([k, t]) => (
            <TouchableOpacity key={k} style={[estilos.pestana, pestana === k && estilos.pestanaActiva]} onPress={() => setPestana(k)}>
              <Texto style={[estilos.pestanaTexto, pestana === k && { color: colores.marino }]}>{t}</Texto>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={marcarTodas}><Texto style={estilos.marcar}>Marcar leídas</Texto></TouchableOpacity>
      </View>

      {['Hoy', 'Próximos días'].map((g) => {
        const items = visibles.filter((n) => n.grupo === g);
        if (items.length === 0) return null;
        return (
          <View key={g}>
            <Texto style={estilos.grupo}>{g.toUpperCase()}</Texto>
            <View style={estilos.bloque}>
              {items.map((n, i) => {
                const [fondo, color] = TINTES[n.tinte];
                const leida = leidas.has(n.clave);
                return (
                  <TouchableOpacity key={n.clave} activeOpacity={0.8} style={[estilos.item, i > 0 && estilos.separador]} onPress={() => abrir(n)}>
                    <View style={[estilos.icono, { backgroundColor: fondo }]}><Feather name={n.icono} size={17} color={color} /></View>
                    <View style={{ flex: 1 }}>
                      <Texto style={estilos.titulo}>{n.titulo}</Texto>
                      <Texto style={estilos.texto}>{n.texto}</Texto>
                      <Texto style={estilos.hace}>{n.hace}</Texto>
                    </View>
                    {!leida ? <View style={estilos.punto} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
      {visibles.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Feather name="bell-off" size={30} color={colores.textoSuave} />
          <Texto style={estilos.vacio}>{pestana === 'todas' ? 'Todavía no hay avisos. Aparecerán al pasar el horario de un bloque, al programar una suspensión o al registrar cambios de asignaciones y perfil.' : 'No tienes avisos sin leer.'}</Texto>
        </View>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pestanas: { flexDirection: 'row', backgroundColor: '#E6EDF5', borderRadius: 12, padding: 3 },
  pestana: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10 },
  pestanaActiva: { backgroundColor: '#fff' },
  pestanaTexto: { fontSize: 12, fontWeight: '700', color: colores.textoSuave },
  marcar: { fontSize: 12, fontWeight: '700', color: colores.azul },
  grupo: { fontSize: 10, fontWeight: '700', color: colores.textoSuave, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  bloque: { ...tarjeta, paddingHorizontal: 12, marginBottom: 14 },
  item: { flexDirection: 'row', paddingVertical: 12 },
  separador: { borderTopWidth: 1, borderTopColor: colores.borde },
  icono: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  titulo: { fontSize: 13, fontWeight: '700', color: colores.marino },
  texto: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  hace: { fontSize: 10, color: '#9AA9BC', marginTop: 4 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.azul, marginTop: 4 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 12, paddingHorizontal: 20 },
});

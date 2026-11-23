import { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Texto, { familiaDe } from '../components/Texto';
import Pasos from '../components/Pasos';
import Selector, { SelectorModal } from '../components/Selector';
import Boton from '../components/Boton';
import { iniciales } from '../components/TarjetaNino';
import { colores, tarjeta } from '../tema';
import Estado from '../components/Estado';
import { useConsulta } from '../hooks';
import { obtenerNinos, obtenerHorariosPorNino } from '../datos';
import { MESES, mayuscula } from '../utiles';

const DIAS_CORTOS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

// Texto tipo «Lun y Mié · 09:00» a partir de los horarios del niño (SQLite)
function resumenHorario(horarios, ninoId) {
  const propios = horarios.filter((h) => h.nino_id === ninoId);
  if (propios.length === 0) return 'Sin horario asignado';
  const dias = [...new Set(propios.map((h) => DIAS_CORTOS[h.dia_semana]))].join(' y ');
  return `${dias} · ${propios[0].hora_inicio}`;
}

// Paso 2 de 3: elegir mes/año y los niños incluidos en la programación
export default function ConfigurarMesScreen(props) {
  const { datos, cargando, error, recargar } = useConsulta(async (db) => ({ ninos: await obtenerNinos(db), horarios: await obtenerHorariosPorNino(db) }));
  if (!datos) return <Estado cargando={cargando} error={error} recargar={recargar} />;
  return <Configurar {...props} ninos={datos.ninos} horarios={datos.horarios} />;
}

function Configurar({ navigation, route, ninos, horarios }) {
  const insets = useSafeAreaInsets();
  const hoy = new Date();
  const proximo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const copiar = route.params?.origen === 'copiar';

  const [mes, setMes] = useState(proximo.getMonth());
  const [anio, setAnio] = useState(proximo.getFullYear());
  const [incluidos, setIncluidos] = useState(copiar ? ninos.filter((n) => n.activo).map((n) => n.id) : []);
  const [texto, setTexto] = useState('');
  const [agregando, setAgregando] = useState(false);

  const lista = incluidos.map((id) => ninos.find((n) => n.id === id))
    .filter((n) => n.nombre.toLowerCase().includes(texto.trim().toLowerCase()));
  const disponibles = ninos.filter((n) => n.activo && !incluidos.includes(n.id));

  const quitar = (n) => Alert.alert('Quitar niño', `¿Quitar a ${n.nombre} de esta programación?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Quitar', style: 'destructive', onPress: () => setIncluidos(incluidos.filter((id) => id !== n.id)) },
  ]);

  const revisar = () => {
    if (incluidos.length === 0) return Alert.alert('Sin niños', 'Agrega al menos un niño para revisar la programación.');
    navigation.navigate('RevisionMes', { mes: mayuscula(MESES[mes]), anio, cantidad: incluidos.length });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Pasos actual={2} />

        <View style={estilos.plantilla}>
          <Feather name="layers" size={18} color={colores.azul} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Texto style={estilos.plantillaEtiqueta}>PLANTILLA</Texto>
            <Texto style={estilos.plantillaTexto}>{copiar ? `Copiando programación de ${(route.params?.desde ?? 'el mes anterior').toLowerCase()}` : 'Programación desde cero'}</Texto>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}><Texto style={estilos.cambiar}>Cambiar</Texto></TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Selector estiloContenedor={{ flex: 1 }} etiqueta="Mes" valor={mes} onChange={setMes} opciones={MESES.map((m, i) => ({ valor: i, etiqueta: mayuscula(m) }))} />
          <Selector estiloContenedor={{ flex: 1 }} etiqueta="Año" valor={anio} onChange={setAnio} opciones={[hoy.getFullYear(), hoy.getFullYear() + 1].map((a) => ({ valor: a, etiqueta: String(a) }))} />
        </View>

        <View style={estilos.tituloFila}>
          <Texto style={estilos.titulo}>Niños incluidos ({incluidos.length})</Texto>
          <TouchableOpacity onPress={() => setAgregando(true)}><Texto style={estilos.cambiar}>+ Agregar</Texto></TouchableOpacity>
        </View>
        <View style={estilos.buscador}>
          <Feather name="search" size={16} color={colores.textoSuave} />
          <TextInput style={estilos.input} placeholder="Buscar…" placeholderTextColor="#9AA9BC" value={texto} onChangeText={setTexto} />
        </View>

        {lista.length === 0 ? <Texto style={estilos.vacio}>No hay niños incluidos todavía.</Texto> : null}
        {lista.map((n) => (
          <View key={n.id} style={estilos.fila}>
            <View style={estilos.avatar}><Texto style={estilos.iniciales}>{iniciales(n.nombre)}</Texto></View>
            <View style={{ flex: 1 }}>
              <Texto style={estilos.nombre}>{n.nombre}</Texto>
              <Texto style={estilos.sub}>{resumenHorario(horarios, n.id)}</Texto>
            </View>
            <TouchableOpacity style={[estilos.accion, { backgroundColor: colores.azulClaro }]} onPress={() => navigation.navigate('FormularioNino', { ninoId: n.id })}>
              <Feather name="edit-2" size={15} color={colores.azul} />
            </TouchableOpacity>
            <TouchableOpacity style={[estilos.accion, { backgroundColor: colores.rojoClaro }]} onPress={() => quitar(n)}>
              <Feather name="x" size={16} color={colores.error} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton texto="Guardar borrador" variante="secundario" style={{ flex: 1, marginBottom: 0 }}
          onPress={() => Alert.alert('Borrador', 'La programación mensual completa se genera en la versión final; por ahora se revisa y valida.')} />
        <Boton texto="Revisar" icono="arrow-right" style={{ flex: 1, marginBottom: 0 }} onPress={revisar} />
      </View>

      <SelectorModal visible={agregando} titulo="Agregar niño" opciones={disponibles.map((n) => ({ valor: n.id, etiqueta: n.nombre }))}
        onElegir={(id) => setIncluidos([...incluidos, id])} onCerrar={() => setAgregando(false)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  plantilla: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.azulClaro, borderRadius: 14, padding: 14, marginBottom: 16 },
  plantillaEtiqueta: { fontSize: 9, fontWeight: '700', color: colores.textoSuave, letterSpacing: 1 },
  plantillaTexto: { fontSize: 12, fontWeight: '700', color: colores.marino },
  cambiar: { fontSize: 12, fontWeight: '700', color: colores.azul },
  tituloFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 10 },
  titulo: { fontSize: 15, fontWeight: '700', color: colores.marino },
  buscador: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12 },
  input: { flex: 1, paddingVertical: 11, paddingLeft: 10, fontSize: 13, color: colores.texto, fontFamily: familiaDe(400) },
  vacio: { textAlign: 'center', color: colores.textoSuave, paddingVertical: 20 },
  fila: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 8 },
  avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  iniciales: { fontSize: 12, fontWeight: '700', color: colores.azul },
  nombre: { fontSize: 13, fontWeight: '700', color: colores.marino },
  sub: { fontSize: 11, color: colores.textoSuave },
  accion: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colores.borde },
});

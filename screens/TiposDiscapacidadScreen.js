import { useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBase } from '../supabase';
import Texto from '../components/Texto';
import Insignia from '../components/Insignia';
import Estado from '../components/Estado';
import Fab from '../components/Fab';
import ModalTexto from '../components/ModalTexto';
import { colores, tarjeta } from '../tema';
import { useConsulta } from '../hooks';
import { obtenerTipos, agregarTipo, renombrarTipo, tipoExiste, cambiarEstadoTipo, eliminarTipo } from '../datos';
import { limpiar } from '../utiles';

// Tipos de discapacidad: el administrador puede agregar nuevos, renombrarlos, desactivarlos o borrar los que no se usan.
export default function TiposDiscapacidadScreen() {
  const db = useBase();
  const { datos, cargando, error, recargar } = useConsulta((d) => obtenerTipos(d, false));
  const [modal, setModal] = useState(null); // null | { tipo } (tipo = null para uno nuevo)

  const guardar = async (texto) => {
    const nombre = limpiar(texto);
    if (nombre.length < 3) return 'Escribe al menos 3 caracteres';
    if (await tipoExiste(db, nombre, modal?.tipo?.id ?? 0)) return 'Ese tipo ya existe';
    if (modal?.tipo) await renombrarTipo(db, modal.tipo.id, nombre); // UPDATE tipos_discapacidad y niños que lo usan
    else await agregarTipo(db, nombre);                               // INSERT INTO tipos_discapacidad
    recargar();
    return null;
  };

  const alternar = async (t) => { await cambiarEstadoTipo(db, t.id, t.activo ? 0 : 1); recargar(); };
  const borrar = (t) => {
    if (t.usados > 0) return Alert.alert('No se puede eliminar', `${t.usados} niño(s) tienen este tipo. Puedes desactivarlo para que no se ofrezca a nuevos niños.`);
    Alert.alert('Eliminar tipo', `¿Eliminar «${t.nombre}»?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await eliminarTipo(db, t.id); recargar(); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo, padding: 16 }}>
      <Texto style={estilos.explicacion}>Estos son los tipos que aparecen al registrar un niño. Los inactivos no se ofrecen a niños nuevos, pero se conservan en los que ya los tienen.</Texto>
      <FlatList data={datos ?? []} keyExtractor={(t) => String(t.id)} contentContainerStyle={{ paddingBottom: 90 }}
        ListEmptyComponent={<Estado cargando={cargando} error={error} recargar={recargar} />}
        renderItem={({ item }) => (
          <View style={[estilos.fila, !item.activo && { opacity: 0.7 }]}>
            <View style={estilos.icono}><Feather name="heart" size={17} color={colores.morado} /></View>
            <View style={{ flex: 1 }}>
              <Texto style={estilos.nombre}>{item.nombre}</Texto>
              <Texto style={estilos.sub}>{item.usados} {item.usados === 1 ? 'niño' : 'niños'}</Texto>
            </View>
            <TouchableOpacity onPress={() => alternar(item)}><Insignia texto={item.activo ? 'Activo' : 'Inactivo'} tipo={item.activo ? 'verde' : 'gris'} /></TouchableOpacity>
            <TouchableOpacity style={estilos.accion} onPress={() => setModal({ tipo: item })}><Feather name="edit-2" size={15} color={colores.azul} /></TouchableOpacity>
            <TouchableOpacity style={[estilos.accion, { backgroundColor: colores.rojoClaro }]} onPress={() => borrar(item)}><Feather name="trash-2" size={15} color={colores.error} /></TouchableOpacity>
          </View>
        )} />
      <Fab texto="Agregar tipo" onPress={() => setModal({ tipo: null })} />
      <ModalTexto visible={!!modal} titulo={modal?.tipo ? 'Editar tipo' : 'Nuevo tipo de discapacidad'} etiqueta="Nombre del tipo" placeholder="Ej. Discapacidad visual"
        valorInicial={modal?.tipo?.nombre ?? ''} textoBoton={modal?.tipo ? 'Guardar' : 'Agregar'} onGuardar={guardar} onCerrar={() => setModal(null)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  explicacion: { fontSize: 12, color: colores.textoSuave, marginBottom: 14 },
  fila: { ...tarjeta, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  icono: { width: 40, height: 40, borderRadius: 12, backgroundColor: colores.moradoClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  nombre: { fontSize: 14, fontWeight: '700', color: colores.marino },
  sub: { fontSize: 11, color: colores.textoSuave, marginTop: 2 },
  accion: { width: 32, height: 32, borderRadius: 10, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});

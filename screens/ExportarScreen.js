import { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { openDatabaseAsync } from 'expo-sqlite';
import { Feather } from '@expo/vector-icons';
import Boton from '../components/Boton';
import Texto from '../components/Texto';
import { colores } from '../tema';
import { NOMBRE_BASE } from '../datos';

const TABLAS = [
  'usuarios',
  'ninos',
  'salas',
  'bloques',
  'asignaciones',
  'asistencias',
  'cierres_bloque',
  'tipos_discapacidad',
  'avisos_leidos',
  'suspensiones',
];

export default function ExportarScreen() {
  const [estado, setEstado] = useState('');
  const [conteos, setConteos] = useState(null);
  const [ruta, setRuta] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const exportar = async () => {
    setOcupado(true);
    setEstado('Leyendo la base local…');
    setConteos(null);
    setRuta('');
    let base;
    try {
      base = await openDatabaseAsync(NOMBRE_BASE);
      const tablas = {};
      const nuevosConteos = {};
      for (const nombre of TABLAS) {
        const filas = await base.getAllAsync(`SELECT * FROM ${nombre}`);
        tablas[nombre] = filas;
        nuevosConteos[nombre] = filas.length;
      }
      const contenido = JSON.stringify({
        version: 1,
        exportadoEn: new Date().toISOString(),
        tablas,
      });
      const archivo = new File(Paths.cache, 'fisiokids-export.json');
      archivo.create({ overwrite: true });
      await archivo.write(contenido);
      setConteos(nuevosConteos);
      setRuta(archivo.uri);
      setEstado('Archivo listo. Compártelo y guárdalo en la PC.');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(archivo.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar datos de FisioKids',
        });
      }
    } catch (error) {
      setEstado(`No se pudo exportar: ${error?.message ?? String(error)}`);
    } finally {
      if (base) await base.closeAsync();
      setOcupado(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <View style={estilos.icono}><Feather name="download" size={30} color={colores.azul} /></View>
      <Texto style={estilos.titulo}>Exportar datos locales</Texto>
      <Texto style={estilos.texto}>
        Usa esta pantalla antes de migrar. Genera un JSON con las 10 tablas de SQLite y lo comparte para importarlo a Supabase.
      </Texto>
      <Boton texto={ocupado ? 'Exportando…' : 'Exportar y compartir'} icono="share-2" onPress={exportar} deshabilitado={ocupado} />
      {ocupado ? <ActivityIndicator color={colores.azul} style={estilos.cargando} /> : null}
      {estado ? <Texto style={estilos.estado}>{estado}</Texto> : null}
      {conteos ? (
        <View style={estilos.lista}>
          {TABLAS.map((nombre) => (
            <View style={estilos.fila} key={nombre}>
              <Texto style={estilos.nombre}>{nombre}</Texto>
              <Texto style={estilos.cantidad}>{conteos[nombre]}</Texto>
            </View>
          ))}
        </View>
      ) : null}
      {ruta ? <Texto style={estilos.ruta}>{ruta}</Texto> : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 20, backgroundColor: colores.fondo, flexGrow: 1 },
  icono: { alignSelf: 'center', width: 64, height: 64, borderRadius: 20, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  titulo: { fontSize: 22, fontWeight: '800', color: colores.marino, textAlign: 'center', marginBottom: 10 },
  texto: { fontSize: 14, color: colores.textoSuave, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  cargando: { marginVertical: 8 },
  estado: { fontSize: 13, color: colores.texto, marginVertical: 10, textAlign: 'center' },
  lista: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginTop: 10 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  nombre: { fontSize: 13, color: colores.texto },
  cantidad: { fontSize: 13, fontWeight: '700', color: colores.azul },
  ruta: { fontSize: 10, color: colores.textoSuave, marginTop: 12 },
});

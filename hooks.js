import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { obtenerAvisos, obtenerClavesLeidas } from './datos';
import { hoyISO, horaActual } from './utiles';
import { alCambiarAvisos } from './sesion';

// Ejecuta una consulta a SQLite cada vez que la pantalla se muestra (así se refresca después de
// agregar, modificar o eliminar y volver atrás). Devuelve { datos, cargando, error, recargar }.
export function useConsulta(consulta, deps = [], inicial = null) {
  const db = useSQLiteContext();
  const [datos, setDatos] = useState(inicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    try {
      setError(null);
      setDatos(await consulta(db));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [db, ...deps]);

  useFocusEffect(useCallback(() => { recargar(); }, [recargar]));
  return { datos, cargando, error, recargar };
}

// Cantidad de avisos sin leer del usuario (se actualiza cada 30 s y cuando se leen avisos)
export function useAvisosSinLeer(usuario) {
  const db = useSQLiteContext();
  const [cantidad, setCantidad] = useState(0);
  const id = usuario?.id;
  const rol = usuario?.rol;

  const recalcular = useCallback(async () => {
    if (!id) return setCantidad(0);
    try {
      const avisos = await obtenerAvisos(db, { id, rol }, hoyISO(), horaActual());
      const leidas = await obtenerClavesLeidas(db, id);
      setCantidad(avisos.filter((a) => !leidas.has(a.clave)).length);
    } catch (e) {
      // un fallo al contar avisos no debe romper la pantalla
    }
  }, [db, id, rol]);

  useEffect(() => {
    recalcular();
    const temporizador = setInterval(recalcular, 30000);
    const salir = alCambiarAvisos(recalcular);
    return () => { clearInterval(temporizador); salir(); };
  }, [recalcular]);
  return cantidad;
}

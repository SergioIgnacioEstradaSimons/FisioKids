import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';

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

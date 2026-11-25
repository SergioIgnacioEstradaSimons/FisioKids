// api.js — llamadas fetch a la API pública (solo GET, sin clave).
// API elegida: Nager.Date (feriados). Dirección: https://date.nager.at/api/v3/PublicHolidays/{año}/{país}
// Ejemplo: https://date.nager.at/api/v3/PublicHolidays/2026/BO

const URL_BASE = 'https://date.nager.at/api/v3';
const TIEMPO_MAXIMO = 10000; // 10 segundos

// Error con un mensaje claro para el usuario y un tipo: 'red' | 'tiempo' | 'http' | 'formato'
export class ErrorApi extends Error {
  constructor(mensaje, tipo) {
    super(mensaje);
    this.tipo = tipo;
  }
}

// Trae los feriados de un país y año. Devuelve solo lo que la app necesita: { fecha, nombre, global }.
export async function obtenerFeriados(anio = new Date().getFullYear(), pais = 'BO', { signal } = {}) {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO);
  if (signal) signal.addEventListener('abort', () => control.abort());

  try {
    const respuesta = await fetch(`${URL_BASE}/PublicHolidays/${anio}/${pais}`, {
      signal: control.signal,
      headers: { Accept: 'application/json' },
    });
    if (!respuesta.ok) throw new ErrorApi(`El servicio respondió con un error (${respuesta.status}).`, 'http');
    const datos = await respuesta.json();
    if (!Array.isArray(datos)) throw new ErrorApi('El servicio devolvió una respuesta inesperada.', 'formato');
    // Transformar la respuesta: quedarse solo con lo necesario y ordenar por fecha
    return datos
      .map((f) => ({ fecha: f.date, nombre: f.localName || f.name, global: f.global !== false }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  } catch (e) {
    if (e instanceof ErrorApi) throw e;
    if (e.name === 'AbortError') throw new ErrorApi('La consulta tardó demasiado. Revisa tu conexión a internet.', 'tiempo');
    throw new ErrorApi('No hay conexión a internet.', 'red'); // fetch falla sin red (por ejemplo en modo avión)
  } finally {
    clearTimeout(temporizador);
  }
}

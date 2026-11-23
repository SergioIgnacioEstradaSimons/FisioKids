// utiles.js — constantes y funciones de apoyo (fechas, textos). No tocan la base de datos.

export const TIPOS_DISCAPACIDAD = ['Parálisis cerebral', 'Síndrome de Down', 'TEA', 'Retraso motor', 'Hipotonía', 'Trastorno de coordinación', 'Otro'];
export const NOMBRES_DIA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
// Turnos del centro: mañana de 8:00 a 12:00 y tarde de 14:00 a 19:00 (bloques de 1 hora; se muestra la hora de inicio)
export const TURNOS = {
  Mañana: ['08:00', '09:00', '10:00', '11:00'],
  Tarde: ['14:00', '15:00', '16:00', '17:00', '18:00'],
};
export const HORAS = [...TURNOS.Mañana, ...TURNOS.Tarde];
export const turnoDe = (hora) => (Number(hora.slice(0, 2)) < 13 ? 'Mañana' : 'Tarde');
export const horaActual = () => {
  const f = new Date();
  return `${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`;
};

// Grado de discapacidad según las categorías del carnet de discapacidad
export const GRADOS = ['Leve', 'Moderado', 'Grave', 'Muy grave'];

// Día de hoy 1-5 (lunes a viernes) o null si es fin de semana
export function diaLaboralDeHoy() {
  const d = new Date().getDay();
  return d >= 1 && d <= 5 ? d : null;
}

// Quita espacios de más: "  ana   maría " -> "ana maría"
export const limpiar = (t) => t.trim().replace(/\s+/g, ' ');

// Día de hoy como número 1-5 (si es fin de semana se usa el lunes)
export function diaDeHoy() {
  const d = new Date().getDay();
  return d >= 1 && d <= 5 ? d : 1;
}

export function calcularEdad(fecha) {
  const hoy = new Date();
  const n = new Date(fecha);
  let edad = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) edad--;
  return edad;
}

export const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export function fechaLarga(f = new Date()) {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return `${mayuscula(dias[f.getDay()])}, ${f.getDate()} de ${MESES[f.getMonth()]}`;
}

export function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

// "2019-03-14" -> "14/03/2019"  y al revés
export const isoADmy = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
export const dmyAIso = (dmy) => dmy.split('/').reverse().join('-');

// Fecha local -> "AAAA-MM-DD" (sin usar UTC, para que no cambie de día)
export function aISO(f = new Date()) {
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const d = String(f.getDate()).padStart(2, '0');
  return `${f.getFullYear()}-${m}-${d}`;
}
export const hoyISO = () => aISO(new Date());

// Primer y último día de un mes (mesIdx 0-11) en formato AAAA-MM-DD
export function rangoMes(anio, mesIdx) {
  return [aISO(new Date(anio, mesIdx, 1)), aISO(new Date(anio, mesIdx + 1, 0))];
}

export const sumarHora = (hora, horas = 1) => `${String(Number(hora.slice(0, 2)) + horas).padStart(2, '0')}:00`;

// Estado de un bloque para mostrar en la agenda. cerrado: 1 si ya se confirmó su asistencia.
// esHoy: solo hoy se puede estar «Ahora» o «Por cerrar».
export function estadoBloque(b, esHoy, ahora = horaActual()) {
  if (b.cerrado) return { texto: 'Finalizada', tipo: 'verde' };
  if (!esHoy) return { texto: 'Pendiente', tipo: 'gris' };
  if (b.hora_inicio <= ahora && b.hora_fin > ahora) return { texto: 'Ahora', tipo: 'azul' };
  if (b.hora_fin <= ahora) return { texto: 'Por cerrar', tipo: 'naranja' };
  return { texto: 'Próxima', tipo: 'gris' };
}

// Lunes de la semana de una fecha
export function lunesDe(f = new Date()) {
  const l = new Date(f);
  l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
  l.setHours(0, 0, 0, 0);
  return l;
}

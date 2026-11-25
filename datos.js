import { clienteTemporal } from './supabase';
import { rangoMes, diaSemanaDe, sumarDiasISO, formatoHace } from './utiles';

export const NOMBRE_BASE = 'fisiokids.db';

async function revisar(consulta) {
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return data;
}

async function todos(consulta) {
  return (await revisar(consulta)) ?? [];
}

async function uno(consulta) {
  return await revisar(consulta);
}

async function escribir(consulta) {
  return await revisar(consulta);
}

async function rpc(db, funcion, parametros = {}) {
  return await revisar(db.rpc(funcion, parametros));
}

async function rpcFilas(db, funcion, parametros = {}) {
  const data = await rpc(db, funcion, parametros);
  return Array.isArray(data) ? data : data ? [data] : [];
}

async function rpcUno(db, funcion, parametros = {}) {
  const filas = await rpcFilas(db, funcion, parametros);
  return filas[0] ?? null;
}

export async function obtenerProfesionales(db, dia) {
  return rpcFilas(db, 'fn_profesionales', { p_dia: dia });
}

export const obtenerUsuario = (db, id) => uno(db.from('v_usuarios').select('*').eq('id', id).maybeSingle());

export async function correoExiste(db, correo, excluirId = 0) {
  const filas = await todos(db.from('v_usuarios').select('id').ilike('correo', correo.trim()).neq('id', excluirId));
  return filas.length > 0;
}

export async function usuarioConNombreExiste(db, nombres, apellidos, excluirId = 0) {
  const filas = await todos(db.from('v_usuarios').select('id')
    .ilike('nombres', nombres.trim()).ilike('apellidos', apellidos.trim()).neq('id', excluirId));
  return filas.length > 0;
}

export async function agregarProfesional(db, p) {
  if (!p.contrasena) throw new Error('La contraseña es obligatoria.');
  const temporal = clienteTemporal();
  const { data: cuenta, error: errorAuth } = await temporal.auth.signUp({
    email: p.correo.trim().toLowerCase(),
    password: p.contrasena,
    options: { data: { nombres: p.nombres.trim(), apellidos: p.apellidos.trim() } },
  });
  if (errorAuth) throw new Error(errorAuth.message);
  return escribir(db.from('usuarios').insert({
    auth_id: cuenta.user?.id ?? null,
    nombres: p.nombres.trim(),
    apellidos: p.apellidos.trim(),
    correo: p.correo.trim().toLowerCase(),
    rol: 'profesional',
    especialidad: p.especialidad,
    activo: p.activo ?? 1,
    foto: p.foto ?? null,
  }));
}

export async function modificarProfesional(db, id, p) {
  return escribir(db.from('usuarios').update({
    nombres: p.nombres.trim(),
    apellidos: p.apellidos.trim(),
    correo: p.correo.trim().toLowerCase(),
    especialidad: p.especialidad,
    activo: p.activo,
    foto: p.foto ?? null,
  }).eq('id', id));
}

export const modificarFoto = (db, id, foto) => escribir(db.from('usuarios').update({ foto: foto ?? null }).eq('id', id));

export async function modificarPerfil(db, id, { nombres, apellidos, contrasena }) {
  if (contrasena) await db.auth.updateUser({ password: contrasena });
  return escribir(db.from('usuarios').update({ nombres: nombres.trim(), apellidos: apellidos.trim() }).eq('id', id));
}

export async function contrasenaCorrecta(db, id, contrasena) {
  const { data: { user } } = await db.auth.getUser();
  if (!user?.email) return false;
  const { error } = await db.auth.signInWithPassword({ email: user.email, password: contrasena });
  return !error;
}

export async function registrarEventoParaAdmins(db, { actor, tipo, titulo, texto, icono, tono, bloqueId = null }) {
  if (!actor || actor.rol !== 'profesional') return;
  try {
    const admins = await todos(db.from('v_usuarios').select('id').eq('rol', 'admin').eq('activo', 1));
    if (admins.length === 0) return;
    await escribir(db.from('eventos').insert(admins.map((admin) => ({
      tipo,
      titulo,
      texto,
      grupo: 'Hoy',
      icono,
      tono,
      usuario_id: admin.id,
      actor_id: actor.id,
      bloque_id: bloqueId,
    }))));
  } catch {
    return;
  }
}

export async function registrarEventoParaProfesional(db, { actor, profesionalId, bloqueId = null, tipo = 'asignacion', titulo, texto, icono = 'calendar', tono = 'azul' }) {
  if (!profesionalId) return;
  try {
    await escribir(db.from('eventos').insert({
      tipo,
      titulo,
      texto,
      grupo: 'Hoy',
      icono,
      tono,
      usuario_id: profesionalId,
      actor_id: actor?.id ?? null,
      bloque_id: bloqueId,
    }));
  } catch {
    return;
  }
}

export const obtenerSalas = (db) => todos(db.from('v_salas').select('*').order('activo', { ascending: false }).order('nombre'));
export const obtenerSala = (db, id) => uno(db.from('salas').select('*').eq('id', id).maybeSingle());

export async function salaExiste(db, nombre, excluirId = 0) {
  const filas = await todos(db.from('salas').select('id').ilike('nombre', nombre.trim()).neq('id', excluirId));
  return filas.length > 0;
}

export const agregarSala = (db, s) => escribir(db.from('salas').insert({ nombre: s.nombre.trim(), capacidad: s.capacidad }));
export const modificarSala = (db, id, s) => escribir(db.from('salas').update({ nombre: s.nombre.trim(), capacidad: s.capacidad, activo: s.activo }).eq('id', id));

export const obtenerNinos = (db) => todos(db.from('v_ninos').select('*').order('activo', { ascending: false }).order('apellidos').order('nombres'));
export const obtenerNino = (db, id) => uno(db.from('v_ninos').select('*').eq('id', id).maybeSingle());

export async function ninoExiste(db, nombres, apellidos, fechaNacimiento, excluirId = 0) {
  const filas = await todos(db.from('ninos').select('id')
    .ilike('nombres', nombres.trim()).ilike('apellidos', apellidos.trim())
    .eq('fecha_nacimiento', fechaNacimiento).neq('id', excluirId));
  return filas.length > 0;
}

export const agregarNino = (db, n) => escribir(db.from('ninos').insert({
  nombres: n.nombres.trim(),
  apellidos: n.apellidos.trim(),
  fecha_nacimiento: n.fecha_nacimiento,
  tipo_discapacidad: n.tipo_discapacidad,
  grado: n.grado,
  tutor_nombre: n.tutor_nombre.trim(),
  tutor_telefono: n.tutor_telefono.trim(),
  observaciones: n.observaciones.trim(),
}));

export const modificarNino = (db, id, n) => escribir(db.from('ninos').update({
  nombres: n.nombres.trim(),
  apellidos: n.apellidos.trim(),
  fecha_nacimiento: n.fecha_nacimiento,
  tipo_discapacidad: n.tipo_discapacidad,
  grado: n.grado,
  tutor_nombre: n.tutor_nombre.trim(),
  tutor_telefono: n.tutor_telefono.trim(),
  observaciones: n.observaciones.trim(),
}).eq('id', id));

export const cambiarEstadoNino = (db, id, activo) => escribir(db.from('ninos').update({ activo }).eq('id', id));
export const eliminarNino = (db, id) => escribir(db.from('ninos').delete().eq('id', id));

export async function obtenerBloques(db, dia = null, profesionalId = null) {
  let consulta = db.from('v_bloques').select('*');
  if (dia != null) consulta = consulta.eq('dia_semana', dia);
  if (profesionalId != null) consulta = consulta.eq('profesional_id', profesionalId);
  return todos(consulta.order('dia_semana').order('hora_inicio'));
}

export const obtenerBloque = (db, id) => uno(db.from('v_bloques').select('*').eq('id', id).maybeSingle());
export const actualizarBloque = (db, id, cambios) => escribir(db.from('bloques').update(cambios).eq('id', id));
export const obtenerBloquesEnHorario = (db, dia, hora) => todos(db.from('v_bloques').select('*').eq('dia_semana', dia).eq('hora_inicio', hora));
export const obtenerNinosDeBloque = (db, bloqueId) => todos(db.from('v_asignaciones_ninos').select('*').eq('bloque_id', bloqueId).order('apellidos').order('nombres'));
export const obtenerBloquesDeNino = (db, ninoId) => todos(db.from('v_bloques_de_nino').select('*').eq('nino_id', ninoId).order('dia_semana').order('hora_inicio'));
export const obtenerHorariosPorNino = (db) => todos(db.from('v_horarios_por_nino').select('*').order('dia_semana').order('hora_inicio'));

export async function crearAsignacion(db, { ninoIds, profesionalId, salaId, dias, hora, actividad }) {
  if (!ninoIds || ninoIds.length === 0) throw new Error('Selecciona al menos un niño.');
  if (!dias || dias.length === 0) throw new Error('Selecciona al menos un día.');
  await rpc(db, 'fn_crear_asignacion', {
    p_nino_ids: ninoIds,
    p_profesional_id: profesionalId,
    p_sala_id: salaId,
    p_dias: dias,
    p_hora: hora,
    p_actividad: actividad,
  });
}

export const obtenerAsistenciaDelBloque = (db, bloqueId, fecha) => todos(
  db.from('asistencias').select('nino_id, estado, actividades').eq('bloque_id', bloqueId).eq('fecha', fecha));

export const obtenerAsistenciaNino = (db, bloqueId, ninoId, fecha) => uno(
  db.from('asistencias').select('*').eq('bloque_id', bloqueId).eq('nino_id', ninoId).eq('fecha', fecha).maybeSingle());

export async function guardarAsistencia(db, bloqueId, fecha, registros) {
  await rpc(db, 'fn_guardar_asistencia', {
    p_bloque: bloqueId,
    p_fecha: fecha,
    p_registros: registros.map((r) => ({
      nino_id: r.ninoId,
      estado: r.estado,
      actividades: r.actividades?.trim() || null,
    })),
  });
}

export const obtenerHistorialNino = (db, ninoId) => todos(
  db.from('asistencias').select('fecha, estado, actividades').eq('nino_id', ninoId).order('fecha', { ascending: false }).limit(20));

export const obtenerHistorial = (db, limite = 60) => todos(
  db.from('v_historial').select('*').order('fecha', { ascending: false }).order('hora_inicio', { ascending: false }).limit(limite));

export async function contarTotales(db) {
  return rpcUno(db, 'fn_contar_totales') ?? { ninos: 0, activos: 0, profesionales: 0, salas: 0 };
}

export async function resumenDelDia(db, dia, fecha) {
  if (!dia || await obtenerSuspensionDeFecha(db, fecha)) return { programadas: 0, registradas: 0, presentes: 0, faltas: 0 };
  return rpcUno(db, 'fn_resumen_dia', { p_dia: dia, p_fecha: fecha });
}

export async function obtenerSesionesDelDia(db, dia, fecha) {
  if (!dia || await obtenerSuspensionDeFecha(db, fecha)) return [];
  const bloques = await obtenerBloques(db, dia);
  return Promise.all(bloques.map(async (b) => ({
    ...b,
    ninos: await rpcFilas(db, 'fn_ninos_con_asistencia', { p_bloque: b.id, p_fecha: fecha }),
  })));
}

export async function resumenPeriodo(db, anio, mesIdx) {
  const [desde, hasta] = rangoMes(anio, mesIdx);
  const fila = await rpcUno(db, 'fn_resumen_periodo', { p_desde: desde, p_hasta: hasta });
  if (!fila) return { total: 0, presentes: 0, faltas: 0, suspendidas: 0, porcentaje: 0, porNino: [], porProfesional: [] };
  return {
    total: fila.total,
    presentes: fila.presentes,
    faltas: fila.faltas,
    suspendidas: fila.suspendidas,
    porcentaje: fila.porcentaje,
    porNino: fila.por_nino ?? [],
    porProfesional: fila.por_profesional ?? [],
  };
}

export const contarSesionesDelMes = async (db, anio, mesIdx) => {
  const [desde, hasta] = rangoMes(anio, mesIdx);
  return (await rpc(db, 'fn_contar_sesiones_mes', { p_desde: desde, p_hasta: hasta })) ?? 0;
};

export const obtenerSuspensiones = (db) => todos(db.from('suspensiones').select('*').order('fecha'));
export const obtenerSuspensionDeFecha = (db, fecha) => uno(db.from('suspensiones').select('*').eq('fecha', fecha).maybeSingle());
export const agregarSuspension = (db, { fecha, motivo, origen = 'manual' }) => rpc(db, 'fn_agregar_suspension', { p_fecha: fecha, p_motivo: motivo.trim(), p_origen: origen });
export const eliminarSuspension = (db, fecha) => escribir(db.from('suspensiones').delete().eq('fecha', fecha));

export const obtenerBloquesConEstado = (db, dia, fecha, profesionalId = null) => rpcFilas(db, 'fn_bloques_estado', {
  p_dia: dia,
  p_fecha: fecha,
  p_profesional: profesionalId,
});

export async function bloqueCerrado(db, bloqueId, fecha) {
  const fila = await uno(db.from('cierres_bloque').select('id').eq('bloque_id', bloqueId).eq('fecha', fecha).maybeSingle());
  return Boolean(fila);
}

export const bloqueAnteriorPendiente = (db, bloqueId, fecha) => rpcUno(db, 'fn_bloque_anterior_pendiente', { p_bloque: bloqueId, p_fecha: fecha });

export const marcarPendientesComoFalta = (db, bloqueId, fecha) => rpc(db, 'fn_marcar_pendientes_falta', { p_bloque: bloqueId, p_fecha: fecha });

export const cerrarBloque = (db, bloqueId, fecha, usuarioId) => rpc(db, 'fn_cerrar_bloque', {
  p_bloque: bloqueId,
  p_fecha: fecha,
  p_usuario: usuarioId,
});

export const reabrirBloque = (db, bloqueId, fecha) => escribir(db.from('cierres_bloque').delete().eq('bloque_id', bloqueId).eq('fecha', fecha));

export const registrarAtencion = (db, bloqueId, ninoId, fecha, { actividades, observaciones }) => escribir(
  db.from('asistencias').update({ actividades: actividades.trim(), observaciones: observaciones.trim() || null })
    .eq('bloque_id', bloqueId).eq('nino_id', ninoId).eq('fecha', fecha).eq('estado', 'Presente'));

export const obtenerNinosDeProfesional = (db, profesionalId) => rpcFilas(db, 'fn_ninos_de_profesional', { p_profesional: profesionalId });

export const obtenerHistorialAtencion = (db, ninoId) => todos(
  db.from('v_historial_atencion').select('*').eq('nino_id', ninoId).order('fecha', { ascending: false }).order('hora_inicio', { ascending: false }).limit(60));

export async function resumenHistorial(db, anio, mesIdx, profesionalId = null) {
  const [desde, hasta] = rangoMes(anio, mesIdx);
  const fila = await rpcUno(db, 'fn_resumen_historial', { p_desde: desde, p_hasta: hasta, p_profesional: profesionalId });
  if (!fila) return { generadas: 0, presentes: 0, faltas: 0, suspendidas: 0, porcentaje: 0, barras: [0, 0, 0, 0, 0, 0, 0], recientes: [] };
  return {
    generadas: fila.generadas,
    presentes: fila.presentes,
    faltas: fila.faltas,
    suspendidas: fila.suspendidas,
    porcentaje: fila.porcentaje,
    barras: fila.barras ?? [0, 0, 0, 0, 0, 0, 0],
    recientes: fila.recientes ?? [],
  };
}

export async function obtenerTipos(db, soloActivos = false) {
  let consulta = db.from('v_tipos').select('*');
  if (soloActivos) consulta = consulta.eq('activo', 1);
  return todos(consulta.order('nombre'));
}

export async function tipoExiste(db, nombre, excluirId = 0) {
  const filas = await todos(db.from('tipos_discapacidad').select('id').ilike('nombre', nombre.trim()).neq('id', excluirId));
  return filas.length > 0;
}

export const agregarTipo = (db, nombre) => escribir(db.from('tipos_discapacidad').insert({ nombre: nombre.trim() }));
export const renombrarTipo = (db, id, nombreNuevo) => rpc(db, 'fn_renombrar_tipo', { p_id: id, p_nombre_nuevo: nombreNuevo.trim() });
export const cambiarEstadoTipo = (db, id, activo) => escribir(db.from('tipos_discapacidad').update({ activo }).eq('id', id));
export const eliminarTipo = (db, id) => rpc(db, 'fn_eliminar_tipo', { p_id: id });

export async function obtenerAvisos(db, usuario, fecha, hora) {
  const avisos = [];
  const dia = diaSemanaDe(fecha);
  const suspensionHoy = await obtenerSuspensionDeFecha(db, fecha);
  if (suspensionHoy) {
    avisos.push({ clave: `susp:${fecha}`, grupo: 'Hoy', orden: '99:99', icono: 'alert-triangle', tinte: 'naranja', titulo: 'Atención suspendida hoy',
      texto: `${suspensionHoy.motivo}. No hay sesiones ni asistencia.`, hace: 'Hoy' });
  } else if (dia) {
    const bloques = await obtenerBloquesConEstado(db, dia, fecha, usuario.rol === 'profesional' ? usuario.id : null);
    const conteos = await rpcFilas(db, 'fn_avisos_conteos', { p_fecha: fecha });
    const cuenta = (id, e) => conteos.find((c) => c.bloque_id === id && c.estado === e)?.n ?? 0;
    for (const b of bloques) {
      if (b.hora_fin > hora) continue;
      const detalle = `${b.actividad} · ${b.sala_nombre}${usuario.rol === 'admin' ? ` · Lic. ${b.profesional_nombre}` : ''}`;
      const registrados = Number(b.registrados ?? 0);
      if (!b.cerrado && Number(b.cupo ?? 0) > 0 && registrados === 0) {
        avisos.push({ clave: `asin:${b.id}:${fecha}`, grupo: 'Hoy', orden: b.hora_fin, icono: 'alert-circle', tinte: 'rojo', titulo: `Bloque de las ${b.hora_inicio} sin asistencia`,
          texto: `${detalle}. Ya pasó su horario y no se registró ninguna asistencia.`, hace: `Terminó a las ${b.hora_fin}`, bloqueId: b.id, pendiente: true });
      } else if (b.cerrado) {
        const p = cuenta(b.id, 'Presente');
        const f = cuenta(b.id, 'Falta');
        avisos.push({ clave: `fin:${b.id}:${fecha}`, grupo: 'Hoy', orden: b.hora_fin, icono: 'check-circle', tinte: 'verde', titulo: `Bloque de las ${b.hora_inicio} finalizado`,
          texto: `${detalle}. ${p} ${p === 1 ? 'presente' : 'presentes'} y ${f} ${f === 1 ? 'falta' : 'faltas'}.`, hace: `Terminó a las ${b.hora_fin}`, bloqueId: b.id });
      } else {
        avisos.push({ clave: `pend:${b.id}:${fecha}`, grupo: 'Hoy', orden: b.hora_fin, icono: 'clock', tinte: 'naranja', titulo: `Bloque de las ${b.hora_inicio} sin cerrar`,
          texto: `${detalle}. Ya pasó su horario y la asistencia está registrada, pero falta cerrar el bloque.`, hace: `Terminó a las ${b.hora_fin}`, bloqueId: b.id, pendiente: true });
      }
    }
  }
  let eventos = [];
  try {
    eventos = await todos(db.from('eventos').select('*').order('creado_en', { ascending: false }).limit(60));
  } catch {
    eventos = [];
  }
  for (const e of eventos) {
    avisos.push({ clave: `evento:${e.id}`, grupo: 'Hoy', orden: e.creado_en ?? '', icono: e.icono ?? 'bell', tinte: e.tono ?? 'azul', titulo: e.titulo,
      texto: e.texto, hace: formatoHace(e.creado_en), bloqueId: e.bloque_id ?? undefined });
  }
  const proximas = await todos(db.from('suspensiones').select('*').gt('fecha', fecha).lte('fecha', sumarDiasISO(fecha, 5)).order('fecha'));
  for (const s of proximas) {
    avisos.push({ clave: `susp:${s.fecha}`, grupo: 'Próximos días', orden: s.fecha, icono: 'alert-triangle', tinte: 'naranja', titulo: 'Suspensión programada',
      texto: `El ${s.fecha.split('-').reverse().join('/')} no habrá atención: ${s.motivo}.`, hace: 'Próximos 5 días' });
  }
  return avisos.sort((a, b) => (a.grupo === b.grupo ? (a.grupo === 'Hoy' ? b.orden.localeCompare(a.orden) : a.orden.localeCompare(b.orden)) : a.grupo === 'Hoy' ? -1 : 1));
}

export async function obtenerClavesLeidas(db, usuarioId) {
  const filas = await todos(db.from('avisos_leidos').select('clave').eq('usuario_id', usuarioId));
  return new Set(filas.map((f) => f.clave));
}

export const marcarAvisoLeido = (db, usuarioId, clave) => escribir(
  db.from('avisos_leidos').upsert({ usuario_id: usuarioId, clave }, { onConflict: 'usuario_id,clave' }));

export const marcarAvisosLeidos = (db, usuarioId, claves) => escribir(
  db.from('avisos_leidos').upsert(claves.map((clave) => ({ usuario_id: usuarioId, clave })), { onConflict: 'usuario_id,clave' }));

export async function obtenerResumenMes(db, anio, mesIdx) {
  const [desde, hasta] = rangoMes(anio, mesIdx);
  const fila = await rpcUno(db, 'fn_resumen_mes', { p_desde: desde, p_hasta: hasta });
  return {
    porFecha: fila?.por_fecha ?? {},
    suspendidas: fila?.suspendidas ?? {},
    bloquesPorDia: fila?.bloques_por_dia ?? {},
  };
}

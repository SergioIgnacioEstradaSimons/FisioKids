// datos.js — TODAS las sentencias SQL del proyecto (SQLite con expo-sqlite).
// Regla: los valores siempre van como parámetros "?" (nunca se concatenan dentro del texto SQL).
// Cada función recibe `db` (se obtiene con useSQLiteContext()) y es asíncrona.

import * as Crypto from 'expo-crypto';
import { usuariosEjemplo, salasEjemplo, ninosEjemplo, bloquesEjemplo, asignacionesEjemplo, TIPOS_DISCAPACIDAD } from './semilla';
import { aISO, sumarHora, rangoMes, diaSemanaDe, sumarDiasISO, NOMBRES_DIA } from './utiles';

export const NOMBRE_BASE = 'fisiokids.db';
const VERSION_ESQUEMA = 4; // 2: nombres/apellidos y grado por categoría · 3: cierre de bloques · 4: foto de perfil, tipos de discapacidad y avisos leídos

export const ESQUEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombres       TEXT NOT NULL COLLATE NOCASE,
  apellidos     TEXT NOT NULL COLLATE NOCASE,
  correo        TEXT NOT NULL UNIQUE,
  contrasena    TEXT NOT NULL,                -- se guarda cifrada (SHA-256), nunca en texto plano
  rol           TEXT NOT NULL CHECK (rol IN ('admin','profesional')),
  especialidad  TEXT,
  activo        INTEGER NOT NULL DEFAULT 1,
  foto          TEXT,                         -- foto de perfil (imagen en base64), opcional
  UNIQUE (nombres, apellidos)                 -- evita profesionales duplicados
);

CREATE TABLE IF NOT EXISTS ninos (            -- TABLA PRINCIPAL (CRUD)
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nombres           TEXT NOT NULL COLLATE NOCASE,
  apellidos         TEXT NOT NULL COLLATE NOCASE,
  fecha_nacimiento  TEXT NOT NULL,
  tipo_discapacidad TEXT NOT NULL,
  grado             TEXT NOT NULL CHECK (grado IN ('Leve','Moderado','Grave','Muy grave')),
  tutor_nombre      TEXT NOT NULL,
  tutor_telefono    TEXT NOT NULL,
  observaciones     TEXT,
  activo            INTEGER NOT NULL DEFAULT 1, -- baja lógica
  UNIQUE (nombres, apellidos, fecha_nacimiento) -- evita niños duplicados
);

CREATE TABLE IF NOT EXISTS salas (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT NOT NULL UNIQUE,
  capacidad INTEGER NOT NULL DEFAULT 4,
  activo    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bloques (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  dia_semana      INTEGER NOT NULL,           -- 1 = lunes ... 5 = viernes
  hora_inicio     TEXT NOT NULL,
  hora_fin        TEXT NOT NULL,
  actividad       TEXT NOT NULL,
  profesional_id  INTEGER NOT NULL REFERENCES usuarios(id),
  sala_id         INTEGER NOT NULL REFERENCES salas(id)
);

CREATE TABLE IF NOT EXISTS asignaciones (     -- niños de cada bloque (máx. según la sala, tope 4)
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  bloque_id INTEGER NOT NULL REFERENCES bloques(id) ON DELETE CASCADE,
  nino_id   INTEGER NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  UNIQUE (bloque_id, nino_id)
);

CREATE TABLE IF NOT EXISTS asistencias (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  bloque_id     INTEGER NOT NULL REFERENCES bloques(id) ON DELETE CASCADE,
  nino_id       INTEGER NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  fecha         TEXT NOT NULL,
  estado        TEXT NOT NULL CHECK (estado IN ('Presente','Falta')),
  actividades   TEXT,
  observaciones TEXT,
  UNIQUE (bloque_id, nino_id, fecha)
);

CREATE TABLE IF NOT EXISTS cierres_bloque (   -- un bloque se «cierra» cada día cuando se confirma su asistencia
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  bloque_id   INTEGER NOT NULL REFERENCES bloques(id) ON DELETE CASCADE,
  fecha       TEXT NOT NULL,
  cerrado_por INTEGER REFERENCES usuarios(id),
  UNIQUE (bloque_id, fecha)
);

CREATE TABLE IF NOT EXISTS tipos_discapacidad ( -- el administrador puede agregar más tipos
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS avisos_leidos (    -- avisos (notificaciones) que cada usuario ya leyó
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  clave      TEXT NOT NULL,
  PRIMARY KEY (usuario_id, clave)
);

CREATE TABLE IF NOT EXISTS suspensiones (     -- se llena con los feriados de la API (Jornada 4)
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha  TEXT NOT NULL UNIQUE,
  motivo TEXT NOT NULL,
  origen TEXT NOT NULL DEFAULT 'manual'       -- 'api' o 'manual'
);
`;

export const cifrar = (texto) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, texto);

// ---------------------------------------------------------------------------------------------
// Inicio de la base: se ejecuta en onInit de <SQLiteProvider>
// ---------------------------------------------------------------------------------------------
export async function iniciarBase(db) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const fila = await db.getFirstAsync('PRAGMA user_version');
  const version = fila.user_version;
  if (version >= VERSION_ESQUEMA) return;
  if (version < 2) {
    // Esquema muy antiguo: se descartan las tablas de prueba y se vuelven a crear con datos iniciales
    await db.execAsync(`DROP TABLE IF EXISTS avisos_leidos; DROP TABLE IF EXISTS tipos_discapacidad; DROP TABLE IF EXISTS cierres_bloque;
      DROP TABLE IF EXISTS asistencias; DROP TABLE IF EXISTS asignaciones; DROP TABLE IF EXISTS bloques;
      DROP TABLE IF EXISTS suspensiones; DROP TABLE IF EXISTS ninos; DROP TABLE IF EXISTS salas; DROP TABLE IF EXISTS usuarios;`);
    await db.execAsync(ESQUEMA);
    await sembrar(db);
  } else {
    // Migración sin perder datos: se crean las tablas nuevas y se agregan las columnas que falten
    await db.execAsync(ESQUEMA);
    if (version < 3) {
      await db.execAsync('INSERT OR IGNORE INTO cierres_bloque (bloque_id, fecha) SELECT DISTINCT bloque_id, fecha FROM asistencias');
    }
    const columnas = await db.getAllAsync('PRAGMA table_info(usuarios)');
    if (!columnas.some((c) => c.name === 'foto')) await db.execAsync('ALTER TABLE usuarios ADD COLUMN foto TEXT');
    await sembrarTipos(db);
  }
  await db.execAsync(`PRAGMA user_version = ${VERSION_ESQUEMA}`);
}

async function sembrarTipos(db) {
  for (const t of TIPOS_DISCAPACIDAD) await db.runAsync('INSERT OR IGNORE INTO tipos_discapacidad (nombre) VALUES (?)', [t]);
}

const ACTIVIDADES = {
  'Terapia motriz': 'Equilibrio y marcha con obstáculos',
  'Estimulación temprana': 'Estimulación del tono muscular',
  'Terapia individual': 'Ejercicios de coordinación',
};

// Carga los datos iniciales (solo la primera vez) y un historial de asistencias de las últimas semanas
async function sembrar(db) {
  await db.withTransactionAsync(async () => {
    for (const u of usuariosEjemplo) {
      await db.runAsync(
        'INSERT INTO usuarios (id, nombres, apellidos, correo, contrasena, rol, especialidad, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.nombres, u.apellidos, u.correo, await cifrar(u.contrasena), u.rol, u.especialidad, u.activo]);
    }
    await sembrarTipos(db);
    for (const s of salasEjemplo) {
      await db.runAsync('INSERT INTO salas (id, nombre, capacidad, activo) VALUES (?, ?, ?, ?)', [s.id, s.nombre, s.capacidad, s.activo]);
    }
    for (const n of ninosEjemplo) {
      await db.runAsync(
        'INSERT INTO ninos (id, nombres, apellidos, fecha_nacimiento, tipo_discapacidad, grado, tutor_nombre, tutor_telefono, observaciones, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [n.id, n.nombres, n.apellidos, n.fecha_nacimiento, n.tipo_discapacidad, n.grado, n.tutor_nombre, n.tutor_telefono, n.observaciones, n.activo]);
    }
    for (const b of bloquesEjemplo) {
      await db.runAsync(
        'INSERT INTO bloques (id, dia_semana, hora_inicio, hora_fin, actividad, profesional_id, sala_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [b.id, b.dia_semana, b.hora_inicio, b.hora_fin, b.actividad, b.profesional_id, b.sala_id]);
    }
    for (const a of asignacionesEjemplo) {
      await db.runAsync('INSERT INTO asignaciones (bloque_id, nino_id) VALUES (?, ?)', [a.bloque_id, a.nino_id]);
    }
    // Historial: las últimas 10 semanas, solo fechas anteriores a hoy (cada bloque de esos días queda cerrado)
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const lunes = new Date(hoy); lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    for (let w = 0; w <= 10; w++) {
      for (const b of bloquesEjemplo) {
        const f = new Date(lunes); f.setDate(f.getDate() - 7 * w + (b.dia_semana - 1));
        if (f >= hoy) continue;
        for (const a of asignacionesEjemplo.filter((x) => x.bloque_id === b.id)) {
          const falta = (a.nino_id + b.id + w) % 7 === 0;
          await db.runAsync(
            'INSERT INTO asistencias (bloque_id, nino_id, fecha, estado, actividades) VALUES (?, ?, ?, ?, ?)',
            [b.id, a.nino_id, aISO(f), falta ? 'Falta' : 'Presente', falta ? null : ACTIVIDADES[b.actividad] ?? 'Ejercicios terapéuticos']);
        }
        await db.runAsync('INSERT OR IGNORE INTO cierres_bloque (bloque_id, fecha) VALUES (?, ?)', [b.id, aISO(f)]);
      }
    }
  });
}

// ---------------------------------------------------------------------------------------------
// USUARIOS (login y profesionales)
// ---------------------------------------------------------------------------------------------
export async function iniciarSesion(db, correo, contrasena) {
  return db.getFirstAsync(
    "SELECT id, nombres, apellidos, nombres || ' ' || apellidos AS nombre, correo, rol, especialidad, foto FROM usuarios WHERE correo = ? AND contrasena = ? AND activo = 1",
    [correo.trim().toLowerCase(), await cifrar(contrasena)]);
}

export const obtenerProfesionales = (db, dia) => db.getAllAsync(
  `SELECT u.*, u.nombres || ' ' || u.apellidos AS nombre,
          (SELECT COUNT(*) FROM bloques b WHERE b.profesional_id = u.id AND b.dia_semana = ?) AS bloques_hoy
   FROM usuarios u WHERE u.rol = 'profesional' ORDER BY u.activo DESC, u.apellidos, u.nombres`, [dia]);

export const obtenerUsuario = (db, id) => db.getFirstAsync("SELECT *, nombres || ' ' || apellidos AS nombre FROM usuarios WHERE id = ?", [id]);

export const correoExiste = async (db, correo, excluirId = 0) =>
  (await db.getFirstAsync('SELECT COUNT(*) AS n FROM usuarios WHERE correo = ? AND id <> ?', [correo.trim().toLowerCase(), excluirId])).n > 0;

// ¿Ya existe un usuario con los mismos nombres y apellidos? (evita duplicados)
export const usuarioConNombreExiste = async (db, nombres, apellidos, excluirId = 0) =>
  (await db.getFirstAsync('SELECT COUNT(*) AS n FROM usuarios WHERE LOWER(nombres) = LOWER(?) AND LOWER(apellidos) = LOWER(?) AND id <> ?',
    [nombres.trim(), apellidos.trim(), excluirId])).n > 0;

export async function agregarProfesional(db, p) {
  return db.runAsync(
    "INSERT INTO usuarios (nombres, apellidos, correo, contrasena, rol, especialidad, foto) VALUES (?, ?, ?, ?, 'profesional', ?, ?)",
    [p.nombres.trim(), p.apellidos.trim(), p.correo.trim().toLowerCase(), await cifrar(p.contrasena), p.especialidad, p.foto ?? null]);
}

export async function modificarProfesional(db, id, p) {
  if (p.contrasena) {
    return db.runAsync('UPDATE usuarios SET nombres = ?, apellidos = ?, correo = ?, especialidad = ?, activo = ?, foto = ?, contrasena = ? WHERE id = ?',
      [p.nombres.trim(), p.apellidos.trim(), p.correo.trim().toLowerCase(), p.especialidad, p.activo, p.foto ?? null, await cifrar(p.contrasena), id]);
  }
  return db.runAsync('UPDATE usuarios SET nombres = ?, apellidos = ?, correo = ?, especialidad = ?, activo = ?, foto = ? WHERE id = ?',
    [p.nombres.trim(), p.apellidos.trim(), p.correo.trim().toLowerCase(), p.especialidad, p.activo, p.foto ?? null, id]);
}

// Foto de perfil (imagen en base64 o null para quitarla)
export const modificarFoto = (db, id, foto) => db.runAsync('UPDATE usuarios SET foto = ? WHERE id = ?', [foto ?? null, id]);

// Mi perfil: cada usuario puede cambiar sus nombres, apellidos y contraseña (NO el correo ni el rol)
export async function modificarPerfil(db, id, { nombres, apellidos, contrasena }) {
  if (contrasena) {
    return db.runAsync('UPDATE usuarios SET nombres = ?, apellidos = ?, contrasena = ? WHERE id = ?',
      [nombres.trim(), apellidos.trim(), await cifrar(contrasena), id]);
  }
  return db.runAsync('UPDATE usuarios SET nombres = ?, apellidos = ? WHERE id = ?', [nombres.trim(), apellidos.trim(), id]);
}

export async function contrasenaCorrecta(db, id, contrasena) {
  return (await db.getFirstAsync('SELECT COUNT(*) AS n FROM usuarios WHERE id = ? AND contrasena = ?', [id, await cifrar(contrasena)])).n > 0;
}

// ---------------------------------------------------------------------------------------------
// SALAS
// ---------------------------------------------------------------------------------------------
export const obtenerSalas = (db) => db.getAllAsync(
  `SELECT s.*, (SELECT COUNT(*) FROM bloques b WHERE b.sala_id = s.id) AS bloques_semana
   FROM salas s ORDER BY s.activo DESC, s.nombre`);
export const obtenerSala = (db, id) => db.getFirstAsync('SELECT * FROM salas WHERE id = ?', [id]);
export const salaExiste = async (db, nombre, excluirId = 0) =>
  (await db.getFirstAsync('SELECT COUNT(*) AS n FROM salas WHERE LOWER(nombre) = LOWER(?) AND id <> ?', [nombre.trim(), excluirId])).n > 0;
export const agregarSala = (db, s) => db.runAsync('INSERT INTO salas (nombre, capacidad) VALUES (?, ?)', [s.nombre.trim(), s.capacidad]);
export const modificarSala = (db, id, s) => db.runAsync('UPDATE salas SET nombre = ?, capacidad = ?, activo = ? WHERE id = ?',
  [s.nombre.trim(), s.capacidad, s.activo, id]);

// ---------------------------------------------------------------------------------------------
// NIÑOS (entidad principal: crear, ver, modificar y borrar)
// ---------------------------------------------------------------------------------------------
export const obtenerNinos = (db) => db.getAllAsync("SELECT *, nombres || ' ' || apellidos AS nombre FROM ninos ORDER BY activo DESC, apellidos, nombres");
export const obtenerNino = (db, id) => db.getFirstAsync("SELECT *, nombres || ' ' || apellidos AS nombre FROM ninos WHERE id = ?", [id]);

// ¿Ya existe un niño con los mismos nombres, apellidos y fecha de nacimiento? (evita duplicados)
export const ninoExiste = async (db, nombres, apellidos, fechaNacimiento, excluirId = 0) =>
  (await db.getFirstAsync(
    'SELECT COUNT(*) AS n FROM ninos WHERE LOWER(nombres) = LOWER(?) AND LOWER(apellidos) = LOWER(?) AND fecha_nacimiento = ? AND id <> ?',
    [nombres.trim(), apellidos.trim(), fechaNacimiento, excluirId])).n > 0;

export const agregarNino = (db, n) => db.runAsync(
  `INSERT INTO ninos (nombres, apellidos, fecha_nacimiento, tipo_discapacidad, grado, tutor_nombre, tutor_telefono, observaciones)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [n.nombres.trim(), n.apellidos.trim(), n.fecha_nacimiento, n.tipo_discapacidad, n.grado, n.tutor_nombre.trim(), n.tutor_telefono.trim(), n.observaciones.trim()]);

export const modificarNino = (db, id, n) => db.runAsync(
  `UPDATE ninos SET nombres = ?, apellidos = ?, fecha_nacimiento = ?, tipo_discapacidad = ?, grado = ?,
                    tutor_nombre = ?, tutor_telefono = ?, observaciones = ? WHERE id = ?`,
  [n.nombres.trim(), n.apellidos.trim(), n.fecha_nacimiento, n.tipo_discapacidad, n.grado, n.tutor_nombre.trim(), n.tutor_telefono.trim(), n.observaciones.trim(), id]);

// Baja lógica: el niño deja de aparecer como activo pero conserva su historial
export const cambiarEstadoNino = (db, id, activo) => db.runAsync('UPDATE ninos SET activo = ? WHERE id = ?', [activo, id]);

// Borrado definitivo (también elimina sus asignaciones y asistencias por ON DELETE CASCADE)
export const eliminarNino = (db, id) => db.runAsync('DELETE FROM ninos WHERE id = ?', [id]);

// ---------------------------------------------------------------------------------------------
// BLOQUES Y ASIGNACIONES
// ---------------------------------------------------------------------------------------------
const SELECT_BLOQUES = `
  SELECT b.*, s.nombre AS sala_nombre, s.capacidad AS capacidad, u.nombres || ' ' || u.apellidos AS profesional_nombre,
         (SELECT COUNT(*) FROM asignaciones a WHERE a.bloque_id = b.id) AS cupo
  FROM bloques b
  JOIN salas s ON s.id = b.sala_id
  JOIN usuarios u ON u.id = b.profesional_id`;

// dia y profesionalId son opcionales (null = todos)
export const obtenerBloques = (db, dia = null, profesionalId = null) => db.getAllAsync(
  `${SELECT_BLOQUES} WHERE (? IS NULL OR b.dia_semana = ?) AND (? IS NULL OR b.profesional_id = ?)
   ORDER BY b.dia_semana, b.hora_inicio`, [dia, dia, profesionalId, profesionalId]);

export const obtenerBloque = (db, id) => db.getFirstAsync(`${SELECT_BLOQUES} WHERE b.id = ?`, [id]);
export const obtenerBloquesEnHorario = (db, dia, hora) => db.getAllAsync(`${SELECT_BLOQUES} WHERE b.dia_semana = ? AND b.hora_inicio = ?`, [dia, hora]);

export const obtenerNinosDeBloque = (db, bloqueId) => db.getAllAsync(
  `SELECT n.*, n.nombres || ' ' || n.apellidos AS nombre FROM asignaciones a JOIN ninos n ON n.id = a.nino_id
   WHERE a.bloque_id = ? ORDER BY n.apellidos, n.nombres`, [bloqueId]);

export const obtenerBloquesDeNino = (db, ninoId) => db.getAllAsync(
  `SELECT b.* FROM asignaciones a JOIN bloques b ON b.id = a.bloque_id WHERE a.nino_id = ? ORDER BY b.dia_semana, b.hora_inicio`, [ninoId]);

export const obtenerHorariosPorNino = (db) => db.getAllAsync(
  `SELECT a.nino_id, b.dia_semana, b.hora_inicio FROM asignaciones a JOIN bloques b ON b.id = a.bloque_id ORDER BY b.dia_semana, b.hora_inicio`);

// Asigna uno o varios niños (ninoIds) a un bloque y lo repite en varios días de la semana (dias = [1, 3, 5]).
// Como cada bloque es semanal, una asignación del lunes se repite TODOS los lunes del mes.
// Es «todo o nada»: si algo falla (cupo, conflicto, duplicado) no se guarda nada.
// Lanza un Error con un mensaje claro si se rompe alguna regla.
export async function crearAsignacion(db, { ninoIds, profesionalId, salaId, dias, hora, actividad }) {
  if (!ninoIds || ninoIds.length === 0) throw new Error('Selecciona al menos un niño.');
  if (!dias || dias.length === 0) throw new Error('Selecciona al menos un día.');
  await db.withTransactionAsync(async () => {
    const sala = await db.getFirstAsync('SELECT capacidad FROM salas WHERE id = ?', [salaId]);
    const max = Math.min(4, sala.capacidad);
    for (const dia of dias) {
      const nombreDia = NOMBRES_DIA[dia];
      let bloque = await db.getFirstAsync('SELECT * FROM bloques WHERE dia_semana = ? AND hora_inicio = ? AND sala_id = ?', [dia, hora, salaId]);
      if (bloque) {
        if (bloque.profesional_id !== profesionalId) throw new Error(`${nombreDia}: la sala ya está ocupada por otro profesional en ese horario.`);
      } else {
        const ocupado = await db.getFirstAsync('SELECT COUNT(*) AS n FROM bloques WHERE dia_semana = ? AND hora_inicio = ? AND profesional_id = ?', [dia, hora, profesionalId]);
        if (ocupado.n > 0) throw new Error(`${nombreDia}: el profesional ya atiende otra sala en ese horario.`);
        const r = await db.runAsync(
          'INSERT INTO bloques (dia_semana, hora_inicio, hora_fin, actividad, profesional_id, sala_id) VALUES (?, ?, ?, ?, ?, ?)',
          [dia, hora, sumarHora(hora), actividad, profesionalId, salaId]);
        bloque = { id: r.lastInsertRowId };
      }
      const cupo = (await db.getFirstAsync('SELECT COUNT(*) AS n FROM asignaciones WHERE bloque_id = ?', [bloque.id])).n;
      if (cupo + ninoIds.length > max) {
        throw new Error(`${nombreDia}: el bloque admite máximo ${max} niños y ya tiene ${cupo}. Solo puedes agregar ${Math.max(max - cupo, 0)} más.`);
      }
      for (const ninoId of ninoIds) {
        const repetido = await db.getFirstAsync('SELECT COUNT(*) AS n FROM asignaciones WHERE bloque_id = ? AND nino_id = ?', [bloque.id, ninoId]);
        if (repetido.n > 0) throw new Error(`${nombreDia}: uno de los niños ya está asignado a ese bloque.`);
        await db.runAsync('INSERT INTO asignaciones (bloque_id, nino_id) VALUES (?, ?)', [bloque.id, ninoId]);
      }
    }
  });
}

// ---------------------------------------------------------------------------------------------
// ASISTENCIA E HISTORIAL
// ---------------------------------------------------------------------------------------------
export const obtenerAsistenciaDelBloque = (db, bloqueId, fecha) => db.getAllAsync(
  'SELECT nino_id, estado, actividades, observaciones FROM asistencias WHERE bloque_id = ? AND fecha = ?', [bloqueId, fecha]);

export const obtenerAsistenciaNino = (db, bloqueId, ninoId, fecha) => db.getFirstAsync(
  'SELECT * FROM asistencias WHERE bloque_id = ? AND nino_id = ? AND fecha = ?', [bloqueId, ninoId, fecha]);

// registros: [{ ninoId, estado, actividades }]. Si ya existe la asistencia de ese día, la actualiza.
export async function guardarAsistencia(db, bloqueId, fecha, registros) {
  await db.withTransactionAsync(async () => {
    for (const r of registros) {
      await db.runAsync(
        `INSERT INTO asistencias (bloque_id, nino_id, fecha, estado, actividades) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (bloque_id, nino_id, fecha) DO UPDATE SET estado = excluded.estado, actividades = COALESCE(excluded.actividades, actividades)`,
        [bloqueId, r.ninoId, fecha, r.estado, r.actividades?.trim() || null]);
    }
  });
}

export const obtenerHistorialNino = (db, ninoId) => db.getAllAsync(
  'SELECT fecha, estado, actividades FROM asistencias WHERE nino_id = ? ORDER BY fecha DESC LIMIT 20', [ninoId]);

export const obtenerHistorial = (db, limite = 60) => db.getAllAsync(
  `SELECT a.fecha, a.estado, a.actividades, n.nombres || ' ' || n.apellidos AS nino_nombre, b.actividad, b.hora_inicio
   FROM asistencias a JOIN ninos n ON n.id = a.nino_id JOIN bloques b ON b.id = a.bloque_id
   ORDER BY a.fecha DESC, b.hora_inicio LIMIT ?`, [limite]);

// ---------------------------------------------------------------------------------------------
// RESÚMENES (COUNT y SUM)
// ---------------------------------------------------------------------------------------------
export async function contarTotales(db) {
  return {
    ninos: (await db.getFirstAsync('SELECT COUNT(*) AS n FROM ninos')).n,
    activos: (await db.getFirstAsync('SELECT COUNT(*) AS n FROM ninos WHERE activo = 1')).n,
    profesionales: (await db.getFirstAsync("SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'profesional' AND activo = 1")).n,
    salas: (await db.getFirstAsync('SELECT COUNT(*) AS n FROM salas WHERE activo = 1')).n,
  };
}

// Resumen del día según las ASISTENCIAS REGISTRADAS (no según la hora).
// programadas = niños asignados a los bloques de hoy; registradas = niños con asistencia guardada hoy.
// dia = 1..5 (null si es fin de semana, sin sesiones).
export async function resumenDelDia(db, dia, fecha) {
  if (!dia || await obtenerSuspensionDeFecha(db, fecha)) return { programadas: 0, registradas: 0, presentes: 0, faltas: 0 };
  const programadas = (await db.getFirstAsync(
    'SELECT COUNT(*) AS n FROM asignaciones a JOIN bloques b ON b.id = a.bloque_id WHERE b.dia_semana = ?', [dia])).n;
  const filas = await db.getAllAsync(
    `SELECT a.estado, COUNT(*) AS n FROM asistencias a JOIN bloques b ON b.id = a.bloque_id
     WHERE a.fecha = ? AND b.dia_semana = ? GROUP BY a.estado`, [fecha, dia]);
  const cuenta = (e) => filas.find((f) => f.estado === e)?.n ?? 0;
  const presentes = cuenta('Presente');
  const faltas = cuenta('Falta');
  return { programadas, registradas: presentes + faltas, presentes, faltas };
}

// Detalle de cada sesión del día: bloque + niños con su estado de asistencia (o null si no se registró)
export async function obtenerSesionesDelDia(db, dia, fecha) {
  if (!dia || await obtenerSuspensionDeFecha(db, fecha)) return [];
  const bloques = await obtenerBloques(db, dia);
  return Promise.all(bloques.map(async (b) => ({
    ...b,
    ninos: await db.getAllAsync(
      `SELECT n.id, n.nombres || ' ' || n.apellidos AS nombre, a.estado, a.actividades
       FROM asignaciones x
       JOIN ninos n ON n.id = x.nino_id
       LEFT JOIN asistencias a ON a.bloque_id = x.bloque_id AND a.nino_id = n.id AND a.fecha = ?
       WHERE x.bloque_id = ? ORDER BY n.apellidos, n.nombres`, [fecha, b.id]),
  })));
}

// Resumen de un mes: total por estado, por niño y por profesional
export async function resumenPeriodo(db, anio, mesIdx) {
  const [desde, hasta] = rangoMes(anio, mesIdx);
  const estados = await db.getAllAsync('SELECT estado, COUNT(*) AS n FROM asistencias WHERE fecha BETWEEN ? AND ? GROUP BY estado', [desde, hasta]);
  const porNino = await db.getAllAsync(
    `SELECT n.id, n.nombres || ' ' || n.apellidos AS nombre, COUNT(*) AS total, SUM(CASE WHEN a.estado = 'Presente' THEN 1 ELSE 0 END) AS presentes
     FROM asistencias a JOIN ninos n ON n.id = a.nino_id WHERE a.fecha BETWEEN ? AND ? GROUP BY n.id ORDER BY n.apellidos, n.nombres`, [desde, hasta]);
  const porProfesional = await db.getAllAsync(
    `SELECT u.id, u.nombres || ' ' || u.apellidos AS nombre, COUNT(*) AS sesiones
     FROM asistencias a JOIN bloques b ON b.id = a.bloque_id JOIN usuarios u ON u.id = b.profesional_id
     WHERE a.fecha BETWEEN ? AND ? GROUP BY u.id ORDER BY sesiones DESC`, [desde, hasta]);
  const suspendidas = (await db.getFirstAsync('SELECT COUNT(*) AS n FROM suspensiones WHERE fecha BETWEEN ? AND ?', [desde, hasta])).n;
  const cuenta = (e) => estados.find((f) => f.estado === e)?.n ?? 0;
  const presentes = cuenta('Presente');
  const faltas = cuenta('Falta');
  const total = presentes + faltas;
  return { total, presentes, faltas, suspendidas, porcentaje: total ? Math.round((presentes / total) * 100) : 0, porNino, porProfesional };
}

export const contarSesionesDelMes = async (db, anio, mesIdx) => {
  const [desde, hasta] = rangoMes(anio, mesIdx);
  return (await db.getFirstAsync('SELECT COUNT(*) AS n FROM asistencias WHERE fecha BETWEEN ? AND ?', [desde, hasta])).n;
};

// ---------------------------------------------------------------------------------------------
// SUSPENSIONES (días sin atención). Pueden venir de la API de feriados (origen = 'api') o ser manuales.
// ---------------------------------------------------------------------------------------------
export const obtenerSuspensiones = (db) => db.getAllAsync('SELECT * FROM suspensiones ORDER BY fecha');
export const obtenerSuspensionDeFecha = (db, fecha) => db.getFirstAsync('SELECT * FROM suspensiones WHERE fecha = ?', [fecha]);
export const agregarSuspension = (db, { fecha, motivo, origen = 'manual' }) => db.runAsync(
  `INSERT INTO suspensiones (fecha, motivo, origen) VALUES (?, ?, ?)
   ON CONFLICT (fecha) DO UPDATE SET motivo = excluded.motivo`, [fecha, motivo.trim(), origen]);
export const eliminarSuspension = (db, fecha) => db.runAsync('DELETE FROM suspensiones WHERE fecha = ?', [fecha]);

// ---------------------------------------------------------------------------------------------
// FLUJO DE ATENCIÓN DEL PROFESIONAL: orden de bloques, registro de atención y cierre
// ---------------------------------------------------------------------------------------------

// Bloques de un día con su estado en una fecha: cupo, niños con asistencia registrada y si ya está cerrado
export const obtenerBloquesConEstado = (db, dia, fecha, profesionalId = null) => db.getAllAsync(
  `SELECT b.*, s.nombre AS sala_nombre, s.capacidad AS capacidad, u.nombres || ' ' || u.apellidos AS profesional_nombre,
          (SELECT COUNT(*) FROM asignaciones a WHERE a.bloque_id = b.id) AS cupo,
          (SELECT COUNT(*) FROM asistencias x WHERE x.bloque_id = b.id AND x.fecha = ?) AS registrados,
          (SELECT COUNT(*) FROM cierres_bloque c WHERE c.bloque_id = b.id AND c.fecha = ?) AS cerrado
   FROM bloques b
   JOIN salas s ON s.id = b.sala_id
   JOIN usuarios u ON u.id = b.profesional_id
   WHERE b.dia_semana = ? AND (? IS NULL OR b.profesional_id = ?)
   ORDER BY b.hora_inicio`,
  [fecha, fecha, dia, profesionalId, profesionalId]);

export const bloqueCerrado = async (db, bloqueId, fecha) =>
  (await db.getFirstAsync('SELECT COUNT(*) AS n FROM cierres_bloque WHERE bloque_id = ? AND fecha = ?', [bloqueId, fecha])).n > 0;

// Regla de orden: no se puede dar asistencia de un bloque si un bloque ANTERIOR del mismo profesional
// y del mismo día todavía no fue cerrado. Devuelve ese bloque pendiente (o undefined si no hay).
export const bloqueAnteriorPendiente = (db, bloqueId, fecha) => db.getFirstAsync(
  `SELECT b2.* FROM bloques b
   JOIN bloques b2 ON b2.profesional_id = b.profesional_id AND b2.dia_semana = b.dia_semana AND b2.hora_inicio < b.hora_inicio
   WHERE b.id = ? AND NOT EXISTS (SELECT 1 FROM cierres_bloque c WHERE c.bloque_id = b2.id AND c.fecha = ?)
   ORDER BY b2.hora_inicio LIMIT 1`, [bloqueId, fecha]);

// Los niños que aún no tienen asistencia se registran como Falta (los ya marcados no cambian)
export const marcarPendientesComoFalta = (db, bloqueId, fecha) => db.runAsync(
  `INSERT OR IGNORE INTO asistencias (bloque_id, nino_id, fecha, estado)
   SELECT a.bloque_id, a.nino_id, ?, 'Falta' FROM asignaciones a WHERE a.bloque_id = ?`, [fecha, bloqueId]);

// Cierra el bloque del día. Falla si todavía hay niños sin asistencia.
export async function cerrarBloque(db, bloqueId, fecha, usuarioId) {
  const falta = (await db.getFirstAsync(
    `SELECT COUNT(*) AS n FROM asignaciones a
     WHERE a.bloque_id = ? AND NOT EXISTS (SELECT 1 FROM asistencias x WHERE x.bloque_id = a.bloque_id AND x.nino_id = a.nino_id AND x.fecha = ?)`,
    [bloqueId, fecha])).n;
  if (falta > 0) throw new Error(`Hay ${falta} niño(s) sin asistencia. Márcalos o regístralos como falta.`);
  await db.runAsync('INSERT OR IGNORE INTO cierres_bloque (bloque_id, fecha, cerrado_por) VALUES (?, ?, ?)', [bloqueId, fecha, usuarioId]);
}

// Solo el administrador puede reabrir un bloque cerrado
export const reabrirBloque = (db, bloqueId, fecha) => db.runAsync('DELETE FROM cierres_bloque WHERE bloque_id = ? AND fecha = ?', [bloqueId, fecha]);

// Registro de atención de un niño que estuvo Presente: actividades y observaciones del profesional
export const registrarAtencion = (db, bloqueId, ninoId, fecha, { actividades, observaciones }) => db.runAsync(
  `UPDATE asistencias SET actividades = ?, observaciones = ?
   WHERE bloque_id = ? AND nino_id = ? AND fecha = ? AND estado = 'Presente'`,
  [actividades.trim(), observaciones.trim() || null, bloqueId, ninoId, fecha]);

// Niños que atiende un profesional (según sus bloques) con la cantidad de sesiones registradas
export const obtenerNinosDeProfesional = (db, profesionalId) => db.getAllAsync(
  `SELECT n.*, n.nombres || ' ' || n.apellidos AS nombre,
          (SELECT COUNT(*) FROM asistencias a JOIN bloques b2 ON b2.id = a.bloque_id WHERE a.nino_id = n.id AND b2.profesional_id = ?) AS sesiones
   FROM ninos n
   WHERE n.activo = 1 AND EXISTS (SELECT 1 FROM asignaciones x JOIN bloques b ON b.id = x.bloque_id WHERE x.nino_id = n.id AND b.profesional_id = ?)
   ORDER BY n.apellidos, n.nombres`, [profesionalId, profesionalId]);

// Línea de tiempo de atención de un niño
export const obtenerHistorialAtencion = (db, ninoId) => db.getAllAsync(
  `SELECT a.fecha, a.estado, a.actividades, a.observaciones, b.actividad, b.hora_inicio,
          u.nombres || ' ' || u.apellidos AS profesional_nombre
   FROM asistencias a JOIN bloques b ON b.id = a.bloque_id JOIN usuarios u ON u.id = b.profesional_id
   WHERE a.nino_id = ? ORDER BY a.fecha DESC, b.hora_inicio DESC LIMIT 60`, [ninoId]);

// Historial mensual (profesionalId = null para todo el centro)
export async function resumenHistorial(db, anio, mesIdx, profesionalId = null) {
  const [desde, hasta] = rangoMes(anio, mesIdx);
  const estados = await db.getAllAsync(
    `SELECT a.estado, COUNT(*) AS n FROM asistencias a JOIN bloques b ON b.id = a.bloque_id
     WHERE a.fecha BETWEEN ? AND ? AND (? IS NULL OR b.profesional_id = ?) GROUP BY a.estado`, [desde, hasta, profesionalId, profesionalId]);
  const porDia = await db.getAllAsync(
    `SELECT strftime('%w', a.fecha) AS dia, COUNT(*) AS n FROM asistencias a JOIN bloques b ON b.id = a.bloque_id
     WHERE a.fecha BETWEEN ? AND ? AND (? IS NULL OR b.profesional_id = ?) GROUP BY dia`, [desde, hasta, profesionalId, profesionalId]);
  const recientes = await db.getAllAsync(
    `SELECT a.fecha, a.estado, n.nombres || ' ' || n.apellidos AS nino_nombre, s.nombre AS sala_nombre,
            u.nombres || ' ' || u.apellidos AS profesional_nombre
     FROM asistencias a JOIN bloques b ON b.id = a.bloque_id JOIN ninos n ON n.id = a.nino_id
     JOIN salas s ON s.id = b.sala_id JOIN usuarios u ON u.id = b.profesional_id
     WHERE a.fecha BETWEEN ? AND ? AND (? IS NULL OR b.profesional_id = ?)
     ORDER BY a.fecha DESC, b.hora_inicio DESC LIMIT 8`, [desde, hasta, profesionalId, profesionalId]);
  const suspendidas = (await db.getFirstAsync('SELECT COUNT(*) AS n FROM suspensiones WHERE fecha BETWEEN ? AND ?', [desde, hasta])).n;
  const cuenta = (e) => estados.find((f) => f.estado === e)?.n ?? 0;
  const presentes = cuenta('Presente');
  const faltas = cuenta('Falta');
  const generadas = presentes + faltas;
  // barras por día de la semana: L M X J V S D (strftime: 0 = domingo)
  const barras = [1, 2, 3, 4, 5, 6, 0].map((d) => porDia.find((x) => Number(x.dia) === d)?.n ?? 0);
  return { generadas, presentes, faltas, suspendidas, porcentaje: generadas ? Math.round((presentes / generadas) * 100) : 0, barras, recientes };
}

// ---------------------------------------------------------------------------------------------
// TIPOS DE DISCAPACIDAD (el administrador puede agregar más)
// ---------------------------------------------------------------------------------------------
export const obtenerTipos = (db, soloActivos = false) => db.getAllAsync(
  `SELECT t.*, (SELECT COUNT(*) FROM ninos n WHERE n.tipo_discapacidad = t.nombre) AS usados
   FROM tipos_discapacidad t WHERE (? = 0 OR t.activo = 1) ORDER BY t.nombre`, [soloActivos ? 1 : 0]);
export const tipoExiste = async (db, nombre, excluirId = 0) =>
  (await db.getFirstAsync('SELECT COUNT(*) AS n FROM tipos_discapacidad WHERE LOWER(nombre) = LOWER(?) AND id <> ?', [nombre.trim(), excluirId])).n > 0;
export const agregarTipo = (db, nombre) => db.runAsync('INSERT INTO tipos_discapacidad (nombre) VALUES (?)', [nombre.trim()]);
// Al renombrar un tipo también se actualizan los niños que lo tienen
export async function renombrarTipo(db, id, nombreNuevo) {
  await db.withTransactionAsync(async () => {
    const actual = await db.getFirstAsync('SELECT nombre FROM tipos_discapacidad WHERE id = ?', [id]);
    await db.runAsync('UPDATE tipos_discapacidad SET nombre = ? WHERE id = ?', [nombreNuevo.trim(), id]);
    await db.runAsync('UPDATE ninos SET tipo_discapacidad = ? WHERE tipo_discapacidad = ?', [nombreNuevo.trim(), actual.nombre]);
  });
}
export const cambiarEstadoTipo = (db, id, activo) => db.runAsync('UPDATE tipos_discapacidad SET activo = ? WHERE id = ?', [activo, id]);
// Solo se puede borrar un tipo que ningún niño usa
export const eliminarTipo = (db, id) => db.runAsync(
  'DELETE FROM tipos_discapacidad WHERE id = ? AND NOT EXISTS (SELECT 1 FROM ninos n WHERE n.tipo_discapacidad = tipos_discapacidad.nombre)', [id]);

// ---------------------------------------------------------------------------------------------
// AVISOS (notificaciones). Se calculan con los datos reales de la base.
// ---------------------------------------------------------------------------------------------
// Para cada bloque de hoy cuyo horario ya pasó: si no se cerró su asistencia es un aviso de pendiente,
// y si se cerró es un aviso de bloque finalizado. El profesional solo ve sus bloques; el administrador, todos.
// También avisa de las suspensiones de hoy y de los próximos 7 días.
export async function obtenerAvisos(db, usuario, fecha, hora) {
  const avisos = [];
  const dia = diaSemanaDe(fecha);
  const suspensionHoy = await obtenerSuspensionDeFecha(db, fecha);
  if (suspensionHoy) {
    avisos.push({ clave: `susp:${fecha}`, grupo: 'Hoy', orden: '99:99', icono: 'alert-triangle', tinte: 'naranja', titulo: 'Atención suspendida hoy',
      texto: `${suspensionHoy.motivo}. No hay sesiones ni asistencia.`, hace: 'Hoy' });
  } else if (dia) {
    const bloques = await obtenerBloquesConEstado(db, dia, fecha, usuario.rol === 'profesional' ? usuario.id : null);
    const conteos = await db.getAllAsync('SELECT bloque_id, estado, COUNT(*) AS n FROM asistencias WHERE fecha = ? GROUP BY bloque_id, estado', [fecha]);
    const cuenta = (id, e) => conteos.find((c) => c.bloque_id === id && c.estado === e)?.n ?? 0;
    for (const b of bloques) {
      if (b.hora_fin > hora) continue; // el horario todavía no pasó
      const detalle = `${b.actividad} · ${b.sala_nombre}${usuario.rol === 'admin' ? ` · Lic. ${b.profesional_nombre}` : ''}`;
      if (b.cerrado) {
        const p = cuenta(b.id, 'Presente');
        const f = cuenta(b.id, 'Falta');
        avisos.push({ clave: `fin:${b.id}:${fecha}`, grupo: 'Hoy', orden: b.hora_fin, icono: 'check-circle', tinte: 'verde', titulo: `Bloque de las ${b.hora_inicio} finalizado`,
          texto: `${detalle}. ${p} ${p === 1 ? 'presente' : 'presentes'} y ${f} ${f === 1 ? 'falta' : 'faltas'}.`, hace: `Terminó a las ${b.hora_fin}`, bloqueId: b.id });
      } else {
        avisos.push({ clave: `pend:${b.id}:${fecha}`, grupo: 'Hoy', orden: b.hora_fin, icono: 'clock', tinte: 'naranja', titulo: `Bloque de las ${b.hora_inicio} sin cerrar`,
          texto: `${detalle}. Ya pasó su horario y falta registrar o cerrar la asistencia.`, hace: `Terminó a las ${b.hora_fin}`, bloqueId: b.id, pendiente: true });
      }
    }
  }
  const proximas = await db.getAllAsync('SELECT * FROM suspensiones WHERE fecha > ? AND fecha <= ? ORDER BY fecha', [fecha, sumarDiasISO(fecha, 7)]);
  for (const s of proximas) {
    avisos.push({ clave: `susp:${s.fecha}`, grupo: 'Próximos días', orden: s.fecha, icono: 'alert-triangle', tinte: 'naranja', titulo: 'Suspensión programada',
      texto: `El ${s.fecha.split('-').reverse().join('/')} no habrá atención: ${s.motivo}.`, hace: 'Próximos 7 días' });
  }
  // «Hoy» primero (lo más reciente arriba) y luego los próximos días
  return avisos.sort((a, b) => (a.grupo === b.grupo ? (a.grupo === 'Hoy' ? b.orden.localeCompare(a.orden) : a.orden.localeCompare(b.orden)) : a.grupo === 'Hoy' ? -1 : 1));
}

export async function obtenerClavesLeidas(db, usuarioId) {
  const filas = await db.getAllAsync('SELECT clave FROM avisos_leidos WHERE usuario_id = ?', [usuarioId]);
  return new Set(filas.map((f) => f.clave));
}
export const marcarAvisoLeido = (db, usuarioId, clave) => db.runAsync('INSERT OR IGNORE INTO avisos_leidos (usuario_id, clave) VALUES (?, ?)', [usuarioId, clave]);
export async function marcarAvisosLeidos(db, usuarioId, claves) {
  await db.withTransactionAsync(async () => {
    for (const c of claves) await db.runAsync('INSERT OR IGNORE INTO avisos_leidos (usuario_id, clave) VALUES (?, ?)', [usuarioId, c]);
  });
}

// ---------------------------------------------------------------------------------------------
// CALENDARIO MENSUAL: asistencias registradas por día, suspensiones y bloques programados por día de la semana
// ---------------------------------------------------------------------------------------------
export async function obtenerResumenMes(db, anio, mesIdx) {
  const [desde, hasta] = rangoMes(anio, mesIdx);
  const asistencias = await db.getAllAsync(
    `SELECT fecha, SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) AS presentes,
            SUM(CASE WHEN estado = 'Falta' THEN 1 ELSE 0 END) AS faltas
     FROM asistencias WHERE fecha BETWEEN ? AND ? GROUP BY fecha`, [desde, hasta]);
  const suspensiones = await db.getAllAsync('SELECT fecha, motivo FROM suspensiones WHERE fecha BETWEEN ? AND ?', [desde, hasta]);
  const bloques = await db.getAllAsync('SELECT dia_semana, COUNT(*) AS n FROM bloques GROUP BY dia_semana');
  return {
    porFecha: Object.fromEntries(asistencias.map((a) => [a.fecha, { presentes: a.presentes, faltas: a.faltas }])),
    suspendidas: Object.fromEntries(suspensiones.map((s) => [s.fecha, s.motivo])),
    bloquesPorDia: Object.fromEntries(bloques.map((b) => [b.dia_semana, b.n])),
  };
}

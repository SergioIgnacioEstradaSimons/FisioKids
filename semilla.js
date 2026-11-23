// semilla.js — datos iniciales que se cargan UNA sola vez en SQLite (ver iniciarBase en datos.js).
// Después de eso la app lee y escribe en la base; estos arreglos ya no se usan para mostrar pantallas.

export const usuariosEjemplo = [
  { id: 1, nombres: 'Andrea', apellidos: 'Mendoza', correo: 'admin@fisiokids.bo', contrasena: 'admin123', rol: 'admin', especialidad: 'Administración', activo: 1 },
  { id: 2, nombres: 'Carmen', apellidos: 'Ruiz', correo: 'carmen@fisiokids.bo', contrasena: 'prof123', rol: 'profesional', especialidad: 'Fisioterapia pediátrica', activo: 1 },
  { id: 3, nombres: 'Pablo', apellidos: 'Mora', correo: 'pablo@fisiokids.bo', contrasena: 'prof123', rol: 'profesional', especialidad: 'Terapia motriz', activo: 1 },
  { id: 4, nombres: 'Laura', apellidos: 'Gómez', correo: 'laura@fisiokids.bo', contrasena: 'prof123', rol: 'profesional', especialidad: 'Estimulación temprana', activo: 1 },
  { id: 5, nombres: 'José', apellidos: 'Medina', correo: 'jose@fisiokids.bo', contrasena: 'prof123', rol: 'profesional', especialidad: 'Terapia respiratoria', activo: 0 },
];

export const salasEjemplo = [
  { id: 1, nombre: 'Sala Motriz', capacidad: 4, activo: 1 },
  { id: 2, nombre: 'Sala Sensorial', capacidad: 4, activo: 1 },
  { id: 3, nombre: 'Sala Individual', capacidad: 1, activo: 1 },
  { id: 4, nombre: 'Sala Azul', capacidad: 4, activo: 1 },
];

export const ninosEjemplo = [
  { id: 1, nombres: 'Sofía', apellidos: 'Valdez', fecha_nacimiento: '2019-03-14', tipo_discapacidad: 'Parálisis cerebral', grado: 'Moderado', tutor_nombre: 'Marta Valdez', tutor_telefono: '70123456', observaciones: 'Responde bien a juegos con pelota.', activo: 1 },
  { id: 2, nombres: 'Mateo', apellidos: 'Torres', fecha_nacimiento: '2020-07-02', tipo_discapacidad: 'Síndrome de Down', grado: 'Leve', tutor_nombre: 'Luis Torres', tutor_telefono: '71234567', observaciones: '', activo: 1 },
  { id: 3, nombres: 'Lucía', apellidos: 'Castro', fecha_nacimiento: '2018-11-21', tipo_discapacidad: 'TEA', grado: 'Grave', tutor_nombre: 'Rosa Castro', tutor_telefono: '72345678', observaciones: 'Prefiere actividades con música.', activo: 1 },
  { id: 4, nombres: 'Diego', apellidos: 'Núñez', fecha_nacimiento: '2021-01-09', tipo_discapacidad: 'Retraso motor', grado: 'Leve', tutor_nombre: 'Ana Núñez', tutor_telefono: '73456789', observaciones: '', activo: 1 },
  { id: 5, nombres: 'Valentina', apellidos: 'Rojas', fecha_nacimiento: '2017-05-30', tipo_discapacidad: 'Trastorno de coordinación', grado: 'Leve', tutor_nombre: 'Jorge Rojas', tutor_telefono: '74567890', observaciones: '', activo: 1 },
  { id: 6, nombres: 'Tomás', apellidos: 'Guzmán', fecha_nacimiento: '2019-09-18', tipo_discapacidad: 'Retraso motor', grado: 'Leve', tutor_nombre: 'Elena Guzmán', tutor_telefono: '75678901', observaciones: 'Dado de baja por mudanza.', activo: 0 },
];

export const bloquesEjemplo = [
  { id: 1, dia_semana: 1, hora_inicio: '08:00', hora_fin: '09:00', actividad: 'Estimulación temprana', profesional_id: 4, sala_id: 2 },
  { id: 2, dia_semana: 1, hora_inicio: '09:00', hora_fin: '10:00', actividad: 'Terapia motriz', profesional_id: 2, sala_id: 1 },
  { id: 3, dia_semana: 2, hora_inicio: '10:00', hora_fin: '11:00', actividad: 'Terapia individual', profesional_id: 2, sala_id: 3 },
  { id: 4, dia_semana: 3, hora_inicio: '08:00', hora_fin: '09:00', actividad: 'Terapia motriz', profesional_id: 2, sala_id: 1 },
  { id: 5, dia_semana: 4, hora_inicio: '11:00', hora_fin: '12:00', actividad: 'Estimulación temprana', profesional_id: 3, sala_id: 2 },
  { id: 6, dia_semana: 5, hora_inicio: '09:00', hora_fin: '10:00', actividad: 'Terapia motriz', profesional_id: 2, sala_id: 1 },
  { id: 7, dia_semana: 4, hora_inicio: '09:00', hora_fin: '10:00', actividad: 'Terapia motriz', profesional_id: 3, sala_id: 1 },
  { id: 8, dia_semana: 1, hora_inicio: '14:00', hora_fin: '15:00', actividad: 'Terapia motriz', profesional_id: 3, sala_id: 1 },
  { id: 9, dia_semana: 3, hora_inicio: '15:00', hora_fin: '16:00', actividad: 'Estimulación temprana', profesional_id: 4, sala_id: 2 },
  { id: 10, dia_semana: 5, hora_inicio: '16:00', hora_fin: '17:00', actividad: 'Terapia individual', profesional_id: 2, sala_id: 3 },
];

export const asignacionesEjemplo = [
  { bloque_id: 1, nino_id: 4 }, { bloque_id: 1, nino_id: 2 },
  { bloque_id: 2, nino_id: 1 }, { bloque_id: 2, nino_id: 2 }, { bloque_id: 2, nino_id: 3 },
  { bloque_id: 3, nino_id: 3 },
  { bloque_id: 4, nino_id: 1 }, { bloque_id: 4, nino_id: 5 },
  { bloque_id: 5, nino_id: 4 }, { bloque_id: 5, nino_id: 2 },
  { bloque_id: 6, nino_id: 1 }, { bloque_id: 6, nino_id: 2 }, { bloque_id: 6, nino_id: 3 }, { bloque_id: 6, nino_id: 5 },
  { bloque_id: 7, nino_id: 3 },
  { bloque_id: 8, nino_id: 5 }, { bloque_id: 8, nino_id: 4 },
  { bloque_id: 9, nino_id: 2 }, { bloque_id: 9, nino_id: 3 },
  { bloque_id: 10, nino_id: 1 },
];

export const feriadosEjemplo = [
  { fecha: '2026-11-02', nombre: 'Día de Todos los Santos' },
  { fecha: '2026-12-25', nombre: 'Navidad' },
  { fecha: '2027-01-01', nombre: 'Año Nuevo' },
];

export const notificacionesEjemplo = [
  { id: 1, grupo: 'Hoy', icono: 'calendar', tinte: 'azul', titulo: 'Cambio de horario', texto: 'La sesión de Mateo Torres se movió a las 10:30.', hace: 'Hace 12 min', leida: false },
  { id: 2, grupo: 'Hoy', icono: 'user-plus', tinte: 'verde', titulo: 'Nueva asignación', texto: 'Se agregó a Lucía Castro a tu bloque de las 11:30.', hace: 'Hace 1 h', leida: false },
  { id: 3, grupo: 'Hoy', icono: 'alert-triangle', tinte: 'naranja', titulo: 'Suspensión programada', texto: 'El 25 de diciembre no habrá atención por feriado.', hace: 'Hace 3 h', leida: true },
  { id: 4, grupo: 'Ayer', icono: 'layers', tinte: 'morado', titulo: 'Programación actualizada', texto: 'La programación del próximo mes está lista para revisión.', hace: 'Ayer, 16:40', leida: true },
  { id: 5, grupo: 'Ayer', icono: 'bell', tinte: 'azul', titulo: 'Recordatorio de sesión', texto: 'Mañana tienes 6 sesiones desde las 08:00.', hace: 'Ayer, 09:00', leida: true },
];


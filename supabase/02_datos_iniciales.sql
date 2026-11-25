-- =====================================================================================
-- FisioKids · Supabase · PASO 2: datos iniciales (los mismos de semilla.js)
-- Ejecútalo DESPUÉS de 01_esquema.sql, también en SQL Editor.
-- Las contraseñas NO van aquí: se crean en Authentication > Users (ver GUIA).
-- =====================================================================================

insert into public.usuarios (id, nombres, apellidos, correo, rol, especialidad, activo) overriding system value values
  (1, 'Andrea', 'Mendoza', 'admin@fisiokids.bo', 'admin',       'Administración',          1),
  (2, 'Carmen', 'Ruiz',    'carmen@fisiokids.bo', 'profesional', 'Fisioterapia pediátrica', 1),
  (3, 'Pablo',  'Mora',    'pablo@fisiokids.bo',  'profesional', 'Terapia motriz',          1),
  (4, 'Laura',  'Gómez',   'laura@fisiokids.bo',  'profesional', 'Estimulación temprana',   1),
  (5, 'José',   'Medina',  'jose@fisiokids.bo',   'profesional', 'Terapia respiratoria',    0)
on conflict (id) do nothing;

insert into public.tipos_discapacidad (nombre) values
  ('Parálisis cerebral'), ('Síndrome de Down'), ('TEA'), ('Retraso motor'),
  ('Hipotonía'), ('Trastorno de coordinación'), ('Otro')
on conflict do nothing;

insert into public.salas (id, nombre, capacidad, activo) overriding system value values
  (1, 'Sala Motriz', 4, 1), (2, 'Sala Sensorial', 4, 1), (3, 'Sala Individual', 1, 1), (4, 'Sala Azul', 4, 1)
on conflict (id) do nothing;

insert into public.ninos (id, nombres, apellidos, fecha_nacimiento, tipo_discapacidad, grado, tutor_nombre, tutor_telefono, observaciones, activo) overriding system value values
  (1, 'Sofía',     'Valdez', '2019-03-14', 'Parálisis cerebral',        'Moderado', 'Marta Valdez', '70123456', 'Responde bien a juegos con pelota.', 1),
  (2, 'Mateo',     'Torres', '2020-07-02', 'Síndrome de Down',          'Leve',     'Luis Torres',  '71234567', '', 1),
  (3, 'Lucía',     'Castro', '2018-11-21', 'TEA',                       'Grave',    'Rosa Castro',  '72345678', 'Prefiere actividades con música.', 1),
  (4, 'Diego',     'Núñez',  '2021-01-09', 'Retraso motor',             'Leve',     'Ana Núñez',    '73456789', '', 1),
  (5, 'Valentina', 'Rojas',  '2017-05-30', 'Trastorno de coordinación', 'Leve',     'Jorge Rojas',  '74567890', '', 1),
  (6, 'Tomás',     'Guzmán', '2019-09-18', 'Retraso motor',             'Leve',     'Elena Guzmán', '75678901', 'Dado de baja por mudanza.', 0)
on conflict (id) do nothing;

insert into public.bloques (id, dia_semana, hora_inicio, hora_fin, actividad, profesional_id, sala_id) overriding system value values
  (1, 1, '08:00', '09:00', 'Estimulación temprana', 4, 2),
  (2, 1, '09:00', '10:00', 'Terapia motriz',        2, 1),
  (3, 2, '10:00', '11:00', 'Terapia individual',    2, 3),
  (4, 3, '08:00', '09:00', 'Terapia motriz',        2, 1),
  (5, 4, '11:00', '12:00', 'Estimulación temprana', 3, 2),
  (6, 5, '09:00', '10:00', 'Terapia motriz',        2, 1),
  (7, 4, '09:00', '10:00', 'Terapia motriz',        3, 1),
  (8, 1, '14:00', '15:00', 'Terapia motriz',        3, 1),
  (9, 3, '15:00', '16:00', 'Estimulación temprana', 4, 2),
  (10,5, '16:00', '17:00', 'Terapia individual',    2, 3)
on conflict (id) do nothing;

insert into public.asignaciones (bloque_id, nino_id) values
  (1,4),(1,2),
  (2,1),(2,2),(2,3),
  (3,3),
  (4,1),(4,5),
  (5,4),(5,2),
  (6,1),(6,2),(6,3),(6,5),
  (7,3),
  (8,5),(8,4),
  (9,2),(9,3),
  (10,1)
on conflict do nothing;

-- Historial de las últimas 10 semanas (solo fechas anteriores a hoy; cada bloque de esos días queda cerrado)
do $$
declare
  w int; b record; f date;
  lunes date := current_date - (extract(isodow from current_date)::int - 1);
begin
  for w in 0..10 loop
    for b in select id, dia_semana, actividad from public.bloques loop
      f := lunes - 7 * w + (b.dia_semana - 1);
      continue when f >= current_date;
      insert into public.asistencias (bloque_id, nino_id, fecha, estado, actividades)
      select a.bloque_id, a.nino_id, to_char(f, 'YYYY-MM-DD'),
             case when (a.nino_id + b.id + w) % 7 = 0 then 'Falta' else 'Presente' end,
             case when (a.nino_id + b.id + w) % 7 = 0 then null
                  else case b.actividad
                         when 'Terapia motriz'        then 'Equilibrio y marcha con obstáculos'
                         when 'Estimulación temprana' then 'Estimulación del tono muscular'
                         when 'Terapia individual'    then 'Ejercicios de coordinación'
                         else 'Ejercicios terapéuticos' end end
      from public.asignaciones a where a.bloque_id = b.id
      on conflict do nothing;
      insert into public.cierres_bloque (bloque_id, fecha) values (b.id, to_char(f, 'YYYY-MM-DD')) on conflict do nothing;
    end loop;
  end loop;
end $$;

-- Como insertamos ids a mano, hay que alinear los contadores para que los nuevos registros no choquen
select setval(pg_get_serial_sequence('public.usuarios',  'id'), (select max(id) from public.usuarios));
select setval(pg_get_serial_sequence('public.salas',     'id'), (select max(id) from public.salas));
select setval(pg_get_serial_sequence('public.ninos',     'id'), (select max(id) from public.ninos));
select setval(pg_get_serial_sequence('public.bloques',   'id'), (select max(id) from public.bloques));

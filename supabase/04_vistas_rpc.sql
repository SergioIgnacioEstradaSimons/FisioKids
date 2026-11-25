-- =====================================================================================
-- FisioKids · Supabase · PASO 4: vistas y funciones (RPC) que reemplazan al SQL de datos.js
-- Ejecútalo DESPUÉS de 03_seguridad.sql. Todas las vistas usan security_invoker para que
-- las políticas RLS de las tablas base se apliquen al usuario de la app. Las funciones de
-- escritura usan security invoker por el mismo motivo: el admin escribe por su política,
-- el profesional solo puede escribir asistencias de sus propios bloques.
-- Los nombres de columnas son los mismos que devolvía SQLite para no tocar las pantallas.
-- =====================================================================================

-- ---------- VISTAS DE LECTURA ----------
create or replace view public.v_usuarios with (security_invoker = true) as
select u.id, u.auth_id, u.nombres, u.apellidos,
       u.nombres || ' ' || u.apellidos as nombre,
       u.correo, u.rol, u.especialidad, u.activo, u.foto
from public.usuarios u;

create or replace view public.v_salas with (security_invoker = true) as
select s.id, s.nombre, s.capacidad, s.activo,
       (select count(*)::integer from public.bloques b where b.sala_id = s.id) as bloques_semana
from public.salas s;

create or replace view public.v_ninos with (security_invoker = true) as
select n.*, n.nombres || ' ' || n.apellidos as nombre
from public.ninos n;

create or replace view public.v_tipos with (security_invoker = true) as
select t.id, t.nombre, t.activo,
       (select count(*)::integer from public.ninos n where n.tipo_discapacidad = t.nombre) as usados
from public.tipos_discapacidad t;

create or replace view public.v_bloques with (security_invoker = true) as
select b.id, b.dia_semana, b.hora_inicio, b.hora_fin, b.actividad,
       b.profesional_id, b.sala_id,
       s.nombre as sala_nombre, s.capacidad,
       u.nombres || ' ' || u.apellidos as profesional_nombre,
       (select count(*)::integer from public.asignaciones a where a.bloque_id = b.id) as cupo
from public.bloques b
join public.salas s on s.id = b.sala_id
join public.usuarios u on u.id = b.profesional_id;

create or replace view public.v_asignaciones_ninos with (security_invoker = true) as
select a.id as asignacion_id, a.bloque_id, a.nino_id,
       n.nombres, n.apellidos, n.nombres || ' ' || n.apellidos as nombre,
       n.fecha_nacimiento, n.tipo_discapacidad, n.grado, n.tutor_nombre,
       n.tutor_telefono, n.observaciones, n.activo, n.id as id
from public.asignaciones a
join public.ninos n on n.id = a.nino_id;

create or replace view public.v_bloques_de_nino with (security_invoker = true) as
select a.nino_id, b.id, b.dia_semana, b.hora_inicio, b.hora_fin,
       b.actividad, b.profesional_id, b.sala_id
from public.asignaciones a
join public.bloques b on b.id = a.bloque_id;

create or replace view public.v_horarios_por_nino with (security_invoker = true) as
select a.nino_id, b.dia_semana, b.hora_inicio
from public.asignaciones a
join public.bloques b on b.id = a.bloque_id;

create or replace view public.v_historial with (security_invoker = true) as
select a.fecha, a.estado, a.actividades,
       n.nombres || ' ' || n.apellidos as nino_nombre,
       b.actividad, b.hora_inicio
from public.asistencias a
join public.ninos n on n.id = a.nino_id
join public.bloques b on b.id = a.bloque_id;

create or replace view public.v_historial_atencion with (security_invoker = true) as
select a.nino_id, a.fecha, a.estado, a.actividades, a.observaciones,
       b.actividad, b.hora_inicio,
       u.nombres || ' ' || u.apellidos as profesional_nombre
from public.asistencias a
join public.bloques b on b.id = a.bloque_id
join public.usuarios u on u.id = b.profesional_id;

grant select on
  public.v_usuarios, public.v_salas, public.v_ninos, public.v_tipos, public.v_bloques,
  public.v_asignaciones_ninos, public.v_bloques_de_nino, public.v_horarios_por_nino,
  public.v_historial, public.v_historial_atencion
to authenticated;

-- ---------- FUNCIONES DE LECTURA (RPC) ----------
create or replace function public.fn_profesionales(p_dia integer)
returns table (id integer, auth_id uuid, nombres text, apellidos text, nombre text,
               correo text, rol text, especialidad text, activo integer, foto text, bloques_hoy integer)
language sql stable security invoker set search_path = public as $$
  select u.id, u.auth_id, u.nombres, u.apellidos,
         u.nombres || ' ' || u.apellidos, u.correo, u.rol, u.especialidad, u.activo, u.foto,
         (select count(*)::integer from public.bloques b
          where b.profesional_id = u.id and b.dia_semana = p_dia) as bloques_hoy
  from public.usuarios u
  where u.rol = 'profesional'
  order by u.activo desc, u.apellidos, u.nombres;
$$;

create or replace function public.fn_bloques_estado(p_dia integer, p_fecha text, p_profesional integer default null)
returns table (id integer, dia_semana integer, hora_inicio text, hora_fin text, actividad text,
               profesional_id integer, sala_id integer, sala_nombre text, capacidad integer,
               profesional_nombre text, cupo integer, registrados integer, cerrado integer)
language sql stable security invoker set search_path = public as $$
  select v.id, v.dia_semana, v.hora_inicio, v.hora_fin, v.actividad, v.profesional_id, v.sala_id,
         v.sala_nombre, v.capacidad, v.profesional_nombre, v.cupo,
         (select count(*)::integer from public.asistencias x
          where x.bloque_id = v.id and x.fecha = p_fecha) as registrados,
         (select count(*)::integer from public.cierres_bloque c
          where c.bloque_id = v.id and c.fecha = p_fecha) as cerrado
  from public.v_bloques v
  where v.dia_semana = p_dia
    and (p_profesional is null or v.profesional_id = p_profesional)
  order by v.hora_inicio;
$$;

create or replace function public.fn_ninos_con_asistencia(p_bloque integer, p_fecha text)
returns table (id integer, nombre text, estado text, actividades text)
language sql stable security invoker set search_path = public as $$
  select n.id, n.nombres || ' ' || n.apellidos, a.estado, a.actividades
  from public.asignaciones x
  join public.ninos n on n.id = x.nino_id
  left join public.asistencias a
    on a.bloque_id = x.bloque_id and a.nino_id = n.id and a.fecha = p_fecha
  where x.bloque_id = p_bloque
  order by n.apellidos, n.nombres;
$$;

create or replace function public.fn_resumen_dia(p_dia integer, p_fecha text)
returns table (programadas integer, registradas integer, presentes integer, faltas integer)
language sql stable security invoker set search_path = public as $$
  select
    (select count(*)::integer from public.asignaciones a
      join public.bloques b on b.id = a.bloque_id where b.dia_semana = p_dia) as programadas,
    (select count(*)::integer from public.asistencias a
      join public.bloques b on b.id = a.bloque_id
      where a.fecha = p_fecha and b.dia_semana = p_dia) as registradas,
    (select count(*)::integer from public.asistencias a
      join public.bloques b on b.id = a.bloque_id
      where a.fecha = p_fecha and b.dia_semana = p_dia and a.estado = 'Presente') as presentes,
    (select count(*)::integer from public.asistencias a
      join public.bloques b on b.id = a.bloque_id
      where a.fecha = p_fecha and b.dia_semana = p_dia and a.estado = 'Falta') as faltas;
$$;

create or replace function public.fn_contar_totales()
returns table (ninos integer, activos integer, profesionales integer, salas integer)
language sql stable security invoker set search_path = public as $$
  select
    (select count(*)::integer from public.ninos),
    (select count(*)::integer from public.ninos where activo = 1),
    (select count(*)::integer from public.usuarios where rol = 'profesional' and activo = 1),
    (select count(*)::integer from public.salas where activo = 1);
$$;

create or replace function public.fn_resumen_periodo(p_desde text, p_hasta text)
returns table (total integer, presentes integer, faltas integer, suspendidas integer,
               porcentaje integer, por_nino jsonb, por_profesional jsonb)
language sql stable security invoker set search_path = public as $$
  with estados as (
    select estado, count(*)::integer as n
    from public.asistencias where fecha between p_desde and p_hasta group by estado
  ), totales as (
    select coalesce(sum(case when estado = 'Presente' then n else 0 end), 0)::integer as presentes,
           coalesce(sum(case when estado = 'Falta' then n else 0 end), 0)::integer as faltas
    from estados
  ), por_nino as (
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre, 'total', total, 'presentes', presentes)
                              order by apellidos, nombres), '[]'::jsonb) as datos
    from (
      select n.id, n.nombres || ' ' || n.apellidos as nombre, count(*)::integer as total,
             sum(case when a.estado = 'Presente' then 1 else 0 end)::integer as presentes,
             n.apellidos, n.nombres
      from public.asistencias a join public.ninos n on n.id = a.nino_id
      where a.fecha between p_desde and p_hasta
      group by n.id, n.nombres, n.apellidos
    ) x
  ), por_profesional as (
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre, 'sesiones', sesiones)
                              order by sesiones desc), '[]'::jsonb) as datos
    from (
      select u.id, u.nombres || ' ' || u.apellidos as nombre, count(*)::integer as sesiones
      from public.asistencias a
      join public.bloques b on b.id = a.bloque_id
      join public.usuarios u on u.id = b.profesional_id
      where a.fecha between p_desde and p_hasta
      group by u.id, u.nombres, u.apellidos
    ) y
  ), suspendidas as (
    select count(*)::integer as n from public.suspensiones where fecha between p_desde and p_hasta
  )
  select (t.presentes + t.faltas) as total, t.presentes, t.faltas, s.n as suspendidas,
         case when t.presentes + t.faltas = 0 then 0
              else round(100.0 * t.presentes / (t.presentes + t.faltas))::integer end as porcentaje,
         pn.datos as por_nino, pp.datos as por_profesional
  from totales t cross join suspendidas s cross join por_nino pn cross join por_profesional pp;
$$;

create or replace function public.fn_contar_sesiones_mes(p_desde text, p_hasta text)
returns integer
language sql stable security invoker set search_path = public as $$
  select count(*)::integer from public.asistencias where fecha between p_desde and p_hasta;
$$;

create or replace function public.fn_resumen_historial(p_desde text, p_hasta text, p_profesional integer default null)
returns table (generadas integer, presentes integer, faltas integer, suspendidas integer,
               porcentaje integer, barras integer[], recientes jsonb)
language sql stable security invoker set search_path = public as $$
  with base as (
    select a.fecha, a.estado, b.profesional_id, b.hora_inicio
    from public.asistencias a join public.bloques b on b.id = a.bloque_id
    where a.fecha between p_desde and p_hasta
  ), filtrado as (
    select * from base where p_profesional is null or profesional_id = p_profesional
  ), estados as (
    select estado, count(*)::integer as n from filtrado group by estado
  ), conteos as (
    select coalesce(sum(case when estado = 'Presente' then n else 0 end), 0)::integer as presentes,
           coalesce(sum(case when estado = 'Falta' then n else 0 end), 0)::integer as faltas
    from estados
  ), por_dia as (
    select extract(isodow from to_date(fecha, 'YYYY-MM-DD'))::integer as dia, count(*)::integer as n
    from filtrado group by dia
  ), barras as (
    select array[
      coalesce((select n from por_dia where dia = 1), 0),
      coalesce((select n from por_dia where dia = 2), 0),
      coalesce((select n from por_dia where dia = 3), 0),
      coalesce((select n from por_dia where dia = 4), 0),
      coalesce((select n from por_dia where dia = 5), 0),
      coalesce((select n from por_dia where dia = 6), 0),
      coalesce((select n from por_dia where dia = 7), 0)
    ] as vals
  ), recientes as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'fecha', fecha, 'estado', estado, 'nino_nombre', nino_nombre,
      'sala_nombre', sala_nombre, 'profesional_nombre', profesional_nombre
    ) order by fecha desc, hora_inicio desc), '[]'::jsonb) as datos
    from (
      select a.fecha, a.estado, n.nombres || ' ' || n.apellidos as nino_nombre,
             s.nombre as sala_nombre, u.nombres || ' ' || u.apellidos as profesional_nombre,
             b.hora_inicio
      from public.asistencias a
      join public.bloques b on b.id = a.bloque_id
      join public.ninos n on n.id = a.nino_id
      join public.salas s on s.id = b.sala_id
      join public.usuarios u on u.id = b.profesional_id
      where a.fecha between p_desde and p_hasta
        and (p_profesional is null or b.profesional_id = p_profesional)
      order by a.fecha desc, b.hora_inicio desc
      limit 8
    ) r
  ), suspendidas as (
    select count(*)::integer as n from public.suspensiones where fecha between p_desde and p_hasta
  )
  select (c.presentes + c.faltas) as generadas, c.presentes, c.faltas, s.n as suspendidas,
         case when c.presentes + c.faltas = 0 then 0
              else round(100.0 * c.presentes / (c.presentes + c.faltas))::integer end as porcentaje,
         b.vals as barras, r.datos as recientes
  from conteos c cross join suspendidas s cross join barras b cross join recientes r;
$$;

create or replace function public.fn_resumen_mes(p_desde text, p_hasta text)
returns table (por_fecha jsonb, suspendidas jsonb, bloques_por_dia jsonb)
language sql stable security invoker set search_path = public as $$
  select
    coalesce((
      select jsonb_object_agg(fecha, jsonb_build_object('presentes', presentes, 'faltas', faltas))
      from (
        select fecha,
               sum(case when estado = 'Presente' then 1 else 0 end)::integer as presentes,
               sum(case when estado = 'Falta' then 1 else 0 end)::integer as faltas
        from public.asistencias
        where fecha between p_desde and p_hasta
        group by fecha
      ) x
    ), '{}'::jsonb) as por_fecha,
    coalesce((
      select jsonb_object_agg(fecha, motivo) from public.suspensiones
      where fecha between p_desde and p_hasta
    ), '{}'::jsonb) as suspendidas,
    coalesce((
      select jsonb_object_agg(dia_semana::text, n)
      from (select dia_semana, count(*)::integer as n from public.bloques group by dia_semana) y
    ), '{}'::jsonb) as bloques_por_dia;
$$;

create or replace function public.fn_avisos_conteos(p_fecha text)
returns table (bloque_id integer, estado text, n integer)
language sql stable security invoker set search_path = public as $$
  select bloque_id, estado, count(*)::integer as n
  from public.asistencias where fecha = p_fecha group by bloque_id, estado;
$$;

create or replace function public.fn_bloque_anterior_pendiente(p_bloque integer, p_fecha text)
returns table (id integer, dia_semana integer, hora_inicio text, hora_fin text,
               actividad text, profesional_id integer, sala_id integer)
language sql stable security invoker set search_path = public as $$
  select b2.id, b2.dia_semana, b2.hora_inicio, b2.hora_fin, b2.actividad,
         b2.profesional_id, b2.sala_id
  from public.bloques b
  join public.bloques b2
    on b2.profesional_id = b.profesional_id
   and b2.dia_semana = b.dia_semana
   and b2.hora_inicio < b.hora_inicio
  where b.id = p_bloque
    and not exists (
      select 1 from public.cierres_bloque c
      where c.bloque_id = b2.id and c.fecha = p_fecha
    )
  order by b2.hora_inicio
  limit 1;
$$;

create or replace function public.fn_ninos_de_profesional(p_profesional integer)
returns table (id integer, nombres text, apellidos text, nombre text, fecha_nacimiento text,
               tipo_discapacidad text, grado text, tutor_nombre text, tutor_telefono text,
               observaciones text, activo integer, sesiones integer)
language sql stable security invoker set search_path = public as $$
  select n.id, n.nombres, n.apellidos, n.nombres || ' ' || n.apellidos,
         n.fecha_nacimiento, n.tipo_discapacidad, n.grado, n.tutor_nombre,
         n.tutor_telefono, n.observaciones, n.activo,
         (select count(*)::integer from public.asistencias a
          join public.bloques b2 on b2.id = a.bloque_id
          where a.nino_id = n.id and b2.profesional_id = p_profesional) as sesiones
  from public.ninos n
  where n.activo = 1
    and exists (
      select 1 from public.asignaciones x
      join public.bloques b on b.id = x.bloque_id
      where x.nino_id = n.id and b.profesional_id = p_profesional
    )
  order by n.apellidos, n.nombres;
$$;

-- ---------- FUNCIONES DE ESCRITURA (RPC, todo-o-nada) ----------
create or replace function public.fn_crear_asignacion(
  p_nino_ids integer[], p_profesional_id integer, p_sala_id integer,
  p_dias integer[], p_hora text, p_actividad text
)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_max integer;
  v_sala record;
  v_bloque record;
  v_cupo integer;
  v_ocupados integer;
  v_dia integer;
  v_nino integer;
  v_nombre_dia text;
begin
  if p_nino_ids is null or cardinality(p_nino_ids) = 0 then
    raise exception 'Selecciona al menos un niño.';
  end if;
  if p_dias is null or cardinality(p_dias) = 0 then
    raise exception 'Selecciona al menos un día.';
  end if;

  select capacidad into v_sala from public.salas where id = p_sala_id;
  v_max := least(4, v_sala.capacidad);

  foreach v_dia in array p_dias loop
    v_nombre_dia := case v_dia
      when 1 then 'lunes' when 2 then 'martes' when 3 then 'miércoles'
      when 4 then 'jueves' when 5 then 'viernes' else 'día ' || v_dia end;

    select * into v_bloque from public.bloques
    where dia_semana = v_dia and hora_inicio = p_hora and sala_id = p_sala_id;

    if found then
      if v_bloque.profesional_id <> p_profesional_id then
        raise exception '%: la sala ya está ocupada por otro profesional en ese horario.', v_nombre_dia;
      end if;
    else
      select count(*) into v_ocupados from public.bloques
      where dia_semana = v_dia and hora_inicio = p_hora and profesional_id = p_profesional_id;
      if v_ocupados > 0 then
        raise exception '%: el profesional ya atiende otra sala en ese horario.', v_nombre_dia;
      end if;
      insert into public.bloques (dia_semana, hora_inicio, hora_fin, actividad, profesional_id, sala_id)
      values (v_dia, p_hora,
              to_char(to_timestamp(p_hora, 'HH24:MI') + interval '1 hour', 'HH24:MI'),
              p_actividad, p_profesional_id, p_sala_id)
      returning * into v_bloque;
    end if;

    select count(*) into v_cupo from public.asignaciones where bloque_id = v_bloque.id;
    if v_cupo + cardinality(p_nino_ids) > v_max then
      raise exception '%: el bloque admite máximo % niños y ya tiene %. Solo puedes agregar % más.',
        v_nombre_dia, v_max, v_cupo, greatest(v_max - v_cupo, 0);
    end if;

    foreach v_nino in array p_nino_ids loop
      if exists (select 1 from public.asignaciones where bloque_id = v_bloque.id and nino_id = v_nino) then
        raise exception '%: uno de los niños ya está asignado a ese bloque.', v_nombre_dia;
      end if;
      insert into public.asignaciones (bloque_id, nino_id) values (v_bloque.id, v_nino);
    end loop;
  end loop;
end $$;

create or replace function public.fn_guardar_asistencia(p_bloque integer, p_fecha text, p_registros jsonb)
returns void
language plpgsql security invoker set search_path = public as $$
declare r jsonb;
begin
  for r in select * from jsonb_array_elements(p_registros) loop
    insert into public.asistencias (bloque_id, nino_id, fecha, estado, actividades)
    values (p_bloque, (r ->> 'nino_id')::integer, p_fecha, r ->> 'estado', nullif(r ->> 'actividades', ''))
    on conflict (bloque_id, nino_id, fecha) do update
      set estado = excluded.estado,
          actividades = coalesce(excluded.actividades, public.asistencias.actividades);
  end loop;
end $$;

create or replace function public.fn_marcar_pendientes_falta(p_bloque integer, p_fecha text)
returns void
language sql security invoker set search_path = public as $$
  insert into public.asistencias (bloque_id, nino_id, fecha, estado)
  select a.bloque_id, a.nino_id, p_fecha, 'Falta'
  from public.asignaciones a where a.bloque_id = p_bloque
  on conflict do nothing;
$$;

create or replace function public.fn_cerrar_bloque(p_bloque integer, p_fecha text, p_usuario integer)
returns void
language plpgsql security invoker set search_path = public as $$
declare v_faltan integer;
begin
  select count(*) into v_faltan
  from public.asignaciones a
  where a.bloque_id = p_bloque
    and not exists (
      select 1 from public.asistencias x
      where x.bloque_id = a.bloque_id and x.nino_id = a.nino_id and x.fecha = p_fecha
    );
  if v_faltan > 0 then
    raise exception 'Hay % niño(s) sin asistencia. Márcalos o regístralos como falta.', v_faltan;
  end if;
  insert into public.cierres_bloque (bloque_id, fecha, cerrado_por)
  values (p_bloque, p_fecha, p_usuario)
  on conflict do nothing;
end $$;

create or replace function public.fn_renombrar_tipo(p_id integer, p_nombre_nuevo text)
returns void
language plpgsql security invoker set search_path = public as $$
declare v_anterior text;
begin
  select nombre into v_anterior from public.tipos_discapacidad where id = p_id;
  update public.tipos_discapacidad set nombre = p_nombre_nuevo where id = p_id;
  update public.ninos set tipo_discapacidad = p_nombre_nuevo where tipo_discapacidad = v_anterior;
end $$;

create or replace function public.fn_eliminar_tipo(p_id integer)
returns void
language plpgsql security invoker set search_path = public as $$
declare v_nombre text;
begin
  select nombre into v_nombre from public.tipos_discapacidad where id = p_id;
  if v_nombre is null then return; end if;
  if exists (select 1 from public.ninos where tipo_discapacidad = v_nombre) then return; end if;
  delete from public.tipos_discapacidad where id = p_id;
end $$;

create or replace function public.fn_agregar_suspension(p_fecha text, p_motivo text, p_origen text default 'manual')
returns void
language sql security invoker set search_path = public as $$
  insert into public.suspensiones (fecha, motivo, origen)
  values (p_fecha, p_motivo, p_origen)
  on conflict (fecha) do update set motivo = excluded.motivo;
$$;

create or replace function public.fn_reajustar_secuencias()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform setval(pg_get_serial_sequence('public.usuarios', 'id'), coalesce(max(id), 0) + 1, false) from public.usuarios;
  perform setval(pg_get_serial_sequence('public.ninos', 'id'), coalesce(max(id), 0) + 1, false) from public.ninos;
  perform setval(pg_get_serial_sequence('public.salas', 'id'), coalesce(max(id), 0) + 1, false) from public.salas;
  perform setval(pg_get_serial_sequence('public.bloques', 'id'), coalesce(max(id), 0) + 1, false) from public.bloques;
  perform setval(pg_get_serial_sequence('public.asignaciones', 'id'), coalesce(max(id), 0) + 1, false) from public.asignaciones;
  perform setval(pg_get_serial_sequence('public.asistencias', 'id'), coalesce(max(id), 0) + 1, false) from public.asistencias;
  perform setval(pg_get_serial_sequence('public.cierres_bloque', 'id'), coalesce(max(id), 0) + 1, false) from public.cierres_bloque;
  perform setval(pg_get_serial_sequence('public.tipos_discapacidad', 'id'), coalesce(max(id), 0) + 1, false) from public.tipos_discapacidad;
  perform setval(pg_get_serial_sequence('public.suspensiones', 'id'), coalesce(max(id), 0) + 1, false) from public.suspensiones;
end $$;

grant execute on all functions in schema public to authenticated;
grant execute on function public.fn_reajustar_secuencias() to service_role;
